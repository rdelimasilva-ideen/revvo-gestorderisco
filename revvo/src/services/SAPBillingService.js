import { apiService } from './api.js';

export const SAPBillingService = {
  async getMonthlyBillingData(customerId = null, customers = []) {
    try {
      if (customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer?.company_code) {
          return await this.getCustomerBillingData(customer.company_code);
        }
      } else if (customers.length > 0) {
        return await this.getAllCustomersBillingData(customers);
      }

      return this.getEmptyBillingData();
    } catch (error) {
      return this.getEmptyBillingData();
    }
  },

  async getCustomerBillingData(customerCode) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 13);

      const formatSAPDate = (date) => {
        return date.getFullYear().toString() +
               (date.getMonth() + 1).toString().padStart(2, '0') +
               date.getDate().toString().padStart(2, '0');
      };

      const response = await apiService.sapRequest('ZBAPI_WEBINVOICE_GETLIST2', {
        COMPANYCODE: "1000",
        PARTNER_NUMBER: "0000100003"
      });

      if (response?.error) {
        return this.getEmptyBillingData();
      }

      const invoicesData = response?.['ZBAPI_WEBINVOICE_GETLIST2.Response']?.T_INVOICE;
      return this.processBillingData(invoicesData);
    } catch (error) {
      return this.getEmptyBillingData();
    }
  },

  async getAllCustomersBillingData(customers) {
    const allBillingData = [];

    for (const customer of customers) {
      if (customer.company_code) {
        try {
          const billingData = await this.getCustomerBillingData(customer.company_code);
          allBillingData.push(billingData);
        } catch (error) {
          allBillingData.push(this.getEmptyBillingData());
        }
      }
    }

    return this.aggregateBillingData(allBillingData);
  },

  processBillingData(invoicesData) {
    const endDate = new Date();
    const months = [];

    const getMonthKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };

    const getMonthLabel = (date) => {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                         'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return monthNames[date.getMonth()];
    };

    for (let i = 12; i >= 0; i--) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);

      months.push({
        date: monthDate,
        key: getMonthKey(monthDate),
        label: getMonthLabel(monthDate),
        value: 0
      });
    }

    if (invoicesData?.item) {
      const invoices = Array.isArray(invoicesData.item) ?
        invoicesData.item : [invoicesData.item];

      invoices.forEach(invoice => {
        const billDate = this.parseDate(invoice.BILL_DATE);

        if (billDate) {
          const invoiceMonth = getMonthKey(billDate);
          const monthData = months.find(m => m.key === invoiceMonth);

          if (monthData) {
            const value = parseFloat(invoice.NET_VALUE || 0);
            monthData.value += value;
          }
        }
      });
    }

    return months.map(({ date, label, value }) => ({
      month: label,
      value,
      date
    }));
  },

  aggregateBillingData(allBillingData) {
    if (allBillingData.length === 0) {
      return this.getEmptyBillingData();
    }

    const monthsMap = new Map();

    allBillingData.forEach(customerData => {
      customerData.forEach(monthData => {
        const key = `${monthData.date.getFullYear()}-${monthData.month}`;

        if (!monthsMap.has(key)) {
          monthsMap.set(key, {
            month: monthData.month,
            date: monthData.date,
            value: 0
          });
        }

        const aggregated = monthsMap.get(key);
        aggregated.value += monthData.value || 0;
      });
    });

    const result = Array.from(monthsMap.values())
      .sort((a, b) => a.date - b.date);

    return result.length > 0 ? result : this.getEmptyBillingData();
  },

  calculateBillingMetrics(billingData) {
    if (!billingData || billingData.length < 6) {
      return {
        currentAverage: 0,
        previousAverage: 0,
        variation: 0,
        variationPercentage: 0
      };
    }

    const last3Months = billingData.slice(-3);
    const previous3Months = billingData.slice(-4, -1);

    const currentAverage = last3Months.reduce((sum, item) => sum + item.value, 0) / 3;
    const previousAverage = previous3Months.reduce((sum, item) => sum + item.value, 0) / 3;

    let variationPercentage = 0;
    if (previousAverage > 0) {
      variationPercentage = (1 - (currentAverage / previousAverage)) * 100;
    }

    const variation = currentAverage - previousAverage;

    return {
      currentAverage,
      previousAverage,
      variation,
      variationPercentage: -variationPercentage
    };
  },

  async getCreditLimitOccupation(customerId, billingData, customers = []) {
    try {
      if (!customerId || !customers.length) {
        return billingData.map(item => ({ ...item, occupation: 0 }));
      }

      const customer = customers.find(c => c.id === customerId);
      if (!customer?.company_code) {
        return billingData.map(item => ({ ...item, occupation: 0 }));
      }

      const creditLimitData = await this.getCreditLimitFromSAP(customer.company_code);
      const creditLimitValue = creditLimitData || 0;

      if (creditLimitValue === 0) {
        return billingData.map(item => ({ ...item, occupation: 0 }));
      }

      return billingData.map(item => ({
        ...item,
        occupation: (item.value / creditLimitValue) * 100
      }));
    } catch (error) {
      return billingData.map(item => ({ ...item, occupation: 0 }));
    }
  },

  async getCreditLimitFromSAP(customerCode) {
    try {
      const response = await apiService.sapRequest('ZUKM_DB_UKMBP_CMS_SGM_READ', {
        I_PARTNER: customerCode.toString().padStart(10, '0'),
        I_SEGMENT: '0000',
        I_DB_READ: ''
      });

      if (response?.error) {
        return 0;
      }

      const creditData = response?.['ZUKM_DB_UKMBP_CMS_SGM_READ.Response']?.ES_BP_CMS_SGM;
      return parseFloat(creditData?.CREDIT_LIMIT || 0);
    } catch (error) {
      return 0;
    }
  },

  parseDate(dateString) {
    if (!dateString || dateString === '0000-00-00' || dateString === '00000000') return null;

    if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }

    if (dateString.includes('-')) {
      return new Date(dateString);
    }

    return null;
  },

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatCompactCurrency(value) {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return this.formatCurrency(value);
  },

  getEmptyBillingData() {
    const endDate = new Date();
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                       'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const result = [];
    for (let i = 12; i >= 0; i--) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      result.push({
        month: monthNames[monthDate.getMonth()],
        value: 0,
        date: monthDate
      });
    }

    return result;
  }
};

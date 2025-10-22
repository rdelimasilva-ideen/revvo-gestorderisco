import { apiService } from './api.js';

export const SAPRiskService = {
  async getCustomerRiskData(customerId, customerCode) {
    if (!customerCode) {
      return this.getEmptyRiskData();
    }

    try {
      const [creditLimitData, openItemsData] = await Promise.allSettled([
        this.getCreditLimitData(customerCode),
        this.getOpenItemsData(customerCode)
      ]);

      const creditLimit = creditLimitData.status === 'fulfilled' ? creditLimitData.value : null;
      const openItems = openItemsData.status === 'fulfilled' ? openItemsData.value : null;

      return this.processRiskData(creditLimit, openItems);
    } catch (error) {
      return this.getEmptyRiskData();
    }
  },

  async getAllCustomersRiskData(customers) {
    if (!customers || customers.length === 0) {
      return this.getEmptyRiskData();
    }

    const allRiskData = [];

    for (const customer of customers) {
      if (customer.company_code) {
        try {
          const riskData = await this.getCustomerRiskData(customer.id, customer.company_code);
          allRiskData.push(riskData);
        } catch (error) {
          allRiskData.push(this.getEmptyRiskData());
        }
      }
    }

    return this.aggregateRiskData(allRiskData);
  },

  aggregateRiskData(riskDataArray) {
    if (riskDataArray.length === 0) {
      return this.getEmptyRiskData();
    }

    const aggregated = {
      creditLimitGranted: 0,
      creditLimitUsed: 0,
      amountToReceive: 0,
      avgPaymentTerm: 0,
      isOverdue: false,
      overdueAmount: 0,
      avgDelayDays: 0,
      maxDelayDays12Months: 0
    };

    let totalPaymentTerms = 0;
    let totalDelayDays = 0;
    let totalOverdueItems = 0;
    let customersWithData = 0;

    riskDataArray.forEach(data => {
      if (data) {
        aggregated.creditLimitGranted += data.creditLimitGranted || 0;
        aggregated.amountToReceive += data.amountToReceive || 0;
        aggregated.overdueAmount += data.overdueAmount || 0;

        if (data.isOverdue) {
          aggregated.isOverdue = true;
        }

        if (data.avgPaymentTerm > 0) {
          totalPaymentTerms += data.avgPaymentTerm;
          customersWithData++;
        }

        if (data.avgDelayDays > 0) {
          totalDelayDays += data.avgDelayDays;
          totalOverdueItems++;
        }

        if (data.maxDelayDays12Months > aggregated.maxDelayDays12Months) {
          aggregated.maxDelayDays12Months = data.maxDelayDays12Months;
        }
      }
    });

    aggregated.avgPaymentTerm = customersWithData > 0 ? Math.round(totalPaymentTerms / customersWithData) : 0;
    aggregated.avgDelayDays = totalOverdueItems > 0 ? Math.round(totalDelayDays / totalOverdueItems) : 0;
    aggregated.creditLimitUsed = aggregated.creditLimitGranted > 0 ?
      Math.round((aggregated.amountToReceive / aggregated.creditLimitGranted) * 100) : 0;

    return aggregated;
  },

  async getCreditLimitData(customerCode) {
    try {
      const response = await apiService.sapRequest('ZUKM_DB_UKMBP_CMS_SGM_READ', {
        I_PARTNER: customerCode.toString().padStart(10, '0'),
        I_SEGMENT: '0000',
        I_DB_READ: ''
      });

      if (response?.error) {
        return null;
      }

      return response?.['ZUKM_DB_UKMBP_CMS_SGM_READ.Response']?.ES_BP_CMS_SGM || null;
    } catch (error) {
      return null;
    }
  },

  async getOpenItemsData(customerCode) {
    try {
      const currentDate = new Date();
      const keyDate = currentDate.getFullYear().toString() +
                     (currentDate.getMonth() + 1).toString().padStart(2, '0') +
                     currentDate.getDate().toString().padStart(2, '0');

      const response = await apiService.sapRequest('ZBAPI_AR_ACC_GETOPENITEMS2', {
        COMPANYCODE: '1000',
        CUSTOMER_LOW: customerCode.toString().padStart(10, '0'),
        CUSTOMER_HIGH: customerCode.toString().padStart(10, '0'),
        KEYDATE: keyDate,
        NOTEDITEMS: 'X'
      });

      if (response?.error) {
        return null;
      }

      return response?.['rfc:ZBAPI_AR_ACC_GETOPENITEMS2.Response'] || null;
    } catch (error) {
      return null;
    }
  },

  processRiskData(creditLimitData, openItemsData) {
    const creditLimitGranted = creditLimitData?.CREDIT_LIMIT ?
      parseFloat(creditLimitData.CREDIT_LIMIT) : 0;

    let amountToReceive = 0;
    let overdueAmount = 0;
    let isOverdue = false;
    let avgDelayDays = 0;
    let maxDelayDays12Months = 0;
    let avgPaymentTerm = 0;
    let totalDelayDays = 0;
    let overdueCount = 0;
    let totalPaymentTerms = 0;
    let paymentTermCount = 0;
    let maxCurrentDelayDays = 0;

    if (openItemsData?.LINEITEMS?.item) {
      const items = Array.isArray(openItemsData.LINEITEMS.item) ?
        openItemsData.LINEITEMS.item : [openItemsData.LINEITEMS.item];

      const currentDate = new Date();
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

      items.forEach(item => {
        const amount = parseFloat(item.LC_AMOUNT_LONG || item.LC_AMOUNT || 0);
        amountToReceive += amount;

        if (item.BLINE_DATE) {
          const dueDate = this.parseDate(item.BLINE_DATE);
          const docDate = item.DOC_DATE ? this.parseDate(item.DOC_DATE) : null;

          if (dueDate && dueDate < currentDate) {
            const delayDays = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
            isOverdue = true;
            overdueAmount += amount;
            totalDelayDays += delayDays;
            overdueCount++;

            maxCurrentDelayDays = Math.max(maxCurrentDelayDays, delayDays);

            if (docDate && docDate >= twelveMonthsAgo) {
              maxDelayDays12Months = Math.max(maxDelayDays12Months, delayDays);
            }
          }

          if (docDate && dueDate) {
            const paymentTerm = Math.floor((dueDate - docDate) / (1000 * 60 * 60 * 24));
            if (paymentTerm > 0) {
              totalPaymentTerms += paymentTerm;
              paymentTermCount++;
            }
          }
        }
      });

      if (overdueCount > 0) {
        avgDelayDays = Math.round(totalDelayDays / overdueCount);
      }

      if (paymentTermCount > 0) {
        avgPaymentTerm = Math.round(totalPaymentTerms / paymentTermCount);
      }
    }

    const creditLimitUsed = creditLimitGranted > 0 ?
      Math.round((amountToReceive / creditLimitGranted) * 100) : 0;

    return {
      creditLimitGranted,
      creditLimitUsed,
      amountToReceive,
      avgPaymentTerm,
      isOverdue,
      overdueAmount,
      avgDelayDays,
      maxDelayDays12Months,
      maxCurrentDelayDays
    };
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

  formatCompactCurrency(value) {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  getEmptyRiskData() {
    return {
      creditLimitGranted: 0,
      creditLimitUsed: 0,
      amountToReceive: 0,
      avgPaymentTerm: 0,
      isOverdue: false,
      overdueAmount: 0,
      avgDelayDays: 0,
      maxDelayDays12Months: 0,
      maxCurrentDelayDays: 0
    };
  }
};

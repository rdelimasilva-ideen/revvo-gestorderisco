import { apiService } from './api.js';

class SAPServiceBase {
  constructor() {
    this.cache = new Map();
    this.requestQueue = new Map();
    this.CACHE_TTL = 5 * 60 * 1000;
  }

  getCacheKey(method, params) {
    return `${method}-${JSON.stringify(params)}`;
  }

  async getCachedOrFetch(cacheKey, fetchFn) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    const promise = fetchFn().then(data => {
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      this.requestQueue.delete(cacheKey);
      return data;
    }).catch(error => {
      this.requestQueue.delete(cacheKey);
      throw error;
    });

    this.requestQueue.set(cacheKey, promise);
    return promise;
  }

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
  }

  formatSAPDate(date) {
    return date.getFullYear().toString() +
           (date.getMonth() + 1).toString().padStart(2, '0') +
           date.getDate().toString().padStart(2, '0');
  }

  padCustomerCode(code) {
    return code.toString().padStart(10, '0');
  }

  generateMonthsStructure(monthsBack = 12) {
    const endDate = new Date();
    const months = [];

    for (let i = monthsBack; i >= 0; i--) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      months.push({
        date: monthDate,
        key: this.getMonthKey(monthDate),
        label: this.getMonthLabel(monthDate),
        value: 0,
        paymentTermDays: [],
        totalAmount: 0,
        orderCount: 0,
        actualPayments: []
      });
    }

    return months;
  }

  getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  getMonthLabel(date) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                       'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return monthNames[date.getMonth()];
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatCompactCurrency(value) {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return this.formatCurrency(value);
  }

  clearCache() {
    this.cache.clear();
    this.requestQueue.clear();
  }
}

export const SAPRiskService = new class extends SAPServiceBase {
  async getCustomerRiskData(customerId, customerCode) {
    if (!customerCode) return this.getEmptyRiskData();

    const cacheKey = this.getCacheKey('risk', customerCode);
    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const [creditLimitData, openItemsData] = await Promise.allSettled([
          this.getCreditLimitData(customerCode),
          this.getOpenItemsData(customerCode)
        ]);

        const creditLimit = creditLimitData.status === 'fulfilled' ? creditLimitData.value : null;
        const openItems = openItemsData.status === 'fulfilled' ? openItemsData.value : null;

        return this.processRiskData(creditLimit, openItems);
      } catch (error) {
        console.error(`Risk processing error for ${customerCode}:`, error);
        return this.getEmptyRiskData();
      }
    });
  }

  async getAllCustomersRiskData(customers) {
    if (!customers?.length) return this.getEmptyRiskData();

    const sampleCustomers = customers
      .filter(customer => customer.company_code)
      .slice(0, 15);

    const promises = sampleCustomers.map(customer =>
      this.getCustomerRiskData(customer.id, customer.company_code)
        .catch(error => {
          console.warn(`Risk error for customer ${customer.company_code}:`, error);
          return this.getEmptyRiskData();
        })
    );

    const allRiskData = await Promise.all(promises);
    const validData = allRiskData.filter(data => data && (
      data.creditLimitGranted > 0 ||
      data.amountToReceive > 0 ||
      data.avgPaymentTerm > 0
    ));

    return this.aggregateRiskData(validData);
  }

  async getCreditLimitData(customerCode) {
    try {
      const response = await apiService.sapRequest('ZUKM_DB_UKMBP_CMS_SGM_READ', {
        // I_PARTNER: this.padCustomerCode(customerCode),
        I_PARTNER: "0001000000",
        I_SEGMENT: '0000',
        I_DB_READ: ''
      });

      if (response?.error) {
        console.warn(`Credit limit API error for ${customerCode}:`, response.error);
        return null;
      }

      const creditData = response?.['ZUKM_DB_UKMBP_CMS_SGM_READ.Response']?.ES_BP_CMS_SGM;
      return creditData || null;
    } catch (error) {
      console.error(`Credit limit error for ${customerCode}:`, error);
      return null;
    }
  }

  async getOpenItemsData(customerCode) {
    try {
      const response = await apiService.sapRequest('ZBAPI_AR_ACC_GETOPENITEMS2', {
        COMPANYCODE: '1000',
        // CUSTOMER_FROM: this.padCustomerCode(customerCode),
        // CUSTOMER_TO: this.padCustomerCode(customerCode),
        CUSTOMER_FROM: "0000000001",
        CUSTOMER_TO: "0000100999",
        KEYDATE: this.formatSAPDate(new Date())
      });

      if (response?.error) {
        console.warn(`Open items API error for ${customerCode}:`, response.error);
        return null;
      }

      const openItemsData = response?.['rfc:ZBAPI_AR_ACC_GETOPENITEMS2.Response'];
      return openItemsData || null;
    } catch (error) {
      console.error(`Open items error for ${customerCode}:`, error);
      return null;
    }
  }

  processRiskData(creditLimitData, openItemsData) {
    const creditLimitGranted = parseFloat(creditLimitData?.CREDIT_LIMIT || 0);

    const metrics = {
      creditLimitGranted,
      creditLimitUsed: 0,
      amountToReceive: 0,
      avgPaymentTerm: 0,
      isOverdue: false,
      overdueAmount: 0,
      avgDelayDays: 0,
      maxDelayDays12Months: 0,
      maxCurrentDelayDays: 0
    };

    if (!openItemsData?.LINEITEMS?.item) return metrics;

    const items = Array.isArray(openItemsData.LINEITEMS.item) ?
      openItemsData.LINEITEMS.item : [openItemsData.LINEITEMS.item];

    const currentDate = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

    let totalDelayDays = 0, overdueCount = 0;
    let totalPaymentTerms = 0, paymentTermCount = 0;

    items.forEach(item => {
      const amount = parseFloat(item.LC_AMOUNT_LONG || item.LC_AMOUNT || 0);
      metrics.amountToReceive += amount;

      const dueDate = this.parseDate(item.BLINE_DATE);
      const docDate = this.parseDate(item.DOC_DATE);

      if (dueDate && dueDate < currentDate) {
        const delayDays = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
        metrics.isOverdue = true;
        metrics.overdueAmount += amount;
        totalDelayDays += delayDays;
        overdueCount++;

        metrics.maxCurrentDelayDays = Math.max(metrics.maxCurrentDelayDays, delayDays);

        if (docDate && docDate >= twelveMonthsAgo) {
          metrics.maxDelayDays12Months = Math.max(metrics.maxDelayDays12Months, delayDays);
        }
      }

      if (docDate && dueDate) {
        const paymentTerm = Math.floor((dueDate - docDate) / (1000 * 60 * 60 * 24));
        if (paymentTerm > 0) {
          totalPaymentTerms += paymentTerm;
          paymentTermCount++;
        }
      }
    });

    metrics.avgDelayDays = overdueCount > 0 ? Math.round(totalDelayDays / overdueCount) : 0;
    metrics.avgPaymentTerm = paymentTermCount > 0 ? Math.round(totalPaymentTerms / paymentTermCount) : 0;
    metrics.creditLimitUsed = creditLimitGranted > 0 ? Math.round((metrics.amountToReceive / creditLimitGranted) * 100) : 0;

    return metrics;
  }

  aggregateRiskData(riskDataArray) {
    if (!riskDataArray.length) return this.getEmptyRiskData();

    const aggregated = this.getEmptyRiskData();
    let totalPaymentTerms = 0, totalDelayDays = 0;
    let totalOverdueItems = 0, customersWithData = 0;

    riskDataArray.forEach(data => {
      if (!data) return;

      aggregated.creditLimitGranted += data.creditLimitGranted || 0;
      aggregated.amountToReceive += data.amountToReceive || 0;
      aggregated.overdueAmount += data.overdueAmount || 0;

      if (data.isOverdue) aggregated.isOverdue = true;

      if (data.avgPaymentTerm > 0) {
        totalPaymentTerms += data.avgPaymentTerm;
        customersWithData++;
      }

      if (data.avgDelayDays > 0) {
        totalDelayDays += data.avgDelayDays;
        totalOverdueItems++;
      }

      aggregated.maxDelayDays12Months = Math.max(aggregated.maxDelayDays12Months, data.maxDelayDays12Months);
      aggregated.maxCurrentDelayDays = Math.max(aggregated.maxCurrentDelayDays, data.maxCurrentDelayDays);
    });

    aggregated.avgPaymentTerm = customersWithData > 0 ? Math.round(totalPaymentTerms / customersWithData) : 0;
    aggregated.avgDelayDays = totalOverdueItems > 0 ? Math.round(totalDelayDays / totalOverdueItems) : 0;
    aggregated.creditLimitUsed = aggregated.creditLimitGranted > 0 ?
      Math.round((aggregated.amountToReceive / aggregated.creditLimitGranted) * 100) : 0;

    return aggregated;
  }

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
}();

export const SAPBillingService = new class extends SAPServiceBase {
  async getMonthlyBillingData(customerId = null, customers = []) {
    const cacheKey = this.getCacheKey('billing', customerId || 'all');
    return this.getCachedOrFetch(cacheKey, async () => {
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
        console.error('Billing data error:', error);
        return this.getEmptyBillingData();
      }
    });
  }

  async getCustomerBillingData(customerCode) {
    try {
      const response = await apiService.sapRequest('ZBAPI_WEBINVOICE_GETLIST2', {
        COMPANYCODE: '1000',
        // PARTNER_NUMBER: this.padCustomerCode(customerCode)
        PARTNER_NUMBER: "0000100003"
      });

      if (response?.error) {
        console.warn(`Billing API Error for ${customerCode}:`, response.error);
        return this.getEmptyBillingData();
      }

      const invoicesData = response?.['ZBAPI_WEBINVOICE_GETLIST2.Response']?.T_INVOICE;
      return this.processBillingData(invoicesData);
    } catch (error) {
      console.error(`Billing Error for ${customerCode}:`, error);
      return this.getEmptyBillingData();
    }
  }

  calculateTotalValue(invoicesItem) {
    const invoices = Array.isArray(invoicesItem) ? invoicesItem : [invoicesItem];
    return invoices.reduce((sum, invoice) => sum + parseFloat(invoice.NET_VALUE || 0), 0);
  }

  async getAllCustomersBillingData(customers) {
    const sampleCustomers = customers
      .filter(customer => customer.company_code)
      .slice(0, 15);

    const promises = sampleCustomers.map(customer =>
      this.getCustomerBillingData(customer.company_code)
        .catch(error => {
          console.warn(`Billing error for customer ${customer.company_code}:`, error);
          return this.getEmptyBillingData();
        })
    );

    const allBillingData = await Promise.all(promises);
    const validData = allBillingData.filter(data =>
      data && Array.isArray(data) && data.some(month => month.value > 0)
    );

    return this.aggregateBillingData(validData);
  }

  processBillingData(invoicesData) {
    const months = this.generateMonthsStructure(12).map(month => ({
      month: month.label,
      value: 0,
      date: month.date,
      occupation: 0
    }));

    if (!invoicesData?.item) {
      return months;
    }

    const invoices = Array.isArray(invoicesData.item) ? invoicesData.item : [invoicesData.item];
    let processedCount = 0;
    let totalProcessed = 0;

    invoices.forEach(invoice => {
      const billDate = this.parseDate(invoice.BILL_DATE);
      if (!billDate) return;

      const monthKey = this.getMonthKey(billDate);
      const monthData = months.find(m => this.getMonthKey(m.date) === monthKey);

      if (monthData) {
        const value = parseFloat(invoice.NET_VALUE || 0);
        monthData.value += value;
        totalProcessed += value;
        processedCount++;
      }
    });

    return months;
  }

  aggregateBillingData(allBillingData) {
    if (!allBillingData.length) {
      return this.getEmptyBillingData();
    }

    const months = this.generateMonthsStructure(12).map(month => ({
      month: month.label,
      value: 0,
      date: month.date,
      occupation: 0
    }));

    let totalAggregated = 0;
    let monthsWithData = 0;

    allBillingData.forEach(customerData => {
      if (!customerData || !Array.isArray(customerData)) return;

      customerData.forEach(monthData => {
        if (!monthData || monthData.value <= 0) return;

        const matchingMonth = months.find(m =>
          m.month === monthData.month &&
          m.date.getFullYear() === monthData.date.getFullYear()
        );

        if (matchingMonth) {
          matchingMonth.value += monthData.value;
          totalAggregated += monthData.value;
          if (monthData.value > 0) monthsWithData++;
        }
      });
    });

    return months;
  }

  calculateBillingMetrics(billingData) {
    if (!billingData || billingData.length < 12) {
      return { currentAverage: 0, previousAverage: 0, variation: 0, variationPercentage: 0 };
    }

    const validBillingData = billingData.filter(month => month.value > 0);
    if (validBillingData.length === 0) {
      return { currentAverage: 0, previousAverage: 0, variation: 0, variationPercentage: 0 };
    }

    const totalLast12Months = billingData.reduce((sum, item) => sum + (item.value || 0), 0);
    const currentAverage = totalLast12Months / 12;

    const last3Months = billingData.slice(-3);
    const previous3Months = billingData.slice(-6, -3);

    const current3MonthsAvg = last3Months.reduce((sum, item) => sum + item.value, 0) / 3;
    const previous3MonthsAvg = previous3Months.reduce((sum, item) => sum + item.value, 0) / 3;

    const variationPercentage = previous3MonthsAvg > 0 ? (1 - (current3MonthsAvg / previous3MonthsAvg)) * 100 : 0;
    const variation = current3MonthsAvg - previous3MonthsAvg;

    return {
      currentAverage,
      previousAverage: previous3MonthsAvg,
      variation,
      variationPercentage: -variationPercentage
    };
  }

  async getCreditLimitOccupation(customerId, billingData, customers = []) {
    if (!customerId || !customers.length || !billingData?.length) {
      return billingData?.map(item => ({ ...item, occupation: 0 })) || [];
    }

    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer?.company_code) {
        return billingData.map(item => ({ ...item, occupation: 0 }));
      }

      const creditLimitValue = await this.getCreditLimitFromSAP(customer.company_code);

      if (creditLimitValue <= 0) {
        return billingData.map(item => ({ ...item, occupation: 0 }));
      }

      return billingData.map(item => {
        if (!item.value || item.value <= 0) {
          return { ...item, occupation: 0 };
        }

        const occupationPercent = (item.value / creditLimitValue) * 100;
        return {
          ...item,
          occupation: Math.min(Math.max(occupationPercent, 0), 100)
        };
      });

    } catch (error) {
      console.error('Credit limit occupation error:', error);
      return billingData.map(item => ({ ...item, occupation: 0 }));
    }
  }

  async getCreditLimitFromSAP(customerCode) {
    try {
      const response = await apiService.sapRequest('ZUKM_DB_UKMBP_CMS_SGM_READ', {
        // I_PARTNER: this.padCustomerCode(customerCode),
        I_PARTNER: "0001000000",
        I_SEGMENT: '0000',
        I_DB_READ: ''
      });

      if (response?.error) {
        console.warn(`Credit limit error for ${customerCode}:`, response.error);
        return 0;
      }

      const creditData = response?.['ZUKM_DB_UKMBP_CMS_SGM_READ.Response']?.ES_BP_CMS_SGM;
      const creditLimit = parseFloat(creditData?.CREDIT_LIMIT || 0);

      return creditLimit;
    } catch (error) {
      console.error(`Credit limit fetch error for ${customerCode}:`, error);
      return 0;
    }
  }

  getEmptyBillingData() {
    return this.generateMonthsStructure(12).map(month => ({
      month: month.label,
      value: 0,
      date: month.date,
      occupation: 0
    }));
  }
}();

export const SAPScoreService = new class extends SAPServiceBase {
  async getPaymentTermAndScore(customerId = null, customers = []) {
    const cacheKey = this.getCacheKey('score', customerId || 'all');
    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        if (customerId) {
          const customer = customers.find(c => c.id === customerId);
          if (customer?.company_code) {
            return await this.getCustomerScoreData(customer.company_code);
          }
        } else if (customers.length > 0) {
          return await this.getAllCustomersScoreData(customers);
        }

        return this.getEmptyScoreData();
      } catch (error) {
        console.error('Score data error:', error);
        return this.getEmptyScoreData();
      }
    });
  }

  async getCustomerScoreData(customerCode) {
    try {
      const [invoicesData, openItemsData] = await Promise.allSettled([
        this.getCustomerInvoices(customerCode),
        this.getCustomerOpenItems(customerCode)
      ]);

      const invoices = invoicesData.status === 'fulfilled' ? invoicesData.value : null;
      const openItems = openItemsData.status === 'fulfilled' ? openItemsData.value : null;

      return this.processScoreData(invoices, openItems);
    } catch (error) {
      console.error(`Score processing error for ${customerCode}:`, error);
      return this.getEmptyScoreData();
    }
  }

  async getAllCustomersScoreData(customers) {
    const sampleCustomers = customers
      .filter(customer => customer.company_code)
      .slice(0, 15);

    const promises = sampleCustomers.map(customer =>
      this.getCustomerScoreData(customer.company_code)
        .catch(error => {
          console.warn(`Score error for customer ${customer.company_code}:`, error);
          return this.getEmptyScoreData();
        })
    );

    const allScoreData = await Promise.all(promises);
    const validData = allScoreData.filter(data =>
      data && Array.isArray(data) && data.some(month => month.paymentTerm > 0 || month.score > 0)
    );

    return this.aggregateScoreData(validData);
  }

  async getCustomerInvoices(customerCode) {
    try {
      const response = await apiService.sapRequest('ZBAPI_WEBINVOICE_GETLIST2', {
        COMPANYCODE: '1000',
        // PARTNER_NUMBER: this.padCustomerCode(customerCode)
        PARTNER_NUMBER: "0000100003"
      });

      if (response?.error) {
        console.warn(`Score API Error for ${customerCode}:`, response.error);
        return null;
      }

      const invoiceData = response?.['ZBAPI_WEBINVOICE_GETLIST2.Response']?.T_INVOICE;
      return invoiceData || null;
    } catch (error) {
      console.error(`Score Invoice Error for ${customerCode}:`, error);
      return null;
    }
  }

  async getCustomerOpenItems(customerCode) {
    try {
      const response = await apiService.sapRequest('ZBAPI_AR_ACC_GETOPENITEMS2', {
        COMPANYCODE: '1000',
        // CUSTOMER_FROM: this.padCustomerCode(customerCode),
        // CUSTOMER_TO: this.padCustomerCode(customerCode),
        CUSTOMER_FROM: "0000000001",
        CUSTOMER_TO: "0000100999",
        KEYDATE: this.formatSAPDate(new Date())
      });

      if (response?.error) {
        console.warn(`Score Open Items API Error for ${customerCode}:`, response.error);
        return null;
      }

      return response?.['rfc:ZBAPI_AR_ACC_GETOPENITEMS2.Response'] || null;
    } catch (error) {
      console.error(`Score Open Items Error for ${customerCode}:`, error);
      return null;
    }
  }

  processScoreData(invoicesData, openItemsData) {
    const months = this.generateMonthsStructure(12);

    this.processInvoicesData(invoicesData, months);
    this.processOpenItemsData(openItemsData, months);

    const processedData = months.map((month, index) => {
      const avgPaymentTerm = this.calculateMovingAverage(months, index);
      const score = this.calculateScore(month, index, months);

      return {
        month: month.label,
        paymentTerm: Math.round(avgPaymentTerm),
        score: Math.round(score),
        date: month.date,
        year: month.date.getFullYear(),
        totalAmount: month.totalAmount,
        orderCount: month.orderCount
      };
    });

    return processedData;
  }

  processInvoicesData(invoicesData, months) {
    if (!invoicesData?.item) return;

    const invoices = Array.isArray(invoicesData.item) ? invoicesData.item : [invoicesData.item];
    let processedCount = 0;

    invoices.forEach(invoice => {
      const billDate = this.parseDate(invoice.BILL_DATE);
      const netDate = this.parseDate(invoice.NET_DATE);

      if (billDate && netDate) {
        const monthKey = this.getMonthKey(billDate);
        const monthData = months.find(m => m.key === monthKey);

        if (monthData) {
          const paymentTerm = Math.ceil((netDate - billDate) / (1000 * 60 * 60 * 24));
          const amount = parseFloat(invoice.NET_VALUE || 0);

          if (paymentTerm > 0 && paymentTerm <= 365) {
            monthData.paymentTermDays.push(paymentTerm);
            monthData.totalAmount += amount;
            monthData.orderCount++;
            processedCount++;
          }
        }
      }
    });
  }

  processOpenItemsData(openItemsData, months) {
    if (!openItemsData?.LINEITEMS?.item) return;

    const items = Array.isArray(openItemsData.LINEITEMS.item) ?
      openItemsData.LINEITEMS.item : [openItemsData.LINEITEMS.item];

    const currentDate = new Date();
    let processedCount = 0;

    items.forEach(item => {
      const docDate = this.parseDate(item.DOC_DATE);
      const dueDate = this.parseDate(item.BLINE_DATE);

      if (docDate && dueDate) {
        const monthKey = this.getMonthKey(docDate);
        const monthData = months.find(m => m.key === monthKey);

        if (monthData) {
          const paymentTerm = Math.ceil((dueDate - docDate) / (1000 * 60 * 60 * 24));

          if (paymentTerm > 0 && paymentTerm <= 365) {
            monthData.paymentTermDays.push(paymentTerm);
            processedCount++;

            if (dueDate < currentDate) {
              const delayDays = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
              monthData.actualPayments.push({
                planned: paymentTerm,
                actual: paymentTerm + delayDays,
                delay: delayDays
              });
            }
          }
        }
      }
    });
  }

  calculateMovingAverage(months, currentIndex) {
    const windowSize = 3;
    const startIndex = Math.max(0, currentIndex - windowSize + 1);
    const endIndex = currentIndex;

    let sum = 0, count = 0;

    for (let i = startIndex; i <= endIndex; i++) {
      const month = months[i];
      if (month.paymentTermDays.length > 0) {
        const avg = month.paymentTermDays.reduce((s, d) => s + d, 0) / month.paymentTermDays.length;
        sum += avg;
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  calculateScore(monthData, monthIndex, allMonths) {
    let baseScore = 750;

    if (monthData.totalAmount > 100000) baseScore += 40;
    else if (monthData.totalAmount > 50000) baseScore += 25;
    else if (monthData.totalAmount > 10000) baseScore += 15;
    else if (monthData.totalAmount > 0) baseScore += 5;

    if (monthData.orderCount > 10) baseScore += 25;
    else if (monthData.orderCount > 5) baseScore += 15;
    else if (monthData.orderCount > 0) baseScore += 10;

    const avgPaymentTerm = monthData.paymentTermDays.length > 0
      ? monthData.paymentTermDays.reduce((sum, days) => sum + days, 0) / monthData.paymentTermDays.length
      : 0;

    if (avgPaymentTerm <= 25) baseScore += 50;
    else if (avgPaymentTerm <= 30) baseScore += 35;
    else if (avgPaymentTerm <= 45) baseScore += 20;
    else if (avgPaymentTerm <= 60) baseScore += 10;
    else if (avgPaymentTerm > 60) baseScore -= 30;

    const avgDelay = monthData.actualPayments.length > 0
      ? monthData.actualPayments.reduce((sum, p) => sum + p.delay, 0) / monthData.actualPayments.length
      : 0;

    if (avgDelay === 0) baseScore += 30;
    else if (avgDelay <= 5) baseScore += 20;
    else if (avgDelay <= 15) baseScore += 10;
    else if (avgDelay <= 30) baseScore -= 10;
    else baseScore -= 30;

    return Math.max(300, Math.min(900, baseScore));
  }

  aggregateScoreData(allScoreData) {
    if (!allScoreData.length) {
      return this.getEmptyScoreData();
    }

    const monthsMap = new Map();
    let hasValidData = false;

    allScoreData.forEach(customerData => {
      if (!customerData || !Array.isArray(customerData)) return;

      customerData.forEach(monthData => {
        if (!monthData || (!monthData.paymentTerm && !monthData.score)) return;

        hasValidData = true;
        const key = `${monthData.year}-${monthData.month}`;

        if (!monthsMap.has(key)) {
          monthsMap.set(key, {
            month: monthData.month,
            year: monthData.year,
            date: monthData.date,
            totalPaymentTerms: 0,
            totalScores: 0,
            customerCount: 0,
            scoreCount: 0
          });
        }

        const aggregated = monthsMap.get(key);

        if (monthData.paymentTerm > 0) {
          aggregated.totalPaymentTerms += monthData.paymentTerm;
          aggregated.customerCount++;
        }

        if (monthData.score > 0) {
          aggregated.totalScores += monthData.score;
          aggregated.scoreCount++;
        }
      });
    });

    if (!hasValidData) {
      return this.getEmptyScoreData();
    }

    const result = Array.from(monthsMap.values())
      .sort((a, b) => a.date - b.date)
      .map(month => ({
        month: month.month,
        paymentTerm: month.customerCount > 0 ?
          Math.round(month.totalPaymentTerms / month.customerCount) : 0,
        score: month.scoreCount > 0 ?
          Math.round(month.totalScores / month.scoreCount) : 0,
        date: month.date,
        year: month.year
      }));

    return result.length > 0 ? result : this.getEmptyScoreData();
  }

  calculateScoreMetrics(scoreData) {
    if (!scoreData || scoreData.length < 2) {
      return { currentScore: 0, previousScore: 0, scoreVariation: 0 };
    }

    const currentScore = scoreData[scoreData.length - 1]?.score || 0;
    const previousScore = scoreData[scoreData.length - 2]?.score || 0;
    const scoreVariation = currentScore - previousScore;

    return { currentScore, previousScore, scoreVariation };
  }

  getEmptyScoreData() {
    return this.generateMonthsStructure(12).map(month => ({
      month: month.label,
      paymentTerm: 0,
      score: 0,
      date: month.date,
      year: month.date.getFullYear()
    }));
  }
}();

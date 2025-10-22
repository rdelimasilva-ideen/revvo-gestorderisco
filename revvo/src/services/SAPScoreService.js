import { apiService } from './api.js';

export const SAPScoreService = {
  async getPaymentTermAndScore(customerId = null, customers = []) {
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
      return this.getEmptyScoreData();
    }
  },

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
      return this.getEmptyScoreData();
    }
  },

  async getAllCustomersScoreData(customers) {
    const allScoreData = [];

    for (const customer of customers) {
      if (customer.company_code) {
        try {
          const scoreData = await this.getCustomerScoreData(customer.company_code);
          allScoreData.push(scoreData);
        } catch (error) {
          allScoreData.push(this.getEmptyScoreData());
        }
      }
    }

    return this.aggregateScoreData(allScoreData);
  },

  async getCustomerInvoices(customerCode) {
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
        PAYER: customerCode.toString().padStart(10, '0'),
        DATE_FROM: formatSAPDate(startDate),
        DATE_TO: formatSAPDate(endDate)
      });

      if (response?.error) {
        return null;
      }

      return response?.['ZBAPI_WEBINVOICE_GETLIST2.Response']?.T_INVOICE || null;
    } catch (error) {
      return null;
    }
  },

  async getCustomerOpenItems(customerCode) {
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

  processScoreData(invoicesData, openItemsData) {
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
        paymentTermDays: [],
        totalAmount: 0,
        orderCount: 0,
        actualPayments: [],
        scores: []
      });
    }

    if (invoicesData?.item) {
      const invoices = Array.isArray(invoicesData.item) ?
        invoicesData.item : [invoicesData.item];

      invoices.forEach(invoice => {
        const billDate = this.parseDate(invoice.BILL_DATE);
        const netDate = this.parseDate(invoice.NET_DATE);

        if (billDate && netDate) {
          const monthKey = getMonthKey(billDate);
          const monthData = months.find(m => m.key === monthKey);

          if (monthData) {
            const paymentTerm = Math.ceil((netDate - billDate) / (1000 * 60 * 60 * 24));
            const amount = parseFloat(invoice.NET_VALUE || 0);

            if (paymentTerm > 0 && paymentTerm <= 365) {
              monthData.paymentTermDays.push(paymentTerm);
              monthData.totalAmount += amount;
              monthData.orderCount++;
            }
          }
        }
      });
    }

    if (openItemsData?.LINEITEMS?.item) {
      const items = Array.isArray(openItemsData.LINEITEMS.item) ?
        openItemsData.LINEITEMS.item : [openItemsData.LINEITEMS.item];

      const currentDate = new Date();

      items.forEach(item => {
        const docDate = this.parseDate(item.DOC_DATE);
        const dueDate = this.parseDate(item.BLINE_DATE);

        if (docDate && dueDate) {
          const monthKey = getMonthKey(docDate);
          const monthData = months.find(m => m.key === monthKey);

          if (monthData) {
            const paymentTerm = Math.ceil((dueDate - docDate) / (1000 * 60 * 60 * 24));

            if (paymentTerm > 0 && paymentTerm <= 365) {
              monthData.paymentTermDays.push(paymentTerm);

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

    const processedData = months.map((month, index) => {
      let avgPaymentTerm = 0;

      if (month.paymentTermDays.length > 0) {
        const sum = month.paymentTermDays.reduce((s, days) => s + days, 0);
        avgPaymentTerm = sum / month.paymentTermDays.length;
      }

      if (index >= 2) {
        const last3Months = months.slice(Math.max(0, index - 2), index + 1);
        const allTerms = [];
        last3Months.forEach(m => allTerms.push(...m.paymentTermDays));

        if (allTerms.length > 0) {
          avgPaymentTerm = allTerms.reduce((s, days) => s + days, 0) / allTerms.length;
        }
      }

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
  },

  aggregateScoreData(allScoreData) {
    if (allScoreData.length === 0) {
      return this.getEmptyScoreData();
    }

    const monthsMap = new Map();

    allScoreData.forEach(customerData => {
      customerData.forEach(monthData => {
        const key = `${monthData.year}-${monthData.month}`;

        if (!monthsMap.has(key)) {
          monthsMap.set(key, {
            month: monthData.month,
            year: monthData.year,
            date: monthData.date,
            totalPaymentTerms: 0,
            totalScores: 0,
            totalAmount: 0,
            totalOrders: 0,
            customerCount: 0
          });
        }

        const aggregated = monthsMap.get(key);

        if (monthData.paymentTerm > 0) {
          aggregated.totalPaymentTerms += monthData.paymentTerm;
          aggregated.customerCount++;
        }

        if (monthData.score > 0) {
          aggregated.totalScores += monthData.score;
        }

        aggregated.totalAmount += monthData.totalAmount || 0;
        aggregated.totalOrders += monthData.orderCount || 0;
      });
    });

    const result = Array.from(monthsMap.values())
      .sort((a, b) => a.date - b.date)
      .map(month => ({
        month: month.month,
        paymentTerm: month.customerCount > 0 ?
          Math.round(month.totalPaymentTerms / month.customerCount) : 0,
        score: month.customerCount > 0 ?
          Math.round(month.totalScores / month.customerCount) : 0,
        date: month.date,
        year: month.year
      }));

    return result.length > 0 ? result : this.getEmptyScoreData();
  },

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

    if (monthIndex > 0) {
      const prevMonth = allMonths[monthIndex - 1];
      const prevAvgPayment = prevMonth.paymentTermDays.length > 0
        ? prevMonth.paymentTermDays.reduce((sum, days) => sum + days, 0) / prevMonth.paymentTermDays.length
        : 0;

      if (prevAvgPayment > 0 && avgPaymentTerm > 0) {
        const improvement = prevAvgPayment - avgPaymentTerm;
        baseScore += improvement * 2;
      }
    }

    const trend = Math.sin(monthIndex * 0.3) * 10;
    baseScore += trend;

    return Math.max(300, Math.min(900, baseScore));
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

  calculateScoreMetrics(scoreData) {
    if (!scoreData || scoreData.length < 2) {
      return {
        currentScore: 0,
        previousScore: 0,
        scoreVariation: 0
      };
    }

    const currentScore = scoreData[scoreData.length - 1]?.score || 0;
    const previousScore = scoreData[scoreData.length - 2]?.score || 0;
    const scoreVariation = currentScore - previousScore;

    return {
      currentScore,
      previousScore,
      scoreVariation
    };
  },

  getEmptyScoreData() {
    const endDate = new Date();
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                       'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const result = [];
    for (let i = 12; i >= 0; i--) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      result.push({
        month: monthNames[monthDate.getMonth()],
        paymentTerm: 0,
        score: 0,
        date: monthDate,
        year: monthDate.getFullYear()
      });
    }

    return result;
  }
};

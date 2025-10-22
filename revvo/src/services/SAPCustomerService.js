import { apiService } from './api.js';

export const SAPCustomerService = {
  cache: new Map(),
  requestQueue: new Map(),
  CACHE_TTL: 5 * 60 * 1000,

  getCacheKey(method, params) {
    return `${method}-${JSON.stringify(params)}`;
  },

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
  },

  padCustomerCode(code) {
    return code.toString().padStart(10, '0');
  },

  async getCustomerCreditLimit(customerCode) {
    const cacheKey = this.getCacheKey('creditLimit', customerCode);

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await apiService.sapRequest('ZUKM_DB_UKMBP_CMS_SGM_READ', {
          I_PARTNER: this.padCustomerCode(customerCode),
          I_SEGMENT: '0000',
          I_DB_READ: ''
        });

        const creditData = response?.['ZUKM_DB_UKMBP_CMS_SGM_READ.Response']?.ES_BP_CMS_SGM;

        if (creditData) {
          return {
            creditLimit: parseFloat(creditData.CREDIT_LIMIT || 0),
            calculatedLimit: parseFloat(creditData.CRED_LIM_CALC || 0),
            limitValidDate: creditData.LIMIT_VALID_DATE,
            limitChangeDate: creditData.LIMIT_CHG_DATE,
            isBlocked: creditData.XBLOCKED === 'X',
            isCritical: creditData.XCRITICAL === 'X',
            blockReason: creditData.BLOCK_REASON
          };
        }

        return null;
      } catch (error) {
        throw new Error(`Erro ao buscar limite do cliente: ${error.message}`);
      }
    });
  },

  async getCustomerBasicData(customerCode) {
    const cacheKey = this.getCacheKey('basicData', customerCode);

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await apiService.sapRequest('BAPI_CUSTOMER_GETLIST', {
          MAXROWS: "1",
          IDRANGE: {
            item: {
              SIGN: "I",
              OPTION: "EQ",
              LOW: this.padCustomerCode(customerCode),
              HIGH: ""
            }
          }
        });

        return response || null;
      } catch (error) {
        return null;
      }
    });
  },

  async getCustomerOpenItems(customerCode) {
    const cacheKey = this.getCacheKey('openItems', customerCode);

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const currentDate = new Date();
        const keyDate = currentDate.getFullYear().toString() +
                       (currentDate.getMonth() + 1).toString().padStart(2, '0') +
                       currentDate.getDate().toString().padStart(2, '0');

        const response = await apiService.sapRequest('ZBAPI_AR_ACC_GETOPENITEMS2', {
          COMPANYCODE: '1000',
          CUSTOMER_LOW: this.padCustomerCode(customerCode),
          CUSTOMER_HIGH: this.padCustomerCode(customerCode),
          KEYDATE: keyDate,
          NOTEDITEMS: 'X'
        });

        return response?.['rfc:ZBAPI_AR_ACC_GETOPENITEMS2.Response']?.LINEITEMS || null;
      } catch (error) {
        return null;
      }
    });
  },

  async getCustomerInvoices(customerCode, dateFrom = null, dateTo = null) {
    const cacheKey = this.getCacheKey('invoices', { customerCode, dateFrom, dateTo });

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const params = {
          COMPANYCODE: '1000',
          PAYER: this.padCustomerCode(customerCode)
        };

        if (dateFrom) params.DATE_FROM = dateFrom;
        if (dateTo) params.DATE_TO = dateTo;

        const response = await apiService.sapRequest('ZBAPI_WEBINVOICE_GETLIST2', params);

        return response?.['ZBAPI_WEBINVOICE_GETLIST2.Response']?.T_INVOICE || null;
      } catch (error) {
        return null;
      }
    });
  },

  async getPaymentTerms() {
    const cacheKey = this.getCacheKey('paymentTerms', {});

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await apiService.sapRequest('ZFI_F4_ZTERM', {
          I_KOART: 'D',
          I_XSHOW: 'X',
          I_ZTYPE: 'X',
          I_NO_POPUP: 'X'
        });

        return response?.['ZFI_F4_ZTERM.Response']?.ET_ZTERM?.item || [];
      } catch (error) {
        return [];
      }
    });
  },

  async getSalesOrders(customerCode, dateFrom = null, dateTo = null) {
    const cacheKey = this.getCacheKey('salesOrders', { customerCode, dateFrom, dateTo });

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        const params = {
          CUSTOMER_NUMBER: this.padCustomerCode(customerCode),
          SALES_ORGANIZATION: '1000'
        };

        if (dateFrom) params.DOCUMENT_DATE = dateFrom;
        if (dateTo) params.DOCUMENT_DATE_TO = dateTo;

        const response = await apiService.sapRequest('BAPI_SALESORDER_GETLIST', params);

        return response?.['BAPI_SALESORDER_GETLIST.Response']?.SALES_ORDERS || null;
      } catch (error) {
        return null;
      }
    });
  },

  clearCache() {
    this.cache.clear();
    this.requestQueue.clear();
  }
};

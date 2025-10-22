import { API_BASE_URL } from '../config/api.js';
import { apiService } from './api.js';

const SAP_API_URL = 'http://localhost:3001';
const BACKEND_API_URL = API_BASE_URL;

export const InvoiceService = {
  /**
   * Busca faturas do cliente via SAP
   * @param {string} partnerNumber - Número do parceiro/cliente
   * @param {string} companyCode - Código da empresa
   * @returns {Promise<Array>} - Lista de faturas
   */
  async getInvoices(partnerNumber, companyCode) {
    if (!partnerNumber) {
      throw new Error('Número do cliente é obrigatório');
    }

    const requestData = {
      COMPANYCODE: companyCode,
      PARTNER_NUMBER: partnerNumber.padStart(10, '0')
    };

    try {
      const response = await fetch(`${SAP_API_URL}/cpi/ZBAPI_WEBINVOICE_GETLIST2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data?.['ZBAPI_WEBINVOICE_GETLIST2.Response']?.T_INVOICE?.item) {
        const invoicesData = data['ZBAPI_WEBINVOICE_GETLIST2.Response'].T_INVOICE.item;
        const processedInvoices = Array.isArray(invoicesData) ? invoicesData : [invoicesData];
        
        // Salvar faturas no banco e atualizar status
        await this.saveInvoices(processedInvoices);
        await this.updateInvoiceStatus(processedInvoices);
        
        return processedInvoices;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      throw new Error('Erro ao buscar faturas. Verifique a conexão com o SAP.');
    }
  },

  /**
   * Salva as faturas recebidas do SAP no banco de dados
   * @param {Array} invoices - Lista de faturas
   * @returns {Promise<Object>} - Resultado da operação
   */
  async saveInvoices(invoices) {
    try {
      // Valores padrão para simplificar o processo
      const companyId = 19; // ID da empresa padrão
      const customerId = 6;  // ID do cliente padrão
      
      // Chamar a API para salvar faturas no backend
      const response = await fetch(`${BACKEND_API_URL}/api/invoices/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoices: invoices.map(invoice => {
            const netValue = parseFloat(invoice.NET_VALUE?.trim() || 0);
            const statusId = this.getStatusId(invoice.NET_DATE);
            const emissionDate = this.formatSapDate(invoice.BILL_DATE);
            const dueDate = this.formatSapDate(invoice.NET_DATE);
            const paymentCondition = parseInt(invoice.PMNTTRMS?.match(/\\d+/)?.[0]) || null;

            return {
              fat_id: invoice.BILLINGDOC,
              customer_id: customerId,
              company_id: companyId,
              dt_emissao: emissionDate,
              dt_vencimento: dueDate,
              valor_orig: netValue,
              valor_atualiz: netValue,
              status_id: statusId,
              duplicata: false,
              moeda: invoice.CURRENCY || 'BRL',
              chave_df: invoice.NRO_NFE || null,
              tipo_df: 'NF',
              condicoes_pagamento: invoice.PMNTTRMS || null,
              total_parcelas: 1,
              parcelas_qtd: 1,
              banco: null,
              agencia: null,
              conta: null,
              recebedor: null,
              condicao_pgto: paymentCondition
            };
          })
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('💥 Erro ao salvar faturas:', error);
      return {
        success: false,
        processed: 0,
        errors: 1,
        error: error.message
      };
    }
  },

  /**
   * Atualiza o status das faturas com base na data de vencimento
   * @param {Array} invoices - Lista de faturas
   */
  async updateInvoiceStatus(invoices) {
    try {
      const invoiceIds = invoices.map(inv => inv.BILLINGDOC);
      
      // Chamar a API para atualizar status
      const response = await fetch(`${BACKEND_API_URL}/api/invoices/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceIds: invoiceIds
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Carrega detalhes de uma fatura específica
   * @param {Object} invoice - Objeto da fatura
   * @param {string} companyCode - Código da empresa
   * @returns {Promise<Object>} - Detalhes da fatura
   */
  async loadInvoiceDetails(invoice, companyCode) {
    try {
      const currentDate = new Date();
      const dateStr = currentDate.getFullYear() +
                    String(currentDate.getMonth() + 1).padStart(2, '0') +
                    String(currentDate.getDate()).padStart(2, '0');

      const detailRequestData = {
        I_COMPCODE: companyCode,
        I_VENDOR: invoice.PAYER,
        I_KEYDATE: dateStr
      };

      const parcelRequestData = {
        I_VBELN: invoice.BILLINGDOC,
        I_BUKRS: companyCode,
        I_GJAHR: invoice.BILL_DATE ? invoice.BILL_DATE.substring(0, 4) : new Date().getFullYear().toString()
      };

      const [detailResponse, parcelResponse] = await Promise.all([
        fetch(`${SAP_API_URL}/cpi/ZDETALHES_FATURA`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(detailRequestData)
        }).then(res => res.json()),
        fetch(`${SAP_API_URL}/cpi/ZFATURA_PARC2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parcelRequestData)
        }).then(res => res.json())
      ]);

      const details = detailResponse || {};
      const parcelData = parcelResponse || {};

      // Salvar os detalhes no banco
      await this.saveInvoiceDetails(invoice.BILLINGDOC, details, parcelData);
      
      // Retornar os detalhes formatados
      return {
        ...invoice,
        customerName: details.E_NAME1 || '',
        customerName2: details.E_NAME2 || '',
        cnpj: details.E_STCD1 || parcelData.E_CNPJ || '',
        nfeNumber: parcelData.E_NOTA_FISCAL || invoice.NRO_NFE || '',
        parcelInfo: parcelData.E_VBRK || {},
        openItems: details.T_OPEN?.item || []
      };

    } catch (error) {
      console.error('Erro ao carregar detalhes da fatura:', error);
      throw new Error('Erro ao carregar detalhes da fatura');
    }
  },

  /**
   * Salva os detalhes adicionais da fatura
   * @param {string} invoiceId - ID da fatura
   * @param {Object} detailData - Dados de detalhes
   * @param {Object} parcelData - Dados de parcela
   */
  async saveInvoiceDetails(invoiceId, detailData, parcelData) {
    try {
      // Montar os dados para atualização
      const updates = {};
      
      if (parcelData?.E_NOTA_FISCAL) {
        updates.chave_df = parcelData.E_NOTA_FISCAL;
      }

      if (parcelData?.E_VBRK?.NETWR) {
        const netValue = parseFloat(parcelData.E_VBRK.NETWR);
        updates.valor_orig = netValue;
        updates.valor_atualiz = netValue;
      }

      if (parcelData?.E_VBRK?.ZTERM) {
        updates.condicoes_pagamento = parcelData.E_VBRK.ZTERM;
        const days = parseInt(parcelData.E_VBRK.ZTERM.match(/\\d+/)?.[0]) || null;
        if (days) updates.condicao_pgto = days;
      }
      
      // Se houver dados para atualizar
      if (Object.keys(updates).length > 0) {
        // Chamar a API para atualizar os detalhes
        const response = await fetch(`${BACKEND_API_URL}/api/invoices/${invoiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates)
        });
        
        return await response.json();
      }
      
      // Atualizar CNPJ do cliente se disponível
      if (parcelData?.E_CNPJ) {
        await this.updateCustomerCNPJ(parcelData.E_CNPJ, invoiceId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar detalhes da fatura:', error);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Atualiza o CNPJ do cliente
   * @param {string} cnpj - CNPJ do cliente
   * @param {string} invoiceId - ID da fatura
   */
  async updateCustomerCNPJ(cnpj, invoiceId) {
    try {
      if (!cnpj || cnpj.length < 14) return;
      
      // Chamar a API para atualizar o CNPJ
      const response = await fetch(`${BACKEND_API_URL}/api/invoices/customers/update-cnpj`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          cnpj
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar CNPJ do cliente:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Formata uma data do SAP para o formato ISO
   * @param {string} date - Data no formato do SAP
   * @returns {string|null} - Data formatada ou null
   */
  formatSapDate(date) {
    if (!date || date === '00000000') return null;
    if (date.length === 10 && date.includes('-')) return date;
    if (date.length === 8) {
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      const day = date.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return date;
  },

  /**
   * Determina o ID do status baseado na data de vencimento
   * @param {string} dueDate - Data de vencimento
   * @returns {number} - ID do status
   */
  getStatusId(dueDate) {
    if (!dueDate || dueDate === '00000000') return 1;

    const today = new Date();
    const due = new Date(this.formatSapDate(dueDate));

    return today > due ? 2 : 1;
  }
};

export default InvoiceService;
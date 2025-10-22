import { apiService } from './apiService';

export const CustomerService = {
  async getCustomerCreditLimits(customerId) {
    try {
      if (!customerId) return null;

      const response = await apiService.get(`/api/customer/credit-limits/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar limites de crédito:', error);
      throw error;
    }
  },

  async updateCustomerCreditLimits(customerId, limitData) {
    try {
      const response = await apiService.put(`/api/customer/credit-limits/${customerId}`, limitData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar limites de crédito:', error);
      throw error;
    }
  },

  async getCustomersByCompanyGroup(userCompanyId) {
    try {
      const response = await apiService.get(`/api/customer/by-company-group/${userCompanyId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar clientes por grupo:', error);
      throw error;
    }
  },

  async getCustomerById(id) {
    try {
      const response = await apiService.get(`/api/customer/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error);
      throw error;
    }
  },

  // Busca lista de clientes (id, name) ordenados por nome
  async listCustomers() {
    try {
      const response = await apiService.get('/api/customer/');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  },

  // Busca detalhes completos de um cliente (incluindo company e address)
  async getCustomerDetails(customerId) {
    try {
      const response = await apiService.get(`/api/customer/details/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do cliente:', error);
      throw error;
    }
  },

  // Busca detalhes completos de um cliente (incluindo address) para NewLimitOrder
  async getCustomerDetailsWithAddress(customerId) {
    try {
      const response = await apiService.get(`/api/customer/details-with-address/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do cliente com endereço:', error);
      throw error;
    }
  }
};

export default CustomerService;

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// import { apiService } from './api.js';

// export const CustomerService = {
//   async getCustomerCreditLimits(customerId) {
//     if (!customerId) return null;

//     const customerData = await apiService.supabaseSelect('customer', {
//       select: 'credit_limits_id',
//       eq: { id: customerId },
//       single: true
//     });

//     if (!customerData?.credit_limits_id) {
//       return {
//         creditLimitsId: null,
//         creditLimit: '',
//         prepaidLimit: '',
//         comments: ''
//       };
//     }

//     const creditLimitData = await apiService.supabaseSelect('credit_limit_amount', {
//       eq: { id: customerData.credit_limits_id },
//       single: true
//     });

//     return {
//       creditLimitsId: creditLimitData.id,
//       creditLimit: creditLimitData.credit_limit ?
//         creditLimitData.credit_limit.toLocaleString('pt-BR', {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2
//         }) : '',
//       prepaidLimit: creditLimitData.prepaid_limit ?
//         creditLimitData.prepaid_limit.toLocaleString('pt-BR', {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2
//         }) : '',
//       comments: creditLimitData.comments || ''
//     };
//   },

//   async updateCustomerCreditLimits(customerId, limitData) {
//     const customer = await apiService.supabaseSelect('customer', {
//       select: 'credit_limits_id',
//       eq: { id: customerId },
//       single: true
//     });

//     if (customer.credit_limits_id) {
//       return await apiService.supabaseUpdate('credit_limit_amount', limitData, {
//         id: customer.credit_limits_id
//       });
//     } else {
//       const newLimit = await apiService.supabaseInsert('credit_limit_amount', limitData);
//       await apiService.supabaseUpdate('customer', {
//         credit_limits_id: newLimit[0].id
//       }, { id: customerId });
//       return newLimit;
//     }
//   },

//   async getCustomersByCompanyGroup(userCompanyId) {
//     try {
//       const companyData = await apiService.supabaseSelect('company', {
//         select: 'corporate_group_id',
//         eq: { id: userCompanyId },
//         single: true
//       });

//       if (!companyData?.corporate_group_id) {
//         throw new Error('Corporate group not found');
//       }

//       const companiesData = await apiService.supabaseSelect('company', {
//         select: 'id',
//         eq: { corporate_group_id: companyData.corporate_group_id }
//       });

//       const companyIds = companiesData.map(c => c.id);

//       return await apiService.supabaseSelect('customer', {
//         select: 'id, name, company_code',
//         in: { company_id: companyIds },
//         order: { column: 'name', ascending: true }
//       });
//     } catch (error) {
//       console.error('Error fetching customers:', error);
//       throw error;
//     }
//   },

//   async getCustomerById(id) {
//     return await apiService.supabaseSelect('customer', {
//       eq: { id },
//       single: true
//     });
//   },

//   // Busca lista de clientes (id, name) ordenados por nome
//   async listCustomers() {
//     const { data, error } = await apiService.supabaseSelect('customer', {
//       select: 'id, name',
//       order: { column: 'name', ascending: true }
//     });
//     if (error) throw error;
//     return data;
//   },

//   // Busca detalhes completos de um cliente (incluindo company e address)
//   async getCustomerDetails(customerId) {
//     const { data, error } = await apiService.supabaseSelect('customer', {
//       select: `
//         id,
//         name,
//         company_code,
//         costumer_cnpj,
//         costumer_phone,
//         costumer_email,
//         company:company_id(id, name),
//         address:addr_id(*)
//       `,
//       eq: { id: customerId },
//       single: true
//     });
//     if (error) throw error;
//     return data;
//   },

//   // Busca detalhes completos de um cliente (incluindo address) para NewLimitOrder
//   async getCustomerDetailsWithAddress(customerId) {
//     const { data, error } = await apiService.supabaseSelect('customer', {
//       select: `
//         id,
//         name,
//         company_code,
//         costumer_email,
//         costumer_phone,
//         costumer_cnpj,
//         costumer_razao_social,
//         address:addr_id(*)
//       `,
//       eq: { id: customerId },
//       single: true
//     });
//     if (error) throw error;
//     return data;
//   }
// };

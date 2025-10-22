import { apiService } from './apiService';

// Busca company_id do usuário logado
export async function getUserCompanyId(userId) {
  try {
    const response = await apiService.get(`/api/business-analysis/user-company/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar company_id do usuário:', error);
    throw error;
  }
}

// Busca corporate_group_id da empresa
export async function getCorporateGroupId(companyId) {
  try {
    const response = await apiService.get(`/api/business-analysis/corporate-group/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar corporate_group_id:', error);
    throw error;
  }
}

// Busca IDs das empresas do grupo
export async function listCompaniesByCorporateGroup(corporateGroupId) {
  try {
    const response = await apiService.get(`/api/business-analysis/companies-by-group/${corporateGroupId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar empresas do grupo:', error);
    throw error;
  }
}

// Busca dados de um cliente
export async function getCustomerById(customerId) {
  try {
    const response = await apiService.get(`/api/business-analysis/customer/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados do cliente:', error);
    throw error;
  }
}

// Busca endereço pelo id
export async function getAddressById(addressId) {
  try {
    const response = await apiService.get(`/api/business-analysis/address/${addressId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    throw error;
  }
}

// Busca empresas do grupo por corporate_group_id
export async function getCompaniesByCorporateGroup(corporateGroupId) {
  try {
    const response = await apiService.get(`/api/business-analysis/companies-corporate-group/${corporateGroupId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar empresas do grupo corporativo:', error);
    throw error;
  }
}

// Busca sales orders por companyIds e opcionalmente customerId
export async function getSalesOrders({ companyIds, customerId }) {
  try {
    const params = new URLSearchParams();
    
    // Converte array de company IDs para string separada por vírgulas
    const companyIdsString = Array.isArray(companyIds) 
      ? companyIds.join(',') 
      : companyIds.toString();
    
    params.append('company_ids', companyIdsString);
    
    if (customerId) {
      params.append('customer_id', customerId);
    }

    const response = await apiService.get(`/api/business-analysis/sales-orders?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar sales orders:', error);
    throw error;
  }
}

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// import { supabase } from '../lib/supabase';

// // Busca company_id do usuário logado
// export async function getUserCompanyId(userId) {
//   const { data, error } = await supabase
//     .from('user_profile')
//     .select('company_id')
//     .eq('logged_id', userId)
//     .single();
//   if (error) throw error;
//   return data?.company_id;
// }

// // Busca corporate_group_id da empresa
// export async function getCorporateGroupId(companyId) {
//   const { data, error } = await supabase
//     .from('company')
//     .select('corporate_group_id')
//     .eq('id', companyId)
//     .single();
//   if (error) throw error;
//   return data?.corporate_group_id;
// }

// // Busca IDs das empresas do grupo
// export async function listCompaniesByCorporateGroup(corporateGroupId) {
//   const { data, error } = await supabase
//     .from('company')
//     .select('id')
//     .eq('corporate_group_id', corporateGroupId);
//   if (error) throw error;
//   return data;
// }

// // Busca dados de um cliente
// export async function getCustomerById(customerId) {
//   const { data, error } = await supabase
//     .from('customer')
//     .select('*')
//     .eq('id', customerId)
//     .single();
//   if (error) throw error;
//   return data;
// }

// // Busca endereço pelo id
// export async function getAddressById(addressId) {
//   const { data, error } = await supabase
//     .from('address')
//     .select('*')
//     .eq('id', addressId)
//     .single();
//   if (error) throw error;
//   return data;
// }

// // Busca empresas do grupo por corporate_group_id
// export async function getCompaniesByCorporateGroup(corporateGroupId) {
//   const { data, error } = await supabase
//     .from('company')
//     .select('id')
//     .eq('corporate_group_id', corporateGroupId);
//   if (error) throw error;
//   return data;
// }

// // Busca sales orders por companyIds e opcionalmente customerId
// export async function getSalesOrders({ companyIds, customerId }) {
//   let query = supabase
//     .from('sale_orders')
//     .select(`
//       id,
//       created_at,
//       customer_id,
//       customer:customer_id(id, name),
//       total_qtt,
//       total_amt,
//       due_date
//     `)
//     .in('company_id', companyIds)
//     .order('created_at', { ascending: false });
//   if (customerId) query = query.eq('customer_id', customerId);
//   const { data, error } = await query;
//   if (error) throw error;
//   return data;
// }

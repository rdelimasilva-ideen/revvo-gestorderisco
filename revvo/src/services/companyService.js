import { apiService } from './apiService';

// Busca empresa pelo ID
export async function getCompanyById(companyId) {
  try {
    const response = await apiService.get(`/api/company/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    throw error;
  }
}

// Atualiza empresa
export async function updateCompany(companyId, companyData) {
  try {
    await apiService.put(`/api/company/${companyId}`, companyData);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    throw error;
  }
}

// Cria empresa
export async function createCompany(companyData) {
  try {
    const response = await apiService.post('/api/company/', companyData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    throw error;
  }
}

// Atualiza endereço
export async function updateAddress(addressId, addressData) {
  try {
    await apiService.put(`/api/company/address/${addressId}`, addressData);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    throw error;
  }
}

// Cria endereço
export async function createAddress(addressData) {
  try {
    const response = await apiService.post('/api/company/address', addressData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    throw error;
  }
}

// Busca corporate_group_id de uma empresa
export async function getCorporateGroupId(companyId) {
  try {
    const response = await apiService.get(`/api/company/${companyId}/corporate-group`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar corporate_group_id:', error);
    throw error;
  }
}

// Busca todas as empresas de um corporate_group_id
export async function listCompaniesByCorporateGroup(corporateGroupId) {
  try {
    const response = await apiService.get(`/api/company/corporate-group/${corporateGroupId}/companies`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar empresas do grupo corporativo:', error);
    throw error;
  }
}

// Busca faturamento mensal por corporate_group_id e opcionalmente por customer_id
export async function getMonthlyBilling(corporateGroupId, customerId = null) {
  try {
    let url = `/api/company/corporate-group/${corporateGroupId}/monthly-billing`;
    if (customerId) {
      url += `?customer_id=${customerId}`;
    }
    const response = await apiService.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar faturamento mensal:', error);
    throw error;
  }
}

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// import { supabase } from '../lib/supabase';

// // Busca empresa pelo ID
// export async function getCompanyById(companyId) {
//   const { data, error } = await supabase
//     .from('company')
//     .select('*, address:address_id(*)')
//     .eq('id', companyId)
//     .single();
//   if (error) throw error;
//   return data;
// }

// // Atualiza empresa
// export async function updateCompany(companyId, companyData) {
//   const { error } = await supabase
//     .from('company')
//     .update(companyData)
//     .eq('id', companyId);
//   if (error) throw error;
//   return true;
// }

// // Cria empresa
// export async function createCompany(companyData) {
//   const { data, error } = await supabase
//     .from('company')
//     .insert([companyData])
//     .select();
//   if (error) throw error;
//   return data[0];
// }

// // Atualiza endereço
// export async function updateAddress(addressId, addressData) {
//   const { error } = await supabase
//     .from('address')
//     .update(addressData)
//     .eq('id', addressId);
//   if (error) throw error;
//   return true;
// }

// // Cria endereço
// export async function createAddress(addressData) {
//   const { data, error } = await supabase
//     .from('address')
//     .insert([addressData])
//     .select();
//   if (error) throw error;
//   return data[0];
// }

// // Busca corporate_group_id de uma empresa
// export async function getCorporateGroupId(companyId) {
//   const { data, error } = await supabase
//     .from('company')
//     .select('corporate_group_id')
//     .eq('id', companyId)
//     .single();
//   if (error) throw error;
//   return data?.corporate_group_id;
// }

// // Busca todas as empresas de um corporate_group_id
// export async function listCompaniesByCorporateGroup(corporateGroupId) {
//   const { data, error } = await supabase
//     .from('company')
//     .select('id')
//     .eq('corporate_group_id', corporateGroupId);
//   if (error) throw error;
//   return data;
// }

// // Busca faturamento mensal por corporate_group_id e opcionalmente por customer_id
// export async function getMonthlyBilling(corporateGroupId, customerId = null) {
//   let query = supabase
//     .from('vw_faturamento_mensal')
//     .select('*')
//     .eq('corporate_group_id', corporateGroupId);
//   if (customerId) {
//     query = query.eq('customer_id', customerId);
//   }
//   const { data, error } = await query;
//   if (error) throw error;
//   return data;
// }

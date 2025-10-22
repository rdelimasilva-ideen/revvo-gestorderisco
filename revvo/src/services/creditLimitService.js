import { apiService } from './apiService';

// Busca solicitações de limite de crédito com filtros opcionais
export async function getCreditLimitRequests({ companyId, statusId, startDate, endDate } = {}) {
  try {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (statusId) params.append('status_id', statusId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const url = `/api/credit-limit/requests${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar solicitações de limite:', error);
    throw error;
  }
}

// Cria uma nova solicitação de limite de crédito
export async function createCreditLimitRequest(requestData) {
  try {
    const response = await apiService.post('/api/credit-limit/requests', requestData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar solicitação de limite:', error);
    throw error;
  }
}

// Atualiza uma solicitação existente
export async function updateCreditLimitRequest(id, requestData) {
  try {
    const response = await apiService.put(`/api/credit-limit/requests/${id}`, requestData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar solicitação de limite:', error);
    throw error;
  }
}

// Deleta uma solicitação
export async function deleteCreditLimitRequest(id) {
  try {
    await apiService.delete(`/api/credit-limit/requests/${id}`);
    return true;
  } catch (error) {
    console.error('Erro ao deletar solicitação de limite:', error);
    throw error;
  }
}

// Busca o limite calculado de crédito de um cliente
export async function getCalculatedCreditLimit(customerId) {
  try {
    const response = await apiService.get(`/api/credit-limit/calculated/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar limite calculado:', error);
    throw error;
  }
}

// Busca dados do dashboard de credit limit
export async function getCreditLimitDashboard(companyId, branchId = null) {
  try {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (branchId) params.append('branch_id', branchId);

    const queryString = params.toString();
    const url = `/api/credit-limit/dashboard${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dashboard de credit limit:', error);
    throw error;
  }
}

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// import { supabase } from '../lib/supabase';

// // Busca solicitações de limite de crédito com filtros opcionais
// export async function getCreditLimitRequests({ companyId, statusId, startDate, endDate } = {}) {
//   let query = supabase
//     .from('credit_limit_request')
//     .select(`
//       *,
//       customer:customer_id(id, name, company_code),
//       company:company_id(name),
//       classification:silim_classific_id(name),
//       payment_method:silim_meio_pgto_id(name),
//       branch:branch_id(name),
//       status:status_id(name)
//     `)
//     .order('created_at', { ascending: false });

//   if (companyId) query = query.eq('company_id', companyId);
//   if (statusId) query = query.eq('status_id', statusId);
//   if (startDate) query = query.gte('created_at', startDate);
//   if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');

//   const { data, error } = await query;
//   if (error) throw error;
//   return data;
// }

// // Cria uma nova solicitação de limite de crédito
// export async function createCreditLimitRequest(requestData) {
//   const { data, error } = await supabase
//     .from('credit_limit_request')
//     .insert([requestData])
//     .select();
//   if (error) throw error;
//   return data[0];
// }

// // Atualiza uma solicitação existente
// export async function updateCreditLimitRequest(id, requestData) {
//   const { data, error } = await supabase
//     .from('credit_limit_request')
//     .update(requestData)
//     .eq('id', id)
//     .select();
//   if (error) throw error;
//   return data[0];
// }

// // Deleta uma solicitação
// export async function deleteCreditLimitRequest(id) {
//   const { error } = await supabase
//     .from('credit_limit_request')
//     .delete()
//     .eq('id', id);
//   if (error) throw error;
//   return true;
// }

// // Busca o limite calculado de crédito de um cliente
// export async function getCalculatedCreditLimit(customerId) {
//   // Primeiro busca o credit_limits_id do cliente
//   const { data: customerData, error: customerError } = await supabase
//     .from('customer')
//     .select('credit_limits_id')
//     .eq('id', customerId)
//     .single();
//   if (customerError) throw customerError;
//   if (!customerData?.credit_limits_id) return null;
//   // Busca o valor calculado
//   const { data: creditLimitData, error: creditLimitError } = await supabase
//     .from('credit_limit_amount')
//     .select('credit_limit_calc')
//     .eq('id', customerData.credit_limits_id)
//     .single();
//   if (creditLimitError) throw creditLimitError;
//   return creditLimitData?.credit_limit_calc || null;
// }

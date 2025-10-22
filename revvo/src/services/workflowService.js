import { apiService } from './apiService';

// Busca todas as solicitações de limite de crédito de um cliente
export async function getCreditLimitRequestsByCustomer(customerId) {
  try {
    const response = await apiService.get(`/api/workflow/credit-limit-requests/${customerId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar solicitações de limite:', error);
    throw error;
  }
}

// Busca workflow_sale_order por credit_limit_req_id
export async function getWorkflowSaleOrder(creditLimitReqId) {
  try {
    const response = await apiService.get(`/api/workflow/sale-order/${creditLimitReqId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar workflow sale order:', error);
    throw error;
  }
}

// Busca workflow_details por workflow_sale_order_id
export async function getWorkflowDetails(workflowSaleOrderId) {
  try {
    const response = await apiService.get(`/api/workflow/details/${workflowSaleOrderId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes do workflow:', error);
    throw error;
  }
}

// Aprova uma etapa do workflow
export async function approveWorkflowStep({ stepId, approverId, comments }) {
  try {
    await apiService.post('/api/workflow/approve-step', {
      stepId,
      approverId,
      comments
    });
    return true;
  } catch (error) {
    console.error('Erro ao aprovar etapa:', error);
    throw error;
  }
}

// Rejeita uma etapa do workflow
export async function rejectWorkflowStep({ stepId, approverId, comments }) {
  try {
    await apiService.post('/api/workflow/reject-step', {
      stepId,
      approverId,
      comments
    });
    return true;
  } catch (error) {
    console.error('Erro ao rejeitar etapa:', error);
    throw error;
  }
}

// Atualiza o started_at de uma etapa do workflow
export async function startWorkflowStep(stepId) {
  try {
    await apiService.put(`/api/workflow/start-step/${stepId}`);
    return true;
  } catch (error) {
    console.error('Erro ao iniciar etapa:', error);
    throw error;
  }
}

// Busca workflow_rules por company_id
export async function getWorkflowRules(companyId) {
  try {
    const response = await apiService.get(`/api/workflow/rules/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar regras de workflow:', error);
    throw error;
  }
}

// Alias para compatibilidade com código existente
export const listWorkflowRules = getWorkflowRules;

// Busca perfil do usuário por logged_id
export async function getUserProfile(userId) {
  try {
    const response = await apiService.get(`/api/workflow/user-profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    throw error;
  }
}

// Cria um workflow_sale_order
export async function createWorkflowSaleOrder(creditLimitReqId) {
  try {
    const response = await apiService.post('/api/workflow/create-sale-order', {
      creditLimitReqId
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar workflow sale order:', error);
    throw error;
  }
}

// Cria múltiplos workflow_details
export async function createWorkflowDetails(details) {
  try {
    await apiService.post('/api/workflow/create-details', {
      details
    });
    return true;
  } catch (error) {
    console.error('Erro ao criar workflow details:', error);
    throw error;
  }
}

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// import { supabase } from '../lib/supabase';

// // Busca todas as solicitações de limite de crédito de um cliente
// export async function getCreditLimitRequestsByCustomer(customerId) {
//   const { data, error } = await supabase
//     .from('credit_limit_request')
//     .select('*')
//     .eq('customer_id', customerId)
//     .order('created_at', { ascending: false });
//   if (error) throw error;
//   return data;
// }

// // Busca workflow_sale_order por credit_limit_req_id
// export async function getWorkflowSaleOrder(creditLimitReqId) {
//   const { data, error } = await supabase
//     .from('workflow_sale_order')
//     .select('*')
//     .eq('credit_limit_req_id', creditLimitReqId)
//     .single();
//   if (error) throw error;
//   return data;
// }

// // Busca workflow_details por workflow_sale_order_id
// export async function getWorkflowDetails(workflowSaleOrderId) {
//   const { data, error } = await supabase
//     .from('workflow_details')
//     .select(`*, jurisdiction:user_role(name, description)`)
//     .eq('workflow_sale_order_id', workflowSaleOrderId)
//     .order('workflow_step', { ascending: true });
//   if (error) throw error;
//   return data;
// }

// // Aprova uma etapa do workflow
// export async function approveWorkflowStep({ stepId, approverId, comments }) {
//   const { error } = await supabase
//     .from('workflow_details')
//     .update({
//       approval: true,
//       approver: approverId,
//       finished_at: new Date().toISOString(),
//       parecer: comments
//     })
//     .eq('id', stepId);
//   if (error) throw error;
//   return true;
// }

// // Rejeita uma etapa do workflow
// export async function rejectWorkflowStep({ stepId, approverId, comments }) {
//   const { error } = await supabase
//     .from('workflow_details')
//     .update({
//       approval: false,
//       approver: approverId,
//       finished_at: new Date().toISOString(),
//       parecer: comments
//     })
//     .eq('id', stepId);
//   if (error) throw error;
//   return true;
// }

// // Atualiza o started_at de uma etapa do workflow
// export async function startWorkflowStep(stepId) {
//   const { error } = await supabase
//     .from('workflow_details')
//     .update({ started_at: new Date().toISOString() })
//     .eq('id', stepId);
//   if (error) throw error;
//   return true;
// }

// // Busca workflow_rules por company_id
// export async function getWorkflowRules(companyId) {
//   const { data, error } = await supabase
//     .from('workflow_rules')
//     .select('*')
//     .eq('company_id', companyId)
//     .order('value_range', { ascending: true });
//   if (error) throw error;
//   return data;
// }

// // Busca perfil do usuário por logged_id
// export async function getUserProfile(userId) {
//   const { data, error } = await supabase
//     .from('user_profile')
//     .select('role_id, company_id')
//     .eq('logged_id', userId)
//     .single();
//   if (error) throw error;
//   return data;
// }

// // Cria um workflow_sale_order
// export async function createWorkflowSaleOrder(creditLimitReqId) {
//   const { data, error } = await supabase
//     .from('workflow_sale_order')
//     .insert([{ credit_limit_req_id: creditLimitReqId }])
//     .select()
//     .single();
//   if (error) throw error;
//   return data;
// }

// // Cria múltiplos workflow_details
// export async function createWorkflowDetails(details) {
//   const { error } = await supabase
//     .from('workflow_details')
//     .insert(details);
//   if (error) throw error;
//   return true;
// }

import { apiService } from './apiService';

// Lista regras de workflow da empresa
export async function listWorkflowRules(companyId) {
  try {
    const response = await apiService.get(`/api/workflow-rules/company/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar regras de workflow:', error);
    throw error;
  }
}

// Cria uma nova regra de workflow
export async function createWorkflowRule(ruleData) {
  try {
    await apiService.post('/api/workflow-rules/', ruleData);
    return true;
  } catch (error) {
    console.error('Erro ao criar regra de workflow:', error);
    throw error;
  }
}

// Atualiza uma regra de workflow
export async function updateWorkflowRule(id, ruleData) {
  try {
    await apiService.put(`/api/workflow-rules/${id}`, ruleData);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar regra de workflow:', error);
    throw error;
  }
}

// Deleta uma regra de workflow
export async function deleteWorkflowRule(id) {
  try {
    await apiService.delete(`/api/workflow-rules/${id}`);
    return true;
  } catch (error) {
    console.error('Erro ao deletar regra de workflow:', error);
    throw error;
  }
}

// Busca tipos de workflow
export async function getWorkflowTypes() {
  try {
    const response = await apiService.get('/api/workflow-rules/types');
    // Retorna response.data que contém o array de tipos de workflow
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar tipos de workflow:', error);
    throw error;
  }
}

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// import { supabase } from '../lib/supabase';

// // Lista regras de workflow da empresa
// export async function listWorkflowRules(companyId) {
//   const { data, error } = await supabase
//     .from('workflow_rules')
//     .select(`
//       *,
//       workflow_type:type_id(id, name),
//       user_role:role_id(id, name)
//     `)
//     .eq('company_id', companyId)
//     .order('created_at', { ascending: false });
//   if (error) throw error;
//   return data;
// }

// // Cria uma nova regra de workflow
// export async function createWorkflowRule(ruleData) {
//   const { error } = await supabase
//     .from('workflow_rules')
//     .insert([ruleData]);
//   if (error) throw error;
//   return true;
// }

// // Atualiza uma regra de workflow
// export async function updateWorkflowRule(id, ruleData) {
//   const { error } = await supabase
//     .from('workflow_rules')
//     .update(ruleData)
//     .eq('id', id);
//   if (error) throw error;
//   return true;
// }

// // Deleta uma regra de workflow
// export async function deleteWorkflowRule(id) {
//   const { error } = await supabase
//     .from('workflow_rules')
//     .delete()
//     .eq('id', id);
//   if (error) throw error;
//   return true;
// }

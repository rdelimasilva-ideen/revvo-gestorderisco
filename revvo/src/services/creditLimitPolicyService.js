import { apiService } from './apiService';

// Lista políticas de limite de crédito da empresa
export async function listCreditLimitPolicies(companyId) {
  return await apiService.get(`/sales/credit-limit-policies?company_id=${companyId}`);
}

// Cria uma nova política
export async function createCreditLimitPolicy(policyData) {
  await apiService.post('/sales/credit-limit-policies', policyData);
  return true;
}

// Atualiza uma política
export async function updateCreditLimitPolicy(id, policyData) {
  await apiService.put(`/sales/credit-limit-policies/${id}`, policyData);
  return true;
}

// Deleta uma política
export async function deleteCreditLimitPolicy(id) {
  await apiService.delete(`/sales/credit-limit-policies/${id}`);
  return true;
}

import { apiService } from './apiService';

/**
 * Serviço para operações relacionadas ao workflow history
 */

// Busca histórico completo de workflow para um cliente
export async function getWorkflowHistory(customerId) {
  try {
    const response = await apiService.get(`/api/workflow/history/${customerId}`);
    // Retorna a resposta completa, não apenas response.data
    return response;
  } catch (error) {
    console.error('Erro ao buscar histórico de workflow:', error);
    throw error;
  }
}
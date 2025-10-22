import { apiService } from './apiService';

// Busca todas as classificações disponíveis
export async function getClassifications() {
  try {
    const response = await apiService.get('/api/lookup/classifications');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar classificações:', error);
    throw error;
  }
}

// Busca todos os meios de pagamento disponíveis  
export async function getPaymentMethods() {
  try {
    const response = await apiService.get('/api/lookup/payment-methods');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar meios de pagamento:', error);
    throw error;
  }
}

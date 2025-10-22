import { apiService } from './apiService';

// Busca detalhes de pedidos e faturas
export async function getOrderDetails() {
  try {
    const response = await apiService.get('/api/orders/details');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes de pedidos:', error);
    throw error;
  }
}

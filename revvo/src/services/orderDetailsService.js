import { apiService } from './apiService';

// Busca detalhes de pedidos e faturas
export async function listOrderDetails() {
  return await apiService.get('/sales/order-details');
}

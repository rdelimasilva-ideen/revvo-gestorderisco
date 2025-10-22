import { apiService } from './apiService';

// Faz upsert de pedidos de venda SAP
export async function upsertSapSalesOrders(ordersData) {
  try {
    await apiService.post('/api/sap/sales-orders/upsert', ordersData);
    return true;
  } catch (error) {
    console.error('Erro ao fazer upsert de pedidos SAP:', error);
    throw error;
  }
}

// Faz upsert de itens de pedidos de venda SAP
export async function upsertSapSalesOrderItems(itemsData) {
  try {
    await apiService.post('/api/sap/sales-order-items/upsert', itemsData);
    return true;
  } catch (error) {
    console.error('Erro ao fazer upsert de itens SAP:', error);
    throw error;
  }
}

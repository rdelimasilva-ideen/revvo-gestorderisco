import { apiService } from './apiService';

// Busca sales orders por companyIds e opcionalmente por customerId
export async function listSalesOrders(companyIds, customerId = null) {
  const params = new URLSearchParams();
  params.append('company_ids', companyIds.join(','));
  if (customerId) {
    params.append('customer_id', customerId);
  }
  
  return await apiService.get(`/sales/sales-orders?${params.toString()}`);
}

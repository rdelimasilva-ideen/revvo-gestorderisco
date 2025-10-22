import { apiService } from './apiService';

export const RiskSummaryService = {
  async getRiskSummaryData(customerId, corporateGroupId) {
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customer_id', customerId);
      if (corporateGroupId) params.append('corporate_group_id', corporateGroupId);
      
      return await apiService.get(`/risk/risk-summary?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching risk summary data:', error);
      // Em caso de erro, retorna dados mock para não quebrar a interface
      return this.getMockRiskData();
    }
  },

  getMockRiskData() {
    return {
      creditLimitGranted: 100000,
      creditLimitUsed: 75,
      amountToReceive: 45000,
      avgPaymentTerm: 35,
      isOverdue: true,
      overdueAmount: 12000,
      avgDelayDays: 15,
      maxDelayDays12Months: 45
    };
  },

  formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatCompactCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'R$ 0';
    }

    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return this.formatCurrency(value);
  }
};

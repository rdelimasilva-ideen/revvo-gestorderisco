import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, DollarSign, BarChart as ChartBar } from 'lucide-react';

export function LimitSimulator({ customer, onSave }) {
  const [newLimit, setNewLimit] = useState(customer.currentLimit);
  const [adjustment, setAdjustment] = useState({
    newLimit: customer.currentLimit,
    impactOnRisk: 0,
    recommendedAction: 'maintain',
    newDefaultProbability: customer.defaultProbability,
  });
  const [potentialSales, setPotentialSales] = useState(0);
  const [estimatedDefault, setEstimatedDefault] = useState(0);

  // Get recommendation based on risk score
  const getRecommendation = (riskScore) => {
    switch (riskScore) {
      case 'low':
        return 'increase';
      case 'high':
        return 'decrease';
      default:
        return 'maintain';
    }
  };

  const getRecommendationText = (action) => {
    switch (action) {
      case 'increase':
        return 'Aumentar limite';
      case 'decrease':
        return 'Reduzir limite';
      default:
        return 'Manter limite';
    }
  };

  useEffect(() => {
    // Simulate risk calculation with fixed recommendation based on risk score
    const limitChange = (newLimit - customer.currentLimit) / customer.currentLimit;
    const impactOnRisk = limitChange * 10;
    const newProbability = Math.max(0, Math.min(100, customer.defaultProbability + impactOnRisk));

    // Calculate potential sales (based on historical utilization)
    const projectedUtilization = Math.min(100, customer.utilizationPercentage + (limitChange * 5));
    const newPotentialSales = (newLimit * projectedUtilization) / 100;

    // Calculate estimated default value based on risk
    const newEstimatedDefault = (newPotentialSales * newProbability) / 100;

    setPotentialSales(newPotentialSales);
    setEstimatedDefault(newEstimatedDefault);

    setAdjustment({
      newLimit,
      impactOnRisk,
      recommendedAction: getRecommendation(customer.riskScore),
      newDefaultProbability: newProbability
    });
  }, [newLimit, customer.riskScore, customer.utilizationPercentage]);

  const getRecommendationIcon = (action) => {
    switch (action) {
      case 'increase':
        return <TrendingUp className="h-5 w-5" style={{ color: '#22c55e' }} />;
      case 'decrease':
        return <TrendingDown className="h-5 w-5" style={{ color: '#ef4444' }} />;
      default:
        return <Minus className="h-5 w-5" style={{ color: '#6b7280' }} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulador de Ajuste de Limite</h3>
      <div className="space-y-6">
        {/* Limit Input Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-3">
              <label htmlFor="newLimit" className="block text-sm font-medium text-blue-900">
                Novo Limite de Crédito
              </label>
              <div className="text-sm text-blue-700">
                <span className="block">Limite Atual: </span>
                <span className="text-lg font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(customer.currentLimit)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">Limite Sugerido:</span>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="w-40 px-3 py-1 text-sm border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder={new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                  }).format(customer.currentLimit * 1.2)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getRecommendationIcon(adjustment.recommendedAction)}
              <span className="text-sm font-medium text-blue-900">
                {getRecommendationText(adjustment.recommendedAction)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <input
              type="range"
              id="newLimit"
              min={customer.currentLimit * 0.5}
              max={customer.currentLimit * 2}
              step={1000}
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-blue-700 mt-1">
              <span>-50%</span>
              <span>+100%</span>
            </div>
          </div>
        </div>

        {/* Impact Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Potential Sales Impact */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ChartBar className="h-5 w-5 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">Potencial de Vendas</h4>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-green-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(potentialSales)}
              </p>
              <p className="text-sm text-green-700">
                Baseado na utilização histórica de {customer.utilizationPercentage}%
              </p>
            </div>
          </div>

          {/* Default Risk Impact */}
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h4 className="text-sm font-medium text-red-900">Risco de Default Estimado</h4>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-red-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(estimatedDefault)}
              </p>
              <p className="text-sm text-red-700">
                Probabilidade de default: {adjustment.newDefaultProbability.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => onSave(adjustment)}
            className="px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

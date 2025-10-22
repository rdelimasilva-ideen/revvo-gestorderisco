import React from 'react';
import { Eye } from 'lucide-react';

// Função para calcular a média dos últimos 3 meses de compras
function calculateLastThreeMonthsAverage(customer) {
  if (!customer.paymentHistory || customer.paymentHistory.length === 0) return 0;
  const lastThree = customer.paymentHistory.slice(-3);
  // Supondo que cada entrada tem onTime + delayed = total compras no mês
  const sum = lastThree.reduce((acc, cur) => acc + ((cur.onTime || 0) + (cur.delayed || 0)), 0);
  return sum / (lastThree.length || 1) * (customer.averagePurchaseAmount || 0);
}

// Função para calcular dias em atraso nos últimos 3 meses
function calculateDelayedDays(customer) {
  if (!customer.paymentHistory || customer.paymentHistory.length === 0) return 0;
  const lastThree = customer.paymentHistory.slice(-3);
  return lastThree.reduce((acc, cur) => acc + (cur.delayed || 0), 0);
}

export function CustomerTable({ customers, onViewDetails }) {
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-8 flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Cliente
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Limite Atual
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Utilização
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    <div>Média Compras</div>
                    <div>Últ. 3 meses</div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    <div>Qtd. dias em atraso</div>
                    <div>últ. 3 meses</div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Risco
                  </th>
                  <th scope="col" className="relative px-3 py-3.5">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <button
                        onClick={() => onViewDetails(customer)}
                        className="text-blue-600 hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        {customer.name}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(customer.currentLimit || 0)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                      {customer.utilizationPercentage || 0}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(calculateLastThreeMonthsAverage(customer))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                      {calculateDelayedDays(customer)} dias
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRiskColor(customer.riskScore)}`}>
                        {customer.riskScore === 'low' ? 'Baixo' : customer.riskScore === 'medium' ? 'Médio' : 'Alto'}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => onViewDetails(customer)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export const mockCustomers = [
  {
    id: '1',
    name: 'Indústria Metalúrgica Silva Ltda',
    cnpj: '12.345.678/0001-01',
    currentLimit: 500000,
    utilizationPercentage: 75,
    riskScore: 'low',
    defaultProbability: 2.5,
    recommendation: 'increase',
    segment: 'industry',
    region: 'sudeste',
    status: 'active',
    averagePurchaseAmount: 125000,
    paymentHistory: [
      { month: 'Jan', onTime: 12, delayed: 0 },
      { month: 'Fev', onTime: 15, delayed: 0 },
      { month: 'Mar', onTime: 10, delayed: 1 },
      { month: 'Abr', onTime: 14, delayed: 0 },
      { month: 'Mai', onTime: 13, delayed: 0 },
      { month: 'Jun', onTime: 11, delayed: 0 }
    ]
  },
  {
    id: '2',
    name: 'Comercial Alimentos Santos SA',
    cnpj: '23.456.789/0001-02',
    currentLimit: 250000,
    utilizationPercentage: 90,
    riskScore: 'medium',
    defaultProbability: 5.8,
    recommendation: 'maintain',
    segment: 'commerce',
    region: 'sul',
    status: 'active',
    averagePurchaseAmount: 75000,
    paymentHistory: [
      { month: 'Jan', onTime: 8, delayed: 2 },
      { month: 'Fev', onTime: 9, delayed: 1 },
      { month: 'Mar', onTime: 7, delayed: 3 },
      { month: 'Abr', onTime: 10, delayed: 0 },
      { month: 'Mai', onTime: 8, delayed: 2 },
      { month: 'Jun', onTime: 9, delayed: 1 }
    ]
  },
  {
    id: '3',
    name: 'Tech Solutions Serviços EIRELI',
    cnpj: '34.567.890/0001-03',
    currentLimit: 150000,
    utilizationPercentage: 45,
    riskScore: 'low',
    defaultProbability: 1.8,
    recommendation: 'increase',
    segment: 'services',
    region: 'nordeste',
    status: 'active',
    averagePurchaseAmount: 35000,
    paymentHistory: [
      { month: 'Jan', onTime: 10, delayed: 0 },
      { month: 'Fev', onTime: 12, delayed: 0 },
      { month: 'Mar', onTime: 11, delayed: 0 },
      { month: 'Abr', onTime: 9, delayed: 1 },
      { month: 'Mai', onTime: 10, delayed: 0 },
      { month: 'Jun', onTime: 11, delayed: 0 }
    ]
  },
  {
    id: '4',
    name: 'Construtora Oliveira & Filhos',
    cnpj: '45.678.901/0001-04',
    currentLimit: 750000,
    utilizationPercentage: 95,
    riskScore: 'high',
    defaultProbability: 12.5,
    recommendation: 'decrease',
    segment: 'industry',
    region: 'centro-oeste',
    status: 'defaulter',
    averagePurchaseAmount: 250000,
    paymentHistory: [
      { month: 'Jan', onTime: 5, delayed: 5 },
      { month: 'Fev', onTime: 4, delayed: 6 },
      { month: 'Mar', onTime: 3, delayed: 7 },
      { month: 'Abr', onTime: 6, delayed: 4 },
      { month: 'Mai', onTime: 4, delayed: 6 },
      { month: 'Jun', onTime: 3, delayed: 7 }
    ]
  },
  {
    id: '5',
    name: 'Farmácia Saúde & Cia',
    cnpj: '56.789.012/0001-05',
    currentLimit: 100000,
    utilizationPercentage: 60,
    riskScore: 'medium',
    defaultProbability: 4.2,
    recommendation: 'maintain',
    segment: 'commerce',
    region: 'norte',
    status: 'active',
    averagePurchaseAmount: 30000,
    paymentHistory: [
      { month: 'Jan', onTime: 9, delayed: 1 },
      { month: 'Fev', onTime: 8, delayed: 2 },
      { month: 'Mar', onTime: 10, delayed: 0 },
      { month: 'Abr', onTime: 7, delayed: 3 },
      { month: 'Mai', onTime: 9, delayed: 1 },
      { month: 'Jun', onTime: 8, delayed: 2 }
    ]
  },
  {
    id: '6',
    name: 'Transportadora Rápida Express',
    cnpj: '67.890.123/0001-06',
    currentLimit: 300000,
    utilizationPercentage: 30,
    riskScore: 'low',
    defaultProbability: 1.5,
    recommendation: 'maintain',
    segment: 'services',
    region: 'sudeste',
    status: 'active',
    averagePurchaseAmount: 45000,
    paymentHistory: [
      { month: 'Jan', onTime: 11, delayed: 0 },
      { month: 'Fev', onTime: 10, delayed: 1 },
      { month: 'Mar', onTime: 12, delayed: 0 },
      { month: 'Abr', onTime: 11, delayed: 0 },
      { month: 'Mai', onTime: 10, delayed: 1 },
      { month: 'Jun', onTime: 11, delayed: 0 }
    ]
  },
  {
    id: '7',
    name: 'Supermercados União SA',
    cnpj: '78.901.234/0001-07',
    currentLimit: 1000000,
    utilizationPercentage: 85,
    riskScore: 'medium',
    defaultProbability: 6.8,
    recommendation: 'decrease',
    segment: 'commerce',
    region: 'sul',
    status: 'active',
    averagePurchaseAmount: 425000,
    paymentHistory: [
      { month: 'Jan', onTime: 7, delayed: 3 },
      { month: 'Fev', onTime: 8, delayed: 2 },
      { month: 'Mar', onTime: 6, delayed: 4 },
      { month: 'Abr', onTime: 9, delayed: 1 },
      { month: 'Mai', onTime: 7, delayed: 3 },
      { month: 'Jun', onTime: 8, delayed: 2 }
    ]
  },
  {
    id: '8',
    name: 'Indústria Têxtil Moderna',
    cnpj: '89.012.345/0001-08',
    currentLimit: 450000,
    utilizationPercentage: 0,
    riskScore: 'high',
    defaultProbability: 15.5,
    recommendation: 'decrease',
    segment: 'industry',
    region: 'nordeste',
    status: 'inactive',
    averagePurchaseAmount: 150000,
    paymentHistory: [
      { month: 'Jan', onTime: 2, delayed: 8 },
      { month: 'Fev', onTime: 3, delayed: 7 },
      { month: 'Mar', onTime: 1, delayed: 9 },
      { month: 'Abr', onTime: 4, delayed: 6 },
      { month: 'Mai', onTime: 2, delayed: 8 },
      { month: 'Jun', onTime: 0, delayed: 10 }
    ]
  }
];

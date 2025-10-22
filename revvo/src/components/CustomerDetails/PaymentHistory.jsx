import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Custom legend renderer with 12px font size
const renderLegend = (props) => {
  const { payload } = props;
  return (
    <ul style={{ display: 'flex', gap: 16, margin: 0, padding: 0, listStyle: 'none', fontSize: 12 }}>
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ color: entry.color, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" style={{ marginRight: 4 }}>
            <rect width="12" height="12" fill={entry.color} />
          </svg>
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

export function PaymentHistory({ customer }) {
  // Adiciona dados de compras ao histórico
  const chartData = customer.paymentHistory.map(month => ({
    ...month,
    compras: customer.averagePurchaseAmount * (0.8 + Math.random() * 0.4)
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pagamentos</h3>
      <div style={{ height: 384 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend content={renderLegend} />
            <Bar yAxisId="left" dataKey="onTime" name="Pagamentos em Dia" fill="#22c55e" />
            <Bar yAxisId="left" dataKey="delayed" name="Pagamentos Atrasados" fill="#ef4444" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="compras"
              name="Valor de Compras"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

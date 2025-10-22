import React from 'react';
export function CustomerHeader({ customer }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-2">{customer.name}</h2>
      <div className="text-gray-600">CNPJ: {customer.cnpj}</div>
    </div>
  );
}

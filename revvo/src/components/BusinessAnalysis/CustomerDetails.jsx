import React from 'react';
import { X } from 'lucide-react';
import { CustomerHeader } from '../CustomerDetails/CustomerHeader';
import { PaymentHistory } from '../CustomerDetails/PaymentHistory';
import { LimitSimulator } from '../CustomerDetails/LimitSimulator';

export function CustomerDetails({ customer, onBack }) {
  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="relative">
            <button
              onClick={onBack}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 border-none bg-transparent shadow-none outline-none focus:outline-none"
              title="Fechar"
            >
              <X className="h-6 w-6" />
            </button>
            <CustomerHeader customer={customer} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentHistory customer={customer} />
            <div className="h-full">
              <LimitSimulator customer={customer} onSave={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

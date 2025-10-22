import React from 'react';
import { X } from 'lucide-react';

const CreditAnalysisModal = ({
  isOpen,
  onClose,
  customerData,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Solicitação de Análise de Crédito</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Customer Info Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-4">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Razão Social</p>
                <p className="font-medium">{customerData?.company}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CNPJ</p>
                <p className="font-medium">{customerData?.document}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Endereço</p>
              <p className="font-medium">Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.target));
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classificação *
                </label>
                <select
                  name="classification"
                  required
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Selecione uma opção</option>
                  <option value="hospital">Hospital Pós</option>
                  <option value="clinic">Clínica Pós</option>
                  <option value="doctor">Médico Pós</option>
                  <option value="agreement">Convênio Pós</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filial *
                </label>
                <select
                  name="branch"
                  required
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Selecione uma filial</option>
                  <option value="sp">São Paulo</option>
                  <option value="rj">Rio de Janeiro</option>
                  <option value="mg">Minas Gerais</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail do Solicitante *
                </label>
                <input
                  type="email"
                  name="requesterEmail"
                  required
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone(s) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meio de Pagamento *
                </label>
                <select
                  name="paymentMethod"
                  required
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Selecione uma opção</option>
                  <option value="boleto">Boleto</option>
                  <option value="transfer">Transferência</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo de Pagamento *
                </label>
                <input
                  type="text"
                  name="paymentTerm"
                  required
                  placeholder="Ex: 30/60/90 dias"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação
                </label>
                <textarea
                  name="observation"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 leading-none flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-8 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 leading-none flex items-center justify-center"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreditAnalysisModal;

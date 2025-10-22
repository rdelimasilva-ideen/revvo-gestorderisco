import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DEFAULT_COMPANY_ID } from '../constants/defaults';
import WorkflowRuleModal from './WorkflowRuleModal';
import { listCreditLimitPolicies, createCreditLimitPolicy } from '../services/creditLimitPolicyService';

const CreditLimitPolicies = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  async function loadPolicies() {
    try {
      const data = await listCreditLimitPolicies(DEFAULT_COMPANY_ID);
      setPolicies(data || []);
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      await createCreditLimitPolicy({
        name: formData.nome,
        min_amount: formData.amt_1[0],
        max_amount: formData.amt_1[1],
        approval_roles: formData.role_id,
        company_id: DEFAULT_COMPANY_ID
      });
      await loadPolicies();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="h-full">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Política de Limites</h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Nova Política
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 p-4 border-b border-gray-200">
                <div className="font-medium text-sm text-gray-600">Nome</div>
                <div className="font-medium text-sm text-gray-600">Faixa de Valor</div>
                <div className="font-medium text-sm text-gray-600">Papéis</div>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Carregando...
                  </div>
                ) : policies.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma política cadastrada
                  </div>
                ) : (
                  policies.map((policy) => (
                    <div key={policy.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-3 items-center">
                        <div className="text-sm">{policy.name}</div>
                        <div className="text-sm">
                          {formatCurrency(policy.min_amount)} - {formatCurrency(policy.max_amount)}
                        </div>
                        <div className="flex gap-2">
                          {policy.approval_roles.map((role, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <WorkflowRuleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default CreditLimitPolicies;

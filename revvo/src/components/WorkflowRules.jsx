import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getGlobalCompanyId } from '../lib/globalState';
import WorkflowRuleModal from './WorkflowRuleModal';
import UserRoleModal from './UserRoleModal';
import { listWorkflowRules, createWorkflowRule, updateWorkflowRule, deleteWorkflowRule } from '../services/workflowRuleService';
import { listRoles } from '../services/userRoleService';

const WorkflowRules = () => {
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);

  useEffect(() => {
    loadRules();
    loadRoles();
  }, []);

  async function loadRules() {
    try {
      const data = await listWorkflowRules(getGlobalCompanyId());
      setRules(data || []);
    } catch (error) {
      console.error('Error loading workflow rules:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const data = await listRoles(getGlobalCompanyId());
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }

  const getRoleName = (roleId) => {
    if (!roleId || !Array.isArray(roles)) return '';
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : '';
  };

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      if (selectedRule) {
        // Update existing rule
        await updateWorkflowRule(selectedRule.id, {
          nome: formData.nome,
          descriptions: formData.descriptions,
          value_range: formData.value_range,
          role_id: formData.role_id,
          type_id: formData.type_id,
          subordination: formData.subordination,
          last_update: new Date().toISOString()
        });
      } else {
        // Create new rule
        await createWorkflowRule({
          nome: formData.nome,
          descriptions: formData.descriptions,
          value_range: formData.value_range,
          role_id: formData.role_id,
          company_id: getGlobalCompanyId(),
          type_id: formData.type_id,
          subordination: formData.subordination
        });
      }
      await loadRules();
      setIsWorkflowModalOpen(false);
      setSelectedRule(null);
    } catch (error) {
      console.error('Error saving workflow rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta regra?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteWorkflowRule(ruleId);
      await loadRules();
    } catch (error) {
      console.error('Error deleting workflow rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setIsWorkflowModalOpen(true);
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
          <h2 className="text-2xl font-semibold">Regras de Workflow</h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex justify-end gap-4 mb-6">
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Novo Cargo
              </button>
              <button
                onClick={() => {
                  setSelectedRule(null);
                  setIsWorkflowModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-8 py-5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Nova Regra
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-5 p-4 border-b border-gray-200">
                <div className="font-medium text-sm text-gray-600">Nome</div>
                <div className="font-medium text-sm text-gray-600">Descrição</div>
                <div className="font-medium text-sm text-gray-600">Faixa de Valores</div>
                <div className="font-medium text-sm text-gray-600">Papel</div>
                <div className="font-medium text-sm text-gray-600">Ações</div>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Carregando...
                  </div>
                ) : rules.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma regra cadastrada
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-5 items-center">
                        <div className="text-sm">{rule.nome}</div>
                        <div className="text-sm">{rule.descriptions}</div>
                        <div className="text-sm">
                          {rule.value_range && rule.value_range.length === 2 && (
                            <>
                              {formatCurrency(rule.value_range[0])} - {formatCurrency(rule.value_range[1])}
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(() => {
                            const name = rule.user_role?.name || getRoleName(rule.role_id);
                            return name ? (
                              <span
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {name}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
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
          isOpen={isWorkflowModalOpen}
          onClose={() => {
            setIsWorkflowModalOpen(false);
            setSelectedRule(null);
          }}
          onSave={handleSave}
          initialData={selectedRule}
          roles={roles} // ← Passar roles já carregados
        />

        <UserRoleModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSave={() => {
            setIsRoleModalOpen(false);
            loadRoles();
          }}
        />
      </div>
    </div>
  );
};

export default WorkflowRules;

// Exemplo de como refatorar o WorkflowRules.jsx para usar o hook
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApiRequest } from '../hooks/useApiRequest';
import { listWorkflowRules } from '../services/workflowService';
import { listRoles } from '../services/userRoleService';
import { getGlobalCompanyId } from '../lib/globalState';
// ... outros imports

const WorkflowRules = () => {
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  const companyId = getGlobalCompanyId();

  // Usar hook personalizado para evitar requisições duplicadas
  const { 
    data: rules = [], 
    loading: rulesLoading, 
    invalidateCache: invalidateRulesCache 
  } = useApiRequest(
    () => listWorkflowRules(companyId),
    [companyId],
    `workflow-rules-${companyId}`
  );

  const { 
    data: roles = [], 
    loading: rolesLoading,
    invalidateCache: invalidateRolesCache 
  } = useApiRequest(
    () => listRoles(companyId),
    [companyId],
    `user-roles-${companyId}`
  );

  const loading = rulesLoading || rolesLoading;

  const handleSave = async (formData) => {
    try {
      // ... lógica de save
      
      // Invalidar caches após mudanças
      invalidateRulesCache();
    } catch (error) {
      console.error('Error saving workflow rule:', error);
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      // ... lógica de delete
      
      // Invalidar cache após delete
      invalidateRulesCache();
    } catch (error) {
      console.error('Error deleting workflow rule:', error);
    }
  };

  // ... resto do componente
};

export default WorkflowRules;

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import styled from 'styled-components';
import { CurrencyDollar, User, Building, Phone, Envelope, X, CaretDown, CaretUp } from '@phosphor-icons/react';
import { getSession } from '../../services/sessionService';
import { DEFAULT_USER_ID } from '../../constants/defaults';
import { getGlobalCompanyId } from '../../lib/globalState';
import { createCreditLimitRequest, updateCreditLimitRequest, deleteCreditLimitRequest } from '../../services/creditLimitService';
import CustomerService from "../../services/customerService";
import { getWorkflowRules, createWorkflowSaleOrder, createWorkflowDetails } from '../../services/workflowService';
import { getCurrentUserProfile } from '../../services/userProfileService';
import { getCorporateGroupId, listCompaniesByCorporateGroup } from '../../services/companyService';
import { getClassifications, getPaymentMethods } from '../../services/lookupService';
import * as UI from '../UI/NewLimitOrderUI';

// Custom styles para react-select
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 40,
    borderRadius: 6,
    borderColor: state.isFocused ? 'var(--primary-blue, #2563eb)' : 'var(--border-color, #e5e7eb)',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(37,99,235,0.15)' : 'none',
    '&:hover': {
      borderColor: 'var(--primary-blue, #2563eb)'
    },
    background: '#fff',
    fontSize: 16,
    paddingLeft: 2,
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: 6,
    zIndex: 20,
    fontSize: 16,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  option: (provided, state) => ({
    ...provided,
    background: state.isSelected ? 'var(--primary-blue, #2563eb)' : state.isFocused ? '#f1f5f9' : '#fff',
    color: state.isSelected ? '#fff' : '#222',
    fontWeight: state.isSelected ? 600 : 400,
    cursor: 'pointer',
    fontSize: 16,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#222',
    fontWeight: 500,
    fontSize: 16,
    marginBottom: 10,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 10,
  }),
};

// Para os selects nativos, vamos estilizar com styled-components:
const StyledSelect = styled.select`
  width: 100%;
  height: 40px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e5e7eb);
  padding: 0 12px;
  font-size: 16px;
  color: var(--primary-text, #222);
  background: #fff;
  transition: border 0.2s;
  &:focus {
    outline: none;
    border-color: var(--primary-blue, #2563eb);
    box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
  }
`;

// Função utilitária para formatar como moeda BRL
function formatCurrency(value) {
  const num = Number(value.replace(/[^\d]/g, '')) / 100;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCurrency(formatted) {
  return formatted.replace(/[^\d]/g, '');
}

// Função utilitária para formatar telefone
function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    // (XX) XXXX-XXXX
    return digits.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (m, g1, g2, g3) => {
      let out = '';
      if (g1) out += `(${g1}`;
      if (g1 && g1.length === 2) out += ') ';
      if (g2) out += g2;
      if (g3) out += '-' + g3;
      return out;
    });
  } else {
    // (XX) XXXXX-XXXX
    return digits.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (m, g1, g2, g3) => {
      let out = '';
      if (g1) out += `(${g1}`;
      if (g1 && g1.length === 2) out += ') ';
      if (g2) out += g2;
      if (g3) out += '-' + g3;
      return out;
    });
  }
}

function parsePhone(formatted) {
  return formatted.replace(/\D/g, '');
}

const NewLimitOrder = ({ initialData, onClose }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState({
    classification: '',
    branch: '',
    requesterEmail: '',
    phone: '',
    paymentMethod: '',
    paymentTerm: '',
    creditLimitAmt: '',
    observation: '',
    nf_fisica: false,
    prazo_envio_oc: ''
  });
  const [userProfile, setUserProfile] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [classificationOptions, setClassificationOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [isCompanyDetailsExpanded, setIsCompanyDetailsExpanded] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        classification: initialData.silim_classific_id?.toString() || '',
        branch: initialData.branch_id?.toString() || '',
        requesterEmail: initialData.email_solicitante || '',
        phone: initialData.customer_phone_num || '',
        paymentMethod: initialData.silim_meio_pgto_id?.toString() || '',
        paymentTerm: initialData.paymt_term || '',
        creditLimitAmt: initialData.credit_limit_amt ? Math.round(initialData.credit_limit_amt * 100).toString() : '',
        observation: initialData.comment || '',
        nf_fisica: initialData.nf_fisica || false,
        prazo_envio_oc: initialData.prazo_envio_oc || ''
      });

      if (initialData.customer_id) {
        setSelectedCustomer({
          id: initialData.customer_id,
          name: initialData.customer?.name || initialData.company?.name || '',
          company: ''
        });
      }
    }
  }, [initialData]);

  // Atualizar o campo de email do solicitante com o email do usuário logado quando o perfil for carregado
  useEffect(() => {
    if (userProfile && !initialData) {
      setFormData(prev => ({
        ...prev,
        requesterEmail: userProfile.email
      }));
    }
  }, [userProfile, initialData]);

  const handleSubmitOrder = async () => {
    if (!selectedCustomer || !formData.classification || !formData.branch || !formData.paymentMethod) return;
    setLoading(true);

    const requestData = {
      company_id: getGlobalCompanyId(),
      customer_id: selectedCustomer.id,
      silim_classific_id: Number(formData.classification),
      branch_id: Number(formData.branch),
      email_solicitante: formData.requesterEmail,
      customer_phone_num: formData.phone,
      silim_meio_pgto_id: Number(formData.paymentMethod),
      paymt_term: formData.paymentTerm,
      cust_sap_id: customerDetails?.company_code || null,
      comment: formData.observation || null,
      credit_limit_amt: formData.creditLimitAmt ? Number(formData.creditLimitAmt) / 100 : null,
      status_id: 1,
      nf_fisica: formData.nf_fisica,
      prazo_envio_oc: formData.prazo_envio_oc || null
    };

    try {
      let saleOrderId;
      if (initialData) {
        const updated = await updateCreditLimitRequest(initialData.id, requestData);
        saleOrderId = updated.id;
      } else {
        const created = await createCreditLimitRequest(requestData);
        saleOrderId = created.id;
      }

      // Get workflow rules based on the credit limit amount
      const workflowRules = await getWorkflowRules(getGlobalCompanyId());

      // Find the applicable workflow rule based on the credit limit amount
      const applicableRule = workflowRules.find(rule => {
        const [minValue, maxValue] = rule.value_range;
        return requestData.credit_limit_amt >= minValue && requestData.credit_limit_amt <= maxValue;
      });

      if (!applicableRule) {
        throw new Error('Nenhuma regra de workflow encontrada para o valor solicitado');
      }

      // Create workflow_sale_order record
      const workflowOrder = await createWorkflowSaleOrder(saleOrderId);

      // Find all rules that have a lower value range than the applicable rule
      const lowerRules = workflowRules.filter(rule => {
        const [ruleMinValue] = rule.value_range;
        const [applicableMinValue] = applicableRule.value_range;
        return ruleMinValue < applicableMinValue;
      });

      // Sort lower rules by their minimum value to ensure correct step order
      lowerRules.sort((a, b) => {
        const [minA] = a.value_range;
        const [minB] = b.value_range;
        return minA - minB;
      });

      // Create workflow_details records for all required steps
      const workflowDetails = [
        // First add all lower level steps
        ...lowerRules.map((rule, index) => ({
          workflow_sale_order_id: workflowOrder.id,
          workflow_step: index + 1,
          jurisdiction_id: rule.role_id,
          started_at: index === 0 ? new Date().toISOString() : null,
          approval: null,
          approver: null,
          parecer: null,
          finished_at: null
        })),
        // Then add the final applicable rule step
        {
          workflow_sale_order_id: workflowOrder.id,
          workflow_step: lowerRules.length + 1,
          jurisdiction_id: applicableRule.role_id,
          started_at: lowerRules.length === 0 ? new Date().toISOString() : null,
          approval: null,
          approver: null,
          parecer: null,
          finished_at: null
        }
      ];

      await createWorkflowDetails(workflowDetails);

      setShowSuccessMessage(true);
      
      // Adiciona um delay de 2 segundos antes do redirecionamento
      setTimeout(() => {
        // Força o redirecionamento após 2 segundos
        window.location.href = '/sales/solicitations';
      }, 2000);
      
      // Este código é apenas fallback caso o redirecionamento acima falhe
      setTimeout(() => {
        if (onClose) {
          onClose();
          try {
            window.location.replace('/sales/solicitations');
          } catch (error) {
            console.error('Erro ao redirecionar:', error);
            document.location = '/sales/solicitations';
          }
        }
      }, 5000);
    } catch (error) {
      console.error('Error:', error);
      alert(initialData ? 'Erro ao atualizar solicitação!' : 'Erro ao enviar solicitação!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!initialData?.id) return;
    setDeleteLoading(true);
    try {
      await deleteCreditLimitRequest(initialData.id);
      setDeleteLoading(false);
      setShowDeleteModal(false);
      
      // Dispara evento para atualizar a lista de solicitações
      window.dispatchEvent(new CustomEvent('refreshMyRequests'));
      
      if (onClose) {
        onClose();
      }
      
      // Adiciona um delay de 2 segundos antes do redirecionamento
      setTimeout(() => {
        // Força o redirecionamento após 2 segundos
        window.location.href = '/sales/solicitations';
      }, 2000);
    } catch (error) {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      alert('Erro ao excluir solicitação!');
    }
  };

  // Buscar dados do usuário logado
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        // Obter a sessão atual do usuário
        const { data: { session } } = await getSession();

        if (session && session.user) {
          // Buscar o perfil do usuário logado pelo seu ID real
          const userProfile = await getCurrentUserProfile(session.user.id);
          if (userProfile) {
            setUserProfile(userProfile);
          } else {
            // Fallback: usar o email da sessão se o perfil não for encontrado
            setUserProfile({
              id: null,
              name: session.user.user_metadata?.name || 'Usuário',
              email: session.user.email
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
      }
    }
    fetchUserProfile();
  }, []);

  // Buscar detalhes do cliente selecionado
  useEffect(() => {
    async function fetchCustomerDetails() {
      if (!selectedCustomer) {
        setCustomerDetails(null);
        return;
      }
      const data = await CustomerService.getCustomerDetailsWithAddress(selectedCustomer.id);
      if (data) {
        let addressString = '';
        if (data.address && !Array.isArray(data.address)) {
          const addr = data.address;
          addressString = `${addr.street || ''}, ${addr.number || ''} - ${addr.city || ''} - ${addr.state || ''}`;
        }
        setCustomerDetails({
          ...data,
          address: addressString,
        });
      }
    }
    fetchCustomerDetails();
  }, [selectedCustomer]);

  // Buscar clientes do corporate_group do usuário logado
  useEffect(() => {
    async function fetchCustomersFromCorporateGroup() {
      try {
        // Obter a sessão atual do usuário
        const { data: { session } } = await getSession();

        if (!session || !session.user) return;

        // Buscar o perfil do usuário para obter a company_id associada
        const userProfile = await getCurrentUserProfile(session.user.id);
        
        if (!userProfile?.company_id) {
          console.error('Company_id não encontrado no perfil do usuário');
          return;
        }

        const userCompanyId = userProfile.company_id;

        // 1. Buscar o corporate_group_id da company do usuário
        const corporateGroupId = await getCorporateGroupId(userCompanyId);
        
        if (!corporateGroupId) {
          console.error('Erro ao buscar corporate_group_id');
          return;
        }

        // 2. Buscar clientes do grupo corporativo
        const customersData = await CustomerService.getCustomersByCompanyGroup(userCompanyId);

        if (!customersData) {
          console.error('Erro ao buscar customers');
          return;
        }

        setCustomerOptions(
          customersData.map((customer) => ({
            value: customer.id,
            label: customer.company_code ? `${customer.company_code} - ${customer.name}` : customer.name
          }))
        );
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    }

    fetchCustomersFromCorporateGroup();
  }, []);

  // Buscar opções dinâmicas ao carregar a tela
  useEffect(() => {
    // Classificação
    getClassifications()
      .then((data) => {
        if (data) setClassificationOptions(data.map((item) => ({ value: item.id, label: item.name })));
      })
      .catch((error) => {
        console.error('Erro ao buscar classificações:', error);
      });
    
    // Meio de Pagamento
    getPaymentMethods()
      .then((data) => {
        if (data) setPaymentMethodOptions(data.map((item) => ({ value: item.id, label: item.name })));
      })
      .catch((error) => {
        console.error('Erro ao buscar meios de pagamento:', error);
      });
    
    // Filiais (empresas do mesmo corporate_group)
    async function fetchBranches() {
      try {
        const companyId = getGlobalCompanyId();
        
        const corporateGroupId = await getCorporateGroupId(companyId);
        if (!corporateGroupId) return;
        
        const companiesData = await listCompaniesByCorporateGroup(corporateGroupId);
        if (companiesData) {
          setBranchOptions(companiesData.map((c) => ({ value: c.id, label: c.name })));
        }
      } catch (error) {
        console.error('Erro ao buscar filiais:', error);
      }
    }
    fetchBranches();
  }, []);

  return (
    <UI.FormContainer>
      <UI.HeaderContainer>
        <UI.FormTitle>{initialData ? 'Editar Solicitação de Limite de Crédito' : 'Nova Solicitação de Limite de Crédito'}</UI.FormTitle>
        {onClose && (
          <UI.CloseButton onClick={onClose}>
            <X size={24} weight="bold" />
          </UI.CloseButton>
        )}
      </UI.HeaderContainer>
      {userProfile && (
        <UI.UserInfoCard>
          <User size={24} />
          <div>
            <div style={{ fontWeight: 500 }}>{userProfile.name}</div>
            <div style={{ color: 'var(--secondary-text)', fontSize: 14 }}>{userProfile.email}</div>
          </div>
        </UI.UserInfoCard>
      )}
      {customerDetails && (
        <UI.CustomerDetailsCard isExpanded={isCompanyDetailsExpanded}>
          <div className="header" onClick={() => setIsCompanyDetailsExpanded(!isCompanyDetailsExpanded)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Building size={20} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, fontSize: 16, textAlign: 'left' }}>{customerDetails.name}</div>
                <div style={{ color: 'var(--secondary-text)', fontSize: 14, textAlign: 'left' }}>{customerDetails.company_code && `Código: ${customerDetails.company_code}`}</div>
              </div>
            </div>
            {isCompanyDetailsExpanded ? <CaretUp size={20} /> : <CaretDown size={20} />}
          </div>
          <div className="info-grid">
            <div>
              <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>Razão Social</div>
              <div style={{ fontWeight: 500 }}>{customerDetails.costumer_razao_social || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>CNPJ</div>
              <div style={{ fontWeight: 500 }}>{customerDetails.costumer_cnpj || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>Endereço</div>
              <div style={{ fontWeight: 500 }}>{customerDetails.address || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>E-mail</div>
              <div style={{ fontWeight: 500 }}>{customerDetails.costumer_email || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>Telefone</div>
              <div style={{ fontWeight: 500 }}>{customerDetails.costumer_phone || '-'}</div>
            </div>
          </div>
          <div className="contacts">
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Contatos</div>
            <div style={{ color: 'var(--secondary-text)' }}>Nenhum contato cadastrado.</div>
          </div>
        </UI.CustomerDetailsCard>
      )}

      <UI.FormCard onSubmit={(e) => {
        e.preventDefault();
        handleSubmitOrder();
      }}>
        <UI.FormSection>
          <UI.FormGroup>
            <label>Cliente *</label>
            <Select
              value={selectedCustomer ? customerOptions.find(opt => opt.value === Number(selectedCustomer.id)) || null : null}
              onChange={(option) => {
                if (option) {
                  setSelectedCustomer({ id: option.value, name: option.label, company: option.label });
                } else {
                  setSelectedCustomer(null);
                }
              }}
              options={customerOptions}
              classNamePrefix="react-select"
              placeholder="Selecione um cliente"
              isClearable
              styles={customSelectStyles}
            />
          </UI.FormGroup>
        </UI.FormSection>

        <UI.FormSection>
          <div className="grid grid-cols-2 gap-4">
            <UI.FormGroup>
              <label>Classificação *</label>
              <StyledSelect
                name="classification"
                required
                value={formData.classification}
                onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value }))}
              >
                <option value="">Selecione uma opção</option>
                {classificationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </StyledSelect>
            </UI.FormGroup>

            <UI.FormGroup>
              <label>Filial *</label>
              <StyledSelect
                name="branch"
                required
                value={formData.branch}
                onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
              >
                <option value="">Selecione uma filial</option>
                {branchOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </StyledSelect>
            </UI.FormGroup>
          </div>
        </UI.FormSection>

        <UI.FormSection>
          <div className="grid grid-cols-2 gap-4">
            {/* <FormGroup>
              <label>E-mail do Solicitante *</label>
              <input
                type="email"
                name="requesterEmail"
                required
                value={formData.requesterEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, requesterEmail: e.target.value }))}
                placeholder="exemplo@email.com"
              />
            </FormGroup> */}

            <UI.FormGroup>
              <label>Telefone(s) *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formatPhone(formData.phone)}
                onChange={e => setFormData(prev => ({ ...prev, phone: parsePhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </UI.FormGroup>
          </div>
        </UI.FormSection>

        <UI.FormSection>
          <div className="grid grid-cols-2 gap-4">
            <UI.FormGroup>
              <label>Meio de Pagamento *</label>
              <StyledSelect
                name="paymentMethod"
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <option value="">Selecione uma opção</option>
                {paymentMethodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </StyledSelect>
            </UI.FormGroup>

            <UI.FormGroup>
              <label>Prazo de Pagamento *</label>
              <input
                type="text"
                name="paymentTerm"
                required
                placeholder="Ex: 30/60/90 dias"
                value={formData.paymentTerm}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerm: e.target.value }))}
              />
            </UI.FormGroup>
          </div>
        </UI.FormSection>

        <UI.FormSection>
          <div className="grid grid-cols-2 gap-4">
            <UI.FormGroup>
              <label style={{ fontWeight: 600, fontSize: 16, color: 'var(--primary-blue)' }}>Limite Solicitado *</label>
              <input
                type="text"
                name="creditLimitAmt"
                required
                inputMode="numeric"
                value={formatCurrency(formData.creditLimitAmt)}
                onChange={e => {
                  const raw = parseCurrency(e.target.value);
                  setFormData(prev => ({ ...prev, creditLimitAmt: raw }));
                }}
                placeholder="R$ 0,00"
              />
            </UI.FormGroup>

            <UI.FormGroup>
              <label>Recebimento de NF Física</label>
              <StyledSelect
                name="nf_fisica"
                value={formData.nf_fisica ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({ ...prev, nf_fisica: e.target.value === 'true' }))}
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </StyledSelect>
            </UI.FormGroup>
          </div>
        </UI.FormSection>

        <UI.FormSection>
          <div className="grid grid-cols-2 gap-4">
            <UI.FormGroup>
              <label>Prazo para Envio da OC</label>
              <input
                type="text"
                name="prazo_envio_oc"
                value={formData.prazo_envio_oc}
                onChange={(e) => setFormData(prev => ({ ...prev, prazo_envio_oc: e.target.value }))}
                placeholder="Ex: 30 dias"
              />
            </UI.FormGroup>
          </div>
        </UI.FormSection>

        <UI.FormGroup>
          <label>Observação</label>
          <textarea
            name="observation"
            value={formData.observation}
            onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))}
            placeholder="Digite suas observações aqui..."
          />
        </UI.FormGroup>

        <UI.FormActions>
          {onClose && (
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
          )}
          {initialData && initialData.status_id === 1 && (
            <button
              type="button"
              className="cancel-button"
              style={{ color: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)' }}
              onClick={() => { console.log('Abrindo modal de exclusão'); setShowDeleteModal(true); }}
              disabled={loading || deleteLoading}
            >
              Excluir
            </button>
          )}
          <button
            type="type"
            className="submit-button"
            onClick={handleSubmitOrder}
            disabled={loading || !selectedCustomer || !formData.classification || !formData.branch || !formData.paymentMethod}
          >
            {initialData ? 'Atualizar' : 'Enviar'} Solicitação
          </button>
        </UI.FormActions>
      </UI.FormCard>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 32, minWidth: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Confirmar exclusão</div>
            <div style={{ color: 'var(--secondary-text)', marginBottom: 24 }}>Tem certeza que deseja excluir esta solicitação? Esta ação não poderá ser desfeita.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                className="cancel-button"
                style={{ height: 32, minWidth: 80 }}
                onClick={() => { console.log('Cancelou exclusão'); setShowDeleteModal(false); }}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                className="submit-button"
                style={{ background: 'var(--danger, #dc2626)', color: 'white', height: 32, minWidth: 80 }}
                onClick={() => { console.log('Tentando excluir', initialData?.id); handleDeleteOrder(); }}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {showSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 32,
            minWidth: 320,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            textAlign: 'center'
          }}>
            <div style={{
              fontWeight: 600,
              fontSize: 18,
              marginBottom: 16,
              color: 'var(--success, #059669)'
            }}>
              {initialData ? 'Solicitação atualizada com sucesso!' : 'Solicitação enviada com sucesso!'}
            </div>
            <div style={{ color: 'var(--secondary-text)' }}>
              Redirecionando...
            </div>
            <div style={{ marginTop: 20 }}>
              <a href="/sales/solicitations" 
                 style={{ 
                   display: 'inline-block',
                   padding: '8px 16px',
                   background: 'var(--primary-blue, #2563eb)',
                   color: 'white',
                   borderRadius: 6,
                   textDecoration: 'none',
                   fontWeight: 500
                 }}>
                Ir para Minhas Solicitações
              </a>
            </div>
          </div>
        </div>
      )}
    </UI.FormContainer>
  );
};

export default NewLimitOrder;

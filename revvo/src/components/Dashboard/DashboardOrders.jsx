import React, { useState, useEffect } from 'react';
import * as UI from '../UI/DashboardOrdersUI';
import { X, User, CheckCircle, Clock, Circle } from '@phosphor-icons/react';
import OrdersTable from '../OrdersTable';
import { getUser } from '../../services/authService';
import { getSession } from '../../services/sessionService';
import { getGlobalCompanyId } from '../../lib/globalState';
import { toast } from 'react-hot-toast';
import { uploadFile, getPublicUrl } from '../../services/storageService';
import { getCreditLimitRequestsByCustomer, getWorkflowSaleOrder, getWorkflowDetails } from '../../services/workflowService';
import { approveWorkflowStep, rejectWorkflowStep, startWorkflowStep, getWorkflowRules, getUserProfile } from '../../services/workflowService';
import { getCurrentUserProfile } from '../../services/userProfileService';
import { getCalculatedCreditLimit } from '../../services/creditLimitService';

const DashboardOrders = ({
  salesOrders,
  orderDetails,
  selectedInvoice,
  setSelectedInvoice,
  selectedInstallment,
  setSelectedInstallment,
  selectedDetailCard,
  // Estado para os dados do Serasa
  serasaData,
  setSelectedDetailCard,
  handleRowClick,
  handleInstallmentClick,
  mockOrderItems,
  mockDetailData
}) => {
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [showApprovedModal, setShowApprovedModal] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [creditLimit, setCreditLimit] = React.useState('');
  const [prepaidLimit, setPrepaidLimit] = React.useState('');
  const [comments, setComments] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const [customerDetails, setCustomerDetails] = React.useState(null);
  const [userCompanyId, setUserCompanyId] = React.useState(null);
  const [loadingCalculatedLimit, setLoadingCalculatedLimit] = useState(false);  const [workflowData, setWorkflowData] = useState(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState(null);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [loadingWorkflowHistory, setLoadingWorkflowHistory] = useState(false);
  const [expandedWorkflows, setExpandedWorkflows] = useState(new Set());
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  // Format currency input
  const formatCurrency = (value) => {
    const num = Number(value.replace(/[^\d]/g, '')) / 100;
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse currency input
  const parseCurrency = (formatted) => {
    return formatted.replace(/[^\d]/g, '');
  };

  const handleSaveAnalysis = async () => {
    if (!selectedDetailCard?.customer_id) {
      toast.error('Nenhum cliente selecionado');
      return;
    }
    try {
      setSaving(true);
      const { data: { user } } = await getUser();
      const userProfile = await getUserProfile(user.id);
      if (!userProfile) throw new Error('Perfil de usuário não encontrado');
      const workflowRules = await getWorkflowRules(getGlobalCompanyId());
      if (!workflowRules || workflowRules.length === 0) throw new Error('Nenhuma regra de workflow encontrada');
      const currentStepRule = workflowRules.find(rule => rule.role_id === selectedWorkflowStep.jurisdiction_id);
      if (!currentStepRule) throw new Error('Regra de workflow não encontrada para a etapa atual');
      if (userProfile.role_id === 1) {
        await approveWorkflowStep({ stepId: selectedWorkflowStep.id, approverId: user.id, comments });
        const previousSteps = workflowData.details.filter(detail => detail.workflow_step < selectedWorkflowStep.workflow_step);
        for (const step of previousSteps) {
          const stepRule = workflowRules.find(rule => rule.role_id === step.jurisdiction_id);
          if (!stepRule) continue;
          if ((stepRule.subordination && userRoleRule.value_range[0] > stepRule.value_range[0]) || stepRule.value_range[0] < currentStepRule.value_range[0]) {
            await approveWorkflowStep({ stepId: step.id, approverId: user.id, comments });
          }
        }
        const nextStep = workflowData.details.find(detail => detail.workflow_step === selectedWorkflowStep.workflow_step + 1);
        if (nextStep) await startWorkflowStep(nextStep.id);
        await fetchWorkflowData(selectedDetailCard.id);
        setShowApprovalModal(false);
        setSelectedWorkflowStep(null);
        setShowApprovedModal(true);
        setComments('');
        return;
      }
      const userRoleRule = workflowRules.find(rule => rule.role_id === userProfile.role_id);
      if (!userRoleRule) throw new Error('Regra de workflow não encontrada para o seu cargo');
      const canApprove = userProfile.role_id === selectedWorkflowStep.jurisdiction_id || (userRoleRule.value_range[0] > currentStepRule.value_range[0] && currentStepRule.subordination);
      if (!canApprove) {
        toast.error('Você não tem permissão para aprovar esta etapa');
        return;
      }
      await approveWorkflowStep({ stepId: selectedWorkflowStep.id, approverId: user.id, comments });
      const previousSteps = workflowData.details.filter(detail => detail.workflow_step < selectedWorkflowStep.workflow_step);
      for (const step of previousSteps) {
        const stepRule = workflowRules.find(rule => rule.role_id === step.jurisdiction_id);
        if (!stepRule) continue;
        if ((stepRule.subordination && userRoleRule.value_range[0] > stepRule.value_range[0]) || stepRule.value_range[0] < currentStepRule.value_range[0]) {
          await approveWorkflowStep({ stepId: step.id, approverId: user.id, comments });
        }
      }
      const nextStep = workflowData.details.find(detail => detail.workflow_step === selectedWorkflowStep.workflow_step + 1);
      if (nextStep) await startWorkflowStep(nextStep.id);
      await fetchWorkflowData(selectedDetailCard.id);
      setShowApprovalModal(false);
      setSelectedWorkflowStep(null);
      setShowApprovedModal(true);
      setComments('');
    } catch (error) {
      console.error('Error approving workflow step:', error);
      toast.error(error.message || 'Erro ao aprovar etapa do workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectAnalysis = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await getUser();
      const userProfile = await getUserProfile(user.id);
      if (!userProfile) throw new Error('Perfil de usuário não encontrado');
      const workflowRules = await getWorkflowRules(getGlobalCompanyId());
      if (!workflowRules || workflowRules.length === 0) throw new Error('Nenhuma regra de workflow encontrada');
      const currentStepRule = workflowRules.find(rule => rule.role_id === selectedWorkflowStep.jurisdiction_id);
      if (!currentStepRule) throw new Error('Regra de workflow não encontrada para a etapa atual');
      if (userProfile.role_id === 1) {
        await rejectWorkflowStep({ stepId: selectedWorkflowStep.id, approverId: user.id, comments });
        const previousSteps = workflowData.details.filter(detail => detail.workflow_step < selectedWorkflowStep.workflow_step);
        for (const step of previousSteps) {
          await rejectWorkflowStep({ stepId: step.id, approverId: user.id, comments: 'Rejeitado automaticamente pelo administrador' });
        }
        await fetchWorkflowData(selectedDetailCard.id);
        setShowApprovalModal(false);
        setSelectedWorkflowStep(null);
        setComments('');
        return;
      }
      const userRoleRule = workflowRules.find(rule => rule.role_id === userProfile.role_id);
      if (!userRoleRule) throw new Error('Regra de workflow não encontrada para o seu cargo');
      const canReject = userProfile.role_id === selectedWorkflowStep.jurisdiction_id || (userRoleRule.value_range[0] > currentStepRule.value_range[0] && currentStepRule.subordination);
      if (!canReject) {
        toast.error('Você não tem permissão para rejeitar esta etapa');
        return;
      }
      await rejectWorkflowStep({ stepId: selectedWorkflowStep.id, approverId: user.id, comments });
      if (currentStepRule.subordination && userRoleRule.value_range[0] > currentStepRule.value_range[0]) {
        const previousSteps = workflowData.details.filter(detail => detail.workflow_step < selectedWorkflowStep.workflow_step);
        for (const step of previousSteps) {
          await rejectWorkflowStep({ stepId: step.id, approverId: user.id, comments: 'Rejeitado automaticamente por subordinação' });
        }
      }
      await fetchWorkflowData(selectedDetailCard.id);
      setShowApprovalModal(false);
      setSelectedWorkflowStep(null);
      setComments('');
    } catch (error) {
      console.error('Error rejecting workflow step:', error);
      toast.error(error.message || 'Erro ao rejeitar etapa do workflow');
    } finally {
      setSaving(false);
    }
  };

  // Função para fazer upload de arquivos
    const handleFileUpload = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const customerId = selectedCustomer;
      if (!customerId) {
        alert('Selecione um cliente primeiro!');
        return;
      }
      try {
        setUploading(true);
        const { data: { session } } = await getSession();
        if (!session || !session.user) {
          throw new Error('Usuário não autenticado');
        }
        
        const userProfile = await getCurrentUserProfile(session.user.id);
        if (!userProfile?.company_id) {
          throw new Error('Não foi possível obter a company_id do usuário');
        }
        
        const userCompanyId = userProfile.company_id;
        const customerIdString = customerId.toString();
        const basePath = `${userCompanyId}/${customerIdString}`;
        const uploadedFilesList = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = `${basePath}/${Date.now()}_${file.name}`;
          await uploadFile('financial-analysis', filePath, file);
          const publicUrl = await getPublicUrl('financial-analysis', filePath);
          uploadedFilesList.push({
            name: file.name,
            path: filePath,
            url: publicUrl,
            size: file.size,
            type: file.type
          });
        }
        setUploadedFiles(prev => [...prev, ...uploadedFilesList]);
        e.target.value = null;
        alert(`${uploadedFilesList.length} arquivo(s) carregado(s) com sucesso!`);
      } catch (error) {
        console.error('Erro ao fazer upload de arquivos:', error);
        alert(`Erro ao fazer upload: ${error.message}`);
      } finally {
        setUploading(false);
      }
    };

  const handleLoadCalculatedLimit = async () => {
    if (!selectedDetailCard?.customer_id) return;
    setLoadingCalculatedLimit(true);
    try {
      const limit = await getCalculatedCreditLimit(selectedDetailCard.customer_id);
      if (limit !== null) {
        const formattedLimit = limit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setCreditLimit(formattedLimit);
      }
    } catch (error) {
      console.error('Error loading calculated limit:', error);
      toast.error('Erro ao carregar limite calculado');
    } finally {
      setLoadingCalculatedLimit(false);
    }
  };

  const fetchWorkflowData = async (creditLimitReqId) => {
    if (!creditLimitReqId) return;
    setLoadingWorkflow(true);
    try {
      const workflowOrder = await getWorkflowSaleOrder(creditLimitReqId);
      if (workflowOrder) {
        const workflowDetails = await getWorkflowDetails(workflowOrder.id);
        setWorkflowData({ order: workflowOrder, details: workflowDetails });
      }
    } catch (error) {
      console.error('Error fetching workflow data:', error);
      toast.error('Erro ao carregar dados do workflow');
    } finally {
      setLoadingWorkflow(false);
    }
  };
  // Effect to fetch workflow data when selectedDetailCard changes
  React.useEffect(() => {
    if (selectedDetailCard?.id) {
      fetchWorkflowData(selectedDetailCard.id);
    }
  }, [selectedDetailCard]);

  // Function to fetch workflow history
  const fetchWorkflowHistory = async (customerId) => {
    if (!customerId) return;
    setLoadingWorkflowHistory(true);
    try {
      // Get all credit limit requests for this customer
      const creditRequests = await getCreditLimitRequestsByCustomer(customerId);
      if (creditRequests?.length > 0) {
        const workflowHistoryData = [];
        for (const request of creditRequests) {
          // Get workflow_sale_order
          const workflowOrder = await getWorkflowSaleOrder(request.id);
          if (!workflowOrder) continue;
          // Get workflow details with jurisdiction information
          const workflowDetails = await getWorkflowDetails(workflowOrder.id);
          workflowHistoryData.push({
            id: workflowOrder.id,
            creditRequest: request,
            workflowOrder: workflowOrder,
            details: workflowDetails || [],
            created_at: request.created_at,
            computedStatus: workflowDetails?.every(d => d.approval === true) ? 'approved' :
                           workflowDetails?.some(d => d.approval === false) ? 'rejected' : 'pending'
          });
        }
        setWorkflowHistory(workflowHistoryData);
      } else {
        setWorkflowHistory([]);
      }
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      setWorkflowHistory([]);
    } finally {
      setLoadingWorkflowHistory(false);
    }
  };

  const toggleWorkflowExpansion = (workflowId) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
  };

  const handleWorkflowStepClick = (step) => {
    setSelectedWorkflowStep(step);
    setShowWorkflowModal(true);
  };

  // Effect to fetch workflow history when selectedDetailCard changes
  React.useEffect(() => {
    if (selectedDetailCard?.customer?.id || selectedDetailCard?.customer_id) {
      const customerId = selectedDetailCard.customer?.id || selectedDetailCard.customer_id;
      fetchWorkflowHistory(customerId);
    }
  }, [selectedDetailCard]);

  return (
    <>
      <UI.CaixaEntradaContainer>
        <h3 style={{ marginBottom: '16px' }}>Visão Geral de Risco</h3>

        <UI.RequestsContainer>
          {selectedDetailCard ? (
            <>
              <UI.RequestCard
                className="selected"
              >
                <div style={{ marginBottom: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {selectedDetailCard.customer?.name || (selectedDetailCard.status ? selectedDetailCard.customer?.name : 'N/A')}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: 'rgba(62, 182, 85, 0.1)',
                    color: '#3EB655',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#3EB655',
                      display: 'inline-block'
                    }}></span>
                    {selectedDetailCard.status?.name || 'Aprovado'}
                  </div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px' }}>
                      {new Date(selectedDetailCard.created_at).toLocaleDateString('pt-BR')}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>
                      {selectedDetailCard.status ?
                        `Solicitação #${selectedDetailCard.id}` :
                        `Venc.: ${selectedDetailCard.due_date ? new Date(selectedDetailCard.due_date).toLocaleDateString('pt-BR') : 'N/A'}`}
                  </div>
                </div>



                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Limite solicitado</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    R$ {(selectedDetailCard.total_amt || selectedDetailCard.credit_limit_amt)?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>
                    {selectedDetailCard.status ? 'Solicitado por:' : 'Condição de pagamento'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>
                    {selectedDetailCard.email_solicitante || 'N/A'}
                  </div>
                </div>
                <div className='items-section' style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Limite calculado</div>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}> R$ 250.000,00</div>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '20px' }}>
                      {new Date(selectedDetailCard.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className='items-section' style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Limite atual</div>
                    <div style={{ fontSize: '14px' }}>R$ 70.000,00</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>% utilizado</div>
                    <div style={{ fontSize: '14px' }}>45%</div>
                  </div>
                </div>

                <div className="items-section">
                  <h4 style={{ fontSize: '13px', color: 'black', marginBottom: '12px', fontWeight: '500' }}>
                    Workflow de Aprovação
                  </h4>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'}}>
                    {loadingWorkflow ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--secondary-text)' }}>
                        Carregando workflow...
                      </div>
                    ) : workflowData?.details ? (
                      workflowData.details.map((detail, index) => (                        <div
                          key={detail.id}
                          onClick={() => {
                            if (detail.approval === null) {
                              setSelectedWorkflowStep(detail);
                              setShowApprovalModal(true);
                            } else {
                              setSelectedWorkflowStep(detail);
                              setShowViewModal(true);
                            }
                          }}
                          style={{
                            padding: '8px',
                            background: 'white',
                            borderRadius: '4px',
                            border: detail.approval === null ? '1px solid var(--primary-blue)' : '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>{detail.jurisdiction?.name || 'N/A'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>
                              {detail.approval === null ? 'Pendente' :
                               detail.approval ? 'Aprovado' : 'Rejeitado'}
                            </div>
                          </div>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: detail.approval === null ? 'var(--border-color)' :
                                      detail.approval ? 'var(--success)' : '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{ color: 'white', fontSize: '10px' }}>
                              {detail.approval === null ? '!' :
                               detail.approval ? '✓' : '✕'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--secondary-text)' }}>
                        Nenhum workflow encontrado
                      </div>
                    )}
                  </div>
                </div>
              </UI.RequestCard>

              <UI.DetailView>
                {serasaData ? (
                  <div className="detail-grid">
                    <div className="detail-section">
                      <h4>Síntese Cadastral</h4>
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Documento</div>
                          <div style={{ fontSize: '14px' }}>{serasaData.SinteseCadastral?.Documento}</div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Nome</div>
                          <div style={{ fontSize: '14px' }}>{serasaData.SinteseCadastral?.Nome}</div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Data Fundação</div>
                          <div style={{ fontSize: '14px' }}>{serasaData.SinteseCadastral?.DataFundacao}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Situação RFB</div>
                          <div style={{ fontSize: '14px' }}>{serasaData.SinteseCadastral?.SituacaoRFB}</div>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section score-section">
                      <h4>Score Serasa</h4>
                      <div className="score-value">{serasaData.SerasaScoreEmpresas?.Score}</div>
                      <div className="score-label">{serasaData.SerasaScoreEmpresas?.Classificacao}</div>
                    </div>

                    <div className="detail-section">
                      <h4>
                        Pendências Financeiras
                        <span className="occurrence-count">{serasaData.PendenciasFinanceiras?.TotalOcorrencias}</span>
                      </h4>
                      {serasaData.PendenciasFinanceiras?.PendenciasFinanceirasDetalhe?.map((item, index) => (
                        <div key={index} className="occurrence-item">
                          <div className="date">{item.DataOcorrencia}</div>
                          <div className="value">R$ {item.Valor}</div>
                          <div className="details">{item.TipoAnotacaoDescricao}</div>
                        </div>
                      ))}
                    </div>

                    <div className="detail-section">
                      <h4>
                        Protestos
                        <span className="occurrence-count">{serasaData.Protestos?.TotalOcorrencias}</span>
                      </h4>
                      {serasaData.Protestos?.ProtestosDetalhe?.map((item, index) => (
                        <div key={index} className="occurrence-item">
                          <div className="date">{item.DataOcorrencia}</div>
                          <div className="value">R$ {item.Valor}</div>
                          <div className="details">{item.Cidade} - {item.Estado}</div>
                        </div>
                      ))}
                    </div>

                    <div className="detail-section">
                      <h4>
                        Ações Judiciais
                        <span className="occurrence-count">{serasaData.AcoesJudiciais?.TotalOcorrencias}</span>
                      </h4>
                      <div className="no-occurrences">{serasaData.AcoesJudiciais?.Mensagem}</div>
                    </div>

                    <div className="detail-section">
                      <h4>
                        Participações em Falências
                        <span className="occurrence-count">{serasaData.ParticipacoesFalencias?.TotalOcorrencias}</span>
                      </h4>
                      <div className="no-occurrences">{serasaData.ParticipacoesFalencias?.Mensagem}</div>
                    </div>

                    <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                      <h4>Sócios e Administradores</h4>
                      {serasaData.SociosAdministradores?.map((socio, index) => (
                        <div key={index} className="occurrence-item">
                          <div className="value">{socio.Nome}</div>
                          <div className="details">
                            CPF: {socio.CPF} • Participação: {socio.Participacao}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '40px',
                    backgroundColor: '#f9fafb',
                    color: 'var(--secondary-text)',
                    borderRadius: '8px',
                    minHeight: '400px'
                  }}>
                    Área reservada para exibição dos dados da consulta Serasa.
                  </div>
                )}
              </UI.DetailView>
            </>
          ) : (
            salesOrders.slice(0, 5).map(order => (
              <UI.RequestCard
                key={order.id}
                onClick={() => {
                  setSelectedDetailCard(order);
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{order.customer?.name || 'N/A'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px' }}>
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Valor</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    R$ {order.total_amt?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Condição de pagamento</div>
                  <div style={{ fontSize: '14px' }}>30/60/90 dias</div>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>
                    Venc.: {order.due_date ? new Date(order.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Limite disponível</div>
                  <div style={{ fontSize: '14px' }}>R$ 500.000,00</div>
                </div>
              </UI.RequestCard>
            ))
          )}
        </UI.RequestsContainer>
      </UI.CaixaEntradaContainer>

      {selectedDetailCard && (
        <UI.HistoryAnalysisContainer>        <UI.CustomerHistory>
          {/* Histórico de Workflow do Cliente */}
          <h4 style={{ marginBottom: '16px', color: 'black', fontWeight: '500'}}>Histórico de Workflow do cliente</h4>

          {loadingWorkflowHistory ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: 'var(--secondary-text)'
            }}>
              Carregando histórico...
            </div>
          ) : workflowHistory.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: 'var(--secondary-text)'
            }}>
              Nenhum histórico de workflow encontrado
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {workflowHistory.map((workflow, index) => {
                const isExpanded = expandedWorkflows.has(workflow.workflowOrder?.id);
                const hasDetails = workflow.details && workflow.details.length > 0;

                // Determine status colors
                const getStatusColor = (status) => {
                  switch (status?.toLowerCase()) {
                    case 'approved':
                    case 'aprovado':
                      return { bg: 'rgba(62, 182, 85, 0.1)', color: '#3EB655' };
                    case 'rejected':
                    case 'rejeitado':
                      return { bg: 'rgba(225, 29, 72, 0.1)', color: '#E11D48' };
                    case 'pending':
                    case 'pendente':
                      return { bg: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' };
                    default:
                      return { bg: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' };
                  }
                };

                const statusColors = getStatusColor(workflow.computedStatus);

                // Translate status from English to Portuguese
                const translateStatus = (status) => {
                  switch (status?.toLowerCase()) {
                    case 'approved':
                      return 'Aprovado';
                    case 'rejected':
                      return 'Rejeitado';
                    case 'pending':
                      return 'Pendente';
                    default:
                      return 'Em análise';
                  }
                };

                const formatDate = (dateString) => {
                  if (!dateString) return 'Data não disponível';
                  try {
                    return new Date(dateString).toLocaleString('pt-BR');
                  } catch {
                    return 'Data inválida';
                  }
                };

                return (
                  <div key={workflow.workflowOrder?.id || index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: statusColors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: statusColors.color,
                      }}></div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>
                          Solicitação de Limite de Crédito
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>
                          {formatDate(workflow.creditRequest?.created_at)}
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: 'var(--background)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div>Status:</div>
                          <div style={{ fontWeight: '500', color: statusColors.color }}>
                            {translateStatus(workflow.computedStatus)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div>Valor Solicitado:</div>
                          <div style={{ fontWeight: '500' }}>
                            {workflow.creditRequest?.credit_limit_amt
                              ? `R$ ${parseFloat(workflow.creditRequest.credit_limit_amt).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}`
                              : 'N/A'
                            }
                          </div>
                        </div>

                        {hasDetails && (
                          <div style={{ marginTop: '8px' }}>
                            <button
                              onClick={() => toggleWorkflowExpansion(workflow.workflowOrder.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: statusColors.color,
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                padding: '0',
                                textDecoration: 'underline'
                              }}
                            >
                              {isExpanded ? 'Ocultar detalhes' : `Ver detalhes (${workflow.details.length} etapas)`}
                            </button>
                          </div>
                        )}
                      </div>

                      {isExpanded && hasDetails && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--secondary-text)' }}>
                            Etapas do Workflow:
                          </div>
                          {workflow.details.map((detail, detailIndex) => (
                            <div
                              key={detail.id || detailIndex}
                              onClick={() => handleWorkflowStepClick(detail)}
                              style={{
                                backgroundColor: 'var(--background)',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                marginBottom: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(79, 70, 229, 0.05)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--background)'}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: '500' }}>
                                  {detail.jurisdiction?.name || `Etapa ${detailIndex + 1}`}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  color: 'var(--secondary-text)',
                                  fontStyle: 'italic'
                                }}>
                                  Clique para ver detalhes
                                </div>
                              </div>
                              {detail.created_at && (
                                <div style={{ fontSize: '11px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                                  {formatDate(detail.created_at)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </UI.CustomerHistory>
        <UI.FinancialAnalysisContainer>
          <h4>Análise Financeira</h4>
          <button
            className="load-calculated-limit"
            onClick={handleLoadCalculatedLimit}
            disabled={loadingCalculatedLimit || !selectedDetailCard?.customer_id}
          >
            {loadingCalculatedLimit ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Carregando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Carregar limite calculado
              </>
            )}
          </button>

          <div className="form-group">
            <label htmlFor="creditLimit">Limite de Crédito a Conceder</label>
            <div className="prefix">
              <input
                type="text"
                id="creditLimit"
                placeholder="0,00"
                value={creditLimit}
                onChange={(e) => setCreditLimit(formatCurrency(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="prepaidLimit">Limite Pré-Pago</label>
            <div className="prefix">
              <input
                type="text"
                id="prepaidLimit"
                placeholder="0,00"
                value={prepaidLimit}
                onChange={(e) => setPrepaidLimit(formatCurrency(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="analysisComments">Comentários e Análise</label>
            <textarea
              id="analysisComments"
              placeholder="Digite aqui os comentários e análise financeira para esta solicitação..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            ></textarea>
          <div className="file-upload">
                  <label className="upload-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Anexar arquivo
                    <input type="file" multiple onChange={handleFileUpload} />
                  </label>

                  <div className="file-list">
                    {uploadedFiles.map((file, index) => (
                      <div className="file-item" key={index}>
                        <div className="file-name">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          {file.name}
                        </div>
                        <div className="file-actions">
                          <button title="Baixar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </button>
                          <button title="Excluir" className="delete" onClick={() => handleDeleteFile(index)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

          <div className="button-group">
            <button className="secondary">Cancelar</button>
            <button
              className="primary"
              onClick={handleSaveAnalysis}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </UI.FinancialAnalysisContainer>
        </UI.HistoryAnalysisContainer>
      )}

      {/* Orders Table Section */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginTop: selectedDetailCard ? '24px' : '0'
      }}>
        <OrdersTable
          orders={orderDetails}
          onRowClick={handleRowClick}
          selectedOrder={selectedInvoice}
          onInstallmentClick={handleInstallmentClick}
          selectedInstallment={selectedInstallment}
        />
      </div>      {/* Approval Modal */}
      {showApprovalModal && (
        <UI.Modal>          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Aprovação {selectedWorkflowStep?.jurisdiction?.name || 'Comercial'}</h2><button
                className="close-button"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedWorkflowStep(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-field">
              <div className="label">Alçada</div>
              <div>{selectedWorkflowStep?.jurisdiction?.name || 'Não definida'}</div>
            </div>

            <div className="form-field">
              <div className="label">Data de Recebimento</div>
              <div>{selectedWorkflowStep?.started_at ?
                new Date(selectedWorkflowStep.started_at).toLocaleString('pt-BR') :
                '15/03/2024, 09:30:00'}</div>
            </div>            <div className="form-field">
              <div className="label">Data de Conclusão</div>
              <div>{selectedWorkflowStep?.finished_at ?
                new Date(selectedWorkflowStep.finished_at).toLocaleString('pt-BR') :
                'Pendente'}</div>
            </div>

            <div className="form-field">
              <div className="label">Parecer</div>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Digite seu parecer..."
              />
            </div>

            <div className="actions">
              <button
                className="reject"
                onClick={handleRejectAnalysis}
                disabled={saving}
              >
                {saving ? 'Rejeitando...' : 'Rejeitar'}
              </button>
              <button
                className="approve"
                onClick={handleSaveAnalysis}
                disabled={saving}
              >
                {saving ? 'Aprovando...' : 'Aprovar'}
              </button>
            </div>
          </div>
        </UI.Modal>
      )}

      {/* Approved Modal */}
      {showApprovedModal && (
        <UI.Modal>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">ETAPA APROVADA</h2>
              <button
                className="close-button"
                onClick={() => setShowApprovedModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-field">
              <div className="label">Alçada</div>
              <div>RESPONSÁVEL</div>
            </div>

            <div className="form-field">
              <div className="label">Data de Recebimento</div>
              <div>15/03/2024, 09:30:00</div>
            </div>

            <div className="form-field">
              <div className="label">Prazo</div>
              <div>15/03/2024, 13:30:00</div>
            </div>

            <div className="form-field">
              <div className="label">Parecer</div>
              <p
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  resize: 'vertical'
                }}
              >PARECER DEFINIDO</p>
            </div>
          </div>
        </UI.Modal>
      )}

      {/* View Completed Step Modal */}
      {showViewModal && (
        <UI.Modal>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Detalhes da Etapa {selectedWorkflowStep?.jurisdiction?.name || 'Comercial'}</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedWorkflowStep(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-field">
              <div className="label">Alçada</div>
              <div>{selectedWorkflowStep?.jurisdiction?.name || 'Não definida'}</div>
            </div>

            <div className="form-field">
              <div className="label">Data de Recebimento</div>
              <div>{selectedWorkflowStep?.started_at ?
                new Date(selectedWorkflowStep.started_at).toLocaleString('pt-BR') :
                'N/A'}</div>
            </div>

            <div className="form-field">
              <div className="label">Data de Conclusão</div>
              <div>{selectedWorkflowStep?.finished_at ?
                new Date(selectedWorkflowStep.finished_at).toLocaleString('pt-BR') :
                'N/A'}</div>
            </div>

            <div className="form-field">
              <div className="label">Status</div>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: selectedWorkflowStep?.approval ? 'rgba(62, 182, 85, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                color: selectedWorkflowStep?.approval ? '#3EB655' : '#DC2626',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {selectedWorkflowStep?.approval ? 'Aprovado' : 'Rejeitado'}
              </div>
            </div>

            <div className="form-field">
              <div className="label">Parecer</div>
              <div style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background)',
                fontSize: '14px',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedWorkflowStep?.comments || 'Nenhum parecer registrado'}
              </div>
            </div>
          </div>
        </UI.Modal>
      )}

      {/* Workflow Step Details Modal - Para histórico do workflow */}
      {showWorkflowModal && selectedWorkflowStep && (
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
            borderRadius: '8px',
            padding: '32px',
            minWidth: '500px',
            maxWidth: '600px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontWeight: '600',
                fontSize: '18px',
                color: 'var(--primary-text)'
              }}>
                Detalhes da Etapa: {selectedWorkflowStep.jurisdiction?.name || 'N/A'}
              </h2>
              <button
                onClick={() => {
                  setShowWorkflowModal(false);
                  setSelectedWorkflowStep(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--secondary-text)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--secondary-text)',
                    marginBottom: '4px'
                  }}>
                    Etapa do Workflow
                  </label>
                  <div style={{ fontSize: '14px' }}>
                    {selectedWorkflowStep.workflow_step || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--secondary-text)',
                    marginBottom: '4px'
                  }}>
                    Status
                  </label>
                  <div style={{
                    fontSize: '14px',
                    color: selectedWorkflowStep.approval === null ? '#EA580C' :
                           selectedWorkflowStep.approval === true ? '#3EB655' : '#E11D48'
                  }}>
                    {selectedWorkflowStep.approval === null ? 'Pendente' :
                     selectedWorkflowStep.approval === true ? 'Aprovado' : 'Rejeitado'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--secondary-text)',
                    marginBottom: '4px'
                  }}>
                    Data de Início
                  </label>
                  <div style={{ fontSize: '14px' }}>
                    {selectedWorkflowStep.started_at ?
                      new Date(selectedWorkflowStep.started_at).toLocaleString('pt-BR') :
                      'Não iniciado'
                    }
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--secondary-text)',
                    marginBottom: '4px'
                  }}>
                    Data de Conclusão
                  </label>
                  <div style={{ fontSize: '14px' }}>
                    {selectedWorkflowStep.finished_at ?
                      new Date(selectedWorkflowStep.finished_at).toLocaleString('pt-BR') :
                      'Pendente'
                    }
                  </div>
                </div>
              </div>

              {selectedWorkflowStep.approver && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--secondary-text)',
                    marginBottom: '4px'
                  }}>
                    Aprovador
                  </label>
                  <div style={{ fontSize: '14px' }}>
                    {selectedWorkflowStep.approver}
                  </div>
                </div>
              )}

              {selectedWorkflowStep.comments && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--secondary-text)',
                    marginBottom: '4px'
                  }}>
                    Parecer
                  </label>
                  <div style={{
                    fontSize: '14px',
                    backgroundColor: 'var(--background)',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedWorkflowStep.comments}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => {
                  setShowWorkflowModal(false);
                  setSelectedWorkflowStep(null);
                }}
                style={{
                  padding: '0px 16px',
                  backgroundColor: 'var(--primary-blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardOrders;

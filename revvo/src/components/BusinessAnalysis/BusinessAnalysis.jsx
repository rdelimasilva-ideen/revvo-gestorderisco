import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getSession } from '../../services/sessionService';
import { CustomerService } from '../../services';
import { SAPRiskService, SAPBillingService, SAPScoreService } from '../../services/OptimizedSAPServices';
import { SAPCustomerService } from '../../services/SAPCustomerService';
import OrdersTable from '../OrdersTable';
import { CustomerTable, mockCustomers } from './CustomerTable';
import { CustomerDetails } from './CustomerDetails';
import { uploadFile, getPublicUrl, removeFile } from '../../services/storageService';
import { getUserCompanyId, getCorporateGroupId as getGroupId, getCustomerById, getAddressById, getCompaniesByCorporateGroup, getSalesOrders } from '../../services/businessAnalysisService';
import { getWorkflowHistory } from '../../services/workflowHistoryService';
import * as UI from '../UI/BusinessAnalysisUI';

const BusinessAnalysis = () => {
  // State para os dados do Serasa
  const [serasaData, setSerasaData] = useState(null);

  const CACHE_DURATION = 5 * 60 * 1000;

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customers, setCustomers] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [monthlyBilling, setMonthlyBilling] = useState([]);
  const [paymentTermScoreData, setPaymentTermScoreData] = useState([]);
  const [billingMetrics, setBillingMetrics] = useState({
    currentAverage: 0,
    variationPercentage: 0
  });
  const [scoreMetrics, setScoreMetrics] = useState({
    currentScore: 0,
    scoreVariation: 0
  });
  const [companyName, setCompanyName] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [isExpandedDetails, setIsExpandedDetails] = useState(false);
  const [creditLimit, setCreditLimit] = useState('');
  const [prepaidLimit, setPrepaidLimit] = useState('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [loadingRiskData, setLoadingRiskData] = useState(false);
  const [creditLimitsId, setCreditLimitsId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [userCompanyId, setUserCompanyId] = useState(null);
  const [corporateGroupId, setCorporateGroupId] = useState(null);
  const [loadingCalculatedLimit, setLoadingCalculatedLimit] = useState(false);

  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [loadingWorkflowHistory, setLoadingWorkflowHistory] = useState(false);
  const [expandedWorkflows, setExpandedWorkflows] = useState(new Set());
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState(null);

  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [riskSummaryData, setRiskSummaryData] = useState({
    creditLimitGranted: 0,
    creditLimitUsed: 0,
    amountToReceive: 0,
    avgPaymentTerm: 0,
    isOverdue: false,
    overdueAmount: 0,
    avgDelayDays: 0,
    maxDelayDays12Months: 0,
    maxCurrentDelayDays: 0
  });

  const [dataCache, setDataCache] = useState(new Map());
  const abortControllerRef = useRef(null);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  const getCacheKey = (type, customerId) => `${type}-${customerId || 'all'}`;

  const getCachedData = useCallback((key) => {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [dataCache]);

  const setCachedData = useCallback((key, data) => {
    setDataCache(prev => new Map(prev.set(key, {
      data,
      timestamp: Date.now()
    })));
  }, []);

  const clearCache = useCallback(() => {
    setDataCache(new Map());
    SAPBillingService.clearCache();
    SAPRiskService.clearCache();
    SAPScoreService.clearCache();
  }, []);

  const formatCurrency = (value) => {
    const num = Number(value.replace(/[^\d]/g, '')) / 100;
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrency = (formatted) => {
    return formatted.replace(/[^\d]/g, '');
  };

  const formatVariationDisplay = (variation, isScore = false) => {
    const isPositive = variation >= 0;
    const color = isPositive ? 'var(--success)' : 'var(--error)';
    const sign = isPositive ? '+' : '';
    const suffix = isScore ? ' pts' : '%';

    return (
      <span style={{ color }}>
        {sign}{isScore ? variation : variation.toFixed(1)}{suffix}
      </span>
    );
  };

  const loadRiskSummaryData = useCallback(async (forceReload = false) => {
    const now = Date.now();
    if (!forceReload && now - lastLoadTime < 1000) {
      return;
    }
    setLastLoadTime(now);

    const cacheKey = getCacheKey('riskSummary', selectedCustomer);
    const cached = getCachedData(cacheKey);

    if (cached && !forceReload) {
      setRiskSummaryData(cached);
      return;
    }

    setLoadingRiskData(true);
    try {
      let riskData;

      if (selectedCustomer && customerData?.company_code) {
        riskData = await SAPRiskService.getCustomerRiskData(
          selectedCustomer,
          customerData.company_code
        );
      } else if (!selectedCustomer && customers.length > 0) {
        riskData = await SAPRiskService.getAllCustomersRiskData(customers);
      } else {
        riskData = SAPRiskService.getEmptyRiskData();
      }

      setRiskSummaryData(riskData);
      setCachedData(cacheKey, riskData);

    } catch (error) {
      setRiskSummaryData(SAPRiskService.getEmptyRiskData());
    } finally {
      setLoadingRiskData(false);
    }
  }, [selectedCustomer, customerData?.company_code, customers, getCachedData, setCachedData, lastLoadTime]);

  const loadCustomerCreditLimits = async (customerId) => {
    if (!customerId) return;

    const cacheKey = getCacheKey('creditLimits', customerId);
    const cached = getCachedData(cacheKey);

    if (cached) {
      setCreditLimitsId(cached.creditLimitsId);
      setCreditLimit(cached.creditLimit);
      setPrepaidLimit(cached.prepaidLimit);
      setComments(cached.comments);
      return;
    }

    setLoading(true);
    try {
      const creditData = await CustomerService.getCustomerCreditLimits(customerId);

      if (creditData) {
        setCreditLimitsId(creditData.creditLimitsId);
        setCreditLimit(creditData.creditLimit);
        setPrepaidLimit(creditData.prepaidLimit);
        setComments(creditData.comments);

        setCachedData(cacheKey, creditData);
      } else {
        setCreditLimitsId(null);
        setCreditLimit('');
        setPrepaidLimit('');
        setComments('');
      }
    } catch (error) {
      setCreditLimitsId(null);
      setCreditLimit('');
      setPrepaidLimit('');
      setComments('');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!selectedCustomer) {
      alert('Nenhum cliente selecionado');
      return;
    }

    const creditLimitValue = parseCurrency(creditLimit);
    const prepaidLimitValue = parseCurrency(prepaidLimit);

    if (!creditLimitValue && !prepaidLimitValue) {
      alert('Informe pelo menos um dos limites');
      return;
    }

    setSaving(true);

    try {
      const limitData = {
        credit_limit: creditLimitValue ? Number(creditLimitValue) / 100 : null,
        prepaid_limit: prepaidLimitValue ? Number(prepaidLimitValue) / 100 : null,
        comments: comments || null
      };

      await CustomerService.updateCustomerCreditLimits(selectedCustomer, limitData);

      const cacheKey = getCacheKey('creditLimits', selectedCustomer);
      dataCache.delete(cacheKey);

      alert('Análise financeira salva com sucesso!');
    } catch (error) {
      alert(`Erro ao salvar análise financeira: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fetchWorkflowHistory = async (customerId) => {
    if (!customerId) {
      setWorkflowHistory([]);
      return;
    }

    const cacheKey = getCacheKey('workflowHistory', customerId);
    const cached = getCachedData(cacheKey);

    if (cached) {
      setWorkflowHistory(cached);
      return;
    }

    setLoadingWorkflowHistory(true);
    try {
      // Usar o serviço workflowHistoryService em vez de chamar o Supabase diretamente
      const response = await getWorkflowHistory(customerId);
      // Verifica explicitamente se a resposta tem o formato esperado
      const historyData = response && response.success === true && Array.isArray(response.data) 
        ? response.data 
        : [];
      
      if (historyData && historyData.length > 0) {
        // Transformar os dados para o formato esperado pelo componente
        const workflowHistoryData = historyData.map(item => {
          // Adaptar para o novo formato de resposta da API
          const creditRequest = {
            id: item.id,
            created_at: item.created_at,
            credit_limit_amt: item.credit_limit_amt,
            status_id: item.status_id
          };
          
          const workflowOrder = {
            id: item.workflow_id
          };
          
          // Verificar se temos dados de workflow
          if (!item.steps || !item.steps.length) {
            return null;
          }
          
          // Os detalhes já vêm com nomes de aprovadores no novo formato
          const details = item.steps || [];
          
          // Calcular status computado
          const computedStatus = details.every(d => d.approval === true) ? 'approved' :
                                details.some(d => d.approval === false) ? 'rejected' : 'pending';
          
          return {
            id: item.workflow_id,
            creditRequest: creditRequest,
            workflowOrder: workflowOrder,
            details: details || [],
            created_at: item.created_at,
            computedStatus
          };
        }).filter(Boolean); // Remover itens nulos
        
        setWorkflowHistory(workflowHistoryData);
        setCachedData(cacheKey, workflowHistoryData);
      } else {
        setWorkflowHistory([]);
        setCachedData(cacheKey, []);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de workflow:', error);
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

  const loadUserData = async () => {
    try {
      const { data: { session } } = await getSession();
      if (!session?.user) {
        return;
      }
      const companyId = await getUserCompanyId(session.user.id);
      if (!companyId) {
        return;
      }
      setUserCompanyId(companyId);
      const corporateGroupId = await getGroupId(companyId);
      if (corporateGroupId) {
        setCorporateGroupId(corporateGroupId);
      }
      const customersData = await CustomerService.getCustomersByCompanyGroup(companyId);
      setCustomers(customersData || []);
    } catch (error) {
      setCustomers([]);
    }
  };

  const loadSalesOrders = useCallback(async () => {
    if (!corporateGroupId) return;
    const cacheKey = getCacheKey('salesOrders', selectedCustomer);
    const cached = getCachedData(cacheKey);
    if (cached) {
      setSalesOrders(cached);
      return;
    }
    try {
      const companiesData = await getCompaniesByCorporateGroup(corporateGroupId);
      if (companiesData?.length > 0) {
        const companyIds = companiesData.map(c => c.id);
        const ordersData = await getSalesOrders({ companyIds, customerId: selectedCustomer });
        setSalesOrders(ordersData || []);
        setCachedData(cacheKey, ordersData || []);
      }
    } catch (error) {
      setSalesOrders([]);
    }
  }, [selectedCustomer, corporateGroupId, getCachedData, setCachedData]);

  const loadMonthlyBilling = useCallback(async () => {
    if (!customers.length) return;

    const cacheKey = getCacheKey('monthlyBilling', selectedCustomer);
    const cached = getCachedData(cacheKey);

    if (cached) {
      setMonthlyBilling(cached.billingWithOccupation);
      setBillingMetrics(cached.metrics);
      return;
    }

    setLoading(true);
    try {
      const billingData = await SAPBillingService.getMonthlyBillingData(selectedCustomer, customers);

      let billingWithOccupation = billingData;

      if (selectedCustomer && customerData?.company_code) {
        billingWithOccupation = await SAPBillingService.getCreditLimitOccupation(
          selectedCustomer,
          billingData,
          customers
        );
      } else {
        billingWithOccupation = billingData.map(item => ({ ...item, occupation: 0 }));
      }

      setMonthlyBilling(billingWithOccupation);

      const metrics = SAPBillingService.calculateBillingMetrics(billingData);
      setBillingMetrics(metrics);

      setCachedData(cacheKey, { billingWithOccupation, metrics });
    } catch (error) {
      setMonthlyBilling([]);
      const emptyMetrics = { currentAverage: 0, previousAverage: 0, variation: 0, variationPercentage: 0 };
      setBillingMetrics(emptyMetrics);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, customerData?.company_code, customers, getCachedData, setCachedData]);

  const loadPaymentTermAndScore = useCallback(async () => {
    if (!customers.length) return;

    const cacheKey = getCacheKey('paymentTermScore', selectedCustomer);
    const cached = getCachedData(cacheKey);

    if (cached) {
      setPaymentTermScoreData(cached.scoreData);
      setScoreMetrics(cached.metrics);
      return;
    }

    setLoadingScore(true);
    try {
      const scoreData = await SAPScoreService.getPaymentTermAndScore(selectedCustomer, customers);
      setPaymentTermScoreData(scoreData);

      const metrics = SAPScoreService.calculateScoreMetrics(scoreData);
      setScoreMetrics(metrics);

      setCachedData(cacheKey, { scoreData, metrics });
    } catch (error) {
      setPaymentTermScoreData([]);
      const emptyMetrics = { currentScore: 0, previousScore: 0, scoreVariation: 0 };
      setScoreMetrics(emptyMetrics);
    } finally {
      setLoadingScore(false);
    }
  }, [selectedCustomer, customers, getCachedData, setCachedData]);

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
      
      // Usando a função do serviço em vez de chamar o Supabase diretamente
      const userCompanyId = await getUserCompanyId(session.user.id);
      if (!userCompanyId) {
        throw new Error('Não foi possível obter a company_id do usuário');
      }
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
      alert(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileIndex) => {
    try {
      const fileToDelete = uploadedFiles[fileIndex];
      if (!fileToDelete || !fileToDelete.path) {
        throw new Error('Arquivo não encontrado');
      }
      await removeFile('financial-analysis', fileToDelete.path);
      const updatedFiles = [...uploadedFiles];
      updatedFiles.splice(fileIndex, 1);
      setUploadedFiles(updatedFiles);
      alert('Arquivo excluído com sucesso!');
    } catch (error) {
      alert(`Erro ao excluir arquivo: ${error.message}`);
    }
  };

  const handleLoadCalculatedLimit = async () => {
    if (!selectedCustomer || !customerData?.company_code) {
      alert('Dados do cliente não disponíveis');
      return;
    }

    setLoadingCalculatedLimit(true);
    try {
      const creditLimitData = await SAPCustomerService.getCustomerCreditLimit(customerData.company_code);

      if (creditLimitData?.calculatedLimit && creditLimitData.calculatedLimit > 0) {
        const formattedLimit = creditLimitData.calculatedLimit.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        setCreditLimit(formattedLimit);
      } else {
        alert('Limite calculado não disponível para este cliente');
      }
    } catch (error) {
      alert('Erro ao carregar limite calculado');
    } finally {
      setLoadingCalculatedLimit(false);
    }
  };

  const handleCustomerChange = useCallback((customerId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSelectedCustomer(customerId);

    if (customerId !== selectedCustomer) {
      setCreditLimit('');
      setPrepaidLimit('');
      setComments('');
      setUploadedFiles([]);
    }

    if (selectedCustomer && selectedCustomer !== customerId) {
      clearCache();
    }
  }, [selectedCustomer, clearCache]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (corporateGroupId) {
      loadSalesOrders();
    }
    if (customers.length > 0) {
      loadMonthlyBilling();
      loadPaymentTermAndScore();
    }
  }, [corporateGroupId, selectedCustomer, customers, loadSalesOrders, loadMonthlyBilling, loadPaymentTermAndScore]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!selectedCustomer) {
        setCustomerData(null);
        setCustomerAddress('');
        return;
      }
      const cacheKey = getCacheKey('customerData', selectedCustomer);
      const cached = getCachedData(cacheKey);
      if (cached) {
        setCustomerData(cached.customerData);
        setCustomerAddress(cached.customerAddress);
        return;
      }
      try {
        const data = await getCustomerById(selectedCustomer);
        setCustomerData(data);
        let addressString = '';
        if (data?.addr_id) {
          const addr = await getAddressById(data.addr_id);
          if (addr) {
            addressString = `${addr.street || ''}${addr.num ? ', ' + addr.num : ''}${addr.compl ? ' - ' + addr.compl : ''}${addr.city ? ' - ' + addr.city : ''}${addr.state ? ' - ' + addr.state : ''}${addr.zcode ? ', ' + addr.zcode : ''}`.trim();
            setCustomerAddress(addressString);
          }
        }
        setCachedData(cacheKey, { customerData: data, customerAddress: addressString });
      } catch (error) {
        setCustomerData(null);
        setCustomerAddress('');
      }
    };
    fetchCustomerData();
  }, [selectedCustomer, getCachedData, setCachedData]);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerCreditLimits(selectedCustomer);
      fetchWorkflowHistory(selectedCustomer);
    } else {
      setWorkflowHistory([]);
      setUploadedFiles([]);
      setCreditLimit('');
      setPrepaidLimit('');
      setComments('');
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (customers.length > 0) {
      loadRiskSummaryData();
    }
  }, [customers, selectedCustomer, customerData?.company_code, loadRiskSummaryData]);

  useEffect(() => {
    if (selectedCustomer && customerData?.company_code && monthlyBilling.length > 0) {
      loadMonthlyBilling();
    }
  }, [customerData?.company_code]);

  return (
    <>
      <UI.Header>
        <div className="title-row font-semibol text-2xl">
          <h2>Análise do Cliente</h2>
        </div>
        {companyName && (
          <div className="company-name">{companyName}</div>
        )}
      </UI.Header>

      <UI.SearchBar>
        <div className="filter-content">
          {!companyName && (
            <div>
              <label>Cliente</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: 12 }}>
                <select
                  value={selectedCustomer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  style={{ width: '270px', height: 32 }}
                >
                  <option value="">Todos os clientes</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_code ? `${customer.company_code} - ${customer.name}` : customer.name}
                    </option>
                  ))}
                </select>
                <button
                  style={{
                    marginTop: 2.5,
                    border: '0px',
                    color: 'white',
                    background: '#0066FF',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCustomerChange('')}
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </UI.SearchBar>

      <UI.DashboardGrid>
        <div className="card">
          <h3>Prazo médio de Pagamento | Score</h3>
          <div className="card-content">
            <UI.CardValue>
              {scoreMetrics.currentScore > 0 ? scoreMetrics.currentScore : 0} {scoreMetrics.currentScore > 0 ? formatVariationDisplay(scoreMetrics.scoreVariation, true) : ''}
            </UI.CardValue>
            <UI.CardSubtitle>
              {selectedCustomer ? 'Score atual' : 'Score médio de todos os clientes'}
            </UI.CardSubtitle>
            {loadingScore ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Carregando dados...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={paymentTermScoreData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '12px' }}
                    domain={[300, 900]}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Score') return value > 0 ? [`${value} pts`, name] : ['Sem dados', name];
                      return value > 0 ? [`${value} dias`, name] : ['Sem dados', name];
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="left"
                    height={20}
                    content={({ payload }) => (
                      <ul style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '12px',
                        color: 'var(--secondary-text)',
                        margin: 0,
                        padding: 0
                      }}>
                        {payload.map((entry, index) => (
                          <li key={`item-${index}`} style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              backgroundColor: entry.color,
                              borderRadius: '2px'
                            }} />
                            {entry.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                  <Bar dataKey="paymentTerm" fill="#76D9DF" name="Prazo médio (dias)" barSize={20} yAxisId="left" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3EB655"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Score"
                    yAxisId="right"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Faturamento | Ocupação de Limite</h3>
          <div className="card-content">
            <UI.CardValue>
              {SAPBillingService.formatCompactCurrency(billingMetrics.currentAverage)}
              {billingMetrics.currentAverage > 0 ? formatVariationDisplay(billingMetrics.variationPercentage) : ''}
            </UI.CardValue>
            <UI.CardSubtitle>
              {selectedCustomer ? 'Faturamento médio dos últimos 12 meses' : 'Faturamento médio de todos os clientes'}
            </UI.CardSubtitle>
            {loading ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Carregando dados...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={monthlyBilling} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => SAPBillingService.formatCompactCurrency(value)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '12px' }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Ocupação de Limite') return [`${value.toFixed(1)}%`, name];
                      return [SAPBillingService.formatCurrency(value), name];
                    }}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="left"
                    height={20}
                    content={({ payload }) => (
                      <ul style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '12px',
                        color: 'var(--secondary-text)',
                        margin: 0,
                        padding: 0
                      }}>
                        {payload.map((entry, index) => (
                          <li key={`item-${index}`} style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              backgroundColor: entry.color,
                              borderRadius: '2px'
                            }} />
                            {entry.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--primary-blue)"
                    name="Faturamento"
                    barSize={20}
                    yAxisId="left"
                  />
                  <Line
                    type="monotone"
                    dataKey="occupation"
                    stroke="#3EB655"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Ocupação de Limite"
                    yAxisId="right"
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Resumo Risco Cliente</h3>
          <div className="card-content">
            {loadingRiskData ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '240px',
                color: 'var(--secondary-text)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div>Carregando dados...</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {selectedCustomer ? `Cliente selecionado` : `${customers.length} clientes`}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                height: '240px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    {SAPRiskService.formatCompactCurrency(riskSummaryData.creditLimitGranted)}
                  </div>
                  <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                    Limite de crédito {selectedCustomer ? 'concedido' : 'total'}
                  </h4>
                </div>

                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{riskSummaryData.creditLimitUsed}%</div>
                  <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                    Limite de crédito utilizado
                  </h4>
                </div>

                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    {SAPRiskService.formatCompactCurrency(riskSummaryData.amountToReceive)}
                  </div>
                  <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                    A receber {selectedCustomer ? '' : '(total)'}
                  </h4>
                </div>

                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{riskSummaryData.avgPaymentTerm} dias</div>
                  <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                    Prazo médio de pagamento
                  </h4>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                    {riskSummaryData.isOverdue ? 'Vencido' : 'Em dia'}
                  </h4>

                  {riskSummaryData.isOverdue ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      fontSize: '18px',
                      fontWeight: '600',
                      gap: '2px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--error)',
                          display: 'inline-block'
                        }} />
                        {SAPRiskService.formatCompactCurrency(riskSummaryData.overdueAmount)}
                      </div>

                      <span style={{
                        fontSize: '12px',
                        color: 'var(--error)',
                        fontWeight: 'normal',
                        paddingLeft: '14px'
                      }}>
                        Atraso atual: {riskSummaryData.maxCurrentDelayDays} dias
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--success)',
                        display: 'inline-block'
                      }} />
                      <span style={{ color: 'var(--success)' }}>Em dia</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                    Máx. dias em atraso
                  </h4>
                  <h4 style={{ fontSize: '10px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
                    (12 meses)
                  </h4>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    {riskSummaryData.maxDelayDays12Months} dias
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </UI.DashboardGrid>

      {!selectedCustomer && !selectedCustomerDetails && (() => {
        // Converter clientes reais para o formato esperado pela tabela
        const tableCustomers = (customers || []).map((c) => ({
          id: String(c.id),
          name: c.company_code ? `${c.company_code} - ${c.name}` : c.name,
          // Sem dados reais para estes campos por enquanto; mantemos zeros para exibição
          currentLimit: 0,
          utilizationPercentage: 0,
          riskScore: 'low',
          averagePurchaseAmount: 0,
          paymentHistory: []
        }));

        const handleViewDetails = async (rowCustomer) => {
          // Encontrar um mock compatível para manter o comportamento/visual dos detalhes
          const match = mockCustomers.find((m) => {
            const sameId = String(m.id) === String(rowCustomer.id);
            const sameName = (m.name || '').trim() === (rowCustomer.name || '').trim();
            const codeInName = (rowCustomer.name || '').includes('-') && (m.name || '').includes(rowCustomer.name.split('-')[0].trim());
            return sameId || sameName || codeInName;
          });
          // Buscar dados reais do cliente para o header (nome e CNPJ)
          let real = null;
          try {
            real = await getCustomerById(rowCustomer.id);
          } catch (_) {}
          const realName = real?.name || rowCustomer.name;
          const realCnpj = real?.costumer_cnpj || real?.cnpj || '';

          const merged = {
            ...(match || {}),
            // Fallback: mantém estrutura mock com mínimos campos
            id: rowCustomer.id,
            name: realName,
            cnpj: realCnpj,
            currentLimit: (match && match.currentLimit) || 0,
            utilizationPercentage: (match && match.utilizationPercentage) || 0,
            riskScore: (match && match.riskScore) || 'low',
            averagePurchaseAmount: (match && match.averagePurchaseAmount) || 0,
            paymentHistory: (match && match.paymentHistory) || []
          };
          setSelectedCustomerDetails(merged);
        };

        return (
          <CustomerTable
            customers={tableCustomers}
            onViewDetails={handleViewDetails}
          />
        );
      })()}

      {selectedCustomerDetails && (
        <CustomerDetails
          customer={selectedCustomerDetails}
          onBack={() => setSelectedCustomerDetails(null)}
        />
      )}

      {selectedCustomer && (
        <>
          <div className="customer-details" style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
            maxWidth: '100%'
          }}>
            <div className="header" style={{
              marginBottom: 24,
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 0 }}>{customerData?.name}</h2>
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setIsExpandedDetails(prev => !prev)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isExpandedDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M5 8L10 13L15 8" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            {isExpandedDetails && (
              <>
                <div style={{ fontSize: 14, color: '#6B7280', marginTop: 0, marginBottom: 0 }}>Código: {customerData?.company_code}</div>
                <div className="content" style={{ display: 'flex', gap: 48, marginTop: 24 }}>
                  <div className="company-info" style={{ display: 'flex', gap: 48, flex: 1 }}>
                    <div className="info-field" style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 13, color: '#6B7280', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase' }}>CNPJ</label>
                      <p style={{ fontSize: 14, color: '#111827', lineHeight: 1.4 }}>{customerData?.costumer_cnpj}</p>
                    </div>
                    <div className="info-field" style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 13, color: '#6B7280', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase' }}>Endereço</label>
                      <p style={{ fontSize: 14, color: '#111827', lineHeight: 1.4 }}>{customerAddress}</p>
                    </div>
                  </div>
                  <div className="contacts-section" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <div className="contacts-scroll" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4, margin: -4, padding: 4 }}>
                      {[
                        { name: customerData?.name, phone: customerData?.costumer_phone, email: customerData?.costumer_email }
                      ].map((contact, index) => (
                        <div className="contact-card" key={index} style={{ minWidth: 260, background: '#F9FAFB', padding: 16, borderRadius: 6 }}>
                          <div className="name" style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 12 }}>{contact.name}</div>
                          <div className="contact-info" style={{ fontSize: 14, color: '#6B7280' }}>
                            <p style={{ marginBottom: 4 }}>{contact.phone}</p>
                            <p style={{ marginBottom: 0 }}><a href={`mailto:${contact.email}`} style={{ color: '#2563EB', textDecoration: 'none' }}>{contact.email}</a></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ background: 'white', padding: '24px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{marginBottom: '30px'}}>Serasa Concentre PJ</h3>
            {serasaData ? (
              <UI.DetailView>
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
              </UI.DetailView>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--secondary-text)',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                Área reservada para exibição dos dados da consulta Serasa.
              </div>
            )}
          </div>

          <UI.HistoryAnalysisContainer>
            <UI.CustomerHistory>
              <h4 style={{ marginBottom: '16px', color: 'black', fontWeight: '500'}}>Histórico</h4>

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
                  Nenhum histórico encontrado para este cliente
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {workflowHistory.map((workflow, index) => {
                    const workflowId = workflow.id || workflow.workflowOrder?.id || index;
                    const isExpanded = expandedWorkflows.has(workflowId);
                    const hasDetails = workflow.details && workflow.details.length > 0;

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
                      <div key={workflowId} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
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
                                  onClick={() => toggleWorkflowExpansion(workflowId)}
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
                              {workflow.details.map((detail, detailIndex) => {
                                const statusColor =
                                  detail.approval === null ? '#EA580C' :
                                  detail.approval === true ? '#3EB655' : '#E11D48';
                                return (
                                  <div
                                    key={detail.id || detailIndex}
                                    onClick={() => handleWorkflowStepClick(detail)}
                                    style={{
                                      backgroundColor: 'var(--background)',
                                      border: '1px solid rgba(0,0,0,0.1)',
                                      borderRadius: '6px',
                                      padding: '12px 16px',
                                      marginBottom: '4px',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.2s',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--background)'}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontWeight: '500' }}>{detail.jurisdiction_name || detail.jurisdiction?.name || `Etapa ${detailIndex + 1}`}</div>
                                      <div style={{ color: statusColor, fontWeight: 500 }}>
                                        {detail.approval === null ? 'Pendente' : detail.approval === true ? 'Aprovado' : 'Rejeitado'}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--secondary-text)' }}>
                                      <div>Início: {detail.started_at ? new Date(detail.started_at).toLocaleString('pt-BR') : 'Não iniciado'}</div>
                                      <div>Conclusão: {detail.finished_at ? new Date(detail.finished_at).toLocaleString('pt-BR') : 'Pendente'}</div>
                                    </div>
                                    {detail.approver_name && (
                                      <div style={{ fontSize: '12px', color: '#2563EB' }}>Aprovador: {detail.approver_name}</div>
                                    )}
                                  </div>
                                );
                              })}
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
                disabled={loadingCalculatedLimit || !selectedCustomer || !customerData?.company_code}
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
                          <button title="Baixar" onClick={() => window.open(file.url, '_blank')}>
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
                <button
                  className="secondary"
                  onClick={() => {
                    setCreditLimit('');
                    setPrepaidLimit('');
                    setComments('');
                    setUploadedFiles([]);
                  }}
                >
                  Cancelar
                </button>
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

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Pedidos do Cliente</h3>
            {salesOrders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--secondary-text)'
              }}>
                Nenhum pedido encontrado para este cliente
              </div>
            ) : (
              <OrdersTable orders={salesOrders} customerName={customerData?.name || ''} />
            )}
          </div>
        </>
      )}

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
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontWeight: '600', fontSize: '18px', color: 'var(--primary-text)' }}>
                Parecer da Etapa
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
            <div style={{ fontSize: '14px', color: 'var(--primary-text)', whiteSpace: 'pre-wrap', minHeight: '60px' }}>
              {selectedWorkflowStep.parecer || 'Nenhum parecer registrado.'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowWorkflowModal(false);
                  setSelectedWorkflowStep(null);
                }}
                style={{
                  padding: '8px 16px',
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

export default BusinessAnalysis;

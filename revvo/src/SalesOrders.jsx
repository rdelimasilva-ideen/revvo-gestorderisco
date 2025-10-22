import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import Select from 'react-select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CurrencyDollar, ChartBar, ChartLineUp, Users, FunnelSimple, CaretDown, ArrowsDownUp, Clock, CheckCircle, CaretUp } from '@phosphor-icons/react'
import { DEFAULT_USER_ID } from './constants/defaults'
import { getGlobalCompanyId } from './lib/globalState'
import OrderDetails from './components/OrderDetails'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { CustomerService } from './services/customerService'
import { getCorporateGroupId, getMonthlyBilling, listCompaniesByCorporateGroup } from './services/companyService'
import { getCreditLimitRequests, getCreditLimitDashboard } from './services/creditLimitService'

// Configurando o locale do dayjs para português brasileiro
dayjs.locale('pt-br')

const FilterSection = styled.div`
  background: white;
  border-radius: 8px;
  margin: 24px 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .filter-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    .left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon {
      transition: transform 0.3s ease;

      &.open {
        transform: rotate(180deg);
      }
    }
  }

  .filter-content {
    padding: 24px;
    background: #F8F9FA;
    position: relative;
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .filter-actions {
    display: flex;
    justify-content: flex-start;
    gap: 8px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--border-color);
  }

  .filter-group {
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text);
      margin-bottom: 4px;
    }

    select,
    .react-select__control {
      width: 100%;
      height: 40px;
      min-height: 40px;
      background: white;
    }

    .react-select__menu {
      z-index: 100;
    }

    .react-select__control {
      border-color: var(--border-color);
      box-shadow: none;
      border-radius: 4px;

      &:hover {
        border-color: var(--primary-blue);
      }

      &--is-focused {
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 1px var(--primary-blue);
      }
    }

    .react-select__value-container {
      padding: 2px 8px;
    }

    .react-select__input-container {
      margin: 0;
      padding: 0;
    }

    .react-select__placeholder {
      color: #9CA3AF;
    }

    .react-select__menu-portal {
      z-index: 9999;
    }

    select {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0 12px;
      color: var(--primary-text);
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      appearance: none;

      &:focus {
        outline: none;
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 1px var(--primary-blue);
      }
    }
  }
`

const Header = styled.header`
  margin-bottom: 24px;
`

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const MetricCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  h3 {
    color: var(--secondary-text);
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .value {
    font-size: 24px;
    font-weight: 600;
    margin: 8px 0;
  }

  .subtitle {
    font-size: 12px;
    color: var(--secondary-text);
  }

  .status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-top: 4px;

    &.warning {
      background: #FEF3C7;
      color: #92400E;
    }
  }
`

const InboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const InboxSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;

  .section-header {
    padding: 16px;
    background: #F8F9FA;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text);
      margin: 0;
    }

    .count {
      background: #E9ECEF;
      color: var(--secondary-text);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
  }
`

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    .details {
      h4 {
        font-size: 14px;
        font-weight: 500;
      }

      p {
        font-size: 12px;
        color: var(--secondary-text);
      }
    }

    .price {
      font-size: 14px;
      font-weight: 500;
    }
  }
`

const OrdersTable = styled.div`
  border-radius: 8px;
`

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--secondary-text);
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: var(--primary-text);
  }

  &.active {
    color: var(--primary-blue);
  }
`

const OrdersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .sort-options {
    display: flex;
    gap: 16px;
  }
`

const OrderCard = styled.div`
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .status-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    display: inline-block;
    margin-top: 8px;

    &.pending {
      background: rgba(249, 207, 88, 0.2);
      color: #B58E2D;
    }

    &.approved {
      background: rgba(62, 182, 85, 0.2);
      color: #3EB655;
    }

    &.rejected {
      background: rgba(204, 23, 23, 0.2);
      color: #CC1717;
    }
  }
`
const orders = [
  { id: '#1', partner: 'Clínica Estética Bella Vita', items: 5, total: 9700.00, status: 'pending' },
  { id: '#2', partner: 'Instituto de Cirurgia Plástica São Paulo', items: 10, total: 27000.00, status: 'approved' },
  { id: '#3', partner: 'Centro Avançado de Medicina Estética', items: 23, total: 55820.00, status: 'rejected' },
  { id: '#4', partner: 'Clínica Integrada de Cirurgia Plástica', items: 17, total: 47785.00, status: 'pending' },
  { id: '#5', partner: 'Hospital e Maternidade Santa Clara', items: 5, total: 7600.00, status: 'pending' },
  { id: '#6', partner: 'Clínica Dermatológica Pele & Arte', items: 14, total: 38000.00, status: 'pending' },
];

function SalesOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterCustomer, setFilterCustomer] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterConsultant, setFilterConsultant] = useState('')
  const [isLocalFilterOpen, setIsLocalFilterOpen] = useState(false)
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [salesData, setSalesData] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerOptions, setCustomerOptions] = useState([])
  const [showPending, setShowPending] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [requests, setRequests] = useState([])
  const [dashboardIndicators, setDashboardIndicators] = useState(null)
  const [branchOptions, setBranchOptions] = useState([])
  const [filterBranch, setFilterBranch] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  useEffect(() => {
    async function loadCustomers() {
      try {
        const companyId = getGlobalCompanyId();
        if (!companyId) return;

        const customersData = await CustomerService.getCustomersByCompanyGroup(companyId);
        setCustomers(customersData || []);

        const options = customersData?.map(customer => ({
          value: customer.id,
          label: customer.company_code ? `${customer.company_code} - ${customer.name}` : customer.name
        })) || [];

        setCustomerOptions(options);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    }

    loadCustomers();
  }, []);

  useEffect(() => {
    async function loadSalesData() {
      try {
        const companyId = getGlobalCompanyId();
        if (!companyId) return;

        const corporateGroupId = await getCorporateGroupId(companyId);

        if (corporateGroupId) {
          const billingData = await getMonthlyBilling(corporateGroupId);

          const processedData = billingData?.map(item => ({
            month: item.formatted_month || new Date(item.month).toLocaleDateString('pt-BR', { month: 'short' }),
            value: item.value || 0
          })) || [];

          setSalesData(processedData);
        }
      } catch (error) {
        console.error('Error loading sales data:', error);
        setSalesData([]);
      }
    }

    loadSalesData();
  }, []);

  useEffect(() => {
    async function fetchRequests() {
      const companyId = getGlobalCompanyId();
      if (!companyId) return;

      try {
        const filters = { companyId };
        if (filterStartDate) filters.startDate = filterStartDate;
        if (filterEndDate) filters.endDate = filterEndDate + 'T23:59:59';
        
        const data = await getCreditLimitRequests(filters);
        
        // Filtrar por branch se necessário (como no código original)
        let filteredData = data;
        if (filterBranch) {
          filteredData = data.filter(item => item.branch_id === filterBranch);
        }
        
        setRequests(filteredData || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setRequests([]);
      }
    }
    fetchRequests();
  }, [filterBranch, filterStartDate, filterEndDate]);

  useEffect(() => {
    async function fetchIndicators() {
      const companyId = getGlobalCompanyId();
      if (!companyId) return;

      try {
        const data = await getCreditLimitDashboard(companyId, filterBranch);
        
        if (data) {
          if (filterBranch && data.length === 1) {
            setDashboardIndicators(data[0]);
          } else if (data.length > 1) {
            setDashboardIndicators({
              pending_count: data.reduce((acc, cur) => acc + (cur.total_pendentes || 0), 0),
              completed_count: data.reduce((acc, cur) => acc + (cur.total_concluidas || 0), 0),
              customer_count: data.reduce((acc, cur) => acc + (cur.total_clientes || 0), 0),
              approval_rate: data.reduce((acc, cur) => acc + (cur.taxa_aprovacao || 0), 0) / data.length
            });
          } else if (data.length === 1) {
            setDashboardIndicators({
              pending_count: data[0].total_pendentes,
              completed_count: data[0].total_concluidas,
              customer_count: data[0].total_clientes,
              approval_rate: data[0].taxa_aprovacao
            });
          }
        }
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    }
    fetchIndicators();
  }, [filterBranch]);

  useEffect(() => {
    async function fetchBranches() {
      const companyId = getGlobalCompanyId();
      if (!companyId) return;

      try {
        const corporateGroupId = await getCorporateGroupId(companyId);
        if (!corporateGroupId) return;
        
        const companiesData = await listCompaniesByCorporateGroup(corporateGroupId);
        if (companiesData) {
          setBranchOptions(companiesData.map((c) => ({ value: c.id, label: c.name })));
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    }
    fetchBranches();
  }, []);

  const handleOrderClick = (order) => {
    window.dispatchEvent(new CustomEvent('navigateToDashboard', {
      detail: {
        customerId: '1',
        page: 'home',
        detailCard: 'risk',
        showFilter: true,
        order
      }
    }));
  }

  const filteredOrders = orders.filter(order => {
    const matchesCustomer = !filterCustomer || order.partner === filterCustomer.label
    const matchesStatus = !filterStatus || order.status === filterStatus
    return matchesCustomer && matchesStatus
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1

    switch (sortField) {
      case 'partner':
        return direction * a.partner.localeCompare(b.partner)
      case 'status':
        return direction * a.status.localeCompare(b.status)
      case 'total':
        return direction * (a.total - b.total)
      default:
        return 0
    }
  })

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const completedOrders = orders.filter(order => ['approved', 'rejected'].includes(order.status));

  const getStatusTag = (status_id, status_name) => {
    let color = '#2563eb';
    let text = status_name || 'Novo';
    if (status_id === 2) { color = '#F9CF58'; text = status_name || 'Pendente'; }
    if (status_id === 3) { color = '#3EB655'; text = status_name || 'Aprovado'; }
    if (status_id === 4) { color = '#CC1717'; text = status_name || 'Rejeitado'; }
    return (
      <span style={{
        background: color + '22',
        color: color,
        fontWeight: 600,
        fontSize: 13,
        borderRadius: 12,
        padding: '2px 12px',
        marginLeft: 8,
        display: 'inline-block',
        minWidth: 80,
        textAlign: 'center',
      }}>{text}</span>
    );
  };

  const getSortedRequests = (arr) => {
    return [...arr].sort((a, b) => {
      if (sortField === 'name') {
        const nameA = (a.customer?.name || a.company?.name || '').toLowerCase();
        const nameB = (b.customer?.name || b.company?.name || '').toLowerCase();
        if (nameA < nameB) return sortDirection === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else if (sortField === 'status') {
        const statusA = (a.status?.name || '').toLowerCase();
        const statusB = (b.status?.name || '').toLowerCase();
        if (statusA < statusB) return sortDirection === 'asc' ? -1 : 1;
        if (statusA > statusB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  };

  if (selectedOrder) {
    return <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
  }

  return (
    <div>
      <Header>
        <h2 className="text-2xl font-semibold">Solicitações de Limite de Crédito</h2>
      </Header>

      <DashboardGrid>
        <MetricCard>
          <h3>
            <Clock size={20} />
            Solicitações Pendentes
          </h3>
          <div className="value">{dashboardIndicators?.pending_count ?? '-'}</div>
          <div className="subtitle">aguardando análise</div>
        </MetricCard>

        <MetricCard>
          <h3>
            <CheckCircle size={20} />
            Solicitações Concluídas
          </h3>
          <div className="value">{dashboardIndicators?.completed_count ?? '-'}</div>
          <div className="subtitle">nos últimos 30 dias</div>
        </MetricCard>

        <MetricCard>
          <h3>
            <ChartLineUp size={20} />
            Taxa de Aprovação
          </h3>
          <div className="value">{dashboardIndicators?.approval_rate ? `${dashboardIndicators.approval_rate.toFixed(1)}%` : '-'}</div>
          <div className="subtitle">das solicitações</div>
        </MetricCard>

        <MetricCard>
          <h3>
            <Users size={20} />
            Total de Clientes
          </h3>
          <div className="value">{dashboardIndicators?.customer_count ?? '-'}</div>
          <div className="subtitle">com solicitações</div>
        </MetricCard>
      </DashboardGrid>

      <FilterSection>
        <div className="filter-header" onClick={() => setIsLocalFilterOpen(!isLocalFilterOpen)}>
          <div className="left">
            <FunnelSimple size={20} />
            <span>Filtros</span>
          </div>
          <CaretDown
            size={16}
            className={`icon ${isLocalFilterOpen ? 'open' : ''}`}
            style={{ color: 'var(--secondary-text)' }}
          />
        </div>
        {isLocalFilterOpen && (
          <div className="filter-content">
            <div className="filters">
              <div className="filter-group">
                <label>Cliente</label>
                <Select
                  options={customerOptions}
                  value={filterCustomer}
                  onChange={setFilterCustomer}
                  isClearable
                  placeholder="Selecione um cliente..."
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999
                    })
                  }}
                />
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="1">Novo</option>
                  <option value="2">Pendente</option>
                  <option value="3">Aprovado</option>
                  <option value="4">Rejeitado</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Consultor de Vendas</label>
                <select
                  value={filterConsultant}
                  onChange={(e) => setFilterConsultant(e.target.value)}
                >
                  <option value="">Todos os consultores</option>
                  <option value="1">Ana Silva</option>
                  <option value="2">Carlos Santos</option>
                  <option value="3">Maria Oliveira</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Filial</label>
                <Select
                  options={branchOptions}
                  value={branchOptions.find(opt => opt.value === filterBranch) || null}
                  onChange={opt => setFilterBranch(opt ? opt.value : '')}
                  isClearable
                  placeholder="Selecione uma filial"
                  classNamePrefix="react-select"
                  styles={{ menu: base => ({ ...base, fontSize: 16 }) }}
                />
              </div>
              <div className="filter-group">
                <label>Data da Solicitação</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="date"
                    value={filterStartDate || ''}
                    onChange={e => setFilterStartDate(e.target.value)}
                    style={{ width: '50%' }}
                  />
                  <input
                    type="date"
                    value={filterEndDate || ''}
                    onChange={e => setFilterEndDate(e.target.value)}
                    style={{ width: '50%' }}
                  />
                </div>
              </div>
            </div>
            <div className="filter-actions">
              <button onClick={() => {
                setFilterCustomer(null)
                setFilterStatus('')
                setFilterConsultant('')
                setFilterBranch('')
                setFilterStartDate('')
                setFilterEndDate('')
              }}>
                Limpar
              </button>
            </div>
          </div>
        )}
      </FilterSection>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0 8px 0' }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>Ordenar por:</span>
        <select
          value={sortField}
          onChange={e => setSortField(e.target.value)}
          style={{ height: 32, borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 14 }}
        >
          <option value="date">Data da Solicitação</option>
          <option value="name">Nome da Empresa</option>
          <option value="status">Status</option>
        </select>
        <button
          onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
          style={{ height: 32, borderRadius: 6, border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontSize: 14 }}
          title={sortDirection === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <InboxContainer>
        <InboxSection>
          <div className="section-header" style={{cursor: 'pointer', justifyContent: 'space-between'}} onClick={() => setShowPending(v => !v)}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <Clock size={20} weight="fill" color="#F9CF58" />
              <h3>Pendentes</h3>
              <span className="count">{requests.filter(r => r.status_id === 1 || r.status_id === 2).length}</span>
            </div>
            {showPending ? <CaretUp size={18} style={{color: 'var(--secondary-text)'}} /> : <CaretDown size={18} style={{color: 'var(--secondary-text)'}} />}
          </div>
          {showPending && getSortedRequests(requests.filter(r => r.status_id === 1 || r.status_id === 2)).map(request => (
            <OrderCard key={request.id} onClick={() => handleOrderClick(request)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-bold" style={{ color: '#333333' }}>
                    {request.customer ?
                      `${request.customer.company_code || ''} - ${request.customer.name || ''}` :
                      request.company?.name || '-'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Solicitação {request.id}</div>
                  <div className="text-sm text-gray-500 mt-1">E-mail: {request.email_solicitante || '-'}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {typeof request.credit_limit_amt === 'number' ? `R$ ${request.credit_limit_amt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {dayjs(request.created_at).locale('pt-br').format('DD/MM/YYYY HH:mm')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {getStatusTag(request.status_id, request.status?.name)}
                  </div>
                </div>
              </div>
            </OrderCard>
          ))}
        </InboxSection>

        <InboxSection>
          <div className="section-header" style={{cursor: 'pointer', justifyContent: 'space-between'}} onClick={() => setShowCompleted(v => !v)}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <CheckCircle size={20} weight="fill" color="#3EB655" />
              <h3>Concluídas</h3>
              <span className="count">{requests.filter(r => r.status_id === 3 || r.status_id === 4).length}</span>
            </div>
            {showCompleted ? <CaretUp size={18} style={{color: 'var(--secondary-text)'}} /> : <CaretDown size={18} style={{color: 'var(--secondary-text)'}} />}
          </div>
          {showCompleted && getSortedRequests(requests.filter(r => r.status_id === 3 || r.status_id === 4)).map(request => (
            <OrderCard key={request.id} onClick={() => handleOrderClick(request)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-bold" style={{ color: '#333333' }}>
                    {request.customer ?
                      `${request.customer.company_code || ''} - ${request.customer.name || ''}` :
                      request.company?.name || '-'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Solicitação {request.id}</div>
                  <div className="text-sm text-gray-500 mt-1">E-mail: {request.email_solicitante || '-'}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {typeof request.credit_limit_amt === 'number' ? `R$ ${request.credit_limit_amt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {dayjs(request.created_at).locale('pt-br').format('DD/MM/YYYY HH:mm')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {getStatusTag(request.status_id, request.status?.name)}
                  </div>
                </div>
              </div>
            </OrderCard>
          ))}
        </InboxSection>
      </InboxContainer>
    </div>
  )
}

export default SalesOrders

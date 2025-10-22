import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Select from 'react-select';
import { FunnelSimple, CaretDown, CaretUp, Clock, CheckCircle } from '@phosphor-icons/react';
import { getSession } from '../../services/sessionService';
import RequestDetails from './RequestDetails';
import NewLimitOrder from './NewLimitOrder';
import { getCreditLimitRequests } from '../../services/creditLimitService';
import { getCurrentUserProfile } from '../../services/userProfileService';
import * as UI from '../UI/MySolicitationsUI'

const MySolicitations = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPending, setShowPending] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [userCompanyId, setUserCompanyId] = useState(null); // Alterado de userId para userCompanyId
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Buscar o company_id do usuário logado
  useEffect(() => {
    async function getUserCompanyId() {
      try {
        // Obter a sessão atual do usuário
        const { data: { session }, error } = await getSession();

        if (!session?.user?.id) {
          console.error('Usuário não autenticado');
          return;
        }

        // Buscar o perfil do usuário para obter a company_id associada
        const userProfile = await getCurrentUserProfile(session.user.id);
        
        if (!userProfile?.company_id) {
          console.error('Company_id não encontrado no perfil do usuário');
          return;
        }

        setUserCompanyId(userProfile.company_id);
      } catch (error) {
        console.error('Erro ao obter company_id do usuário:', error);
      }
    }

    getUserCompanyId();
  }, []);

  // Função para buscar solicitações
  const fetchRequests = async () => {
    if (!userCompanyId) return;
    try {
      setLoading(true);
      const data = await getCreditLimitRequests({
        companyId: userCompanyId,
        statusId: filterStatus,
        startDate: filterStartDate,
        endDate: filterEndDate
      });
      setRequests(data);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Buscar solicitações quando os filtros ou company ID mudar
  useEffect(() => {
    fetchRequests();
  }, [userCompanyId, filterStatus, filterStartDate, filterEndDate]);
  
  // Ouvir evento para atualizar a lista após exclusão
  useEffect(() => {
    const handleRefresh = () => {
      fetchRequests();
    };
    
    window.addEventListener('refreshMyRequests', handleRefresh);
    
    // Limpeza do event listener quando o componente for desmontado
    return () => {
      window.removeEventListener('refreshMyRequests', handleRefresh);
    };
  }, [userCompanyId, filterStatus, filterStartDate, filterEndDate]);

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
  };

  const handleEditRequest = (request) => {
    setIsEditing(true);
    setSelectedRequest(request);
  };

  const getStatusName = (status) => {
    if (!status) return 'Novo';
    return status.name || 'Novo';
  };

  const pendingRequests = requests.filter(r => r.status_id === 1 || r.status_id === 2);
  const completedRequests = requests.filter(r => r.status_id === 3 || r.status_id === 4);

  if (isEditing && selectedRequest) {
    return (
      <NewLimitOrder
        initialData={selectedRequest}
        onClose={() => {
          setIsEditing(false);
          setSelectedRequest(null);
        }}
      />
    );
  }

  if (selectedRequest) {
    return (
      <RequestDetails
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onEdit={handleEditRequest}
      />
    );
  }

  if (loading) {
    return (
      <UI.Container>
        <UI.Header>
          <h2 className="text-2xl font-semibold">Minhas Solicitações de Limite</h2>
        </UI.Header>
        <div className="text-center text-gray-500 mt-8">
          Carregando solicitações...
        </div>
      </UI.Container>
    );
  }

  return (
    <UI.Container>
      <UI.Header>
        <h2 className="text-2xl font-semibold">Minhas Solicitações de Limite</h2>
      </UI.Header>

      <UI.FilterSection>
        <div className="filter-header" onClick={() => setIsFilterOpen(!isFilterOpen)}>
          <div className="left">
            <FunnelSimple size={20} />
            <span>Filtros</span>
          </div>
          <CaretDown size={20} className={`icon ${isFilterOpen ? 'open' : ''}`} />
        </div>
        {isFilterOpen && (
          <div className="filter-content">
            <div className="filters">
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="1">Pendente</option>
                  <option value="2">Em Análise</option>
                  <option value="3">Aprovado</option>
                  <option value="4">Rejeitado</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Data da Solicitação</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={e => setFilterStartDate(e.target.value)}
                    style={{ width: '50%' }}
                  />
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={e => setFilterEndDate(e.target.value)}
                    style={{ width: '50%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </UI.FilterSection>

      <UI.InboxSection>
        <div className="section-header" onClick={() => setShowPending(!showPending)}>
          <div className="left">
            <Clock size={20} weight="fill" color="#F9CF58" />
            <h3>Pendentes</h3>
            <span className="count">{pendingRequests.length}</span>
          </div>
          {showPending ? <CaretUp size={18} /> : <CaretDown size={18} />}
        </div>
        {showPending && pendingRequests.map((request) => (
          <UI.RequestCard
            key={request.id}
            onClick={() => handleRequestClick(request)}
          >
            <div className="card-content">
              <div className="left-content">
                <div className="company-name">
                  {request.customer ?
                    `${request.customer.company_code || ''} - ${request.customer.name || ''}` :
                    request.company?.name || 'Nome não disponível'}
                </div>
                <div className="request-date">
                  Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="right-content">
                <div className="amount">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(request.credit_limit_amt)}
                </div>
                <div className={`status-badge status-${request.status_id}`}>
                  {getStatusName(request.status)}
                </div>
              </div>
            </div>
          </UI.RequestCard>
        ))}
      </UI.InboxSection>

      <UI.InboxSection>
        <div className="section-header" onClick={() => setShowCompleted(!showCompleted)}>
          <div className="left">
            <CheckCircle size={20} weight="fill" color="#3EB655" />
            <h3>Concluídas</h3>
            <span className="count">{completedRequests.length}</span>
          </div>
          {showCompleted ? <CaretUp size={18} /> : <CaretDown size={18} />}
        </div>
        {showCompleted && completedRequests.map((request) => (
          <UI.RequestCard
            key={request.id}
            onClick={() => handleRequestClick(request)}
          >
            <div className="card-content">
              <div className="left-content">
                <div className="company-name">
                  {request.customer ?
                    `${request.customer.company_code || ''} - ${request.customer.name || ''}` :
                    request.company?.name || 'Nome não disponível'}
                </div>
                <div className="request-date">
                  Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="right-content">
                <div className="amount">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(request.credit_limit_amt)}
                </div>
                <div className={`status-badge status-${request.status_id}`}>
                  {getStatusName(request.status)}
                </div>
              </div>
            </div>
          </UI.RequestCard>
        ))}
      </UI.InboxSection>

      {requests.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Nenhuma solicitação encontrada
        </div>
      )}
    </UI.Container>
  );
};

export default MySolicitations;

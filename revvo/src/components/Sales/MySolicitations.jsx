import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Select from 'react-select';
import { FunnelSimple, CaretDown, CaretUp, Clock, CheckCircle } from '@phosphor-icons/react';
import RequestDetails from './RequestDetails';
import NewLimitOrder from './NewLimitOrder';
import * as UI from '../UI/MySolicitationsUI'

// Mock data para solicitações
const mockRequests = [
  {
    id: 1,
    customer: {
      company_code: '001',
      name: 'Hospital Santa Casa'
    },
    credit_limit_amt: 500000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-15T10:30:00'
  },
  {
    id: 2,
    customer: {
      company_code: '002',
      name: 'Clínica Bella Vita'
    },
    credit_limit_amt: 250000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-18T14:20:00'
  },
  {
    id: 3,
    customer: {
      company_code: '003',
      name: 'Instituto Médico São Paulo'
    },
    credit_limit_amt: 750000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-20T09:15:00'
  },
  {
    id: 4,
    customer: {
      company_code: '004',
      name: 'Laboratório Vida Diagnóstica'
    },
    credit_limit_amt: 400000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-10-10T11:45:00'
  },
  {
    id: 5,
    customer: {
      company_code: '005',
      name: 'Clínica Odontológica Sorrir'
    },
    credit_limit_amt: 150000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-10-08T16:30:00'
  },
  {
    id: 6,
    customer: {
      company_code: '006',
      name: 'Hospital Materno Infantil'
    },
    credit_limit_amt: 900000,
    status_id: 4,
    status: { name: 'Rejeitado' },
    created_at: '2024-10-12T13:00:00'
  },
  {
    id: 7,
    customer: {
      company_code: '007',
      name: 'Centro de Reabilitação Viver'
    },
    credit_limit_amt: 300000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-19T08:45:00'
  },
  {
    id: 8,
    customer: {
      company_code: '008',
      name: 'Policlínica Central'
    },
    credit_limit_amt: 600000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-21T15:20:00'
  },
  {
    id: 9,
    customer: {
      company_code: '009',
      name: 'Clínica de Imagens MedScan'
    },
    credit_limit_amt: 350000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-10-05T10:00:00'
  },
  {
    id: 10,
    customer: {
      company_code: '010',
      name: 'Hospital Oncológico Esperança'
    },
    credit_limit_amt: 1200000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-17T12:30:00'
  },
  {
    id: 11,
    customer: {
      company_code: '011',
      name: 'Farmácia e Drogaria São José'
    },
    credit_limit_amt: 200000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-22T09:00:00'
  },
  {
    id: 12,
    customer: {
      company_code: '012',
      name: 'Clínica de Fisioterapia Movimento'
    },
    credit_limit_amt: 180000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-10-03T14:15:00'
  },
  {
    id: 13,
    customer: {
      company_code: '013',
      name: 'Centro Médico Avançado'
    },
    credit_limit_amt: 450000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-16T11:20:00'
  },
  {
    id: 14,
    customer: {
      company_code: '014',
      name: 'Hospital Regional Norte'
    },
    credit_limit_amt: 800000,
    status_id: 4,
    status: { name: 'Rejeitado' },
    created_at: '2024-10-09T16:45:00'
  },
  {
    id: 15,
    customer: {
      company_code: '015',
      name: 'Clínica Especializada Sul'
    },
    credit_limit_amt: 350000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-21T10:00:00'
  },
  {
    id: 16,
    customer: {
      company_code: '016',
      name: 'Laboratório LabMais'
    },
    credit_limit_amt: 280000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-14T13:30:00'
  },
  {
    id: 17,
    customer: {
      company_code: '017',
      name: 'Clínica Cardiológica Coração Forte'
    },
    credit_limit_amt: 520000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-10-02T08:20:00'
  },
  {
    id: 18,
    customer: {
      company_code: '018',
      name: 'Hospital Veterinário PetCare'
    },
    credit_limit_amt: 120000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-20T15:40:00'
  },
  {
    id: 19,
    customer: {
      company_code: '019',
      name: 'Centro de Tratamento Intensivo'
    },
    credit_limit_amt: 950000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-11T12:00:00'
  },
  {
    id: 20,
    customer: {
      company_code: '020',
      name: 'Farmácia Medicamentos Especiais'
    },
    credit_limit_amt: 220000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-09-28T10:30:00'
  },
  {
    id: 21,
    customer: {
      company_code: '021',
      name: 'Clínica de Estética Beleza Total'
    },
    credit_limit_amt: 160000,
    status_id: 4,
    status: { name: 'Rejeitado' },
    created_at: '2024-10-07T14:50:00'
  },
  {
    id: 22,
    customer: {
      company_code: '022',
      name: 'Laboratório Análises Rápidas'
    },
    credit_limit_amt: 380000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-19T09:25:00'
  },
  {
    id: 23,
    customer: {
      company_code: '023',
      name: 'Consultório Odontológico Dental Saúde'
    },
    credit_limit_amt: 140000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-13T16:10:00'
  },
  {
    id: 24,
    customer: {
      company_code: '024',
      name: 'Centro Radiológico Imagem Perfeita'
    },
    credit_limit_amt: 420000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-09-30T11:45:00'
  },
  {
    id: 25,
    customer: {
      company_code: '025',
      name: 'Clínica Neurológica NeuroCare'
    },
    credit_limit_amt: 480000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-18T08:00:00'
  },
  {
    id: 26,
    customer: {
      company_code: '026',
      name: 'Hospital Dia Cirurgia Rápida'
    },
    credit_limit_amt: 650000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-15T13:15:00'
  },
  {
    id: 27,
    customer: {
      company_code: '027',
      name: 'Farmácia de Manipulação Fórmula Certa'
    },
    credit_limit_amt: 190000,
    status_id: 3,
    status: { name: 'Aprovado' },
    created_at: '2024-09-25T15:20:00'
  },
  {
    id: 28,
    customer: {
      company_code: '028',
      name: 'Clínica Pediátrica Infância Feliz'
    },
    credit_limit_amt: 320000,
    status_id: 4,
    status: { name: 'Rejeitado' },
    created_at: '2024-10-06T10:35:00'
  },
  {
    id: 29,
    customer: {
      company_code: '029',
      name: 'Hospital Psiquiátrico Mente Sã'
    },
    credit_limit_amt: 720000,
    status_id: 1,
    status: { name: 'Pendente' },
    created_at: '2024-10-22T11:50:00'
  },
  {
    id: 30,
    customer: {
      company_code: '030',
      name: 'Centro de Diagnóstico por Imagem'
    },
    credit_limit_amt: 410000,
    status_id: 2,
    status: { name: 'Em Análise' },
    created_at: '2024-10-12T09:40:00'
  }
];

const MySolicitations = () => {
  const [requests, setRequests] = useState(mockRequests);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPending, setShowPending] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Aplicar filtros aos dados mock
  useEffect(() => {
    let filtered = [...mockRequests];

    // Filtro por status
    if (filterStatus) {
      filtered = filtered.filter(r => r.status_id === parseInt(filterStatus));
    }

    // Filtro por data
    if (filterStartDate) {
      filtered = filtered.filter(r => new Date(r.created_at) >= new Date(filterStartDate));
    }
    if (filterEndDate) {
      filtered = filtered.filter(r => new Date(r.created_at) <= new Date(filterEndDate));
    }

    setRequests(filtered);
  }, [filterStatus, filterStartDate, filterEndDate]);

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

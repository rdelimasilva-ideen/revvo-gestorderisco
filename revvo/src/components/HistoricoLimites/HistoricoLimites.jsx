import React, { useState } from 'react';
import * as UI from '../UI/HistoricoLimitesUI';
import { ArrowUpRight, ArrowDownRight, Clock, AlertCircle, XCircle, Calendar, AlertTriangle } from 'lucide-react';
import { FunnelSimple, CaretDown } from '@phosphor-icons/react';


const HistoricoLimites = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    cliente: '',
    status: 'ativo',
    periodo: ''
  });

  // Mock data para limites ativos
  const activeLimitsData = [
    {
      id: 1,
      name: 'Hospital Santa Casa',
      document: '12.345.678/0001-90',
      totalLimit: 500000,
      usedLimit: 325000,
      usagePercentage: 65,
      trend: 'up',
      trendValue: 12
    },
    {
      id: 2,
      name: 'Clínica Bella Vita',
      document: '98.765.432/0001-10',
      totalLimit: 250000,
      usedLimit: 87500,
      usagePercentage: 35,
      trend: 'down',
      trendValue: 8
    },
    {
      id: 3,
      name: 'Instituto Médico São Paulo',
      document: '11.222.333/0001-44',
      totalLimit: 750000,
      usedLimit: 637500,
      usagePercentage: 85,
      trend: 'up',
      trendValue: 15
    },
    {
      id: 4,
      name: 'Laboratório Vida Diagnóstica',
      document: '22.333.444/0001-55',
      totalLimit: 400000,
      usedLimit: 180000,
      usagePercentage: 45,
      trend: 'up',
      trendValue: 5
    },
    {
      id: 5,
      name: 'Clínica Odontológica Sorrir',
      document: '33.444.555/0001-66',
      totalLimit: 150000,
      usedLimit: 127500,
      usagePercentage: 85,
      trend: 'up',
      trendValue: 20
    },
    {
      id: 6,
      name: 'Hospital Materno Infantil',
      document: '44.555.666/0001-77',
      totalLimit: 900000,
      usedLimit: 450000,
      usagePercentage: 50,
      trend: 'down',
      trendValue: 10
    },
    {
      id: 7,
      name: 'Centro de Reabilitação Viver',
      document: '55.666.777/0001-88',
      totalLimit: 300000,
      usedLimit: 75000,
      usagePercentage: 25,
      trend: 'down',
      trendValue: 15
    },
    {
      id: 8,
      name: 'Policlínica Central',
      document: '66.777.888/0001-99',
      totalLimit: 600000,
      usedLimit: 540000,
      usagePercentage: 90,
      trend: 'up',
      trendValue: 25
    },
    {
      id: 9,
      name: 'Clínica de Imagens MedScan',
      document: '77.888.999/0001-00',
      totalLimit: 350000,
      usedLimit: 210000,
      usagePercentage: 60,
      trend: 'up',
      trendValue: 8
    },
    {
      id: 10,
      name: 'Hospital Oncológico Esperança',
      document: '88.999.000/0001-11',
      totalLimit: 1200000,
      usedLimit: 360000,
      usagePercentage: 30,
      trend: 'down',
      trendValue: 5
    },
    {
      id: 11,
      name: 'Farmácia e Drogaria São José',
      document: '99.000.111/0001-22',
      totalLimit: 200000,
      usedLimit: 160000,
      usagePercentage: 80,
      trend: 'up',
      trendValue: 18
    },
    {
      id: 12,
      name: 'Clínica de Fisioterapia Movimento',
      document: '00.111.222/0001-33',
      totalLimit: 180000,
      usedLimit: 54000,
      usagePercentage: 30,
      trend: 'down',
      trendValue: 12
    }
  ];

  // Mock data para limites em revisão
  const limitsUnderRevisionData = [
    {
      id: 1,
      name: 'Centro Médico Avançado',
      document: '55.666.777/0001-88',
      currentLimit: 300000,
      requestedLimit: 450000,
      reason: 'Aumento de Faturamento',
      status: 'Em Análise',
      timeInAnalysis: '5 dias'
    },
    {
      id: 2,
      name: 'Hospital Regional Norte',
      document: '99.888.777/0001-66',
      currentLimit: 600000,
      requestedLimit: 400000,
      reason: 'Deterioração Score',
      status: 'Pendente Documentação',
      timeInAnalysis: '12 dias'
    },
    {
      id: 3,
      name: 'Clínica Especializada Sul',
      document: '44.333.222/0001-11',
      currentLimit: 200000,
      requestedLimit: 350000,
      reason: 'Expansão Operacional',
      status: 'Aprovação Final',
      timeInAnalysis: '3 dias'
    },
    {
      id: 4,
      name: 'Laboratório LabMais',
      document: '11.222.333/0001-99',
      currentLimit: 250000,
      requestedLimit: 400000,
      reason: 'Nova Unidade',
      status: 'Em Análise',
      timeInAnalysis: '7 dias'
    },
    {
      id: 5,
      name: 'Clínica Cardiológica Coração Forte',
      document: '22.333.444/0001-88',
      currentLimit: 500000,
      requestedLimit: 750000,
      reason: 'Crescimento de Demanda',
      status: 'Em Análise',
      timeInAnalysis: '2 dias'
    },
    {
      id: 6,
      name: 'Hospital Veterinário PetCare',
      document: '33.444.555/0001-77',
      currentLimit: 150000,
      requestedLimit: 100000,
      reason: 'Redução Voluntária',
      status: 'Aprovação Final',
      timeInAnalysis: '1 dia'
    },
    {
      id: 7,
      name: 'Centro de Tratamento Intensivo',
      document: '44.555.666/0001-66',
      currentLimit: 800000,
      requestedLimit: 1200000,
      reason: 'Ampliação de Leitos',
      status: 'Pendente Documentação',
      timeInAnalysis: '15 dias'
    },
    {
      id: 8,
      name: 'Farmácia Medicamentos Especiais',
      document: '55.666.777/0001-55',
      currentLimit: 180000,
      requestedLimit: 280000,
      reason: 'Novos Convênios',
      status: 'Em Análise',
      timeInAnalysis: '4 dias'
    }
  ];

  // Mock data para limites rejeitados
  const rejectedLimitsData = [
    {
      id: 1,
      name: 'Clínica Popular Centro',
      document: '77.888.999/0001-22',
      requestedLimit: 400000,
      rejectionReason: {
        primary: 'Score de Crédito Insuficiente',
        details: 'Score abaixo do mínimo exigido para o valor solicitado',
        severity: 'high'
      },
      analysisDate: '15/12/2024',
      analyst: 'Ana Silva',
      newRequestAllowed: true,
      waitingPeriod: '30 dias'
    },
    {
      id: 2,
      name: 'Hospital Comunitário',
      document: '33.444.555/0001-77',
      requestedLimit: 600000,
      rejectionReason: {
        primary: 'Histórico de Inadimplência',
        details: 'Registros de atraso nos últimos 6 meses',
        severity: 'medium'
      },
      analysisDate: '10/12/2024',
      analyst: 'Carlos Santos',
      newRequestAllowed: true,
      waitingPeriod: '60 dias'
    },
    {
      id: 3,
      name: 'Centro de Diagnóstico',
      document: '66.777.888/0001-33',
      requestedLimit: 300000,
      rejectionReason: {
        primary: 'Documentação Incompleta',
        details: 'Faltam comprovantes de faturamento atualizados',
        severity: 'low'
      },
      analysisDate: '08/12/2024',
      analyst: 'Maria Oliveira',
      newRequestAllowed: true,
      waitingPeriod: '15 dias'
    },
    {
      id: 4,
      name: 'Clínica de Estética Beleza Total',
      document: '88.999.000/0001-44',
      requestedLimit: 250000,
      rejectionReason: {
        primary: 'Tempo de Operação Insuficiente',
        details: 'Empresa com menos de 12 meses de funcionamento',
        severity: 'medium'
      },
      analysisDate: '18/12/2024',
      analyst: 'Pedro Almeida',
      newRequestAllowed: true,
      waitingPeriod: '90 dias'
    },
    {
      id: 5,
      name: 'Laboratório Análises Rápidas',
      document: '99.000.111/0001-55',
      requestedLimit: 500000,
      rejectionReason: {
        primary: 'Restrições Financeiras',
        details: 'Patrimônio líquido incompatível com o limite solicitado',
        severity: 'high'
      },
      analysisDate: '12/12/2024',
      analyst: 'Juliana Costa',
      newRequestAllowed: true,
      waitingPeriod: '45 dias'
    },
    {
      id: 6,
      name: 'Consultório Odontológico Dental Saúde',
      document: '00.111.222/0001-66',
      requestedLimit: 180000,
      rejectionReason: {
        primary: 'Faturamento Insuficiente',
        details: 'Faturamento médio mensal abaixo do necessário',
        severity: 'medium'
      },
      analysisDate: '05/12/2024',
      analyst: 'Roberto Fernandes',
      newRequestAllowed: true,
      waitingPeriod: '30 dias'
    },
    {
      id: 7,
      name: 'Centro Radiológico Imagem Perfeita',
      document: '11.222.333/0001-77',
      requestedLimit: 450000,
      rejectionReason: {
        primary: 'Processos Judiciais Pendentes',
        details: 'Existem processos trabalhistas em andamento',
        severity: 'high'
      },
      analysisDate: '20/12/2024',
      analyst: 'Ana Silva',
      newRequestAllowed: false,
      waitingPeriod: 'Após resolução judicial'
    },
    {
      id: 8,
      name: 'Clínica Neurológica NeuroCare',
      document: '22.333.444/0001-88',
      requestedLimit: 350000,
      rejectionReason: {
        primary: 'Concentração de Risco',
        details: 'Cliente já possui limite elevado em outras linhas de crédito',
        severity: 'medium'
      },
      analysisDate: '03/12/2024',
      analyst: 'Carlos Santos',
      newRequestAllowed: true,
      waitingPeriod: '60 dias'
    },
    {
      id: 9,
      name: 'Hospital Dia Cirurgia Rápida',
      document: '33.444.555/0001-99',
      requestedLimit: 700000,
      rejectionReason: {
        primary: 'Alteração Societária Recente',
        details: 'Mudança de sócios nos últimos 6 meses',
        severity: 'low'
      },
      analysisDate: '01/12/2024',
      analyst: 'Maria Oliveira',
      newRequestAllowed: true,
      waitingPeriod: '20 dias'
    },
    {
      id: 10,
      name: 'Farmácia de Manipulação Fórmula Certa',
      document: '44.555.666/0001-00',
      requestedLimit: 220000,
      rejectionReason: {
        primary: 'Dados Cadastrais Desatualizados',
        details: 'Informações cadastrais com mais de 2 anos sem atualização',
        severity: 'low'
      },
      analysisDate: '28/11/2024',
      analyst: 'Pedro Almeida',
      newRequestAllowed: true,
      waitingPeriod: '10 dias'
    }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getUsageClass = (percentage) => {
    if (percentage >= 80) return 'high-usage';
    if (percentage >= 60) return 'medium-usage';
    return 'low-usage';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Em Análise': return 'em-analise';
      case 'Pendente Documentação': return 'pendente-doc';
      case 'Aprovação Final': return 'aprovacao-final';
      default: return 'em-analise';
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high': return 'high-severity';
      case 'medium': return 'medium-severity';
      case 'low': return 'low-severity';
      default: return 'medium-severity';
    }
  };

  const renderActiveLimits = () => (
    <UI.TableContainer>
      <UI.Table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Documento</th>
            <th>Limite Total</th>
            <th>Limite Utilizado</th>
            <th>Uso (%)</th>
            <th>Tendência</th>
          </tr>
        </thead>
        <tbody>
          {activeLimitsData.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.document}</td>
              <td>{formatCurrency(row.totalLimit)}</td>
              <td>{formatCurrency(row.usedLimit)}</td>
              <td>
                <UI.StatusBadge className={getUsageClass(row.usagePercentage)}>
                  {row.usagePercentage}%
                </UI.StatusBadge>
              </td>
              <td>
                <UI.TrendIcon>
                  {row.trend === 'up' ? (
                    <ArrowUpRight className="trend-up" size={16} />
                  ) : (
                    <ArrowDownRight className="trend-down" size={16} />
                  )}
                  <span>{row.trendValue}%</span>
                </UI.TrendIcon>
              </td>
            </tr>
          ))}
        </tbody>
      </UI.Table>
    </UI.TableContainer>
  );

  const renderLimitsUnderRevision = () => (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Documento</th>
            <th>Limite Atual</th>
            <th>Limite Solicitado</th>
            <th>Motivo</th>
            <th>Status</th>
            <th>Tempo em Análise</th>
          </tr>
        </thead>
        <tbody>
          {limitsUnderRevisionData.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.document}</td>
              <td>{formatCurrency(row.currentLimit)}</td>
              <td>{formatCurrency(row.requestedLimit)}</td>
              <td>{row.reason}</td>
              <td>
                <StatusBadge className={getStatusClass(row.status)}>
                  {row.status}
                </StatusBadge>
              </td>
              <td>{row.timeInAnalysis}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );

  const renderRejectedLimits = () => (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Documento</th>
            <th>Limite Solicitado</th>
            <th>Motivo da Rejeição</th>
            <th>Detalhes</th>
            <th>Gravidade</th>
            <th>Data da Análise</th>
            <th>Analista</th>
            <th>Novo Pedido</th>
          </tr>
        </thead>
        <tbody>
          {rejectedLimitsData.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.document}</td>
              <td>{formatCurrency(row.requestedLimit)}</td>
              <td>{row.rejectionReason.primary}</td>
              <td>{row.rejectionReason.details}</td>
              <td>
                <StatusBadge className={getSeverityClass(row.rejectionReason.severity)}>
                  {row.rejectionReason.severity}
                </StatusBadge>
              </td>
              <td>{row.analysisDate}</td>
              <td>{row.analyst}</td>
              <td>{row.newRequestAllowed ? `Em ${row.waitingPeriod}` : 'Não permitido'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );

  const renderFilteredContent = () => {
    if (filters.status === 'ativo') return renderActiveLimits();
    if (filters.status === 'revisao') return renderLimitsUnderRevision();
    if (filters.status === 'rejeitado') return renderRejectedLimits();
    return null;
  };

  return (
    <UI.Container>
      <UI.Header>
        <h2>Histórico de Limites</h2>
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
                <label>Cliente</label>
                <select
                  value={filters.cliente}
                  onChange={(e) => setFilters({ ...filters, cliente: e.target.value })}
                >
                  <option value="">Todos os clientes</option>
                  <option value="hospital">Hospital Santa Casa</option>
                  <option value="clinica">Clínica Bella Vita</option>
                  <option value="instituto">Instituto Médico São Paulo</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="ativo">Ativo</option>
                  <option value="revisao">Em Revisão</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Período</label>
                <select
                  value={filters.periodo}
                  onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
                >
                  <option value="">Todos os períodos</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="180">Últimos 6 meses</option>
                  <option value="365">Último ano</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </UI.FilterSection>
      {renderFilteredContent()}
    </UI.Container>
  );
};

export default HistoricoLimites;

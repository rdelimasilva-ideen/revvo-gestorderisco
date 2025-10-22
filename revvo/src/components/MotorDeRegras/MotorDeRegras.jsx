import React, { useState } from 'react';
import * as UI from '../UI/MotorDeRegrasUI';
import { Plus, Pencil, Trash2, Play, Pause, Copy } from 'lucide-react';

const MotorDeRegras = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'todas',
    tipo: 'todas',
    busca: ''
  });

  // Mock data para regras
  const rulesData = [
    {
      id: 1,
      nome: 'Limite Automático por Score',
      descricao: 'Define limite de crédito baseado no score comportamental',
      tipo: 'Crédito',
      status: 'ativa',
      condicoes: [
        { campo: 'Score', operador: '>=', valor: '800' },
        { campo: 'Inadimplência', operador: '=', valor: '0' }
      ],
      acoes: [
        { tipo: 'Definir Limite', valor: 'R$ 100.000' },
        { tipo: 'Aprovação', valor: 'Automática' }
      ],
      ultima_execucao: '2024-10-20 14:30',
      execucoes: 145
    },
    {
      id: 2,
      nome: 'Alerta de Inadimplência',
      descricao: 'Notifica quando cliente possui títulos vencidos',
      tipo: 'Alerta',
      status: 'ativa',
      condicoes: [
        { campo: 'Títulos Vencidos', operador: '>', valor: '0' },
        { campo: 'Valor Total Vencido', operador: '>', valor: '10000' }
      ],
      acoes: [
        { tipo: 'Enviar Email', valor: 'Equipe de Cobrança' },
        { tipo: 'Bloquear Pedidos', valor: 'Sim' }
      ],
      ultima_execucao: '2024-10-21 09:15',
      execucoes: 23
    },
    {
      id: 3,
      nome: 'Workflow de Aprovação por Valor',
      descricao: 'Encaminha pedidos para aprovação baseado no valor',
      tipo: 'Workflow',
      status: 'ativa',
      condicoes: [
        { campo: 'Valor do Pedido', operador: '>', valor: '50000' }
      ],
      acoes: [
        { tipo: 'Encaminhar para', valor: 'Gerente Comercial' },
        { tipo: 'Prazo de Resposta', valor: '24 horas' }
      ],
      ultima_execucao: '2024-10-22 11:45',
      execucoes: 67
    },
    {
      id: 4,
      nome: 'Redução de Limite por Atraso',
      descricao: 'Reduz limite automaticamente em caso de atrasos recorrentes',
      tipo: 'Crédito',
      status: 'inativa',
      condicoes: [
        { campo: 'Atrasos nos últimos 90 dias', operador: '>=', valor: '3' },
        { campo: 'Dias de Atraso Médio', operador: '>', valor: '15' }
      ],
      acoes: [
        { tipo: 'Reduzir Limite', valor: '30%' },
        { tipo: 'Notificar', valor: 'Gestor de Crédito' }
      ],
      ultima_execucao: '2024-09-15 16:20',
      execucoes: 8
    },
    {
      id: 5,
      nome: 'Aprovação Rápida Clientes Premium',
      descricao: 'Aprovação automática para clientes com histórico excelente',
      tipo: 'Workflow',
      status: 'ativa',
      condicoes: [
        { campo: 'Score', operador: '>=', valor: '900' },
        { campo: 'Tempo de Relacionamento', operador: '>', valor: '24 meses' },
        { campo: 'Inadimplência Histórica', operador: '=', valor: '0' }
      ],
      acoes: [
        { tipo: 'Aprovação', valor: 'Automática' },
        { tipo: 'Prioridade', valor: 'Alta' },
        { tipo: 'Benefício', valor: 'Taxa reduzida 5%' }
      ],
      ultima_execucao: '2024-10-22 10:20',
      execucoes: 89
    },
    {
      id: 6,
      nome: 'Alerta de Concentração de Risco',
      descricao: 'Notifica quando um cliente atinge 80% do limite disponível',
      tipo: 'Alerta',
      status: 'ativa',
      condicoes: [
        { campo: 'Utilização do Limite', operador: '>=', valor: '80%' }
      ],
      acoes: [
        { tipo: 'Enviar Email', valor: 'Analista de Crédito' },
        { tipo: 'Criar Tarefa', valor: 'Revisar limite' },
        { tipo: 'Dashboard', valor: 'Destacar cliente' }
      ],
      ultima_execucao: '2024-10-22 08:45',
      execucoes: 34
    },
    {
      id: 7,
      nome: 'Bloqueio por Protesto',
      descricao: 'Bloqueia automaticamente vendas para clientes com protestos',
      tipo: 'Crédito',
      status: 'ativa',
      condicoes: [
        { campo: 'Protestos Ativos', operador: '>', valor: '0' },
        { campo: 'Valor Total Protestos', operador: '>', valor: '5000' }
      ],
      acoes: [
        { tipo: 'Bloquear Pedidos', valor: 'Sim' },
        { tipo: 'Definir Limite', valor: 'R$ 0' },
        { tipo: 'Notificar', valor: 'Gerente de Risco' }
      ],
      ultima_execucao: '2024-10-21 15:30',
      execucoes: 12
    },
    {
      id: 8,
      nome: 'Workflow Primeira Compra',
      descricao: 'Encaminha para aprovação manual a primeira compra de novos clientes',
      tipo: 'Workflow',
      status: 'ativa',
      condicoes: [
        { campo: 'Total de Pedidos', operador: '=', valor: '0' },
        { campo: 'Cadastro Completo', operador: '=', valor: 'Sim' }
      ],
      acoes: [
        { tipo: 'Encaminhar para', valor: 'Analista de Crédito Senior' },
        { tipo: 'Solicitar', valor: 'Análise de documentos' },
        { tipo: 'Prazo SLA', valor: '48 horas' }
      ],
      ultima_execucao: '2024-10-22 09:00',
      execucoes: 28
    },
    {
      id: 9,
      nome: 'Aumento Automático de Limite',
      descricao: 'Aumenta limite para clientes com bom histórico de pagamento',
      tipo: 'Crédito',
      status: 'ativa',
      condicoes: [
        { campo: 'Score', operador: '>=', valor: '750' },
        { campo: 'Pagamentos em Dia', operador: '>=', valor: '95%' },
        { campo: 'Tempo de Relacionamento', operador: '>', valor: '12 meses' }
      ],
      acoes: [
        { tipo: 'Aumentar Limite', valor: '20%' },
        { tipo: 'Enviar Email', valor: 'Cliente' },
        { tipo: 'Registrar', valor: 'Histórico de limite' }
      ],
      ultima_execucao: '2024-10-20 18:00',
      execucoes: 56
    },
    {
      id: 10,
      nome: 'Alerta Vencimento Próximo',
      descricao: 'Notifica cliente sobre títulos próximos ao vencimento',
      tipo: 'Alerta',
      status: 'ativa',
      condicoes: [
        { campo: 'Dias até Vencimento', operador: '<=', valor: '5' },
        { campo: 'Valor do Título', operador: '>', valor: '1000' }
      ],
      acoes: [
        { tipo: 'Enviar Email', valor: 'Cliente' },
        { tipo: 'Enviar SMS', valor: 'Financeiro do Cliente' },
        { tipo: 'Criar Lembrete', valor: 'Equipe de Cobrança' }
      ],
      ultima_execucao: '2024-10-22 07:00',
      execucoes: 156
    },
    {
      id: 11,
      nome: 'Revisão Trimestral de Limites',
      descricao: 'Agenda revisão automática de limites a cada 3 meses',
      tipo: 'Workflow',
      status: 'inativa',
      condicoes: [
        { campo: 'Última Revisão', operador: '>', valor: '90 dias' },
        { campo: 'Limite Ativo', operador: '>', valor: 'R$ 0' }
      ],
      acoes: [
        { tipo: 'Criar Tarefa', valor: 'Analista de Crédito' },
        { tipo: 'Gerar Relatório', valor: 'Comportamento do cliente' },
        { tipo: 'Agendar', valor: 'Reunião de análise' }
      ],
      ultima_execucao: '2024-07-15 10:00',
      execucoes: 203
    },
    {
      id: 12,
      nome: 'Desconto por Antecipação',
      descricao: 'Oferece desconto automático para pagamento antecipado',
      tipo: 'Crédito',
      status: 'ativa',
      condicoes: [
        { campo: 'Dias de Antecipação', operador: '>=', valor: '10' },
        { campo: 'Valor da Fatura', operador: '>', valor: '20000' }
      ],
      acoes: [
        { tipo: 'Aplicar Desconto', valor: '2%' },
        { tipo: 'Enviar Oferta', valor: 'Cliente' },
        { tipo: 'Registrar', valor: 'Incentivo aplicado' }
      ],
      ultima_execucao: '2024-10-21 16:45',
      execucoes: 42
    },
    {
      id: 13,
      nome: 'Escalonamento de Inadimplência',
      descricao: 'Escala notificações conforme dias de atraso aumentam',
      tipo: 'Alerta',
      status: 'ativa',
      condicoes: [
        { campo: 'Dias de Atraso', operador: 'IN', valor: '[15, 30, 60, 90]' }
      ],
      acoes: [
        { tipo: 'Email 15 dias', valor: 'Lembrete amigável' },
        { tipo: 'Email 30 dias', valor: 'Aviso formal' },
        { tipo: 'Email 60 dias', valor: 'Última notificação' },
        { tipo: 'Email 90 dias', valor: 'Encaminhar jurídico' }
      ],
      ultima_execucao: '2024-10-22 06:00',
      execucoes: 78
    },
    {
      id: 14,
      nome: 'Validação de Dados Cadastrais',
      descricao: 'Valida atualização de dados cadastrais periodicamente',
      tipo: 'Workflow',
      status: 'ativa',
      condicoes: [
        { campo: 'Última Atualização Cadastral', operador: '>', valor: '365 dias' }
      ],
      acoes: [
        { tipo: 'Enviar Formulário', valor: 'Cliente' },
        { tipo: 'Criar Tarefa', valor: 'Relacionamento' },
        { tipo: 'Marcar', valor: 'Pendente atualização' }
      ],
      ultima_execucao: '2024-10-20 12:00',
      execucoes: 91
    },
    {
      id: 15,
      nome: 'Alerta de Negativação Externa',
      descricao: 'Monitora negativações em bureaus de crédito',
      tipo: 'Alerta',
      status: 'ativa',
      condicoes: [
        { campo: 'Serasa/SPC', operador: '!=', valor: 'Limpo' },
        { campo: 'Data da Consulta', operador: '=', valor: 'Hoje' }
      ],
      acoes: [
        { tipo: 'Notificar', valor: 'Gestor de Risco' },
        { tipo: 'Suspender', valor: 'Novos pedidos' },
        { tipo: 'Agendar', valor: 'Reavaliação de crédito' }
      ],
      ultima_execucao: '2024-10-22 05:00',
      execucoes: 15
    }
  ];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleNewRule = () => {
    setSelectedRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const handleDeleteRule = (ruleId) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      console.log('Deletando regra:', ruleId);
      // Implementar lógica de deleção
    }
  };

  const handleToggleStatus = (ruleId, currentStatus) => {
    const newStatus = currentStatus === 'ativa' ? 'inativa' : 'ativa';
    console.log('Alterando status da regra:', ruleId, 'para:', newStatus);
    // Implementar lógica de alteração de status
  };

  const handleDuplicateRule = (rule) => {
    console.log('Duplicando regra:', rule.id);
    // Implementar lógica de duplicação
  };

  // Filtrar regras
  const filteredRules = rulesData.filter(rule => {
    const matchStatus = filters.status === 'todas' || rule.status === filters.status;
    const matchTipo = filters.tipo === 'todas' || rule.tipo.toLowerCase() === filters.tipo.toLowerCase();
    const matchBusca = !filters.busca ||
      rule.nome.toLowerCase().includes(filters.busca.toLowerCase()) ||
      rule.descricao.toLowerCase().includes(filters.busca.toLowerCase());

    return matchStatus && matchTipo && matchBusca;
  });

  return (
    <UI.Container>
      <UI.Header>
        <div>
          <UI.Title>Motor de Regras</UI.Title>
          <UI.Subtitle>Gerencie regras automáticas de crédito, alertas e workflows</UI.Subtitle>
        </div>
        <UI.HeaderActions>
          <UI.FilterButton onClick={() => setIsFilterOpen(!isFilterOpen)}>
            Filtros
          </UI.FilterButton>
          <UI.PrimaryButton onClick={handleNewRule}>
            <Plus size={16} />
            Nova Regra
          </UI.PrimaryButton>
        </UI.HeaderActions>
      </UI.Header>

      {isFilterOpen && (
        <UI.FilterContainer>
          <UI.FilterGroup>
            <UI.FilterLabel>Status</UI.FilterLabel>
            <UI.Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="todas">Todas</option>
              <option value="ativa">Ativas</option>
              <option value="inativa">Inativas</option>
            </UI.Select>
          </UI.FilterGroup>

          <UI.FilterGroup>
            <UI.FilterLabel>Tipo</UI.FilterLabel>
            <UI.Select
              value={filters.tipo}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
            >
              <option value="todas">Todos</option>
              <option value="crédito">Crédito</option>
              <option value="alerta">Alerta</option>
              <option value="workflow">Workflow</option>
            </UI.Select>
          </UI.FilterGroup>

          <UI.FilterGroup style={{ flex: 2 }}>
            <UI.FilterLabel>Buscar</UI.FilterLabel>
            <UI.SearchInput
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={filters.busca}
              onChange={(e) => handleFilterChange('busca', e.target.value)}
            />
          </UI.FilterGroup>
        </UI.FilterContainer>
      )}

      <UI.StatsContainer>
        <UI.StatCard>
          <UI.StatLabel>Total de Regras</UI.StatLabel>
          <UI.StatValue>{rulesData.length}</UI.StatValue>
        </UI.StatCard>
        <UI.StatCard>
          <UI.StatLabel>Regras Ativas</UI.StatLabel>
          <UI.StatValue style={{ color: '#10b981' }}>
            {rulesData.filter(r => r.status === 'ativa').length}
          </UI.StatValue>
        </UI.StatCard>
        <UI.StatCard>
          <UI.StatLabel>Regras Inativas</UI.StatLabel>
          <UI.StatValue style={{ color: '#6b7280' }}>
            {rulesData.filter(r => r.status === 'inativa').length}
          </UI.StatValue>
        </UI.StatCard>
        <UI.StatCard>
          <UI.StatLabel>Execuções Hoje</UI.StatLabel>
          <UI.StatValue>
            {rulesData.reduce((sum, r) => sum + (r.status === 'ativa' ? Math.floor(Math.random() * 20) : 0), 0)}
          </UI.StatValue>
        </UI.StatCard>
      </UI.StatsContainer>

      <UI.RulesGrid>
        {filteredRules.map(rule => (
          <UI.RuleCard key={rule.id}>
            <UI.RuleHeader>
              <div>
                <UI.RuleName>{rule.nome}</UI.RuleName>
                <UI.RuleDescription>{rule.descricao}</UI.RuleDescription>
              </div>
              <UI.RuleActions>
                <UI.IconButton
                  onClick={() => handleToggleStatus(rule.id, rule.status)}
                  title={rule.status === 'ativa' ? 'Desativar' : 'Ativar'}
                >
                  {rule.status === 'ativa' ? <Pause size={16} /> : <Play size={16} />}
                </UI.IconButton>
                <UI.IconButton
                  onClick={() => handleDuplicateRule(rule)}
                  title="Duplicar"
                >
                  <Copy size={16} />
                </UI.IconButton>
                <UI.IconButton
                  onClick={() => handleEditRule(rule)}
                  title="Editar"
                >
                  <Pencil size={16} />
                </UI.IconButton>
                <UI.IconButton
                  onClick={() => handleDeleteRule(rule.id)}
                  title="Excluir"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </UI.IconButton>
              </UI.RuleActions>
            </UI.RuleHeader>

            <UI.RuleMetadata>
              <UI.RuleBadge type={rule.tipo.toLowerCase()}>
                {rule.tipo}
              </UI.RuleBadge>
              <UI.StatusBadge status={rule.status}>
                {rule.status === 'ativa' ? 'Ativa' : 'Inativa'}
              </UI.StatusBadge>
            </UI.RuleMetadata>

            <UI.RuleSection>
              <UI.SectionTitle>Condições ({rule.condicoes.length})</UI.SectionTitle>
              {rule.condicoes.map((cond, idx) => (
                <UI.ConditionItem key={idx}>
                  <strong>{cond.campo}</strong> {cond.operador} {cond.valor}
                </UI.ConditionItem>
              ))}
            </UI.RuleSection>

            <UI.RuleSection>
              <UI.SectionTitle>Ações ({rule.acoes.length})</UI.SectionTitle>
              {rule.acoes.map((acao, idx) => (
                <UI.ActionItem key={idx}>
                  <strong>{acao.tipo}:</strong> {acao.valor}
                </UI.ActionItem>
              ))}
            </UI.RuleSection>

            <UI.RuleFooter>
              <UI.FooterText>
                Última execução: {rule.ultima_execucao}
              </UI.FooterText>
              <UI.FooterText>
                Total de execuções: {rule.execucoes}
              </UI.FooterText>
            </UI.RuleFooter>
          </UI.RuleCard>
        ))}
      </UI.RulesGrid>

      {filteredRules.length === 0 && (
        <UI.EmptyState>
          <p>Nenhuma regra encontrada com os filtros selecionados.</p>
        </UI.EmptyState>
      )}
    </UI.Container>
  );
};

export default MotorDeRegras;

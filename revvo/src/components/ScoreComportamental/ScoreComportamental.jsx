import React, { useState, useEffect } from 'react';
import * as UI from '../UI/ScoreComportamentalUI';
import { Plus, BarChart3, TrendingUp, Users } from 'lucide-react';
import { ModelDetails } from './ModelDetails';
import { ModelComparison } from './ModelComparison';
import { ModelEditModal } from './ModelEditModal';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { apiService } from '../../services/api.js';
import { ScoreService } from '../../services/scoreService.js';

// Mock data
const mockChampionModel = {
  name: 'Modelo Champion',
  description: 'Modelo principal em produção para avaliação de crédito',
  variables: [
    { name: 'Idade', weight: 0.15, score: 75 },
    { name: 'Renda', weight: 0.20, score: 82 },
    { name: 'Histórico de Crédito', weight: 0.15, score: 90 },
    { name: 'Tempo de Emprego', weight: 0.10, score: 65 },
    { name: 'Quantidade de Empréstimos', weight: 0.08, score: 78 },
    { name: 'Taxa de Utilização de Crédito', weight: 0.12, score: 85 },
    { name: 'Pagamentos em Dia', weight: 0.10, score: 92 },
    { name: 'Consultas Recentes', weight: 0.05, score: 70 },
    { name: 'Mix de Crédito', weight: 0.03, score: 88 },
    { name: 'Tempo de Relacionamento', weight: 0.02, score: 95 },
  ],
  finalScore: 82.1,
  ksScore: 65.5,
  distributionData: [
    { score: 300, goodCumulative: 0.1, badCumulative: 0.3 },
    { score: 400, goodCumulative: 0.2, badCumulative: 0.5 },
    { score: 500, goodCumulative: 0.4, badCumulative: 0.7 },
    { score: 600, goodCumulative: 0.6, badCumulative: 0.8 },
    { score: 700, goodCumulative: 0.8, badCumulative: 0.9 },
    { score: 800, goodCumulative: 1.0, badCumulative: 1.0 },
  ],
};

const mockChallengerModel = {
  name: 'Modelo Challenger',
  description: 'Modelo candidato para substituição do modelo champion',
  variables: [
    { name: 'Idade', weight: 0.12, score: 78 },
    { name: 'Renda', weight: 0.22, score: 85 },
    { name: 'Histórico de Crédito', weight: 0.15, score: 88 },
    { name: 'Tempo de Emprego', weight: 0.12, score: 72 },
    { name: 'Quantidade de Empréstimos', weight: 0.07, score: 80 },
    { name: 'Taxa de Utilização de Crédito', weight: 0.13, score: 87 },
    { name: 'Pagamentos em Dia', weight: 0.09, score: 94 },
    { name: 'Consultas Recentes', weight: 0.06, score: 75 },
    { name: 'Mix de Crédito', weight: 0.02, score: 90 },
    { name: 'Tempo de Relacionamento', weight: 0.02, score: 96 },
  ],
  finalScore: 84.2,
  ksScore: 68.2,
  distributionData: [
    { score: 300, goodCumulative: 0.05, badCumulative: 0.35 },
    { score: 400, goodCumulative: 0.15, badCumulative: 0.55 },
    { score: 500, goodCumulative: 0.35, badCumulative: 0.75 },
    { score: 600, goodCumulative: 0.65, badCumulative: 0.85 },
    { score: 700, goodCumulative: 0.85, badCumulative: 0.95 },
    { score: 800, goodCumulative: 1.0, badCumulative: 1.0 },
  ],
};

export function ScoreComportamental() {
  const [modelos, setModelos] = useState([]);
  const [modeloSelecionado, setModeloSelecionado] = useState(null);
  const [activeTab, setActiveTab] = useState('champion');
  const [isNewModelModalOpen, setIsNewModelModalOpen] = useState(false);
  const [championModel, setChampionModel] = useState(mockChampionModel);
  const [challengerModel, setChallengerModel] = useState(mockChallengerModel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchModelos() {
      setLoading(true);
      try {
        const result = await ScoreService.getAllModels();
        setModelos(result);
        if (result && result.length > 0) {
          setModeloSelecionado(result[0]);
        }
      } catch (err) {
        setError('Erro ao buscar modelos: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    }
    fetchModelos();
  }, []);

  const handleSelectModelo = (e) => {
    const id = e.target.value;
    const found = modelos.find(m => String(m.id) === String(id));
    setModeloSelecionado(found);
  };

  const handleNewModel = async (newModel) => {
    setLoading(true);
    setError(null);
    try {
      const [insertedModel] = await apiService.supabaseInsert('score_models', [{
        name: newModel.name,
        description: newModel.description,
        frequencia_calculo: newModel.frequenciaCalculo,
        type_of_model: newModel.modelType,
        final_score: newModel.finalScore,
        ks_score: newModel.ksScore,
        target_nome: newModel.target_nome,
        target_operador: newModel.target_operador,
        target_valor: newModel.target_valor
      }]);
      if (insertedModel && newModel.variables && newModel.variables.length > 0) {
        const variablesToInsert = newModel.variables.map(v => ({
          model_id: insertedModel.id,
          name: v.name,
          weight: v.weight,
          score: v.score ?? null
        }));
        await apiService.supabaseInsert('score_model_variables', variablesToInsert);
      }
      setIsNewModelModalOpen(false);
    } catch (err) {
      setError('Erro ao salvar modelo: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModelo = async (updatedModel) => {
    // Atualiza lista local
    setModelos(prev => prev.map(m => m.id === updatedModel.id ? { ...m, ...updatedModel } : m));
    setModeloSelecionado(prev => prev && prev.id === updatedModel.id ? { ...prev, ...updatedModel } : prev);
    // Opcional: recarregar do banco para garantir consistência
    // const result = await ScoreService.getAllModels();
    // setModelos(result);
    // setModeloSelecionado(result.find(m => m.id === updatedModel.id));
  };

  const handleUpdateChampion = (updatedModel) => {
    setChampionModel(updatedModel);
  };

  const handleUpdateChallenger = (updatedModel) => {
    setChallengerModel(updatedModel);
  };

  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (modeloSelecionado) {
      return (
        <ModelDetails
          data={{
            ...modeloSelecionado,
            variables: modeloSelecionado.variables || [],
            finalScore: modeloSelecionado.final_score || modeloSelecionado.finalScore || 0,
            ksScore: modeloSelecionado.ks_score || modeloSelecionado.ksScore || 0,
            distributionData: modeloSelecionado.distributionData || []
          }}
          title={modeloSelecionado.name}
          onUpdate={handleUpdateModelo}
        />
      );
    }
    // fallback mock
    return (
      <ModelDetails
        data={championModel}
        title="Modelo Champion (Mock)"
      />
    );
  };

  return (
    <UI.Container>
      <UI.Header>
        <h1>Score Comportamental</h1>
        <div className="header-actions">
          <button
            className="new-model-button"
            onClick={() => setIsNewModelModalOpen(true)}
          >
            <Plus size={16} />
            Novo Modelo
          </button>
        </div>
      </UI.Header>
      {/* Select de modelos */}
      <div style={{ marginBottom: 24, maxWidth: 400 }}>
        <label style={{ fontWeight: 500, marginRight: 8 }}>Selecione o Modelo:</label>
        <select value={modeloSelecionado?.id || ''} onChange={handleSelectModelo} style={{ width: 160, padding: 0, borderRadius: 4, border: '1px solid #ccc' }}>
          {modelos.length === 0 && <option value="">Nenhum modelo encontrado</option>}
          {modelos.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <UI.StatsGrid>
        <UI.StatCard>
          <div className="stat-header">
            <div className="icon">
              <BarChart3 size={20} />
            </div>
            <div className="title">KS Score Champion</div>
          </div>
          <div className="stat-value">{championModel.ksScore}%</div>
          <div className="stat-subtitle">Poder discriminatório</div>
        </UI.StatCard>

        <UI.StatCard>
          <div className="stat-header">
            <div className="icon">
              <TrendingUp size={20} />
            </div>
            <div className="title">KS Score Challenger</div>
          </div>
          <div className="stat-value">{challengerModel.ksScore}%</div>
          <div className="stat-subtitle">Modelo em teste</div>
        </UI.StatCard>

        <UI.StatCard>
          <div className="stat-header">
            <div className="icon">
              <Users size={20} />
            </div>
            <div className="title">Melhoria</div>
          </div>
          <div className="stat-value">
            +{(challengerModel.ksScore - championModel.ksScore).toFixed(1)}%
          </div>
          <div className="stat-subtitle">Challenger vs Champion</div>
        </UI.StatCard>
      </UI.StatsGrid>

      <UI.TabContainer>
        <UI.Tab
          className={activeTab === 'champion' ? 'active' : ''}
          onClick={() => setActiveTab('champion')}
        >
          Modelo Champion
        </UI.Tab>

      </UI.TabContainer>

      <UI.ContentArea>
        {renderContent()}
      </UI.ContentArea>

      <ModelEditModal
        isOpen={isNewModelModalOpen}
        onClose={() => setIsNewModelModalOpen(false)}
        onSave={handleNewModel}
      />
    </UI.Container>
  );
}

export default ScoreComportamental;

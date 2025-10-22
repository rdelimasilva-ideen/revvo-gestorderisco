import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import * as UI from '../UI/ModelDetailsUI';
import { Table } from './Table';
import { KSChart } from './KSChart';
import { ModelEditModal } from './ModelEditModal';
import { ScoreService } from '../../services/scoreService.js';

export function ModelDetails({ data, title, onUpdate }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (updatedModel) => {
    setLoading(true);
    setError(null);
    try {
      // Atualiza no banco
      await ScoreService.updateModelAndVariables(updatedModel);
      onUpdate?.(updatedModel);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Erro ao atualizar modelo: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <UI.Container>
      <UI.Header>
        <h2>{title}</h2>
        <button
          className="edit-button"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit2 size={16} />
          Editar Modelo
        </button>
      </UI.Header>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <ModelEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        model={data}
        onSave={handleSave}
        loading={loading}
      />

      <UI.GridContainer>
        <UI.Card>
          <h3>Variáveis e Pesos</h3>
          {/* Exibir variável target no topo */}
          {data.target_nome && (
            <div style={{
              background: '#F3F6FB',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontWeight: 500,
              color: 'var(--primary-text)'
            }}>
              <span style={{ fontWeight: 600 }}>Variável Target:</span>
              <span>{data.target_nome}</span>
              <span style={{ color: 'var(--secondary-text)' }}>{data.target_operador}</span>
              <span style={{ color: 'var(--primary-blue)' }}>{data.target_valor}</span>
            </div>
          )}
          <Table
            data={data.variables}
            columns={[
              { header: 'Variável', accessor: 'name' },
              { header: 'Peso', accessor: 'weight' },
              { header: 'Pontuação', accessor: 'score' },
            ]}
          />
          <div className="score-display">
            <p>
              Pontuação Final: <span>{data.finalScore.toFixed(1)}</span>
            </p>
          </div>
        </UI.Card>

        <UI.Card>
          <h3>Distribuição KS</h3>
          <KSChart data={data.distributionData} />
          <div className="score-display">
            <p>
              Pontuação KS: <span>{data.ksScore}%</span>
            </p>
          </div>
        </UI.Card>
      </UI.GridContainer>
    </UI.Container>
  );
}

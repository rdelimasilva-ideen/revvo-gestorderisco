import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import * as UI from '../UI/ModelComparisonUI';
import { Table } from './Table';

export function ModelComparison({ champion, challenger }) {
  const ksDiff = challenger.ksScore - champion.ksScore;
  const scoreDiff = challenger.finalScore - champion.finalScore;

  const comparisonData = champion.variables.map((championVar, index) => {
    const challengerVar = challenger.variables[index];
    return {
      variable: championVar.name,
      championWeight: championVar.weight,
      challengerWeight: challengerVar.weight,
      championScore: championVar.score,
      challengerScore: challengerVar.score,
    };
  });

  return (
    <UI.Container>
      <UI.GridContainer>
        <UI.Card>
          <h3>Comparativo da Pontuação KS</h3>
          <UI.ComparisonRow>
            <div className="metric">
              Champion: <span>{champion.ksScore}%</span>
            </div>
            <div className="metric">
              Challenger: <span>{challenger.ksScore}%</span>
            </div>
            <div className={`difference ${ksDiff > 0 ? 'positive' : 'negative'}`}>
              {ksDiff > 0 ? (
                <ArrowUpIcon size={20} />
              ) : (
                <ArrowDownIcon size={20} />
              )}
              <span>{Math.abs(ksDiff).toFixed(2)}%</span>
            </div>
          </UI.ComparisonRow>
        </UI.Card>

        <UI.Card>
          <h3>Comparativo da Pontuação Final</h3>
          <UI.ComparisonRow>
            <div className="metric">
              Champion: <span>{champion.finalScore.toFixed(1)}</span>
            </div>
            <div className="metric">
              Challenger: <span>{challenger.finalScore.toFixed(1)}</span>
            </div>
            <div className={`difference ${scoreDiff > 0 ? 'positive' : 'negative'}`}>
              {scoreDiff > 0 ? (
                <ArrowUpIcon size={20} />
              ) : (
                <ArrowDownIcon size={20} />
              )}
              <span>{Math.abs(scoreDiff).toFixed(2)}</span>
            </div>
          </UI.ComparisonRow>
        </UI.Card>
      </UI.GridContainer>

      <UI.FullWidthCard>
        <h3>Comparativo Detalhado</h3>
        <Table
          data={comparisonData}
          columns={[
            { header: 'Variável', accessor: 'variable' },
            { header: 'Peso Champion', accessor: 'championWeight' },
            { header: 'Peso Challenger', accessor: 'challengerWeight' },
            { header: 'Score Champion', accessor: 'championScore' },
            { header: 'Score Challenger', accessor: 'challengerScore' },
          ]}
        />
      </UI.FullWidthCard>
    </UI.Container>
  );
}

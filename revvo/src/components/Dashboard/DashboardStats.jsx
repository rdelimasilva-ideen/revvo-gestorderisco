import React from 'react';
import * as UI from '../UI/DashboardStatsUI';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  ComposedChart, Legend
} from 'recharts';

// Dados de exemplo para os gráficos
const stackedBarData = [
  { month: 'Mar', pedidos: 120, taxaAprovacao: 70 },
  { month: 'Abr', pedidos: 100, taxaAprovacao: 80 },
  { month: 'Mai', pedidos: 135, taxaAprovacao: 65 },
  { month: 'Jun', pedidos: 80, taxaAprovacao: 90 },
  { month: 'Jul', pedidos: 70, taxaAprovacao: 75 },
  { month: 'Ago', pedidos: 95, taxaAprovacao: 60 },
];

const pieData = [
  { name: 'Não Alocada', value: 13.09, color: '#64748B' },
  { name: 'Descontada', value: 45.21, color: '#0EA5E9' },
  { name: 'Garantia', value: 41.69, color: '#10B981' },
];

const DashboardStats = ({ monthlyBilling }) => {
  return (
    <UI.DashboardGrid>
      <div className="card">
        <h3>Ordens de venda a crédito</h3>
        <UI.CardValue>
          73% <span style={{ color: 'var(--success)' }}>+5%</span>
        </UI.CardValue>
        <UI.CardSubtitle>Taxa de conversão Ordem de venda</UI.CardSubtitle>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={stackedBarData} margin={{ top: 20, right: 0, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
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
                if (name === 'Taxa de Aprovação') return [`${value}%`, name];
                return [value, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="left"
              height={36}
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
            <Bar dataKey="pedidos" fill="#76D9DF" name="Pedidos" barSize={20} yAxisId="left" />
            <Line
              type="monotone"
              dataKey="taxaAprovacao"
              stroke="#3EB655"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Taxa de Aprovação"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Faturamento</h3>
        <UI.CardValue>
          187,65mi <span style={{ color: 'var(--error)' }}>-5%</span>
        </UI.CardValue>
        <UI.CardSubtitle>Faturamento</UI.CardSubtitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={monthlyBilling?.slice(-13) || []}
            margin={{ top: 20, right: 0, left: 0, bottom: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$ ${(value/1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`}
            />
            <Tooltip
              formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor Total']}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Bar
              dataKey="value"
              fill="var(--primary-blue)"
              name="Valor Total"
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Resumo Risco Cliente</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          height: '260px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>R$ 500.000,00</div>
            <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>Concedido</h4>
          </div>

          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>65%</div>
            <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>Utilizado</h4>
          </div>

          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>R$ 175.000,00</div>
            <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>Disponível</h4>
          </div>

          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>45 dias</div>
            <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>Prazo médio de pagamento</h4>
          </div>

          <div>
            <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>
              Status
            </h4>

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
                Em atraso
              </div>

              <span style={{
                fontSize: '12px',
                color: 'var(--error)',
                fontWeight: 'normal',
                paddingLeft: '14px'
              }}>
                (15 dias)
              </span>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '12px', color: 'var(--secondary-text)', marginBottom: '2px' }}>Máx. dias em atraso</h4>
            <h4 style={{ fontSize: '10px', color: 'var(--secondary-text)', marginBottom: '2px' }}>(12 meses)</h4>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>32 dias</div>
          </div>
        </div>
      </div>
    </UI.DashboardGrid>
  );
};

export default DashboardStats;

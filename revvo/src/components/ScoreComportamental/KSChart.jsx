import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  width: 100%;
  height: 400px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

export function KSChart({ data }) {
  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="score"
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="goodCumulative"
            stroke="var(--primary-blue)"
            strokeWidth={2}
            name="Distribuição Bons"
            dot={{ fill: 'var(--primary-blue)', strokeWidth: 2, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="badCumulative"
            stroke="var(--error)"
            strokeWidth={2}
            name="Distribuição Maus"
            dot={{ fill: 'var(--error)', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

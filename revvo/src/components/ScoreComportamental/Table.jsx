import React from 'react';
import * as UI from '../UI/ScoreComportamentalTableUI';

export function Table({ data, columns, maxHeight }) {
  return (
    <UI.TableContainer>
      <UI.TableWrapper maxHeight={maxHeight}>
        <UI.StyledTable>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.accessor}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.accessor}>
                    {col.accessor === 'weight'
                      ? `${(row[col.accessor] * 100).toFixed(0)}%`
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </UI.StyledTable>
      </UI.TableWrapper>
    </UI.TableContainer>
  );
}

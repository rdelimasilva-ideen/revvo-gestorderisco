import styled from 'styled-components';

export const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  max-height: ${props => props.maxHeight || '400px'};
  overflow-y: auto;
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    background: #F8F9FA;
    padding: 12px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: var(--secondary-text);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    font-size: 14px;
    color: var(--primary-text);
  }

  tr:hover {
    background: #F8F9FA;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

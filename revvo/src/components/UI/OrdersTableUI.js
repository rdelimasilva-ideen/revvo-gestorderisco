import styled from 'styled-components';

export const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: var(--background);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
    &:hover {
      background: #D1D5DB;
    }
  }
`;

export const InvoiceDetails = styled.div`
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin: 8px 0;
  overflow: hidden;
`;

export const InvoiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  h2 {
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
`;

export const InvoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background: white;
`;

export const InvoiceField = styled.div`
  h4 {
    font-size: 13px;
    color: var(--secondary-text);
    margin-bottom: 4px;
  }
  p {
    font-size: 14px;
  }
`;

export const InstallmentsTable = styled.table`
  background: white;
  margin: 0;
  min-width: 600px;
  th, td {
    font-size: 13px;
  }
  th:first-child,
  td:first-child {
    padding-left: 16px;
  }
  th:last-child,
  td:last-child {
    padding-right: 16px;
  }
`;

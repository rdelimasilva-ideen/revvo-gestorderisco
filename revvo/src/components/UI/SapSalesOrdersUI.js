import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`;

export const Header = styled.div`
  margin-bottom: 24px;
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 8px;
  }
  p {
    color: #666666;
    font-size: 14px;
  }
`;

export const FiltersCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  label {
    font-size: 13px;
    color: #666666;
    font-weight: 500;
  }
  input, select {
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 14px;
    background: #ffffff;
    color: #1a1a1a;
    width: 100%;
    box-sizing: border-box;
    height: 44px;
    line-height: 1.5;
    &:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }
    &::placeholder {
      color: #999999;
    }
  }
`;

export const FilterActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  button {
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 44px;
    &.primary {
      background: #0066cc;
      color: #ffffff;
      border: none;
      &:hover {
        background: #0052a3;
      }
      svg {
        color: #ffffff;
      }
    }
    &.secondary {
      background: #ffffff;
      color: #1a1a1a;
      border: 1px solid #e0e0e0;
      &:hover {
        background: #f5f5f5;
      }
    }
  }
`;

export const TableCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const TableHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .actions {
    display: flex;
    gap: 8px;
    button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
      background: #ffffff;
      color: #1a1a1a;
      border: 1px solid #e0e0e0;
      &:hover {
        background: #f5f5f5;
      }
    }
  }
`;

export const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 4px;
    &:hover {
      background: #D1D5DB;
    }
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
  thead {
    background: #f5f5f5;
    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #666666;
      white-space: nowrap;
    }
  }
  tbody {
    tr {
      border-bottom: 1px solid #e0e0e0;
      cursor: pointer;
      transition: background 0.2s;
      &:hover {
        background: #f5f5f5;
      }
      &.selected {
        background: #E6F2FF;
      }
    }
    td {
      padding: 14px 16px;
      font-size: 14px;
      color: #1a1a1a;
      &.number {
        font-family: 'Courier New', monospace;
      }
      &.currency {
        text-align: right;
        font-family: 'Courier New', monospace;
      }
    }
  }
`;

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  &.completed {
    background: #D4EDDA;
    color: #155724;
  }
  &.pending {
    background: #FFF3CD;
    color: #856404;
  }
  &.cancelled {
    background: #F8D7DA;
    color: #721C24;
  }
`;

export const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e0e0e0;
    border-top-color: #0066cc;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const DetailsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
  }
  button {
    background: none;
    border: none;
    font-size: 24px;
    color: #666666;
    cursor: pointer;
    &:hover {
      color: #1a1a1a;
    }
  }
`;

export const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

export const DetailSection = styled.div`
  margin-bottom: 24px;
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

export const DetailItem = styled.div`
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  label {
    font-size: 12px;
    color: #666666;
    display: block;
    margin-bottom: 4px;
  }
`;

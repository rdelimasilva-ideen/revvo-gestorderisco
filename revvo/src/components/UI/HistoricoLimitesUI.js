import styled from 'styled-components';

export const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
`;

export const Header = styled.div`
  padding: 24px;
  background: white;
  border-bottom: 1px solid var(--border-color);

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-text);
    margin: 0;
  }
`;

export const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--background);
`;

export const FilterSection = styled.div`
  background: white;
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .filter-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    .left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon {
      transition: transform 0.3s ease;

      &.open {
        transform: rotate(180deg);
      }
    }
  }

  .filter-content {
    padding: 24px;
    background: #F8F9FA;
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    background: #F8F9FA;
    padding: 16px;
    text-align: left;
    font-size: 14px;
    font-weight: 600;
    color: var(--primary-text);
    border-bottom: 1px solid var(--border-color);
  }

  td {
    padding: 16px;
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

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;

  &.high-usage {
    background: #FEE2E2;
    color: #DC2626;
  }

  &.medium-usage {
    background: #FEF3C7;
    color: #D97706;
  }

  &.low-usage {
    background: #D1FAE5;
    color: #059669;
  }

  &.em-analise {
    background: #DBEAFE;
    color: #2563EB;
  }

  &.pendente-doc {
    background: #FEF3C7;
    color: #D97706;
  }

  &.aprovacao-final {
    background: #F3E8FF;
    color: #7C3AED;
  }

  &.high-severity {
    background: #FEE2E2;
    color: #DC2626;
  }

  &.medium-severity {
    background: #FED7AA;
    color: #EA580C;
  }

  &.low-severity {
    background: #FEF3C7;
    color: #D97706;
  }
`;

export const TrendIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  .trend-up {
    color: #DC2626;
  }

  .trend-down {
    color: #059669;
  }
`;

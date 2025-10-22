import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-text);
    margin: 0 0 16px 0;
  }
`;

export const ComparisonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  .metric {
    font-size: 16px;
    color: var(--primary-text);

    span {
      font-weight: 600;
    }
  }

  .difference {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;

    &.positive {
      color: var(--success);
    }

    &.negative {
      color: var(--error);
    }
  }
`;

export const FullWidthCard = styled(Card)`
  grid-column: 1 / -1;
`;

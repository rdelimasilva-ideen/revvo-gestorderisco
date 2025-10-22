import styled from 'styled-components';

export const Container = styled.div``;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 24px;

  h1 {
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .close-button {
    color: var(--secondary-text);
    font-size: 14px;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 0 24px;
  margin-bottom: 24px;
`;

export const Card = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
`;

export const CardHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: 16px;
  font-weight: 500;
`;

export const CardContent = styled.div`
  padding: 16px;
`;

export const Field = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    color: var(--secondary-text);
    font-size: 13px;
    margin-bottom: 4px;
  }

  .value {
    font-size: 14px;
  }

  &.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
`;

export const OrderItem = styled.div`
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .name {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .details {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--secondary-text);

    .discount {
      color: var(--success);
    }
  }
`;

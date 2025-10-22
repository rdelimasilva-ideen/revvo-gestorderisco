import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding: 24px;
`;

export const Header = styled.div`
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-text);
    margin: 0;
  }
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const AlertCard = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-text);
    margin: 0;
  }
`;

export const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const AlertItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
`;

export const AlertContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

export const IconContainer = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.red {
    background: #FEE2E2;
    color: #DC2626;
  }

  &.orange {
    background: #FED7AA;
    color: #EA580C;
  }

  &.blue {
    background: #DBEAFE;
    color: #2563EB;
  }
`;

export const AlertDetails = styled.div`
  flex: 1;

  .company-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text);
    margin-bottom: 2px;
  }

  .alert-description {
    font-size: 12px;
    color: var(--secondary-text);
    margin-bottom: 2px;
  }

  .alert-date {
    font-size: 11px;
    color: #9CA3AF;
  }
`;

export const AlertValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-text);
  text-align: right;
  flex-shrink: 0;
`;

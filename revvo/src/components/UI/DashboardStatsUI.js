import styled from 'styled-components';

export const DashboardGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 0px;

  > div {
    flex: 0 0 calc(33.333% - 11px);
    background: white;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    height: 300px;
    overflow: hidden;
  }

  @media (max-width: 1200px) and (min-width: 415px) {
    > div {
      flex: 0 0 calc(50% - 8px);
    }
  }

  @media (max-width: 414px) {
    > div {
      flex: 0 0 100%;
    }
  }
`;

export const CardValue = styled.div`
  font-size: 20px;
  font-weight: 600;
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-size: 13px;
    font-weight: normal;
  }
`;

export const CardSubtitle = styled.div`
  font-size: 12px;
  color: var(--secondary-text);
  margin-bottom: 8px;
`;

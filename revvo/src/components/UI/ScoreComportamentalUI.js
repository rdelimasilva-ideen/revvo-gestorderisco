import styled from 'styled-components';

export const Container = styled.div`
  width: 100vw;
  max-width: 80vw;
  margin: 0;
  padding: 24px 16px ;
  box-sizing: border-box;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  width: 100%;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--primary-text);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .new-model-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--primary-blue);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    &:hover {
      filter: brightness(1.1);
    }
  }
`;

export const TabContainer = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  background: #F8F9FA;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid var(--border-color);
`;

export const Tab = styled.button`
  flex: 1;
  padding: 0px 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--secondary-text);
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;

  &.active {
    background: white;
    color: var(--primary-blue);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 600;
  }

  &:hover:not(.active) {
    color: var(--primary-text);
    background: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 13px;
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  width: 100%;
`;

export const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .stat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 112, 242, 0.1);
      color: var(--primary-blue);
    }

    .title {
      font-size: 14px;
      color: var(--secondary-text);
      font-weight: 500;
    }
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-text);
    margin-bottom: 4px;
  }

  .stat-subtitle {
    font-size: 12px;
    color: var(--secondary-text);
  }
`;

export const ContentArea = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  min-height: 400px;
  width: 100%;
  min-width: 0;
`;

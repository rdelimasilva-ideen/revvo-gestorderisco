import styled from 'styled-components';

export const StyledButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  min-width: 100px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: var(--primary-blue);
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: var(--primary-blue-dark);
    }
  }

  &.secondary {
    background: white;
    color: var(--primary-blue);
    border: 1px solid var(--primary-blue);

    &:hover:not(:disabled) {
      background: var(--hover-bg);
    }
  }

  &.success {
    background: var(--success-green);
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: var(--success-green-dark);
    }
  }

  &.danger {
    background: var(--error-red);
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: var(--error-red-dark);
    }
  }
`;

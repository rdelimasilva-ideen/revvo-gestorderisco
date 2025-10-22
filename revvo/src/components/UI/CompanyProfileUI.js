import styled from 'styled-components';

export const Container = styled.div`
  max-width: 800px;
  margin: 32px auto;
  padding: 0 24px;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-text);
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--secondary-text);
    transition: all 0.2s ease;

    &:hover {
      color: var(--primary-text);
      transform: scale(1.1);
    }
  }
`;

export const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .form-section {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 16px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-text);
    margin-bottom: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text);
    }

    input, select {
      height: 40px;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;
      margin-bottom: 12px;

      &:focus {
        outline: none;
        border-color: var(--primary-blue);
      }

      &:disabled {
        background: #f8f9fa;
        cursor: not-allowed;
      }
    }
  }

  .error {
    color: var(--error);
    font-size: 12px;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);

    button {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      height: 40px;

      &.cancel {
        background: white;
        border: 1px solid var(--border-color);
        color: var(--secondary-text);

        &:hover {
          background: var(--background);
        }
      }

      &.save {
        background: var(--primary-blue);
        border: none;
        color: white;

        &:hover {
          filter: brightness(1.1);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
`;

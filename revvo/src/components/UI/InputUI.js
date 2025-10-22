import styled from 'styled-components';

export const InputContainer = styled.div`
  width: 100%;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text);
  }

  input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
    }

    &:disabled {
      background: var(--disabled-bg);
      cursor: not-allowed;
    }
  }

  .error {
    color: var(--error-red);
    font-size: 12px;
    margin-top: 4px;
  }
`;

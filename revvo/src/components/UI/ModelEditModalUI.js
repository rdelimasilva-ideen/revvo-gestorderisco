import styled from 'styled-components';

export const ModalOverlay = styled.div`
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

export const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--primary-text);
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--secondary-text);

    &:hover {
      color: var(--primary-text);
    }
  }
`;

export const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text);
    margin-bottom: 8px;
  }

  input, textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 2px rgba(0, 112, 242, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
    background-color: white;

    &:focus {
      outline: none;
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 2px rgba(0, 112, 242, 0.1);
    }
  }
`;

export const VariableCard = styled.div`
  background: #F8F9FA;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);

  .variable-row {
    display: grid;
    grid-template-columns: 1fr 120px 120px 40px;
    gap: 16px;
    align-items: end;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .delete-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: var(--error);
    border-radius: 4px;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-top: 1px solid var(--border-color);
  gap: 12px;

  .add-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    color: var(--primary-blue);
    border: 1px solid var(--primary-blue);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: rgba(0, 112, 242, 0.05);
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .cancel-button {
    padding: 0px 16px;
    background: white;
    color: var(--secondary-text);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #F8F9FA;
    }
  }

  .save-button {
    padding: 0px 16px;
    background: var(--primary-blue);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      filter: brightness(1.1);
    }
  }
`;

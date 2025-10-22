import styled from 'styled-components';

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const InfoLabel = styled.span`
  color: var(--secondary-text);
  font-size: 14px;
`;

export const InfoValue = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: ${({ isEditing }) => (isEditing ? '24px' : '0')};
  background: ${({ isEditing }) => (isEditing ? 'white' : 'transparent')};
  border-radius: 8px;
  box-shadow: ${({ isEditing }) => (isEditing ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none')};
  border: ${({ isEditing }) => (isEditing ? '1px solid var(--border-color)' : 'none')};
`;

export const FormSection = styled.div`
  display: grid;
  grid-template-columns: repeat(${({ columns = 2 }) => columns}, 1fr);
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const FormTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-text);
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--secondary-text);
  display: flex;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    color: var(--primary-text);
    transform: scale(1.1);
  }
`;

export const FormCard = styled.form`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color);
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--primary-text);
    margin-bottom: 4px;
  }

  select,
  input,
  textarea,
  .react-select__control {
    width: 100%;
    height: 40px;
    min-height: 40px;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0 12px;
    color: var(--primary-text);

    &:focus {
      outline: none;
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 1px var(--primary-blue);
    }
  }

  textarea {
    height: auto;
    min-height: 100px;
    padding: 12px;
  }

  .react-select__control {
    padding: 0;
    border-color: var(--border-color);
    box-shadow: none;

    &:hover {
      border-color: var(--primary-blue);
    }

    &--is-focused {
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 1px var(--primary-blue);
    }
  }

  .react-select__value-container {
    padding: 2px 8px;
  }

  .react-select__menu-portal {
    z-index: 9999;
  }
`;

export const CustomerInfo = styled.div`
  background: #F8F9FA;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-text);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .info-item {
    p {
      font-size: 13px;
      color: var(--secondary-text);
      margin-bottom: 4px;
    }

    span {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text);
    }
  }
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);

  button {
    height: 26px;
    padding: 0 18px;
    border-radius: 4px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    font-size: 15px;
    min-width: 90px;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .submit-button {
    background: var(--primary-blue);
    color: white;
    border: none;
    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  }

  .cancel-button {
    background: white;
    color: var(--secondary-text);
    border: 1px solid var(--border-color);
    &:hover:not(:disabled) {
      background: #f8f9fa;
    }
  }
`;

export const StyledSelect = styled.select`
  width: 100%;
  height: 40px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e5e7eb);
  padding: 0 12px;
  font-size: 16px;
  color: var(--primary-text, #222);
  background: #fff;
  transition: border 0.2s;
  &:focus {
    outline: none;
    border-color: var(--primary-blue, #2563eb);
    box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
  }
`;

export const InfoCardBase = styled.div`
  background: #F8F9FA;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
`;

export const UserInfoCard = styled(InfoCardBase)`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const CustomerDetailsCard = styled.div.withConfig({ shouldForwardProp: (prop) => prop !== 'isExpanded' })`
  background: #F8F9FA;
  border-radius: 8px;
  padding: 16px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  margin-bottom: ${({ isExpanded }) => (isExpanded ? '16px' : '8px')};
  min-height: 88px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  & .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }

  & .title-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
  }

  & .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 12px;
    max-height: ${({ isExpanded }) => (isExpanded ? '500px' : '0')};
    opacity: ${({ isExpanded }) => (isExpanded ? '1' : '0')};
    overflow: hidden;
    transition: all 0.3s ease;
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  & .contacts {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    max-height: ${({ isExpanded }) => (isExpanded ? '500px' : '0')};
    opacity: ${({ isExpanded }) => (isExpanded ? '1' : '0')};
    overflow: hidden;
    transition: all 0.3s ease;
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
`;

export const NoSpinInput = styled.input`
  font-size: 20px;
  font-weight: 600;
  border: 2px solid #222;
  background: #F8F9FA;
  color: #222;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  appearance: textfield;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

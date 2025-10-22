import styled from 'styled-components';

export const CaixaEntradaContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
`;

export const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

export const RequestsContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 16px;
`;

export const RequestCard = styled.div`
  flex: 0 0 300px;
  cursor: pointer;
  background: var(--background);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  &.selected {
    flex: 0 0 280px;
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: none;
    }

    .items-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);

      h4 {
        font-size: 13px;
        color: var(--secondary-text);
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .item {
        padding: 8px;
        background: white;
        border-radius: 4px;
        margin-bottom: 8px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .item-name {
          margin-bottom: 4px;
          font-weight: 500;
        }

        .item-details {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--secondary-text);
        }
      }
    }
  }
`;

export const DetailView = styled.div`
  flex: 1;
  margin-left: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 24px;
  position: relative;

  .close-button {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--secondary-text);
    padding: 8px;

    &:hover {
      color: var(--primary-text);
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 24px;
  }

  .detail-section {
    background: var(--background);
    padding: 16px;
    border-radius: 8px;

    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .occurrence-count {
      background: var(--primary-blue);
      color: white;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
    }

    .no-occurrences {
      color: var(--secondary-text);
      font-size: 13px;
    }

    .occurrence-item {
      padding: 12px;
      background: white;
      border-radius: 4px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .date {
        font-size: 12px;
        color: var(--secondary-text);
        margin-bottom: 4px;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
      }

      .details {
        font-size: 13px;
        color: var(--secondary-text);
        margin-top: 4px;
      }
    }
  }

  .score-section {
    text-align: center;
    padding: 24px;

    .score-value {
      font-size: 48px;
      font-weight: 600;
      color: var(--primary-blue);
      margin: 16px 0;
    }

    .score-label {
      font-size: 14px;
      color: var(--secondary-text);
    }

    .score-bar {
      height: 8px;
      background: #E5E7EB;
      border-radius: 4px;
      margin: 16px 0;
      position: relative;
      overflow: hidden;
      .score-bar-fill {
        height: 100%;
        background: var(--primary-blue);
        border-radius: 4px;
        position: absolute;
        left: 0;
        top: 0;
      }
    }
  }

  .status-badge {
    color: var(--success);
    padding: 4px 12px;
    background: rgba(62, 182, 85, 0.1);
    border-radius: 16px;
    display: inline-block;
  }
`;

export const HistoryAnalysisContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-top: 24px;
  margin-bottom: 24px;
`;

export const CustomerHistory = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  height: 100%;
  overflow-y: auto;
`;

export const FinancialAnalysisContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  h4 {
    margin-bottom: 16px;
    font-weight: 500;
    color: black;
  }
  .load-calculated-limit {
    position: absolute;
    top: 24px;
    right: 24px;
    padding: 6px 12px;
    background: var(--primary-blue);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    &:hover {
      background: #2563EB;
    }
    &:disabled {
      background: #93C5FD;
      cursor: not-allowed;
    }
  }
  .form-group {
    margin-bottom: 20px;
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text);
      margin-bottom: 8px;
    }
    input {
      width: 100%;
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0 12px;
      font-size: 14px;
      &:focus {
        outline: none;
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
      }
    }
    textarea {
      width: 100%;
      min-height: 150px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 12px;
    }
  }
`;

export const Modal = styled.div`
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

  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 24px;
    width: 500px;
    max-width: 90%;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .modal-title {
    font-size: 18px;
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0px;
  }

  .form-field {
    margin-bottom: 16px;

    .label {
      font-size: 13px;
      color: var(--secondary-text);
      margin-bottom: 4px;
    }

    textarea {
      width: 100%;
      min-height: 100px;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      resize: vertical;
    }
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;

    button {
      padding: 0px 16px;
      height: 32px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 80px;

      &.reject {
        background: #DC2626;
        color: white;
      }

      &.approve {
        background: #059669;
        color: white;
      }
    }
  }
`;

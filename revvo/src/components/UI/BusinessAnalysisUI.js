import styled from 'styled-components';

export const Header = styled.header`
  margin-bottom: 24px;
`;

export const SearchBar = styled.div`
  background: white;
  border-radius: 8px;
  margin: 24px 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .filter-content {
    padding: 24px;
    background: white;

    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text);
      margin-bottom: 8px;
    }

    select {
      height: 40px;
      padding: 0 12px;
    }
  }
`;

export const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }

  .card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    border: 1px solid var(--border-color);
    height: 350px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
      flex-shrink: 0;
    }

    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
  }
`;

export const CardValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin: 8px 0;

  span {
    font-size: 14px;
    margin-left: 8px;
  }
`;

export const CardSubtitle = styled.div`
  font-size: 13px;
  color: var(--secondary-text);
  margin-bottom: 24px;
`;

export const DetailView = styled.div`
  background: white;
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
  border-radius: 8px;
  padding: 24px;
  flex: 1;
  position: relative;
  min-height: 400px;

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-top: 24px;
  }

  .detail-section {
    background: #F8F9FA;
    border-radius: 8px;
    padding: 16px;

    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &.score-section {
      text-align: center;

      .score-value {
        font-size: 32px;
        font-weight: 600;
        color: var(--success);
        margin: 16px 0;
      }

      .score-label {
        font-size: 14px;
        color: var(--secondary-text);
      }
    }

    .occurrence-count {
      background: var(--primary-blue);
      color: white;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
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
        margin-bottom: 4px;
      }

      .details {
        font-size: 13px;
        color: var(--secondary-text);
      }
    }

    .no-occurrences {
      text-align: center;
      padding: 24px;
      color: var(--secondary-text);
      font-size: 14px;
    }
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
      font-size: 14px;
      resize: vertical;

      &:focus {
        outline: none;
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
      }
    }

    .prefix {
      position: relative;

      input {
        padding-left: 34px;
      }

      &:before {
        content: "R$";
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--secondary-text);
      }
    }

    .file-upload {
      margin-top: 12px;

      .upload-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--background);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 13px;
        color: var(--secondary-text);
        cursor: pointer;

        &:hover {
          background: #f3f4f6;
        }

        input[type="file"] {
          display: none;
        }
      }

      .file-list {
        margin-top: 12px;

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--background);
          border-radius: 4px;
          margin-bottom: 8px;

          .file-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
          }

          .file-actions {
            display: flex;
            gap: 8px;

            button {
              background: none;
              border: none;
              cursor: pointer;
              color: var(--secondary-text);
              padding: 4px;

              &:hover {
                color: var(--primary-text);
              }

              &.delete {
                &:hover {
                  color: #DC2626;
                }
              }
            }
          }
        }
      }
    }
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: auto;

    button {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &.primary {
        background-color: var(--primary-blue);
        color: white;
        border: none;
      }

      &.secondary {
        background-color: white;
        color: var(--primary-text);
        border: 1px solid var(--border-color);
      }
    }
  }
`;

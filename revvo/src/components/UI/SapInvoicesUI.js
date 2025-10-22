import styled from "styled-components"

const colors = {
    primary: '#0066cc',
    primaryDark: '#0052a3',
    primaryText: '#1a1a1a',
    secondaryText: '#666666',
    background: '#f5f5f5',
    white: '#ffffff',
    borderColor: '#e0e0e0',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107'
  }

  export const Container = styled.div`
    padding: 24px;
    background: ${colors.background};
    min-height: 100vh;
  `

  export const Header = styled.div`
    margin-bottom: 24px;
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: ${colors.primaryText};
      margin-bottom: 8px;
    }
    p {
      color: ${colors.secondaryText};
      font-size: 14px;
    }
  `

  export const FiltersCard = styled.div`
    background: ${colors.white};
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `

  export const FilterGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `

  export const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 13px;
      color: ${colors.secondaryText};
      font-weight: 500;
    }

    input, select {
      padding: 12px 16px;
      border: 1px solid ${colors.borderColor};
      border-radius: 6px;
      font-size: 14px;
      background: ${colors.white};
      color: ${colors.primaryText};
      width: 100%;
      box-sizing: border-box;
      height: 44px;
      line-height: 1.5;

      &:focus {
        outline: none;
        border-color: ${colors.primary};
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }

      &::placeholder {
        color: #999999;
      }
    }
  `

  export const FilterActions = styled.div`
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    button {
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
      height: 44px;

      &.primary {
        background: ${colors.primary};
        color: ${colors.white};
        border: none;

        &:hover {
          background: ${colors.primaryDark};
        }

        svg {
          color: ${colors.white};
        }
      }

      &.secondary {
        background: ${colors.white};
        color: ${colors.primaryText};
        border: 1px solid ${colors.borderColor};

        &:hover {
          background: ${colors.background};
        }
      }
    }
  `

  export const TableCard = styled.div`
    background: ${colors.white};
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `

  export const TableHeader = styled.div`
    padding: 16px 20px;
    border-bottom: 1px solid ${colors.borderColor};
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      font-size: 16px;
      font-weight: 600;
      color: ${colors.primaryText};
    }

    .actions {
      display: flex;
      gap: 8px;

      button {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
        background: ${colors.white};
        color: ${colors.primaryText};
        border: 1px solid ${colors.borderColor};

        &:hover {
          background: ${colors.background};
        }
      }
    }
  `

  export const TableWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: ${colors.background};
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: ${colors.borderColor};
      border-radius: 4px;

      &:hover {
        background: #D1D5DB;
      }
    }
  `

  export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    min-width: 1200px;

    thead {
      background: ${colors.background};

      th {
        padding: 12px 16px;
        text-align: left;
        font-size: 13px;
        font-weight: 600;
        color: ${colors.secondaryText};
        white-space: nowrap;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid ${colors.borderColor};
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: ${colors.background};
        }

        &.selected {
          background: #E6F2FF;
        }
      }

      td {
        padding: 14px 16px;
        font-size: 14px;
        color: ${colors.primaryText};

        &.number {
          font-family: 'Courier New', monospace;
        }

        &.currency {
          text-align: right;
          font-family: 'Courier New', monospace;
        }
      }
    }
  `

  export const StatusBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;

    &.paid {
      background: #D4EDDA;
      color: #155724;
    }

    &.pending {
      background: #FFF3CD;
      color: #856404;
    }

    &.overdue {
      background: #F8D7DA;
      color: #721C24;
    }

    &.cancelled {
      background: #E0E0E0;
      color: #666666;
    }
  `

  export const LoadingOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid ${colors.borderColor};
      border-top-color: ${colors.primary};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `

  export const DetailsModal = styled.div`
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
  `

  export const ModalContent = styled.div`
    background: ${colors.white};
    border-radius: 8px;
    width: 90%;
    max-width: 1200px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `

  export const ModalHeader = styled.div`
    padding: 20px;
    border-bottom: 1px solid ${colors.borderColor};
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: ${colors.primaryText};
    }

    button {
      background: none;
      border: none;
      font-size: 24px;
      color: ${colors.secondaryText};
      cursor: pointer;

      &:hover {
        color: ${colors.primaryText};
      }
    }
  `

  export const ModalBody = styled.div`
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  `

  export const DetailSection = styled.div`
    margin-bottom: 24px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: ${colors.primaryText};
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `

  export const DetailGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  `

  export const DetailItem = styled.div`
    padding: 12px;
    background: ${colors.background};
    border-radius: 6px;

    label {
      font-size: 12px;
      color: ${colors.secondaryText};
      display: block;
      margin-bottom: 4px;
    }

    .value {
      font-size: 14px;
      color: ${colors.primaryText};
      font-weight: 500;
    }
  `

  export const InstallmentsTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;

    thead {
      background: ${colors.background};

      th {
        padding: 12px;
        text-align: left;
        font-size: 13px;
        font-weight: 600;
        color: ${colors.secondaryText};
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid ${colors.borderColor};
      }

      td {
        padding: 12px;
        font-size: 14px;
        color: ${colors.primaryText};

        &.currency {
          text-align: right;
          font-family: 'Courier New', monospace;
        }
      }
    }
  `

  export const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: ${colors.secondaryText};

    svg {
      margin-bottom: 16px;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
    }
  `

  export const PaginationContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-top: 1px solid ${colors.borderColor};
    background: ${colors.white};
    flex-wrap: wrap;
    gap: 16px;

    @media (max-width: 768px) {
      justify-content: center;
    }
  `

  export const PaginationInfo = styled.div`
    font-size: 14px;
    color: ${colors.secondaryText};
    font-weight: 500;

    @media (max-width: 768px) {
      width: 100%;
      text-align: center;
    }
  `

  export const PaginationControls = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;

    @media (max-width: 768px) {
      flex-wrap: wrap;
      justify-content: center;
    }
  `

  export const PageButton = styled.button`
    padding: 0;
    width: 40px;
    height: 40px;
    border: 1px solid ${colors.borderColor};
    background: ${colors.white};
    color: ${colors.primaryText};
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background: ${colors.background};
      border-color: ${colors.primary};
      color: ${colors.primary};
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      color: ${colors.borderColor};
    }

    &.active {
      background: ${colors.primary};
      color: ${colors.white};
      border-color: ${colors.primary};
      font-weight: 600;

      &:hover {
        background: ${colors.primaryDark};
        border-color: ${colors.primaryDark};
      }
    }

    &.arrow {
      font-size: 18px;

      &:hover:not(:disabled) {
        background: ${colors.primary};
        color: ${colors.white};
        border-color: ${colors.primary};
      }
    }
  `

  export const PageInput = styled.input`
    width: 70px;
    height: 40px;
    padding: 0 12px;
    border: 1px solid ${colors.borderColor};
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: ${colors.primary};
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `

  export const PageSizeSelector = styled.select`
    padding: 0 36px 0 12px;
    height: 40px;
    border: 1px solid ${colors.borderColor};
    border-radius: 8px;
    font-size: 14px;
    background: ${colors.white};
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 20px;

    &:focus {
      outline: none;
      border-color: ${colors.primary};
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    &:hover {
      border-color: ${colors.primary};
    }
  `

  export const Divider = styled.div`
    width: 1px;
    height: 24px;
    background: ${colors.borderColor};
    margin: 0 4px;

    @media (max-width: 768px) {
      display: none;
    }
  `

  export const GoToPageContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-size: 14px;
      color: ${colors.secondaryText};
      font-weight: 500;
    }
  `

import styled from "styled-components";

export const Container = styled.div`
  padding: 24px;
`;

export const Header = styled.header`
  margin-bottom: 24px;
`;

export const FilterSection = styled.div`
  background: white;
  border-radius: 8px;
  margin: 24px 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .filter-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    .left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon {
      transition: transform 0.3s ease;

      &.open {
        transform: rotate(180deg);
      }
    }
  }

  .filter-content {
    padding: 24px;
    background: #F8F9FA;
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .filter-group {
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text);
      margin-bottom: 4px;
    }

    select,
    .react-select__control {
      width: 100%;
      height: 40px;
      min-height: 40px;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
  }
`;

export const InboxSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 24px;

  .section-header {
    padding: 16px;
    background: #F8F9FA;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    .left {
      display: flex;
      align-items: center;
      gap: 12px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text);
        margin: 0;
      }

      .count {
        background: #E9ECEF;
        color: var(--secondary-text);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }
  }
`;

export const RequestCard = styled.div`
  background: white;
  border-bottom: 1px solid var(--border-color);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #F8F9FA;
  }

  .card-content {
    display: flex;
    justify-content: space-between;
  }

  .left-content {
    .company-name {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .request-date {
      font-size: 13px;
      color: var(--secondary-text);
    }
  }

  .right-content {
    text-align: right;

    .amount {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;

      &.status-1 { background: #2563eb22; color: #607dad; }
      &.status-2 { background: #F9CF5822; color: #B58E2D; }
      &.status-3 { background: #3EB65522; color: #3EB655; }
      &.status-4 { background: #CC171722; color: #CC1717; }
    }
  }
`;

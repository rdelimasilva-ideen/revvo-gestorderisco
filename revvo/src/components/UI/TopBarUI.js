import styled from "styled-components";

export const TopHeader = styled.div`
  height: 48px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 1000;

  @media (max-width: 768px) {
    padding-right: 0px;
  }
`;

export const Logo = styled.img`
  height: 28px;
  object-fit: contain;
  margin-left: 16px;

  @media (max-width: 768px) {
    margin-left: 48px;
  }
`;

export const HeaderRight = styled.div`
  position: absolute;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 24px;

  .powered-by {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--secondary-text);
    font-size: 12px;

    @media (max-width: 768px) {
      display: none;
    }

    img {
      height: 16px;
    }
  }

  .icons {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--secondary-text);

    @media (max-width: 768px) {
      display: none;
    }    button {
      border: none;
      background: none;
      padding: 0;
      height: auto;
      color: inherit;
      position: relative;

      &:hover {
        color: var(--primary-text);
      }
    }
  }
`;

export const UserMenu = styled.div`
  position: absolute;
  top: 48px;
  right: 16px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 200px;
  z-index: 1000;
  overflow: hidden;
`;

export const NotificationDropdown = styled.div`
  position: absolute;
  top: 48px;
  right: 120px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 320px;
  max-height: 400px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    right: 16px;
    width: 280px;
  }
`;

export const NotificationHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-text);
  }

  .mark-all-read {
    background: none;
    border: none;
    color: var(--primary-blue);
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background: rgba(0, 112, 242, 0.1);
    }

    &:disabled {
      color: var(--secondary-text);
      cursor: not-allowed;
    }
  }
`;

export const NotificationList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

export const NotificationItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }

  .notification-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text);
    margin-bottom: 4px;
  }

  .notification-message {
    font-size: 13px;
    color: var(--secondary-text);
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .notification-time {
    font-size: 12px;
    color: var(--secondary-text);
  }

  &.unread {
    background: #f0f7ff;
    border-left: 3px solid var(--primary-blue);
  }
`;

export const EmptyNotifications = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: var(--secondary-text);

  .empty-icon {
    margin-bottom: 8px;
    color: #d1d5db;
  }

  .empty-text {
    font-size: 14px;
  }
`;

export const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--primary-text);

  &:hover {
    background: #f5f5f5;
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
  }
`;

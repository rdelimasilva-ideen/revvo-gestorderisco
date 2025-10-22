import styled from "styled-components";

export const SidebarContainer = styled.nav`
  position: fixed;
  top: 48px;
  left: 0;
  bottom: 0;
  width: 240px;
  overflow-y: auto;
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 16px;

  h3 {
    margin-top: 40px;
  }

  ul {
    list-style: none;
    margin-top: 0px;

    &.mobile-menu {
      display: none;

      @media (max-width: 768px) {
        display: block;
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
      }
    }

    &.submenu {
      margin-top: 8px;
      margin-left: 24px;
      margin-bottom: 16px;

      li {
        padding: 8px 12px;
        color: var(--secondary-text);

        &:hover {
          color: var(--primary-text);
        }

        &.active {
          color: var(--primary-blue);
        }
      }
    }
  }

  li {
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;

    &:hover {
      background: var(--background);
    }

    &.active {
      background: #dff3ff;
      color: var(--primary-blue);
      display: flex;
      justify-content: flex-start;
      align-items: center;

      &::after {
        content: '';
        width: 6px;
        height: 6px;
        background: #0070F2;
        border-radius: 50%;
        margin-left: auto;
      }
    }
  }

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: ${props => props['data-isopen'] === 'true' ? '0' : '-240px'};
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
  }
`;

export const MenuButton = styled.button`
  display: none;
  position: fixed;
  top: 4px;
  left: 16px;
  z-index: 1001;
  padding: 8px;
  border-radius: 4px;
  background: transparent;
  border: none;
  @media (max-width: 768px) {
    display: block;
  }
`;

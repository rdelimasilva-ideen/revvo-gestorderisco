import styled from "styled-components";

export const Header = styled.header`
  margin-bottom: 24px;

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-text);
  }

  .company-name {
    font-size: 16px;
    color: var(--secondary-text);
    margin-top: 4px;
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--secondary-text);
    display: flex;
    align-items: center;
    height: 26px;

    &:hover {
      color: var(--primary-text);
      transform: scale(1.1);
    }
  }
`;

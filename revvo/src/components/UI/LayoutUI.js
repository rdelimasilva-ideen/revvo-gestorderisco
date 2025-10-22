import styled from "styled-components";

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const Content = styled.div`
  display: flex;
  flex: 1;
  position: relative;
`;

export const Main = styled.main`
  flex: 1;
  margin-left: 240px;
  padding: 24px;
  overflow-x: hidden;

  @media (max-width: 768px) {
    margin-left: 0;
    padding-top: 24px;

    .filter-toggle {
      display: flex !important;
    }

    .filter-content {
      width: 100%;

      input {
        width: 100%;
      }

      > div > div {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  }
`;

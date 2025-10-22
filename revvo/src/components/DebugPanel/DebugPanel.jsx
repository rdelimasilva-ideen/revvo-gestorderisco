import React from 'react';
import styled from 'styled-components';
import { getGlobalCompanyId, getVarPasswordOk } from '../../lib/globalState';

const DebugContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #00ff00;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .section {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .title {
    color: #ff9900;
    margin-bottom: 4px;
    font-weight: bold;
  }
`;

const DebugPanel = ({ pageVariables = {} }) => {
  const globalVars = {
    companyId: getGlobalCompanyId(),
    passwordOk: getVarPasswordOk(),
  };

  return (
    <DebugContainer>
      <div className="section">
        <div className="title">Global Variables:</div>
        <pre>{JSON.stringify(globalVars, null, 2)}</pre>
      </div>

      <div className="section">
        <div className="title">Page Variables:</div>
        <pre>{JSON.stringify(pageVariables, null, 2)}</pre>
      </div>
    </DebugContainer>
  );
};

export default DebugPanel;

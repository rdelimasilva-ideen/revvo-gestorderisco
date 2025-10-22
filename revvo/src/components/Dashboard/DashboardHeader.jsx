import React from 'react';
import styled from 'styled-components';
import { X } from '@phosphor-icons/react';
import * as UI from '../UI/DashboardHeader'

const DashboardHeader = ({ companyName }) => {
  return (
    <UI.Header>
      <div className="title-row">
        <h2>Análise Solicitação de Limite</h2>
        <button
          className="close-button"
          onClick={() => window.dispatchEvent(new CustomEvent('navigateToInbox'))}
        >
          <X size={20} weight="bold" />
        </button>
      </div>
      {companyName && (
        <div className="company-name">{companyName}</div>
      )}
    </UI.Header>
  );
};

export default DashboardHeader;

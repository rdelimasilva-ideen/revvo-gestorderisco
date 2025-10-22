import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Buildings, User, ClipboardText, Info, PencilSimple } from '@phosphor-icons/react';
import NewLimitOrder from './NewLimitOrder';
import { deleteCreditLimitRequest } from '../../services/creditLimitService';
import * as UI from '../UI/RequestDetailsUI'

const RequestDetails = ({ request, onClose }) => {
  const [showToast, setShowToast] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getStatusName = (status_id) => {
    switch (status_id) {
      case 1: return 'Pendente';
      case 2: return 'Em Análise';
      case 3: return 'Aprovado';
      case 4: return 'Rejeitado';
      default: return 'Novo';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditClick = () => {
    if (request.status_id === 1) {
      setIsEditing(true);
    } else {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDeleteClick = async () => {
    if (!request?.id) return;
    setDeleteLoading(true);
    try {
      await deleteCreditLimitRequest(request.id);
      setDeleteLoading(false);
      setShowDeleteModal(false);
      onClose();
      window.dispatchEvent(new CustomEvent('navigateToMyRequests'));
      window.dispatchEvent(new CustomEvent('refreshMyRequests'));
    } catch (error) {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (isEditing) {
    return (
      <NewLimitOrder
        initialData={request}
        onClose={() => {
          setIsEditing(false);
          onClose();
        }}
      />
    );
  }

  return (
    <UI.Container>
      <UI.Header>
        <div className="left">
          <h2>Detalhes da Solicitação</h2>
        </div>
        <div className="right">
          {request.status_id === 1 && (
            <button
              className="delete-button"
              onClick={() => setShowDeleteModal(true)}
            >
              Excluir
            </button>
          )}
          <button
            className="edit-button"
            onClick={() => setIsEditing(true)}
            disabled={request.status_id !== 1}
          >
            <PencilSimple size={16} weight="bold" style={{ marginRight: 8 }} />
            Editar Solicitação
          </button>
          <button className="close-button" onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </div>
      </UI.Header>

      <UI.Section>
        <h3>
          <Info size={24} />
          Status da Solicitação
        </h3>
        <UI.Grid className="two-columns">
          <UI.Field>
            <label>Data da Solicitação</label>
            <div className="value">{formatDate(request.created_at)}</div>
          </UI.Field>
          <UI.Field>
            <label>Status</label>
            <UI.StatusBadge className={`status-${request.status_id}`}>
              {getStatusName(request.status_id)}
            </UI.StatusBadge>
          </UI.Field>
          <UI.Field>
            <label>Filial</label>
            <div className="value">{request.branch?.name || '-'}</div>
          </UI.Field>
        </UI.Grid>
      </UI.Section>

      <UI.Section>
        <h3>
          <Buildings size={24} />
          Dados da Empresa
        </h3>
        <UI.Grid>
          <UI.Field>
            <label>Razão Social</label>
            <div className="value">{request.customer?.name || request.company?.name || '-'}</div>
          </UI.Field>
          <UI.Field>
            <label>Código SAP</label>
            <div className="value">{request.cust_sap_id || '-'}</div>
          </UI.Field>
          <UI.Field>
            <label>E-mail do Solicitante</label>
            <div className="value">{request.email_solicitante}</div>
          </UI.Field>
          <UI.Field>
            <label>Telefone</label>
            <div className="value">{request.customer_phone_num || '-'}</div>
          </UI.Field>
          <UI.Field>
            <label>Endereço</label>
            <div className="value">
              {request.customer?.address || request.company?.address || '-'}
            </div>
          </UI.Field>
        </UI.Grid>
      </UI.Section>

      <UI.Section>
        <h3>
          <ClipboardText size={24} />
          Dados do Pedido
        </h3>
        <UI.Grid>
          <UI.Field>
            <label>Classificação</label>
            <div className="value">{request.classification?.name || '-'}</div>
          </UI.Field>
          <UI.Field>
            <label>Forma de Pagamento</label>
            <div className="value">{request.payment_method?.name || '-'}</div>
          </UI.Field>
          <UI.Field>
            <label>Prazo de Pagamento</label>
            <div className="value">{request.paymt_term || '-'}</div>
          </UI.Field>
          <UI.Field className="highlight">
            <label>Limite Solicitado</label>
            <div className="value">{formatCurrency(request.credit_limit_amt)}</div>
          </UI.Field>
        </UI.Grid>
      </UI.Section>

      {request.comment && (
        <UI.Section>
          <h3>
            <Info size={24} />
            Observações
          </h3>
          <UI.Field>
            <div className="value" style={{ whiteSpace: 'pre-line' }}>
              {request.comment}
            </div>
          </UI.Field>
        </UI.Section>
      )}

      {showDeleteModal && (
        <UI.ModalOverlay>
          <UI.ModalContent>
            <h4>Confirmar exclusão</h4>
            <p>Tem certeza que deseja excluir esta solicitação? Esta ação não poderá ser desfeita.</p>
            <div className="actions">
              <button
                className="cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                className="confirm"
                onClick={handleDeleteClick}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </UI.ModalContent>
        </UI.ModalOverlay>
      )}

      {showToast && (
        <UI.Toast>
          <Info size={20} style={{ marginRight: 8 }} />
          Erro ao excluir solicitação
        </UI.Toast>
      )}
    </UI.Container>
  );
};

export default RequestDetails;

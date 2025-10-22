import React from 'react';
import { ModalOverlay, ModalContainer, ModalHeader } from '../UI/ModalUI';
import { X } from '@phosphor-icons/react';

const Modal = ({ isOpen = true, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} weight="bold" />
          </button>
        </ModalHeader>
        {children}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default Modal;

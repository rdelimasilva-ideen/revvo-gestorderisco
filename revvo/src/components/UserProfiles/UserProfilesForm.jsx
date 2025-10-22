import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X } from '@phosphor-icons/react';
import Select from 'react-select';

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const FormContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  padding: 24px;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--primary-text);
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--secondary-text);

    &:hover {
      color: var(--primary-text);
    }
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text);
    }

    input, .select-container {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: var(--primary-blue);
      }
    }

    .error {
      color: var(--error);
      font-size: 12px;
    }
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;

    button {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;

      &.cancel {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--secondary-text);

        &:hover {
          background: var(--background);
        }
      }

      &.save {
        background: var(--primary-blue);
        border: none;
        color: white;

        &:hover {
          background: var(--primary-blue-dark);
        }
      }
    }
  }
`;

const UserProfilesForm = ({ profile, roles, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    doc_id: '',
    birth_date: '',
    role_id: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        doc_id: profile.doc_id || '',
        birth_date: profile.birth_date || '',
        role_id: profile.role_id || ''
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = 'Nome é obrigatório';
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    if (!formData.doc_id) newErrors.doc_id = 'Documento é obrigatório';
    if (!formData.role_id) newErrors.role_id = 'Função é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
    }
  };

  const roleOptions = roles.map(role => ({
    value: role.id,
    label: role.name
  }));

  return (
    <FormOverlay>
      <FormContainer>
        <FormHeader>
          <h3>{profile ? 'Editar Perfil' : 'Novo Perfil'}</h3>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </FormHeader>

        <Form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Documento</label>
            <input
              type="text"
              value={formData.doc_id}
              onChange={(e) => setFormData({ ...formData, doc_id: e.target.value })}
            />
            {errors.doc_id && <span className="error">{errors.doc_id}</span>}
          </div>

          <div className="form-group">
            <label>Data de Nascimento</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Função</label>
            <div className="select-container">
              <Select
                value={roleOptions.find(option => option.value === formData.role_id)}
                onChange={(option) => setFormData({ ...formData, role_id: option.value })}
                options={roleOptions}
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    fontSize: 14,
                    minHeight: '36px',
                    border: 'none'
                  }),
                  menu: (base) => ({
                    ...base,
                    fontSize: 14
                  })
                }}
              />
            </div>
            {errors.role_id && <span className="error">{errors.role_id}</span>}
          </div>

          <div className="buttons">
            <button type="button" className="cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="save">
              Salvar
            </button>
          </div>
        </Form>
      </FormContainer>
    </FormOverlay>
  );
};

export default UserProfilesForm;

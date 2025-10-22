import React, { useState } from 'react';
import styled from 'styled-components';
import Select from 'react-select';
import { X } from '@phosphor-icons/react';
import { inviteUser } from '../../services/inviteUserService';

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
`;
const Container = styled.div`
  background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 100%;
`;

export default function InviteUserModal({ roles, onClose, onSuccess, companyId }) {
  const [form, setForm] = useState({
    name: '', email: '', doc_id: '', birth_date: '', role_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (option) => {
    setForm({ ...form, role_id: option.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await inviteUser({
        email: form.email,
        name: form.name,
        doc_id: form.doc_id,
        birth_date: form.birth_date,
        company_id: companyId,
        role_id: form.role_id,
        password: 'SenhaProvisoria123!'
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = roles.map(role => ({ value: role.id, label: role.name }));

  return (
    <Overlay>
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Convidar Usuário</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Nome</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label>Documento</label>
            <input name="doc_id" value={form.doc_id} onChange={handleChange} />
          </div>
          <div>
            <label>Data de Nascimento</label>
            <input name="birth_date" type="date" value={form.birth_date} onChange={handleChange} />
          </div>
          <div>
            <label>Função</label>
            <Select
              value={roleOptions.find(opt => opt.value === form.role_id)}
              onChange={handleRoleChange}
              options={roleOptions}
              isClearable={false}
            />
          </div>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</button>
          </div>
        </form>
      </Container>
    </Overlay>
  );
}

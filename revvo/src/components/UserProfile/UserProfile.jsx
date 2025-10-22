import React, { useState, useEffect } from 'react';
import * as UI from '../UI/UserProfileUI';
import { DEFAULT_COMPANY_ID } from '../../constants/defaults';
import { getSession } from '../../services/sessionService';
import { X } from '@phosphor-icons/react';
import { getCurrentUserProfile, upsertUserProfile, getRoles } from '../../services/userProfileService';
import { getRoleNameById } from '../../services/userRoleService';

const UserProfile = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    doc_id: '',
    birth_date: '',
    role_id: ''
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    loadProfile();
    loadRoles();
  }, []);

  useEffect(() => {
    // Quando o profile carregar, buscar o nome da função se role_id existir
    const fetchRoleName = async () => {
      if (profile.role_id) {
        try {
          const name = await getRoleNameById(profile.role_id);
          setRoleName(name);
        } catch {
          setRoleName('');
        }
      } else {
        setRoleName('');
      }
    };
    fetchRoleName();
  }, [profile.role_id]);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await getSession();
      if (!session?.user) {
        console.error('No user session found');
        return;
      }
      const data = await getCurrentUserProfile(session.user.id);
      if (data) {
        setProfile({
          id: data.id,
          email: data.email || session.user.email,
          name: data.name || '',
          doc_id: data.doc_id || '',
          birth_date: data.birth_date || '',
          role_id: data.role_id || ''
        });
      } else {
        setProfile({
          id: session.user.id,
          email: session.user.email,
          name: '',
          doc_id: '',
          birth_date: '',
          role_id: ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await getRoles(DEFAULT_COMPANY_ID);
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error.message);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profile.name) newErrors.name = 'Nome é obrigatório';
    if (!profile.doc_id) newErrors.doc_id = 'Documento é obrigatório';
    if (!profile.role_id) newErrors.role_id = 'Função é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await upsertUserProfile({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        doc_id: profile.doc_id,
        birth_date: profile.birth_date,
        role_id: profile.role_id,
        company_id: DEFAULT_COMPANY_ID
      });
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving profile:', error.message);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UI.Container>
        <UI.Card>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            Carregando...
          </div>
        </UI.Card>
      </UI.Container>
    );
  }

  return (
    <UI.Container>
      <UI.Header>
        <h2>Meu Perfil</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        )}
      </UI.Header>

      <UI.Card>
        <UI.Form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => {
                setProfile({ ...profile, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Digite seu nome"
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              title="O email não pode ser alterado"
            />
          </div>

          <div className="form-group">
            <label>Documento</label>
            <input
              type="text"
              value={profile.doc_id}
              onChange={(e) => {
                setProfile({ ...profile, doc_id: e.target.value });
                if (errors.doc_id) setErrors({ ...errors, doc_id: '' });
              }}
              placeholder="Digite seu documento"
            />
            {errors.doc_id && <span className="error">{errors.doc_id}</span>}
          </div>

          <div className="form-group">
            <label>Data de Nascimento</label>
            <input
              type="date"
              value={profile.birth_date || ''}
              onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Função</label>
            <input
              type="text"
              value={roleName}
              disabled
              title="A função é definida pelo administrador"
            />
          </div>

          <div className="buttons">
            {onClose && (
              <button type="button" className="cancel" onClick={onClose}>
                Cancelar
              </button>
            )}
            <button type="submit" className="save" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </UI.Form>
      </UI.Card>
    </UI.Container>
  );
};

export default UserProfile;

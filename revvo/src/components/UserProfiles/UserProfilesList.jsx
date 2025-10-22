import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Pencil, Trash } from '@phosphor-icons/react';
import { getSession } from '../../services/sessionService';

const ListContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    background: var(--background);
    font-weight: 500;
    color: var(--secondary-text);
    font-size: 14px;
  }

  td {
    font-size: 14px;
    color: var(--primary-text);
  }

  tr:last-child td {
    border-bottom: none;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .action-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--secondary-text);

    &:hover {
      color: var(--primary-text);
    }

    &.edit:hover {
      color: var(--primary-blue);
    }

    &.delete:hover {
      color: var(--error);
    }
  }
`;

const UserProfilesList = ({ profiles, onEdit, onDelete }) => {
  const [loggedUserId, setLoggedUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSession();
      setLoggedUserId(session?.user?.id || null);
    })();
  }, []);

  return (
    <ListContainer>
      <Table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Documento</th>
            <th>Data de Nascimento</th>
            <th>Empresa</th>
            <th>Função</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {profiles.length > 0 ? profiles.map(profile => (
            <tr key={profile.id}>
              <td>{profile.name}</td>
              <td>{profile.email}</td>
              <td>{profile.doc_id}</td>
              <td>{profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : '-'}</td>
              <td>{profile.company?.name || '-'}</td>
              <td>{profile.user_role?.name || '-'}</td>
              <td>
                <div className="actions">
                  <button
                    className="action-button edit"
                    onClick={() => onEdit(profile)}
                  >
                    <Pencil size={20} />
                  </button>
                  {profile.logged_id !== loggedUserId && (
                    <button
                      className="action-button delete"
                      onClick={() => onDelete(profile.id)}
                    >
                      <Trash size={20} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ color: 'var(--secondary-text)' }}>
                  <p>Nenhum usuário encontrado</p>
                  <small>Utilize o botão "Novo Usuário" para adicionar usuários ao sistema</small>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </ListContainer>
  );
};

export default UserProfilesList;

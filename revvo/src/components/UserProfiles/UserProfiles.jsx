import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DEFAULT_COMPANY_ID } from '../../constants/defaults';
import { getGlobalCompanyId } from '../../lib/globalState';
import UserProfilesHeader from './UserProfilesHeader';
import UserProfilesFilter from './UserProfilesFilter';
import UserProfilesList from './UserProfilesList';
import UserProfilesForm from './UserProfilesForm';
import { X } from '@phosphor-icons/react';
import { 
  listUserProfiles, 
  deleteUserProfile, 
  listCompanies, 
  getRoles, 
  updateUserProfile,
  getUserProfileById,
  upsertUserProfile
} from '../../services/userProfileService';
import { deleteUser } from '../../services/adminService';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const UserProfiles = () => {
  const companyId = getGlobalCompanyId();
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState([]);

  const loadProfiles = async () => {
    try {
      const data = await listUserProfiles(getGlobalCompanyId());
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await getRoles(getGlobalCompanyId());
        setRoles(data || []);
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    }
    loadRoles();
  }, []);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await listCompanies(getGlobalCompanyId());
        setCompanies(data || []);
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    }

    loadCompanies();
  }, []);

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsFormOpen(true);
  };

  const handleEditProfile = (profile) => {
    setSelectedProfile(profile);
    setIsFormOpen(true);
  };

  const handleDeleteProfile = async (profileId) => {
    if (window.confirm('Tem certeza que deseja excluir este perfil?')) {
      try {
        // Buscar o logged_id do usuário
        const userProfile = await getUserProfileById(profileId);

        // 1) Excluir primeiro do user_profile para não violar a FK
        await deleteUserProfile(profileId);

        // 2) Tentar excluir do auth.users via nosso serviço de administração
        if (userProfile?.logged_id) {
          try {
            await deleteUser(userProfile.logged_id);
          } catch (authErr) {
            // Ignora erros de not found no Auth; loga os demais
            console.warn('Falha ao excluir usuário no Auth (pode já não existir):', authErr);
          }
        }

        // Recarregar a lista de perfis
        await loadProfiles();
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Erro ao excluir perfil. Por favor, tente novamente.');
      }
    }
  };

  const handleSaveProfile = async (profileData) => {
    try {
      if (selectedProfile) {
        await updateUserProfile(selectedProfile.id, profileData);
      } else {
        await upsertUserProfile({ ...profileData, company_id: getGlobalCompanyId() });
      }

      setIsFormOpen(false);
      loadProfiles();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || profile.role_id === selectedRole;
    const matchesCompany = !selectedCompany || profile.company_id === selectedCompany;
    return matchesSearch && matchesRole && matchesCompany;
  });

  return (
    <Container>
      <UserProfilesHeader
        roles={roles}
        onInviteSuccess={loadProfiles}
      />

      <UserProfilesFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roles={roles}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        companies={companies}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
      />

      <UserProfilesList
        profiles={filteredProfiles}
        onEdit={handleEditProfile}
        onDelete={handleDeleteProfile}
      />

      {isFormOpen && (
        <UserProfilesForm
          profile={selectedProfile}
          roles={roles}
          onSave={handleSaveProfile}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </Container>
  );
};

export default UserProfiles;

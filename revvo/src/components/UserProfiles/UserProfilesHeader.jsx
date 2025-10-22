import { getGlobalCompanyId } from '../../lib/globalState';
import { useState, useEffect } from 'react';
import InviteUserModal from './InviteUserModal';

const UserProfilesHeader = ({ roles, onInviteSuccess }) => {
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">Perfis e Acessos</h2>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
        style={{ minHeight: 40 }}
        onClick={() => setInviteModalOpen(true)}
      >
        Convidar Usuário
      </button>
      {isInviteModalOpen && (
        <InviteUserModal
          roles={roles}
          companyId={getGlobalCompanyId()}
          onClose={() => setInviteModalOpen(false)}
          onSuccess={onInviteSuccess}
        />
      )}
    </div>
  );
};

export default UserProfilesHeader;

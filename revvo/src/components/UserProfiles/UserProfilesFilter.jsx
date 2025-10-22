import React from 'react';
import styled from 'styled-components';
import Select from 'react-select';

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .search-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: var(--primary-blue);
    }
  }

  .select {
    width: 200px;
  }
`;

const UserProfilesFilter = ({
  searchTerm,
  setSearchTerm,
  roles,
  selectedRole,
  setSelectedRole,
  companies,
  selectedCompany,
  setSelectedCompany
}) => {
  const roleOptions = [
    { value: '', label: 'Todas as funções' },
    ...roles.map(role => ({
      value: role.id,
      label: role.name
    }))
  ];

  const companyOptions = [
    { value: '', label: 'Todas as empresas' },
    ...companies.map(company => ({
      value: company.id,
      label: company.name
    }))
  ];

  return (
    <FilterContainer>
      <input
        type="text"
        className="search-input"
        placeholder="Buscar por nome ou email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="select">
        <Select
          value={companyOptions.find(option => option.value === selectedCompany)}
          onChange={(option) => setSelectedCompany(option.value)}
          options={companyOptions}
          isClearable={false}
          styles={{
            control: (base) => ({
              ...base,
              fontSize: 14,
              minHeight: '36px'
            }),
            menu: (base) => ({
              ...base,
              fontSize: 14
            })
          }}
        />
      </div>

      <div className="select">
        <Select
          value={roleOptions.find(option => option.value === selectedRole)}
          onChange={(option) => setSelectedRole(option.value)}
          options={roleOptions}
          isClearable={false}
          styles={{
            control: (base) => ({
              ...base,
              fontSize: 14,
              minHeight: '36px'
            }),
            menu: (base) => ({
              ...base,
              fontSize: 14
            })
          }}
        />
      </div>
    </FilterContainer>
  );
};

export default UserProfilesFilter;

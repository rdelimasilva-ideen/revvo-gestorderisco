import { apiService } from './apiService';

// Busca o perfil do usuário logado
export async function getCurrentUserProfile(userId) {
  try {
    const response = await apiService.get(`/api/user-profile/current/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    throw error;
  }
}

// Atualiza ou cria o perfil do usuário
export async function upsertUserProfile(profile) {
  try {
    await apiService.post('/api/user-profile/upsert', profile);
    return true;
  } catch (error) {
    console.error('Erro ao fazer upsert do perfil:', error);
    throw error;
  }
}

// Busca todas as roles da empresa
export async function getRoles(companyId) {
  try {
    const response = await apiService.get(`/api/user-profile/roles/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    throw error;
  }
}

// Lista perfis de usuário da empresa
export async function listUserProfiles(companyId) {
  try {
    const response = await apiService.get(`/api/user-profile/list/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar perfis de usuário:', error);
    throw error;
  }
}

// Deleta perfil de usuário por id
export async function deleteUserProfile(profileId) {
  try {
    await apiService.delete(`/api/user-profile/${profileId}`);
    return true;
  } catch (error) {
    console.error('Erro ao deletar perfil:', error);
    throw error;
  }
}

// Busca empresas por id (ou todas de um grupo, se necessário)
export async function listCompanies(companyId) {
  try {
    const response = await apiService.get(`/api/user-profile/companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    throw error;
  }
}

// Busca nome do usuário logado pelo id
export async function getUserName(userId) {
  try {
    const response = await apiService.get(`/api/user-profile/name/${userId}`);
    return response.data || '';
  } catch (error) {
    console.error('Erro ao buscar nome do usuário:', error);
    throw error;
  }
}

// Atualiza um perfil específico
export async function updateUserProfile(profileId, profileData) {
  try {
    await apiService.put(`/api/user-profile/${profileId}`, profileData);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}

// Busca perfil por ID
export async function getUserProfileById(profileId) {
  try {
    const response = await apiService.get(`/api/user-profile/${profileId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar perfil por ID:', error);
    throw error;
  }
}

// ===== IMPLEMENTAÇÃO ORIGINAL COMENTADA =====
// import { supabase } from '../lib/supabase';

// // Busca o perfil do usuário logado
// export async function getCurrentUserProfile(userId) {
//   const { data, error } = await supabase
//     .from('user_profile')
//     .select(`*, user_role:role_id(id, name)`)
//     .eq('logged_id', userId)
//     .single();
//   if (error) throw error;
//   return data;
// }

// // Atualiza ou cria o perfil do usuário
// export async function upsertUserProfile(profile) {
//   const { error } = await supabase
//     .from('user_profile')
//     .upsert(profile);
//   if (error) throw error;
//   return true;
// }

// // Busca todas as roles da empresa
// export async function getRoles(companyId) {
//   const { data, error } = await supabase
//     .from('user_role')
//     .select('*')
//     .eq('company_id', companyId)
//     .order('name');
//   if (error) throw error;
//   return data;
// }

// // Lista perfis de usuário da empresa
// export async function listUserProfiles(companyId) {
//   const { data, error } = await supabase
//     .from('user_profile')
//     .select(`
//       *,
//       user_role:role_id(id, name),
//       company:company_id(id, name)
//     `)
//     .eq('company_id', companyId)
//     .order('name', { ascending: true });
//   if (error) throw error;
//   return data;
// }

// // Deleta perfil de usuário por id
// export async function deleteUserProfile(profileId) {
//   const { error } = await supabase
//     .from('user_profile')
//     .delete()
//     .eq('id', profileId);
//   if (error) throw error;
//   return true;
// }

// // Busca empresas por id (ou todas de um grupo, se necessário)
// export async function listCompanies(companyId) {
//   const { data, error } = await supabase
//     .from('company')
//     .select('id, name')
//     .eq('id', companyId)
//     .order('name', { ascending: true });
//   if (error) throw error;
//   return data;
// }

// // Busca nome do usuário logado pelo id
// export async function getUserName(userId) {
//   const { data, error } = await supabase
//     .from('user_profile')
//     .select('name')
//     .eq('logged_id', userId)
//     .single();
//   if (error) throw error;
//   return data?.name || '';
// }

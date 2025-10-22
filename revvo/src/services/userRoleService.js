import { API_BASE_URL } from '../config/api';
import { apiService } from './apiService';

// *** NOVA IMPLEMENTAÇÃO - VIA API BACKEND ***

// Lista roles da empresa
export async function listRoles(companyId) {
  try {
    const data = await apiService.get(`/api/user-roles/${companyId}`);
    return data;
  } catch (error) {
    console.error('Error listing roles:', error);
    throw error;
  }
}

// Cria uma nova role
export async function createRole(roleData) {
  try {
    // Garantir que os dados estão no formato correto
    const payload = {
      name: roleData.name,
      description: roleData.description || "",
      company_id: parseInt(roleData.company_id, 10)
    };
    
    // Usar fetch diretamente
    const response = await fetch(API_BASE_URL + '/api/user-roles/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      // Se a resposta não for OK, tente obter os detalhes do erro
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        throw errorData;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}

// Busca o nome da role pelo id
export async function getRoleNameById(roleId) {
  try {
    const result = await apiService.get(`/api/user-roles/name/${roleId}`);
    return result.name || '';
  } catch (error) {
    console.error('Error getting role name:', error);
    throw error;
  }
}



// *** IMPLEMENTAÇÃO ANTIGA - COMENTADA PARA REFERÊNCIA ***
/*
// Lista roles da empresa
export async function listRoles(companyId) {
  // Utilizar apiService ao invés do Supabase diretamente
  try {
    const data = await apiService.get(`/api/user-roles/${companyId}`);
    return data;
  } catch (error) {
    console.error('Error listing roles:', error);
    throw error;
  }
}

// Cria uma nova role
export async function createRole(roleData) {
  const { error } = await supabase
    .from('user_role')
    .insert([roleData]);
  if (error) throw error;
  return true;
}

// Busca o nome da role pelo id
export async function getRoleNameById(roleId) {
  try {
    const result = await apiService.get(`/api/user-roles/name/${roleId}`);
    return result.name || '';
  } catch (error) {
    console.error('Error getting role name:', error);
    throw error;
  }
}
*/

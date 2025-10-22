import { apiService } from './apiService';

/**
 * Serviço para operações administrativas
 */

// Exclui um usuário pelo ID (somente administradores)
export async function deleteUser(userId) {
  try {
    const token = localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // apiService.delete já retorna o JSON parseado
    const result = await apiService.delete(`/auth/admin/users/${userId}`, headers);
    return result;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw error;
  }
}
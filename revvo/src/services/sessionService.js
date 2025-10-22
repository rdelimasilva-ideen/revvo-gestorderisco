import { API_BASE_URL } from '../config/api';
import { requestCache } from '../lib/requestCache';

// Cache em memória para a sessão
let sessionCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutos em milissegundos
};

// Função para obter a sessão do usuário do backend em vez do Supabase diretamente
export async function getSession() {
  try {
    // Obter o token de acesso do localStorage
    const accessToken = localStorage.getItem('access_token');
    
    // Se não houver token, retorna null para indicar que não há sessão
    if (!accessToken) {
      return {
        data: {
          session: null
        },
        error: null
      };
    }
    
    // Verificar se temos dados em cache válidos
    const now = Date.now();
    if (sessionCache.data && now - sessionCache.timestamp < sessionCache.ttl) {
      console.log('Usando sessão em cache');
      return sessionCache.data;
    }
    
    // Usar o cache global para evitar requisições duplicadas
    const cacheKey = 'auth:session';
    if (requestCache.getValid(cacheKey)) {
      return requestCache.getValid(cacheKey);
    }
    
    // Fazer a requisição para o backend com o token no header
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Se a resposta não for bem-sucedida, trata o erro
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao obter sessão:', errorData);
      
      // Se o erro for de autenticação (401), limpa o localStorage
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
      
      return {
        data: {
          session: null
        },
        error: errorData
      };
    }

    // Obtém os dados da sessão
    const sessionData = await response.json();
    
    console.log('Session data from backend:', sessionData);
    
    // Verificar se temos os dados necessários da sessão
    if (!sessionData || !sessionData.session) {
      console.warn('Session data from backend is missing required fields', sessionData);
      
      // Tentar construir a sessão a partir dos dados locais se possível
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (user && accessToken) {
        console.log('Constructing session from local storage data');
        return {
          data: {
            session: {
              access_token: accessToken,
              refresh_token: refreshToken,
              user: user
            }
          },
          error: null
        };
      }
    }
    
    // Formata a resposta no formato esperado pelo código que usa supabase.auth.getSession()
    const result = {
      data: {
        session: sessionData.session || sessionData // Tenta usar sessionData se session não existir
      },
      error: null
    };
    
    // Armazena no cache
    sessionCache = {
      data: result,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutos
    };
    
    // Também armazena no cache global
    requestCache.set('auth:session', result, 5 * 60 * 1000);
    
    return result;
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return {
      data: {
        session: null
      },
      error: error.message
    };
  }
}

// Função para limpar explicitamente o cache de sessão
export function clearSessionCache() {
  sessionCache = {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000
  };
  
  // Também limpa do cache global
  requestCache.delete('auth:session');
}

import { API_BASE_URL } from '../config/api';
import { requestCache } from '../lib/requestCache';

// Cache em memória para a sessão
let sessionCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutos em milissegundos
};

// Função para obter a sessão do usuário (modo mock - usa localStorage)
export async function getSession() {
  try {
    // MODO MOCK: Obter sessão diretamente do localStorage
    const sessionStr = localStorage.getItem('session');
    const accessToken = localStorage.getItem('access_token');

    // Se não houver token ou sessão, retorna null
    if (!accessToken || !sessionStr) {
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

    // Parse da sessão do localStorage
    let session;
    try {
      session = JSON.parse(sessionStr);
    } catch (e) {
      console.error('Erro ao fazer parse da sessão:', e);
      return {
        data: {
          session: null
        },
        error: null
      };
    }

    // Formata a resposta no formato esperado
    const result = {
      data: {
        session: session
      },
      error: null
    };

    // Armazena no cache
    sessionCache = {
      data: result,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutos
    };

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

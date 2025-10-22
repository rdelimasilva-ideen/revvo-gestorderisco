import { API_BASE_URL } from '../config/api';

// Login (usando o backend em vez do Supabase diretamente)
export async function login({ email, password }) {
  try {
    // Limpar o cache da sessão antes de fazer login
    clearSessionCache();
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha na autenticação');
    }

    const data = await response.json();
    
    // Armazenar dados úteis no localStorage para uso em outras partes da aplicação
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    
    // Adicionalmente, armazenar a sessão completa para garantir consistência
    if (data.session) {
      localStorage.setItem('session', JSON.stringify(data.session));
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

// Signup (usando o backend em vez do Supabase diretamente)
export async function signup({ email, password, ...user_metadata }) {
  try {
    // Limpar o cache da sessão antes de fazer signup
    clearSessionCache();
    
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email, 
        password, 
        user_metadata 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha no cadastro');
    }

    const data = await response.json();
    
    // Armazenar dados úteis no localStorage para uso em outras partes da aplicação
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    if (data.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
    }
    
    if (data.session?.refresh_token) {
      localStorage.setItem('refresh_token', data.session.refresh_token);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao fazer signup:', error);
    throw error;
  }
}

// Importar clearSessionCache do sessionService
import { clearSessionCache } from './sessionService';

// Logout (usando exclusivamente o backend)
export async function logout() {
  try {
    // Limpar o cache da sessão imediatamente
    clearSessionCache();
    
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Aviso ao fazer logout na API:', errorData);
    }

    // Limpar TODOS os dados de sessão e autenticação
    console.log('Limpando dados de sessão...');
    
    // Limpar localStorage - usamos uma abordagem abrangente para garantir que todos os tokens sejam removidos
    const keysToRemove = [
      // Chaves específicas da nossa aplicação
      'user', 'user_info', 'access_token', 'refresh_token', 'sap_token', 'rememberMe', 'session',
      'supabase.auth.token', 'companyId', 'sbat', 'defaultRole',
      
      // Padrões do Supabase (incluindo diferentes formatos)
      'sb-vpnusoaiqtuqihkstgzt-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'supabase.auth.token',
      
      // Encontrar todas as chaves do localStorage que começam com 'sb-' (padrão do Supabase)
      ...Object.keys(localStorage).filter(key => key.startsWith('sb-'))
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Erro ao remover ${key} do localStorage:`, e);
      }
    });
    
    // Limpar completamente dados relacionados ao Supabase
    try {
      // Limpar cookies relacionados ao Supabase (se existirem)
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name.includes('sb-') || name.includes('supabase')) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      }
    } catch (e) {
      console.warn('Erro ao limpar cookies:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    
    // Ainda tenta limpar o localStorage em caso de erro
    try {
      // Tenta limpar explicitamente as chaves mais importantes
      ['sap_token', 'user_info', 'access_token', 'refresh_token', 'user', 'session'].forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Removida a chave: ${key}`);
        } catch (e) {
          console.warn(`Erro ao remover ${key}:`, e);
        }
      });
      
      // Abordagem adicional: iterar por todas as chaves existentes no localStorage
      // Isso garantirá que qualquer chave relacionada à autenticação seja removida
      try {
        const allKeys = Object.keys(localStorage);
        console.log('Todas as chaves no localStorage:', allKeys);
        
        allKeys.forEach(key => {
          // Remover qualquer chave que possa conter dados de autenticação
          if (key.toLowerCase().includes('token') || 
              key.toLowerCase().includes('auth') || 
              key.toLowerCase().includes('session') ||
              key.toLowerCase().includes('user') ||
              key.toLowerCase().includes('sb-')) {
            localStorage.removeItem(key);
            console.log(`Removida chave detectada: ${key}`);
          }
        });
      } catch (iterateError) {
        console.warn('Erro ao iterar pelas chaves:', iterateError);
      }
      
      // Em seguida, tenta limpar tudo como backup
      localStorage.clear(); // Remove tudo para garantir
      
      console.log('localStorage completamente limpo');
    } catch (e) {
      console.error('Falha ao limpar localStorage:', e);
    }
    
    // Não relança o erro para permitir que o usuário seja redirecionado para o login
    return true;
  }
}

// Reset de senha por e-mail (usando o backend em vez do Supabase diretamente)
export async function resetPasswordForEmail(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha ao solicitar reset de senha');
    }

    return true;
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    throw error;
  }
}

// Iniciar login com OAuth (Google, Github, etc)
export async function signInWithOAuth(provider, redirectUrl) {
  try {
    const options = { provider };
    if (redirectUrl) {
      options.redirect_url = redirectUrl;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/oauth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha ao iniciar login OAuth');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao iniciar login OAuth:', error);
    throw error;
  }
}

// Definir sessão no frontend
export async function setSession(tokens) {
  try {
    if (tokens.access_token) {
      localStorage.setItem('access_token', tokens.access_token);
    }
    
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
    
    // Não precisamos fazer uma chamada para o backend aqui, pois as tokens já são válidas
    return { 
      data: { session: { user: JSON.parse(localStorage.getItem('user') || '{}') } },
      error: null
    };
  } catch (error) {
    console.error('Erro ao definir sessão:', error);
    throw error;
  }
}

// Obter usuário atual
export async function getUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha ao obter usuário');
    }

    const data = await response.json();
    return { data: { user: data.user }, error: null };
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return { data: { user: null }, error };
  }
}

// Atualizar dados do usuário (incluindo senha)
export async function updateUser(attributes) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/update-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(attributes)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha ao atualizar usuário');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return { data: null, error };
  }
}

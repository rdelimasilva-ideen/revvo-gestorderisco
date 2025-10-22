import { useState, useEffect, useRef } from 'react';

// Cache global simples para evitar requisições duplicadas
const requestCache = new Map();

/**
 * Hook personalizado que previne requisições duplicadas em StrictMode
 * @param {Function} requestFn - Função que faz a requisição
 * @param {Array} deps - Dependências do useEffect
 * @param {string} cacheKey - Chave única para o cache
 */
export function useApiRequest(requestFn, deps = [], cacheKey = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const makeRequest = async () => {
      // Se já tem no cache e tem cacheKey, usar cache
      if (cacheKey && requestCache.has(cacheKey)) {
        const cachedData = requestCache.get(cacheKey);
        if (!isCancelled) {
          setData(cachedData);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const result = await requestFn();
        
        if (!isCancelled) {
          setData(result);
          
          // Salvar no cache se tiver cacheKey
          if (cacheKey) {
            requestCache.set(cacheKey, result);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err);
          console.error('API Request failed:', err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    // Prevenir primeira execução dupla do StrictMode
    if (!hasMounted.current) {
      hasMounted.current = true;
      makeRequest();
    } else {
      makeRequest();
    }

    return () => {
      isCancelled = true;
    };
  }, deps);

  // Função para invalidar cache
  const invalidateCache = () => {
    if (cacheKey && requestCache.has(cacheKey)) {
      requestCache.delete(cacheKey);
    }
  };

  return { data, loading, error, invalidateCache };
}

// Utilitário para limpar todo o cache
export const clearAllCache = () => {
  requestCache.clear();
};

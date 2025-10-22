// Cache global para evitar requisições duplicadas
class RequestCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Gera chave única para a requisição
  generateKey(endpoint, params = {}) {
    const paramStr = JSON.stringify(params);
    return `${endpoint}:${paramStr}`;
  }

  // Verifica se tem no cache
  has(key) {
    return this.cache.has(key);
  }

  // Busca do cache
  get(key) {
    return this.cache.get(key);
  }

  // Salva no cache
  set(key, data, ttl = 5 * 60 * 1000) { // TTL padrão: 5 minutos
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Verifica se cache expirou
  isExpired(key) {
    const cached = this.cache.get(key);
    if (!cached) return true;
    return Date.now() - cached.timestamp > cached.ttl;
  }

  // Busca dados válidos do cache
  getValid(key) {
    if (!this.has(key) || this.isExpired(key)) {
      this.delete(key);
      return null;
    }
    return this.get(key).data;
  }

  // Remove do cache
  delete(key) {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  // Limpa cache expirado
  cleanup() {
    for (const [key] of this.cache) {
      if (this.isExpired(key)) {
        this.delete(key);
      }
    }
  }

  // Executa requisição com cache e deduplicação
  async executeRequest(key, requestFn) {
    // Se já tem no cache válido, retorna
    const cached = this.getValid(key);
    if (cached) {
      return cached;
    }

    // Se já tem requisição pendente, aguarda ela
    if (this.pendingRequests.has(key)) {
      return await this.pendingRequests.get(key);
    }

    // Executa nova requisição
    const requestPromise = (async () => {
      try {
        const result = await requestFn();
        this.set(key, result);
        return result;
      } catch (error) {
        console.error(`Request failed for key ${key}:`, error);
        throw error;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, requestPromise);
    return await requestPromise;
  }

  // Invalida cache por padrão
  invalidatePattern(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }

  // Limpa todo o cache
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Instância global
export const requestCache = new RequestCache();

// Cleanup automático a cada 5 minutos
setInterval(() => {
  requestCache.cleanup();
}, 5 * 60 * 1000);

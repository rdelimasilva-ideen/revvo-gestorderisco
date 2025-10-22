// API Service para comunicação com o backend
const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Se a resposta não for OK, tente obter os detalhes do erro
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          // Erro com detalhes em JSON
          const errorData = await response.json();
          throw {
            status: response.status,
            message: `HTTP error! status: ${response.status}`,
            details: errorData
          };
        } else {
          // Erro sem detalhes em JSON
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET request helper
  async get(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'GET',
      headers,
    });
  }

  // POST request helper
  async post(endpoint, data, headers = {}) {
    // Verificar se data já é uma string (já foi serializado)
    const bodyData = typeof data === 'string' ? data : JSON.stringify(data);
    
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: bodyData,
    });
  }

  // PUT request helper
  async put(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  // DELETE request helper
  async delete(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers,
    });
  }
}

export const apiService = new ApiService();

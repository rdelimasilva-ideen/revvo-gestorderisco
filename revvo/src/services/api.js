import { API_BASE_URL } from '../config/api';
import { getSession } from './sessionService';
import { sapDataService } from './sapDataService';

const SAP_BASE_URL = 'http://localhost:3001/cpi';

class ApiService {
  constructor() {
    this.sapBaseUrl = SAP_BASE_URL;
  }

  async sapRequest(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.sapBaseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SAP API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`SAP Error: ${result.error}`);
      }

      return result;
    } catch (error) {
      if (error.message.includes('internal server error') ||
          error.message.includes('MPL ID')) {
        return { error: 'SAP_INTERNAL_ERROR', message: error.message };
      }
      throw error;
    }
  }

  async supabaseSelect(table, options = {}) {
    return sapDataService.select(table, options);
  }

  async supabaseInsert(table, data) {
    return sapDataService.insertRecord(table, data);
  }

  async supabaseUpdate(table, data, conditions) {
    return sapDataService.updateRecord(table, data, conditions);
  }

  async supabaseDelete(table, conditions) {
    return sapDataService.deleteRecord(table, conditions);
  }

  async supabaseUpsert(table, data, options = {}) {
    return sapDataService.upsertRecord(table, data, options);
  }

  async getUserProfile() {
    const { data: { session } } = await getSession();

    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    return sapDataService.select('user_profile', {
      select: '*',
      eq: { logged_id: session.user.id },
      single: true
    });
  }

  async executeWithRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries ||
            !error.message.includes('internal server error')) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
}

export const apiService = new ApiService();

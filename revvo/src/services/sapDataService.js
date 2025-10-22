import { API_BASE_URL } from '../config/api';
import { requestService } from './requestService';

class SapDataService {
  constructor() {
    this.baseUrl = `/sap`;
  }

  async query(params) {
    try {
      const response = await requestService.post(`${this.baseUrl}/query`, params);
      return response;
    } catch (error) {
      console.error('Erro ao consultar dados:', error);
      throw error;
    }
  }

  async insert(params) {
    try {
      const response = await requestService.post(`${this.baseUrl}/insert`, params);
      return response;
    } catch (error) {
      console.error('Erro ao inserir dados:', error);
      throw error;
    }
  }

  async update(params) {
    try {
      const response = await requestService.post(`${this.baseUrl}/update`, params);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      throw error;
    }
  }

  async delete(params) {
    try {
      const response = await requestService.post(`${this.baseUrl}/delete`, params);
      return response;
    } catch (error) {
      console.error('Erro ao remover dados:', error);
      throw error;
    }
  }

  async upsert(params) {
    try {
      const response = await requestService.post(`${this.baseUrl}/upsert`, params);
      return response;
    } catch (error) {
      console.error('Erro ao inserir/atualizar dados:', error);
      throw error;
    }
  }

  // Métodos helpers para compatibilidade com a API do Supabase

  async select(table, options = {}) {
    try {
      const params = {
        table,
        select: options.select || '*',
        eq: options.eq || {},
        in_values: options.in || {},
        gte: options.gte || {},
        lte: options.lte || {},
        like: options.like || {},
        order_column: options.order?.column,
        order_desc: options.order ? !(options.order.ascending ?? true) : false,
        limit: options.limit,
        single: options.single || false
      };

      const result = await this.query(params);
      return result.data;
    } catch (error) {
      console.error('Erro ao selecionar dados:', error);
      throw error;
    }
  }

  async insertRecord(table, data) {
    try {
      const params = {
        table,
        data
      };

      const result = await this.insert(params);
      return result.data;
    } catch (error) {
      console.error('Erro ao inserir registro:', error);
      throw error;
    }
  }

  async updateRecord(table, data, conditions) {
    try {
      const params = {
        table,
        data,
        conditions
      };

      const result = await this.update(params);
      return result.data;
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      throw error;
    }
  }

  async deleteRecord(table, conditions) {
    try {
      const params = {
        table,
        conditions
      };

      await this.delete(params);
      return true;
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      throw error;
    }
  }

  async upsertRecord(table, data, options = {}) {
    try {
      const params = {
        table,
        data,
        on_conflict: options.onConflict || 'id'
      };

      const result = await this.upsert(params);
      return result.data;
    } catch (error) {
      console.error('Erro ao inserir/atualizar registro:', error);
      throw error;
    }
  }
}

export const sapDataService = new SapDataService();
// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const SAP_CONNECTOR_URL = import.meta.env.VITE_SAP_CONNECTOR_URL || 'http://localhost:8000';
export const API_BASE_URL = `${API_URL}`;

export const apiConfig = {
  baseURL: API_URL,
  SAP_CONNECTOR_URL,
  API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  AUTH: {
    LOGIN: '/auth/login',
    SAP_TOKEN: '/sap-token' // Endpoint renomeado para evitar conflitos
  }
};

export default apiConfig;

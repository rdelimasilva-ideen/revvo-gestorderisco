import { getSession } from '../services/sessionService';
import { getCurrentUserProfile } from '../services/userProfileService';

// Global state for company ID
let varCompanyId = 5; // Initialize with default company ID
let debugPanel = false; // Set to true to show debug panel by default
export let varPasswordOk = false;

export const setGlobalCompanyId = (id) => {
  varCompanyId = id || 5; // Ensure we always have a fallback value
};

export const setDebugPanel = (enabled) => {
  debugPanel = enabled;
};

export const isDebugEnabled = () => {
  return debugPanel;
};

export const getGlobalCompanyId = () => {
  return varCompanyId || 5; // Always return a valid ID
};

export const setVarPasswordOk = (value) => { varPasswordOk = value; };
export const getVarPasswordOk = () => varPasswordOk;

// Cache para company ID
let companyIdCache = {
  userId: null,
  companyId: null,
  timestamp: 0,
  ttl: 30 * 60 * 1000 // 30 minutos
};

// Initialize with DEFAULT_COMPANY_ID if in dev/qa
export const initializeCompanyId = async () => {
  try {
    const { data: { session } } = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      setGlobalCompanyId(5); // DEFAULT_COMPANY_ID value
      return;
    }
    
    // Verificar se temos um cache válido para este usuário
    const now = Date.now();
    if (
      companyIdCache.userId === userId && 
      companyIdCache.companyId && 
      now - companyIdCache.timestamp < companyIdCache.ttl
    ) {
      console.log('Usando company ID em cache:', companyIdCache.companyId);
      setGlobalCompanyId(companyIdCache.companyId);
      return;
    }

    // Se não tiver cache, buscar do backend
    const userProfile = await getCurrentUserProfile(userId);

    if (userProfile?.company_id) {
      // Atualizar cache e estado global
      companyIdCache = {
        userId,
        companyId: userProfile.company_id,
        timestamp: now,
        ttl: 30 * 60 * 1000
      };
      
      setGlobalCompanyId(userProfile.company_id);
      return;
    }

    // If no company_id found, use default
    setGlobalCompanyId(5); // DEFAULT_COMPANY_ID value
  } catch (error) {
    console.error('Error initializing company ID:', error);
    setGlobalCompanyId(5); // Fallback to DEFAULT_COMPANY_ID
  }
};

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
        return cls._instance
    
    def get_client(self) -> Client:
        if self._client is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise ValueError("Supabase URL and Service Key must be configured")
            
            self._client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            logger.info("Supabase client initialized successfully")
        
        return self._client

# Global instance
supabase_client = SupabaseClient()

def get_supabase() -> Client:
    """Get Supabase client instance"""
    return supabase_client.get_client()

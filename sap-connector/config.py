import os

from dotenv import load_dotenv

load_dotenv()

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
IS_PRODUCTION = ENVIRONMENT == "production"

# SAP Configuration
BASE_URL = os.getenv("SAP_BASE_URL", "")
OAUTH_URL = os.getenv("SAP_OAUTH_URL", "")
CLIENT_ID = os.getenv("SAP_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("SAP_CLIENT_SECRET", "")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sap_user:sap_password@postgres:5432/sap_connector")
SUPABASE_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL", "")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


def get_database_url():
    if IS_PRODUCTION and SUPABASE_DATABASE_URL:
        return SUPABASE_DATABASE_URL
    return DATABASE_URL


# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# Worker Configuration
WORKER_CUSTOMER_INTERVAL = int(os.getenv("WORKER_CUSTOMER_INTERVAL", "3600"))
WORKER_SALES_INTERVAL = int(os.getenv("WORKER_SALES_INTERVAL", "1800"))
WORKER_CREDIT_INTERVAL = int(os.getenv("WORKER_CREDIT_INTERVAL", "3600"))

# Database Pool Configuration
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "1800"))

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
LOG_DATE_FORMAT = os.getenv("LOG_DATE_FORMAT", "%Y-%m-%d %H:%M:%S")

if ENVIRONMENT == "local":
    print(f"Environment: {ENVIRONMENT}")
    print(f"Database URL: {DATABASE_URL[:50]}...")
    print(f"SAP Base URL: {BASE_URL[:50] if BASE_URL else 'Not configured'}...")
    print(f"Google OAuth: {'Configured' if GOOGLE_CLIENT_ID else 'Not configured'}")

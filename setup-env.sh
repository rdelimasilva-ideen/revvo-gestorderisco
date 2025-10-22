#!/bin/bash

# Script para criar arquivo .env com valores padrão

echo "Criando arquivo .env com valores padrão..."

cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=

# SAP Configuration
SAP_BASE_URL=
SAP_OAUTH_URL=
SAP_CLIENT_ID=
SAP_CLIENT_SECRET=

# Google OAuth Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production

# Database Configuration (para desenvolvimento local)
DATABASE_URL=postgresql://sap_user:sap_password@postgres:5432/sap_connector
EOF

echo "Arquivo .env criado com sucesso!"
echo "Agora você pode editar o arquivo .env com suas credenciais reais."
echo "Execute: docker-compose up --build"

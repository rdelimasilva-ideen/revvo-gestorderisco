# Variáveis de Ambiente Necessárias

Para rodar a aplicação localmente, você precisa configurar as seguintes variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto com os valores apropriados:

## Supabase Configuration
```bash
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```


## SAP Configuration
```bash
SAP_BASE_URL=your_sap_base_url_here
SAP_OAUTH_URL=your_sap_oauth_url_here
SAP_CLIENT_ID=your_sap_client_id_here
SAP_CLIENT_SECRET=your_sap_client_secret_here
```

## Google OAuth Configuration
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## JWT Configuration
```bash
JWT_SECRET_KEY=your_jwt_secret_key_here
```

## Database Configuration (para desenvolvimento local)
```bash
DATABASE_URL=postgresql://sap_user:sap_password@postgres:5432/sap_connector
```

## Como usar

### Opção 1: Script automático
```bash
# Execute o script para criar o arquivo .env automaticamente
./setup-env.sh

# Edite o arquivo .env com suas credenciais reais
nano .env

# Execute a aplicação
docker-compose up --build
```

### Opção 2: Manual
1. Copie este arquivo para `.env` na raiz do projeto
2. Preencha os valores com suas credenciais reais
3. Execute `docker-compose up --build` para iniciar a aplicação

### Opção 3: Sem arquivo .env
Se você não criar o arquivo `.env`, o Docker Compose usará os valores padrão definidos no `docker-compose.yml`. As variáveis de banco de dados já estão configuradas corretamente para funcionar com Docker.


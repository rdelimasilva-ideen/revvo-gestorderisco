# Gestor de Risco - Docker Compose

Este documento explica como executar a aplicação **Gestor de Risco** localmente usando Docker Compose.

## Arquitetura

A aplicação é composta por três serviços principais:

- **Frontend (revvo)**: Interface React com Vite, servida pelo Nginx
- **Backend (sap-connector)**: API FastAPI em Python
- **PostgreSQL**: Banco de dados principal

## Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose v2.0+
- Arquivo `.env` configurado (veja [ENV_VARIABLES.md](./ENV_VARIABLES.md))

## Início Rápido

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar o template de variáveis
cp ENV_VARIABLES.md .env

# Editar o arquivo .env com suas credenciais
nano .env
```

### 2. Iniciar a Aplicação

```bash
# Usar o script automatizado (recomendado)
./start-local.sh

# OU executar manualmente
docker-compose up --build
```

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar em background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reconstruir um serviço específico
docker-compose up --build backend
```

### Desenvolvimento

```bash
# Entrar no container do backend
docker-compose exec backend bash

# Entrar no container do frontend
docker-compose exec frontend sh

# Executar comandos no backend
docker-compose exec backend python -c "print('Hello from backend')"

# Executar migrações do banco
docker-compose exec backend alembic upgrade head
```

### Debugging

```bash
# Ver status dos serviços
docker-compose ps

# Ver logs de erro
docker-compose logs --tail=50 backend

# Verificar saúde dos serviços
docker-compose exec backend curl http://localhost:8000/health/live
```

## Estrutura dos Serviços

### Frontend (revvo)
- **Porta**: 3000 (mapeada para 80 no container)
- **Tecnologia**: React + Vite + Nginx
- **Proxy**: Redireciona `/api/*` para o backend
- **Build**: Multi-stage com Node.js e Nginx

### Backend (sap-connector)
- **Porta**: 8000
- **Tecnologia**: FastAPI + Python 3.11
- **Banco**: PostgreSQL
- **Health Check**: `/health/live`

### PostgreSQL
- **Porta**: 5432
- **Database**: `sap_connector`
- **Usuário**: `sap_user`
- **Senha**: `sap_password`

## Configuração do Nginx

O Nginx está configurado para:

1. Servir arquivos estáticos do React
2. Fazer proxy reverso para o backend:
   - `/api/*` → `http://gestor-risco-backend-service:80/`
   - `/backend/*` → `http://gestor-risco-backend-service:80/`

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   ```bash
   # Verificar se o PostgreSQL está rodando
   docker-compose ps postgres
   
   # Ver logs do banco
   docker-compose logs postgres
   ```

2. **Frontend não carrega**
   ```bash
   # Verificar se o build foi bem-sucedido
   docker-compose logs frontend
   
   # Reconstruir o frontend
   docker-compose up --build frontend
   ```

3. **Backend não responde**
   ```bash
   # Verificar logs do backend
   docker-compose logs backend
   
   # Verificar se as variáveis de ambiente estão corretas
   docker-compose exec backend env | grep SUPABASE
   ```

4. **Problemas de permissão**
   ```bash
   # Limpar volumes e reconstruir
   docker-compose down -v
   docker-compose up --build
   ```

### Logs Detalhados

```bash
# Ver todos os logs
docker-compose logs

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f backend
```

## Desenvolvimento

Para desenvolvimento ativo, você pode:

1. **Frontend**: Montar o código como volume para hot reload
2. **Backend**: Usar volumes para desenvolvimento sem rebuild
3. **Banco**: Usar volumes persistentes para manter dados

### Exemplo de desenvolvimento

```bash
# Modo desenvolvimento com volumes
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Produção

Para ambiente de produção, certifique-se de:

1. Configurar todas as variáveis de ambiente
2. Usar secrets do Docker
3. Configurar SSL/TLS
4. Usar um banco de dados gerenciado
5. Configurar monitoramento e logs

## Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação de cada serviço
3. Verifique as configurações de rede e portas
4. Confirme que todas as variáveis de ambiente estão configuradas


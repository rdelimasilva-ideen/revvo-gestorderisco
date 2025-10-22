# Makefile para Gestor de Risco

.PHONY: help build up down logs clean dev dev-down dev-logs

# Cores para output
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m # No Color

help: ## Mostra esta ajuda
	@echo "$(GREEN)Gestor de Risco - Comandos Disponíveis$(NC)"
	@echo "=============================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Constrói as imagens Docker
	@echo "$(GREEN)Construindo imagens...$(NC)"
	docker-compose build

up: ## Inicia a aplicação em modo produção
	@echo "$(GREEN)Iniciando aplicação...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Aplicação iniciada!$(NC)"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8000"

down: ## Para a aplicação
	@echo "$(YELLOW)Parando aplicação...$(NC)"
	docker-compose down

logs: ## Mostra os logs da aplicação
	docker-compose logs -f

clean: ## Remove containers, volumes e imagens
	@echo "$(RED)Limpando tudo...$(NC)"
	docker-compose down -v --rmi all

dev: ## Inicia em modo desenvolvimento
	@echo "$(GREEN)Iniciando em modo desenvolvimento...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Modo desenvolvimento ativo!$(NC)"
	@echo "🌐 Frontend: http://localhost:3000 (via Nginx proxy)"
	@echo "🔧 Backend: http://localhost:8000"
	@echo "🔄 Hot reload ativo"

dev-down: ## Para o modo desenvolvimento
	@echo "$(YELLOW)Parando modo desenvolvimento...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

dev-logs: ## Mostra logs do modo desenvolvimento
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

status: ## Mostra status dos containers
	docker-compose ps

restart: ## Reinicia a aplicação
	@echo "$(YELLOW)Reiniciando aplicação...$(NC)"
	docker-compose restart

restart-dev: ## Reinicia o modo desenvolvimento
	@echo "$(YELLOW)Reiniciando modo desenvolvimento...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart

shell-backend: ## Abre shell no container do backend
	docker-compose exec backend bash

shell-frontend: ## Abre shell no container do frontend
	docker-compose exec frontend sh

shell-db: ## Abre shell no banco de dados
	docker-compose exec postgres psql -U sap_user -d sap_connector

migrate: ## Executa migrações do banco
	docker-compose exec backend alembic upgrade head

migrate-dev: ## Executa migrações no modo desenvolvimento
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend alembic upgrade head

# Comandos de desenvolvimento específicos
install-deps: ## Instala dependências do frontend
	cd revvo && npm install

install-backend-deps: ## Instala dependências do backend
	cd sap-connector && pip install -r requirements.txt

# Comandos de teste
test: ## Executa testes (quando implementados)
	@echo "$(YELLOW)Testes não implementados ainda$(NC)"

# Comandos de backup
backup-db: ## Cria backup do banco de dados
	@echo "$(GREEN)Criando backup do banco...$(NC)"
	docker-compose exec postgres pg_dump -U sap_user sap_connector > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup criado!$(NC)"

# Comandos de monitoramento
monitor: ## Monitora recursos dos containers
	docker stats $(shell docker-compose ps -q)

# Comandos de debug
debug-backend: ## Debug do backend
	docker-compose logs backend | tail -50

debug-frontend: ## Debug do frontend
	docker-compose logs frontend | tail -50

debug-db: ## Debug do banco
	docker-compose logs postgres | tail -50


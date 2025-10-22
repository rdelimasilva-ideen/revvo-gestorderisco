#!/bin/bash

# Script para iniciar a aplicação localmente com Docker Compose

# Verificar argumentos
DEV_MODE=false
if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
    DEV_MODE=true
fi

if [ "$DEV_MODE" = true ]; then
    echo "🚀 Iniciando Gestor de Risco - Modo Desenvolvimento"
    echo "=================================================="
else
    echo "🚀 Iniciando Gestor de Risco - Ambiente Local"
    echo "=============================================="
fi

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado."
    echo "📝 Criando arquivo .env a partir do template..."
    cp ENV_VARIABLES.md .env
    echo "✅ Arquivo .env criado. Por favor, configure as variáveis de ambiente necessárias."
    echo "📖 Consulte o arquivo ENV_VARIABLES.md para mais detalhes."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Remover volumes antigos (opcional - descomente se necessário)
# echo "🗑️  Removendo volumes antigos..."
# docker-compose down -v

# Construir e iniciar os serviços
if [ "$DEV_MODE" = true ]; then
    echo "🔨 Construindo e iniciando serviços em modo desenvolvimento..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
else
    echo "🔨 Construindo e iniciando serviços..."
    docker-compose up --build -d
fi

# Aguardar os serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status dos serviços
echo "📊 Status dos serviços:"
docker-compose ps

echo ""
echo "✅ Aplicação iniciada com sucesso!"
echo ""

if [ "$DEV_MODE" = true ]; then
    echo "🌐 Frontend (Dev): http://localhost:5173"
    echo "🔧 Backend API: http://localhost:8000"
    echo "🗄️  PostgreSQL: localhost:5432"
    echo ""
    echo "📝 Para ver os logs: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
    echo "🛑 Para parar: docker-compose -f docker-compose.yml -f docker-compose.dev.yml down"
    echo ""
    echo "🔄 Modo desenvolvimento ativo - mudanças no código serão refletidas automaticamente"
else
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "🗄️  PostgreSQL: localhost:5432"
    echo ""
    echo "📝 Para ver os logs: docker-compose logs -f"
    echo "🛑 Para parar: docker-compose down"
fi

echo ""
echo "⚠️  Certifique-se de que as variáveis de ambiente no arquivo .env estão configuradas corretamente."
echo ""
echo "💡 Dica: Use './start-local.sh --dev' para modo desenvolvimento com hot reload"

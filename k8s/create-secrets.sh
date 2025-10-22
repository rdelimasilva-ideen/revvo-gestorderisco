#!/bin/bash

# =============================================================================
# SCRIPT PARA CRIAÇÃO DE SECRETS KUBERNETES
# GESTOR DE RISCO - DEPLOYMENT UNIFICADO
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Função para exibir ajuda
show_help() {
    cat << EOF
Uso: $0 [OPÇÕES]

OPÇÕES:
    -n, --namespace NAMESPACE    Namespace Kubernetes (padrão: ns-gestor-risco)
    -e, --environment ENV        Ambiente (develop, production)
    -f, --file FILE              Arquivo de configuração de secrets
    -d, --dry-run                Modo simulação (não executa comandos)
    -h, --help                   Exibe esta ajuda

EXEMPLOS:
    # Criar secrets para desenvolvimento
    $0 -e develop

    # Criar secrets para produção
    $0 -e production

    # Usar arquivo de configuração personalizado
    $0 -e develop -f secrets-dev.env

    # Modo simulação
    $0 -e develop -d

ARQUIVO DE CONFIGURAÇÃO (.env):
    O arquivo deve conter as seguintes variáveis para o backend:
    SAP_BASE_URL=value
    SAP_OAUTH_URL=value
    SAP_CLIENT_ID=value
    SAP_CLIENT_SECRET=value
    SUPABASE_URL=value
    SUPABASE_SERVICE_KEY=value
    SUPABASE_ANON_KEY=value
    JWT_SECRET_KEY=value
    ALLOWED_ORIGINS=value

EOF
}

# Variáveis padrão
NAMESPACE="ns-gestor-risco"
ENVIRONMENT=""
SECRETS_FILE=""
DRY_RUN=false

# Parse de argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--file)
            SECRETS_FILE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validações
if [[ -z "$ENVIRONMENT" ]]; then
    print_error "Ambiente deve ser especificado (-e ou --environment)"
    show_help
    exit 1
fi

if [[ "$ENVIRONMENT" != "develop" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Ambiente deve ser 'develop' ou 'production'"
    exit 1
fi

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl não está instalado ou não está no PATH"
    exit 1
fi

# Verificar se o namespace existe
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    print_warning "Namespace '$NAMESPACE' não existe. Criando..."
    if [[ "$DRY_RUN" == false ]]; then
        kubectl create namespace "$NAMESPACE"
    else
        echo "DRY-RUN: kubectl create namespace $NAMESPACE"
    fi
fi

# Função para criar secrets a partir de arquivo .env
create_secrets_from_file() {
    local env_file="$1"

    if [[ ! -f "$env_file" ]]; then
        print_error "Arquivo de secrets não encontrado: $env_file"
        exit 1
    fi

    print_message "Criando secrets a partir do arquivo: $env_file"

    # Verificar se o secret já existe
    if kubectl get secret "gestor-risco-backend-secrets" -n "$NAMESPACE" &> /dev/null; then
        print_warning "Secret 'gestor-risco-backend-secrets' já existe no namespace '$NAMESPACE'"
        read -p "Deseja sobrescrever? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "Operação cancelada"
            exit 0
        fi

        if [[ "$DRY_RUN" == false ]]; then
            kubectl delete secret "gestor-risco-backend-secrets" -n "$NAMESPACE"
        else
            echo "DRY-RUN: kubectl delete secret gestor-risco-backend-secrets -n $NAMESPACE"
        fi
    fi

    # Criar secret a partir do arquivo .env
    if [[ "$DRY_RUN" == false ]]; then
        kubectl create secret generic "gestor-risco-backend-secrets" \
            --from-env-file="$env_file" \
            -n "$NAMESPACE"
    else
        echo "DRY-RUN: kubectl create secret generic gestor-risco-backend-secrets --from-env-file=$env_file -n $NAMESPACE"
    fi

    print_message "Secret 'gestor-risco-backend-secrets' criado com sucesso no namespace '$NAMESPACE'"
}

# Função para criar secrets com valores padrão baseados no ambiente
create_default_secrets() {
    print_message "Criando secrets com valores padrão para ambiente: $ENVIRONMENT"

    # Verificar se o secret já existe
    if kubectl get secret "gestor-risco-backend-secrets" -n "$NAMESPACE" &> /dev/null; then
        print_warning "Secret 'gestor-risco-backend-secrets' já existe no namespace '$NAMESPACE'"
        read -p "Deseja sobrescrever? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "Operação cancelada"
            exit 0
        fi

        if [[ "$DRY_RUN" == false ]]; then
            kubectl delete secret "gestor-risco-backend-secrets" -n "$NAMESPACE"
        else
            echo "DRY-RUN: kubectl delete secret gestor-risco-backend-secrets -n $NAMESPACE"
        fi
    fi

    # Valores padrão baseados no ambiente
    if [[ "$ENVIRONMENT" == "develop" ]]; then
        SAP_BASE_URL="https://api.gestor-risco.revvobr.com.br"
        SAP_OAUTH_URL="https://gestor-risco.revvobr.com.br/oauth"
        SAP_CLIENT_ID="dev-client-id"
        SAP_CLIENT_SECRET="dev-client-secret"
        SUPABASE_URL="https://dev.supabase.com"
        SUPABASE_SERVICE_KEY="dev-service-key"
        SUPABASE_ANON_KEY="dev-anon-key"
        JWT_SECRET_KEY="dev-jwt-secret-key-change-in-production"
        ALLOWED_ORIGINS="https://gestor-risco.revvobr.com.br,https://api.gestor-risco.revvobr.com.br"
    else
        SAP_BASE_URL="https://api.gestor-risco.revvobr.com.br"
        SAP_OAUTH_URL="https://revvo.tech/oauth"
        SAP_CLIENT_ID="prod-client-id"
        SAP_CLIENT_SECRET="prod-client-secret"
        SUPABASE_URL="https://prod.supabase.com"
        SUPABASE_SERVICE_KEY="prod-service-key"
        SUPABASE_ANON_KEY="prod-anon-key"
        JWT_SECRET_KEY="prod-jwt-secret-key-change-in-production"
        ALLOWED_ORIGINS="https://revvo.tech,https://api.gestor-risco.revvobr.com.br"
    fi

    # Criar secret com valores padrão
    if [[ "$DRY_RUN" == false ]]; then
        kubectl create secret generic "gestor-risco-backend-secrets" \
            --from-literal="SAP_BASE_URL=$SAP_BASE_URL" \
            --from-literal="SAP_OAUTH_URL=$SAP_OAUTH_URL" \
            --from-literal="SAP_CLIENT_ID=$SAP_CLIENT_ID" \
            --from-literal="SAP_CLIENT_SECRET=$SAP_CLIENT_SECRET" \
            --from-literal="SUPABASE_URL=$SUPABASE_URL" \
            --from-literal="SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY" \
            --from-literal="SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" \
            --from-literal="JWT_SECRET_KEY=$JWT_SECRET_KEY" \
            --from-literal="ALLOWED_ORIGINS=$ALLOWED_ORIGINS" \
            -n "$NAMESPACE"
    else
        echo "DRY-RUN: kubectl create secret generic gestor-risco-backend-secrets \\"
        echo "    --from-literal=\"SAP_BASE_URL=$SAP_BASE_URL\" \\"
        echo "    --from-literal=\"SAP_OAUTH_URL=$SAP_OAUTH_URL\" \\"
        echo "    --from-literal=\"SAP_CLIENT_ID=$SAP_CLIENT_ID\" \\"
        echo "    --from-literal=\"SAP_CLIENT_SECRET=$SAP_CLIENT_SECRET\" \\"
        echo "    --from-literal=\"SUPABASE_URL=$SUPABASE_URL\" \\"
        echo "    --from-literal=\"SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY\" \\"
        echo "    --from-literal=\"SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY\" \\"
        echo "    --from-literal=\"JWT_SECRET_KEY=$JWT_SECRET_KEY\" \\"
        echo "    --from-literal=\"ALLOWED_ORIGINS=$ALLOWED_ORIGINS\" \\"
        echo "    -n $NAMESPACE"
    fi

    print_message "Secret 'gestor-risco-backend-secrets' criado com sucesso no namespace '$NAMESPACE'"
}

# Função para verificar secrets criados
verify_secrets() {
    print_message "Verificando secrets criados..."

    if [[ "$DRY_RUN" == false ]]; then
        kubectl get secret "gestor-risco-backend-secrets" -n "$NAMESPACE" -o yaml | grep -E "^(  [a-zA-Z_]+:|kind:|metadata:|apiVersion:)" | head -20
        echo
        print_message "Para ver todos os dados do secret:"
        echo "kubectl get secret gestor-risco-backend-secrets -n $NAMESPACE -o yaml"
    else
        echo "DRY-RUN: Verificação de secrets seria executada aqui"
    fi
}

# Função para criar arquivo de template de secrets
create_secrets_template() {
    local template_file="secrets-${ENVIRONMENT}.env.template"

    print_message "Criando arquivo de template: $template_file"

    cat > "$template_file" << EOF
# =============================================================================
# TEMPLATE DE SECRETS PARA AMBIENTE: $ENVIRONMENT
# =============================================================================
# Preencha os valores abaixo e renomeie o arquivo para secrets-${ENVIRONMENT}.env
# Execute: $0 -e $ENVIRONMENT -f secrets-${ENVIRONMENT}.env

SAP_BASE_URL=https://example.com/backend
SAP_OAUTH_URL=https://example.com/oauth
SAP_CLIENT_ID=your-sap-client-id
SAP_CLIENT_SECRET=your-sap-client-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET_KEY=your-jwt-secret-key
ALLOWED_ORIGINS=https://example.com
EOF

    print_message "Template criado: $template_file"
    print_message "Edite o arquivo com os valores corretos e execute novamente com -f $template_file"
}

# Main execution
main() {
    print_header "CRIAÇÃO DE SECRETS KUBERNETES"
    print_message "Ambiente: $ENVIRONMENT"
    print_message "Namespace: $NAMESPACE"

    if [[ "$DRY_RUN" == true ]]; then
        print_warning "MODO SIMULAÇÃO ATIVADO - Nenhum comando será executado"
    fi

    # Verificar se arquivo de secrets foi fornecido
    if [[ -n "$SECRETS_FILE" ]]; then
        create_secrets_from_file "$SECRETS_FILE"
    else
        print_warning "Nenhum arquivo de secrets fornecido. Usando valores padrão."
        print_warning "Para usar valores personalizados, crie um arquivo .env e use a opção -f"
        echo

        read -p "Deseja criar um arquivo de template? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_secrets_template
            exit 0
        fi

        create_default_secrets
    fi

    verify_secrets

    print_header "SECRETS CRIADOS COM SUCESSO"
    print_message "Para aplicar o deployment:"
    echo "./k8s/deploy.sh -e $ENVIRONMENT -n $NAMESPACE"
    echo
    print_message "Para verificar o deployment:"
    echo "kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=gestor-risco-backend"
    echo "kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=gestor-risco-frontend"
}

# Executar main
main "$@"

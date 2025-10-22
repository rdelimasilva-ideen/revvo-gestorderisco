# Gestor de Risco - Deployment Unificado

Este diretório contém os arquivos necessários para o deployment unificado da aplicação Gestor de Risco no Kubernetes.

## Arquivos

- `gestor-risco-deploy.yaml` - Arquivo principal de deployment (Frontend + Backend)
- `create-secrets.sh` - Script para criação de secrets

## Estrutura do Deployment

O deployment unificado inclui:

### Backend (Python/FastAPI)
- **Namespace**: `ns-gestor-risco`
- **Deployment**: `gestor-risco-backend`
- **Service**: `gestor-risco-backend-service` (ClusterIP)
- **Porta**: 8000 → 80
- **Health Checks**: `/health/live` e `/health/ready`

### Frontend (React/Vite)
- **Deployment**: `gestor-risco-frontend`
- **Service**: `gestor-risco-frontend-service` (NodePort)
- **Porta**: 80
- **Health Checks**: `/`

### Networking
- **Ingress**: `gestor-risco-ingress`
- **Domínio**: `gestor-risco.revvobr.com.br`
- **Backend Path**: `/backend`
- **Frontend Path**: `/`
- **SSL**: Gerenciado via ManagedCertificate

## Uso

### 1. Criar Secrets

```bash
# Para desenvolvimento
./k8s/create-secrets.sh -e develop

# Para produção
./k8s/create-secrets.sh -e production

# Com arquivo personalizado
./k8s/create-secrets.sh -e develop -f secrets-dev.env
```

### 2. Deploy da Aplicação

O deploy é feito automaticamente via GitHub Actions quando há push para as branches `main` ou `develop`.

Para deploy manual:

```bash
# Substituir variáveis e aplicar
sed "s/\${ARTIFACT_REGISTRY}/southamerica-east1-docker.pkg.dev\/ideen-revvo-hml-01\//g; s/\${IMAGE_TAG}/latest/g" k8s/gestor-risco-deploy.yaml | kubectl apply -f -

# Ou para produção
sed "s/\${ARTIFACT_REGISTRY}/southamerica-east1-docker.pkg.dev\/ideen-revvo-prod-01\//g; s/\${IMAGE_TAG}/latest/g" k8s/gestor-risco-deploy.yaml | kubectl apply -f -
```

### 3. Verificação

```bash
# Verificar pods
kubectl get pods -n ns-gestor-risco

# Verificar services
kubectl get services -n ns-gestor-risco

# Verificar ingress
kubectl get ingress -n ns-gestor-risco

# Verificar logs
kubectl logs -n ns-gestor-risco -l app.kubernetes.io/name=gestor-risco-backend
kubectl logs -n ns-gestor-risco -l app.kubernetes.io/name=gestor-risco-frontend
```

## Configuração

### Variáveis de Ambiente

O deployment usa as seguintes variáveis:

#### Backend (ConfigMap)
- `LOG_LEVEL`: Nível de log (INFO)
- `PYTHON_ENV`: Ambiente Python (development/production)
- `DB_HOST`: Host do banco de dados
- `DB_PORT`: Porta do banco de dados
- `DB_NAME`: Nome do banco de dados
- `REDIS_HOST`: Host do Redis
- `REDIS_PORT`: Porta do Redis

#### Frontend (ConfigMap)
- `VITE_SAP_CONNECTOR_URL`: URL do backend SAP
- `VITE_API_URL`: URL da API

#### Backend (Secrets)
- `SAP_BASE_URL`: URL base do SAP
- `SAP_OAUTH_URL`: URL de OAuth do SAP
- `SAP_CLIENT_ID`: ID do cliente SAP
- `SAP_CLIENT_SECRET`: Secret do cliente SAP
- `SUPABASE_URL`: URL do Supabase
- `SUPABASE_SERVICE_KEY`: Chave de serviço do Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `JWT_SECRET_KEY`: Chave secreta JWT
- `ALLOWED_ORIGINS`: Origens permitidas para CORS

### Recursos

#### Backend
- **Requests**: 128Mi RAM, 250m CPU
- **Limits**: 512Mi RAM, 500m CPU

#### Frontend
- **Requests**: 128Mi RAM, 100m CPU
- **Limits**: 256Mi RAM, 200m CPU

### Node Affinity

O deployment está configurado para preferir instâncias spot do GKE para redução de custos.

## Ambientes

### Desenvolvimento
- **Namespace**: `ns-gestor-risco`
- **Domínio**: `gestor-risco.revvobr.com.br`
- **Registry**: `southamerica-east1-docker.pkg.dev/ideen-revvo-hml-01/`
- **Replicas**: 1 (Backend e Frontend)

### Produção
- **Namespace**: `ns-gestor-risco`
- **Domínio**: `revvo.tech`
- **Registry**: `southamerica-east1-docker.pkg.dev/ideen-revvo-prod-01/`
- **Replicas**: 3 (Backend e Frontend)

## Troubleshooting

### Problemas Comuns

1. **Pod não inicia**
   ```bash
   kubectl describe pod <pod-name> -n ns-gestor-risco
   kubectl logs <pod-name> -n ns-gestor-risco
   ```

2. **Secret não encontrado**
   ```bash
   kubectl get secrets -n ns-gestor-risco
   ./k8s/create-secrets.sh -e develop
   ```

3. **Ingress não funciona**
   ```bash
   kubectl describe ingress gestor-risco-ingress -n ns-gestor-risco
   kubectl get managedcertificate -n ns-gestor-risco
   ```

4. **Health checks falhando**
   ```bash
   kubectl get pods -n ns-gestor-risco
   kubectl logs <pod-name> -n ns-gestor-risco
   ```

### Comandos Úteis

```bash
# Reiniciar deployment
kubectl rollout restart deployment/gestor-risco-backend -n ns-gestor-risco
kubectl rollout restart deployment/gestor-risco-frontend -n ns-gestor-risco

# Verificar status do rollout
kubectl rollout status deployment/gestor-risco-backend -n ns-gestor-risco
kubectl rollout status deployment/gestor-risco-frontend -n ns-gestor-risco

# Escalar deployment
kubectl scale deployment/gestor-risco-backend --replicas=3 -n ns-gestor-risco

# Port forward para teste local
kubectl port-forward service/gestor-risco-backend-service 8000:80 -n ns-gestor-risco
kubectl port-forward service/gestor-risco-frontend-service 3000:80 -n ns-gestor-risco
```

## Segurança

- **ServiceAccounts**: Configurados com Workload Identity para acesso ao GCP
- **Security Context**: Containers executam como usuário não-root
- **Secrets**: Valores sensíveis armazenados em secrets do Kubernetes
- **SSL/TLS**: Certificados gerenciados pelo GKE

## Monitoramento

- **Health Checks**: Liveness e readiness probes configurados
- **Pod Disruption Budget**: Configurado para manter disponibilidade
- **Prometheus**: Anotações configuradas (monitoring opcional)

## Limpeza

Para remover o deployment:

```bash
kubectl delete -f k8s/gestor-risco-deploy.yaml
kubectl delete namespace ns-gestor-risco
```

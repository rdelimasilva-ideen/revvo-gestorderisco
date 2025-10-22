# SAP Connector

Servidor FastAPI modular para conectar com APIs SAP usando autenticação OAuth e Google OAuth2.

## Estrutura do Projeto

```
sap-connector/
├── server.py          # Aplicação principal FastAPI
├── config.py          # Configurações e variáveis de ambiente
├── auth.py            # Autenticação JWT e Google OAuth
├── sap_client.py      # Cliente para conexão com SAP
├── routes.py          # Todas as rotas da aplicação
├── requirements.txt   # Dependências do projeto
├── model/             # Modelos Pydantic
│   ├── __init__.py    # Inicialização do módulo
│   ├── invoice.py     # Modelos de Invoice
│   └── example_usage.py # Exemplo de uso dos modelos
└── README.md         # Documentação
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# SAP Base URL for API endpoints
SAP_BASE_URL=https://cerc-financeintegrator-1ciub5oj.it-cpi008-rt.cfapps.br10.hana.ondemand.com/http

# SAP OAuth URL for authentication
SAP_OAUTH_URL=https://cerc-financeintegrator-1ciub5oj.authentication.br10.hana.ondemand.com/oauth/token

# SAP Client ID for authentication
SAP_CLIENT_ID=sb-79dce5bd-990a-4fa3-b579-94e05e47dc3a!b8564|it-rt-cerc-financeintegrator-1ciub5oj!b106

# SAP Client Secret for authentication
SAP_CLIENT_SECRET=70b3e70c-e17b-485f-a238-0632c3459e79$1udPFTt3U92bvg1mQjppghIh9fB1aVGIcyR58bWwjgw=

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
```

### Instalação

```bash
pip install -r requirements.txt
```

### Execução

```bash
python server.py
```

O servidor será executado em `http://localhost:3001`

## Autenticação

### Interface Web
Acesse `http://localhost:3001/login` para acessar a tela de login com:
- Login tradicional (email/senha)
- Login com Google OAuth2

### Credenciais Padrão
- **Email**: `admin@example.com`
- **Senha**: `admin`

### Configuração do Google OAuth2

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+
4. Vá para "Credenciais" e crie uma nova credencial OAuth 2.0
5. Configure as URLs autorizadas:
   - **URI de redirecionamento autorizado**: `http://localhost:3001/auth/google/callback`
6. Copie o Client ID e Client Secret para o arquivo `.env`

## Endpoints de Autenticação

- `GET /login` - Página de login
- `POST /auth/login` - Login tradicional
- `GET /auth/google` - Iniciar login Google
- `GET /auth/google/callback` - Callback do Google OAuth
- `GET /dashboard` - Dashboard protegido
- `GET /logout` - Logout

## Modelos Pydantic

### Invoice Models

O projeto inclui modelos Pydantic para validação de dados de faturas:

#### InvoiceListRequest
Modelo para requisições de lista de faturas:
```python
class InvoiceListRequest(BaseModel):
    vendor: str          # Código do fornecedor
    date: str           # Data de referência
    company_code: str   # Código da empresa
```

#### Invoice
Modelo para representar uma fatura individual:
```python
class Invoice(BaseModel):
    parcela: str        # Número da parcela
    fatura: str         # Número da fatura
    data_vencimento: date    # Data de vencimento
    data_faturamento: date   # Data de faturamento
    valor: float        # Valor da fatura
```

#### InvoiceResponse
Modelo para respostas de listagem de faturas:
```python
class InvoiceResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    invoices: Optional[list[Invoice]] = None
    total_count: Optional[int] = None
```

### Exemplo de Uso

```python
from model.invoice import Invoice, InvoiceListRequest, InvoiceResponse

# Criar uma requisição
request = InvoiceListRequest(
    vendor="VENDOR001",
    date="2024-01-15",
    company_code="1000"
)

# Criar uma fatura
invoice = Invoice(
    parcela="001",
    fatura="FAT001",
    data_vencimento=date(2024, 1, 15),
    data_faturamento=date(2024, 1, 1),
    valor=1000.00
)
```

## Endpoints SAP (Protegidos)

Todos os endpoints SAP agora requerem autenticação:

- `POST /cpi/ZBAPI_AR_ACC_GETOPENITEMS_V2`
- `POST /cpi/ZBAPI_WEBINVOICE_GETLIST2`
- `POST /cpi/ZBAPI_AR_ACC_GETOPENITEMS`
- `POST /cpi/ZFIN_AP_AR_GET_BANK`
- `POST /cpi/ZDETALHES_FATURA`
- `POST /cpi/ZFATURA_PARC2`
- `POST /cpi/ZBAPI_AP_ACC_GETOPENITEMS`
- `POST /cpi/ZCHANGEDOCU_CDPOS_READ_V2`
- `POST /cpi/ZBAPI_BUPA_TAX_PAR_GET_DETAIL`
- `POST /cpi/ZCADASTRA_DADOS_BANC`
- `POST /cpi/ZVENDOR_UPDATE`
- `POST /cpi/ZFI_DOCUMENT_CHANGE`
- `POST /cpi/BBP_VENDOR_GETLIST`
- `POST /cpi/ZGET_VENDOR_DETAILS`
- `POST /cpi/FIN_AP_AR_GET_BANK`
- `POST /cpi/BAPI_VENDOR_CREATE`
- `POST /cpi/ZBAPI_AR_ACC_GETOPENITEMS2`
- `POST /cpi/ZFI_F4_ZTERM`
- `POST /cpi/BAPI_CUSTOMER_GETLIST`
- `POST /cpi/BAPI_SALESORDER_GETLIST`
- `POST /cpi/BAPI_WEBINVOICE_GETLIST`
- `POST /cpi/BAPI_WEBINVOICE_GETDETAIL`
- `POST /cpi/ZUKM_DB_UKMBP_CMS_EXECUTE`
- `POST /cpi/ZUKM_DB_UKMBP_CMS_SGM_READ`
- `GET /token` - Obter token de acesso SAP

### Novos Endpoints com Modelos

- `POST /backend/invoice/list` - Lista faturas usando modelos Pydantic

## Autenticação SAP

O sistema usa dois métodos de autenticação para conectar com o SAP:

1. **Bearer Token** - Para endpoints que requerem autenticação OAuth
2. **Basic Auth** - Para endpoints que usam autenticação básica

O token é automaticamente gerenciado e renovado quando necessário.

## Segurança

- Todos os endpoints SAP agora requerem autenticação JWT
- Tokens expiram em 30 minutos
- Suporte a login tradicional e Google OAuth2
- Cookies seguros para armazenamento de tokens

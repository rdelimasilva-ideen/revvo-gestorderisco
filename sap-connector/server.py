import logging
import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from config import LOG_LEVEL, LOG_FORMAT, LOG_DATE_FORMAT
from metrics import get_metrics, get_metrics_content_type
from src.routes.data_routes import router as data_router
from src.routes.sap_routes import router as sap_router
from src.routes.user_role_routes import router as user_role_router
from src.routes.notification_routes import router as notification_router
from src.routes.storage_routes import router as storage_router
from src.routes.company_routes import router as company_router
from src.routes.user_profile_routes import router as user_profile_router
from src.routes.workflow_routes import router as workflow_router
from src.routes.credit_limit_routes import router as credit_limit_router
from src.routes.business_analysis_routes import router as business_analysis_router
from src.routes.workflow_rule_routes import router as workflow_rule_router
from src.routes.customer_routes import router as customer_router
from src.routes.workflow_history_routes import router as workflow_history_router
from src.routes.score_routes import router as score_router
from src.routes.sales_routes import router as sales_router
from src.routes.risk_routes import router as risk_router
from src.routes.lookup_routes import router as lookup_router
from src.routes.order_routes import router as order_router
from src.routes.sap_data_routes import router as sap_data_router
from src.routes.invoice_routes import router as invoice_router
from src.routes.auth_routes import router as auth_router
from src.routes.invite_user_routes import router as invite_user_router

# Configure logging - Formato estruturado para melhor compatibilidade
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format=LOG_FORMAT,
    datefmt=LOG_DATE_FORMAT
)

# Desabilitar logs verbosos do httpx (Supabase requests)
logging.getLogger("httpx").setLevel(logging.WARNING)

# Desabilitar logs verbosos do urllib3
logging.getLogger("urllib3").setLevel(logging.WARNING)

# Manter apenas logs importantes do uvicorn
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn").setLevel(logging.INFO)

app = FastAPI(
    title="Gestor de Risco API",
    description="API para gerenciamento de risco de crédito e integração com SAP",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Authentication", "description": "Endpoints de autenticação"},
        {"name": "SAP", "description": "Endpoints de integração com SAP"},
        {"name": "Data", "description": "Endpoints de dados"},
        {"name": "User Roles", "description": "Gerenciamento de roles de usuário"},
        {"name": "Notifications", "description": "Sistema de notificações"},
        {"name": "Storage", "description": "Gerenciamento de arquivos"},
        {"name": "Company", "description": "Gerenciamento de empresas"},
        {"name": "User Profile", "description": "Perfis de usuário"},
        {"name": "Workflow", "description": "Fluxos de trabalho"},
        {"name": "Credit Limit", "description": "Limites de crédito"},
        {"name": "Business Analysis", "description": "Análise de negócios"},
        {"name": "Workflow Rules", "description": "Regras de workflow"},
        {"name": "Customer", "description": "Gerenciamento de clientes"},
        {"name": "Score", "description": "Sistema de pontuação"},
        {"name": "Sales", "description": "Vendas"},
        {"name": "Risk", "description": "Análise de risco"},
        {"name": "Lookup", "description": "Consultas de referência"},
        {"name": "Orders", "description": "Pedidos"},
        {"name": "SAP Data", "description": "Dados do SAP"},
        {"name": "Invoice", "description": "Faturas"},
        {"name": "Invite User", "description": "Convites de usuário"},
        {"name": "Workflow History", "description": "Histórico de workflow"},
    ]
)

# Get CORS origins from environment variable
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug middleware to inspect requests
from fastapi import Request
import json

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Gestor de Risco API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json"
    }

# Health check endpoints (without / prefix for Kubernetes)
@app.get("/health/live")
async def liveness_probe():
    """Liveness probe for Kubernetes"""
    return JSONResponse(content={"status": "alive"}, status_code=200)


@app.get("/health/ready")
async def readiness_probe():
    """Readiness probe for Kubernetes"""
    return JSONResponse(content={"status": "ready"}, status_code=200)


@app.get("/health/internal")
async def internal_health_check():
    """Internal health check (no public access)"""
    return JSONResponse(
        content={"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"},
        status_code=200,
    )


# Prometheus metrics endpoint
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=get_metrics(), media_type=get_metrics_content_type())

# Include all routes with / prefix for Kubernetes deployment
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(sap_router, prefix="", tags=["SAP"])
app.include_router(data_router, prefix="", tags=["Data"])
app.include_router(user_role_router, prefix="", tags=["User Roles"])
app.include_router(notification_router, prefix="", tags=["Notifications"])
app.include_router(storage_router, prefix="", tags=["Storage"])
app.include_router(company_router, prefix="", tags=["Company"])
app.include_router(user_profile_router, prefix="", tags=["User Profile"])
app.include_router(workflow_router, prefix="", tags=["Workflow"])
app.include_router(credit_limit_router, prefix="", tags=["Credit Limit"])
app.include_router(business_analysis_router, prefix="", tags=["Business Analysis"])
app.include_router(workflow_rule_router, prefix="", tags=["Workflow Rules"])
app.include_router(customer_router, prefix="", tags=["Customer"])
app.include_router(score_router, prefix="/score", tags=["Score"])
app.include_router(sales_router, prefix="/sales", tags=["Sales"])
app.include_router(risk_router, prefix="/risk", tags=["Risk"])
app.include_router(lookup_router, prefix="", tags=["Lookup"])
app.include_router(order_router, prefix="", tags=["Orders"])
app.include_router(sap_data_router, prefix="", tags=["SAP Data"])
app.include_router(invoice_router, prefix="", tags=["Invoice"])
app.include_router(invite_user_router, prefix="", tags=["Invite User"])
app.include_router(workflow_history_router, prefix="", tags=["Workflow History"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

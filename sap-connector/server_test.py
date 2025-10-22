import logging
import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format="%(levelname)s: %(message)s"
)

app = FastAPI(
    title="Gestor de Risco API - Test",
    description="API para gerenciamento de risco de crédito e integração com SAP",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
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

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Gestor de Risco API - Test",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json"
    }

# Health check endpoints
@app.get("/health/live")
async def liveness_probe():
    """Liveness probe for Kubernetes"""
    return JSONResponse(content={"status": "alive"}, status_code=200)

@app.get("/health/ready")
async def readiness_probe():
    """Readiness probe for Kubernetes"""
    return JSONResponse(content={"status": "ready"}, status_code=200)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

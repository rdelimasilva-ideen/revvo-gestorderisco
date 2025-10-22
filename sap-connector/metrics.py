import time
from functools import wraps
from typing import Callable

from fastapi import Request
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

# Métricas para tempo de requisição das rotas
REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint", "status"],
)

# Métricas para contadores de requisições
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"],
)

# Métricas específicas do SAP
SAP_TOKEN_RENEW_COUNT = Counter("sap_connector_token_renew", "Number of times SAP token was renewed")

SAP_REQUESTS_COUNT = Counter(
    "sap_connector_requests",
    "Number of SAP requests with success/failure status",
    ["endpoint", "status", "auth_method"],
)


def get_metrics():
    """Retorna as métricas no formato do Prometheus"""
    return generate_latest()


def get_metrics_content_type():
    """Retorna o content type para as métricas"""
    return CONTENT_TYPE_LATEST


def monitor_request_duration():
    """Middleware para monitorar duração das requisições"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                # Extrair informações da requisição
                request = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

                method = request.method if request else "UNKNOWN"
                endpoint = request.url.path if request else "UNKNOWN"

                # Executar a função
                response = await func(*args, **kwargs)

                # Calcular duração
                duration = time.time() - start_time

                # Registrar métricas
                status = getattr(response, "status_code", 200)
                REQUEST_DURATION.labels(method=method, endpoint=endpoint, status=status).observe(duration)
                REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()

                return response

            except Exception as e:
                # Em caso de erro, registrar com status 500
                duration = time.time() - start_time
                method = "UNKNOWN"
                endpoint = "UNKNOWN"

                REQUEST_DURATION.labels(method=method, endpoint=endpoint, status=500).observe(duration)
                REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=500).inc()

                raise e

        return wrapper

    return decorator


def increment_sap_token_renew():
    """Incrementa o contador de renovação de token do SAP"""
    SAP_TOKEN_RENEW_COUNT.inc()


def increment_sap_request(endpoint: str, status: str, auth_method: str):
    """Incrementa o contador de requisições do SAP"""
    SAP_REQUESTS_COUNT.labels(endpoint=endpoint, status=status, auth_method=auth_method).inc()

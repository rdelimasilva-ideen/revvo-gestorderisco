import logging
from datetime import datetime, timedelta

import httpx
from config import BASE_URL, CLIENT_ID, CLIENT_SECRET, LOG_LEVEL, OAUTH_URL
from fastapi import HTTPException
from metrics import increment_sap_request, increment_sap_token_renew

cached_token = None
token_expiration = None

logging.basicConfig(level=getattr(logging, LOG_LEVEL))
logger = logging.getLogger(__name__)


async def get_token():
    global cached_token, token_expiration

    now = datetime.now()
    if cached_token and token_expiration and now < token_expiration:
        return cached_token

    # Incrementa o contador de renovação de token
    increment_sap_token_renew()

    try:
        data = {
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                OAUTH_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code != 200:
                increment_sap_request("token_renew", "failure", "oauth")
                raise HTTPException(
                    status_code=500,
                    detail=f"Unable to authenticate. Status: {response.status_code}, Response: {response.text}",
                )

            token_data = response.json()
            cached_token = token_data["access_token"]
            token_expiration = now + timedelta(seconds=token_data["expires_in"] - 60)

            increment_sap_request("token_renew", "success", "oauth")
            return cached_token

    except Exception as e:
        increment_sap_request("token_renew", "failure", "oauth")
        raise HTTPException(status_code=500, detail=f"Unable to authenticate: {str(e)}")


async def call_sap(endpoint: str, request_data: dict):
    """
    Tenta com headers específicos do SAP CPI
    """
    try:
        token = await get_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": "Fetch",  # Header específico do SAP
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }

        async with httpx.AsyncClient() as client:
            # Primeiro faz uma requisição GET para obter o CSRF token
            init_response = await client.get(f"{BASE_URL}/{endpoint}", headers=headers)

            # Extrai o CSRF token se disponível
            csrf_token = init_response.headers.get("x-csrf-token", "")
            if csrf_token:
                headers["X-CSRF-Token"] = csrf_token

            # Agora faz a requisição POST com o CSRF token
            response = await client.post(f"{BASE_URL}/{endpoint}", headers=headers, json=request_data, timeout=90)
            logger.info(f"Calling SAP endpoint: {endpoint}")
            logger.info(f"Request data: {request_data}")
            logger.info(f"Response status code: {response.status_code}")
            logger.info(f"Response headers: {response.headers}")
            logger.info(f"Response text: {response.text[:200]}")

            if response.status_code == 403:
                increment_sap_request(endpoint, "failure", "sap_headers")
                raise HTTPException(
                    status_code=403,
                    detail=f"403 Forbidden - Check permissions for {endpoint}. Response: {response.text}",
                )

            if response.status_code != 200:
                increment_sap_request(endpoint, "failure", "sap_headers")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error {endpoint}: {response.text}",
                )

            if not response.text.strip():
                increment_sap_request(endpoint, "failure", "sap_headers")
                raise HTTPException(status_code=500, detail=f"Error {endpoint}: Empty response from SAP")

            try:
                result = response.json()
                increment_sap_request(endpoint, "success", "sap_headers")
                return result
            except Exception:
                increment_sap_request(endpoint, "failure", "sap_headers")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error {endpoint}: Invalid JSON response - {response.text[:200]}",
                )

    except HTTPException:
        raise
    except Exception as e:
        increment_sap_request(endpoint, "failure", "sap_headers")
        raise HTTPException(status_code=500, detail=f"Error {endpoint}: {str(e)}")

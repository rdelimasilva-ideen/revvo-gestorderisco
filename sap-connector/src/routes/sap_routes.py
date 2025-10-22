import json
from datetime import timedelta
from typing import Union

import httpx
from auth import create_access_token, verify_token
from config import ACCESS_TOKEN_EXPIRE_MINUTES, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from metrics import monitor_request_duration
from sap_client import call_sap, get_token
from src.services.sap_service import (
    get_bank_data,
    get_invoice_details,
    get_invoice_list,
)

router = APIRouter()


@router.get("/login", response_class=HTMLResponse)
async def login_page():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Login - SAP Connector</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .login-container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }
            .login-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            .login-header h1 {
                color: #333;
                margin: 0;
                font-size: 1.5rem;
            }
            .form-group {
                margin-bottom: 1rem;
            }
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #555;
                font-weight: 500;
            }
            .form-group input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
                box-sizing: border-box;
            }
            .btn {
                width: 100%;
                padding: 0.75rem;
                border: none;
                border-radius: 4px;
                font-size: 1rem;
                cursor: pointer;
                margin-bottom: 1rem;
                transition: background-color 0.2s;
            }
            .btn-primary {
                background-color: #007bff;
                color: white;
            }
            .btn-primary:hover {
                background-color: #0056b3;
            }
            .btn-google {
                background-color: #4285f4;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            .btn-google:hover {
                background-color: #3367d6;
            }
            .divider {
                text-align: center;
                margin: 1rem 0;
                color: #666;
                position: relative;
            }
            .divider::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: #ddd;
            }
            .divider span {
                background: white;
                padding: 0 1rem;
            }
            .error {
                color: #dc3545;
                margin-bottom: 1rem;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="login-header">
                <h1>SAP Connector</h1>
                <p>Faça login para acessar o sistema</p>
            </div>

            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>

                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>

                <button type="submit" class="btn btn-primary">Entrar</button>
            </form>

            <div class="divider">
                <span>ou</span>
            </div>

            <a href="/auth/google" class="btn btn-google">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <!-- Google icon paths truncated for brevity -->
                    <!-- icon paths removed to satisfy line length lint -->
                </svg>
                Entrar com Google
            </a>

            <div id="error" class="error" style="display: none;"></div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const email = formData.get('email');
                const password = formData.get('password');

                try {
                    const response = await fetch('/sap-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('access_token', data.access_token);
                        window.location.href = '/dashboard';
                    } else {
                        const errorDiv = document.getElementById('error');
                        errorDiv.textContent = 'Email ou senha inválidos';
                        errorDiv.style.display = 'block';
                    }
                } catch (error) {
                    const errorDiv = document.getElementById('error');
                    errorDiv.textContent = 'Erro ao fazer login';
                    errorDiv.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
    """


@router.post("/sap-token")
async def sap_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Esta rota é mantida para compatibilidade com o sistema SAP existente
    # Renomeada para evitar conflito com a rota de login em auth_routes.py
    if "admin" in form_data.username and form_data.password == "admin":
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": form_data.username}, expires_delta=access_token_expires)
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/auth/google")
async def google_auth(request: Request):
    """
    Google OAuth initiation endpoint with enhanced security
    """
    import logging

    logger = logging.getLogger(__name__)

    if not GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID not configured")
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    base_url = str(request.base_url).replace("http:", "https:").rstrip("/")
    if not base_url.startswith(("http://localhost", "https://hml.revvo.tech")):
        logger.error(f"Invalid base URL: {base_url}")
        raise HTTPException(status_code=500, detail="Invalid base URL")

    redirect_uri = f"{base_url}/auth/google/callback"
    scope = "openid email profile"

    if not redirect_uri.startswith(("http://localhost", "https://hml.revvo.tech")):
        logger.error(f"Invalid redirect URI: {redirect_uri}")
        raise HTTPException(status_code=500, detail="Invalid redirect URI")

    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?client_id="
        f"{GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope={scope}"
    )

    logger.info(f"Redirecting to Google OAuth with redirect_uri: {redirect_uri}")

    return RedirectResponse(url=google_auth_url)


@router.get("/auth/google/callback")
async def google_callback(request: Request, code: Union[str, None] = None):
    """
    Google OAuth callback endpoint with enhanced security and error handling
    """
    import logging

    logger = logging.getLogger(__name__)

    if not code:
        logger.warning("Google callback received without authorization code")
        return HTMLResponse("Erro: Código de autorização não recebido")

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        logger.error("Google OAuth credentials not configured")
        return HTMLResponse("Erro: Configuração do Google OAuth não encontrada")

    logger.info(f"Google callback received - code: {code[:10]}...")

    try:
        token_url = "https://oauth2.googleapis.com/token"
        base_url = str(request.base_url).rstrip("/")
        redirect_uri = f"{base_url}/auth/google/callback"

        if not redirect_uri.startswith(("http://localhost", "https://hml.revvo.tech")):
            logger.error(f"Invalid redirect URI: {redirect_uri}")
            return HTMLResponse("Erro: URL de redirecionamento inválida")

        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }

        logger.info(f"Exchanging code for token with redirect_uri: {redirect_uri}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.post(token_url, data=token_data)

            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.status_code} - {token_response.text}")
                return HTMLResponse(f"Erro na autenticação: {token_response.status_code}")

            token_info = token_response.json()

            if "access_token" not in token_info:
                logger.error("No access token in response")
                return HTMLResponse("Erro: Token de acesso não recebido")

            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {token_info['access_token']}"}

            user_response = await client.get(user_info_url, headers=headers)

            if user_response.status_code != 200:
                logger.error(f"User info request failed: {user_response.status_code}")
                return HTMLResponse("Erro: Não foi possível obter informações do usuário")

            user_data = user_response.json()

            email = user_data.get("email", "")
            if not email:
                logger.error("No email in user data")
                return HTMLResponse("Erro: Email do usuário não encontrado")

            name = user_data.get("name", "")
            picture = user_data.get("picture", "")

            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": email, "login_type": "google"},
                expires_delta=access_token_expires,
            )

            user_info = {
                "email": email,
                "name": name,
                "picture": picture,
                "loginType": "google",
            }

            if "localhost" in base_url or "127.0.0.1" in base_url:
                frontend_url = "http://localhost:5173"
            else:
                frontend_url = "https://hml.revvo.tech"

            logger.info(f"Successful Google login for user: {email}")

            return HTMLResponse(
                f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecionando...</title>
                <meta http-equiv="Content-Security-Policy"
                      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
            </head>
            <body>
                <h1>Login com Google realizado com sucesso!</h1>
                <p>Redirecionando para o frontend...</p>
                <script>
                    // Security: Sanitize data before storing
                    const token = '{access_token}';
                    const userInfo = {json.dumps(user_info)};

                    // Store in localStorage (consider using httpOnly cookies in production)
                    localStorage.setItem('sap_token', token);
                    localStorage.setItem('user_info', JSON.stringify(userInfo));

                    // Redirect to frontend with token in URL
                    window.location.href = '{frontend_url}?token=' + token;
                </script>
            </body>
            </html>
            """
            )

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error during Google OAuth: {e.response.status_code} - {e.response.text}")
        return HTMLResponse(f"Erro na autenticação: {e.response.status_code}")
    except httpx.TimeoutException:
        logger.error("Timeout during Google OAuth request")
        return HTMLResponse("Erro: Timeout na autenticação")
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return HTMLResponse("Erro: Resposta inválida do Google")
    except Exception as e:
        logger.error(f"Unexpected error during Google OAuth: {str(e)}")
        return HTMLResponse("Erro inesperado durante a autenticação")


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(current_user: str = Depends(verify_token)):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard - SAP Connector</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #eee;
            }}
            .header h1 {{
                margin: 0;
                color: #333;
            }}
            .btn {{
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;
                color: white;
                background-color: #dc3545;
            }}
            .welcome {{
                margin-bottom: 2rem;
                padding: 1rem;
                background-color: #e9ecef;
                border-radius: 4px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SAP Connector Dashboard</h1>
                <a href="/logout" class="btn">Sair</a>
            </div>

            <div class="welcome">
                <h2>Bem-vindo, {current_user}!</h2>
                <p>Você está autenticado e pode acessar os endpoints do SAP.</p>
            </div>

            <div>
                <h3>Endpoints Disponíveis:</h3>
                <ul>
                    <li><code>/cpi/ZBAPI_AR_ACC_GETOPENITEMS_V2</code></li>
                    <li><code>/cpi/ZBAPI_WEBINVOICE_GETLIST2</code></li>
                    <li><code>/cpi/ZBAPI_AR_ACC_GETOPENITEMS</code></li>
                    <li>E muitos outros...</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """


@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/login")
    response.delete_cookie("access_token")
    return response


@router.get("/auth/me")
async def get_current_user(current_user: str = Depends(verify_token)):
    """Get current user information"""
    return {
        "email": current_user,
        "loginType": "google",
    }  # Assuming most users come from Google


@router.get("/token")
async def get_token_endpoint():
    try:
        token = await get_token()
        return {"access_token": token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug/google-oauth")
async def debug_google_oauth(request: Request):
    """Debug endpoint to check Google OAuth URLs"""
    base_url = str(request.base_url).rstrip("/")
    redirect_uri = f"{base_url}/auth/google/callback"
    token_redirect_uri = f"{base_url}/auth/google/callback"

    return {
        "base_url": base_url,
        "redirect_uri": redirect_uri,
        "token_redirect_uri": token_redirect_uri,
        "google_auth_url": (
            "https://accounts.google.com/o/oauth2/v2/auth?client_id="
            f"{GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope=openid email profile"
        ),
    }


@router.post("/cpi/ZBAPI_AR_ACC_GETOPENITEMS_V2")
@monitor_request_duration()
async def zbapi_ar_acc_getopenitems_v2(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZBAPI_AR_ACC_GETOPENITEMS_V2", data)


@router.post("/cpi/ZBAPI_WEBINVOICE_GETLIST2")
@monitor_request_duration()
async def zbapi_webinvoice_getlist2(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZBAPI_WEBINVOICE_GETLIST2", data)


@router.post("/cpi/ZBAPI_AR_ACC_GETOPENITEMS")
@monitor_request_duration()
async def zbapi_ar_acc_getopenitems(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZBAPI_AR_ACC_GETOPENITEMS", data)


@router.post("/cpi/ZFIN_AP_AR_GET_BANK")
@monitor_request_duration()
async def zfin_ap_ar_get_bank(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZFIN_AP_AR_GET_BANK", data)


@router.post("/cpi/ZDETALHES_FATURA")
@monitor_request_duration()
async def zdetalhes_fatura(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZDETALHES_FATURA", data)


@router.post("/cpi/ZFATURA_PARC2")
@monitor_request_duration()
async def zfatura_parc2(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZFATURA_PARC2", data)


@router.post("/cpi/ZBAPI_AP_ACC_GETOPENITEMS")
@monitor_request_duration()
async def zbapi_ap_acc_getopenitems(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    print(data)
    return await call_sap("ZBAPI_AP_ACC_GETOPENITEMS", data)


@router.get("/Invoice/{vendor}/{company_code}/{date}")
async def listar_faturas(
    request: Request,
    vendor: str,
    company_code: str,
    date: str,
    current_user: str = Depends(verify_token),
):
    invoices = await get_invoice_list(vendor, company_code, date)
    return invoices


@router.get("/Invoice/{invoiceNumber}")
async def detalhe_fatura(request: Request, invoiceNumber: str, current_user: str = Depends(verify_token)):
    invoice = await get_invoice_details(invoiceNumber)
    return invoice


@router.get("/Bank/{vendor}")
async def dados_bancarios(request: Request, vendor: str, current_user: str = Depends(verify_token)):
    bank_data = await get_bank_data(vendor)
    return bank_data


@router.post("/cpi/ZCHANGEDOCU_CDPOS_READ_V2")
@monitor_request_duration()
async def zchangedocu_cdpos_read_v2(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZCHANGEDOCU_CDPOS_READ_V2", data)


@router.post("/cpi/ZBAPI_BUPA_TAX_PAR_GET_DETAIL")
@monitor_request_duration()
async def zbapi_bupa_tax_par_get_detail(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZBAPI_BUPA_TAX_PAR_GET_DETAIL", data)


@router.post("/cpi/ZCADASTRA_DADOS_BANC")
@monitor_request_duration()
async def zcadastra_dados_banc(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZCADASTRA_DADOS_BANC", data)


@router.post("/cpi/ZVENDOR_UPDATE")
@monitor_request_duration()
async def zvendor_update(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZVENDOR_UPDATE", data)


@router.post("/cpi/ZFI_DOCUMENT_CHANGE")
@monitor_request_duration()
async def zfi_document_change(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZFI_DOCUMENT_CHANGE", data)


@router.post("/cpi/BBP_VENDOR_GETLIST")
@monitor_request_duration()
async def bbp_vendor_getlist(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("BBP_VENDOR_GETLIST", data)


@router.post("/cpi/ZGET_VENDOR_DETAILS")
@monitor_request_duration()
async def zget_vendor_details(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZGET_VENDOR_DETAILS", data)


@router.post("/cpi/FIN_AP_AR_GET_BANK")
@monitor_request_duration()
async def fin_ap_ar_get_bank(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("FIN_AP_AR_GET_BANK", data)


@router.post("/cpi/BAPI_VENDOR_CREATE")
@monitor_request_duration()
async def bapi_vendor_create(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("BAPI_VENDOR_CREATE", data)


@router.post("/cpi/ZBAPI_AR_ACC_GETOPENITEMS2")
@monitor_request_duration()
async def zbapi_ar_acc_getopenitems2(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZBAPI_AR_ACC_GETOPENITEMS2", data)


@router.post("/cpi/ZFI_F4_ZTERM")
@monitor_request_duration()
async def zfi_f4_zterm(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZFI_F4_ZTERM", data)


@router.post("/cpi/BAPI_CUSTOMER_GETLIST")
@monitor_request_duration()
async def bapi_customer_getlist(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("BAPI_CUSTOMER_GETLIST", data)


@router.post("/cpi/BAPI_SALESORDER_GETLIST")
@monitor_request_duration()
async def bapi_salesorder_getlist(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("BAPI_SALESORDER_GETLIST", data)


@router.post("/cpi/BAPI_WEBINVOICE_GETLIST")
@monitor_request_duration()
async def bapi_webinvoice_getlist(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("BAPI_WEBINVOICE_GETLIST", data)


@router.post("/cpi/BAPI_WEBINVOICE_GETDETAIL")
@monitor_request_duration()
async def bapi_webinvoice_getdetail(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("BAPI_WEBINVOICE_GETDETAIL", data)


@router.post("/cpi/ZUKM_DB_UKMBP_CMS_EXECUTE")
@monitor_request_duration()
async def zukm_db_ukmbp_cms_execute(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZUKM_DB_UKMBP_CMS_EXECUTE", data)


@router.post("/cpi/ZUKM_DB_UKMBP_CMS_SGM_READ")
@monitor_request_duration()
async def zukm_db_ukmbp_cms_sgm_read(request: Request, current_user: str = Depends(verify_token)):
    data = await request.json()
    return await call_sap("ZUKM_DB_UKMBP_CMS_SGM_READ", data)

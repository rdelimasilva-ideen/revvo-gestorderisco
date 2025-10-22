from fastapi import APIRouter, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import logging
import jwt
import datetime
from config import JWT_SECRET_KEY

# Configurar logger
logger = logging.getLogger(__name__)

router = APIRouter()

# ===========================
# DADOS MOCKADOS PARA TESTES
# ===========================

# Usuários mockados (email: senha)
MOCK_USERS = {
    "admin@example.com": {
        "password": "admin123",
        "id": "mock-user-1",
        "email": "admin@example.com",
        "user_metadata": {
            "name": "Admin User",
            "role": "admin"
        }
    },
    "user@example.com": {
        "password": "user123",
        "id": "mock-user-2",
        "email": "user@example.com",
        "user_metadata": {
            "name": "Regular User",
            "role": "user"
        }
    },
    "teste@teste.com": {
        "password": "teste123",
        "id": "mock-user-3",
        "email": "teste@teste.com",
        "user_metadata": {
            "name": "Teste User",
            "role": "user"
        }
    }
}

def create_mock_token(user_email: str) -> dict:
    """Cria um token JWT mockado para o usuário"""
    user_data = MOCK_USERS.get(user_email)
    if not user_data:
        raise ValueError("User not found")

    # Criar payload do token
    payload = {
        "sub": user_data["id"],
        "email": user_data["email"],
        "user_metadata": user_data["user_metadata"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow()
    }

    # Gerar token JWT
    access_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
    refresh_token = jwt.encode({**payload, "type": "refresh"}, JWT_SECRET_KEY, algorithm="HS256")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 86400,  # 24 horas
        "token_type": "bearer"
    }

def verify_mock_token(token: str) -> dict:
    """Verifica e decodifica um token JWT mockado"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Modelos Pydantic
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    user_metadata: Optional[dict] = {}

class ResetPasswordRequest(BaseModel):
    email: str

class UpdatePasswordRequest(BaseModel):
    password: str

class OAuthSignInRequest(BaseModel):
    provider: str
    redirect_url: Optional[str] = None

# ===========================
# ENDPOINTS DE AUTENTICAÇÃO
# ===========================

@router.post("/login")
async def login(login_data: LoginRequest):
    """Endpoint para login usando dados mockados"""
    try:
        logger.info(f"Tentativa de login para: {login_data.email}")

        # Verificar se o usuário existe
        user_data = MOCK_USERS.get(login_data.email)
        if not user_data:
            logger.warning(f"Usuário não encontrado: {login_data.email}")
            raise HTTPException(status_code=401, detail="Invalid login credentials")

        # Verificar senha
        if user_data["password"] != login_data.password:
            logger.warning(f"Senha incorreta para: {login_data.email}")
            raise HTTPException(status_code=401, detail="Invalid login credentials")

        # Criar tokens
        tokens = create_mock_token(login_data.email)

        # Preparar dados do usuário
        user_dict = {
            "id": user_data["id"],
            "email": user_data["email"],
            "created_at": datetime.datetime.utcnow().isoformat(),
            "user_metadata": user_data["user_metadata"],
            "app_metadata": {},
            "aud": "authenticated",
            "role": "authenticated"
        }

        # Preparar dados da sessão
        session_dict = {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "expires_at": int((datetime.datetime.utcnow() + datetime.timedelta(hours=24)).timestamp()),
            "expires_in": tokens["expires_in"],
            "user": user_dict
        }

        # Retornar dados de usuário e sessão no formato esperado pelo frontend
        session_data = {
            "user": user_dict,
            "session": session_dict,
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "expires_at": session_dict["expires_at"],
            "expires_in": tokens["expires_in"],
            "token_type": "bearer"
        }

        logger.info(f"Login bem-sucedido para: {login_data.email}")

        # Criar resposta com cookies
        response = JSONResponse(content=session_data)

        # Definir cookies seguros
        response.set_cookie(
            key="sb-access-token",
            value=tokens["access_token"],
            httponly=True,
            secure=False,  # False para desenvolvimento local
            samesite="lax",
            path="/"
        )

        response.set_cookie(
            key="sb-refresh-token",
            value=tokens["refresh_token"],
            httponly=True,
            secure=False,
            samesite="lax",
            path="/"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no login: {e}")
        raise HTTPException(status_code=401, detail=f"Erro de autenticação: {str(e)}")

@router.post("/signup")
async def signup(request: SignupRequest):
    """Registro de novo usuário (mockado)"""
    try:
        logger.info(f"Tentativa de registro para: {request.email}")

        # Verificar se usuário já existe
        if request.email in MOCK_USERS:
            raise HTTPException(status_code=400, detail="User already registered")

        # Criar novo usuário mockado
        user_id = f"mock-user-{len(MOCK_USERS) + 1}"
        MOCK_USERS[request.email] = {
            "password": request.password,
            "id": user_id,
            "email": request.email,
            "user_metadata": request.user_metadata
        }

        # Criar tokens
        tokens = create_mock_token(request.email)

        user_dict = {
            "id": user_id,
            "email": request.email,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "user_metadata": request.user_metadata
        }

        session_dict = {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "expires_in": tokens["expires_in"],
            "token_type": "bearer",
            "user": user_dict
        }

        logger.info(f"Registro bem-sucedido para: {request.email}")

        return {
            "user": user_dict,
            "session": session_dict
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no registro: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
async def logout(request: Request, authorization: Optional[str] = Header(None)):
    """Logout do usuário"""
    try:
        logger.info("Processando logout")

        # Criar resposta que limpa cookies
        response = JSONResponse(content={"success": True, "message": "Logout realizado com sucesso"})

        # Limpar cookies
        cookies_to_clear = [
            "sb-access-token",
            "sb-refresh-token",
            "sb-id-token",
            "supabase-auth-token"
        ]

        for cookie_name in cookies_to_clear:
            response.delete_cookie(cookie_name, path="/")

        logger.info("Logout concluído")
        return response

    except Exception as e:
        logger.error(f"Erro no logout: {e}")
        response = JSONResponse(content={"success": True, "message": "Sessão finalizada"})
        for cookie_name in ["sb-access-token", "sb-refresh-token"]:
            response.delete_cookie(cookie_name, path="/")
        return response

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset de senha por email (mockado)"""
    try:
        logger.info(f"Solicitação de reset de senha para: {request.email}")

        if request.email not in MOCK_USERS:
            # Não revelar se o email existe ou não por segurança
            pass

        logger.info("Email de reset enviado (simulado)")
        return {"success": True}

    except Exception as e:
        logger.error(f"Erro no reset de senha: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/session")
async def get_session(request: Request, authorization: Optional[str] = Header(None)):
    """Obter sessão atual"""
    try:
        token = None

        # Tentar obter token do header Authorization
        if authorization and authorization.startswith('Bearer '):
            token = authorization.replace('Bearer ', '')

        # Tentar obter token dos cookies
        if not token:
            token = request.cookies.get("sb-access-token")

        if not token:
            return {"session": None, "user": None}

        # Verificar token
        payload = verify_mock_token(token)

        # Buscar dados do usuário
        user_email = payload.get("email")
        user_data = MOCK_USERS.get(user_email)

        if not user_data:
            return {"session": None, "user": None}

        user_dict = {
            "id": user_data["id"],
            "email": user_data["email"],
            "created_at": datetime.datetime.utcnow().isoformat(),
            "user_metadata": user_data["user_metadata"]
        }

        session_dict = {
            "access_token": token,
            "refresh_token": request.cookies.get("sb-refresh-token", ""),
            "expires_in": 86400,
            "token_type": "bearer",
            "user": user_dict
        }

        return {
            "session": session_dict,
            "user": user_dict
        }

    except HTTPException:
        return {"session": None, "user": None}
    except Exception as e:
        logger.error(f"Erro ao obter sessão: {e}")
        return {"session": None, "user": None}

@router.get("/user")
async def get_user(authorization: Optional[str] = Header(None)):
    """Obter usuário atual"""
    try:
        if not authorization or not authorization.startswith('Bearer '):
            return {"user": None}

        token = authorization.replace('Bearer ', '')
        payload = verify_mock_token(token)

        user_email = payload.get("email")
        user_data = MOCK_USERS.get(user_email)

        if not user_data:
            return {"user": None}

        user_dict = {
            "id": user_data["id"],
            "email": user_data["email"],
            "created_at": datetime.datetime.utcnow().isoformat(),
            "user_metadata": user_data["user_metadata"]
        }

        return {"user": user_dict}

    except HTTPException:
        return {"user": None}
    except Exception as e:
        logger.error(f"Erro ao obter usuário: {e}")
        return {"user": None}

@router.post("/update-password")
async def update_password(request: UpdatePasswordRequest, authorization: Optional[str] = Header(None)):
    """Atualizar senha do usuário"""
    try:
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Não autorizado")

        token = authorization.replace('Bearer ', '')
        payload = verify_mock_token(token)

        user_email = payload.get("email")
        if user_email in MOCK_USERS:
            MOCK_USERS[user_email]["password"] = request.password
            logger.info(f"Senha atualizada para: {user_email}")
            return {"message": "Password updated successfully"}

        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar senha: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/oauth/signin")
async def oauth_signin(request: OAuthSignInRequest):
    """Endpoint para login via OAuth (mockado)"""
    try:
        logger.info(f"Tentativa de login OAuth com provider: {request.provider}")

        # Em modo mockado, retornar uma URL fake
        mock_url = f"http://localhost:5176/oauth-callback?provider={request.provider}&code=mock_code"

        return {"url": mock_url}

    except Exception as e:
        logger.error(f"Erro no OAuth: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, authorization: Optional[str] = Header(None)):
    """Endpoint para excluir um usuário (apenas para administradores)"""
    try:
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Token de autorização não fornecido")

        token = authorization.replace('Bearer ', '')
        payload = verify_mock_token(token)

        # Verificar se é admin
        user_email = payload.get("email")
        user_data = MOCK_USERS.get(user_email)

        if not user_data or user_data.get("user_metadata", {}).get("role") != "admin":
            raise HTTPException(status_code=403, detail="Apenas administradores podem excluir usuários")

        # Encontrar e remover usuário por ID
        for email, data in list(MOCK_USERS.items()):
            if data["id"] == user_id:
                del MOCK_USERS[email]
                logger.info(f"Usuário deletado: {user_id}")
                return {"success": True, "message": "Usuário excluído com sucesso"}

        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test")
async def test_auth():
    """Test do sistema de autenticação mockado"""
    return {
        "status": "connected",
        "mode": "mock",
        "message": "Sistema de autenticação mockado funcionando",
        "available_users": [email for email in MOCK_USERS.keys()]
    }

logger.info("Sistema de autenticação mockado inicializado")
logger.info(f"Usuários disponíveis: {list(MOCK_USERS.keys())}")

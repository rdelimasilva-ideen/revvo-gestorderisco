from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from supabase import create_client, Client
from typing import Optional
import os
from config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
import logging

# Configurar logger
logger = logging.getLogger(__name__)

router = APIRouter()

# Para autenticação, precisamos usar as variáveis de ambiente
try:
    # Para autenticação, precisamos usar a anon key
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    # Cliente com permissões de administrador para operações privilegiadas
    supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    logger.info("Supabase clients initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Supabase clients: {str(e)}")
    # Não lançamos exceção aqui para permitir que o servidor inicie, 
    # mas os endpoints relacionados ao Supabase falharão

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

@router.post("/login")
async def login(login_data: LoginRequest):
    """Endpoint para login usando Supabase"""
    try:
        # Usar o cliente Supabase para autenticação
        response = supabase.auth.sign_in_with_password({
            "email": login_data.email,
            "password": login_data.password
        })
        
        # Verificar se houve erro na autenticação
        if not response.user:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Converter o objeto User para um dicionário para serialização JSON
        user_dict = {
            "id": response.user.id,
            "email": response.user.email,
            "created_at": str(response.user.created_at) if response.user.created_at else None,
            "user_metadata": response.user.user_metadata or {},
            "app_metadata": response.user.app_metadata or {},
            "aud": response.user.aud,
            "role": response.user.role,
        }
        
        # Converter o objeto Session para um dicionário para serialização JSON
        session_dict = {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "expires_at": response.session.expires_at,
            "expires_in": response.session.expires_in,
            "user": user_dict
        }
        
        # Retornar dados de usuário e sessão no formato esperado pelo frontend
        session_data = {
            "user": user_dict,
            "session": session_dict,
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "expires_at": response.session.expires_at,  # Importante para renovação
            "expires_in": response.session.expires_in,  # Importante para renovação
            "token_type": "bearer"  # Padrão para o Supabase
        }
        
        print(f"Login successful for user: {user_dict['email']}")
        
        try:
            # Preparar resposta com cookies para melhor gerenciamento de sessão
            from fastapi.responses import JSONResponse
            response = JSONResponse(content=session_data)
            
            # Definir cookies seguros para autenticação
            # Estes cookies ajudam na autenticação e também facilitam o logout completo
            access_token = session_data["access_token"]
            refresh_token = session_data["refresh_token"]
            
            if access_token:
                response.set_cookie(
                    key="sb-access-token",
                    value=access_token,
                    httponly=True,
                    secure=True,  # Use True em produção com HTTPS
                    samesite="lax",
                    path="/"
                )
                
            if refresh_token:
                response.set_cookie(
                    key="sb-refresh-token",
                    value=refresh_token,
                    httponly=True,
                    secure=True,  # Use True em produção com HTTPS
                    samesite="lax",
                    path="/"
                )
            
            return response
        except Exception as cookie_error:
            # Em caso de erro ao configurar cookies, ainda retornamos os dados da sessão
            print(f"Erro ao configurar cookies: {cookie_error}")
            return session_data
        
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        
        # Formatando a mensagem de erro para evitar problemas de serialização JSON
        error_message = str(e)
        if "not JSON serializable" in error_message:
            error_message = "Erro de serialização de dados. Por favor, tente novamente."
        
        raise HTTPException(status_code=401, detail=f"Erro de autenticação: {error_message}")
        
# O endpoint /logout foi movido para mais abaixo no arquivo

@router.get("/test")
async def test_supabase():
    """Test Supabase connection"""
    try:
        # Test with a simple session check
        response = supabase.auth.get_session()
        print(f"Session response: {response}")
        print(f"Session type: {type(response)}")
        
        if response is None:
            return {"status": "error", "message": "Session response is None"}
        
        session = getattr(response, 'session', None) if hasattr(response, 'session') else None
        return {
            "status": "connected", 
            "session": "null" if not session else "exists",
            "response_type": str(type(response))
        }
    except Exception as e:
        print(f"Test error: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

from fastapi import Request
import json

@router.post("/signup")
async def signup(request: SignupRequest):
    """Registro de novo usuário"""
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {"data": request.user_metadata}
        })
        
        user_dict = None
        session_dict = None
        
        if response.user:
            user_dict = {
                "id": response.user.id,
                "email": response.user.email,
                "created_at": str(response.user.created_at) if response.user.created_at else None,
                "user_metadata": response.user.user_metadata or {},
            }
        
        if response.session:
            session_dict = {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "expires_in": response.session.expires_in,
                "token_type": response.session.token_type,
                "user": user_dict
            }
        
        return {
            "user": user_dict,
            "session": session_dict
        }
        
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
async def logout(request: Request, authorization: Optional[str] = Header(None)):
    """Logout do usuário com estratégia abrangente para garantir limpeza completa da sessão"""
    try:
        print("Iniciando processo de logout abrangente")
        token = None
        refresh_token = None
        
        # Extrair token de autorização
        if authorization and authorization.startswith('Bearer '):
            token = authorization.replace('Bearer ', '')
            print(f"Token de autorização encontrado")
            
        # Verificar cookies para refresh token
        for cookie_name in request.cookies:
            if 'refresh' in cookie_name.lower():
                refresh_token = request.cookies[cookie_name]
                print(f"Refresh token encontrado em cookie: {cookie_name}")
                break
                
        # 1. Tentar definir sessão com token antes de fazer logout
        if token:
            try:
                # Corrigido: Usando argumentos posicionais
                supabase.auth.set_session(token, refresh_token or "")
                print("Sessão definida com token de autorização")
            except Exception as token_error:
                print(f"Erro ao definir sessão com token: {token_error}")
                
        # 2. Tentar logout (não usar mais o parâmetro 'scope')
        try:
            supabase.auth.sign_out()
            print("Logout global realizado")
        except Exception as global_error:
            print(f"Erro no logout global: {global_error}")
            
        # 3. Tentar método alternativo de logout
        try:
            supabase.auth.sign_out()
            print("Logout local realizado")
        except Exception as local_error:
            print(f"Erro no logout local: {local_error}")
            
        # 4. Tentar fazer chamada HTTP direta para API do Supabase
        if token:
            try:
                import httpx
                
                headers = {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}"
                }
                
                async with httpx.AsyncClient() as client:
                    # Tentar endpoint de logout global
                    logout_url = f"{SUPABASE_URL}/auth/v1/logout"
                    response = await client.post(logout_url, headers=headers)
                    print(f"Chamada HTTP direta para logout: {response.status_code}")
                    
                    # Tentar também endpoint de revogação de token
                    if refresh_token:
                        revoke_url = f"{SUPABASE_URL}/auth/v1/token/revoke"
                        data = {"token": refresh_token}
                        revoke_response = await client.post(revoke_url, headers=headers, json=data)
                        print(f"Revogação de refresh token: {revoke_response.status_code}")
            except Exception as http_error:
                print(f"Erro na chamada HTTP direta para logout: {http_error}")
                
        # 5. Criar um cliente temporário para tentar logout
        try:
            temp_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            if token:
                temp_client.auth.set_session(token, refresh_token or "")
            temp_client.auth.sign_out()
            print("Logout com cliente temporário realizado")
        except Exception as temp_client_error:
            error_message = str(temp_client_error)
            # Tratar o erro específico de "Session does not exist" como normal durante logout
            if "Session from session_id claim in JWT does not exist" in error_message:
                print("Sessão já estava encerrada ou não existe (comportamento normal)")
            else:
                print(f"Erro no logout com cliente temporário: {temp_client_error}")
            
        print("Processo de logout concluído com sucesso")
        
        # Preparar resposta que limpa cookies no cliente
        from fastapi.responses import JSONResponse
        response = JSONResponse(content={"success": True, "message": "Logout realizado com sucesso"})
        
        # Lista de possíveis cookies relacionados à autenticação
        cookies_to_clear = [
            "sb-access-token", 
            "sb-refresh-token",
            "sb-id-token",
            "supabase-auth-token"
        ]
        
        # Limpar cookies com diferentes configurações para garantir remoção completa
        for cookie_name in cookies_to_clear:
            # Limpar no caminho raiz
            response.delete_cookie(cookie_name, path="/")
            # Limpar com httponly
            response.delete_cookie(cookie_name, httponly=True, path="/")
        
        return response
    except Exception as e:
        print(f"Erro geral no processo de logout: {e}")
        import traceback
        traceback.print_exc()
        
        # Mesmo com erro, retornamos uma resposta que limpa cookies
        from fastapi.responses import JSONResponse
        response = JSONResponse(
            content={"success": True, "message": "Sessão finalizada parcialmente"}
        )
        
        # Tentar limpar cookies mesmo em caso de falha
        for cookie_name in ["sb-access-token", "sb-refresh-token"]:
            response.delete_cookie(cookie_name, path="/")
            
        return response

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset de senha por email"""
    try:
        # Para supabase-py versão 2.0.0
        response = supabase.auth.reset_password_email(
            email=request.email,
            options={
                "redirect_to": f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/reset-password"
            }
        )
        print(f"Senha reset solicitada para email: {request.email}")
        return {"success": True}
    except Exception as e:
        print(f"Reset password error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Erro ao solicitar redefinição de senha: {str(e)}")
        
    except Exception as e:
        print(f"Reset password error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import Request, Header
from typing import Optional

@router.get("/session")
async def get_session(request: Request, authorization: Optional[str] = Header(None)):
    """Obter sessão atual"""
    try:
        # Primeiro, tentar obter da sessão do Supabase
        response = supabase.auth.get_session()
        
        # Se não houver sessão no Supabase mas houver token Authorization
        if (not response or not hasattr(response, 'session') or not response.session) and authorization:
            # Extrair o token Bearer
            if authorization.startswith('Bearer '):
                token = authorization.replace('Bearer ', '')
                
                # Tentar validar o token com Supabase
                try:
                    # Set the session usando argumentos posicionais
                    supabase.auth.set_session(token, "")
                    
                    # Get user info with the token
                    user_response = supabase.auth.get_user(token)
                    
                    if user_response and user_response.user:
                        user_dict = {
                            "id": user_response.user.id,
                            "email": user_response.user.email,
                            "created_at": str(user_response.user.created_at) if user_response.user.created_at else None,
                            "user_metadata": user_response.user.user_metadata or {},
                        }
                        
                        session_dict = {
                            "access_token": token,
                            "user": user_dict
                        }
                        
                        return {
                            "session": session_dict,
                            "user": user_dict
                        }
                except Exception as token_error:
                    print(f"Token validation error: {token_error}")
        
        # Se houver sessão válida no Supabase
        if response and hasattr(response, 'session') and response.session:
            user_dict = {
                "id": response.session.user.id,
                "email": response.session.user.email,
                "created_at": str(response.session.user.created_at) if response.session.user.created_at else None,
                "user_metadata": response.session.user.user_metadata or {},
            } if response.session.user else None
            
            session_dict = {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "expires_in": response.session.expires_in,
                "token_type": response.session.token_type,
                "user": user_dict
            }
            
            return {
                "session": session_dict,
                "user": user_dict
            }
        else:
            return {
                "session": None,
                "user": None
            }
    except Exception as e:
        print(f"Get session error: {e}")
        return {
            "session": None,
            "user": None
        }

@router.get("/user")
async def get_user(authorization: Optional[str] = Header(None)):
    """Obter usuário atual"""
    try:
        if not authorization:
            print("No authorization header provided")
            return {"user": None}
            
        # Extrair o token Bearer
        if authorization.startswith('Bearer '):
            token = authorization.replace('Bearer ', '')
            
            # Tentar validar o token com Supabase
            try:
                # Get user info with the token
                user_response = supabase.auth.get_user(token)
                
                if user_response and user_response.user:
                    user_dict = {
                        "id": user_response.user.id,
                        "email": user_response.user.email,
                        "created_at": str(user_response.user.created_at) if user_response.user.created_at else None,
                        "user_metadata": user_response.user.user_metadata or {},
                    }
                    return {"user": user_dict}
                else:
                    return {"user": None}
            except Exception as token_error:
                print(f"Token validation error: {token_error}")
                return {"user": None}
        else:
            print("Authorization header does not start with 'Bearer '")
            return {"user": None}
    except Exception as e:
        print(f"Get user error: {e}")
        return {"user": None}

class UpdatePasswordRequest(BaseModel):
    password: str

@router.post("/update-password")
async def update_password(request: UpdatePasswordRequest):
    """Update user password"""
    try:
        response = supabase.auth.update_user({
            "password": request.password
        })
        
        if response and response.user:
            return {"message": "Password updated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to update password")
    except Exception as e:
        print(f"Update password error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        

@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str):
    """Endpoint para administradores excluírem usuários"""
    try:
        # Usar o cliente Supabase Admin para excluir o usuário
        response = supabase_admin.auth.admin.delete_user(user_id)
        
        # Retornar sucesso
        return {"message": "User deleted successfully"}
    except Exception as e:
        print(f"Delete user error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


class OAuthSignInRequest(BaseModel):
    provider: str
    redirect_url: Optional[str] = None

@router.post("/oauth/signin")
async def oauth_signin(request: OAuthSignInRequest):
    """Endpoint para login via OAuth (Google, Github, etc)"""
    try:
        # Construir as opções para o OAuth
        options = {"provider": request.provider}
        if request.redirect_url:
            options["redirect_to"] = request.redirect_url
            
        # Iniciar fluxo de OAuth
        response = supabase.auth.sign_in_with_oauth(options)
        
        # Retornar a URL para redirecionamento
        return {"url": response.url if hasattr(response, "url") else None}
    except Exception as e:
        print(f"OAuth sign in error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
        
@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, authorization: Optional[str] = Header(None)):
    """Endpoint para excluir um usuário (apenas para administradores)"""
    try:
        # Verificar se o token de autorização foi fornecido
        if not authorization:
            raise HTTPException(status_code=401, detail="Token de autorização não fornecido")

        # Extrair o token Bearer
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        
        # Verificar se o usuário é um administrador (isso é simplificado, você pode querer uma verificação mais robusta)
        try:
            # Verificar o token e obter dados do usuário
            user_data = supabase.auth.get_user(token)
            
            # Verificar se o usuário tem o papel de administrador
            # Ajuste isso de acordo com sua lógica de permissões
            is_admin = user_data.user and (
                user_data.user.app_metadata.get("role") == "admin" or
                user_data.user.app_metadata.get("is_admin") == True
            )
            
            if not is_admin:
                raise HTTPException(status_code=403, detail="Apenas administradores podem excluir usuários")
                
        except Exception as auth_error:
            print(f"Error authenticating admin: {auth_error}")
            raise HTTPException(status_code=401, detail="Erro de autenticação: " + str(auth_error))
        
        # Excluir o usuário usando o cliente admin
        response = supabase_admin.auth.admin.delete_user(user_id)
        
        return {"success": True, "message": "Usuário excluído com sucesso"}
    except HTTPException:
        # Repassar as exceções HTTP que já foram criadas
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao excluir usuário: {str(e)}")


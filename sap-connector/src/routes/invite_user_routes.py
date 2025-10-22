from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
import logging
from auth import verify_token
from fastapi import Depends

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["Users"])

# Cliente Supabase com permissões de administrador para criar usuários
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class InviteUserRequest(BaseModel):
    email: str
    password: Optional[str] = "SenhaProvisoria123!"
    user_metadata: dict

@router.post("/invite")
async def invite_user(request: InviteUserRequest, current_user: str = Depends(verify_token)):
    """
    Convida um novo usuário para o sistema, criando uma conta e enviando convite por email
    """
    try:
        # Cria o usuário via API de admin do Supabase
        response = supabase_admin.auth.admin.invite_user_by_email(
            email=request.email,
            data={
                "email": request.email,
                "password": request.password,
                "user_metadata": request.user_metadata
            }
        )
        
        if not response or not response.user:
            raise HTTPException(status_code=400, detail="Falha ao convidar usuário.")
        
        # Cria registro de perfil do usuário
        user_profile = {
            "logged_id": response.user.id,
            "name": request.user_metadata.get("name", ""),
            "doc_id": request.user_metadata.get("doc_id", ""),
            "birth_date": request.user_metadata.get("birth_date"),
            "company_id": request.user_metadata.get("company_id"),
            "role_id": request.user_metadata.get("role_id")
        }
        
        profile_response = supabase_admin.table('user_profile').insert(user_profile).execute()
        
        if profile_response.data is None:
            # Caso falhe ao criar o perfil, ainda retornamos sucesso mas com alerta
            logger.warning(f"Usuário criado mas falha ao criar perfil: {profile_response.error}")
            return {
                "user": response.user.model_dump(),
                "profile": None,
                "warning": "Usuário criado mas falha ao criar perfil"
            }
        
        return {
            "user": response.user.model_dump(),
            "profile": profile_response.data[0] if profile_response.data else None,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Erro ao convidar usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao convidar usuário: {str(e)}")
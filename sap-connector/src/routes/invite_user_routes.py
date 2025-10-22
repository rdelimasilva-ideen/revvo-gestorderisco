from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
import logging
from auth import verify_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["Users"])

# Mock database para user profiles
MOCK_USER_PROFILES = {}

class InviteUserRequest(BaseModel):
    email: str
    password: Optional[str] = "SenhaProvisoria123!"
    user_metadata: dict

@router.post("/invite")
async def invite_user(request: InviteUserRequest, current_user: str = Depends(verify_token)):
    """
    Convida um novo usuário para o sistema (versão mockada)
    """
    try:
        logger.info(f"Convidando usuário mockado: {request.email}")

        # Simular criação de usuário
        mock_user_id = f"mock-invited-user-{len(MOCK_USER_PROFILES) + 1}"

        # Criar registro de perfil do usuário mockado
        user_profile = {
            "logged_id": mock_user_id,
            "email": request.email,
            "name": request.user_metadata.get("name", ""),
            "doc_id": request.user_metadata.get("doc_id", ""),
            "birth_date": request.user_metadata.get("birth_date"),
            "company_id": request.user_metadata.get("company_id"),
            "role_id": request.user_metadata.get("role_id")
        }

        MOCK_USER_PROFILES[mock_user_id] = user_profile

        logger.info(f"Usuário mockado convidado com sucesso: {request.email}")

        return {
            "user": {
                "id": mock_user_id,
                "email": request.email,
                "user_metadata": request.user_metadata
            },
            "message": "Usuário convidado com sucesso (mock)"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao convidar usuário mockado: {e}")
        raise HTTPException(status_code=400, detail=f"Falha ao convidar usuário: {str(e)}")

@router.get("/profiles")
async def get_all_profiles(current_user: str = Depends(verify_token)):
    """Retorna todos os perfis de usuários mockados"""
    return {"profiles": list(MOCK_USER_PROFILES.values())}

@router.get("/profiles/{user_id}")
async def get_profile(user_id: str, current_user: str = Depends(verify_token)):
    """Retorna o perfil de um usuário específico (mockado)"""
    if user_id in MOCK_USER_PROFILES:
        return {"profile": MOCK_USER_PROFILES[user_id]}
    raise HTTPException(status_code=404, detail="Perfil não encontrado")

logger.info("Rotas de convite de usuários (mockadas) inicializadas")

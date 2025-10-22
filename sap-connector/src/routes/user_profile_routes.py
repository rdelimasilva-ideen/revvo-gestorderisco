from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
import logging
import json
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/user-profile", tags=["user-profile"])
logger = logging.getLogger(__name__)

@router.get("/current/{user_id}")
async def get_current_user_profile(user_id: str, current_user: str = Depends(verify_token)):
    """
    Busca o perfil do usuário logado
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_profile').select(
            '*, user_role:role_id(id, name)'
        ).eq('logged_id', user_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data
            })
        else:
            raise HTTPException(status_code=404, detail="Perfil de usuário não encontrado")
            
    except Exception as e:
        logger.error(f"Erro ao buscar perfil do usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar perfil: {str(e)}")

@router.post("/upsert")
async def upsert_user_profile(request: Request, current_user: str = Depends(verify_token)):
    """
    Atualiza ou cria o perfil do usuário
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        profile_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Upsert perfil com dados: {profile_data}")
        
        response = supabase.table('user_profile').upsert(
            profile_data
        ).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Perfil atualizado com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao fazer upsert do perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar perfil: {str(e)}")

@router.get("/roles/{company_id}")
async def get_roles(company_id: str, current_user: str = Depends(verify_token)):
    """
    Busca todas as roles da empresa
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_role').select(
            '*'
        ).eq('company_id', company_id).order('name').execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar roles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar roles: {str(e)}")

@router.get("/list/{company_id}")
async def list_user_profiles(company_id: str, current_user: str = Depends(verify_token)):
    """
    Lista perfis de usuário da empresa
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_profile').select(
            '*, user_role:role_id(id, name), company:company_id(id, name)'
        ).eq('company_id', company_id).order('name', desc=False).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar perfis de usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar perfis: {str(e)}")

@router.delete("/{profile_id}")
async def delete_user_profile(profile_id: str, current_user: str = Depends(verify_token)):
    """
    Deleta perfil de usuário por id
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_profile').delete().eq(
            'id', profile_id
        ).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Perfil deletado com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar perfil: {str(e)}")

@router.get("/companies/{company_id}")
async def list_companies(company_id: str, current_user: str = Depends(verify_token)):
    """
    Busca empresas por id (ou todas de um grupo, se necessário)
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('company').select(
            'id, name'
        ).eq('id', company_id).order('name', desc=False).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar empresas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar empresas: {str(e)}")

@router.get("/name/{user_id}")
async def get_user_name(user_id: str, current_user: str = Depends(verify_token)):
    """
    Busca nome do usuário logado pelo id
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_profile').select(
            'name'
        ).eq('logged_id', user_id).single().execute()
        
        user_name = response.data.get('name', '') if response.data else ''
        
        return JSONResponse(content={
            "success": True,
            "data": user_name
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar nome do usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar nome: {str(e)}")

@router.put("/{profile_id}")
async def update_user_profile(profile_id: str, request: Request, current_user: str = Depends(verify_token)):
    """
    Atualiza um perfil de usuário específico
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        profile_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Atualizando perfil {profile_id} com dados: {profile_data}")
        
        response = supabase.table('user_profile').update(
            profile_data
        ).eq('id', profile_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Perfil atualizado com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar perfil: {str(e)}")

@router.get("/{profile_id}")
async def get_user_profile_by_id(profile_id: str, current_user: str = Depends(verify_token)):
    """
    Busca um perfil de usuário por ID
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_profile').select(
            '*, user_role:role_id(id, name)'
        ).eq('id', profile_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data
            })
        else:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")
            
    except Exception as e:
        logger.error(f"Erro ao buscar perfil por ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar perfil: {str(e)}")

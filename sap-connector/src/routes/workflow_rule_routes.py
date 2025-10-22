"""
Rotas para gerenciamento de regras de workflow
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
import logging
import json
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/workflow-rules", tags=["workflow-rules"])
logger = logging.getLogger(__name__)

@router.get("/company/{company_id}")
async def list_workflow_rules(company_id: int, current_user: str = Depends(verify_token)):
    """Lista regras de workflow da empresa"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('workflow_rules').select("""
            *,
            workflow_type:type_id(id, name),
            user_role:role_id(id, name)
        """).eq('company_id', company_id).order('created_at', desc=True).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar regras de workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar regras: {str(e)}")

@router.post("/")
async def create_workflow_rule(request: Request, current_user: str = Depends(verify_token)):
    """Cria uma nova regra de workflow"""
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        rule_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Criando nova regra de workflow para empresa {rule_data.get('company_id')}")
        
        result = supabase.table('workflow_rules').insert([rule_data]).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Regra de workflow criada com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao criar regra de workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar regra: {str(e)}")

@router.put("/{rule_id}")
async def update_workflow_rule(rule_id: int, request: Request, current_user: str = Depends(verify_token)):
    """Atualiza uma regra de workflow"""
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        rule_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Atualizando regra de workflow {rule_id}")
        
        result = supabase.table('workflow_rules').update(rule_data).eq('id', rule_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Regra de workflow atualizada com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao atualizar regra de workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar regra: {str(e)}")

@router.delete("/{rule_id}")
async def delete_workflow_rule(rule_id: int, current_user: str = Depends(verify_token)):
    """Deleta uma regra de workflow"""
    try:
        supabase = get_supabase()
        
        logger.info(f"Deletando regra de workflow {rule_id}")
        
        result = supabase.table('workflow_rules').delete().eq('id', rule_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Regra de workflow deletada com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar regra de workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar regra: {str(e)}")


@router.get("/types")
async def get_workflow_types(current_user: str = Depends(verify_token)):
    """Buscar tipos de workflow"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('workflow_type').select('id, name').order('name').execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data if response.data else []
        })
    except Exception as e:
        logger.error(f"Erro ao buscar tipos de workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

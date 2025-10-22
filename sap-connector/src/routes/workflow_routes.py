from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
from typing import List, Dict, Any
import logging
import json
from datetime import datetime
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/workflow", tags=["workflow"])
logger = logging.getLogger(__name__)

@router.get("/credit-limit-requests/{customer_id}")
async def get_credit_limit_requests_by_customer(customer_id: str, current_user: str = Depends(verify_token)):
    """
    Busca todas as solicitações de limite de crédito de um cliente
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('credit_limit_request').select(
            '*'
        ).eq('customer_id', customer_id).order('created_at', desc=True).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar solicitações de limite: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar solicitações: {str(e)}")

@router.get("/sale-order/{credit_limit_req_id}")
async def get_workflow_sale_order(credit_limit_req_id: str, current_user: str = Depends(verify_token)):
    """
    Busca workflow_sale_order por credit_limit_req_id
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('workflow_sale_order').select(
            '*'
        ).eq('credit_limit_req_id', credit_limit_req_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data
            })
        else:
            raise HTTPException(status_code=404, detail="Workflow sale order não encontrado")
            
    except Exception as e:
        logger.error(f"Erro ao buscar workflow sale order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar workflow: {str(e)}")

@router.get("/details/{workflow_sale_order_id}")
async def get_workflow_details(workflow_sale_order_id: str, current_user: str = Depends(verify_token)):
    """
    Busca workflow_details por workflow_sale_order_id
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('workflow_details').select(
            '*, jurisdiction:user_role(name, description)'
        ).eq('workflow_sale_order_id', workflow_sale_order_id).order('workflow_step', desc=False).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar detalhes: {str(e)}")

@router.post("/approve-step")
async def approve_workflow_step(request: Request, current_user: str = Depends(verify_token)):
    """
    Aprova uma etapa do workflow
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        step_data = json.loads(body.decode('utf-8'))
        
        step_id = step_data.get('stepId')
        approver_id = step_data.get('approverId')
        comments = step_data.get('comments')
        
        logger.info(f"Aprovando step {step_id} por {approver_id}")
        
        response = supabase.table('workflow_details').update({
            'approval': True,
            'approver': approver_id,
            'finished_at': datetime.now().isoformat(),
            'parecer': comments
        }).eq('id', step_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Etapa aprovada com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao aprovar etapa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao aprovar etapa: {str(e)}")

@router.post("/reject-step")
async def reject_workflow_step(request: Request, current_user: str = Depends(verify_token)):
    """
    Rejeita uma etapa do workflow
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        step_data = json.loads(body.decode('utf-8'))
        
        step_id = step_data.get('stepId')
        approver_id = step_data.get('approverId')
        comments = step_data.get('comments')
        
        logger.info(f"Rejeitando step {step_id} por {approver_id}")
        
        response = supabase.table('workflow_details').update({
            'approval': False,
            'approver': approver_id,
            'finished_at': datetime.now().isoformat(),
            'parecer': comments
        }).eq('id', step_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Etapa rejeitada com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao rejeitar etapa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao rejeitar etapa: {str(e)}")

@router.put("/start-step/{step_id}")
async def start_workflow_step(step_id: str, current_user: str = Depends(verify_token)):
    """
    Atualiza o started_at de uma etapa do workflow
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('workflow_details').update({
            'started_at': datetime.now().isoformat()
        }).eq('id', step_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Etapa iniciada com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao iniciar etapa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao iniciar etapa: {str(e)}")

@router.get("/rules/{company_id}")
async def get_workflow_rules(company_id: str, current_user: str = Depends(verify_token)):
    """
    Busca workflow_rules por company_id
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('workflow_rules').select(
            '*'
        ).eq('company_id', company_id).order('value_range', desc=False).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar regras de workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar regras: {str(e)}")

@router.get("/user-profile/{user_id}")
async def get_user_profile(user_id: str, current_user: str = Depends(verify_token)):
    """
    Busca perfil do usuário por logged_id
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_profile').select(
            'role_id, company_id'
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

@router.post("/create-sale-order")
async def create_workflow_sale_order(request: Request, current_user: str = Depends(verify_token)):
    """
    Cria um workflow_sale_order, removendo qualquer workflow existente associado à mesma solicitação
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        data = json.loads(body.decode('utf-8'))
        
        credit_limit_req_id = data.get('creditLimitReqId')
        
        # 1. Primeiro, buscar workflows existentes para esta solicitação
        existing_workflows = supabase.table('workflow_sale_order').select('id').eq('credit_limit_req_id', credit_limit_req_id).execute()
        
        # 2. Se existir workflows antigos, excluir os detalhes associados e depois os workflows
        if existing_workflows.data and len(existing_workflows.data) > 0:
            workflow_ids = [wf['id'] for wf in existing_workflows.data]
            
            # 2.1 Excluir todos os detalhes de workflow associados
            for workflow_id in workflow_ids:
                workflow_details_deleted = supabase.table('workflow_details').delete().eq('workflow_sale_order_id', workflow_id).execute()
            
            # 2.2 Excluir os workflows
            workflows_deleted = supabase.table('workflow_sale_order').delete().eq('credit_limit_req_id', credit_limit_req_id).execute()
        
        # 3. Criar o novo workflow
        response = supabase.table('workflow_sale_order').insert({
            'credit_limit_req_id': credit_limit_req_id
        }).execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data[0]
            })
        else:
            raise HTTPException(status_code=400, detail="Erro ao criar workflow sale order")
            
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao criar workflow sale order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar workflow: {str(e)}")

@router.post("/create-details")
async def create_workflow_details(request: Request, current_user: str = Depends(verify_token)):
    """
    Cria múltiplos workflow_details, garantindo que não haja detalhes duplicados
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        data = json.loads(body.decode('utf-8'))
        
        details = data.get('details', [])
        
        if not details:
            return JSONResponse(content={
                "success": False,
                "message": "Nenhum detalhe de workflow fornecido"
            })
        
        # Agrupar por workflow_sale_order_id para verificação mais eficiente
        workflow_ids = set()
        for detail in details:
            if 'workflow_sale_order_id' in detail:
                workflow_ids.add(detail['workflow_sale_order_id'])
        
        # Excluir detalhes existentes para cada workflow_id
        for workflow_id in workflow_ids:
            # Excluir detalhes antigos para este workflow
            workflow_details_deleted = supabase.table('workflow_details').delete().eq('workflow_sale_order_id', workflow_id).execute()
        response = supabase.table('workflow_details').insert(details).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": f"{len(details)} detalhes de workflow criados com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao criar workflow details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar detalhes: {str(e)}")

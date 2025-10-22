"""
Rotas para gerenciamento de limites de crédito
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
from typing import Optional
import logging
import json
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/credit-limit", tags=["credit-limit"])
logger = logging.getLogger(__name__)

@router.get("/requests")
async def get_credit_limit_requests(
    company_id: Optional[int] = None,
    status_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None, current_user: str = Depends(verify_token)
):
    """Busca solicitações de limite de crédito com filtros opcionais"""
    try:
        supabase = get_supabase()
        
        # Constrói a query com joins - Sintaxe correta do Supabase Python
        query = supabase.table('credit_limit_request').select(
            "*,"
            "customer:customer_id(id,name,company_code),"
            "company:company_id(name),"
            "classification:silim_classific_id(name),"
            "payment_method:silim_meio_pgto_id(name),"
            "branch:branch_id(name),"
            "status:status_id(name)"
        ).order('created_at', desc=True)
        
        # Aplica filtros condicionalmente
        if company_id:
            query = query.eq('company_id', company_id)
        if status_id:
            query = query.eq('status_id', status_id)
        if start_date:
            query = query.gte('created_at', start_date)
        if end_date:
            # Adiciona horário de fim do dia para end_date
            end_date_with_time = f"{end_date}T23:59:59"
            query = query.lte('created_at', end_date_with_time)
        
        result = query.execute()
        
        return JSONResponse(content={
            "success": True,
            "data": result.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar solicitações: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar solicitações: {str(e)}")

@router.post("/requests")
async def create_credit_limit_request(request: Request, current_user: str = Depends(verify_token)):
    """Cria uma nova solicitação de limite de crédito"""
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        request_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Criando nova solicitação de limite de crédito")
        
        result = supabase.table('credit_limit_request').insert([request_data]).execute()
        
        if result.data:
            return JSONResponse(content={
                "success": True,
                "data": result.data[0]
            })
        else:
            raise HTTPException(status_code=400, detail="Erro ao criar solicitação")
            
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao criar solicitação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar solicitação: {str(e)}")

@router.put("/requests/{request_id}")
async def update_credit_limit_request(request_id: int, request: Request, current_user: str = Depends(verify_token)):
    """Atualiza uma solicitação existente"""
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        request_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Atualizando solicitação {request_id}")
        
        result = supabase.table('credit_limit_request').update(request_data).eq('id', request_id).execute()
        
        if result.data:
            return JSONResponse(content={
                "success": True,
                "data": result.data[0]
            })
        else:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")
            
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao atualizar solicitação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar solicitação: {str(e)}")

@router.delete("/requests/{request_id}")
async def delete_credit_limit_request(request_id: int, current_user: str = Depends(verify_token)):
    """Deleta uma solicitação"""
    try:
        supabase = get_supabase()
        
        logger.info(f"Deletando solicitação {request_id}")
        
        result = supabase.table('credit_limit_request').delete().eq('id', request_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Solicitação deletada com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar solicitação: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar solicitação: {str(e)}")

@router.get("/calculated/{customer_id}")
async def get_calculated_credit_limit(customer_id: int, current_user: str = Depends(verify_token)):
    """Busca o limite calculado de crédito de um cliente"""
    try:
        supabase = get_supabase()
        
        logger.info(f"Buscando limite calculado para cliente {customer_id}")
        
        # Primeiro busca o credit_limits_id do cliente
        customer_result = supabase.table('customer').select('credit_limits_id').eq('id', customer_id).execute()
        
        if not customer_result.data:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
        customer_data = customer_result.data[0]
        credit_limits_id = customer_data.get('credit_limits_id')
        
        if not credit_limits_id:
            return JSONResponse(content={
                "success": True,
                "data": None
            })
        
        # Busca o valor calculado
        credit_limit_result = supabase.table('credit_limit_amount').select('credit_limit_calc').eq('id', credit_limits_id).execute()
        
        if not credit_limit_result.data:
            return JSONResponse(content={
                "success": True,
                "data": None
            })
        
        credit_limit_data = credit_limit_result.data[0]
        return JSONResponse(content={
            "success": True,
            "data": credit_limit_data.get('credit_limit_calc')
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar limite calculado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar limite calculado: {str(e)}")

@router.get("/dashboard")
async def get_credit_limit_dashboard(
    company_id: Optional[int] = None,
    branch_id: Optional[int] = None, current_user: str = Depends(verify_token)
):
    """Busca dados do dashboard de credit limit"""
    try:
        supabase = get_supabase()
        
        # Constrói a query
        query = supabase.table('vw_credit_limit_dashboard').select('*')
        
        if company_id:
            query = query.eq('company_id', company_id)
        
        if branch_id:
            query = query.eq('company_id', branch_id)  # Nota: no código original estava usando branch como company_id
        
        response = query.execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar dashboard de credit limit: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dashboard: {str(e)}")

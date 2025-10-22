"""
Rotas para gerenciamento de clientes
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
from typing import Optional
import logging
import json
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/customer", tags=["customer"])
logger = logging.getLogger(__name__)

@router.get("/credit-limits/{customer_id}")
async def get_customer_credit_limits(customer_id: int, current_user: str = Depends(verify_token)):
    """Busca os limites de crédito de um cliente"""
    try:
        supabase = get_supabase()
        
        if not customer_id:
            return JSONResponse(content={
                "success": True,
                "data": None
            })
        
        # Busca o credit_limits_id do cliente
        customer_result = supabase.table('customer').select('credit_limits_id').eq('id', customer_id).single().execute()
        
        if not customer_result.data or not customer_result.data.get('credit_limits_id'):
            return JSONResponse(content={
                "success": True,
                "data": {
                    "creditLimitsId": None,
                    "creditLimit": "",
                    "prepaidLimit": "",
                    "comments": ""
                }
            })
        
        credit_limits_id = customer_result.data['credit_limits_id']
        
        # Busca os dados do limite de crédito
        credit_limit_result = supabase.table('credit_limit_amount').select('*').eq('id', credit_limits_id).single().execute()
        
        if credit_limit_result.data:
            data = credit_limit_result.data
            return JSONResponse(content={
                "success": True,
                "data": {
                    "creditLimitsId": data.get('id'),
                    "creditLimit": str(data.get('credit_limit', '')),
                    "prepaidLimit": str(data.get('prepaid_limit', '')),
                    "comments": data.get('comments', '')
                }
            })
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "creditLimitsId": None,
                "creditLimit": "",
                "prepaidLimit": "",
                "comments": ""
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar limites de crédito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar limites: {str(e)}")

@router.put("/credit-limits/{customer_id}")
async def update_customer_credit_limits(customer_id: int, request: Request, current_user: str = Depends(verify_token)):
    """Atualiza os limites de crédito de um cliente"""
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        limit_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Atualizando limites de crédito para cliente {customer_id}")
        
        # Busca se o cliente já tem credit_limits_id
        customer_result = supabase.table('customer').select('credit_limits_id').eq('id', customer_id).single().execute()
        
        if customer_result.data and customer_result.data.get('credit_limits_id'):
            # Atualiza limite existente
            credit_limits_id = customer_result.data['credit_limits_id']
            result = supabase.table('credit_limit_amount').update(limit_data).eq('id', credit_limits_id).execute()
            return JSONResponse(content={
                "success": True,
                "data": result.data
            })
        else:
            # Cria novo limite
            new_limit_result = supabase.table('credit_limit_amount').insert([limit_data]).execute()
            if new_limit_result.data:
                new_limit_id = new_limit_result.data[0]['id']
                # Atualiza o cliente com o novo credit_limits_id
                supabase.table('customer').update({'credit_limits_id': new_limit_id}).eq('id', customer_id).execute()
                return JSONResponse(content={
                    "success": True,
                    "data": new_limit_result.data
                })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao atualizar limites de crédito: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar limites: {str(e)}")

@router.get("/by-company-group/{user_company_id}")
async def get_customers_by_company_group(user_company_id: int, current_user: str = Depends(verify_token)):
    """Busca clientes por grupo corporativo da empresa do usuário"""
    try:
        supabase = get_supabase()
        
        # Busca o corporate_group_id da empresa do usuário
        company_result = supabase.table('company').select('corporate_group_id').eq('id', user_company_id).single().execute()
        
        if not company_result.data or not company_result.data.get('corporate_group_id'):
            raise HTTPException(status_code=404, detail="Grupo corporativo não encontrado")
        
        corporate_group_id = company_result.data['corporate_group_id']
        
        # Busca todas as empresas do grupo
        companies_result = supabase.table('company').select('id').eq('corporate_group_id', corporate_group_id).execute()
        
        company_ids = [c['id'] for c in companies_result.data]
        
        # Busca clientes das empresas do grupo
        customers_result = supabase.table('customer').select('id, name, company_code').in_('company_id', company_ids).order('name', desc=False).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": customers_result.data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar clientes por grupo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar clientes: {str(e)}")

@router.get("/{customer_id}")
async def get_customer_by_id(customer_id: int, current_user: str = Depends(verify_token)):
    """Busca um cliente por ID"""
    try:
        supabase = get_supabase()
        
        result = supabase.table('customer').select('*').eq('id', customer_id).single().execute()
        
        return JSONResponse(content={
            "success": True,
            "data": result.data if result.data else None
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar cliente: {str(e)}")

@router.get("/")
async def list_customers(current_user: str = Depends(verify_token)):
    """Lista todos os clientes (id, name) ordenados por nome"""
    try:
        supabase = get_supabase()
        
        result = supabase.table('customer').select('id, name').order('name', desc=False).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": result.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar clientes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar clientes: {str(e)}")

@router.get("/details/{customer_id}")
async def get_customer_details(customer_id: int, current_user: str = Depends(verify_token)):
    """Busca detalhes completos de um cliente (incluindo company e address)"""
    try:
        supabase = get_supabase()
        
        result = supabase.table('customer').select("""
            id,
            name,
            company_code,
            costumer_cnpj,
            costumer_phone,
            costumer_email,
            company:company_id(id, name),
            address:addr_id(*)
        """).eq('id', customer_id).single().execute()
        
        return JSONResponse(content={
            "success": True,
            "data": result.data if result.data else None
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar detalhes: {str(e)}")

@router.get("/details-with-address/{customer_id}")
async def get_customer_details_with_address(customer_id: int, current_user: str = Depends(verify_token)):
    """Busca detalhes completos de um cliente (incluindo address) para NewLimitOrder"""
    try:
        supabase = get_supabase()
        
        result = supabase.table('customer').select("""
            id,
            name,
            company_code,
            costumer_email,
            costumer_phone,
            costumer_cnpj,
            costumer_razao_social,
            address:addr_id(*)
        """).eq('id', customer_id).single().execute()
        
        return JSONResponse(content={
            "success": True,
            "data": result.data if result.data else None
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do cliente com endereço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar detalhes: {str(e)}")

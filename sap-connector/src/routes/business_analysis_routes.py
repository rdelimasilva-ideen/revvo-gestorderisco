"""
Rotas para análise de negócios
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
from typing import Optional, List
import logging
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/business-analysis", tags=["business-analysis"])
logger = logging.getLogger(__name__)

@router.get("/user-company/{user_id}")
async def get_user_company_id(user_id: str, current_user: str = Depends(verify_token)):
    """Busca company_id do usuário logado"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('user_profile').select('company_id').eq('logged_id', user_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data.get('company_id')
            })
        else:
            return JSONResponse(content={
                "success": True,
                "data": None
            })
            
    except Exception as e:
        logger.error(f"Erro ao buscar company_id do usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados do usuário: {str(e)}")

@router.get("/corporate-group/{company_id}")
async def get_corporate_group_id(company_id: int, current_user: str = Depends(verify_token)):
    """Busca corporate_group_id da empresa"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('company').select('corporate_group_id').eq('id', company_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data.get('corporate_group_id')
            })
        else:
            return JSONResponse(content={
                "success": True,
                "data": None
            })
            
    except Exception as e:
        logger.error(f"Erro ao buscar corporate_group_id: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar grupo corporativo: {str(e)}")

@router.get("/companies-by-group/{corporate_group_id}")
async def list_companies_by_corporate_group(corporate_group_id: int, current_user: str = Depends(verify_token)):
    """Busca IDs das empresas do grupo"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('company').select('id').eq('corporate_group_id', corporate_group_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar empresas do grupo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar empresas: {str(e)}")

@router.get("/customer/{customer_id}")
async def get_customer_by_id(customer_id: int, current_user: str = Depends(verify_token)):
    """Busca dados de um cliente"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('customer').select('*').eq('id', customer_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data
            })
        else:
            return JSONResponse(content={
                "success": True,
                "data": None
            })
            
    except Exception as e:
        logger.error(f"Erro ao buscar cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados do cliente: {str(e)}")

@router.get("/address/{address_id}")
async def get_address_by_id(address_id: int, current_user: str = Depends(verify_token)):
    """Busca endereço pelo id"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('address').select('*').eq('id', address_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data
            })
        else:
            return JSONResponse(content={
                "success": True,
                "data": None
            })
            
    except Exception as e:
        logger.error(f"Erro ao buscar endereço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar endereço: {str(e)}")

@router.get("/companies-corporate-group/{corporate_group_id}")
async def get_companies_by_corporate_group(corporate_group_id: int, current_user: str = Depends(verify_token)):
    """Busca empresas do grupo por corporate_group_id"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('company').select('id').eq('corporate_group_id', corporate_group_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar empresas do grupo corporativo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar empresas: {str(e)}")

@router.get("/sales-orders")
async def get_sales_orders(
    company_ids: str,  # Comma-separated list of company IDs
    customer_id: Optional[int] = None, current_user: str = Depends(verify_token)
):
    """Busca sales orders por companyIds e opcionalmente customerId, incluindo detalhes de faturas"""
    try:
        supabase = get_supabase()
        
        # Parse comma-separated company IDs
        company_id_list = [int(id.strip()) for id in company_ids.split(',') if id.strip()]
        
        # Constrói a query para buscar os pedidos
        orders_query = supabase.table('sale_orders').select("""
            id,
            created_at,
            customer_id,
            customer:customer_id(id, name),
            total_qtt,
            total_amt,
            due_date
        """).in_('company_id', company_id_list).order('created_at', desc=True)
        
        # Aplica filtro de customer_id se fornecido
        if customer_id:
            orders_query = orders_query.eq('customer_id', customer_id)
        
        orders_result = orders_query.execute()
        orders = orders_result.data
        
        if not orders:
            return JSONResponse(content={
                "success": True,
                "data": []
            })
        
        # Busca os detalhes das faturas para os pedidos encontrados
        order_ids = [order['id'] for order in orders]
        invoices_query = supabase.table('vw_detalhes_pedidos_faturas').select("""
            numero_pedido,
            cliente_id,
            cliente_nome,
            pedido_data,
            pedido_valor,
            condicao_pagamento,
            aprovado,
            numero_fatura,
            fatura_valor,
            status_fatura,
            item_nome,
            item_qtt,
            item_price,
            num_parcela,
            parcela_valor,
            vencimento_parcela,
            status_parcela
        """).in_('numero_pedido', order_ids)
        
        invoices_result = invoices_query.execute()
        invoices = invoices_result.data
        
        # Combina os pedidos com os detalhes das faturas
        orders_with_invoices = []
        for order in orders:
            order_invoices = [invoice for invoice in invoices if invoice['numero_pedido'] == order['id']]
            orders_with_invoices.append({
                **order,
                "invoices": order_invoices
            })
        
        return JSONResponse(content={
            "success": True,
            "data": orders_with_invoices
        })
        
    except ValueError as e:
        logger.error(f"Erro ao parsear company_ids: {str(e)}")
        raise HTTPException(status_code=400, detail="company_ids deve ser uma lista de números separados por vírgula")
    except Exception as e:
        logger.error(f"Erro ao buscar sales orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar sales orders: {str(e)}")
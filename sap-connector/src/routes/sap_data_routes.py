"""
Rotas para operações SAP (Sales Orders, Invoices, etc.)
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
import logging
import json
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

router = APIRouter(prefix="/api/sap", tags=["sap"])
logger = logging.getLogger(__name__)

class TableQueryParams(BaseModel):
    table: str
    select: str = "*"
    eq: Dict[str, Any] = {}
    in_values: Dict[str, List] = {}
    gte: Dict[str, Any] = {}
    lte: Dict[str, Any] = {}
    like: Dict[str, str] = {}
    order_column: Optional[str] = None
    order_desc: bool = False
    limit: Optional[int] = None
    single: bool = False

@router.post("/query")
async def query_data(params: TableQueryParams):
    """Busca dados de uma tabela com filtros"""
    try:
        supabase = get_supabase()
        
        query = supabase.table(params.table).select(params.select)
        
        # Aplicar filtros eq (igual)
        for column, value in params.eq.items():
            query = query.eq(column, value)
        
        # Aplicar filtros in (dentro de uma lista)
        for column, values in params.in_values.items():
            query = query.in_(column, values)
        
        # Aplicar filtros gte (maior ou igual)
        for column, value in params.gte.items():
            query = query.gte(column, value)
        
        # Aplicar filtros lte (menor ou igual)
        for column, value in params.lte.items():
            query = query.lte(column, value)
        
        # Aplicar filtros like (contém)
        for column, pattern in params.like.items():
            query = query.like(column, pattern)
        
        # Aplicar ordenação
        if params.order_column:
            query = query.order(params.order_column, desc=params.order_desc)
        
        # Aplicar limite
        if params.limit:
            query = query.limit(params.limit)
        
        # Retornar resultado único se solicitado
        if params.single:
            response = query.single().execute()
        else:
            response = query.execute()
            
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar dados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados: {str(e)}")

class TableModifyParams(BaseModel):
    table: str
    data: Dict[str, Any]
    conditions: Dict[str, Any] = {}
    on_conflict: Optional[str] = None

@router.post("/insert")
async def insert_data(params: TableModifyParams):
    """Insere dados em uma tabela"""
    try:
        supabase = get_supabase()
        
        response = supabase.table(params.table).insert(params.data).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao inserir dados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao inserir dados: {str(e)}")

@router.post("/update")
async def update_data(params: TableModifyParams):
    """Atualiza dados em uma tabela com condições"""
    try:
        supabase = get_supabase()
        
        query = supabase.table(params.table).update(params.data)
        
        # Aplicar condições
        for column, value in params.conditions.items():
            query = query.eq(column, value)
        
        response = query.execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao atualizar dados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar dados: {str(e)}")

@router.post("/delete")
async def delete_data(params: TableModifyParams):
    """Remove dados de uma tabela com condições"""
    try:
        supabase = get_supabase()
        
        query = supabase.table(params.table).delete()
        
        # Aplicar condições
        for column, value in params.conditions.items():
            query = query.eq(column, value)
        
        response = query.execute()
        
        return JSONResponse(content={
            "success": True
        })
        
    except Exception as e:
        logger.error(f"Erro ao deletar dados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar dados: {str(e)}")

@router.post("/upsert")
async def upsert_data(params: TableModifyParams):
    """Insere ou atualiza dados em uma tabela"""
    try:
        supabase = get_supabase()
        
        response = supabase.table(params.table).upsert(
            params.data, 
            on_conflict=params.on_conflict or "id"
        ).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao inserir/atualizar dados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao inserir/atualizar dados: {str(e)}")

@router.post("/sales-orders/upsert")
async def upsert_sap_sales_orders(request: Request):
    """Faz upsert de pedidos de venda SAP"""
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        orders_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Fazendo upsert de {len(orders_data)} pedidos SAP")
        
        response = supabase.table('sap_sales_orders').upsert(
            orders_data, 
            on_conflict='sap_order_number'
        ).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": f"Upsert de {len(orders_data)} pedidos realizado com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao fazer upsert de pedidos SAP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upsert: {str(e)}")

@router.post("/sales-order-items/upsert")
async def upsert_sap_sales_order_items(request: Request):
    """Faz upsert de itens de pedidos de venda SAP"""
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        items_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Fazendo upsert de {len(items_data)} itens SAP")
        
        response = supabase.table('sap_sales_order_items').upsert(
            items_data,
            on_conflict='sap_order_number,item_number'
        ).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": f"Upsert de {len(items_data)} itens realizado com sucesso"
        })
        
    except Exception as e:
        logger.error(f"Erro ao fazer upsert de itens SAP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upsert: {str(e)}")

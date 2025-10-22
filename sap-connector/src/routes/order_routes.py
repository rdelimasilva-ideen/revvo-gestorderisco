"""
Rotas para gerenciamento de pedidos e faturas
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
import logging
from fastapi import Depends
from auth import verify_token

router = APIRouter(prefix="/api/orders", tags=["orders"])
logger = logging.getLogger(__name__)

@router.get("/details")
async def get_order_details(current_user: str = Depends(verify_token)):
    """Busca detalhes de pedidos e faturas"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('vw_detalhes_pedidos_faturas').select('*').order('pedido_data', desc=True).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes de pedidos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar detalhes de pedidos: {str(e)}")

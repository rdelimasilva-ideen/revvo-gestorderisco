"""
Rotas para dados de lookup (classificação, meio de pagamento, etc.)
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
import logging
from fastapi import Depends
from auth import verify_token

router = APIRouter(prefix="/api/lookup", tags=["lookup"])
logger = logging.getLogger(__name__)

@router.get("/classifications")
async def get_classifications(current_user: str = Depends(verify_token)):
    """Busca todas as classificações disponíveis"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('silim_classificacao').select('id, name').order('name').execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar classificações: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar classificações: {str(e)}")

@router.get("/payment-methods")
async def get_payment_methods(current_user: str = Depends(verify_token)):
    """Busca todos os meios de pagamento disponíveis"""
    try:
        supabase = get_supabase()
        
        response = supabase.table('silim_meio_pgto').select('id, name').order('name').execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar meios de pagamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar meios de pagamento: {str(e)}")

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from ..database.supabase_client import get_supabase
from auth import verify_token
from fastapi import Depends

router = APIRouter()

# Modelos Pydantic
class CreditLimitPolicyCreate(BaseModel):
    company_id: str
    min_amount: float
    max_amount: float
    interest_rate: Optional[float] = None
    payment_term_days: Optional[int] = None
    description: Optional[str] = None

class CreditLimitPolicyUpdate(BaseModel):
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    payment_term_days: Optional[int] = None
    description: Optional[str] = None

# ==================== ORDER DETAILS ROUTES ====================

@router.get("/order-details")
async def list_order_details(current_user: str = Depends(verify_token)):
    """
    Buscar detalhes de pedidos e faturas
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('vw_detalhes_pedidos_faturas').select('*').order('pedido_data', desc=True).execute()
        
        return response.data if response.data else []

    except Exception as e:
        print(f"Erro ao buscar detalhes de pedidos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SALES ORDERS ROUTES ====================

@router.get("/sales-orders")
async def list_sales_orders(
    company_ids: str,  # Comma-separated list of company IDs
    customer_id: Optional[str] = None, current_user: str = Depends(verify_token)
):
    """
    Buscar sales orders por companyIds e opcionalmente por customerId
    """
    try:
        supabase = get_supabase()
        
        # Convert comma-separated string to list
        company_ids_list = [id.strip() for id in company_ids.split(',') if id.strip()]
        
        if not company_ids_list:
            raise HTTPException(status_code=400, detail="company_ids é obrigatório")
        
        # Build query
        query = supabase.table('sale_orders').select(
            'id, created_at, customer_id, customer:customer_id(id, name), total_qtt, total_amt, due_date'
        ).in_('company_id', company_ids_list).order('created_at', desc=True)
        
        if customer_id:
            query = query.eq('customer_id', customer_id)
        
        response = query.execute()
        
        return response.data if response.data else []

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar sales orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CREDIT LIMIT POLICIES ROUTES ====================

@router.get("/credit-limit-policies")
async def list_credit_limit_policies(company_id: str, current_user: str = Depends(verify_token)):
    """
    Listar políticas de limite de crédito da empresa
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('credit_limit_policies').select('*').eq('company_id', company_id).order('min_amount').execute()
        
        return response.data if response.data else []

    except Exception as e:
        print(f"Erro ao buscar políticas de limite de crédito: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/credit-limit-policies")
async def create_credit_limit_policy(policy_data: CreditLimitPolicyCreate, current_user: str = Depends(verify_token)):
    """
    Criar uma nova política de limite de crédito
    """
    try:
        supabase = get_supabase()
        
        policy_dict = policy_data.model_dump()
        response = supabase.table('credit_limit_policies').insert(policy_dict).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Falha ao criar política")
        
        return {"success": True, "data": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao criar política de limite de crédito: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/credit-limit-policies/{policy_id}")
async def update_credit_limit_policy(policy_id: str, policy_data: CreditLimitPolicyUpdate, current_user: str = Depends(verify_token)):
    """
    Atualizar uma política de limite de crédito
    """
    try:
        supabase = get_supabase()
        
        # Remove None values
        policy_dict = {k: v for k, v in policy_data.model_dump().items() if v is not None}
        
        if not policy_dict:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
        
        response = supabase.table('credit_limit_policies').update(policy_dict).eq('id', policy_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Política não encontrada")
        
        return {"success": True, "data": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar política de limite de crédito: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/credit-limit-policies/{policy_id}")
async def delete_credit_limit_policy(policy_id: str, current_user: str = Depends(verify_token)):
    """
    Deletar uma política de limite de crédito
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('credit_limit_policies').delete().eq('id', policy_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Política não encontrada")
        
        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao deletar política de limite de crédito: {e}")
        raise HTTPException(status_code=500, detail=str(e))

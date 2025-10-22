from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from src.database.supabase_client import get_supabase
import logging
from datetime import datetime
from auth import verify_token
from fastapi import Depends

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# Models
class CreditLimitRequest(BaseModel):
    id: int
    created_at: str
    credit_limit_amt: Optional[float] = None
    customer_id: Optional[int] = None
    status_id: Optional[int] = None

class WorkflowSaleOrder(BaseModel):
    credit_limit_req_id: Optional[int] = None
    credit_limit_request: Optional[CreditLimitRequest] = None

class WorkflowNotification(BaseModel):
    id: int
    title: str
    message: str
    time: str
    unread: bool
    request: Optional[CreditLimitRequest] = None

# Routes
@router.get("/{user_id}", response_model=List[WorkflowNotification])
async def get_workflow_notifications(user_id: str, current_user: str = Depends(verify_token)):
    """Busca notificações de workflow para o usuário logado"""
    try:
        supabase = get_supabase()
        
        # 1. Buscar perfil do usuário para obter role_id
        user_profile_response = supabase.table('user_profile')\
            .select('id, name, role_id')\
            .eq('logged_id', user_id)\
            .single()\
            .execute()
        
        if not user_profile_response.data:
            return []
        
        user_profile = user_profile_response.data
        role_id = user_profile.get('role_id')
        
        if not role_id:
            return []
        
        # 2. Buscar workflow_details para a role do usuário
        workflow_details_response = supabase.table('workflow_details')\
            .select('''
                id,
                workflow_sale_order_id,
                approval,
                workflow_sale_order (
                    credit_limit_req_id,
                    credit_limit_request!inner (
                        id, created_at, credit_limit_amt, customer_id, status_id
                    )
                )
            ''')\
            .eq('jurisdiction_id', role_id)\
            .is_('approval', 'null')\
            .execute()
        
        if workflow_details_response.data is None:
            return []
        
        # 3. Montar notificações
        notifications = []
        for wd in workflow_details_response.data:
            workflow_sale_order = wd.get('workflow_sale_order', {})
            credit_limit_request = workflow_sale_order.get('credit_limit_request', {}) if workflow_sale_order else {}
            credit_limit_req_id = workflow_sale_order.get('credit_limit_req_id') if workflow_sale_order else None
            
            # Formatar data
            time_str = ""
            if credit_limit_request and credit_limit_request.get('created_at'):
                try:
                    created_at = datetime.fromisoformat(credit_limit_request['created_at'].replace('Z', '+00:00'))
                    time_str = created_at.strftime('%d/%m/%Y %H:%M:%S')
                except:
                    time_str = credit_limit_request.get('created_at', '')
            
            notification = {
                "id": wd.get('id'),
                "title": "Solicitação de limite pendente",
                "message": f"Solicitação #{credit_limit_req_id} de limite de crédito" if credit_limit_req_id else "Solicitação de limite de crédito",
                "time": time_str,
                "unread": True,
                "request": credit_limit_request if credit_limit_request else None
            }
            
            notifications.append(notification)
        
        return notifications
    
    except Exception as e:
        logger.error(f"Error getting workflow notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting notifications: {str(e)}")

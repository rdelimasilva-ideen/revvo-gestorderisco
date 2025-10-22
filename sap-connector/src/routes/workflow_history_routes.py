from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
import logging
from typing import List, Dict, Optional
from fastapi import Depends
from auth import verify_token

router = APIRouter(prefix="/api/workflow", tags=["workflow"])
logger = logging.getLogger(__name__)

@router.get("/history/{customer_id}")
async def get_workflow_history(customer_id: int, current_user: str = Depends(verify_token)):
    """Busca histórico completo de workflow para um cliente"""
    try:
        supabase = get_supabase()
        
        # 1. Buscar solicitações de limite de crédito
        credit_requests_response = supabase.table('credit_limit_request')\
            .select('*')\
            .eq('customer_id', customer_id)\
            .order('created_at', desc=True)\
            .execute()
            
        credit_requests = credit_requests_response.data
        
        if not credit_requests:
            return JSONResponse(content={
                "success": True,
                "data": []
            })
            
        workflow_history = []
        
        # 2. Para cada solicitação, buscar workflow e detalhes
        for request in credit_requests:
            workflow_order_response = supabase.table('workflow_sale_order')\
                .select('*')\
                .eq('credit_limit_req_id', request['id'])\
                .single()\
                .execute()
                
            workflow_order = workflow_order_response.data
            
            if not workflow_order:
                continue
                
            workflow_details_response = supabase.table('workflow_details')\
                .select("""
                    *,
                    jurisdiction:user_role (
                        name,
                        description
                    )
                """)\
                .eq('workflow_sale_order_id', workflow_order['id'])\
                .order('workflow_step', desc=False)\
                .execute()
                
            workflow_details = workflow_details_response.data
            
            # 3. Buscar aprovadores
            approver_ids = [d['approver'] for d in workflow_details if d.get('approver')]
            approver_map = {}
            
            if approver_ids:
                approvers_response = supabase.table('user_profile')\
                    .select('logged_id, name')\
                    .in_('logged_id', approver_ids)\
                    .execute()
                    
                if approvers_response.data:
                    approver_map = {a['logged_id']: a['name'] for a in approvers_response.data}
            
            # 4. Montar objeto de histórico
            history_item = {
                'id': request.get('id'),
                'created_at': request.get('created_at'),
                'credit_limit_amt': request.get('credit_limit_amt'),
                'status_id': request.get('status_id'),
                'workflow_id': workflow_order.get('id'),
                'steps': []
            }
            
            for detail in workflow_details:
                step = {
                    'id': detail.get('id'),
                    'workflow_step': detail.get('workflow_step'),
                    'approval': detail.get('approval'),
                    'notes': detail.get('notes', ''),
                    'jurisdiction': detail.get('jurisdiction', {}),
                    'approver': detail.get('approver')
                }
                
                if step['approver'] and step['approver'] in approver_map:
                    step['approver_name'] = approver_map[step['approver']]
                    
                history_item['steps'].append(step)
                
            workflow_history.append(history_item)
            
        return JSONResponse(content={
            "success": True,
            "data": workflow_history
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico de workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar histórico de workflow: {str(e)}")
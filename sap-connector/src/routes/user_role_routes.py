from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List, Optional, Union
from pydantic import BaseModel
from src.database.supabase_client import get_supabase
from auth import verify_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user-roles",
                    tags=["User Roles"],
                    dependencies=[Depends(verify_token)])

# Models
class UserRole(BaseModel):
    id: Optional[Union[str, int]] = None
    name: str
    description: Optional[str] = None
    company_id: Union[str, int]

class CreateUserRoleRequest(BaseModel):
    name: str
    description: Optional[str] = None
    company_id: Union[str, int]

class UserRoleResponse(BaseModel):
    id: Union[str, int]  # Aceita tanto string quanto int
    name: str
    description: Optional[str] = None

# Routes
@router.get("/{company_id}", response_model=List[UserRoleResponse])
async def list_roles(company_id: str, current_user: str = Depends(verify_token)):
    """Lista roles da empresa"""
    try:
        supabase = get_supabase()
        response = supabase.table('user_role')\
            .select('id, name, description')\
            .eq('company_id', company_id)\
            .order('name')\
            .execute()
        
        if response.data is None:
            return []
        
        return response.data
    
    except Exception as e:
        logger.error(f"Error listing roles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing roles: {str(e)}")

@router.post("/", response_model=dict)
async def create_role(role_data: CreateUserRoleRequest, current_user: str = Depends(verify_token)):
    """Cria uma nova role"""
    try:
        supabase = get_supabase()
        response = supabase.table('user_role')\
            .insert(role_data.model_dump())\
            .execute()
        
        if response.data is None:
            raise HTTPException(status_code=400, detail="Failed to create role")
        
        return {"success": True, "data": response.data}
    
    except Exception as e:
        logger.error(f"Error creating role: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating role: {str(e)}")
@router.get("/name/{role_id}", response_model=dict)
async def get_role_name_by_id(role_id: str, current_user: str = Depends(verify_token)):
    """Busca o nome da role pelo id"""
    try:
        supabase = get_supabase()
        response = supabase.table('user_role')\
            .select('name')\
            .eq('id', role_id)\
            .single()\
            .execute()
        
        if response.data is None:
            return {"name": ""}
        
        return {"name": response.data.get('name', '')}
    
    except Exception as e:
        logger.error(f"Error getting role name: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting role name: {str(e)}")

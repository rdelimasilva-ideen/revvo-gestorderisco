from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from src.database.supabase_client import get_supabase
from typing import Optional, Dict, Any
import logging
import json
from auth import verify_token
from fastapi import Depends

router = APIRouter(prefix="/api/company", tags=["company"])
logger = logging.getLogger(__name__)

@router.get("/{company_id}")
async def get_company_by_id(company_id: str, current_user: str = Depends(verify_token)):
    """
    Busca empresa pelo ID
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('company').select(
            '*, address:address_id(*)'
        ).eq('id', company_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data
            })
        else:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
            
    except Exception as e:
        logger.error(f"Erro ao buscar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar empresa: {str(e)}")

@router.put("/{company_id}")
async def update_company(company_id: str, request: Request, current_user: str = Depends(verify_token)):
    """
    Atualiza empresa
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        company_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Atualizando empresa {company_id} com dados: {company_data}")
        
        response = supabase.table('company').update(
            company_data
        ).eq('id', company_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Empresa atualizada com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao atualizar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar empresa: {str(e)}")

@router.post("/")
async def create_company(request: Request, current_user: str = Depends(verify_token)):
    """
    Cria empresa
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        company_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Criando empresa com dados: {company_data}")
        
        response = supabase.table('company').insert(
            company_data
        ).execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data[0]
            })
        else:
            raise HTTPException(status_code=400, detail="Erro ao criar empresa")
            
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao criar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar empresa: {str(e)}")

@router.put("/address/{address_id}")
async def update_address(address_id: str, request: Request, current_user: str = Depends(verify_token)):
    """
    Atualiza endereço
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        address_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Atualizando endereço {address_id} com dados: {address_data}")
        
        response = supabase.table('address').update(
            address_data
        ).eq('id', address_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Endereço atualizado com sucesso"
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao atualizar endereço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar endereço: {str(e)}")

@router.post("/address")
async def create_address(request: Request, current_user: str = Depends(verify_token)):
    """
    Cria endereço
    """
    try:
        supabase = get_supabase()
        
        # Obter dados do corpo da requisição
        body = await request.body()
        address_data = json.loads(body.decode('utf-8'))
        
        logger.info(f"Criando endereço com dados: {address_data}")
        
        response = supabase.table('address').insert(
            address_data
        ).execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data[0]
            })
        else:
            raise HTTPException(status_code=400, detail="Erro ao criar endereço")
            
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="JSON inválido")
    except Exception as e:
        logger.error(f"Erro ao criar endereço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar endereço: {str(e)}")

@router.get("/{company_id}/corporate-group")
async def get_corporate_group_id(company_id: str, current_user: str = Depends(verify_token)):
    """
    Busca corporate_group_id de uma empresa
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('company').select(
            'corporate_group_id'
        ).eq('id', company_id).single().execute()
        
        if response.data:
            return JSONResponse(content={
                "success": True,
                "data": response.data.get('corporate_group_id')
            })
        else:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
            
    except Exception as e:
        logger.error(f"Erro ao buscar corporate_group_id: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar corporate_group_id: {str(e)}")

@router.get("/corporate-group/{corporate_group_id}/companies")
async def list_companies_by_corporate_group(corporate_group_id: str, current_user: str = Depends(verify_token)):
    """
    Busca todas as empresas de um corporate_group_id
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('company').select(
            'id, name'
        ).eq('corporate_group_id', corporate_group_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar empresas do grupo corporativo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar empresas: {str(e)}")

@router.get("/corporate-group/{corporate_group_id}/monthly-billing")
async def get_monthly_billing(corporate_group_id: str, customer_id: Optional[str] = None, current_user: str = Depends(verify_token)):
    """
    Busca faturamento mensal por corporate_group_id e opcionalmente por customer_id
    """
    try:
        supabase = get_supabase()
        
        query = supabase.table('vw_faturamento_mensal').select(
            '*'
        ).eq('corporate_group_id', corporate_group_id)
        
        if customer_id:
            query = query.eq('customer_id', customer_id)
            
        response = query.execute()
        
        return JSONResponse(content={
            "success": True,
            "data": response.data
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar faturamento mensal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar faturamento mensal: {str(e)}")

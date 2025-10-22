"""
Rotas para gerenciamento de faturas
"""

import logging
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi import Depends
from auth import verify_token

from src.schemas.invoice_schemas import (
    InvoiceBulkRequest,
    InvoiceStatusUpdate,
    InvoiceUpdate,
    CustomerCNPJUpdate,
    InvoiceResponse
)
from src.services.invoice_service import invoice_service

router = APIRouter(prefix="/api/invoices", tags=["invoices"])
logger = logging.getLogger(__name__)


@router.post("/bulk", response_model=InvoiceResponse)
async def save_invoices(request_data: InvoiceBulkRequest, current_user: str = Depends(verify_token)):
    """
    Salva várias faturas de uma vez
    
    Args:
        request_data: Dados das faturas a serem salvas
        
    Returns:
        Resultado da operação com estatísticas
    """
    try:
        logger.info(f"Recebida solicitação para salvar {len(request_data.invoices)} faturas")
        
        result = await invoice_service.save_invoices(request_data)
        
        return JSONResponse(content={
            "success": result.get("success", False),
            "message": f"Processadas {result.get('processed', 0)} faturas com {result.get('errors', 0)} erros",
            "data": result
        })
    except Exception as e:
        logger.error(f"Erro ao processar faturas em lote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar faturas: {str(e)}")


@router.post("/update-status", response_model=InvoiceResponse)
async def update_invoice_status(request_data: InvoiceStatusUpdate, current_user: str = Depends(verify_token)):
    """
    Atualiza o status das faturas com base nas datas de vencimento
    
    Args:
        request_data: IDs das faturas para atualizar
        
    Returns:
        Resultado da operação
    """
    try:
        logger.info(f"Recebida solicitação para atualizar status de {len(request_data.invoiceIds)} faturas")
        
        result = await invoice_service.update_invoice_status(request_data.invoiceIds)
        
        return JSONResponse(content={
            "success": result.get("success", False),
            "message": result.get("message", ""),
            "data": result
        })
    except Exception as e:
        logger.error(f"Erro ao atualizar status das faturas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status: {str(e)}")


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: str, update_data: InvoiceUpdate, current_user: str = Depends(verify_token)):
    """
    Atualiza detalhes de uma fatura específica
    
    Args:
        invoice_id: ID da fatura
        update_data: Dados a serem atualizados
        
    Returns:
        Resultado da operação
    """
    try:
        logger.info(f"Recebida solicitação para atualizar fatura {invoice_id}")
        
        result = await invoice_service.update_invoice_details(invoice_id, update_data)
        
        return JSONResponse(content={
            "success": result.get("success", False),
            "message": result.get("message", ""),
            "data": result
        })
    except Exception as e:
        logger.error(f"Erro ao atualizar detalhes da fatura {invoice_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar fatura: {str(e)}")


@router.post("/customers/update-cnpj", response_model=InvoiceResponse)
async def update_customer_cnpj(request_data: CustomerCNPJUpdate, current_user: str = Depends(verify_token)):
    """
    Atualiza o CNPJ do cliente associado a uma fatura
    
    Args:
        request_data: Dados com o invoice_id e CNPJ
        
    Returns:
        Resultado da operação
    """
    try:
        logger.info(f"Recebida solicitação para atualizar CNPJ de cliente da fatura {request_data.invoiceId}")
        
        result = await invoice_service.update_customer_cnpj(request_data.invoiceId, request_data.cnpj)
        
        return JSONResponse(content={
            "success": result.get("success", False),
            "message": result.get("message", ""),
            "data": result
        })
    except Exception as e:
        logger.error(f"Erro ao atualizar CNPJ do cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar CNPJ: {str(e)}")
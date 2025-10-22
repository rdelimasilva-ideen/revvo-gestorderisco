"""
Schemas para operações relacionadas a faturas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class InvoiceBase(BaseModel):
    """Schema base para faturas"""
    fat_id: str = Field(..., description="ID/Número da fatura")
    dt_emissao: Optional[str] = Field(None, description="Data de emissão da fatura")
    dt_vencimento: Optional[str] = Field(None, description="Data de vencimento da fatura")
    valor_orig: float = Field(..., description="Valor original da fatura")
    valor_atualiz: float = Field(..., description="Valor atualizado da fatura")
    status_id: int = Field(1, description="ID do status da fatura (1=Pendente, 2=Vencido)")
    duplicata: bool = Field(False, description="Se a fatura é uma duplicata")
    moeda: str = Field("BRL", description="Moeda da fatura")
    chave_df: Optional[str] = Field(None, description="Chave do documento fiscal (NFe)")
    tipo_df: str = Field("NF", description="Tipo do documento fiscal")
    condicoes_pagamento: Optional[str] = Field(None, description="Condições de pagamento")
    total_parcelas: int = Field(1, description="Total de parcelas")
    parcelas_qtd: int = Field(1, description="Quantidade de parcelas")
    banco: Optional[str] = Field(None, description="Banco para pagamento")
    agencia: Optional[str] = Field(None, description="Agência bancária")
    conta: Optional[str] = Field(None, description="Conta bancária")
    recebedor: Optional[str] = Field(None, description="Nome do recebedor")
    condicao_pgto: Optional[int] = Field(None, description="Condição de pagamento em dias")


class InvoiceCreate(InvoiceBase):
    """Schema para criação de faturas"""
    customer_id: int = Field(..., description="ID do cliente")
    company_id: int = Field(..., description="ID da empresa")


class InvoiceUpdate(BaseModel):
    """Schema para atualização de faturas"""
    chave_df: Optional[str] = None
    valor_orig: Optional[float] = None
    valor_atualiz: Optional[float] = None
    condicoes_pagamento: Optional[str] = None
    condicao_pgto: Optional[int] = None
    status_id: Optional[int] = None


class InvoiceBulkRequest(BaseModel):
    """Schema para operações em lote de faturas"""
    invoices: List[InvoiceCreate] = Field(..., description="Lista de faturas")


class InvoiceStatusUpdate(BaseModel):
    """Schema para atualização de status de faturas"""
    invoiceIds: List[str] = Field(..., description="Lista de IDs de faturas")


class CustomerCNPJUpdate(BaseModel):
    """Schema para atualização de CNPJ de clientes"""
    invoiceId: str = Field(..., description="ID da fatura")
    cnpj: str = Field(..., description="CNPJ do cliente")


class InvoiceResponse(BaseModel):
    """Schema para resposta de operações de fatura"""
    success: bool = Field(True, description="Indica se a operação foi bem-sucedida")
    message: Optional[str] = Field(None, description="Mensagem descritiva")
    data: Optional[Any] = Field(None, description="Dados retornados")
    errors: Optional[List[Dict[str, Any]]] = Field(None, description="Lista de erros")
    processed: Optional[int] = Field(None, description="Quantidade de registros processados")
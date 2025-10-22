from datetime import date

from pydantic import BaseModel


class InvoiceListRequest(BaseModel):
    """Modelo para requisição de lista de faturas"""

    vendor: str
    date: str
    company_code: str


class InvoiceResponse(BaseModel):
    """Modelo para representar uma fatura"""

    parcela: str
    fatura: str
    data_vencimento: date
    data_faturamento: date
    valor: float


class InvoiceRequest(BaseModel):
    """Modelo para representar uma requisição de fatura"""

    invoice_number: str

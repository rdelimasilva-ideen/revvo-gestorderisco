from typing import Any, Dict

from fastapi import HTTPException
from sap_client import call_sap
from src.schemas.bank import BankRequest
from src.schemas.invoice import InvoiceListRequest, InvoiceRequest
from src.services.sap_converter import (
    bank_request_to_sap,
    bupa_tax_detail_to_sap,
    cadastro_bancario_to_sap,
    check_bank_exists,
    document_change_to_sap,
    invoice_list_request_to_sap,
    invoice_request_to_sap,
    parse_bupa_tax_detail_response,
    sap_bank_data_to_model,
    sap_invoice_list_to_model,
    sap_invoice_to_model,
    vendor_update_to_sap,
)


async def get_invoice_list(vendor: str, company_code: str, date: str):
    invoice_list_request = InvoiceListRequest(vendor=vendor, company_code=company_code, date=date)
    sap_data = invoice_list_request_to_sap(invoice_list_request)
    sap_response = await call_sap("ZBAPI_AP_ACC_GETOPENITEMS", sap_data)
    invoices = sap_invoice_list_to_model(sap_response)
    return invoices


async def get_invoice_details(invoice_number: str):
    invoice_request = InvoiceRequest(invoice_number=invoice_number)
    sap_data = invoice_request_to_sap(invoice_request)
    sap_response = await call_sap("ZBAPI_AP_ACC_GETINVOICEDETAILS", sap_data)
    invoice_detail = sap_invoice_to_model(sap_response)
    return invoice_detail


async def get_bank_data(vendor: str):
    bank_request = BankRequest(vendor=vendor)
    sap_data = bank_request_to_sap(bank_request)
    sap_response = await call_sap("ZFIN_AP_AR_GET_BANK", sap_data)
    bank_data = sap_bank_data_to_model(sap_response)
    return bank_data


async def update_bank_data_flow(
    cnpj: str = "",
    codigo_fornecedor_antigo: str = "",
    dados_bancarios: Dict[str, Any] = {},
    documento: Dict[str, Any] = {},
) -> Dict[str, Any]:
    try:
        bupa_data = {}

        if cnpj:
            payload_bupa = bupa_tax_detail_to_sap(cnpj)
            response_bupa = await call_sap("ZBAPI_BUPA_TAX_PAR_GET_DETAIL", payload_bupa)
            bupa_data = parse_bupa_tax_detail_response(response_bupa)

            if not bupa_data.get("fornecedor_codigo"):
                raise HTTPException(
                    status_code=404,
                    detail="Fornecedor não encontrado para o CNPJ informado",
                )

            codigo_fornecedor = bupa_data.get("fornecedor_codigo")

        else:
            raise HTTPException(status_code=400, detail="CNPJ ou código do fornecedor é obrigatório")

        codigo_fornecedor = codigo_fornecedor.zfill(10)
        print(codigo_fornecedor)

        should_create_bank = True
        if bupa_data and dados_bancarios:
            existing_banks = bupa_data.get("dados_bancarios", [])
            print(existing_banks)
            should_create_bank = not check_bank_exists(existing_banks, dados_bancarios)

        cadastro_result = {"success": False, "skipped": False}
        if should_create_bank and dados_bancarios:
            cadastro_result = await cadastrar_dados_bancarios(codigo_fornecedor, dados_bancarios)
            if not cadastro_result.get("success"):
                raise HTTPException(status_code=500, detail="Erro ao cadastrar dados bancários")
        elif not dados_bancarios:
            cadastro_result = {
                "success": True,
                "skipped": True,
                "message": "Dados bancários não informados",
            }
        else:
            cadastro_result = {
                "success": True,
                "skipped": True,
                "message": "Dados bancários já existem",
            }

        vendor_update_result = await atualizar_fornecedor(
            codigo_fornecedor_antigo,
            codigo_fornecedor,
            documento.get("company_code", "1000"),
        )
        if not vendor_update_result.get("success"):
            raise HTTPException(status_code=500, detail="Erro ao atualizar fornecedor")

        document_change_result = {
            "success": True,
            "skipped": True,
            "message": "Documento não informado",
        }
        if documento.get("document_number"):
            document_change_result = await alterar_documento(documento, codigo_fornecedor)
            if not document_change_result.get("success"):
                raise HTTPException(status_code=500, detail="Erro ao alterar documento")

        return {
            "success": True,
            "message": "Negociação comunicada com sucesso",
            "codigo_fornecedor": codigo_fornecedor_antigo,
            "novo_recebedor": codigo_fornecedor,
            "dados_fornecedor": (
                bupa_data
                if bupa_data
                else {
                    "fornecedor_codigo": codigo_fornecedor_antigo,
                    "dados_bancarios": [],
                }
            ),
            "etapas": {
                "validacao_fornecedor": {
                    "success": True,
                    "codigo": codigo_fornecedor_antigo,
                    "fonte": "CNPJ" if cnpj else "Código direto",
                },
                "cadastro_bancario": cadastro_result,
                "atualizacao_fornecedor": vendor_update_result,
                "alteracao_documento": document_change_result,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processo: {str(e)}")


async def cadastrar_dados_bancarios(codigo_fornecedor: str, dados_bancarios: Dict[str, Any]) -> Dict[str, Any]:
    payload = cadastro_bancario_to_sap(codigo_fornecedor, dados_bancarios)

    try:
        response = await call_sap("ZCADASTRA_DADOS_BANC", payload)

        if isinstance(response, list):
            response = response[0] if response else {}

        if response:
            return {
                "success": True,
                "message": "Dados bancários cadastrados",
                "response": response,
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao cadastrar dados bancários: {str(e)}",
        }

    return {"success": False, "message": "Erro ao cadastrar dados bancários"}


async def atualizar_fornecedor(
    codigo_fornecedor: str, novo_recebedor: str, company_code: str = "1000"
) -> Dict[str, Any]:
    payload = vendor_update_to_sap(codigo_fornecedor, novo_recebedor, company_code)

    try:
        response = await call_sap("ZVENDOR_UPDATE", payload)

        if isinstance(response, list):
            response = response[0] if response else {}

        if response:
            return {
                "success": True,
                "message": "Fornecedor atualizado",
                "response": response,
            }
    except Exception as e:
        return {"success": False, "message": f"Erro ao atualizar fornecedor: {str(e)}"}

    return {"success": False, "message": "Erro ao atualizar fornecedor"}


async def alterar_documento(documento: Dict[str, Any], novo_fornecedor: str) -> Dict[str, Any]:
    payload = document_change_to_sap(documento, novo_fornecedor)

    try:
        response = await call_sap("ZFI_DOCUMENT_CHANGE", payload)

        if isinstance(response, list):
            response = response[0] if response else {}

        if response:
            return {
                "success": True,
                "message": "Documento alterado",
                "response": response,
            }
    except Exception as e:
        return {"success": False, "message": f"Erro ao alterar documento: {str(e)}"}

    return {"success": False, "message": "Erro ao alterar documento"}

from typing import Any, Dict, List

from src.schemas.bank import BankResponse
from src.schemas.invoice import InvoiceResponse


def invoice_list_request_to_sap(invoice_list_request):
    return {
        "COMPANYCODE": invoice_list_request.company_code,
        "VENDOR": invoice_list_request.vendor.zfill(10),
        "KEYDATE": invoice_list_request.date,
    }


def sap_invoice_list_to_model(sap_invoice_list):
    sap_invoice_list = sap_invoice_list.get("ZBAPI_AP_ACC_GETOPENITEMS.Response", {})
    value = sap_invoice_list.get("T_ITEMS", {}).get("item", [])
    return_value = list()
    if isinstance(value, dict):
        value = [value]
    for item in value:
        return_value.append(
            InvoiceResponse(
                parcela=item.get("ITEM_NUM"),
                fatura=item.get("DOC_NO"),
                data_vencimento=item.get("PSTNG_DATE"),
                data_faturamento=item.get("FDTAG"),
                valor=item.get("AMOUNT"),
            )
        )
    return return_value


def invoice_request_to_sap(invoice_request):
    return {"INVOICE_NUMBER": invoice_request.invoice_number}


def sap_invoice_to_model(sap_invoice):
    sap_invoice = sap_invoice.get("ZBAPI_AP_ACC_GETINVOICEDETAILS.Response", {})
    item = sap_invoice.get("T_ITEMS", {}).get("item", {})
    return InvoiceResponse(
        parcela=item.get("ITEM_NUM"),
        fatura=item.get("DOC_NO"),
        data_vencimento=item.get("PSTNG_DATE"),
        data_faturamento=item.get("FDTAG"),
        valor=item.get("AMOUNT"),
    )


def bank_request_to_sap(bank_request):
    return {"I_KOART": "K", "I_ACCOUNT": bank_request.vendor.zfill(10)}


def sap_bank_data_to_model(sap_bank_data):
    sap_bank_data = sap_bank_data.get("ZFIN_AP_AR_GET_BANK.Response", {})
    bank_data_item = sap_bank_data.get("E_BANKDATA", {}).get("item", {})
    bnka_item = sap_bank_data.get("E_BNKA", {}).get("item", {})
    return BankResponse(
        bank_name=bnka_item.get("BANKA"),
        account_number=bank_data_item.get("BANKN"),
        account_digit=bank_data_item.get("BKONT"),
    )


def format_bank_key(banco: str, agencia: str) -> str:
    banco_code = str(banco).zfill(4) if len(str(banco)) == 3 else str(banco).zfill(4)
    agencia_code = str(agencia).zfill(4)
    return f"{banco_code}{agencia_code}"


def cadastro_bancario_to_sap(vendor_code: str, bank_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "IV_PARTNER": vendor_code.zfill(10),
        "IV_KUNNR": "",
        "IV_LIFNR": "",
        "IS_BANKDETAIL": {
            "BANK_CTRY": "BR",
            "BANK_KEY": format_bank_key(bank_data.get("banco", ""), bank_data.get("agencia", "")),
            "BANK_ACCT": str(bank_data.get("conta", "")),
            "CTRL_KEY": "31",
            "BKVID": "01",
        },
    }


def vendor_update_to_sap(vendor_code: str, new_receiver: str, company_code: str = "1000") -> Dict[str, Any]:
    return {
        "I_ZLFA1": {"LIFNR": vendor_code.zfill(10)},
        "I_ZLFB1": {"LIFNR": vendor_code.zfill(10), "BUKRS": company_code},
        "T_XLFZA": {
            "item": [
                {
                    "LIFNR": vendor_code.zfill(10),
                    "BUKRS": company_code,
                    "EMPFK": new_receiver.zfill(10),
                    "K": "I",
                }
            ]
        },
    }


def document_change_to_sap(document_data: Dict[str, Any], new_vendor: str) -> Dict[str, Any]:
    return {
        "I_BUZEI": document_data.get("line_item", "001"),
        "I_BUKRS": document_data.get("company_code", "1000"),
        "I_BELNR": document_data.get("document_number", ""),
        "I_GJAHR": document_data.get("fiscal_year", "2025"),
        "T_ACCCHG": {"item": [{"FDNAME": "EMPFB", "OLDVAL": "", "NEWVAL": new_vendor.zfill(10)}]},
    }


def vendor_search_to_sap(search_term: str) -> Dict[str, Any]:
    search_term = search_term.strip()
    if search_term.isdigit() and len(search_term) in [11, 14]:
        return {"I_CNPJ": search_term}
    else:
        return {"I_NAME": search_term.upper()}


def parse_vendor_search_response(sap_response: Dict[str, Any]) -> List[Dict[str, Any]]:
    if isinstance(sap_response, list):
        sap_response = sap_response[0] if sap_response else {}

    response = sap_response.get("BBP_VENDOR_GETLIST.Response", {})
    items = response.get("T_VENDORS", {}).get("item", [])

    if isinstance(items, dict):
        items = [items]

    vendors = []
    for item in items:
        vendors.append(
            {
                "codigo": item.get("LIFNR", ""),
                "nome": item.get("NAME1", ""),
                "cnpj": item.get("STCD1", ""),
                "cidade": item.get("ORT01", ""),
            }
        )
    return vendors


def parse_bank_validation_response(sap_response: Dict[str, Any]) -> Dict[str, Any]:
    response = sap_response.get("ZFIN_AP_AR_GET_BANK.Response", {})
    bank_data = response.get("E_BANKDATA", {}).get("item", {})

    if bank_data:
        banks = bank_data.get("BANKS", "")
        bankl = bank_data.get("BANKL", "")

        banco = bankl[:4] if len(bankl) >= 4 else banks
        agencia = bankl[4:8] if len(bankl) >= 8 else ""

        return {
            "exists": True,
            "banco": banco,
            "agencia": agencia,
            "conta": bank_data.get("BANKN", ""),
            "digito": bank_data.get("BKONT", ""),
        }
    return {"exists": False}


def parse_open_items_response(sap_response: Dict[str, Any]) -> List[Dict[str, Any]]:
    response = sap_response.get("ZBAPI_AP_ACC_GETOPENITEMS.Response", {})
    items = response.get("T_ITEMS", {}).get("item", [])

    if isinstance(items, dict):
        items = [items]

    open_items = []
    for item in items:
        open_items.append(
            {
                "documento": item.get("DOC_NO", ""),
                "item": item.get("ITEM_NUM", ""),
                "data_vencimento": item.get("PSTNG_DATE", ""),
                "valor": item.get("AMOUNT", 0),
                "moeda": item.get("CURRENCY", "BRL"),
                "empresa": item.get("COMP_CODE", ""),
                "exercicio": item.get("FISC_YEAR", ""),
            }
        )
    return open_items


def bupa_tax_detail_to_sap(cnpj: str) -> Dict[str, Any]:
    cnpj_limpo = cnpj.replace(".", "").replace("-", "").replace("/", "")
    return {"TAXNUMBER": cnpj_limpo, "KOART": "K"}


def parse_bupa_tax_detail_response(sap_response: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(sap_response, list):
        sap_response = sap_response[0] if sap_response else {}

    response = sap_response.get("ZBAPI_BUPA_TAX_PAR_GET_DETAIL.Response", {})

    partner_info = response.get("PARTNER_ARRAY", {}).get("item", {})

    bank_data_raw = response.get("E_BANKDATA", "")
    bank_names_raw = response.get("E_BNKA", "")

    if isinstance(bank_data_raw, str) and bank_data_raw == "":
        bank_data_items = []
    elif isinstance(bank_data_raw, dict):
        bank_data_items = bank_data_raw.get("item", [])
        if isinstance(bank_data_items, dict):
            bank_data_items = [bank_data_items]
    elif isinstance(bank_data_raw, list):
        bank_data_items = bank_data_raw
    else:
        bank_data_items = []

    if isinstance(bank_names_raw, str) and bank_names_raw == "":
        bank_names_items = []
    elif isinstance(bank_names_raw, dict):
        bank_names_items = bank_names_raw.get("item", [])
        if isinstance(bank_names_items, dict):
            bank_names_items = [bank_names_items]
    elif isinstance(bank_names_raw, list):
        bank_names_items = bank_names_raw
    else:
        bank_names_items = []

    parsed_banks = []
    for i, bank_item in enumerate(bank_data_items):
        bankl = bank_item.get("BANKL", "")
        banco = bankl[:4] if len(bankl) >= 4 else bankl[:3] if bankl else ""
        agencia = bankl[4:8] if len(bankl) >= 8 else bankl[3:] if len(bankl) > 3 else ""

        bank_name = ""
        if i < len(bank_names_items):
            bank_name = bank_names_items[i].get("BANKA", "")

        parsed_banks.append(
            {
                "banco": banco,
                "agencia": agencia,
                "conta": bank_item.get("BANKN", ""),
                "digito": bank_item.get("BKONT", ""),
                "nome_banco": bank_name,
                "bankl": bankl,
            }
        )

    return {
        "fornecedor_codigo": partner_info.get("PARTNER", ""),
        "tax_type": partner_info.get("TAX_TYPE", ""),
        "cnpj": response.get("E_STCD1", ""),
        "dados_bancarios": parsed_banks,
    }


def check_bank_exists(existing_banks: List[Dict[str, Any]], new_bank: Dict[str, Any]) -> bool:
    if not existing_banks or not new_bank:
        return False

    if not isinstance(new_bank, dict):
        return False

    banco_novo = str(new_bank.get("banco", "")).zfill(4) if new_bank.get("banco") else ""
    agencia_nova = str(new_bank.get("agencia", "")).zfill(4) if new_bank.get("agencia") else ""
    conta_nova = str(new_bank.get("conta", ""))

    for bank in existing_banks:
        if not isinstance(bank, dict):
            continue

        banco_existente = str(bank.get("banco", "")).zfill(4) if bank.get("banco", "") else ""
        agencia_existente = str(bank.get("agencia", "")).zfill(4) if bank.get("agencia", "") else ""
        conta_existente = str(bank.get("conta", ""))

        if banco_existente == banco_novo and agencia_existente == agencia_nova and conta_existente == conta_nova:
            return True
    return False

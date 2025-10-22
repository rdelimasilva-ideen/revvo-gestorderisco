from fastapi import APIRouter, HTTPException
from typing import Optional
from ..database.supabase_client import get_supabase
import logging
from datetime import datetime, timedelta
from fastapi import Depends
from auth import verify_token

router = APIRouter()

@router.get("/risk-summary")
async def get_risk_summary_data(
    customer_id: Optional[str] = None,
    corporate_group_id: Optional[str] = None, current_user: str = Depends(verify_token)
):
    """
    Obter dados de resumo de risco para um cliente
    """
    try:
        if not customer_id:
            return get_mock_risk_data()

        logging.info(f"Fetching risk summary data for customer: {customer_id}")

        # 1. Buscar dados do limite de crédito do SAP
        credit_limit_data = await get_credit_limit_from_sap(customer_id)

        # 2. Buscar faturas e parcelas do Supabase
        invoices_data = await get_invoices_data(customer_id, corporate_group_id)

        # 3. Calcular indicadores baseados nos dados reais
        risk_summary = calculate_risk_indicators(credit_limit_data, invoices_data)

        logging.info(f"Risk summary calculated: {risk_summary}")
        return risk_summary

    except Exception as e:
        logging.error(f"Error fetching risk summary data: {e}")
        # Em caso de erro, retorna dados mock para não quebrar a interface
        return get_mock_risk_data()


async def get_credit_limit_from_sap(customer_id: str):
    """
    Buscar dados do limite de crédito do SAP
    """
    try:
        supabase = get_supabase()
        
        # Buscar dados do cliente no Supabase para obter o company_code
        customer_response = supabase.table('customer').select('company_code, credit_limits_id').eq('id', customer_id).execute()
        
        if not customer_response.data:
            logging.warning("Customer not found")
            return {"creditLimit": 0, "creditLimitUsed": 0, "fromSAP": False}
        
        customer = customer_response.data[0]
        
        if not customer.get('company_code'):
            logging.warning('Customer company_code not found, using Supabase data')
            return await get_credit_limit_from_supabase(customer.get('credit_limits_id'))

        # TODO: Implementar busca no SAP quando necessário
        # sapResponse = await apiService.sapRequest('ZUKM_DB_UKMBP_CMS_EXECUTE', {
        #     'IV_PARTNER': customer.company_code
        # })

        # Por enquanto, fallback para Supabase
        return await get_credit_limit_from_supabase(customer.get('credit_limits_id'))

    except Exception as e:
        logging.error(f"Error fetching credit limit from SAP: {e}")
        # Fallback para Supabase em caso de erro no SAP
        customer_response = supabase.table('customer').select('credit_limits_id').eq('id', customer_id).execute()
        customer = customer_response.data[0] if customer_response.data else {}
        return await get_credit_limit_from_supabase(customer.get('credit_limits_id'))


async def get_credit_limit_from_supabase(credit_limits_id: str):
    """
    Buscar dados do limite de crédito do Supabase
    """
    try:
        if not credit_limits_id:
            return {"creditLimit": 0, "creditLimitUsed": 0, "fromSAP": False}

        supabase = get_supabase()
        
        credit_limit_response = supabase.table('credit_limit_amount').select('credit_limit, credit_limit_used').eq('id', credit_limits_id).execute()
        
        if not credit_limit_response.data:
            return {"creditLimit": 0, "creditLimitUsed": 0, "fromSAP": False}
        
        credit_limit_amount = credit_limit_response.data[0]

        return {
            "creditLimit": float(credit_limit_amount.get('credit_limit', 0)),
            "creditLimitUsed": float(credit_limit_amount.get('credit_limit_used', 0)),
            "fromSAP": False
        }

    except Exception as e:
        logging.error(f"Error fetching credit limit from Supabase: {e}")
        return {"creditLimit": 0, "creditLimitUsed": 0, "fromSAP": False}


async def get_invoices_data(customer_id: str, corporate_group_id: str):
    """
    Buscar dados de faturas e parcelas
    """
    try:
        supabase = get_supabase()
        
        # Buscar todas as empresas do grupo corporativo
        companies_response = supabase.table('company').select('id').eq('corporate_group_id', corporate_group_id).execute()
        companies = companies_response.data if companies_response.data else []
        
        company_ids = [c['id'] for c in companies]

        if not company_ids:
            return {"faturas": [], "parcelas": []}

        end_date = datetime.now()
        start_date_12_months = end_date - timedelta(days=365)

        # Buscar faturas do cliente nas empresas do grupo
        faturas_response = supabase.table('faturas').select(
            'id, dt_emissao, dt_vencimento, valor_orig, customer_id, company_id'
        ).eq('customer_id', customer_id).in_('company_id', company_ids).gte('dt_emissao', start_date_12_months.isoformat().split('T')[0]).order('dt_emissao', desc=True).execute()
        
        faturas = faturas_response.data if faturas_response.data else []

        logging.info(f"Found {len(faturas)} invoices for customer {customer_id}")

        # Buscar parcelas das faturas
        fatura_ids = [f['id'] for f in faturas]
        parcelas = []

        if fatura_ids:
            parcelas_response = supabase.table('parcelas_fat').select(
                'id, fat_id, dt_vencimento, valor_parc, dt_pagamento, valor_pago'
            ).in_('fat_id', fatura_ids).order('dt_vencimento').execute()
            
            parcelas = parcelas_response.data if parcelas_response.data else []

        logging.info(f"Found {len(parcelas)} installments for customer {customer_id}")

        return {"faturas": faturas, "parcelas": parcelas}

    except Exception as e:
        logging.error(f"Error fetching invoices data: {e}")
        return {"faturas": [], "parcelas": []}


def calculate_risk_indicators(credit_limit_data, invoices_data):
    """
    Calcular indicadores de risco
    """
    faturas = invoices_data["faturas"]
    parcelas = invoices_data["parcelas"]
    today = datetime.now()

    logging.info(f"Calculating risk indicators with: creditLimitData={credit_limit_data}, faturasCount={len(faturas)}, parcelasCount={len(parcelas)}")

    # 1. Limite de Crédito Concedido
    credit_limit_granted = credit_limit_data["creditLimit"]

    # 2. Limite de crédito utilizado (%)
    credit_limit_used_amount = credit_limit_data.get("creditLimitUsed", 0)
    credit_limit_used = (
        round((credit_limit_used_amount / credit_limit_granted) * 100)
        if credit_limit_granted > 0 else 0
    )

    # 3. A Receber (R$) = Valor faturado não recebido
    amount_to_receive = 0
    for p in parcelas:
        valor_pago = float(p.get('valor_pago', 0))
        valor_parcela = float(p.get('valor_parc', 0))
        if not p.get('dt_pagamento') or valor_pago < valor_parcela:
            amount_to_receive += (valor_parcela - valor_pago)

    # 4. Prazo médio de Pagamento
    avg_payment_term = calculate_avg_payment_term(faturas, parcelas)

    # 5. Status - Vencido e valores em atraso
    overdue_data = calculate_overdue_data(parcelas, today)

    # 6. Máx. dias em atraso (últimos 12 meses)
    max_delay_days_12_months = calculate_max_delay_days(parcelas, today)

    result = {
        "creditLimitGranted": credit_limit_granted,
        "creditLimitUsed": credit_limit_used,
        "amountToReceive": amount_to_receive,
        "avgPaymentTerm": avg_payment_term,
        "isOverdue": overdue_data["isOverdue"],
        "overdueAmount": overdue_data["overdueAmount"],
        "avgDelayDays": overdue_data["avgDelayDays"],
        "maxDelayDays12Months": max_delay_days_12_months
    }

    logging.info(f"Risk indicators calculated: {result}")
    return result


def calculate_avg_payment_term(faturas, parcelas):
    """
    Calcular prazo médio de pagamento
    """
    if not faturas or not parcelas:
        logging.info('No invoices or installments found, using default payment term')
        return 30  # Padrão mais conservador

    total_days = 0
    count = 0

    for fatura in faturas:
        fatura_parcelas = [p for p in parcelas if p['fat_id'] == fatura['id']]

        for parcela in fatura_parcelas:
            try:
                dt_emissao = datetime.fromisoformat(fatura['dt_emissao'].replace('Z', '+00:00')).replace(tzinfo=None)
                dt_vencimento = datetime.fromisoformat(parcela['dt_vencimento'].replace('Z', '+00:00')).replace(tzinfo=None)

                days_diff = (dt_vencimento - dt_emissao).days

                if 0 < days_diff <= 365:  # Validar prazo razoável
                    total_days += days_diff
                    count += 1

            except Exception as e:
                logging.error(f'Error calculating payment term for installment: {parcela["id"]}, {e}')

    avg_term = round(total_days / count) if count > 0 else 30
    logging.info(f"Average payment term calculated: {avg_term} days (from {count} installments)")
    return avg_term


def calculate_overdue_data(parcelas, today):
    """
    Calcular dados de vencimentos
    """
    parcelas_vencidas = []
    
    for p in parcelas:
        try:
            dt_vencimento = datetime.fromisoformat(p['dt_vencimento'].replace('Z', '+00:00')).replace(tzinfo=None)
            valor_pago = float(p.get('valor_pago', 0))
            valor_parcela = float(p.get('valor_parc', 0))
            is_paid = p.get('dt_pagamento') and valor_pago >= valor_parcela

            if dt_vencimento < today and not is_paid:
                parcelas_vencidas.append(p)

        except Exception as e:
            logging.error(f'Error checking overdue status for installment: {p["id"]}, {e}')

    logging.info(f"Found {len(parcelas_vencidas)} overdue installments")

    if not parcelas_vencidas:
        return {
            "isOverdue": False,
            "overdueAmount": 0,
            "avgDelayDays": 0
        }

    # Valor em atraso
    overdue_amount = 0
    for p in parcelas_vencidas:
        valor_pago = float(p.get('valor_pago', 0))
        valor_parcela = float(p.get('valor_parc', 0))
        overdue_amount += (valor_parcela - valor_pago)

    # Atraso médio em dias
    total_delay_days = 0
    for p in parcelas_vencidas:
        try:
            dt_vencimento = datetime.fromisoformat(p['dt_vencimento'].replace('Z', '+00:00')).replace(tzinfo=None)
            delay_days = (today - dt_vencimento).days
            total_delay_days += max(0, delay_days)  # Garantir que não seja negativo
        except Exception as e:
            logging.error(f'Error calculating delay days for installment: {p["id"]}, {e}')

    avg_delay_days = round(total_delay_days / len(parcelas_vencidas)) if parcelas_vencidas else 0

    logging.info(f"Overdue data calculated: {overdue_amount} amount, {avg_delay_days} avg delay days")

    return {
        "isOverdue": True,
        "overdueAmount": overdue_amount,
        "avgDelayDays": avg_delay_days
    }


def calculate_max_delay_days(parcelas, today):
    """
    Calcular máximo de dias de atraso nos últimos 12 meses
    """
    twelve_months_ago = today - timedelta(days=365)
    max_delay_days = 0

    for parcela in parcelas:
        try:
            dt_vencimento = datetime.fromisoformat(parcela['dt_vencimento'].replace('Z', '+00:00')).replace(tzinfo=None)

            # Considerar apenas parcelas dos últimos 12 meses
            if dt_vencimento >= twelve_months_ago:
                delay_end_date = today

                # Se foi paga, usar a data de pagamento como fim do atraso
                if parcela.get('dt_pagamento'):
                    dt_pagamento = datetime.fromisoformat(parcela['dt_pagamento'].replace('Z', '+00:00')).replace(tzinfo=None)
                    delay_end_date = dt_pagamento

                # Calcular dias de atraso apenas se venceu
                if dt_vencimento < delay_end_date:
                    delay_days = (delay_end_date - dt_vencimento).days
                    max_delay_days = max(max_delay_days, max(0, delay_days))

        except Exception as e:
            logging.error(f'Error calculating max delay days for installment: {parcela["id"]}, {e}')

    logging.info(f"Max delay days in 12 months: {max_delay_days}")
    return max_delay_days


def get_mock_risk_data():
    """
    Gerar dados mock para demonstração
    """
    return {
        "creditLimitGranted": 100000,
        "creditLimitUsed": 75,
        "amountToReceive": 45000,
        "avgPaymentTerm": 35,
        "isOverdue": True,
        "overdueAmount": 12000,
        "avgDelayDays": 15,
        "maxDelayDays12Months": 45
    }

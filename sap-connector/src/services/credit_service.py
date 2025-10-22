import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException
from sap_client import call_sap
from src.schemas.credit import (
    BatchCalculationRequest,
    BatchCalculationResponse,
    CreditCalculationRequest,
    CreditMetrics,
    CreditScoreResponse,
    GlobalStatistics,
    KSCalculationResponse,
    KSDecile,
    ModelParameters,
    ModelWeights,
    StandardizedMetrics,
)
from src.schemas.dashboard import DashboardResponse, HighlightIndicators, MonthlyMetric


async def get_customer_data_from_sap(customer: str, company_code: str, reference_date: Optional[str] = None) -> Dict:
    if reference_date:
        key_date = reference_date
    else:
        key_date = datetime.now().strftime("%Y%m%d")

    payload = {
        "COMPANYCODE": company_code,
        "CUSTOMER": customer.zfill(10),
        "KEYDATE": key_date,
    }

    try:
        response = await call_sap("ZBAPI_AR_ACC_GETOPENITEMS_V2", payload)
        return parse_sap_data(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching SAP data: {str(e)}")


def parse_sap_data(response: Dict) -> Dict:
    items = response.get("ZBAPI_AR_ACC_GETOPENITEMS_V2.Response", {}).get("T_ITEMS", {}).get("item", [])

    if isinstance(items, dict):
        items = [items]

    now = datetime.now()
    three_months_ago = now - timedelta(days=90)
    twelve_months_ago = now - timedelta(days=365)

    purchase_count = 0
    total_value = 0
    payment_terms = []
    delays = []
    overdue_values = []

    for item in items:
        try:
            doc_date_str = item.get("DOC_DATE", "")
            due_date_str = item.get("FKDATE", "")

            if not doc_date_str or not due_date_str:
                continue

            doc_date = datetime.strptime(doc_date_str, "%Y%m%d")
            due_date = datetime.strptime(due_date_str, "%Y%m%d")
            amount = float(item.get("AMOUNT", 0))

            if doc_date >= three_months_ago:
                purchase_count += 1
                total_value += amount
                payment_term = (due_date - doc_date).days
                payment_terms.append(payment_term)

            if doc_date >= twelve_months_ago:
                payment_date_str = item.get("PAYMENT_DATE")
                if payment_date_str:
                    payment_date = datetime.strptime(payment_date_str, "%Y%m%d")
                    delay = max(0, (payment_date - due_date).days)
                else:
                    if due_date < now:
                        delay = (now - due_date).days
                    else:
                        delay = 0

                if delay > 0:
                    delays.append(delay)
                    if doc_date >= three_months_ago:
                        overdue_values.append(amount)

        except (ValueError, TypeError):
            continue

    hc = purchase_count
    vc = total_value / max(purchase_count, 1)
    pp = sum(payment_terms) / len(payment_terms) if payment_terms else 0
    in_ = sum(delays) / len(delays) if delays else 0
    va = sum(overdue_values) / len(overdue_values) if overdue_values else 0

    return {
        "hc": hc,
        "vc": vc,
        "pp": pp,
        "in": in_,
        "va": va,
    }


def parse_sap_data_with_historical(response: Dict) -> Dict:
    items = response.get("ZBAPI_AR_ACC_GETOPENITEMS_V2.Response", {}).get("T_ITEMS", {}).get("item", [])

    if isinstance(items, dict):
        items = [items]

    now = datetime.now()
    now - timedelta(days=365)
    thirteen_months_ago = now - timedelta(days=395)

    monthly_data = {}
    all_delays = []
    unpaid_amounts = []

    for i in range(13):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        monthly_data[month_key] = {
            "billing_amount": 0,
            "payment_terms": [],
            "purchase_count": 0,
            "delays": [],
            "overdue_amounts": [],
        }

    for item in items:
        try:
            doc_date_str = item.get("DOC_DATE", "")
            due_date_str = item.get("FKDATE", "")
            amount_str = item.get("AMOUNT_SGM", "") or item.get("AMOUNT", "")

            if not doc_date_str or not due_date_str or not amount_str:
                continue

            doc_date = datetime.strptime(doc_date_str, "%Y%m%d")
            due_date = datetime.strptime(due_date_str, "%Y%m%d")
            amount = float(amount_str)

            if doc_date < thirteen_months_ago:
                continue

            month_key = doc_date.strftime("%Y-%m")

            if month_key in monthly_data:
                monthly_data[month_key]["billing_amount"] += amount
                monthly_data[month_key]["purchase_count"] += 1

                payment_term = (due_date - doc_date).days
                monthly_data[month_key]["payment_terms"].append(payment_term)

                payment_date_str = item.get("PAYMENT_DATE")
                if payment_date_str:
                    payment_date = datetime.strptime(payment_date_str, "%Y%m%d")
                    delay = max(0, (payment_date - due_date).days)
                    if delay > 0:
                        all_delays.append(delay)
                        monthly_data[month_key]["delays"].append(delay)
                        monthly_data[month_key]["overdue_amounts"].append(amount)
                else:
                    unpaid_amounts.append(amount)
                    if due_date < now:
                        delay = (now - due_date).days
                        if delay > 0:
                            all_delays.append(delay)
                            monthly_data[month_key]["delays"].append(delay)
                            monthly_data[month_key]["overdue_amounts"].append(amount)

        except (ValueError, TypeError):
            continue

    current_3m = []
    for i in range(3):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        current_3m.append(month_key)

    current_hc = sum(monthly_data[m]["purchase_count"] for m in current_3m if m in monthly_data)
    current_vc_total = sum(monthly_data[m]["billing_amount"] for m in current_3m if m in monthly_data)
    current_vc = current_vc_total / max(current_hc, 1)

    current_payment_terms = []
    for m in current_3m:
        if m in monthly_data:
            current_payment_terms.extend(monthly_data[m]["payment_terms"])
    current_pp = sum(current_payment_terms) / len(current_payment_terms) if current_payment_terms else 0

    twelve_month_delays = []
    for i in range(12):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        if month_key in monthly_data:
            twelve_month_delays.extend(monthly_data[month_key]["delays"])

    current_in = sum(twelve_month_delays) / len(twelve_month_delays) if twelve_month_delays else 0

    current_overdue_amounts = []
    for m in current_3m:
        if m in monthly_data:
            current_overdue_amounts.extend(monthly_data[m]["overdue_amounts"])
    current_va = sum(current_overdue_amounts) / len(current_overdue_amounts) if current_overdue_amounts else 0

    previous_3m = []
    for i in range(3, 6):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        previous_3m.append(month_key)

    previous_vc_total = sum(monthly_data[m]["billing_amount"] for m in previous_3m if m in monthly_data)
    previous_hc = sum(monthly_data[m]["purchase_count"] for m in previous_3m if m in monthly_data)
    previous_vc = previous_vc_total / max(previous_hc, 1)

    billing_variation_pct = 0
    if previous_vc > 0:
        billing_variation_pct = (1 - (current_vc / previous_vc)) * 100

    amount_receivable = sum(unpaid_amounts)
    max_delay_last_12m = max(twelve_month_delays) if twelve_month_delays else 0
    current_max_delay = max(
        [delay for delays in [monthly_data[m]["delays"] for m in current_3m if m in monthly_data] for delay in delays],
        default=0,
    )
    overdue_amount = sum(current_overdue_amounts)

    status = "EM_DIA" if current_max_delay == 0 else "VENCIDO"

    return {
        "hc": current_hc,
        "vc": current_vc,
        "pp": current_pp,
        "in": current_in,
        "va": current_va,
        "monthly_data": monthly_data,
        "billing_variation_pct": billing_variation_pct,
        "amount_receivable": amount_receivable,
        "max_delay_last_12m": int(max_delay_last_12m),
        "current_max_delay": int(current_max_delay),
        "overdue_amount": overdue_amount,
        "status": status,
    }


async def get_serasa_data(customer: str) -> Dict:
    return {
        "se_count": 0,
        "se_value": 0,
    }


def standardize_variable(value: float, mean: float, std: float) -> float:
    if std == 0:
        return 0
    return (value - mean) / std


def calculate_score(
    metrics: CreditMetrics,
    stats: GlobalStatistics,
    weights: ModelWeights,
) -> Tuple[float, StandardizedMetrics]:
    z_hc = standardize_variable(metrics.hc, stats.mean_hc, stats.std_hc)
    z_vc = standardize_variable(metrics.vc, stats.mean_vc, stats.std_vc)
    z_pp = standardize_variable(metrics.pp, stats.mean_pp, stats.std_pp)
    z_in = standardize_variable(metrics.in_, stats.mean_in, stats.std_in)
    z_va = standardize_variable(metrics.va, stats.mean_va, stats.std_va)
    z_se_count = standardize_variable(metrics.se_count, stats.mean_se_count, stats.std_se_count)
    z_se_value = standardize_variable(metrics.se_value, stats.mean_se_value, stats.std_se_value)

    score = (
        weights.w1 * z_hc
        - weights.w2 * z_pp
        - weights.w3 * z_in
        - weights.w4 * z_va
        - weights.w5 * z_se_count
        - weights.w6 * z_se_value
        + weights.w7 * z_vc
    )

    standardized = StandardizedMetrics(
        z_hc=z_hc,
        z_vc=z_vc,
        z_pp=z_pp,
        z_in=z_in,
        z_va=z_va,
        z_se_count=z_se_count,
        z_se_value=z_se_value,
    )

    return score, standardized


def calculate_probability(score: float) -> float:
    return 1 / (1 + math.exp(-score))


def calculate_multiplier(confidence: float, params: ModelParameters) -> float:
    return min(1 + (confidence * params.max_factor), params.limit_factor_max)


def get_risk_level(probability_default: float) -> str:
    if probability_default >= 0.7:
        return "VERY_HIGH"
    elif probability_default >= 0.5:
        return "HIGH"
    elif probability_default >= 0.3:
        return "MEDIUM"
    elif probability_default >= 0.1:
        return "LOW"
    else:
        return "VERY_LOW"


async def calculate_historical_scores(customer: str, company_code: str, months: int = 13) -> List[Dict]:

    current_data = await get_customer_data_from_sap(customer, company_code)
    serasa_data = await get_serasa_data(customer)

    metrics = CreditMetrics(
        hc=current_data["hc"],
        vc=current_data["vc"],
        pp=current_data["pp"],
        in_=current_data["in"],
        va=current_data["va"],
        se_count=serasa_data["se_count"],
        se_value=serasa_data["se_value"],
    )

    stats = GlobalStatistics()
    weights = ModelWeights()

    score, _ = calculate_score(metrics, stats, weights)

    historical_scores = []
    now = datetime.now()

    for i in range(months):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")

        score_variation = (i * 0.1) - (months * 0.05)
        month_score = score + score_variation

        historical_scores.append({"month": month_key, "score": month_score, "date": month_date})

    return list(reversed(historical_scores))


def enhance_dashboard_with_score_variations(dashboard_data: Dict, historical_scores: List[Dict]) -> Dict:
    if len(historical_scores) >= 2:
        current_score = historical_scores[-1]["score"]
        previous_score = historical_scores[-2]["score"]
        score_variation = current_score - previous_score

        dashboard_data["highlights"]["score_variation_points"] = score_variation

        for i, series_item in enumerate(dashboard_data["payment_term_series"]):
            if i < len(historical_scores):
                series_item["score"] = historical_scores[-(i + 1)]["score"]

        for i, series_item in enumerate(dashboard_data["billing_series"]):
            if i < len(historical_scores):
                series_item["score"] = historical_scores[-(i + 1)]["score"]

    return dashboard_data


async def calculate_credit_score(
    request: CreditCalculationRequest,
) -> CreditScoreResponse:
    sap_data = await get_customer_data_from_sap(request.customer, request.company_code, request.reference_date)

    serasa_data = await get_serasa_data(request.customer)

    metrics = CreditMetrics(
        hc=sap_data["hc"],
        vc=sap_data["vc"],
        pp=sap_data["pp"],
        in_=sap_data["in"],
        va=sap_data["va"],
        se_count=serasa_data["se_count"],
        se_value=serasa_data["se_value"],
    )

    stats = GlobalStatistics()
    weights = ModelWeights()
    params = ModelParameters()

    score, standardized_metrics = calculate_score(metrics, stats, weights)

    probability_default = calculate_probability(score)
    confidence = 1 - probability_default
    multiplier = calculate_multiplier(confidence, params)
    credit_limit = multiplier * metrics.vc
    risk_level = get_risk_level(probability_default)

    return CreditScoreResponse(
        customer=request.customer,
        score=score,
        probability_default=probability_default,
        confidence=confidence,
        multiplier=multiplier,
        average_purchase_value=metrics.vc,
        suggested_credit_limit=credit_limit,
        risk_level=risk_level,
        calculation_date=datetime.now().isoformat(),
        metrics=metrics,
        standardized_metrics=standardized_metrics,
    )


async def calculate_batch_credit_scores(
    request: BatchCalculationRequest,
) -> BatchCalculationResponse:
    results = []
    errors = []
    success_count = 0
    error_count = 0

    for customer in request.customers:
        try:
            calc_request = CreditCalculationRequest(customer=customer, company_code=request.company_code)
            result = await calculate_credit_score(calc_request)
            results.append(result)
            success_count += 1
        except Exception as e:
            errors.append({"customer": customer, "error": str(e)})
            error_count += 1

    return BatchCalculationResponse(
        success_count=success_count,
        error_count=error_count,
        results=results,
        errors=errors,
    )


def calculate_ks_statistics(clients_data: List[Dict]) -> KSCalculationResponse:
    sorted_clients = sorted(clients_data, key=lambda x: x["score"], reverse=True)

    n_clients = len(sorted_clients)
    if n_clients == 0:
        return KSCalculationResponse(
            ks_value=0,
            ks_decile=0,
            total_clients=0,
            good_clients=0,
            bad_clients=0,
            calculation_date=datetime.now().isoformat(),
            deciles=[],
        )

    decile_size = max(1, n_clients // 10)

    deciles = []
    max_ks = 0
    max_ks_decile = 0

    cumulative_good = 0
    cumulative_bad = 0
    total_good_all = sum(1 for c in sorted_clients if not c.get("is_defaulted", False))
    total_bad_all = sum(1 for c in sorted_clients if c.get("is_defaulted", False))

    for i in range(10):
        start_idx = i * decile_size
        end_idx = (i + 1) * decile_size if i < 9 else n_clients

        decile_clients = sorted_clients[start_idx:end_idx]

        n_good = sum(1 for c in decile_clients if not c.get("is_defaulted", False))
        n_bad = sum(1 for c in decile_clients if c.get("is_defaulted", False))

        cumulative_good += n_good
        cumulative_bad += n_bad

        pct_good = (cumulative_good / max(total_good_all, 1)) * 100
        pct_bad = (cumulative_bad / max(total_bad_all, 1)) * 100

        ks_value = abs(pct_good - pct_bad)

        if ks_value > max_ks:
            max_ks = ks_value
            max_ks_decile = i + 1

        deciles.append(
            KSDecile(
                decile=i + 1,
                n_clients=len(decile_clients),
                n_good=n_good,
                n_bad=n_bad,
                pct_good_cumulative=pct_good,
                pct_bad_cumulative=pct_bad,
                ks=ks_value,
            )
        )

    return KSCalculationResponse(
        ks_value=max_ks,
        ks_decile=max_ks_decile,
        total_clients=n_clients,
        good_clients=total_good_all,
        bad_clients=total_bad_all,
        calculation_date=datetime.now().isoformat(),
        deciles=deciles,
    )


async def get_customer_data_from_sap_with_historical(
    customer: str, company_code: str, reference_date: Optional[str] = None
) -> Dict:
    if reference_date:
        key_date = reference_date
    else:
        key_date = datetime.now().strftime("%Y%m%d")

    payload = {
        "COMPANYCODE": company_code,
        "CUSTOMER": customer.zfill(10),
        "KEYDATE": key_date,
    }

    try:
        response = await call_sap("ZBAPI_AR_ACC_GETOPENITEMS_V2", payload)
        return parse_sap_data_with_historical(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching SAP data: {str(e)}")


def build_dashboard_response(
    customer: str,
    credit_result: CreditScoreResponse,
    historical_data: Optional[Dict] = None,
) -> DashboardResponse:
    now = datetime.now()

    if historical_data and "monthly_data" in historical_data:
        monthly_data = historical_data["monthly_data"]
        payment_series: List[MonthlyMetric] = []
        billing_series: List[MonthlyMetric] = []

        sorted_months = sorted(monthly_data.keys())[-13:]

        for month_key in sorted_months:
            month_data = monthly_data[month_key]

            avg_payment_term = (
                sum(month_data["payment_terms"]) / len(month_data["payment_terms"])
                if month_data["payment_terms"]
                else credit_result.metrics.pp
            )

            score = credit_result.score

            billing_amount = month_data["billing_amount"]

            limit_usage_pct = (
                min(
                    100.0,
                    (billing_amount / max(credit_result.suggested_credit_limit, 1)) * 100,
                )
                if credit_result.suggested_credit_limit
                else 0
            )

            metric = MonthlyMetric(
                month=month_key,
                avg_payment_term=avg_payment_term,
                score=score,
                billing_amount=billing_amount,
                limit_usage_pct=limit_usage_pct,
            )

            payment_series.append(metric)
            billing_series.append(metric)

        score_variation_points = 0.0
        if len(sorted_months) >= 2:
            score_variation_points = 0.0

        billing_variation_pct = historical_data.get("billing_variation_pct", 0.0)

        highlights = HighlightIndicators(
            current_score=credit_result.score,
            score_variation_points=score_variation_points,
            avg_billing_last_3m=credit_result.metrics.vc,
            avg_billing_variation_pct=billing_variation_pct,
            credit_limit=credit_result.suggested_credit_limit,
            credit_limit_used_pct=min(
                100.0,
                (
                    (credit_result.metrics.vc / max(credit_result.suggested_credit_limit, 1)) * 100
                    if credit_result.suggested_credit_limit
                    else 0
                ),
            ),
            amount_receivable=historical_data.get("amount_receivable", 0.0),
            avg_payment_term=credit_result.metrics.pp,
            status=historical_data.get("status", "EM_DIA"),
            overdue_amount=historical_data.get("overdue_amount", 0.0),
            current_max_delay_days=historical_data.get("current_max_delay", 0),
            max_delay_last_12m=historical_data.get("max_delay_last_12m", 0),
        )
    else:
        payment_series: List[MonthlyMetric] = []
        billing_series: List[MonthlyMetric] = []

        for m in range(12, -1, -1):
            ref_month = (now - timedelta(days=30 * m)).strftime("%Y-%m")
            payment_series.append(
                MonthlyMetric(
                    month=ref_month,
                    avg_payment_term=credit_result.metrics.pp,
                    score=credit_result.score,
                    billing_amount=credit_result.metrics.vc,
                    limit_usage_pct=min(
                        100.0,
                        (
                            credit_result.suggested_credit_limit
                            and (credit_result.metrics.vc / max(credit_result.suggested_credit_limit, 1)) * 100
                        )
                        or 0,
                    ),
                )
            )
            billing_series.append(payment_series[-1])

        highlights = HighlightIndicators(
            current_score=credit_result.score,
            score_variation_points=0.0,
            avg_billing_last_3m=credit_result.metrics.vc,
            avg_billing_variation_pct=0.0,
            credit_limit=credit_result.suggested_credit_limit,
            credit_limit_used_pct=min(
                100.0,
                (
                    (credit_result.metrics.vc / max(credit_result.suggested_credit_limit, 1)) * 100
                    if credit_result.suggested_credit_limit
                    else 0
                ),
            ),
            amount_receivable=0.0,
            avg_payment_term=credit_result.metrics.pp,
            status="EM_DIA" if credit_result.metrics.in_ == 0 else "VENCIDO",
            overdue_amount=credit_result.metrics.va,
            current_max_delay_days=int(credit_result.metrics.in_),
            max_delay_last_12m=int(credit_result.metrics.in_),
        )

    return DashboardResponse(
        customer=customer,
        period_months=13,
        payment_term_series=payment_series,
        billing_series=billing_series,
        highlights=highlights,
        generated_at=datetime.now().isoformat(),
    )

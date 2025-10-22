from datetime import datetime
from typing import List, Optional

from auth import verify_token
from fastapi import APIRouter, Depends, HTTPException, Query
from metrics import monitor_request_duration
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.schemas.credit import (
    BatchCalculationRequest,
    CreditCalculationRequest,
    GlobalStatistics,
    ModelParameters,
    ModelWeights,
)
from src.services.credit_service import (
    build_dashboard_response,
    calculate_batch_credit_scores,
    calculate_credit_score,
    calculate_ks_statistics,
    get_customer_data_from_sap_with_historical,
)
from src.services.data_service import DataService

router = APIRouter()


@router.get("/customers")
async def get_all_customers(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)

    if search:
        return service.search_customers(search)
    else:
        return service.get_all_customers(offset, limit)


@router.get("/customers/{customer_code}")
async def get_customer(
    customer_code: str,
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.get_customer(customer_code)


@router.get("/customers/search/{term}")
async def search_customers(
    term: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.search_customers(term, limit)


@router.get("/customers/{customer_code}/full")
async def get_customer_full(
    customer_code: str,
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.get_customer_with_credit(customer_code)


@router.get("/sales-orders")
async def get_sales_orders(
    customer_code: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.get_sales_orders(customer_code, start_date, end_date, limit)


@router.get("/sales-orders/{order_number}")
async def get_sales_order(
    order_number: str,
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.get_sales_order(order_number)


@router.get("/credit-limits")
async def get_all_credit_limits(
    limit: int = Query(100, ge=1, le=500),
    blocked_only: bool = Query(False),
    critical_only: bool = Query(False),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)

    if blocked_only:
        return service.get_blocked_customers()
    elif critical_only:
        return service.get_critical_customers()
    else:
        return service.get_all_credit_limits(limit)


@router.get("/credit-limits/{customer_code}")
async def get_credit_limit(
    customer_code: str,
    segment: str = Query("0001"),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.get_credit_limit(customer_code, segment)


@router.get("/sync/status")
async def get_sync_status(
    sync_type: Optional[str] = Query(None),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.get_sync_status(sync_type)


@router.get("/sync/logs")
async def get_sync_logs(
    sync_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    service = DataService(db)
    return service.get_sync_logs(sync_type, status, limit)


@router.post("/sync/trigger/{sync_type}")
async def trigger_sync(sync_type: str, current_user: str = Depends(verify_token)):
    valid_types = ["customers", "sales_orders", "credit_limits"]

    if sync_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sync type. Must be one of: {', '.join(valid_types)}",
        )

    return {"message": f"Sync triggered for {sync_type}", "status": "initiated"}


@router.post("/credit/calculate")
@monitor_request_duration()
async def calculate_credit_limit(request: CreditCalculationRequest, current_user: str = Depends(verify_token)):
    """Calculate credit limit for a single customer"""
    try:
        result = await calculate_credit_score(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/credit/batch")
@monitor_request_duration()
async def calculate_batch_credit_limits(request: BatchCalculationRequest, current_user: str = Depends(verify_token)):
    """Calculate credit limits for multiple customers"""
    try:
        result = await calculate_batch_credit_scores(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/credit/ks")
@monitor_request_duration()
async def calculate_ks_statistics_router(clients_data: List[dict], current_user: str = Depends(verify_token)):
    """Calculate KS statistics for model performance evaluation"""
    if not clients_data:
        raise HTTPException(status_code=400, detail="No client data provided")

    for client in clients_data:
        if "score" not in client:
            raise HTTPException(status_code=400, detail="Each client must have 'score' field")

    try:
        result = calculate_ks_statistics(clients_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/credit/statistics")
async def get_credit_statistics(current_user: str = Depends(verify_token)):
    """Get current model statistics and parameters"""
    stats = GlobalStatistics()
    weights = ModelWeights()
    params = ModelParameters()

    return {
        "global_statistics": stats.dict(),
        "model_weights": weights.dict(),
        "model_parameters": params.dict(),
        "last_update": datetime.now().isoformat(),
    }


@router.get("/credit/dashboard/{customer}")
@monitor_request_duration()
async def get_credit_dashboard(customer: str, company_code: str = "1000", current_user: str = Depends(verify_token)):
    """Get comprehensive dashboard with performance metrics and credit analysis"""
    try:
        historical_data = await get_customer_data_from_sap_with_historical(customer, company_code)

        calc_request = CreditCalculationRequest(customer=customer, company_code=company_code)
        credit_result = await calculate_credit_score(calc_request)

        dashboard = build_dashboard_response(customer, credit_result, historical_data)
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import String, and_, func, or_
from sqlalchemy.orm import Session
from src.database.models import SAPCreditLimit, SAPCustomer, SAPSalesOrder, SyncLog


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_code(self, customer_code: str) -> Optional[SAPCustomer]:
        return self.db.query(SAPCustomer).filter_by(customer_code=customer_code, is_active=True).first()

    def search(self, term: str, limit: int = 100) -> List[SAPCustomer]:
        search_term = f"%{term}%"
        return (
            self.db.query(SAPCustomer)
            .filter(
                and_(
                    SAPCustomer.is_active == True,
                    or_(
                        SAPCustomer.customer_code.ilike(search_term),
                        func.cast(SAPCustomer.sap_data["NAME"], String).ilike(search_term),
                        func.cast(SAPCustomer.sap_data["SORT1"], String).ilike(search_term),
                    ),
                )
            )
            .limit(limit)
            .all()
        )

    def get_all(self, offset: int = 0, limit: int = 100) -> List[SAPCustomer]:
        return self.db.query(SAPCustomer).filter_by(is_active=True).offset(offset).limit(limit).all()

    def get_total_count(self) -> int:
        return self.db.query(SAPCustomer).filter_by(is_active=True).count()

    def get_by_ids(self, customer_codes: List[str]) -> List[SAPCustomer]:
        return (
            self.db.query(SAPCustomer)
            .filter(and_(SAPCustomer.customer_code.in_(customer_codes), SAPCustomer.is_active == True))
            .all()
        )


class SalesOrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_order_number(self, order_number: str) -> Optional[SAPSalesOrder]:
        return self.db.query(SAPSalesOrder).filter_by(order_number=order_number, is_active=True).first()

    def get_by_customer(self, customer_code: str, limit: int = 100) -> List[SAPSalesOrder]:
        return (
            self.db.query(SAPSalesOrder)
            .filter_by(customer_code=customer_code, is_active=True)
            .order_by(SAPSalesOrder.document_date.desc())
            .limit(limit)
            .all()
        )

    def get_by_date_range(
        self, start_date: datetime, end_date: datetime, customer_code: Optional[str] = None
    ) -> List[SAPSalesOrder]:
        query = self.db.query(SAPSalesOrder).filter(
            and_(
                SAPSalesOrder.is_active == True,
                SAPSalesOrder.document_date >= start_date,
                SAPSalesOrder.document_date <= end_date,
            )
        )

        if customer_code:
            query = query.filter(SAPSalesOrder.customer_code == customer_code)

        return query.order_by(SAPSalesOrder.document_date.desc()).all()

    def get_recent_orders(self, limit: int = 100) -> List[SAPSalesOrder]:
        return (
            self.db.query(SAPSalesOrder)
            .filter_by(is_active=True)
            .order_by(SAPSalesOrder.created_at.desc())
            .limit(limit)
            .all()
        )


class CreditLimitRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_customer(self, customer_code: str, segment: str = "0001") -> Optional[SAPCreditLimit]:
        return (
            self.db.query(SAPCreditLimit)
            .filter_by(customer_code=customer_code, segment=segment, is_active=True)
            .first()
        )

    def get_blocked_customers(self) -> List[SAPCreditLimit]:
        return (
            self.db.query(SAPCreditLimit)
            .filter(
                and_(SAPCreditLimit.is_active == True, func.cast(SAPCreditLimit.sap_data["XBLOCKED"], String) == "X")
            )
            .all()
        )

    def get_critical_customers(self) -> List[SAPCreditLimit]:
        return (
            self.db.query(SAPCreditLimit)
            .filter(
                and_(SAPCreditLimit.is_active == True, func.cast(SAPCreditLimit.sap_data["XCRITICAL"], String) == "X")
            )
            .all()
        )

    def get_all_limits(self, limit: int = 100) -> List[SAPCreditLimit]:
        return self.db.query(SAPCreditLimit).filter_by(is_active=True).limit(limit).all()


class SyncLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_latest(self, sync_type: Optional[str] = None) -> Optional[SyncLog]:
        query = self.db.query(SyncLog)

        if sync_type:
            query = query.filter_by(sync_type=sync_type)

        return query.order_by(SyncLog.started_at.desc()).first()

    def get_by_status(self, status: str, limit: int = 100) -> List[SyncLog]:
        return self.db.query(SyncLog).filter_by(status=status).order_by(SyncLog.started_at.desc()).limit(limit).all()

    def get_recent_logs(self, limit: int = 100) -> List[SyncLog]:
        return self.db.query(SyncLog).order_by(SyncLog.started_at.desc()).limit(limit).all()

    def get_stats(self, sync_type: Optional[str] = None) -> Dict[str, Any]:
        query = self.db.query(SyncLog)

        if sync_type:
            query = query.filter_by(sync_type=sync_type)

        completed = query.filter_by(status="completed").count()
        failed = query.filter_by(status="failed").count()
        running = query.filter_by(status="running").count()

        return {"completed": completed, "failed": failed, "running": running, "total": completed + failed + running}

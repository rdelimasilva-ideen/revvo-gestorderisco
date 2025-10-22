from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.repository.sap_repository import (
    CreditLimitRepository,
    CustomerRepository,
    SalesOrderRepository,
    SyncLogRepository,
)


class DataService:
    def __init__(self, db: Session):
        self.customers = CustomerRepository(db)
        self.sales_orders = SalesOrderRepository(db)
        self.credit_limits = CreditLimitRepository(db)
        self.sync_logs = SyncLogRepository(db)

    def get_all_customers(self, offset: int = 0, limit: int = 100) -> Dict[str, Any]:
        customers = self.customers.get_all(offset, limit)
        total = self.customers.get_total_count()

        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "data": [self._format_customer(c) for c in customers],
        }

    def get_customer(self, customer_code: str) -> Dict[str, Any]:
        customer = self.customers.get_by_code(customer_code)

        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        return self._format_customer(customer)

    def search_customers(self, term: str, limit: int = 100) -> List[Dict[str, Any]]:
        customers = self.customers.search(term, limit)
        return [self._format_customer(c) for c in customers]

    def get_customer_with_credit(self, customer_code: str) -> Dict[str, Any]:
        customer = self.customers.get_by_code(customer_code)

        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        result = self._format_customer(customer)

        credit_limit = self.credit_limits.get_by_customer(customer_code)
        if credit_limit:
            result["credit_limit"] = self._format_credit_limit(credit_limit)

        return result

    def get_sales_orders(
        self,
        customer_code: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:

        if customer_code:
            orders = self.sales_orders.get_by_customer(customer_code, limit)
        elif start_date and end_date:
            orders = self.sales_orders.get_by_date_range(start_date, end_date, customer_code)
        else:
            orders = self.sales_orders.get_recent_orders(limit)

        return [self._format_sales_order(o) for o in orders]

    def get_sales_order(self, order_number: str) -> Dict[str, Any]:
        order = self.sales_orders.get_by_order_number(order_number)

        if not order:
            raise HTTPException(status_code=404, detail="Sales order not found")

        return self._format_sales_order(order)

    def get_credit_limit(self, customer_code: str, segment: str = "0001") -> Dict[str, Any]:
        credit_limit = self.credit_limits.get_by_customer(customer_code, segment)

        if not credit_limit:
            raise HTTPException(status_code=404, detail="Credit limit not found")

        return self._format_credit_limit(credit_limit)

    def get_all_credit_limits(self, limit: int = 100) -> List[Dict[str, Any]]:
        credit_limits = self.credit_limits.get_all_limits(limit)
        return [self._format_credit_limit(cl) for cl in credit_limits]

    def get_blocked_customers(self) -> List[Dict[str, Any]]:
        blocked = self.credit_limits.get_blocked_customers()
        return [self._format_credit_limit(cl) for cl in blocked]

    def get_critical_customers(self) -> List[Dict[str, Any]]:
        critical = self.credit_limits.get_critical_customers()
        return [self._format_credit_limit(cl) for cl in critical]

    def get_sync_status(self, sync_type: Optional[str] = None) -> Dict[str, Any]:
        latest = self.sync_logs.get_latest(sync_type)
        stats = self.sync_logs.get_stats(sync_type)

        result = {"stats": stats, "latest_sync": None}

        if latest:
            result["latest_sync"] = self._format_sync_log(latest)

        return result

    def get_sync_logs(
        self,
        sync_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:

        if status:
            logs = self.sync_logs.get_by_status(status, limit)
        else:
            logs = self.sync_logs.get_recent_logs(limit)

        return [self._format_sync_log(log) for log in logs]

    def _format_customer(self, customer) -> Dict[str, Any]:
        sap_data = customer.sap_data or {}

        return {
            "id": str(customer.id),
            "customer_code": customer.customer_code,
            "name": sap_data.get("SORT1", ""),
            "full_name": sap_data.get("NAME", ""),
            "country": sap_data.get("COUNTRY", ""),
            "country_iso": sap_data.get("COUNTRYISO", ""),
            "city": sap_data.get("CITY", ""),
            "postal_code": sap_data.get("POSTL_COD1", ""),
            "region": sap_data.get("REGION", ""),
            "street": sap_data.get("STREET", ""),
            "phone": sap_data.get("TEL1_NUMBR", ""),
            "fax": sap_data.get("FAX_NUMBER", ""),
            "address_code": sap_data.get("ADDRESS", ""),
            "created_at": (customer.created_at.isoformat() if customer.created_at else None),
            "updated_at": (customer.updated_at.isoformat() if customer.updated_at else None),
            "raw_data": sap_data,
        }

    def _format_sales_order(self, order) -> Dict[str, Any]:
        sap_data = order.sap_data or {}

        return {
            "id": str(order.id),
            "order_number": order.order_number,
            "customer_code": order.customer_code,
            "item_number": sap_data.get("ITM_NUMBER", ""),
            "material": sap_data.get("MATERIAL", ""),
            "description": sap_data.get("SHORT_TEXT", ""),
            "document_type": sap_data.get("DOC_TYPE", ""),
            "document_date": (order.document_date.isoformat() if order.document_date else None),
            "request_date": self._parse_sap_date(sap_data.get("REQ_DATE", "")),
            "total_quantity": sap_data.get("REQ_QTY", 0),
            "reference_number": sap_data.get("PURCH_NO", ""),
            "valid_from": self._parse_sap_date(sap_data.get("VALID_FROM", "")),
            "valid_to": self._parse_sap_date(sap_data.get("VALID_TO", "")),
            "customer_name": sap_data.get("NAME", ""),
            "exchange_rate": sap_data.get("EXCHG_RATE", ""),
            "net_price": sap_data.get("NET_PRICE", ""),
            "net_value": sap_data.get("NET_VALUE", ""),
            "gross_value": sap_data.get("NET_VAL_HD", ""),
            "division": sap_data.get("DIVISION", ""),
            "status": sap_data.get("DOC_STATUS", ""),
            "sales_org": sap_data.get("SALES_ORG", ""),
            "currency": sap_data.get("CURRENCY", ""),
            "plant": sap_data.get("PLANT", ""),
            "creation_date": self._parse_sap_date(sap_data.get("CREATION_DATE", "")),
            "creation_time": sap_data.get("CREATION_TIME", ""),
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None,
            "raw_data": sap_data,
        }

    def _format_credit_limit(self, credit_limit) -> Dict[str, Any]:
        sap_data = credit_limit.sap_data or {}

        return {
            "id": str(credit_limit.id),
            "customer_code": credit_limit.customer_code,
            "segment": credit_limit.segment,
            "credit_limit": sap_data.get("CREDIT_LIMIT", "0"),
            "is_blocked": sap_data.get("XBLOCKED", "") == "X",
            "block_reason": sap_data.get("BLOCK_REASON", ""),
            "limit_valid_date": self._parse_sap_date(sap_data.get("LIMIT_VALID_DATE", "")),
            "limit_change_date": self._parse_sap_date(sap_data.get("LIMIT_CHG_DATE", "")),
            "coordinator": sap_data.get("COORDINATOR", ""),
            "customer_group": sap_data.get("CUST_GROUP", ""),
            "follow_up_date": self._parse_sap_date(sap_data.get("FOLLOW_UP_DT", "")),
            "is_critical": sap_data.get("XCRITICAL", "") == "X",
            "request_date": self._parse_sap_date(sap_data.get("REQ_DATE", "")),
            "created_at": (credit_limit.created_at.isoformat() if credit_limit.created_at else None),
            "updated_at": (credit_limit.updated_at.isoformat() if credit_limit.updated_at else None),
            "raw_data": sap_data,
        }

    def _format_sync_log(self, sync_log) -> Dict[str, Any]:
        return {
            "id": str(sync_log.id),
            "sync_type": sync_log.sync_type,
            "status": sync_log.status,
            "started_at": (sync_log.started_at.isoformat() if sync_log.started_at else None),
            "completed_at": (sync_log.completed_at.isoformat() if sync_log.completed_at else None),
            "records_processed": sync_log.records_processed,
            "records_created": sync_log.records_created,
            "records_updated": sync_log.records_updated,
            "records_failed": sync_log.records_failed,
            "error_message": sync_log.error_message,
            "duration_seconds": (
                (sync_log.completed_at - sync_log.started_at).total_seconds()
                if sync_log.completed_at and sync_log.started_at
                else None
            ),
        }

    def _parse_sap_date(self, date_str: str) -> Optional[str]:
        if date_str and len(date_str) == 8:
            try:
                dt = datetime.strptime(date_str, "%Y%m%d")
                return dt.isoformat()
            except ValueError:
                return None
        return None

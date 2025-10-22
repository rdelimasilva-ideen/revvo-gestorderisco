import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from config import LOG_LEVEL, WORKER_SALES_INTERVAL
from sap_client import call_sap
from sqlalchemy.orm import Session
from src.database.connection import get_db_session
from src.database.models import SAPCustomer, SAPSalesOrder, SyncLog
from src.workers.base_worker import BaseWorker

logging.basicConfig(level=getattr(logging, LOG_LEVEL))
logger = logging.getLogger(__name__)


class SalesWorker(BaseWorker):
    def __init__(self):
        super().__init__("sales_orders", interval_seconds=WORKER_SALES_INTERVAL)

    async def fetch_data(self) -> List[Dict[str, Any]]:
        return []

    async def fetch_data_for_customer(self, customer_code: str) -> List[Dict[str, Any]]:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=365)

        payload = {
            "CUSTOMER_NUMBER": customer_code,
            "DOCUMENT_DATE": start_date.strftime("%Y%m%d"),
            "DOCUMENT_DATE_TO": end_date.strftime("%Y%m%d"),
            "TRANSACTION_GROUP": "0",
        }

        response = await call_sap("BAPI_SALESORDER_GETLIST", payload)

        if isinstance(response, dict):
            response_data = response.get("BAPI_SALESORDER_GETLIST.Response", {})
            sales_orders = response_data.get("SALES_ORDERS", {})
            items = sales_orders.get("item", [])

            if isinstance(items, dict):
                items = [items]

            return items

        return []

    def process_item(self, raw_item: Dict[str, Any], customer_code: str = None) -> Optional[Dict[str, Any]]:
        order_number = str(raw_item.get("SD_DOC", "")).strip()

        if not order_number:
            return None

        doc_date_str = raw_item.get("DOC_DATE", "")
        document_date = None
        if doc_date_str and len(doc_date_str) == 8:
            try:
                document_date = datetime.strptime(doc_date_str, "%Y%m%d")
            except ValueError:
                document_date = None

        return {
            "order_number": order_number,
            "customer_code": customer_code,
            "document_date": document_date,
            "sap_data": raw_item,
        }

    def store_data(self, db: Session, processed_data: Dict[str, Any], sync_log: SyncLog) -> bool:
        try:
            if not processed_data:
                return False

            order_number = processed_data.get("order_number")

            existing = db.query(SAPSalesOrder).filter_by(order_number=order_number).first()

            if existing:
                existing.sap_data = processed_data["sap_data"]
                existing.customer_code = processed_data["customer_code"]
                existing.document_date = processed_data["document_date"]
                existing.updated_at = datetime.utcnow()
                sync_log.records_updated += 1
            else:
                sales_order = SAPSalesOrder(**processed_data)
                db.add(sales_order)
                sync_log.records_created += 1

            return True

        except Exception as e:
            logger.error(f"Error storing sales order {processed_data.get('order_number')}: {str(e)}")
            return False

    async def run_sync(self):
        logger.info("Starting sales orders sync")

        with get_db_session() as db:
            sync_log = SyncLog(sync_type="sales_orders", status="running", started_at=datetime.utcnow())
            db.add(sync_log)
            db.commit()

            try:
                customers = db.query(SAPCustomer).filter_by(is_active=True).all()
                logger.info(f"Found {len(customers)} active customers to sync sales orders")

                for customer in customers:
                    try:
                        sales_data = await self.fetch_data_for_customer(customer.customer_code)

                        for item in sales_data:
                            sync_log.records_processed += 1
                            processed = self.process_item(item, customer.customer_code)

                            if not self.store_data(db, processed, sync_log):
                                sync_log.records_failed += 1

                            if sync_log.records_processed % 100 == 0:
                                db.commit()
                                logger.info(f"Processed {sync_log.records_processed} sales orders")

                    except Exception as e:
                        logger.error(f"Error syncing sales for customer {customer.customer_code}: {str(e)}")
                        sync_log.records_failed += 1

                sync_log.status = "completed"
                sync_log.completed_at = datetime.utcnow()

            except Exception as e:
                logger.error(f"Sales orders sync failed: {str(e)}")
                sync_log.status = "failed"
                sync_log.error_message = str(e)[:500]
                sync_log.completed_at = datetime.utcnow()

            finally:
                db.commit()
                logger.info(
                    f"Sales orders sync completed: {sync_log.records_processed} processed, "
                    f"{sync_log.records_created} created, {sync_log.records_updated} updated, "
                    f"{sync_log.records_failed} failed"
                )


if __name__ == "__main__":
    worker = SalesWorker()
    asyncio.run(worker.start())

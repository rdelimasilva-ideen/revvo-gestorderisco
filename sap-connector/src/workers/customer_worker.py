import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from config import LOG_LEVEL, WORKER_CUSTOMER_INTERVAL
from sap_client import call_sap
from sqlalchemy.orm import Session
from src.database.connection import get_db_session
from src.database.models import SAPCustomer, SyncLog
from src.workers.base_worker import BaseWorker

logging.basicConfig(level=getattr(logging, LOG_LEVEL))
logger = logging.getLogger(__name__)


class CustomerWorker(BaseWorker):
    def __init__(self):
        super().__init__("customers", interval_seconds=WORKER_CUSTOMER_INTERVAL)

    async def fetch_data(self) -> List[Dict[str, Any]]:
        payload = {
            "MAXROWS": 9999999,
            "IDRANGE": {"item": {"SIGN": "I", "OPTION": "BT", "LOW": "1", "HIGH": "9999999999"}},
        }

        response = await call_sap("BAPI_CUSTOMER_GETLIST", payload)

        if isinstance(response, dict):
            response_data = response.get("BAPI_CUSTOMER_GETLIST.Response", {})
            address_data = response_data.get("ADDRESSDATA", {})
            items = address_data.get("item", [])

            if isinstance(items, dict):
                items = [items]

            return items

        return []

    def process_item(self, raw_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        customer_code = str(raw_item.get("CUSTOMER", "")).strip()

        if not customer_code:
            return None

        return {"customer_code": customer_code, "sap_data": raw_item}

    def store_data(self, db: Session, processed_data: Dict[str, Any], sync_log: SyncLog) -> bool:
        try:
            if not processed_data:
                return False

            customer_code = processed_data.get("customer_code")

            existing = db.query(SAPCustomer).filter_by(customer_code=customer_code).first()

            if existing:
                existing.sap_data = processed_data["sap_data"]
                existing.updated_at = datetime.utcnow()
                sync_log.records_updated += 1
            else:
                customer = SAPCustomer(**processed_data)
                db.add(customer)
                sync_log.records_created += 1

            return True

        except Exception as e:
            logger.error(f"Error storing customer {processed_data.get('customer_code')}: {str(e)}")
            return False

    async def run_sync(self):
        logger.info("Starting customer sync")

        with get_db_session() as db:
            sync_log = SyncLog(sync_type="customers", status="running", started_at=datetime.utcnow())
            db.add(sync_log)
            db.commit()

            try:
                raw_data = await self.fetch_data()
                logger.info(f"Fetched {len(raw_data)} customers from SAP")

                for item in raw_data:
                    sync_log.records_processed += 1
                    processed = self.process_item(item)

                    if not self.store_data(db, processed, sync_log):
                        sync_log.records_failed += 1

                    if sync_log.records_processed % 100 == 0:
                        db.commit()
                        logger.info(f"Processed {sync_log.records_processed} customers")

                sync_log.status = "completed"
                sync_log.completed_at = datetime.utcnow()

            except Exception as e:
                logger.error(f"Customer sync failed: {str(e)}")
                sync_log.status = "failed"
                sync_log.error_message = str(e)[:500]
                sync_log.completed_at = datetime.utcnow()

            finally:
                db.commit()
                logger.info(
                    f"Customer sync completed: {sync_log.records_processed} processed, "
                    f"{sync_log.records_created} created, {sync_log.records_updated} updated, "
                    f"{sync_log.records_failed} failed"
                )


if __name__ == "__main__":
    worker = CustomerWorker()
    asyncio.run(worker.start())

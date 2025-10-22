import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from config import LOG_LEVEL, WORKER_CREDIT_INTERVAL
from sap_client import call_sap
from sqlalchemy.orm import Session
from src.database.connection import get_db_session
from src.database.models import SAPCreditLimit, SAPCustomer, SyncLog
from src.workers.base_worker import BaseWorker

logging.basicConfig(level=getattr(logging, LOG_LEVEL))
logger = logging.getLogger(__name__)


class CreditWorker(BaseWorker):
    def __init__(self):
        super().__init__("credit_limits", interval_seconds=WORKER_CREDIT_INTERVAL)

    async def fetch_data(self) -> List[Dict[str, Any]]:
        return []

    async def fetch_data_for_customer(self, customer_code: str, segment: str = "0001") -> Dict[str, Any]:
        payload = {"I_PARTNER": customer_code, "I_SEGMENT": segment, "I_DB_READ": ""}

        response = await call_sap("UKM_DB_UKMBP_CMS_SGM_READ", payload)

        if isinstance(response, dict):
            return response.get("UKM_DB_UKMBP_CMS_SGM_READ.Response", {})

        return {}

    def process_item(
        self, raw_data: Dict[str, Any], customer_code: str = None, segment: str = "0001"
    ) -> Optional[Dict[str, Any]]:
        if not raw_data:
            return None

        return {
            "customer_code": customer_code,
            "segment": segment,
            "sap_data": raw_data,
        }

    def store_data(self, db: Session, processed_data: Dict[str, Any], sync_log: SyncLog) -> bool:
        try:
            if not processed_data:
                return False

            customer_code = processed_data.get("customer_code")
            segment = processed_data.get("segment")

            existing = db.query(SAPCreditLimit).filter_by(customer_code=customer_code, segment=segment).first()

            if existing:
                existing.sap_data = processed_data["sap_data"]
                existing.updated_at = datetime.utcnow()
                sync_log.records_updated += 1
            else:
                credit_limit = SAPCreditLimit(**processed_data)
                db.add(credit_limit)
                sync_log.records_created += 1

            return True

        except Exception as e:
            logger.error(f"Error storing credit limit for customer {processed_data.get('customer_code')}: {str(e)}")
            return False

    async def run_sync(self):
        logger.info("Starting credit limits sync")

        with get_db_session() as db:
            sync_log = SyncLog(
                sync_type="credit_limits",
                status="running",
                started_at=datetime.utcnow(),
            )
            db.add(sync_log)
            db.commit()

            try:
                customers = db.query(SAPCustomer).filter_by(is_active=True).all()
                logger.info(f"Found {len(customers)} active customers to sync credit limits")

                for customer in customers:
                    try:
                        sync_log.records_processed += 1

                        credit_data = await self.fetch_data_for_customer(customer.customer_code)

                        if credit_data:
                            processed = self.process_item(credit_data, customer.customer_code)

                            if not self.store_data(db, processed, sync_log):
                                sync_log.records_failed += 1

                            if sync_log.records_processed % 50 == 0:
                                db.commit()
                                logger.info(f"Processed {sync_log.records_processed} credit limits")

                    except Exception as e:
                        logger.error(f"Error syncing credit for customer {customer.customer_code}: {str(e)}")
                        sync_log.records_failed += 1

                sync_log.status = "completed"
                sync_log.completed_at = datetime.utcnow()

            except Exception as e:
                logger.error(f"Credit limits sync failed: {str(e)}")
                sync_log.status = "failed"
                sync_log.error_message = str(e)[:500]
                sync_log.completed_at = datetime.utcnow()

            finally:
                db.commit()
                logger.info(
                    f"Credit limits sync completed: {sync_log.records_processed} processed, "
                    f"{sync_log.records_created} created, {sync_log.records_updated} updated, "
                    f"{sync_log.records_failed} failed"
                )


if __name__ == "__main__":
    worker = CreditWorker()
    asyncio.run(worker.start())

import asyncio
import logging
import signal
import sys
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from config import LOG_LEVEL
from sqlalchemy.orm import Session
from src.database.models import SyncLog

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class BaseWorker(ABC):
    def __init__(self, name: str, interval_seconds: int = 3600):
        self.name = name
        self.interval_seconds = interval_seconds
        self.is_running = False
        self._setup_signal_handlers()

    def _setup_signal_handlers(self):
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

    def _handle_signal(self, signum, frame):
        logger.info(f"{self.name} worker received signal {signum}, shutting down gracefully...")
        self.stop()
        sys.exit(0)

    @abstractmethod
    async def fetch_data(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def process_item(self, raw_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def store_data(self, db: Session, processed_data: Dict[str, Any], sync_log: SyncLog) -> bool:
        pass

    @abstractmethod
    async def run_sync(self):
        pass

    async def start(self):
        self.is_running = True
        logger.info(f"Starting {self.name} worker with interval {self.interval_seconds} seconds")

        while self.is_running:
            try:
                await self.run_sync()
            except KeyboardInterrupt:
                logger.info(f"{self.name} worker interrupted by user")
                break
            except Exception as e:
                logger.error(f"Error in {self.name} worker: {str(e)}", exc_info=True)

            if self.is_running:
                logger.info(f"{self.name} worker sleeping for {self.interval_seconds} seconds")
                await asyncio.sleep(self.interval_seconds)

        logger.info(f"{self.name} worker stopped")

    def stop(self):
        logger.info(f"Stopping {self.name} worker")
        self.is_running = False

    async def run_once(self):
        logger.info(f"Running {self.name} worker once")
        try:
            await self.run_sync()
            logger.info(f"{self.name} worker single run completed")
        except Exception as e:
            logger.error(f"Error in {self.name} worker single run: {str(e)}", exc_info=True)
            raise

from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, Column, DateTime, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class BaseModel(Base):
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class SAPCustomer(BaseModel):
    __tablename__ = "sap_customers"

    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    sap_data = Column(JSON, nullable=False)

    __table_args__ = (
        Index("idx_sap_customer_code", "customer_code"),
        Index("idx_sap_customer_created", "created_at"),
    )


class SAPSalesOrder(BaseModel):
    __tablename__ = "sap_sales_orders"

    order_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_code = Column(String(50), index=True)
    document_date = Column(DateTime)
    sap_data = Column(JSON, nullable=False)

    __table_args__ = (
        Index("idx_sap_order_number", "order_number"),
        Index("idx_sap_order_customer", "customer_code"),
        Index("idx_sap_order_date", "document_date"),
    )


class SAPCreditLimit(BaseModel):
    __tablename__ = "sap_credit_limits"

    customer_code = Column(String(50), nullable=False, index=True)
    segment = Column(String(50), nullable=False)
    sap_data = Column(JSON, nullable=False)

    __table_args__ = (
        Index("idx_sap_credit_customer_segment", "customer_code", "segment", unique=True),
        Index("idx_sap_credit_updated", "updated_at"),
    )


class SyncLog(BaseModel):
    __tablename__ = "sync_logs"

    sync_type = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime)
    records_processed = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_message = Column(String(500))
    details = Column(JSON, default={})

    __table_args__ = (
        Index("idx_sync_log_type_status", "sync_type", "status"),
        Index("idx_sync_log_dates", "started_at", "completed_at"),
    )

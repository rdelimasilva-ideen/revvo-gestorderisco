from contextlib import contextmanager
from typing import Generator

from config import (
    DB_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    DB_POOL_SIZE,
    DB_POOL_TIMEOUT,
    IS_PRODUCTION,
    get_database_url,
)
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool
from src.database.models import Base

DATABASE_URL = get_database_url()

if IS_PRODUCTION:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=False,
        future=True,
        connect_args={"connect_timeout": 10, "options": "-c statement_timeout=30000"},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        pool_size=DB_POOL_SIZE,
        max_overflow=DB_MAX_OVERFLOW,
        pool_timeout=DB_POOL_TIMEOUT,
        pool_recycle=DB_POOL_RECYCLE,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

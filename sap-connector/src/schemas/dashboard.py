from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class MonthlyMetric(BaseModel):
    """Modelo para métricas mensais do dashboard"""

    month: str
    avg_payment_term: float
    score: float
    billing_amount: float
    limit_usage_pct: float


class HighlightIndicators(BaseModel):
    """Modelo para indicadores destacados do dashboard"""

    current_score: float
    score_variation_points: float
    avg_billing_last_3m: float
    avg_billing_variation_pct: float
    credit_limit: float
    credit_limit_used_pct: float
    status: str
    overdue_amount: float
    current_max_delay_days: int
    max_delay_last_12m: int


class DashboardResponse(BaseModel):
    """Modelo para resposta do dashboard"""

    customer: str
    period_months: int
    payment_term_series: List[MonthlyMetric]
    billing_series: List[MonthlyMetric]
    highlights: HighlightIndicators
    generated_at: str

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class CreditCalculationRequest(BaseModel):
    customer: str
    company_code: str = "1000"
    reference_date: Optional[str] = None


class CreditMetrics(BaseModel):
    hc: float = Field(description="purchase_history")
    vc: float = Field(description="average_purchase_value")
    pp: float = Field(description="payment_term")
    in_: float = Field(description="delinquency", alias="in")
    va: float = Field(description="overdue_value")
    se_count: float = Field(description="serasa_count")
    se_value: float = Field(description="serasa_value")

    model_config = {"populate_by_name": True}


class StandardizedMetrics(BaseModel):
    z_hc: float
    z_vc: float
    z_pp: float
    z_in: float
    z_va: float
    z_se_count: float
    z_se_value: float


class CreditScoreResponse(BaseModel):
    customer: str
    score: float
    probability_default: float
    confidence: float
    multiplier: float
    average_purchase_value: float
    suggested_credit_limit: float
    risk_level: str
    calculation_date: str
    metrics: CreditMetrics
    standardized_metrics: StandardizedMetrics


class GlobalStatistics(BaseModel):
    mean_hc: float = 15.0
    std_hc: float = 8.0
    mean_vc: float = 5000.0
    std_vc: float = 3000.0
    mean_pp: float = 30.0
    std_pp: float = 15.0
    mean_in: float = 5.0
    std_in: float = 10.0
    mean_va: float = 500.0
    std_va: float = 1500.0
    mean_se_count: float = 0.5
    std_se_count: float = 2.0
    mean_se_value: float = 1000.0
    std_se_value: float = 5000.0


class ModelWeights(BaseModel):
    w1: float = 0.25
    w2: float = 0.15
    w3: float = 0.20
    w4: float = 0.15
    w5: float = 0.10
    w6: float = 0.10
    w7: float = 0.05


class ModelParameters(BaseModel):
    max_factor: float = 3.0
    limit_factor_max: float = 5.0


class KSDecile(BaseModel):
    decile: int
    n_clients: int
    n_good: int
    n_bad: int
    pct_good_cumulative: float
    pct_bad_cumulative: float
    ks: float


class KSCalculationResponse(BaseModel):
    ks_value: float
    ks_decile: int
    total_clients: int
    good_clients: int
    bad_clients: int
    calculation_date: str
    deciles: List[KSDecile]


class BatchCalculationRequest(BaseModel):
    customers: List[str]
    company_code: str = "1000"


class BatchCalculationResponse(BaseModel):
    success_count: int
    error_count: int
    results: List[CreditScoreResponse]
    errors: List[Dict[str, str]]

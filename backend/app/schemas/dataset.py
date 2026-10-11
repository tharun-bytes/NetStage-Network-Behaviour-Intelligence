from typing import Any, Optional
from pydantic import BaseModel, Field

class DatasetProfileResponse(BaseModel):
    source_name: str
    rows_count: int
    columns_count: int
    duplicate_rows: int
    duplicate_percentage: float
    target_column: Optional[str]
    target_distribution: dict[str, Any]
    numeric_feature_count: int
    categorical_feature_count: int
    numeric_features: list[str]
    categorical_features: list[str]
    missing_summary: dict[str, Any]
    infinite_values_count: int
    numeric_summary: dict[str, Any]
    categorical_summary: dict[str, Any]
    top_correlations: list[dict[str, Any]]
    warnings_count: int
    warnings: list[str]

class RecordsQuery(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(25, ge=1, le=200)
    search: Optional[str] = None
    target_filter: Optional[str] = None
    proto_filter: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "asc"

class RecordsResponse(BaseModel):
    total_records: int
    page: int
    page_size: int
    total_pages: int
    records: list[dict[str, Any]]

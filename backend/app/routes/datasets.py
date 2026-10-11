import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import pandas as pd
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from backend.app.config import settings
from backend.app.schemas.dataset import DatasetProfileResponse, RecordsResponse
from backend.app.state import app_state
from src.data.loader import DataLoaderError, load_network_flow_csv
from src.data.validation import SchemaValidationError, validate_and_profile_dataset

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/sample", response_model=DatasetProfileResponse)
def load_sample_dataset() -> DatasetProfileResponse:
    """Load the bundled standard UCI RT-IoT2022 demonstration fixture."""
    sample_file = settings.DATA_DIR / "sample_rt_iot2022.csv"
    if not sample_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample dataset fixture not found on server disk."
        )

    try:
        df, meta = load_network_flow_csv(sample_file)
        profile, warnings = validate_and_profile_dataset(df, target_column_candidate="Attack_type")
        
        # Cache in memory state
        app_state.dataset_df = df
        app_state.dataset_name = "sample_rt_iot2022.csv"
        app_state.dataset_profile = profile
        app_state.dataset_profile["warnings"] = warnings
        app_state.dataset_profile["source_name"] = "sample_rt_iot2022.csv"
        app_state.last_analysis_timestamp = datetime.now(timezone.utc).isoformat()

        return DatasetProfileResponse(**app_state.dataset_profile)

    except (DataLoaderError, SchemaValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error loading sample: {str(e)}")

@router.post("/upload", response_model=DatasetProfileResponse)
async def upload_dataset(
    file: UploadFile = File(...)
) -> DatasetProfileResponse:
    """Upload a network flow CSV file, validate schema, compute statistical profile."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files (.csv) are accepted for network flow analysis."
        )

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    try:
        bytes_io = io.BytesIO(contents)
        bytes_io.name = file.filename
        df, meta = load_network_flow_csv(bytes_io)
        profile, warnings = validate_and_profile_dataset(df, target_column_candidate="Attack_type")

        # Cache in state
        app_state.dataset_df = df
        app_state.dataset_name = file.filename
        app_state.dataset_profile = profile
        app_state.dataset_profile["warnings"] = warnings
        app_state.dataset_profile["source_name"] = file.filename
        app_state.last_analysis_timestamp = datetime.now(timezone.utc).isoformat()

        return DatasetProfileResponse(**app_state.dataset_profile)

    except (DataLoaderError, SchemaValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Dataset processing error: {str(e)}")

@router.get("/profile", response_model=DatasetProfileResponse)
def get_dataset_profile() -> DatasetProfileResponse:
    """Return the profile of the currently active dataset."""
    if app_state.dataset_profile is None or app_state.dataset_df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No dataset currently loaded. Please load the sample dataset or upload a CSV."
        )
    return DatasetProfileResponse(**app_state.dataset_profile)

@router.get("/records", response_model=RecordsResponse)
def get_dataset_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: Optional[str] = Query(None),
    target_filter: Optional[str] = Query(None),
    proto_filter: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: Optional[str] = Query("asc"),
) -> RecordsResponse:
    """Paginated, searchable, and filtered network flow records."""
    df = app_state.dataset_df
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No dataset currently loaded."
        )

    filtered_df = df.copy()

    # Apply target filter
    if target_filter and "Attack_type" in filtered_df.columns:
        filtered_df = filtered_df[filtered_df["Attack_type"] == target_filter]

    # Apply protocol filter
    if proto_filter and "proto" in filtered_df.columns:
        filtered_df = filtered_df[filtered_df["proto"] == proto_filter]

    # Search filter across string columns
    if search:
        search_lower = search.lower()
        mask = False
        for col in filtered_df.columns:
            mask = mask | filtered_df[col].astype(str).str.lower().str.contains(search_lower, regex=False)
        filtered_df = filtered_df[mask]

    # Sorting
    if sort_by and sort_by in filtered_df.columns:
        ascending = (sort_order.lower() == "asc")
        filtered_df = filtered_df.sort_values(by=sort_by, ascending=ascending)

    total_records = len(filtered_df)
    total_pages = max(1, (total_records + page_size - 1) // page_size)
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_records)

    records_page = filtered_df.iloc[start_idx:end_idx].to_dict(orient="records")
    # Clean NaN/Inf for JSON compliance
    clean_records = []
    for r in records_page:
        clean_r = {k: (None if pd.isna(v) else v) for k, v in r.items()}
        clean_records.append(clean_r)

    return RecordsResponse(
        total_records=total_records,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        records=clean_records
    )

@router.get("/export")
def export_dataset_csv(target_filter: Optional[str] = Query(None)):
    """Export filtered or complete active dataset as downloadable CSV."""
    df = app_state.dataset_df
    if df is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No dataset loaded to export.")

    out_df = df
    if target_filter and "Attack_type" in out_df.columns:
        out_df = out_df[out_df["Attack_type"] == target_filter]

    csv_buffer = io.StringIO()
    out_df.to_csv(csv_buffer, index=False)
    csv_bytes = csv_buffer.getvalue().encode("utf-8")

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="netsage_export_{target_filter or "all"}.csv"'}
    )

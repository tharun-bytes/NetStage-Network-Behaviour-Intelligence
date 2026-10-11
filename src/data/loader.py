import io
from pathlib import Path
from typing import BinaryIO, Optional, Union
import pandas as pd

MAX_ALLOWED_ROWS = 500_000

class DataLoaderError(Exception):
    """Raised when data loading fails due to formatting or file constraints."""
    pass

def load_network_flow_csv(
    source: Union[str, Path, io.BytesIO, BinaryIO],
    encoding: str = "utf-8",
    nrows: Optional[int] = None
) -> tuple[pd.DataFrame, dict]:
    """
    Safely load network flow CSV file into a pandas DataFrame.
    Validates non-empty file, parses columns, and produces loading metadata.
    """
    try:
        if isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise DataLoaderError(f"File not found: {path}")
            if path.stat().st_size == 0:
                raise DataLoaderError("The provided CSV file is empty (0 bytes).")
            
            # Read first few bytes to check encoding fallback
            try:
                df = pd.read_csv(path, nrows=nrows, encoding=encoding, low_memory=False)
            except UnicodeDecodeError:
                df = pd.read_csv(path, nrows=nrows, encoding="latin1", low_memory=False)
            file_size_bytes = path.stat().st_size
            source_name = path.name
        else:
            # File-like object (e.g. from FastAPI UploadFile)
            source.seek(0, io.SEEK_END)
            file_size_bytes = source.tell()
            source.seek(0)
            if file_size_bytes == 0:
                raise DataLoaderError("Uploaded file is empty (0 bytes).")
            
            try:
                df = pd.read_csv(source, nrows=nrows, encoding=encoding, low_memory=False)
            except UnicodeDecodeError:
                source.seek(0)
                df = pd.read_csv(source, nrows=nrows, encoding="latin1", low_memory=False)
            source_name = getattr(source, "name", "uploaded_file.csv")

        if df.empty:
            raise DataLoaderError("The CSV contains headers but zero data rows.")

        if len(df) > MAX_ALLOWED_ROWS:
            df = df.iloc[:MAX_ALLOWED_ROWS]

        # Strip whitespace from string column names
        df.columns = [str(c).strip() for c in df.columns]

        metadata = {
            "source_name": source_name,
            "rows_count": len(df),
            "columns_count": len(df.columns),
            "file_size_bytes": file_size_bytes,
            "memory_usage_mb": round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2),
            "columns": list(df.columns),
        }
        return df, metadata

    except pd.errors.EmptyDataError:
        raise DataLoaderError("The supplied file contains no parsable CSV data.")
    except pd.errors.ParserError as e:
        raise DataLoaderError(f"Failed to parse CSV format: {str(e)}")
    except Exception as e:
        if isinstance(e, DataLoaderError):
            raise
        raise DataLoaderError(f"Unexpected error loading dataset: {str(e)}")

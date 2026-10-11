from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any, Optional
import joblib
import sklearn

def generate_dataset_fingerprint(df_columns: list[str], row_count: int) -> str:
    """Generate SHA256 fingerprint representing dataset schema and volume."""
    raw = f"{','.join(sorted(df_columns))}:{row_count}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]

def save_model_artifact(
    pipeline: Any,
    metadata: dict[str, Any],
    metrics: dict[str, Any],
    output_dir: Path,
    model_id: Optional[str] = None
) -> str:
    """
    Persist scikit-learn pipeline and comprehensive metadata JSON to disk safely.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    model_type = metadata.get("model_type", "model")
    if not model_id:
        model_id = f"{model_type}_{timestamp}"

    pipeline_path = output_dir / f"{model_id}.joblib"
    metadata_path = output_dir / f"{model_id}_metadata.json"

    # Save fitted Pipeline
    joblib.dump(pipeline, pipeline_path, compress=3)

    # Enrich metadata
    full_metadata = {
        "model_id": model_id,
        "saved_at": datetime.now(timezone.utc).isoformat(),
        "scikit_learn_version": sklearn.__version__,
        "pipeline_file": pipeline_path.name,
        "metadata": metadata,
        "metrics": metrics,
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(full_metadata, f, indent=2)

    return model_id

def load_model_artifact(
    models_dir: Path,
    model_id: str
) -> tuple[Any, dict[str, Any]]:
    """
    Safely load a trained model pipeline and its metadata from the trusted models directory.
    """
    pipeline_path = models_dir / f"{model_id}.joblib"
    metadata_path = models_dir / f"{model_id}_metadata.json"

    if not pipeline_path.exists() or not metadata_path.exists():
        raise FileNotFoundError(f"Model artifact with ID '{model_id}' was not found in {models_dir}.")

    pipeline = joblib.load(pipeline_path)
    with open(metadata_path, "r", encoding="utf-8") as f:
        full_metadata = json.load(f)

    return pipeline, full_metadata

def list_available_model_artifacts(models_dir: Path) -> list[dict[str, Any]]:
    """
    Scan models directory for persisted model artifacts and return their metadata summaries.
    """
    if not models_dir.exists():
        return []

    artifacts = []
    for meta_file in sorted(models_dir.glob("*_metadata.json"), reverse=True):
        try:
            with open(meta_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                artifacts.append({
                    "model_id": data.get("model_id"),
                    "saved_at": data.get("saved_at"),
                    "model_name": data.get("metadata", {}).get("model_name"),
                    "model_type": data.get("metadata", {}).get("model_type"),
                    "accuracy": data.get("metrics", {}).get("accuracy"),
                    "macro_f1": data.get("metrics", {}).get("macro_f1"),
                    "weighted_f1": data.get("metrics", {}).get("weighted_f1"),
                    "test_samples_count": data.get("metadata", {}).get("test_samples_count"),
                })
        except Exception:
            continue

    return artifacts

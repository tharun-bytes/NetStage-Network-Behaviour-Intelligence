# NetSage Model Artifacts Directory

This directory stores persisted scikit-learn Machine Learning pipelines and their corresponding metadata descriptors.

## Artifact Structure
For each trained model, two synchronized files are produced:
1. `<model_id>.joblib`:
   - Contains the serialized, fitted `Pipeline` including all numerical transformers (e.g. median imputer, StandardScaler) and categorical encoders (`OneHotEncoder`).
   - Saved with compression level 3.
2. `<model_id>_metadata.json`:
   - Contains dataset fingerprints, hyperparameters, random seed, training duration, and full evaluation metrics (Accuracy, Balanced Accuracy, Macro F1, Weighted F1, Confusion Matrix, and Per-Class breakdown).

## Security Notice
- Artifacts in this directory are loaded exclusively through internal application APIs (`src/ml/artifacts.py`).
- Arbitrary user-uploaded pickled/joblib model files are rejected to protect against code injection or deserialization attacks.

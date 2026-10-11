from typing import Any, Optional
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
    roc_auc_score,
)
from sklearn.preprocessing import label_binarize

def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None,
    classes: Optional[list[str]] = None
) -> dict[str, Any]:
    """
    Compute comprehensive multi-class evaluation metrics with strict zero-division guards.
    """
    if classes is None:
        classes = sorted(list(set(y_true) | set(y_pred)))

    # Overall metrics
    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))

    # Macro & Weighted metrics
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )

    # Per-class breakdown
    prec_per_class, rec_per_class, f1_per_class, support_per_class = precision_recall_fscore_support(
        y_true, y_pred, labels=classes, zero_division=0
    )

    per_class_metrics = {}
    for idx, cls_name in enumerate(classes):
        per_class_metrics[cls_name] = {
            "precision": round(float(prec_per_class[idx]), 4),
            "recall": round(float(rec_per_class[idx]), 4),
            "f1_score": round(float(f1_per_class[idx]), 4),
            "support": int(support_per_class[idx]),
        }

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=classes)
    confusion_matrix_data = {
        "labels": classes,
        "matrix": cm.tolist()
    }

    # Multi-class ROC-AUC (One-vs-Rest) if probabilities provided
    roc_auc = None
    if y_prob is not None and len(classes) > 1:
        try:
            # Check if all classes present in test split
            y_bin = label_binarize(y_true, classes=classes)
            if y_bin.shape[1] == y_prob.shape[1]:
                roc_auc = float(roc_auc_score(y_bin, y_prob, average="macro", multi_class="ovr"))
        except Exception:
            roc_auc = None

    # Text report
    text_report = classification_report(y_true, y_pred, labels=classes, zero_division=0)

    return {
        "accuracy": round(acc, 4),
        "balanced_accuracy": round(bal_acc, 4),
        "macro_precision": round(float(prec_macro), 4),
        "macro_recall": round(float(rec_macro), 4),
        "macro_f1": round(float(f1_macro), 4),
        "weighted_precision": round(float(prec_weighted), 4),
        "weighted_recall": round(float(rec_weighted), 4),
        "weighted_f1": round(float(f1_weighted), 4),
        "roc_auc_ovr": round(roc_auc, 4) if roc_auc is not None else None,
        "per_class": per_class_metrics,
        "confusion_matrix": confusion_matrix_data,
        "classification_report_text": text_report,
        "total_test_samples": len(y_true)
    }

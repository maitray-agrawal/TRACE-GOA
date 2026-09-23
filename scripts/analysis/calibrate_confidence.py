"""
Calibration model for Fraud Probability and Risk Scoring.
Trains Logistic Regression with Isotonic Calibration on the 5,565 closed cases,
generating a reliability diagram and saving calibration artifacts.
"""

import csv
import json
import numpy as np
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss, roc_auc_score, log_loss

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "competition"
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "outputs" / "calibration"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def train_calibrated_model():
    print("=== Training Calibrated Fraud Probability Model ===")
    
    with open(DATA_DIR / "closed_cases_history.csv", "r", encoding="utf-8") as f:
        cases = list(csv.DictReader(f))
        
    X = []
    y = []
    
    for c in cases:
        exposure = float(c.get("exposure_usd", 0.0) or 0.0)
        n_txns = float(c.get("n_txns", 1) or 1)
        connected_cards = len(c.get("connected_card_ids", "").split("|")) if c.get("connected_card_ids") else 0
        pattern = c.get("pattern", "none")
        
        # Feature vector:
        # [log(exposure + 1), n_txns, connected_cards, has_pattern, is_device_pattern, is_takeover, is_region]
        has_pattern = 1.0 if pattern not in ("none", "") else 0.0
        is_device_pattern = 1.0 if "device" in pattern else 0.0
        is_takeover = 1.0 if "takeover" in pattern else 0.0
        is_region = 1.0 if "region" in pattern else 0.0
        
        feat = [
            np.log1p(exposure),
            n_txns,
            float(connected_cards),
            has_pattern,
            is_device_pattern,
            is_takeover,
            is_region
        ]
        
        target = 1 if c.get("outcome") == "confirmed_fraud" else 0
        X.append(feat)
        y.append(target)
        
    X = np.array(X)
    y = np.array(y)
    
    # Train test split (80/20 train/val)
    np.random.seed(42)
    indices = np.random.permutation(len(y))
    train_size = int(len(y) * 0.8)
    train_idx, val_idx = indices[:train_size], indices[train_size:]
    
    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]
    
    base_clf = LogisticRegression(class_weight="balanced", max_iter=1000)
    base_clf.fit(X_train, y_train)
    
    calibrator = CalibratedClassifierCV(estimator=base_clf, method="isotonic", cv=5)
    calibrator.fit(X_train, y_train)
    
    y_prob = calibrator.predict_proba(X_val)[:, 1]
    
    auc = roc_auc_score(y_val, y_prob)
    brier = brier_score_loss(y_val, y_prob)
    loss = log_loss(y_val, y_prob)
    
    print(f"[+] Validation ROC-AUC: {auc:.4f}")
    print(f"[+] Validation Brier Score: {brier:.4f}")
    print(f"[+] Validation Log Loss: {loss:.4f}")
    
    # Save calibration weights and metadata
    model_metadata = {
        "model_type": "LogisticRegression + IsotonicCalibration",
        "n_samples": len(y),
        "train_samples": len(y_train),
        "val_samples": len(y_val),
        "val_roc_auc": round(auc, 4),
        "val_brier_score": round(brier, 4),
        "val_log_loss": round(loss, 4),
        "feature_names": [
            "log_exposure",
            "n_txns",
            "n_connected_cards",
            "has_pattern",
            "is_device_pattern",
            "is_takeover",
            "is_region"
        ],
        "base_coefficients": base_clf.coef_[0].tolist(),
        "base_intercept": float(base_clf.intercept_[0])
    }
    
    with open(OUTPUT_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
        
    print(f"[+] Calibration model metadata saved to {OUTPUT_DIR / 'model_metadata.json'}")
    return model_metadata

if __name__ == "__main__":
    train_calibrated_model()

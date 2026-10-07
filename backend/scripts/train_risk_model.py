import os
import sys
import json
from datetime import datetime
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.features import FEATURE_NAMES

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "invoice_training.csv"))
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
MODEL_PATH = os.path.join(MODEL_DIR, "invoice_risk_model.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")


def train_model():
    print("=" * 65)
    print(" VeriFlow ML Risk Classifier Training Pipeline")
    print(" NOTICE: DEMO MODEL — Trained on synthetic reference data")
    print(" Purpose: Anomaly & Exception Scoring (NOT definitive fraud proof)")
    print("=" * 65)

    if not os.path.exists(DATA_PATH):
        print(f"Data not found at {DATA_PATH}. Generating synthetic training dataset...")
        from scripts.generate_training_data import generate_training_dataset
        generate_training_dataset(1500)

    # 1. Load Data
    print(f"\n1. Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"   Total records: {len(df)}")

    # 2. Validate required columns
    required_cols = FEATURE_NAMES + ["label"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in training dataset: {missing_cols}")

    # 3. Clean & handle missing values
    df = df[required_cols].copy()
    for col in FEATURE_NAMES:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    X = df[FEATURE_NAMES]
    y = df["label"].astype(int)

    # 4. Train / Test Split (80/20 Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"   Training samples: {len(X_train)} | Test samples: {len(X_test)}")
    print(f"   Suspicious ratio in test set: {y_test.mean():.2%}")

    # 5. Model Architecture: Explainable RandomForestClassifier
    print("\n2. Training RandomForestClassifier (n_estimators=100, max_depth=6)...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced",
        min_samples_split=5,
    )
    clf.fit(X_train, y_train)

    # 6. Evaluation on Holdout Test Set
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 65)
    print(" MODEL EVALUATION METRICS (Test Set)")
    print("=" * 65)
    print(f" Accuracy : {acc:.4f} ({acc*100:.2f}%)")
    print(f" Precision: {prec:.4f} ({prec*100:.2f}%)")
    print(f" Recall   : {rec:.4f} ({rec*100:.2f}%)")
    print(f" F1 Score : {f1:.4f} ({f1*100:.2f}%)")
    print("\n Confusion Matrix:")
    print(f"   TN: {cm[0][0]:<4} | FP: {cm[0][1]:<4}")
    print(f"   FN: {cm[1][0]:<4} | TP: {cm[1][1]:<4}")

    # Feature Importances
    importances = sorted(
        zip(FEATURE_NAMES, clf.feature_importances_),
        key=lambda x: x[1],
        reverse=True
    )
    print("\n Top Anomaly Feature Importances:")
    for feat, imp in importances[:6]:
        print(f"   • {feat:<35}: {imp:.4f}")

    # 7. Save Model & Metadata
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"\n3. Saved trained model binary to: {MODEL_PATH}")

    metadata = {
        "model_version": "veriflow-risk-v1",
        "model_type": "RandomForestClassifier",
        "trained_at": datetime.utcnow().isoformat(),
        "is_synthetic_training_data": True,
        "features": FEATURE_NAMES,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": cm.tolist(),
        },
        "disclaimer": "DEMO MODEL — Trained on synthetic data. Outputs indicate review urgency, not legal fraud.",
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"   Saved model metadata & feature order to: {METADATA_PATH}")

    print("\n Training Complete!")
    return clf, metadata


if __name__ == "__main__":
    train_model()

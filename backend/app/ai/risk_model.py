import os
import json
import logging
from typing import Tuple, Optional, List
import pandas as pd
import joblib
from app.ai.features import FEATURE_NAMES

logger = logging.getLogger("veriflow.ai.risk_model")

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
DEFAULT_MODEL_PATH = os.path.join(MODEL_DIR, "invoice_risk_model.joblib")
DEFAULT_METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")


class InvoiceRiskModel:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH, metadata_path: str = DEFAULT_METADATA_PATH):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.model = None
        self.model_version = "veriflow-risk-v1"
        self.features: List[str] = FEATURE_NAMES
        self.load_model()

    def load_model(self) -> bool:
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                logger.info("Loaded ML risk model from %s", self.model_path)
                if os.path.exists(self.metadata_path):
                    with open(self.metadata_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        self.model_version = meta.get("model_version", "veriflow-risk-v1")
                        self.features = meta.get("features", FEATURE_NAMES)
                return True
            except Exception as e:
                logger.warning("Failed to load model from %s: %s", self.model_path, e)
                self.model = None
                return False
        return False

    def predict_risk(self, features_df: pd.DataFrame) -> Tuple[float, int]:
        """
        Predicts anomaly probability and converts to a 0-100 ML risk score.
        Returns: (probability, ml_score)
        """
        # Ensure correct column order
        clean_df = features_df[FEATURE_NAMES].copy()

        if self.model is not None:
            try:
                # predict_proba returns [prob_normal, prob_suspicious]
                prob = float(self.model.predict_proba(clean_df)[0][1])
                ml_score = int(round(prob * 100))
                return prob, min(100, max(0, ml_score))
            except Exception as e:
                logger.warning("Error during model inference: %s, using heuristic", e)

        # Statistical heuristic fallback when model is not yet trained
        row = clean_df.iloc[0]
        score = 0.0
        if row["duplicate_similarity"] > 0.5:
            score += row["duplicate_similarity"] * 45
        if row["policy_violation_count"] > 0:
            score += 25
        if row["validation_error_count"] > 0:
            score += min(30, row["validation_error_count"] * 15)
        if row["amount_deviation_percentage"] > 50:
            score += 15

        prob = min(1.0, max(0.0, score / 100.0))
        return prob, int(round(min(100.0, score)))


# Singleton instance
risk_model = InvoiceRiskModel()

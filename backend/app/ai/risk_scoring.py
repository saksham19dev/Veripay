from typing import Dict, Any, List
from app.config import settings

# Configurable rule weights
DEFAULT_RULE_SCORES = {
    "DUPLICATE": 30,
    "TAX_MISMATCH": 20,
    "POLICY_VIOLATION": 20,
    "MISSING_FIELD": 15,
    "AMOUNT_ANOMALY": 15,
    "INVALID_DATE": 15,
    "DATA_INCONSISTENCY": 15,
}

WEIGHT_RULE = 0.6
WEIGHT_ML = 0.4


def calculate_rule_score(violations: List[Any], custom_weights: Dict[str, int] = None) -> int:
    """Calculates sum of triggered deterministic rule scores."""
    weights = custom_weights or DEFAULT_RULE_SCORES
    score = 0
    for v in violations:
        v_type = getattr(v, "exception_type", "")
        weight = weights.get(v_type, getattr(v, "score_weight", 15))
        score += weight
    return min(100, max(0, score))


def combine_scores(
    rule_score: int,
    ml_score: int,
    weight_rule: float = WEIGHT_RULE,
    weight_ml: float = WEIGHT_ML,
) -> Dict[str, Any]:
    """
    Combines deterministic rule score and ML anomaly score using configured weights.
    Returns:
    {
        "risk_score": 82,
        "risk_level": "HIGH",
        "rule_score": 50,
        "ml_score": 32
    }
    """
    # Normalized weighted combination
    combined = (weight_rule * rule_score) + (weight_ml * ml_score)
    final_score = int(round(min(100, max(0, combined))))

    # Risk level classification
    if final_score <= settings.RISK_LOW_MAX:
        risk_level = "LOW"
    elif final_score <= settings.RISK_MEDIUM_MAX:
        risk_level = "MEDIUM"
    elif final_score <= settings.RISK_HIGH_MAX:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "rule_score": int(rule_score),
        "ml_score": int(ml_score),
    }

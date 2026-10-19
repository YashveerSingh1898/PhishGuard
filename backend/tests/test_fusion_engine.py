"""Tests for the Risk Fusion Engine."""

import pytest
from app.fusion.engine import (
    compute_risk_fusion,
    DEFAULT_FUSION_CONFIG,
    FusionConfig,
)


def test_required_fusion_fixture():
    """Validates the exact fixture requirement:
    Structural score = 80, NLP score = 50
    Final score = 0.6 * 80 + 0.4 * 50 = 48 + 20 = 68
    Expected verdict = Suspicious under configured demonstration thresholds.
    """
    res = compute_risk_fusion(structural_score=80.0, nlp_score=50.0)

    assert res.structural_score == 80.0
    assert res.nlp_score == 50.0
    assert res.structural_weight == 0.60
    assert res.nlp_weight == 0.40
    assert res.structural_contribution == 48.0
    assert res.nlp_contribution == 20.0
    assert res.final_score == 68.0
    assert res.verdict == "Suspicious"


def test_verdict_threshold_legitimate():
    """Scores strictly below 35.0 produce 'Legitimate'."""
    res = compute_risk_fusion(structural_score=10.0, nlp_score=20.0)
    # 0.6 * 10 + 0.4 * 20 = 6 + 8 = 14.0
    assert res.final_score == 14.0
    assert res.verdict == "Legitimate"


def test_verdict_threshold_suspicious_boundaries():
    """Scores exactly on or between 35.0 and 69.99 produce 'Suspicious'."""
    # Boundary at 35.0: e.g. struct=35, nlp=35 -> 35.0
    res_lower = compute_risk_fusion(structural_score=35.0, nlp_score=35.0)
    assert res_lower.final_score == 35.0
    assert res_lower.verdict == "Suspicious"

    # Near upper bound: e.g. final = 69.0
    res_upper = compute_risk_fusion(structural_score=70.0, nlp_score=67.5)
    # 0.6 * 70 + 0.4 * 67.5 = 42 + 27 = 69.0
    assert res_upper.final_score == 69.0
    assert res_upper.verdict == "Suspicious"


def test_verdict_threshold_phishing():
    """Scores at or above 70.0 produce 'Phishing'."""
    res = compute_risk_fusion(structural_score=90.0, nlp_score=80.0)
    # 0.6 * 90 + 0.4 * 80 = 54 + 32 = 86.0
    assert res.final_score == 86.0
    assert res.verdict == "Phishing"


def test_scores_clamped_to_0_100():
    """Out-of-range inputs are clamped to [0.0, 100.0]."""
    res_high = compute_risk_fusion(structural_score=150.0, nlp_score=200.0)
    assert res_high.final_score == 100.0

    res_low = compute_risk_fusion(structural_score=-50.0, nlp_score=-20.0)
    assert res_low.final_score == 0.0


def test_reasons_and_breakdown_included():
    """Explanations and formula synthesis are present in output."""
    res = compute_risk_fusion(
        structural_score=80.0,
        nlp_score=50.0,
        structural_reasons=["Direct IP host detected."],
        nlp_explanation="Urgent language detected.",
    )
    assert any("Direct IP host detected" in r for r in res.reasons)
    assert any("Urgent language detected" in r for r in res.reasons)
    assert any("Fusion synthesis" in r for r in res.reasons)

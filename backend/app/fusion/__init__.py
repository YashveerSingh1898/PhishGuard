"""Risk Fusion Engine Module for PhishGuard."""

from app.fusion.engine import (
    FusionConfig,
    DEFAULT_FUSION_CONFIG,
    FusionResult,
    compute_risk_fusion,
)

__all__ = [
    "FusionConfig",
    "DEFAULT_FUSION_CONFIG",
    "FusionResult",
    "compute_risk_fusion",
]

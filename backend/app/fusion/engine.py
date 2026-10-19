"""Risk Fusion Engine for PhishGuard.

Aggregates the deterministic Structural Layer (Automata Theory) and the contextual
Linguistic Layer (Natural Language Processing) into a unified threat score:

    Final Score = 0.6 * Structural Score + 0.4 * NLP Score

Verdict Classification:
- 0.00 <= Score < 35.00: Legitimate (Minimal risk)
- 35.00 <= Score < 70.00: Suspicious (Elevated anomaly, caution advised)
- 70.00 <= Score <= 100.0: Phishing (High threat probability)
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List


@dataclass(frozen=True)
class FusionConfig:
    """Configurable weights and classification thresholds for risk aggregation."""
    structural_weight: float = 0.60
    nlp_weight: float = 0.40
    legitimate_max: float = 34.99
    suspicious_min: float = 35.00
    suspicious_max: float = 69.99
    phishing_min: float = 70.00


DEFAULT_FUSION_CONFIG = FusionConfig()


@dataclass
class FusionResult:
    """Result of combining structural and NLP scores."""
    structural_score: float
    nlp_score: float
    structural_weight: float
    nlp_weight: float
    structural_contribution: float
    nlp_contribution: float
    final_score: float
    verdict: str  # "Legitimate", "Suspicious", or "Phishing"
    reasons: List[str]
    thresholds: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "structural_score": round(self.structural_score, 2),
            "nlp_score": round(self.nlp_score, 2),
            "structural_weight": self.structural_weight,
            "nlp_weight": self.nlp_weight,
            "structural_contribution": round(self.structural_contribution, 2),
            "nlp_contribution": round(self.nlp_contribution, 2),
            "final_score": round(self.final_score, 2),
            "verdict": self.verdict,
            "reasons": self.reasons,
            "thresholds": self.thresholds,
        }


def compute_risk_fusion(
    structural_score: float,
    nlp_score: float,
    config: FusionConfig = DEFAULT_FUSION_CONFIG,
    structural_reasons: List[str] = None,
    nlp_explanation: str = "",
) -> FusionResult:
    """Computes calibrated risk fusion across structural and NLP signals."""
    # Ensure inputs are strictly clamped to [0.0, 100.0]
    s_struct = min(100.0, max(0.0, float(structural_score)))
    s_nlp = min(100.0, max(0.0, float(nlp_score)))

    # Compute weighted contributions using full floating point precision
    c_struct = config.structural_weight * s_struct
    c_nlp = config.nlp_weight * s_nlp
    raw_final = c_struct + c_nlp
    final_score = min(100.0, max(0.0, raw_final))

    # Determine discrete academic verdict based on configured thresholds
    if final_score < config.suspicious_min:
        verdict = "Legitimate"
    elif final_score < config.phishing_min:
        verdict = "Suspicious"
    else:
        verdict = "Phishing"

    # Assemble contextual reasons
    reasons: List[str] = []
    if structural_reasons:
        reasons.extend(structural_reasons)
    elif s_struct > 0:
        reasons.append(f"Structural analysis identified anomalies contributing {s_struct:.1f}/100 risk.")
    else:
        reasons.append("Structural evaluation detected standard URL and domain naming.")

    if nlp_explanation:
        reasons.append(nlp_explanation)
    elif s_nlp > 0:
        reasons.append(f"NLP text classification estimated {s_nlp:.1f}/100 phishing probability.")

    reasons.append(
        f"Fusion synthesis: {config.structural_weight:.0%} × {s_struct:.1f} (structural) + "
        f"{config.nlp_weight:.0%} × {s_nlp:.1f} (NLP) = {final_score:.1f}/100 ({verdict})."
    )

    thresholds_dict = {
        "legitimate_max": config.legitimate_max,
        "suspicious_min": config.suspicious_min,
        "suspicious_max": config.suspicious_max,
        "phishing_min": config.phishing_min,
    }

    return FusionResult(
        structural_score=s_struct,
        nlp_score=s_nlp,
        structural_weight=config.structural_weight,
        nlp_weight=config.nlp_weight,
        structural_contribution=c_struct,
        nlp_contribution=c_nlp,
        final_score=final_score,
        verdict=verdict,
        reasons=reasons,
        thresholds=thresholds_dict,
    )

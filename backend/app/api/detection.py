"""API Router for Phishing Threat Detection and Dual-Layer Risk Fusion.

Connects submitted email artifacts to the formal MOC Automata Engine,
evaluating structural regex rules step-by-step with real deterministic state
transitions, executing NLP classification, and performing weighted risk fusion.
"""

import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.automata.structural_rules import StructuralRuleEvaluator, STRUCTURAL_RULES
from app.nlp.classifier import get_nlp_classifier
from app.fusion.engine import compute_risk_fusion, DEFAULT_FUSION_CONFIG

router = APIRouter(prefix="", tags=["Threat Detection Engine"])

# Initialize structural rule evaluator singleton
_evaluator = StructuralRuleEvaluator()


class DetectionRequest(BaseModel):
    """Payload representing an email vector for phishing analysis."""
    sender: Optional[str] = Field("", description="Sender email address or display name")
    url: Optional[str] = Field("", description="Suspicious URL link contained in the message")
    subject: Optional[str] = Field("", description="Email subject line")
    body: Optional[str] = Field("", description="Full email body content")

    model_config = {
        "json_schema_extra": {
            "example": {
                "sender": "Security Team <security@paypal-update.net>",
                "url": "http://192.168.1.55/update-banking-security-alert.xyz/auth",
                "subject": "URGENT: Your account has been suspended",
                "body": "Your account has been suspended due to suspicious activity. Verify your identity at http://192.168.1.55/update-banking-security-alert.xyz/auth.",
            }
        }
    }


class MatchedIndicatorSchema(BaseModel):
    pattern_name: str
    field_examined: str
    matched_indicator: str
    explanation: str
    weight: float
    regex_pattern: Optional[str] = None


class EvaluatedRuleSchema(BaseModel):
    """Detailed structural rule evaluation containing compiled automata and execution traces."""
    rule_id: str
    rule_name: str
    regex_pattern: str
    description: str
    target_field: str
    weight: float
    candidate_input: str
    matched: bool
    score_contribution: float
    automata: Dict[str, Any]
    candidate_trace: Dict[str, Any]
    url_trace: Dict[str, Any]
    explanation: str


class DetectionResponse(BaseModel):
    """Unified dual-layer phishing threat analysis response."""
    success: bool
    input_summary: Dict[str, Any]
    structural_score: float
    matched_indicators: List[MatchedIndicatorSchema]
    evaluated_rules: List[EvaluatedRuleSchema] = Field(default_factory=list)
    nlp_score: float
    nlp_preprocessed_text: str = ""
    nlp_tokens: List[str] = Field(default_factory=list)
    predicted_class: str
    class_probabilities: Dict[str, float]
    structural_weight: float
    nlp_weight: float
    structural_contribution: float
    nlp_contribution: float
    final_score: float
    verdict: str  # "Legitimate", "Suspicious", or "Phishing"
    reasons: List[str]
    limitations_note: str
    execution_time_ms: float


@router.post(
    "/detection/analyze",
    response_model=DetectionResponse,
    summary="Dual-Layer Phishing Analysis (Structural DFA + NLP + Risk Fusion)",
)
@router.post(
    "/detect",
    response_model=DetectionResponse,
    include_in_schema=False,
    summary="Alias for /detection/analyze",
)
async def analyze_threat(request: DetectionRequest) -> DetectionResponse:
    """Executes the complete PhishGuard threat evaluation pipeline:
    
    1. URL Extraction: Extracts destination link from URL field or message body.
    2. Structural Automata Layer: Evaluates formal regex rules through the MOC pipeline:
       Regex -> Thompson NFA -> Subset DFA -> Minimized DFA -> Execution Trace.
    3. NLP Layer: Preprocesses text, computes TF-IDF vector, and infers Naive Bayes posterior probability.
    4. Risk Fusion: Calibrates Final Score = 0.6 * S_struct + 0.4 * S_nlp to produce formal verdict.
    """
    start_time = time.perf_counter()

    try:
        sender = (request.sender or "").strip()
        url = (request.url or "").strip()
        subject = (request.subject or "").strip()
        body = (request.body or "").strip()

        # 1. URL Extraction & Structural Automata Evaluation
        orig_url, extracted_url = _evaluator.extract_url_from_email(url, body)
        structural_score, rule_evaluations, structural_summary = _evaluator.evaluate(
            url=url, sender=sender, body=body
        )

        # Build matched indicators list for compatibility
        matched_indicators = [
            MatchedIndicatorSchema(
                pattern_name=ev.rule_id,
                field_examined=ev.target_field,
                matched_indicator=ev.candidate_input or extracted_url,
                explanation=ev.explanation,
                weight=ev.weight,
                regex_pattern=ev.regex_pattern,
            )
            for ev in rule_evaluations
            if ev.matched
        ]

        evaluated_rules_schema = [
            EvaluatedRuleSchema(
                rule_id=ev.rule_id,
                rule_name=ev.rule_name,
                regex_pattern=ev.regex_pattern,
                description=ev.description,
                target_field=ev.target_field,
                weight=ev.weight,
                candidate_input=ev.candidate_input,
                matched=ev.matched,
                score_contribution=ev.score_contribution,
                automata=ev.automata,
                candidate_trace=ev.candidate_trace,
                url_trace=ev.url_trace,
                explanation=ev.explanation,
            )
            for ev in rule_evaluations
        ]

        # 2. NLP Layer Analysis
        combined_text = f"{subject} {body}".strip()
        classifier = get_nlp_classifier()
        nlp_result = classifier.predict(combined_text)

        # 3. Risk Fusion Aggregation
        structural_explanations = [ev.explanation for ev in rule_evaluations if ev.matched]
        if not structural_explanations and not extracted_url:
            structural_explanations = ["No URL provided for structural evaluation."]
        elif not structural_explanations:
            structural_explanations = ["URL conforms to standard domain naming without structural anomalies."]

        fusion_result = compute_risk_fusion(
            structural_score=structural_score,
            nlp_score=nlp_result.nlp_score,
            config=DEFAULT_FUSION_CONFIG,
            structural_reasons=structural_explanations,
            nlp_explanation=nlp_result.explanation,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Truncate body preview for summary
        body_preview = (body[:100] + "...") if len(body) > 100 else body

        return DetectionResponse(
            success=True,
            input_summary={
                "sender": sender or "N/A",
                "url": orig_url or "N/A",
                "extracted_url": extracted_url or orig_url or "N/A",
                "subject": subject or "N/A",
                "body_preview": body_preview or "N/A",
            },
            structural_score=round(structural_score, 2),
            matched_indicators=matched_indicators,
            evaluated_rules=evaluated_rules_schema,
            nlp_score=round(nlp_result.nlp_score, 2),
            nlp_preprocessed_text=nlp_result.preprocessed_text,
            nlp_tokens=nlp_result.tokens,
            predicted_class=nlp_result.predicted_class,
            class_probabilities={
                k: round(v, 4) for k, v in nlp_result.class_probabilities.items()
            },
            structural_weight=fusion_result.structural_weight,
            nlp_weight=fusion_result.nlp_weight,
            structural_contribution=round(fusion_result.structural_contribution, 2),
            nlp_contribution=round(fusion_result.nlp_contribution, 2),
            final_score=round(fusion_result.final_score, 2),
            verdict=fusion_result.verdict,
            reasons=fusion_result.reasons,
            limitations_note=nlp_result.limitations_note,
            execution_time_ms=elapsed_ms,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "DetectionPipelineError",
                "message": f"Error executing threat analysis: {str(e)}",
            },
        )

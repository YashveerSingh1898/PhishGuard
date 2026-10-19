"""Natural Language Processing (NLP) Module for PhishGuard."""

from app.nlp.preprocessor import preprocess_text, normalize_text, tokenize, remove_stopwords
from app.nlp.classifier import (
    PhishingNLPClassifier,
    NLPAnalysisResult,
    get_nlp_classifier,
    LIMITATIONS_NOTE,
)

__all__ = [
    "preprocess_text",
    "normalize_text",
    "tokenize",
    "remove_stopwords",
    "PhishingNLPClassifier",
    "NLPAnalysisResult",
    "get_nlp_classifier",
    "LIMITATIONS_NOTE",
]

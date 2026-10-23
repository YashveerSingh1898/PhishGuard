"""Natural Language Processing (NLP) Module for PhishGuard."""

from app.nlp.preprocessor import preprocess_text, normalize_text, tokenize, remove_stopwords
from app.nlp.classifier import (
    PhishingNLPClassifier,
    NLPAnalysisResult,
    get_nlp_classifier,
    reset_nlp_classifier,
    LIMITATIONS_NOTE,
)
from app.nlp.train import train_and_evaluate, validate_dataset

__all__ = [
    "preprocess_text",
    "normalize_text",
    "tokenize",
    "remove_stopwords",
    "PhishingNLPClassifier",
    "NLPAnalysisResult",
    "get_nlp_classifier",
    "reset_nlp_classifier",
    "train_and_evaluate",
    "validate_dataset",
    "LIMITATIONS_NOTE",
]


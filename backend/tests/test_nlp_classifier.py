import os
import pytest
from app.nlp.preprocessor import normalize_text, tokenize, remove_stopwords, preprocess_text
from app.nlp.classifier import get_nlp_classifier, PhishingNLPClassifier



def test_text_normalization():
    """URL and email masking and lowercase conversion."""
    raw = "URGENT: Click http://example.com/login or email support@bank.com immediately!"
    normalized = normalize_text(raw)
    assert "httpurl" in normalized
    assert "emailaddr" in normalized
    assert "urgent" in normalized
    assert "!" not in normalized


def test_preprocessing_removes_standard_stopwords_keeps_urgency():
    """Stopwords are removed but urgency terms like urgent and immediately are preserved."""
    text = "This is a reminder that you must immediately take urgent action."
    preprocessed = preprocess_text(text)
    assert "immediately" in preprocessed
    assert "urgent" in preprocessed
    assert "this" not in preprocessed
    assert "is" not in preprocessed
    assert "that" not in preprocessed


def test_empty_and_whitespace_text_handled_safely():
    """Empty or whitespace text produces safe legitimate baseline without errors."""
    classifier = get_nlp_classifier()
    res1 = classifier.predict("")
    assert res1.nlp_score == 0.0
    assert res1.predicted_class == "Legitimate"
    assert res1.is_empty_input is True

    res2 = classifier.predict("     \n\t   ")
    assert res2.nlp_score == 0.0
    assert res2.predicted_class == "Legitimate"


def test_classifier_returns_valid_probabilities_and_classes():
    """Fitted model returns probabilities summing to ~1.0 and valid class."""
    classifier = get_nlp_classifier()
    text = "URGENT: Your account has been suspended due to suspicious activity. Verify credentials now."
    res = classifier.predict(text)

    assert res.predicted_class in ["Legitimate", "Phishing"]
    assert 0.0 <= res.nlp_score <= 100.0
    assert "Legitimate" in res.class_probabilities
    assert "Phishing" in res.class_probabilities
    total_prob = sum(res.class_probabilities.values())
    assert 0.99 <= total_prob <= 1.01
    assert len(res.explanation) > 10
    assert "demonstration" in res.limitations_note.lower()


def test_high_urgency_phishing_text_scores_high():
    """Phishing text triggers high phishing probability."""
    classifier = get_nlp_classifier()
    text = "URGENT: Immediate Action Required! Your direct deposit payroll could not be processed. Update banking credentials now."
    res = classifier.predict(text)
    assert res.nlp_score > 60.0
    assert res.predicted_class == "Phishing"


def test_standard_legitimate_text_scores_low():
    """Standard academic text triggers low phishing probability."""
    classifier = get_nlp_classifier()
    text = "The weekly team sync meeting is scheduled for tomorrow at 10:00 AM in Conference Room B."
    res = classifier.predict(text)
    assert res.nlp_score < 40.0
    assert res.predicted_class == "Legitimate"


def test_model_artifact_loading_and_metadata():
    """Classifier loads the serialized joblib model and exposes metrics and metadata."""
    from app.nlp.classifier import PhishingNLPClassifier, DEFAULT_MODEL_PATH
    import os

    assert os.path.exists(DEFAULT_MODEL_PATH), "Serialized model artifact must exist"
    classifier = PhishingNLPClassifier()
    assert classifier.is_trained is True
    assert classifier.is_loaded_from_disk is True
    assert classifier.training_size >= 75
    assert "accuracy" in classifier.metrics
    assert classifier.metrics["accuracy"] >= 0.85
    assert "confusion_matrix" in classifier.metrics
    assert "per_class" in classifier.metrics
    assert "Legitimate" in classifier.metrics["per_class"]
    assert "Phishing" in classifier.metrics["per_class"]


def test_dataset_validation():
    """Schema validation accepts valid dataset and rejects invalid or non-existent files."""
    from app.nlp.train import validate_dataset, DEFAULT_DATASET_PATH
    import tempfile

    texts, labels = validate_dataset(DEFAULT_DATASET_PATH)
    assert len(texts) == 100
    assert len(labels) == 100
    assert labels.count("Legitimate") == 50
    assert labels.count("Phishing") == 50

    with pytest.raises(FileNotFoundError):
        validate_dataset("/path/to/nonexistent_dataset.csv")

    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".csv") as tmp:
        tmp.write("invalid_column,another_col\nhello,world\n")
        tmp_path = tmp.name

    try:
        with pytest.raises(ValueError, match="Invalid dataset schema"):
            validate_dataset(tmp_path)
    finally:
        os.remove(tmp_path)


def test_out_of_vocabulary_words_fallback():
    """Input with rare out-of-vocabulary tokens falls back safely to neutral baseline."""
    classifier = get_nlp_classifier()
    # Random nonsense tokens not in vocabulary
    res = classifier.predict("zxqvbt jklmno qwertyuiopasdfghjkl")
    assert res.predicted_class == "Legitimate"
    assert res.nlp_score == 15.0
    assert "outside the training lexicon" in res.explanation


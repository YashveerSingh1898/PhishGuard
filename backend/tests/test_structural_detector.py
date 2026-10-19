"""Tests for the Structural Detection Layer."""

import pytest
from app.automata.structural_detector import StructuralDetector


@pytest.fixture
def detector():
    return StructuralDetector()


def test_empty_url_returns_zero(detector):
    """Empty or None URL returns score 0.0 with empty indicators."""
    res = detector.analyze(url="", sender="")
    assert res.score == 0.0
    assert len(res.matched_indicators) == 0


def test_structural_scoring_is_deterministic(detector):
    """Identical input strings produce identical scores and indicators."""
    url = "http://192.168.1.1/update-banking-security.xyz/login"
    sender = "security@paypal.com"

    res1 = detector.analyze(url=url, sender=sender)
    res2 = detector.analyze(url=url, sender=sender)

    assert res1.score == res2.score
    assert len(res1.matched_indicators) == len(res2.matched_indicators)
    assert [ind.pattern_name for ind in res1.matched_indicators] == [
        ind.pattern_name for ind in res2.matched_indicators
    ]


def test_score_bounded_between_0_and_100(detector):
    """Excessive anomalies are clamped to 100.0 max."""
    url = "http://192.168.1.55/paypal-login-update-banking-security-verification.xyz/auth"
    sender = "security@paypal.com"
    res = detector.analyze(url=url, sender=sender)

    assert 0.0 <= res.score <= 100.0


def test_ip_address_host_detected(detector):
    """Raw IP address in host triggers IP_HOST_ADDRESS indicator."""
    res = detector.analyze(url="http://192.168.1.55/test")
    names = [ind.pattern_name for ind in res.matched_indicators]
    assert "IP_HOST_ADDRESS" in names

    ip_ind = next(ind for ind in res.matched_indicators if ind.pattern_name == "IP_HOST_ADDRESS")
    assert ip_ind.field_examined == "url.hostname"
    assert "192.168.1.55" in ip_ind.matched_indicator
    assert len(ip_ind.explanation) > 10


def test_suspicious_tld_detected(detector):
    """Abused TLD like .xyz is flagged."""
    res = detector.analyze(url="https://legit-portal.xyz/home")
    names = [ind.pattern_name for ind in res.matched_indicators]
    assert "SUSPICIOUS_TLD" in names


def test_sensitive_keywords_detected(detector):
    """Authentication and credential keywords are detected."""
    res = detector.analyze(url="https://portal.com/banking/login/auth")
    names = [ind.pattern_name for ind in res.matched_indicators]
    assert "TARGETED_CREDENTIAL_KEYWORD" in names


def test_sender_domain_mismatch_detected(detector):
    """Sender claiming reputable brand with mismatched host is flagged."""
    res = detector.analyze(
        url="http://unrelated-domain.com/portal",
        sender="service@paypal.com"
    )
    names = [ind.pattern_name for ind in res.matched_indicators]
    assert "SENDER_DOMAIN_MISMATCH" in names


def test_legitimate_url_clean_score(detector):
    """Standard legitimate university portal produces low/zero structural risk."""
    res = detector.analyze(url="https://portal.university.edu/student/grades", sender="registrar@university.edu")
    assert res.score == 0.0
    assert len(res.matched_indicators) == 0

"""Tests for the Detection API endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_detection_analyze_full_phishing_payload():
    """POST /api/detection/analyze returns full schema and high phishing score."""
    payload = {
        "sender": "Security Team <security@paypal-verification.net>",
        "url": "http://192.168.1.55/update-banking-security-alert.xyz/auth",
        "subject": "URGENT: Your account has been suspended",
        "body": "Your account has been suspended due to suspicious activity. Verify your identity within 24 hours.",
    }
    response = client.post("/api/detection/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "input_summary" in data
    assert data["input_summary"]["sender"] == payload["sender"]
    assert "structural_score" in data
    assert data["structural_score"] > 0
    assert "nlp_score" in data
    assert data["nlp_score"] > 0
    assert data["structural_weight"] == 0.60
    assert data["nlp_weight"] == 0.40
    assert "final_score" in data
    assert data["verdict"] in ["Suspicious", "Phishing"]
    assert len(data["matched_indicators"]) > 0
    assert len(data["reasons"]) > 0
    assert "limitations_note" in data
    assert "execution_time_ms" in data


def test_detection_analyze_legitimate_payload():
    """Legitimate portal produces Legitimate verdict and low scores."""
    payload = {
        "sender": "registrar@university.edu",
        "url": "https://portal.university.edu/student/grades",
        "subject": "Semester Grade Report Available",
        "body": "Your semester grade report is now ready for viewing on the student self-service portal.",
    }
    response = client.post("/api/detection/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["verdict"] == "Legitimate"
    assert data["final_score"] < 35.0


def test_detection_analyze_empty_payload():
    """Empty payload returns clean baseline without raising exceptions."""
    response = client.post("/api/detection/analyze", json={})
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["structural_score"] == 0.0
    assert data["nlp_score"] == 0.0
    assert data["final_score"] == 0.0
    assert data["verdict"] == "Legitimate"


def test_existing_automata_endpoint_still_works():
    """Verify regression safety: POST /api/automata/convert still works."""
    response = client.post("/api/automata/convert", json={"regex": "(a|b)*abb"})
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["regex"] == "(a|b)*abb"
    assert "nfa" in data
    assert "dfa" in data
    assert "minimized_dfa" in data


def test_url_extracted_from_email_body_when_url_field_empty():
    """When url field is omitted, extract URL from body and evaluate rules."""
    payload = {
        "sender": "alert@paypal-update.net",
        "url": "",
        "subject": "Account Review",
        "body": "Please login to your account immediately at http://paypal-update.xyz/login to verify your credentials.",
    }
    response = client.post("/api/detection/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "extracted_url" in data["input_summary"]
    assert "paypal-update.xyz" in data["input_summary"]["extracted_url"]
    assert data["structural_score"] > 0
    # Verify evaluated_rules contain candidate_trace and url_trace
    assert len(data["evaluated_rules"]) == 6
    for rule in data["evaluated_rules"]:
        assert "automata" in rule
        assert "nfa" in rule["automata"]
        assert "dfa" in rule["automata"]
        assert "minimized_dfa" in rule["automata"]
        assert "candidate_trace" in rule
        assert "url_trace" in rule


def test_fusion_arithmetic_consistency():
    """Final score strictly equals round(0.6 * structural + 0.4 * nlp, 2)."""
    payload = {
        "sender": "Security <security@apple.com>",
        "url": "http://192.168.1.1/verify",
        "subject": "Urgent Apple ID Suspension",
        "body": "Your Apple ID has been suspended. Re-verify credentials immediately.",
    }
    response = client.post("/api/detection/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    expected_final = round(0.60 * data["structural_score"] + 0.40 * data["nlp_score"], 2)
    assert abs(data["final_score"] - expected_final) <= 0.05
    assert data["structural_contribution"] == round(0.60 * data["structural_score"], 2)
    assert data["nlp_contribution"] == round(0.40 * data["nlp_score"], 2)


def test_detect_alias_endpoint():
    """POST /api/detect behaves as an exact alias for /api/detection/analyze."""
    payload = {
        "sender": "registrar@university.edu",
        "url": "https://portal.university.edu/student/grades",
        "subject": "Grades posted",
        "body": "Your grades are available.",
    }
    res_detect = client.post("/api/detect", json=payload)
    res_analyze = client.post("/api/detection/analyze", json=payload)

    assert res_detect.status_code == 200
    assert res_analyze.status_code == 200
    assert res_detect.json()["final_score"] == res_analyze.json()["final_score"]
    assert res_detect.json()["verdict"] == res_analyze.json()["verdict"]



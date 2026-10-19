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

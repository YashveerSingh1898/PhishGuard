"""Integration tests for the /api/automata/convert API endpoint."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_convert_valid_regex():
    response = client.post("/api/automata/convert", json={"regex": "a(b|c)*"})
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["regex"] == "a(b|c)*"
    assert set(data["alphabet"]) == {"a", "b", "c"}

    # NFA checks
    assert "nfa" in data
    assert data["nfa"]["start_state"] == "S0"
    assert len(data["nfa"]["states"]) > 0
    assert len(data["nfa"]["transitions"]) > 0

    # DFA checks
    assert "dfa" in data
    assert data["dfa"]["start_state"] == "D0"
    assert len(data["dfa"]["states"]) > 0
    assert len(data["dfa"]["transitions"]) > 0
    assert len(data["dfa"]["trace"]) > 0

    # Minimized DFA checks
    assert "minimized_dfa" in data
    assert data["minimized_dfa"]["start_state"] == "M0"
    assert len(data["minimized_dfa"]["states"]) > 0
    assert "comparison" in data["minimized_dfa"]
    assert "states_before" in data["minimized_dfa"]["comparison"]
    assert "states_after" in data["minimized_dfa"]["comparison"]


def test_convert_invalid_regex_returns_400():
    response = client.post("/api/automata/convert", json={"regex": "a(b|"})
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert data["detail"]["success"] is False
    assert data["detail"]["error"] == "RegexSyntaxError"


def test_convert_empty_regex_returns_422_or_400():
    response = client.post("/api/automata/convert", json={"regex": ""})
    # Pydantic min_length=1 triggers 422 Unprocessable Entity
    assert response.status_code in (400, 422)

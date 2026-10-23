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


def test_convert_with_input_string():
    response = client.post(
        "/api/automata/convert",
        json={"regex": "(a|b)*abb", "input_string": "ababb"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "execution_trace" in data
    trace = data["execution_trace"]
    assert trace["is_accepted"] is True
    assert trace["total_steps"] == 5
    assert len(trace["steps"]) == 5


def test_simulate_endpoint():
    # Test accepted string
    res1 = client.post(
        "/api/automata/simulate",
        json={"regex": "http", "input_string": "http"}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["success"] is True
    assert data1["trace"]["is_accepted"] is True

    # Test rejected string
    res2 = client.post(
        "/api/automata/simulate",
        json={"regex": "http", "input_string": "ftp"}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["trace"]["is_accepted"] is False
    assert data2["trace"]["final_state"] == "DEAD"


def test_convert_character_class():
    response = client.post("/api/automata/convert", json={"regex": "[0-9]+"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["alphabet"]) == 10
    assert data["nfa"]["state_count"] == 40
    assert data["dfa"]["state_count"] == 11
    assert data["minimized_dfa"]["state_count"] == 2


"""Unit tests for Structural Regex Rules and Automata Execution Traces."""

import pytest
from app.automata.structural_rules import (
    StructuralRuleEvaluator,
    STRUCTURAL_RULES,
)
from app.automata.regex_parser import parse_regex
from app.automata.nfa import ThompsonBuilder
from app.automata.dfa import nfa_to_dfa
from app.automata.minimizer import minimize_dfa


def test_all_structural_rules_compile_through_moc_pipeline():
    """Verifies that every structural detection rule compiles to valid NFA, DFA, and Minimized DFA."""
    for rule in STRUCTURAL_RULES:
        ast = parse_regex(rule.regex_pattern)
        nfa = ThompsonBuilder().build(ast)
        dfa = nfa_to_dfa(nfa)
        min_dfa = minimize_dfa(dfa)

        assert len(nfa.states) > 0
        assert len(dfa.states) > 0
        assert len(min_dfa.states) > 0
        assert min_dfa.states_after <= min_dfa.states_before


def test_nfa_dfa_min_dfa_language_equivalence():
    """Verifies that NFA, DFA, and Minimized DFA agree on positive and negative test strings."""
    test_cases = [
        ("(xyz|top|work)", ["xyz", "top", "work"], ["com", "org", "xy"]),
        ("(0|1|2)+", ["0", "1", "2", "012", "210"], ["", "a", "3", "01a"]),
        ("http", ["http"], ["https", "ftp", "htt"]),
    ]

    for pattern, positives, negatives in test_cases:
        ast = parse_regex(pattern)
        nfa = ThompsonBuilder().build(ast)
        dfa = nfa_to_dfa(nfa)
        min_dfa = minimize_dfa(dfa)

        for pos in positives:
            assert nfa.accepts(pos), f"NFA rejected positive '{pos}' on {pattern}"
            assert dfa.accepts(pos), f"DFA rejected positive '{pos}' on {pattern}"
            assert min_dfa.accepts(pos), f"MinDFA rejected positive '{pos}' on {pattern}"
            trace = min_dfa.simulate(pos)
            assert trace["is_accepted"] is True

        for neg in negatives:
            assert not nfa.accepts(neg), f"NFA accepted negative '{neg}' on {pattern}"
            assert not dfa.accepts(neg), f"DFA accepted negative '{neg}' on {pattern}"
            assert not min_dfa.accepts(neg), f"MinDFA accepted negative '{neg}' on {pattern}"
            trace = min_dfa.simulate(neg)
            assert trace["is_accepted"] is False


def test_url_extraction_from_body_when_url_empty():
    """Verifies URL extraction fallback from email body."""
    evaluator = StructuralRuleEvaluator()
    orig, extracted = evaluator.extract_url_from_email(
        url="",
        body="Security alert! Please login immediately at https://paypal-security.xyz/login to verify your account."
    )
    assert extracted == "https://paypal-security.xyz/login"
    assert orig == ""


def test_execution_trace_matches_dfa_transitions():
    """Verifies that simulation trace steps correctly log state transitions and dead state."""
    evaluator = StructuralRuleEvaluator()
    score, evals, summary = evaluator.evaluate(
        url="http://192.168.1.55/login",
        sender="Security Team <security@paypal-update.net>",
    )

    # Check IP host rule
    ip_eval = next(e for e in evals if e.rule_id == "RULE_IP_HOST")
    assert ip_eval.matched is True
    assert ip_eval.candidate_input == "192"
    assert ip_eval.candidate_trace["is_accepted"] is True
    assert len(ip_eval.candidate_trace["steps"]) == 3
    for step in ip_eval.candidate_trace["steps"]:
        assert step["is_dead"] is False

    # Check URL trace on IP rule: non-digit ':' causes transition to DEAD
    assert ip_eval.url_trace["is_accepted"] is False
    assert ip_eval.url_trace["final_state"] == "DEAD"
    dead_steps = [s for s in ip_eval.url_trace["steps"] if s["is_dead"]]
    assert len(dead_steps) > 0


def test_structural_score_calculation_honesty():
    """Verifies that structural score is calculated honestly from matched weights."""
    evaluator = StructuralRuleEvaluator()

    # Legitimate URL: 0 score
    score_clean, evals_clean, _ = evaluator.evaluate(
        url="https://www.google.com/search?q=test",
        sender="Google <no-reply@google.com>",
    )
    assert score_clean == 0.0
    assert all(e.matched is False for e in evals_clean)

    # Phishing URL: multiple matched indicators
    score_phish, evals_phish, _ = evaluator.evaluate(
        url="http://paypal-security.xyz/login",
        sender="PayPal Team <security@paypal.com>",
    )
    matched_rules = [e for e in evals_phish if e.matched]
    assert len(matched_rules) >= 4
    expected_sum = min(100.0, sum(e.weight for e in matched_rules))
    assert score_phish == expected_sum

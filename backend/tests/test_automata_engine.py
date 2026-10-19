"""Unit tests for Thompson NFA, Subset DFA, and Hopcroft/Moore Minimization."""

import pytest
from app.automata.regex_parser import parse_regex
from app.automata.nfa import ThompsonBuilder, regex_to_nfa, EPSILON
from app.automata.dfa import nfa_to_dfa
from app.automata.minimizer import minimize_dfa


def assert_language_equivalence(regex_pattern: str, test_strings: list):
    """Verifies that NFA, DFA, and Minimized DFA produce identical acceptance for all strings."""
    ast = parse_regex(regex_pattern)
    nfa = ThompsonBuilder().build(ast)
    dfa = nfa_to_dfa(nfa)
    min_dfa = minimize_dfa(dfa)

    for s in test_strings:
        nfa_res = nfa.accepts(s)
        dfa_res = dfa.accepts(s)
        min_res = min_dfa.accepts(s)
        assert nfa_res == dfa_res == min_res, (
            f"Equivalence violation on pattern '{regex_pattern}' with input '{s}': "
            f"NFA={nfa_res}, DFA={dfa_res}, MinDFA={min_res}"
        )


def test_epsilon_closure_computation():
    """Verify epsilon closure correctly accumulates transitive epsilon transitions."""
    nfa = regex_to_nfa("a*")
    # For a*, the start state has epsilon transitions to the child start state and accept state
    closure = nfa.epsilon_closure({nfa.start_state})
    assert nfa.start_state in closure
    assert nfa.accept_states.intersection(closure), "Start state of a* must reach accept state via epsilon"


def test_literal_regex():
    assert_language_equivalence("a", ["", "a", "b", "aa"])


def test_concatenation_regex():
    assert_language_equivalence("ab", ["", "a", "b", "ab", "aba", "abb"])


def test_alternation_regex():
    assert_language_equivalence("a|b", ["", "a", "b", "ab", "c"])


def test_kleene_star_regex():
    assert_language_equivalence("a*", ["", "a", "aa", "aaa", "b", "ab"])


def test_plus_operator():
    assert_language_equivalence("a+", ["", "a", "aa", "aaa", "b", "aab"])


def test_optional_operator():
    assert_language_equivalence("a?", ["", "a", "aa", "b"])


def test_complex_precedence_and_parentheses():
    # (a|b)*c
    test_inputs = [
        "", "c", "ac", "bc", "aac", "abc", "bac", "bbbc",
        "a", "b", "ab", "ca"
    ]
    assert_language_equivalence("(a|b)*c", test_inputs)


def test_phishing_keyword_simulation():
    # Model URL token pattern like 'login|verify'
    test_inputs = ["login", "verify", "log", "ver", "loginverify", "admin"]
    assert_language_equivalence("login|verify", test_inputs)


def test_minimization_reduces_state_count():
    """Verify that DFA Minimization actively combines equivalent states.
    
    In the regex 'a*a*', the Subset Construction yields multiple states that both
    accept on additional 'a's. The Minimized DFA should collapse these equivalent states.
    """
    ast = parse_regex("a*a*")
    nfa = ThompsonBuilder().build(ast)
    dfa = nfa_to_dfa(nfa)
    min_dfa = minimize_dfa(dfa)

    assert min_dfa.states_before > min_dfa.states_after, (
        f"Expected state reduction for 'a*a*': before={min_dfa.states_before}, after={min_dfa.states_after}"
    )
    assert min_dfa.states_after == 1, "a*a* collapses to a single self-looping accepting state"
    assert_language_equivalence("a*a*", ["", "a", "aa", "aaa", "b"])


def test_minimization_initial_and_step_partitions():
    """Ensure partition refinement history is preserved for academic review."""
    ast = parse_regex("(a|b)*c")
    nfa = ThompsonBuilder().build(ast)
    dfa = nfa_to_dfa(nfa)
    min_dfa = minimize_dfa(dfa)

    # Initial partition should have both non-accepting and accepting groups
    assert len(min_dfa.initial_partitions) == 2
    types = {p["group_type"] for p in min_dfa.initial_partitions}
    assert "accepting" in types
    assert "non_accepting" in types

    # Refinement steps should be recorded
    assert len(min_dfa.refinement_steps) >= 1
    assert min_dfa.refinement_steps[0].step == 0


def test_dfa_trace_generation():
    """Verify that the subset construction trace details every moved symbol and subset."""
    ast = parse_regex("a(b|c)")
    nfa = ThompsonBuilder().build(ast)
    dfa = nfa_to_dfa(nfa)

    assert len(dfa.trace) > 0
    first_step = dfa.trace[0]
    assert first_step.source == "D0"
    assert len(first_step.source_subset) > 0
    assert first_step.symbol in dfa.alphabet
    assert first_step.target.startswith("D")


def test_classic_textbook_abb_pattern():
    """Classic (a|b)*abb pattern from Hopcroft & Ullman."""
    test_inputs = [
        "abb", "aabb", "babb", "ababb", "bbabb", "aaabb",
        "", "a", "b", "ab", "ba", "abba", "abbb"
    ]
    assert_language_equivalence("(a|b)*abb", test_inputs)


def test_url_token_regex_pattern():
    """Simulates URL token matching such as 'https://(login|account)'."""
    test_inputs = [
        r"https://login",
        r"https://account",
        r"http://login",
        r"https://",
        r"login",
    ]
    assert_language_equivalence(r"https://(login|account)", test_inputs)

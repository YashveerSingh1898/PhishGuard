"""Unit tests for Thompson NFA, Subset DFA, and Hopcroft/Moore Minimization."""

import pytest
from app.automata.regex_parser import parse_regex
from app.automata.nfa import ThompsonBuilder, regex_to_nfa, EPSILON
from app.automata.dfa import nfa_to_dfa, DFA
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


# =========================================================================
# REQUIRED TESTS (Requirements 1 - 10)
# =========================================================================

def test_req_1_simple_literal_regex():
    """1. Test a simple literal regex."""
    pattern = "cat"
    ast = parse_regex(pattern)
    nfa = ThompsonBuilder().build(ast)
    dfa = nfa_to_dfa(nfa)
    min_dfa = minimize_dfa(dfa)

    assert nfa.accepts("cat") is True
    assert dfa.accepts("cat") is True
    assert min_dfa.accepts("cat") is True

    assert nfa.accepts("ca") is False
    assert dfa.accepts("dog") is False
    assert min_dfa.accepts("") is False
    assert_language_equivalence("cat", ["", "c", "ca", "cat", "cats", "dog"])


def test_req_2_alternation_regex():
    """2. Test an alternation regex such as a|b."""
    pattern = "a|b"
    ast = parse_regex(pattern)
    nfa = ThompsonBuilder().build(ast)
    dfa = nfa_to_dfa(nfa)
    min_dfa = minimize_dfa(dfa)

    assert nfa.accepts("a") is True
    assert nfa.accepts("b") is True
    assert nfa.accepts("c") is False
    assert nfa.accepts("ab") is False

    assert dfa.accepts("a") is True
    assert dfa.accepts("b") is True
    assert min_dfa.accepts("a") is True
    assert min_dfa.accepts("b") is True
    assert_language_equivalence("a|b", ["", "a", "b", "ab", "ba", "c"])


def test_req_3_repetition_regex():
    """3. Test repetition regexes such as a+ and a*."""
    # a+ requires at least one
    assert_language_equivalence("a+", ["", "a", "aa", "aaa", "b", "ab"])
    ast_plus = parse_regex("a+")
    nfa_plus = ThompsonBuilder().build(ast_plus)
    assert not nfa_plus.accepts("")
    assert nfa_plus.accepts("a")
    assert nfa_plus.accepts("aaaaa")

    # a* allows zero or more
    assert_language_equivalence("a*", ["", "a", "aa", "aaa", "b", "ab"])
    ast_star = parse_regex("a*")
    nfa_star = ThompsonBuilder().build(ast_star)
    assert nfa_star.accepts("")
    assert nfa_star.accepts("a")
    assert nfa_star.accepts("aaaaa")


def test_req_4_grouped_expression():
    """4. Test a grouped expression such as (ab|c)+."""
    pattern = "(ab|c)+"
    test_inputs = [
        "", "ab", "c", "abc", "cab", "abab", "cc", "abcab",
        "a", "b", "abb", "ca", "d"
    ]
    assert_language_equivalence(pattern, test_inputs)

    ast = parse_regex(pattern)
    min_dfa = minimize_dfa(nfa_to_dfa(ThompsonBuilder().build(ast)))
    assert min_dfa.accepts("ab") is True
    assert min_dfa.accepts("c") is True
    assert min_dfa.accepts("abc") is True
    assert min_dfa.accepts("cabcab") is True
    assert min_dfa.accepts("a") is False
    assert min_dfa.accepts("") is False


def test_req_5_malformed_regex_rejection():
    """5. Test rejection of malformed or unsupported regex syntax with clear errors."""
    from app.automata.regex_parser import RegexSyntaxError

    malformed_cases = [
        "",              # Empty
        "a(",            # Unclosed paren
        "a)",            # Unmatched close paren
        "|a",            # Alternation missing left
        "a|",            # Alternation missing right
        "a||b",          # Consecutive alternations
        "*a",            # Star with no operand
        "+a",            # Plus with no operand
        "?a",            # Optional with no operand
        "a\\",           # Dangling escape
        "[a-",           # Invalid range / unclosed bracket
        "[z-a]",         # Descending range in character class
    ]

    for bad in malformed_cases:
        with pytest.raises(RegexSyntaxError):
            parse_regex(bad)


def test_req_6_nfa_to_dfa_language_equivalence():
    """6. Test NFA-to-DFA language equivalence for a diverse set of test strings."""
    patterns_and_tests = [
        ("(0|1)*00", ["00", "100", "0100", "11100", "0", "1", "01", "101", "001"]),
        ("ab(c|d)*e", ["abe", "abce", "abde", "abccde", "abcde", "ab", "e", "acde"]),
        ("(xyz|top|ru)", ["xyz", "top", "ru", "xy", "to", "r", "com", "net", ""]),
    ]

    for pat, test_set in patterns_and_tests:
        assert_language_equivalence(pat, test_set)


def test_req_7_dfa_minimization_preserves_acceptance():
    """7. Test DFA minimization preserving acceptance results across strings."""
    ast = parse_regex("(a|b)*abb")
    nfa = ThompsonBuilder().build(ast)
    dfa = nfa_to_dfa(nfa)
    min_dfa = minimize_dfa(dfa)

    test_strings = [
        "abb", "aabb", "babb", "ababb", "bbabb", "aaabb",
        "", "a", "b", "ab", "ba", "abba", "abbb", "bab"
    ]

    for s in test_strings:
        dfa_result = dfa.accepts(s)
        min_result = min_dfa.accepts(s)
        assert dfa_result == min_result, f"Minimization broke acceptance for '{s}'"


def test_req_8_execution_simulation_accepted_and_rejected():
    """8. Test execution simulation of both accepted and rejected strings."""
    ast = parse_regex("http")
    min_dfa = minimize_dfa(nfa_to_dfa(ThompsonBuilder().build(ast)))

    # Accepted execution trace
    sim_acc = min_dfa.simulate("http")
    assert sim_acc["is_accepted"] is True
    assert sim_acc["final_state"] in min_dfa.accepting_states
    assert len(sim_acc["steps"]) == 4
    for step in sim_acc["steps"]:
        assert step["is_dead"] is False

    # Rejected execution trace (enters DEAD/trap state)
    sim_rej = min_dfa.simulate("https")
    assert sim_rej["is_accepted"] is False
    assert sim_rej["final_state"] == "DEAD"
    assert len(sim_rej["steps"]) == 5
    # The 5th step 's' transitions to DEAD
    assert sim_rej["steps"][4]["is_dead"] is True


def test_req_9_switching_between_rules_without_stale_data():
    """9. Test switching between two different rules without stale state or transition data."""
    from app.automata.service import convert_regex_pipeline

    rule1 = "(0|1|2|3|4|5|6|7|8|9)+"
    rule2 = "(xyz|top|work|click|fit|live|ru)"

    res1 = convert_regex_pipeline(rule1)
    res2 = convert_regex_pipeline(rule2)

    # State counts must be dynamically calculated and distinct for these rules
    assert res1["regex"] == rule1
    assert res2["regex"] == rule2

    assert res1["nfa"]["state_count"] == 40
    assert res1["dfa"]["state_count"] == 11
    assert res1["minimized_dfa"]["state_count"] == 2

    assert res2["nfa"]["state_count"] == 60
    assert res2["dfa"]["state_count"] == 25
    assert res2["minimized_dfa"]["state_count"] == 18

    # Ensure alphabets are completely distinct and fresh
    assert set(res1["alphabet"]) == {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}
    assert "x" in res2["alphabet"]
    assert "0" not in res2["alphabet"]


def test_req_10_reduction_statistics_calculation():
    """10. Test correct calculation of state counts and minimization reduction statistics."""
    from app.automata.service import convert_regex_pipeline

    # Benchmark pattern: (a|b)*abb
    res = convert_regex_pipeline("(a|b)*abb")
    comp = res["minimized_dfa"]["comparison"]

    states_before = comp["states_before"]
    states_after = comp["states_after"]
    reduction_count = comp["reduction_count"]
    reduction_pct = comp["reduction_percentage"]

    assert states_before >= states_after
    assert reduction_count == (states_before - states_after)
    expected_pct = round(((states_before - states_after) / states_before) * 100, 2)
    assert reduction_pct == expected_pct

    # Zero states / empty handling
    min_dfa_empty = minimize_dfa(DFA(alphabet=[]))
    comp_empty = min_dfa_empty.to_dict()["comparison"]
    assert comp_empty["reduction_percentage"] == 0.0
    assert comp_empty["reduction_count"] == 0


"""Automata Theory Module (Models of Computation).

Implements the three foundational automata conversion stages:
1. Thompson's Construction: Regular Expression -> ε-NFA
2. Subset Construction: ε-NFA -> DFA
3. DFA Minimization: DFA -> Minimized DFA via Partition Refinement
"""

from app.automata.regex_parser import (
    RegexSyntaxError,
    RegexNode,
    LiteralNode,
    ConcatNode,
    UnionNode,
    StarNode,
    PlusNode,
    OptionalNode,
    parse_regex,
)
from app.automata.nfa import NFA, NFATransition, regex_to_nfa, ThompsonBuilder
from app.automata.dfa import DFA, DFAState, DFATransition, nfa_to_dfa
from app.automata.minimizer import MinimizedDFA, MinimizedState, minimize_dfa
from app.automata.service import convert_regex_pipeline

__all__ = [
    "RegexSyntaxError",
    "RegexNode",
    "LiteralNode",
    "ConcatNode",
    "UnionNode",
    "StarNode",
    "PlusNode",
    "OptionalNode",
    "parse_regex",
    "NFA",
    "NFATransition",
    "regex_to_nfa",
    "ThompsonBuilder",
    "DFA",
    "DFAState",
    "DFATransition",
    "nfa_to_dfa",
    "MinimizedDFA",
    "MinimizedState",
    "minimize_dfa",
    "convert_regex_pipeline",
]

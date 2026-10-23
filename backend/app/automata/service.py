"""Automata Pipeline Service for Models of Computation (MOC).

Coordinates the end-to-end transformation:
Regex -> Thompson NFA -> Subset DFA -> Minimized DFA
"""

from typing import Dict, Any, Optional
from app.automata.regex_parser import parse_regex, RegexSyntaxError
from app.automata.nfa import ThompsonBuilder, NFA
from app.automata.dfa import nfa_to_dfa, DFA
from app.automata.minimizer import minimize_dfa, MinimizedDFA


def convert_regex_pipeline(pattern: str, input_string: Optional[str] = None) -> Dict[str, Any]:
    """Runs the full three-stage automata conversion pipeline.
    
    Returns structured, serializable data representing:
    - Parsed pattern and alphabet
    - Thompson NFA (states, transitions with ε, start, accepting)
    - Subset DFA (states, transitions, start, accepting, and trace)
    - Minimized DFA (states, transitions, initial/step partitions, reduction comparison)
    - Execution trace when input_string is provided
    """
    # 1. Validation & Parsing
    ast = parse_regex(pattern)

    # 2. Thompson NFA Construction
    nfa_builder = ThompsonBuilder()
    nfa = nfa_builder.build(ast)
    nfa_data = nfa.to_dict()

    # 3. Subset Construction (NFA -> DFA)
    dfa = nfa_to_dfa(nfa)
    dfa_data = dfa.to_dict()

    # 4. DFA Minimization (Partition Refinement)
    min_dfa = minimize_dfa(dfa)
    min_dfa_data = min_dfa.to_dict()

    response: Dict[str, Any] = {
        "success": True,
        "regex": pattern,
        "alphabet": sorted(list(nfa.alphabet)),
        "nfa": nfa_data,
        "dfa": dfa_data,
        "minimized_dfa": min_dfa_data,
    }

    if input_string is not None:
        response["execution_trace"] = min_dfa.simulate(input_string)

    return response

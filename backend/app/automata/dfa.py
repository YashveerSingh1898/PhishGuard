"""Subset Construction (NFA to DFA) for Models of Computation (MOC).

Implements the Powerset / Subset Construction algorithm to convert an ε-NFA into
an equivalent Deterministic Finite Automaton (DFA).

Key Properties:
- Evaluates ε-closures and moves across the input alphabet Σ
- Generates stable state names: D0, D1, D2, ...
- Preserves the mapping from each DFA state to its underlying NFA state set
- Captures a complete, step-by-step transition trace for academic presentation
"""

from collections import deque
from dataclasses import dataclass
from typing import Dict, List, Set, Tuple, Any, Optional

from app.automata.nfa import NFA


@dataclass
class DFAState:
    """Represents a single state in the DFA, corresponding to a subset of NFA states."""
    id: str  # e.g. "D0", "D1"
    nfa_states: List[int]  # Sorted list of NFA integer state IDs
    is_start: bool = False
    is_accepting: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nfa_states": self.nfa_states,
            "nfa_state_labels": [f"S{s}" for s in self.nfa_states],
            "is_start": self.is_start,
            "is_accepting": self.is_accepting,
        }


@dataclass
class DFATransition:
    """Explicit representation of a deterministic transition."""
    from_state: str
    symbol: str
    to_state: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_state": self.from_state,
            "symbol": self.symbol,
            "to_state": self.to_state,
        }


@dataclass
class SubsetTraceStep:
    """Academic trace step recording how a subset transition was formed."""
    source: str
    source_subset: List[int]
    symbol: str
    target: str
    target_subset: List[int]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "source_subset": self.source_subset,
            "symbol": self.symbol,
            "target": self.target,
            "target_subset": self.target_subset,
            "explanation": (
                f"From {self.source} ({self.source_subset}) on '{self.symbol}', "
                f"move & ε-closure -> {self.target} ({self.target_subset})"
            ),
        }


class DFA:
    """Deterministic Finite Automaton.
    
    Formal 5-tuple: M = (Q, Σ, δ, q0, F)
    """

    def __init__(self, alphabet: List[str]):
        self.alphabet = sorted(alphabet)
        self.states: Dict[str, DFAState] = {}
        self.start_state: str = "D0"
        self.accepting_states: Set[str] = set()
        # Transitions mapping: (from_state, symbol) -> to_state
        self.transitions: Dict[Tuple[str, str], str] = {}
        self.trace: List[SubsetTraceStep] = []

    def add_state(self, state: DFAState) -> None:
        self.states[state.id] = state
        if state.is_start:
            self.start_state = state.id
        if state.is_accepting:
            self.accepting_states.add(state.id)

    def add_transition(self, from_state: str, symbol: str, to_state: str) -> None:
        self.transitions[(from_state, symbol)] = to_state

    def get_all_transitions(self) -> List[DFATransition]:
        """Returns sorted list of all DFA transitions."""
        return [
            DFATransition(src, sym, dst)
            for (src, sym), dst in sorted(self.transitions.items(), key=lambda x: (x[0][0], x[0][1]))
        ]

    def accepts(self, input_string: str) -> bool:
        """Determines whether the DFA accepts the input string in deterministic O(n) time."""
        current = self.start_state
        if current not in self.states:
            return False

        for char in input_string:
            next_state = self.transitions.get((current, char))
            if next_state is None:
                return False  # Dead state / trap
            current = next_state

        return current in self.accepting_states

    def to_dict(self) -> Dict[str, Any]:
        """Exports JSON-serializable representation of the DFA."""
        sorted_states = [self.states[s_id] for s_id in sorted(self.states.keys(), key=lambda x: int(x[1:]))]
        return {
            "states": [s.to_dict() for s in sorted_states],
            "state_count": len(sorted_states),
            "start_state": self.start_state,
            "accepting_states": sorted(list(self.accepting_states), key=lambda x: int(x[1:])),
            "alphabet": self.alphabet,
            "transitions": [t.to_dict() for t in self.get_all_transitions()],
            "transition_count": len(self.transitions),
            "trace": [step.to_dict() for step in self.trace],
        }


def nfa_to_dfa(nfa: NFA) -> DFA:
    """Converts a Thompson NFA to an equivalent DFA using Subset Construction.
    
    Algorithm:
    1. Compute ε-closure of the NFA start state -> DFA start subset (D0).
    2. Maintain an unmarked queue of discovered subsets.
    3. For each subset and each alphabet symbol:
       a. Compute move(subset, symbol).
       b. Compute ε-closure(move).
       c. If non-empty, record transition and register new subset if unseen.
    4. Mark DFA states as accepting if their subset contains any NFA accepting state.
    """
    alphabet = sorted(list(nfa.alphabet))
    dfa = DFA(alphabet=alphabet)

    start_subset = frozenset(nfa.epsilon_closure({nfa.start_state}))

    # Map frozenset(nfa_states) -> DFA state identifier string ("D0", "D1", ...)
    subset_to_id: Dict[frozenset, str] = {}
    id_to_subset: Dict[str, frozenset] = {}

    start_id = "D0"
    subset_to_id[start_subset] = start_id
    id_to_subset[start_id] = start_subset

    is_start_accepting = any(s in nfa.accept_states for s in start_subset)
    dfa.add_state(DFAState(
        id=start_id,
        nfa_states=sorted(list(start_subset)),
        is_start=True,
        is_accepting=is_start_accepting,
    ))

    queue = deque([start_subset])

    while queue:
        current_subset = queue.popleft()
        current_id = subset_to_id[current_subset]

        for symbol in alphabet:
            # Step a: move(current_subset, symbol)
            moved_states = nfa.move(set(current_subset), symbol)
            if not moved_states:
                continue

            # Step b: ε-closure of moved states
            dest_subset = frozenset(nfa.epsilon_closure(moved_states))
            if not dest_subset:
                continue

            # Step c: check if subset already exists
            if dest_subset not in subset_to_id:
                dest_id = f"D{len(subset_to_id)}"
                subset_to_id[dest_subset] = dest_id
                id_to_subset[dest_id] = dest_subset

                is_dest_accepting = any(s in nfa.accept_states for s in dest_subset)
                dfa.add_state(DFAState(
                    id=dest_id,
                    nfa_states=sorted(list(dest_subset)),
                    is_start=False,
                    is_accepting=is_dest_accepting,
                ))
                queue.append(dest_subset)
            else:
                dest_id = subset_to_id[dest_subset]

            # Add deterministic transition
            dfa.add_transition(current_id, symbol, dest_id)

            # Record step in trace
            dfa.trace.append(SubsetTraceStep(
                source=current_id,
                source_subset=sorted(list(current_subset)),
                symbol=symbol,
                target=dest_id,
                target_subset=sorted(list(dest_subset)),
            ))

    return dfa

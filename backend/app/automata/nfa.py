"""Thompson's NFA Construction for Models of Computation (MOC).

Translates a Regular Expression AST into a Non-Deterministic Finite Automaton
with epsilon (ε) transitions using Ken Thompson's inductive construction algorithm (1968).

Every intermediate Thompson fragment possesses strictly:
- Exactly one start state
- Exactly one accepting state
"""

from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple, Any

from app.automata.regex_parser import (
    RegexNode,
    LiteralNode,
    ConcatNode,
    UnionNode,
    StarNode,
    PlusNode,
    OptionalNode,
    parse_regex,
)

EPSILON = "ε"


@dataclass
class NFATransition:
    """Explicit representation of a single directed transition in the NFA."""
    from_state: int
    symbol: str  # Literal symbol or EPSILON ('ε')
    to_state: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_state": f"S{self.from_state}",
            "from_state_id": self.from_state,
            "symbol": self.symbol,
            "to_state": f"S{self.to_state}",
            "to_state_id": self.to_state,
            "is_epsilon": self.symbol == EPSILON,
        }


@dataclass
class NFAFragment:
    """Sub-automaton fragment used during Thompson's inductive compilation."""
    start_state: int
    accept_state: int


class NFA:
    """Non-Deterministic Finite Automaton with Epsilon Transitions.
    
    Formal 5-tuple: M = (Q, Σ, δ, q0, F)
    """

    def __init__(self, start_state: int, accept_states: Set[int], states: Set[int]):
        self.start_state = start_state
        self.accept_states = set(accept_states)
        self.states = set(states)
        # Transition adjacency: state -> symbol -> set of target states
        self.transitions: Dict[int, Dict[str, Set[int]]] = defaultdict(lambda: defaultdict(set))
        # Alphabet Σ: unique non-epsilon symbols
        self.alphabet: Set[str] = set()

    def add_transition(self, from_state: int, symbol: str, to_state: int) -> None:
        """Adds a transition to the NFA and updates state/alphabet sets."""
        self.states.add(from_state)
        self.states.add(to_state)
        self.transitions[from_state][symbol].add(to_state)
        if symbol != EPSILON:
            self.alphabet.add(symbol)

    def get_all_transitions(self) -> List[NFATransition]:
        """Returns flattened list of all transitions sorted for deterministic presentation."""
        trans_list: List[NFATransition] = []
        for src in sorted(self.states):
            for sym in sorted(self.transitions[src].keys()):
                for dst in sorted(self.transitions[src][sym]):
                    trans_list.append(NFATransition(src, sym, dst))
        return trans_list

    def epsilon_closure(self, states: Set[int]) -> Set[int]:
        """Computes the ε-closure of a given set of NFA states.
        
        ε-closure(T) is the set of all states reachable from T through only ε-transitions,
        including T itself.
        """
        closure = set(states)
        stack = list(states)

        while stack:
            state = stack.pop()
            epsilon_targets = self.transitions[state].get(EPSILON, set())
            for target in epsilon_targets:
                if target not in closure:
                    closure.add(target)
                    stack.append(target)

        return closure

    def move(self, states: Set[int], symbol: str) -> Set[int]:
        """Returns the set of states reachable by consuming 'symbol' from any state in 'states'."""
        destinations = set()
        for state in states:
            targets = self.transitions[state].get(symbol, set())
            destinations.update(targets)
        return destinations

    def accepts(self, input_string: str) -> bool:
        """Simulates string evaluation on the NFA using epsilon-closure tracking."""
        current_states = self.epsilon_closure({self.start_state})

        for char in input_string:
            move_states = self.move(current_states, char)
            current_states = self.epsilon_closure(move_states)
            if not current_states:
                return False

        return any(s in self.accept_states for s in current_states)

    def to_dict(self) -> Dict[str, Any]:
        """Exports JSON-serializable representation of the NFA."""
        sorted_states = sorted(self.states)
        return {
            "states": [f"S{s}" for s in sorted_states],
            "state_ids": sorted_states,
            "start_state": f"S{self.start_state}",
            "start_state_id": self.start_state,
            "accepting_states": [f"S{s}" for s in sorted(self.accept_states)],
            "accepting_state_ids": sorted(self.accept_states),
            "alphabet": sorted(self.alphabet),
            "transitions": [t.to_dict() for t in self.get_all_transitions()],
            "transition_count": len(self.get_all_transitions()),
            "state_count": len(sorted_states),
        }


class ThompsonBuilder:
    """Builds an NFA from a Regex AST using Thompson's Construction."""

    def __init__(self):
        self.state_counter = 0

    def new_state(self) -> int:
        state = self.state_counter
        self.state_counter += 1
        return state

    def build(self, ast: RegexNode) -> NFA:
        """Constructs an NFA from the given Regex AST."""
        nfa = NFA(start_state=0, accept_states=set(), states=set())
        fragment = self._compile_node(ast, nfa)
        nfa.start_state = fragment.start_state
        nfa.accept_states.add(fragment.accept_state)
        return nfa

    def _compile_node(self, node: RegexNode, nfa: NFA) -> NFAFragment:
        if isinstance(node, LiteralNode):
            # Base case: s0 --char--> s1
            s0 = self.new_state()
            s1 = self.new_state()
            nfa.add_transition(s0, node.char, s1)
            return NFAFragment(s0, s1)

        elif isinstance(node, ConcatNode):
            # A · B: left.accept --ε--> right.start
            frag_left = self._compile_node(node.left, nfa)
            frag_right = self._compile_node(node.right, nfa)
            nfa.add_transition(frag_left.accept_state, EPSILON, frag_right.start_state)
            return NFAFragment(frag_left.start_state, frag_right.accept_state)

        elif isinstance(node, UnionNode):
            # A | B:
            # new_start --ε--> left.start, new_start --ε--> right.start
            # left.accept --ε--> new_accept, right.accept --ε--> new_accept
            start = self.new_state()
            accept = self.new_state()
            frag_left = self._compile_node(node.left, nfa)
            frag_right = self._compile_node(node.right, nfa)

            nfa.add_transition(start, EPSILON, frag_left.start_state)
            nfa.add_transition(start, EPSILON, frag_right.start_state)
            nfa.add_transition(frag_left.accept_state, EPSILON, accept)
            nfa.add_transition(frag_right.accept_state, EPSILON, accept)
            return NFAFragment(start, accept)

        elif isinstance(node, StarNode):
            # A*:
            # new_start --ε--> child.start
            # new_start --ε--> new_accept (zero occurrences)
            # child.accept --ε--> child.start (loop back)
            # child.accept --ε--> new_accept
            start = self.new_state()
            accept = self.new_state()
            frag_child = self._compile_node(node.child, nfa)

            nfa.add_transition(start, EPSILON, frag_child.start_state)
            nfa.add_transition(start, EPSILON, accept)
            nfa.add_transition(frag_child.accept_state, EPSILON, frag_child.start_state)
            nfa.add_transition(frag_child.accept_state, EPSILON, accept)
            return NFAFragment(start, accept)

        elif isinstance(node, PlusNode):
            # A+:
            # new_start --ε--> child.start
            # child.accept --ε--> child.start (loop back)
            # child.accept --ε--> new_accept
            # (No bypass from start to accept: forces at least 1 match)
            start = self.new_state()
            accept = self.new_state()
            frag_child = self._compile_node(node.child, nfa)

            nfa.add_transition(start, EPSILON, frag_child.start_state)
            nfa.add_transition(frag_child.accept_state, EPSILON, frag_child.start_state)
            nfa.add_transition(frag_child.accept_state, EPSILON, accept)
            return NFAFragment(start, accept)

        elif isinstance(node, OptionalNode):
            # A?:
            # new_start --ε--> child.start
            # new_start --ε--> new_accept (bypass)
            # child.accept --ε--> new_accept (no loop back)
            start = self.new_state()
            accept = self.new_state()
            frag_child = self._compile_node(node.child, nfa)

            nfa.add_transition(start, EPSILON, frag_child.start_state)
            nfa.add_transition(start, EPSILON, accept)
            nfa.add_transition(frag_child.accept_state, EPSILON, accept)
            return NFAFragment(start, accept)

        raise TypeError(f"Unknown AST node type: {type(node).__name__}")


def regex_to_nfa(pattern: str) -> NFA:
    """High-level function: parses regex pattern and compiles it to Thompson NFA."""
    ast = parse_regex(pattern)
    builder = ThompsonBuilder()
    return builder.build(ast)

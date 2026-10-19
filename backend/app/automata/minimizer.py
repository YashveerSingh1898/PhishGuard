"""DFA Minimization via Partition Refinement for Models of Computation (MOC).

Reduces a Deterministic Finite Automaton (DFA) to its canonical Minimal DFA
equivalent using iterative partition refinement (Myhill-Nerode / Moore's algorithm).

Key Stages:
1. Reachability Pruning: Eliminates dead and unreachable states from q0.
2. Initial Partition: Distinguishes non-accepting (P_non) and accepting (P_acc) states.
3. Partition Refinement: Iteratively splits groups whose members transition to
   distinct partition blocks on any alphabet symbol.
4. Canonical Isomorphic DFA Generation: Assigns stable identifiers (M0, M1, ...)
   with M0 designating the start partition.
"""

from collections import deque
from dataclasses import dataclass
from typing import Dict, List, Set, Tuple, Any, Optional

from app.automata.dfa import DFA, DFATransition


@dataclass
class MinimizedState:
    """Represents a state in the Minimized DFA, grouping equivalent original DFA states."""
    id: str  # e.g. "M0", "M1"
    original_dfa_states: List[str]  # e.g. ["D0", "D2"]
    is_start: bool = False
    is_accepting: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "original_dfa_states": self.original_dfa_states,
            "is_start": self.is_start,
            "is_accepting": self.is_accepting,
        }


@dataclass
class MinimizationStep:
    """Records one partition refinement iteration for educational inspection."""
    step: int
    partition_count: int
    partitions: List[List[str]]
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step": self.step,
            "partition_count": self.partition_count,
            "partitions": self.partitions,
            "description": self.description,
        }


class MinimizedDFA:
    """Canonical Minimized Deterministic Finite Automaton."""

    def __init__(self, alphabet: List[str]):
        self.alphabet = sorted(alphabet)
        self.states: Dict[str, MinimizedState] = {}
        self.start_state: str = "M0"
        self.accepting_states: Set[str] = set()
        self.transitions: Dict[Tuple[str, str], str] = {}
        self.initial_partitions: List[Dict[str, Any]] = []
        self.refinement_steps: List[MinimizationStep] = []
        self.states_before: int = 0
        self.states_after: int = 0

    def add_state(self, state: MinimizedState) -> None:
        self.states[state.id] = state
        if state.is_start:
            self.start_state = state.id
        if state.is_accepting:
            self.accepting_states.add(state.id)

    def add_transition(self, from_state: str, symbol: str, to_state: str) -> None:
        self.transitions[(from_state, symbol)] = to_state

    def get_all_transitions(self) -> List[DFATransition]:
        return [
            DFATransition(src, sym, dst)
            for (src, sym), dst in sorted(self.transitions.items(), key=lambda x: (x[0][0], x[0][1]))
        ]

    def accepts(self, input_string: str) -> bool:
        """Evaluates an input string against the Minimized DFA."""
        current = self.start_state
        if current not in self.states:
            return False

        for char in input_string:
            next_state = self.transitions.get((current, char))
            if next_state is None:
                return False
            current = next_state

        return current in self.accepting_states

    def to_dict(self) -> Dict[str, Any]:
        """Exports JSON-serializable representation of the Minimized DFA."""
        sorted_states = [self.states[s_id] for s_id in sorted(self.states.keys(), key=lambda x: int(x[1:]))]
        reduction = self.states_before - self.states_after
        reduction_pct = round((reduction / self.states_before) * 100, 2) if self.states_before > 0 else 0.0

        return {
            "states": [s.to_dict() for s in sorted_states],
            "state_count": len(sorted_states),
            "start_state": self.start_state,
            "accepting_states": sorted(list(self.accepting_states), key=lambda x: int(x[1:])),
            "alphabet": self.alphabet,
            "transitions": [t.to_dict() for t in self.get_all_transitions()],
            "transition_count": len(self.transitions),
            "initial_partitions": self.initial_partitions,
            "refinement_steps": [s.to_dict() for s in self.refinement_steps],
            "comparison": {
                "states_before": self.states_before,
                "states_after": self.states_after,
                "reduction_count": reduction,
                "reduction_percentage": reduction_pct,
                "is_reduced": reduction > 0,
            },
        }


def find_reachable_states(dfa: DFA) -> Set[str]:
    """Discovers all DFA states reachable from the start state using Breadth-First Search."""
    if dfa.start_state not in dfa.states:
        return set()

    reachable = {dfa.start_state}
    queue = deque([dfa.start_state])

    while queue:
        curr = queue.popleft()
        for symbol in dfa.alphabet:
            target = dfa.transitions.get((curr, symbol))
            if target is not None and target not in reachable:
                reachable.add(target)
                queue.append(target)

    return reachable


def minimize_dfa(dfa: DFA) -> MinimizedDFA:
    """Minimizes a DFA using the Partition Refinement algorithm.
    
    1. Prunes unreachable states.
    2. Constructs initial partition: Non-accepting states vs. Accepting states.
    3. Refines partitions until no further distinguishing transition behaviors exist.
    4. Forms canonical Minimized DFA with stable state IDs (M0, M1, ...).
    """
    min_dfa = MinimizedDFA(alphabet=dfa.alphabet)

    # 1. Prune unreachable states
    reachable = find_reachable_states(dfa)
    min_dfa.states_before = len(reachable)

    if not reachable:
        min_dfa.states_after = 0
        return min_dfa

    # Helper function to sort state IDs naturally (D0, D1, D2, ...)
    def state_sort_key(s: str) -> int:
        return int(s[1:]) if s.startswith('D') and s[1:].isdigit() else 0

    # 2. Initial Partition: Accepting vs Non-Accepting
    accepting_reachable = sorted([s for s in reachable if s in dfa.accepting_states], key=state_sort_key)
    non_accepting_reachable = sorted([s for s in reachable if s not in dfa.accepting_states], key=state_sort_key)

    partitions: List[List[str]] = []
    initial_partitions_info = []

    if non_accepting_reachable:
        partitions.append(non_accepting_reachable)
        initial_partitions_info.append({
            "partition_index": len(initial_partitions_info),
            "group_type": "non_accepting",
            "states": non_accepting_reachable,
        })

    if accepting_reachable:
        partitions.append(accepting_reachable)
        initial_partitions_info.append({
            "partition_index": len(initial_partitions_info),
            "group_type": "accepting",
            "states": accepting_reachable,
        })

    min_dfa.initial_partitions = initial_partitions_info

    # Record initial partition baseline step
    min_dfa.refinement_steps.append(MinimizationStep(
        step=0,
        partition_count=len(partitions),
        partitions=[list(p) for p in partitions],
        description="Initial partition: split into non-accepting and accepting states."
    ))

    # 3. Iterative Partition Refinement
    step_num = 1
    while True:
        # Create quick lookup: state -> partition index
        state_to_partition = {
            state: p_idx
            for p_idx, part in enumerate(partitions)
            for state in part
        }

        new_partitions: List[List[str]] = []

        for group in partitions:
            if len(group) <= 1:
                new_partitions.append(group)
                continue

            # Group states by transition signature across all alphabet symbols
            # Signature tuple: (dest_partition_idx_for_sym_0, dest_partition_idx_for_sym_1, ...)
            # -1 represents no transition (dead / trap state)
            signature_map: Dict[Tuple[int, ...], List[str]] = {}

            for state in group:
                sig_list = []
                for sym in dfa.alphabet:
                    target = dfa.transitions.get((state, sym))
                    if target is not None and target in state_to_partition:
                        sig_list.append(state_to_partition[target])
                    else:
                        sig_list.append(-1)
                
                sig = tuple(sig_list)
                if sig not in signature_map:
                    signature_map[sig] = []
                signature_map[sig].append(state)

            # Add each split subgroup
            for subgroup in signature_map.values():
                new_partitions.append(sorted(subgroup, key=state_sort_key))

        # Sort partitions stably by their smallest state element
        new_partitions.sort(key=lambda p: state_sort_key(p[0]))

        if new_partitions == partitions:
            # Fixed point reached: partitions have stabilized
            break

        min_dfa.refinement_steps.append(MinimizationStep(
            step=step_num,
            partition_count=len(new_partitions),
            partitions=[list(p) for p in new_partitions],
            description=f"Refinement step {step_num}: split partitions into {len(new_partitions)} distinguishable groups."
        ))

        partitions = new_partitions
        step_num += 1

    # 4. Construct Minimized DFA from final partitions
    # M0 must correspond to the partition containing original start_state (D0)
    ordered_partitions: List[List[str]] = []
    start_partition: Optional[List[str]] = None

    for p in partitions:
        if dfa.start_state in p:
            start_partition = p
            break

    if start_partition:
        ordered_partitions.append(start_partition)

    for p in partitions:
        if p != start_partition:
            ordered_partitions.append(p)

    # Map original DFA states to their assigned Minimized DFA state ID (M0, M1, ...)
    dfa_to_min_id: Dict[str, str] = {}
    for idx, part in enumerate(ordered_partitions):
        min_id = f"M{idx}"
        for original_state in part:
            dfa_to_min_id[original_state] = min_id

    # Create MinimizedState entries
    for idx, part in enumerate(ordered_partitions):
        min_id = f"M{idx}"
        is_start = (idx == 0)
        is_acc = any(s in dfa.accepting_states for s in part)

        min_dfa.add_state(MinimizedState(
            id=min_id,
            original_dfa_states=part,
            is_start=is_start,
            is_accepting=is_acc,
        ))

    # Add Minimized Transitions using representative state from each partition
    for idx, part in enumerate(ordered_partitions):
        min_id = f"M{idx}"
        rep_state = part[0]

        for sym in dfa.alphabet:
            target = dfa.transitions.get((rep_state, sym))
            if target is not None and target in dfa_to_min_id:
                target_min_id = dfa_to_min_id[target]
                min_dfa.add_transition(min_id, sym, target_min_id)

    min_dfa.states_after = len(ordered_partitions)
    return min_dfa

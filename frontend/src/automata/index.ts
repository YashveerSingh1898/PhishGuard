/**
 * Automata visualization helper utilities.
 * Graph layout and transition path highlight logic will be implemented in Phase 2.
 */

export interface SimulationStep {
  currentState: string;
  consumedChar: string;
  nextState: string;
}

export function placeholderSimulation(): SimulationStep[] {
  return [];
}

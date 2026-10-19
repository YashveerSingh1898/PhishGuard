/**
 * Automata visualization helper utilities and graph layout engines.
 */

import {
  NFAData,
  DFAData,
  MinimizedDFAData,
  AutomataNode,
  AutomataEdge,
  AutomataGraph,
} from '../types';

export interface LayoutedNode extends AutomataNode {
  x: number;
  y: number;
  radius: number;
  layer: number;
}

export interface RenderEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  isEpsilon: boolean;
  isSelfLoop: boolean;
  curvature: number; // 0 for straight/default, positive or negative for opposing curves
}

/**
 * Builds an AutomataGraph from NFAData.
 */
export function nfaToGraph(nfa: NFAData): AutomataGraph {
  const nodes: AutomataNode[] = nfa.states.map((s, idx) => {
    const stateId = nfa.state_ids[idx];
    return {
      id: s,
      label: s,
      isStart: s === nfa.start_state,
      isAccepting: nfa.accepting_states.includes(s) || nfa.accepting_state_ids.includes(stateId),
    };
  });

  const edges: AutomataEdge[] = nfa.transitions.map((t, idx) => ({
    id: `nfa-edge-${idx}-${t.from_state}-${t.symbol}-${t.to_state}`,
    source: t.from_state,
    target: t.to_state,
    label: t.symbol,
    isEpsilon: t.is_epsilon,
  }));

  return { nodes, edges };
}

/**
 * Builds an AutomataGraph from DFAData.
 */
export function dfaToGraph(dfa: DFAData): AutomataGraph {
  const nodes: AutomataNode[] = dfa.states.map((s) => ({
    id: s.id,
    label: s.id,
    sublabel: `{${s.nfa_state_labels ? s.nfa_state_labels.join(',') : s.nfa_states.map((n) => `S${n}`).join(',')}}`,
    isStart: s.is_start || s.id === dfa.start_state,
    isAccepting: s.is_accepting || dfa.accepting_states.includes(s.id),
  }));

  const edges: AutomataEdge[] = dfa.transitions.map((t, idx) => ({
    id: `dfa-edge-${idx}-${t.from_state}-${t.symbol}-${t.to_state}`,
    source: t.from_state,
    target: t.to_state,
    label: t.symbol,
    isEpsilon: false,
  }));

  return { nodes, edges };
}

/**
 * Builds an AutomataGraph from MinimizedDFAData.
 */
export function minDfaToGraph(minDfa: MinimizedDFAData): AutomataGraph {
  const nodes: AutomataNode[] = minDfa.states.map((s) => ({
    id: s.id,
    label: s.id,
    sublabel: `{${s.original_dfa_states.join(',')}}`,
    isStart: s.is_start || s.id === minDfa.start_state,
    isAccepting: s.is_accepting || minDfa.accepting_states.includes(s.id),
  }));

  const edges: AutomataEdge[] = minDfa.transitions.map((t, idx) => ({
    id: `min-edge-${idx}-${t.from_state}-${t.symbol}-${t.to_state}`,
    source: t.from_state,
    target: t.to_state,
    label: t.symbol,
    isEpsilon: false,
  }));

  return { nodes, edges };
}

/**
 * Aggregates multiple edges between identical (source, target) pairs,
 * joining their symbol labels with commas (e.g. "a, b").
 * Also computes opposing curvature for dual-directed edges (A -> B and B -> A).
 */
export function processEdgesForRendering(edges: AutomataEdge[]): RenderEdge[] {
  // 1. Group by (source, target, isEpsilon)
  const grouped = new Map<string, { source: string; target: string; symbols: string[]; isEpsilon: boolean }>();

  edges.forEach((edge) => {
    const key = `${edge.source}->${edge.target}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        source: edge.source,
        target: edge.target,
        symbols: [edge.label],
        isEpsilon: !!edge.isEpsilon,
      });
    } else {
      const g = grouped.get(key)!;
      if (!g.symbols.includes(edge.label)) {
        g.symbols.push(edge.label);
      }
    }
  });

  const processed: RenderEdge[] = [];
  const processedKeys = new Set<string>();

  grouped.forEach((g, key) => {
    const isSelfLoop = g.source === g.target;
    const reverseKey = `${g.target}->${g.source}`;
    const hasReverse = !isSelfLoop && grouped.has(reverseKey);

    let curvature = 0;
    if (hasReverse) {
      // Curve this edge outward
      curvature = 35;
    }

    processed.push({
      id: key,
      source: g.source,
      target: g.target,
      label: g.symbols.join(', '),
      isEpsilon: g.isEpsilon,
      isSelfLoop,
      curvature,
    });
    processedKeys.add(key);
  });

  return processed;
}

/**
 * Computes deterministic layered topological coordinates for all nodes in an automaton.
 * Start state is placed at layer 0 (leftmost), advancing rightward across BFS tiers.
 */
export function calculateLayeredLayout(
  nodes: AutomataNode[],
  edges: AutomataEdge[],
  viewWidth: number = 850,
  viewHeight: number = 420
): { layoutedNodes: LayoutedNode[]; minX: number; maxX: number; minY: number; maxY: number } {
  if (nodes.length === 0) {
    return { layoutedNodes: [], minX: 0, maxX: viewWidth, minY: 0, maxY: viewHeight };
  }

  const startNode = nodes.find((n) => n.isStart) || nodes[0];
  const nodeMap = new Map<string, AutomataNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Adjacency list
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (e.source !== e.target && adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  // Assign layers using BFS from start node
  const layers = new Map<string, number>();
  layers.set(startNode.id, 0);

  const queue: string[] = [startNode.id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current)!;
    const neighbors = adj.get(current) || [];

    for (const neighbor of neighbors) {
      if (!layers.has(neighbor)) {
        layers.set(neighbor, currentLayer + 1);
        queue.push(neighbor);
      }
    }
  }

  // Any unreached nodes get assigned to subsequent layers
  let maxLayer = 0;
  layers.forEach((l) => {
    if (l > maxLayer) maxLayer = l;
  });

  nodes.forEach((n) => {
    if (!layers.has(n.id)) {
      maxLayer += 1;
      layers.set(n.id, maxLayer);
    }
  });

  // Group nodes by layer
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, nodeId) => {
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(nodeId);
  });

  const totalLayers = Math.max(1, maxLayer + 1);
  const layerSpacing = Math.max(160, Math.min(220, (viewWidth - 160) / Math.max(1, totalLayers - 1 || 1)));
  const nodeRadius = 26;
  const paddingX = 90;
  const centerY = viewHeight / 2;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const layoutedNodes: LayoutedNode[] = [];

  layerGroups.forEach((nodeIds, layerIndex) => {
    const count = nodeIds.length;
    const x = paddingX + layerIndex * layerSpacing;
    const nodeSpacingY = Math.max(80, Math.min(120, (viewHeight - 100) / Math.max(1, count)));

    nodeIds.forEach((nodeId, idxInLayer) => {
      const y = count === 1 ? centerY : centerY + (idxInLayer - (count - 1) / 2) * nodeSpacingY;
      const baseNode = nodeMap.get(nodeId)!;

      const layouted: LayoutedNode = {
        ...baseNode,
        x,
        y,
        radius: nodeRadius,
        layer: layerIndex,
      };

      layoutedNodes.push(layouted);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  });

  return {
    layoutedNodes,
    minX: Math.max(0, minX - 80),
    maxX: Math.max(viewWidth, maxX + 80),
    minY: Math.max(0, minY - 80),
    maxY: Math.max(viewHeight, maxY + 80),
  };
}

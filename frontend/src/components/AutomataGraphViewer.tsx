import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AutomataGraph } from '../types';
import {
  calculateLayeredLayout,
  processEdgesForRendering,
  LayoutedNode,
  RenderEdge,
} from '../automata';

interface AutomataGraphViewerProps {
  graph: AutomataGraph;
  title: string;
  stageName: string;
  emptyMessage?: string;
  highlightStateId?: string | null;
  highlightTransition?: { fromState: string; toState: string } | null;
}

export const AutomataGraphViewer: React.FC<AutomataGraphViewerProps> = ({
  graph,
  title,
  stageName,
  emptyMessage = 'No graph data available for this stage.',
  highlightStateId = null,
  highlightTransition = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout and node positioning state
  const [nodes, setNodes] = useState<LayoutedNode[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initial layout calculation when graph changes
  useEffect(() => {
    if (!graph.nodes || graph.nodes.length === 0) {
      setNodes([]);
      return;
    }

    const width = containerRef.current?.clientWidth || 900;
    const height = 440;
    const { layoutedNodes } = calculateLayeredLayout(graph.nodes, graph.edges, width, height);
    setNodes(layoutedNodes);
    setActiveNodeId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [graph]);

  // Processed edges (merging parallel transitions, computing curves)
  const renderedEdges = useMemo<RenderEdge[]>(() => {
    return processEdgesForRendering(graph.edges);
  }, [graph.edges]);

  // Node dictionary for rapid coordinate lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, LayoutedNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Handle Fit to View / Center
  const handleFitToView = useCallback(() => {
    if (nodes.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const containerW = containerRef.current?.clientWidth || 900;
    const containerH = containerRef.current?.clientHeight || 440;

    const graphW = Math.max(100, maxX - minX + 160);
    const graphH = Math.max(100, maxY - minY + 160);

    const scale = Math.min(1.2, Math.max(0.45, Math.min(containerW / graphW, containerH / graphH)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(scale);
    setPan({
      x: containerW / 2 - centerX * scale,
      y: containerH / 2 - centerY * scale,
    });
  }, [nodes]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.3, prev * factor)));
  };

  // Canvas background drag (pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingNodeId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: mouseCanvasX - nodeDragOffset.x, y: mouseCanvasY - nodeDragOffset.y }
            : n
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag start
  const handleNodeMouseDown = (e: React.MouseEvent, node: LayoutedNode) => {
    e.stopPropagation();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

    setDraggingNodeId(node.id);
    setNodeDragOffset({ x: mouseCanvasX - node.x, y: mouseCanvasY - node.y });
    setActiveNodeId(node.id);
  };

  if (graph.nodes.length === 0) {
    return (
      <div className="h-[440px] flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-navy-950/40 rounded-xl border border-navy-800">
        <Info className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
        <p className="text-xs text-slate-600 mt-1">Enter a regular expression and click Convert to compute the graph.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-navy-950 rounded-xl border border-navy-800 shadow-xl overflow-hidden">
      {/* Graph Toolbar */}
      <div className="px-4 py-3 bg-navy-900/90 border-b border-navy-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white">{title}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-navy-800 text-teal-400 border border-teal-500/20">
            {stageName}
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            ({nodes.length} states, {graph.edges.length} transitions)
          </span>
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="p-1.5 rounded bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-750 transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
            className="p-1.5 rounded bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-750 transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFitToView}
            className="p-1.5 rounded bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-750 transition-colors"
            title="Fit to View / Center"
            aria-label="Fit to view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-navy-850 border border-navy-800">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      {/* SVG Graph Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-[440px] bg-navy-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        <svg className="w-full h-full pointer-events-auto">
          <defs>
            {/* Standard transition arrowhead */}
            <marker
              id="arrow-teal"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#14b8a6" />
            </marker>

            {/* Epsilon transition arrowhead */}
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#06b6d4" />
            </marker>

            {/* Active / Highlighted arrowhead */}
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
            </marker>

            {/* Simulation Active Transition Arrowhead */}
            <marker
              id="arrow-highlight"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
            </marker>

            {/* Start state incoming arrow */}
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Transform group for Pan & Zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Render Transitions (Edges) */}
            {renderedEdges.map((edge) => {
              const src = nodeMap.get(edge.source);
              const dst = nodeMap.get(edge.target);
              if (!src || !dst) return null;

              const isTransitionHighlighted =
                highlightTransition &&
                edge.source === highlightTransition.fromState &&
                edge.target === highlightTransition.toState;

              const isEdgeActive =
                isTransitionHighlighted ||
                (activeNodeId && (edge.source === activeNodeId || edge.target === activeNodeId));

              const strokeColor = isTransitionHighlighted
                ? '#f59e0b'
                : isEdgeActive
                ? '#10b981'
                : edge.isEpsilon
                ? '#06b6d4'
                : '#14b8a6';

              const markerId = isTransitionHighlighted
                ? 'url(#arrow-highlight)'
                : isEdgeActive
                ? 'url(#arrow-active)'
                : edge.isEpsilon
                ? 'url(#arrow-cyan)'
                : 'url(#arrow-teal)';

              // --- Case 1: Self Loop ---
              if (edge.isSelfLoop) {
                const r = src.radius;
                const loopRadius = 24;
                const startX = src.x - 10;
                const startY = src.y - r;
                const endX = src.x + 10;
                const endY = src.y - r;
                const cpY = src.y - r - loopRadius * 2;

                const pathD = `M ${startX} ${startY} C ${src.x - loopRadius * 1.5} ${cpY}, ${src.x + loopRadius * 1.5} ${cpY}, ${endX} ${endY}`;
                const labelX = src.x;
                const labelY = cpY + 6;

                return (
                  <g key={edge.id} className="transition-opacity">
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isEdgeActive ? 2.5 : 1.75}
                      strokeDasharray={edge.isEpsilon ? '4 3' : undefined}
                      markerEnd={markerId}
                    />
                    {/* Symbol Pill Badge */}
                    <g transform={`translate(${labelX}, ${labelY})`}>
                      <rect
                        x="-14"
                        y="-10"
                        width="28"
                        height="18"
                        rx="4"
                        fill="#0b1120"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill={isEdgeActive ? '#34d399' : '#e2e8f0'}
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="600"
                      >
                        {edge.label}
                      </text>
                    </g>
                  </g>
                );
              }

              // --- Case 2: Inter-node Transition ---
              const dx = dst.x - src.x;
              const dy = dst.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;

              const angle = Math.atan2(dy, dx);
              const r = src.radius;

              let pathD = '';
              let labelX = 0;
              let labelY = 0;

              if (edge.curvature !== 0) {
                // Curved edge for opposing transitions
                const midX = (src.x + dst.x) / 2;
                const midY = (src.y + dst.y) / 2;
                const normX = -Math.sin(angle) * edge.curvature;
                const normY = Math.cos(angle) * edge.curvature;
                const cpX = midX + normX;
                const cpY = midY + normY;

                // Tangent calculations at start and end for smooth circle boundary entry
                const startAngle = Math.atan2(cpY - src.y, cpX - src.x);
                const endAngle = Math.atan2(dst.y - cpY, dst.x - cpX);

                const sx = src.x + r * Math.cos(startAngle);
                const sy = src.y + r * Math.sin(startAngle);
                const tx = dst.x - r * Math.cos(endAngle);
                const ty = dst.y - r * Math.sin(endAngle);

                pathD = `M ${sx} ${sy} Q ${cpX} ${cpY} ${tx} ${ty}`;

                // Label at quadratic bezier mid-point (t = 0.5)
                labelX = 0.25 * sx + 0.5 * cpX + 0.25 * tx;
                labelY = 0.25 * sy + 0.5 * cpY + 0.25 * ty;
              } else {
                // Straight transition
                const sx = src.x + r * Math.cos(angle);
                const sy = src.y + r * Math.sin(angle);
                const tx = dst.x - r * Math.cos(angle);
                const ty = dst.y - r * Math.sin(angle);

                pathD = `M ${sx} ${sy} L ${tx} ${ty}`;
                labelX = (sx + tx) / 2;
                labelY = (sy + ty) / 2;
              }

              const pillWidth = Math.max(22, edge.label.length * 8 + 12);

              return (
                <g key={edge.id} className="transition-opacity">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isEdgeActive ? 2.5 : 1.75}
                    strokeDasharray={edge.isEpsilon ? '4 3' : undefined}
                    markerEnd={markerId}
                  />

                  {/* Transition Label Pill */}
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={-pillWidth / 2}
                      y="-9"
                      width={pillWidth}
                      height="18"
                      rx="4"
                      fill="#0b1120"
                      stroke={strokeColor}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={edge.isEpsilon ? '#38bdf8' : isEdgeActive ? '#34d399' : '#e2e8f0'}
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="600"
                    >
                      {edge.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Render States (Nodes) */}
            {nodes.map((node) => {
              const isHighlighted = highlightStateId === node.id;
              const isSelected = activeNodeId === node.id || isHighlighted;
              const r = node.radius;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveNodeId((prev) => (prev === node.id ? null : node.id));
                  }}
                  className="cursor-pointer group"
                >
                  {/* Start State Incoming Arrow indicator */}
                  {node.isStart && (
                    <g transform={`translate(${-r - 35}, 0)`}>
                      <line
                        x1="0"
                        y1="0"
                        x2="30"
                        y2="0"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        markerEnd="url(#arrow-start)"
                      />
                      <text
                        x="-4"
                        y="-6"
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        START
                      </text>
                    </g>
                  )}

                  {/* Outer circle halo on simulation highlight or manual selection */}
                  {isSelected && (
                    <circle
                      r={r + (isHighlighted ? 8 : 6)}
                      fill="none"
                      stroke={isHighlighted ? '#f59e0b' : '#14b8a6'}
                      strokeWidth={isHighlighted ? 2.5 : 2}
                      strokeDasharray={isHighlighted ? '4 2' : '3 3'}
                      className="animate-spin"
                      style={{ transformOrigin: '0 0', animationDuration: isHighlighted ? '5s' : '8s' }}
                    />
                  )}

                  {/* Primary Node Circle */}
                  <circle
                    r={r}
                    fill={isHighlighted ? '#451a03' : node.isAccepting ? '#064e3b' : '#0f172a'}
                    stroke={
                      isHighlighted
                        ? '#f59e0b'
                        : isSelected
                        ? '#38bdf8'
                        : node.isAccepting
                        ? '#10b981'
                        : '#14b8a6'
                    }
                    strokeWidth={isHighlighted ? 3.5 : isSelected ? 3 : 2}
                    className="transition-colors group-hover:stroke-teal-300"
                  />

                  {/* Double circle for accepting state */}
                  {node.isAccepting && (
                    <circle
                      r={r - 5}
                      fill="none"
                      stroke={isSelected ? '#38bdf8' : '#10b981'}
                      strokeWidth="1.5"
                    />
                  )}

                  {/* State Name Label (e.g. S0, D0, M0) */}
                  <text
                    y={node.sublabel ? -2 : 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={node.label.length > 3 ? '10' : '12'}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    {node.label}
                  </text>

                  {/* State Sublabel (e.g. subset {0, 1, 2} or {D0, D2}) */}
                  {node.sublabel && (
                    <text
                      y={12}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="500"
                      pointerEvents="none"
                    >
                      {node.sublabel.length > 12 ? `${node.sublabel.slice(0, 11)}…}` : node.sublabel}
                    </text>
                  )}

                  {/* Full subset badge underneath node if hovered or selected */}
                  {isSelected && node.sublabel && (
                    <g transform={`translate(0, ${r + 16})`}>
                      <rect
                        x="-45"
                        y="-9"
                        width="90"
                        height="18"
                        rx="4"
                        fill="#020617"
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />
                      <text
                        y="3"
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {node.sublabel}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Drag Hint overlay */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-navy-900/80 px-2 py-1 rounded border border-navy-800 flex items-center gap-1 pointer-events-none">
          <Move className="w-3 h-3 text-slate-400" />
          <span>Pan: Drag canvas | Move: Drag nodes | Zoom: Scroll</span>
        </div>
      </div>

      {/* Automata Legend */}
      <div className="px-4 py-2.5 bg-navy-900/60 border-t border-navy-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
            <span className="text-slate-300">Start State (Incoming Arrow)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-emerald-950/80 inline-block"></span>
            <span className="text-slate-300">Accepting State (Double Ring)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-teal-400 bg-navy-900 inline-block"></span>
            <span className="text-slate-300">Standard State (Single Ring)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">ε</span>
            <span className="text-slate-300">Epsilon Transition</span>
          </div>
        </div>

        {activeNodeId && (
          <div className="text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active State: {activeNodeId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

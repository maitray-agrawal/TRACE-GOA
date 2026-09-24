import React, { useState, useMemo } from "react";
import type { SubgraphData, GraphNode } from "../types";
import { ZoomIn, ZoomOut, Maximize2, Layers, Waves } from "lucide-react";

interface GraphViewerProps {
  data: SubgraphData | null;
  onNodeClick?: (node: GraphNode) => void;
  height?: string | number;
  className?: string;
}

const GOA_NODE_COLORS: Record<string, { bg: string; text: string }> = {
  Transaction: { bg: "var(--sun-yellow)", text: "var(--ink)" },
  Customer: { bg: "var(--goa-green-200)", text: "var(--ink)" },
  Account: { bg: "var(--sand)", text: "var(--ink)" },
  Device: { bg: "var(--sand-dark)", text: "var(--ink)" },
  IP: { bg: "var(--goa-green-300)", text: "var(--ink)" },
  Card: { bg: "var(--paper)", text: "var(--ink)" },
  Merchant: { bg: "#FFD180", text: "var(--ink)" },
  Case: { bg: "var(--hot-pink)", text: "var(--paper)" },
  FraudPattern: { bg: "var(--hot-pink)", text: "var(--paper)" },
};

export const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  onNodeClick,
  height = "100%",
  className = "",
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isWaveActive, setIsWaveActive] = useState(false);

  // Compute node coordinates around central target transaction
  const positionedNodes = useMemo(() => {
    if (!data || !data.nodes || data.nodes.length === 0) return [];

    const nodes = [...data.nodes];
    const centerNode = nodes.find((n) => n.id === data.target_transaction) || nodes[0];
    const centerX = 360;
    const centerY = 240;

    const positioned: GraphNode[] = [];
    positioned.push({ ...centerNode, x: centerX, y: centerY });

    const otherNodes = nodes.filter((n) => n.id !== centerNode.id);
    const radius = Math.min(190, 60 + otherNodes.length * 16);
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    otherNodes.forEach((node, i) => {
      const angle = i * angleStep;
      positioned.push({
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    return positioned;
  }, [data]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    positionedNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [positionedNodes]);

  if (!data || positionedNodes.length === 0) {
    return (
      <div
        className={`card-goa card-goa-sand flex items-center justify-center p-8 text-center select-none ${className}`}
        style={{ height }}
      >
        <div>
          <Layers size={40} className="mx-auto mb-2 text-ink/40" />
          <h4 className="font-mono text-sm font-bold text-ink uppercase tracking-wider">
            NO ACTIVE GRAPH SUBGRAPH LOADED
          </h4>
          <p className="font-mono text-xs text-ink/70 mt-1 max-w-sm">
            Select a case from the Beach-Shack Village to traverse TigerGraph 2-hop neighborhood.
          </p>
        </div>
      </div>
    );
  }

  const centerNode = positionedNodes[0];

  return (
    <div
      className={`card-goa bg-goa-green-700 relative overflow-hidden border-3 border-ink rounded-xl shadow-md select-none ${className}`}
      style={{ height, cursor: isDragging ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar Controls */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5">
          <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-sun-yellow text-ink border-2 border-ink shadow-xs">
            TIGERGRAPH // 2-HOP TOPOLOGY
          </span>
          <button
            type="button"
            onClick={() => setIsWaveActive(!isWaveActive)}
            className={`btn-goa-primary text-[11px] py-1 px-2.5 flex items-center gap-1 ${
              isWaveActive ? "bg-hot-pink text-paper animate-pulse" : "bg-paper text-ink"
            }`}
            title="Toggle outward hop-by-hop traversal wave animation"
          >
            <Waves size={13} /> {isWaveActive ? "HOP WAVE ON" : "HOP WAVE"}
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-sand p-1 rounded border-2 border-ink shadow-xs">
          <button
            type="button"
            className="p-1 rounded hover:bg-sand-light text-ink transition-colors"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-sand-light text-ink transition-colors"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-sand-light text-ink transition-colors"
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset View"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg width="100%" height="100%" className="w-full h-full">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Animated concentric Hop-Waves from Trigger Transaction */}
          {isWaveActive && centerNode && (
            <g className="pointer-events-none">
              <circle
                cx={centerNode.x}
                cy={centerNode.y}
                r="70"
                fill="none"
                stroke="var(--sun-yellow)"
                strokeWidth="2.5"
                opacity="0.6"
                strokeDasharray="4 3"
              />
              <circle
                cx={centerNode.x}
                cy={centerNode.y}
                r="150"
                fill="none"
                stroke="var(--hot-pink)"
                strokeWidth="2.5"
                opacity="0.4"
                strokeDasharray="6 4"
              />
            </g>
          )}

          {/* Edges with Chunky Ink Styling */}
          {data.edges.map((e, idx) => {
            const src = nodeMap.get(e.source);
            const tgt = nodeMap.get(e.target);
            if (!src || !tgt || src.x == null || src.y == null || tgt.x == null || tgt.y == null)
              return null;

            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="var(--ink)"
                  strokeWidth={2.5}
                />
                <rect
                  x={midX - 28}
                  y={midY - 8}
                  width="56"
                  height="14"
                  rx="3"
                  fill="var(--sand)"
                  stroke="var(--ink)"
                  strokeWidth="1.2"
                />
                <text
                  x={midX}
                  y={midY + 2.5}
                  fill="var(--ink)"
                  fontSize={8}
                  fontWeight={800}
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {e.type.slice(0, 10)}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {positionedNodes.map((node) => {
            const styling = GOA_NODE_COLORS[node.type] || { bg: "var(--paper)", text: "var(--ink)" };
            const isTarget = node.id === data.target_transaction;
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                  onNodeClick?.(node);
                }}
                style={{ cursor: "pointer" }}
                className="group"
              >
                {/* Glow ring for target transaction or selected node */}
                {(isTarget || isSelected) && (
                  <circle
                    r={28}
                    fill={isTarget ? "var(--sun-yellow)" : "var(--hot-pink)"}
                    opacity="0.3"
                    className="animate-pulse"
                  />
                )}

                {/* Node Solid Circle */}
                <circle
                  r={20}
                  fill={styling.bg}
                  stroke="var(--ink)"
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-110 drop-shadow-xs"
                />

                {/* Node Type Monogram */}
                <text
                  textAnchor="middle"
                  dy={4.5}
                  fill={styling.text}
                  fontSize={9}
                  fontWeight={900}
                  fontFamily="var(--font-mono)"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.type.slice(0, 3).toUpperCase()}
                </text>

                {/* Node ID Label Pill Below */}
                <g transform="translate(0, 30)">
                  <rect
                    x="-40"
                    y="-8"
                    width="80"
                    height="16"
                    rx="3"
                    fill="var(--paper)"
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                  />
                  <text
                    textAnchor="middle"
                    dy={3.5}
                    fill="var(--ink)"
                    fontSize={8.5}
                    fontWeight={700}
                    fontFamily="var(--font-mono)"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {node.id.length > 12 ? node.id.slice(0, 10) + "…" : node.id}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Details Floating Overlay */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 bg-sand p-3.5 rounded-lg border-2 border-ink shadow-md max-w-sm z-20 select-text">
          <div className="flex items-center justify-between gap-2 border-b-2 border-ink pb-1.5 mb-2">
            <span className="font-mono text-xs font-black text-ink uppercase tracking-wide">
              [{selectedNode.type}] {selectedNode.id}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-ink hover:text-hot-pink font-bold text-sm leading-none px-1"
            >
              ✕
            </button>
          </div>

          <div className="max-h-32 overflow-y-auto text-xs font-mono space-y-1 pr-1">
            {Object.entries(selectedNode.attributes).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-ink/70 font-semibold">{k}:</span>
                <span className="text-ink font-bold break-all">
                  {typeof v === "boolean" ? (v ? "true" : "false") : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from "react";
import type { SubgraphData, GraphNode } from "../types";
import { ZoomIn, ZoomOut, Maximize2, Layers } from "lucide-react";

interface GraphViewerProps {
  data: SubgraphData | null;
  onNodeClick?: (node: GraphNode) => void;
  height?: string | number;
}

const NODE_COLORS: Record<string, string> = {
  Transaction: "var(--accent-rose)", // #f43f5e
  Customer: "var(--accent-cyan)",     // #00f2fe
  Account: "#3b82f6",                 // Blue
  Device: "var(--accent-amber)",      // #f59e0b
  IP: "#a855f7",                      // Purple
  Card: "var(--accent-emerald)",      // #10b981
  Merchant: "#ec4899",                // Pink
  Case: "#e11d48",                    // Crimson
  FraudPattern: "#ff0055"             // Neon Red
};

export const GraphViewer: React.FC<GraphViewerProps> = ({ data, onNodeClick, height = "100%" }) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Compute node coordinates around central target transaction
  const positionedNodes = useMemo(() => {
    if (!data || !data.nodes || data.nodes.length === 0) return [];

    const nodes = [...data.nodes];
    const centerNode = nodes.find((n) => n.id === data.target_transaction) || nodes[0];
    const centerX = 350;
    const centerY = 240;

    const positioned: GraphNode[] = [];
    positioned.push({ ...centerNode, x: centerX, y: centerY });

    const otherNodes = nodes.filter((n) => n.id !== centerNode.id);
    const radius = Math.min(180, 50 + otherNodes.length * 15);
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    otherNodes.forEach((node, i) => {
      const angle = i * angleStep;
      positioned.push({
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
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
      <div className="graph-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", height }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <Layers size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
          <p>No active graph data loaded. Select a case to inspect TigerGraph neighborhood.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="graph-container"
      style={{ height, cursor: isDragging ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom / Pan toolbar */}
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 10 }}>
        <button
          className="btn-secondary"
          style={{ padding: "6px 8px" }}
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          className="btn-secondary"
          style={{ padding: "6px 8px" }}
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          className="btn-secondary"
          style={{ padding: "6px 8px" }}
          onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
          title="Reset View"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* SVG Canvas */}
      <svg width="100%" height="100%">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {data.edges.map((e, idx) => {
            const src = nodeMap.get(e.source);
            const tgt = nodeMap.get(e.target);
            if (!src || !tgt || src.x == null || src.y == null || tgt.x == null || tgt.y == null) return null;

            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="rgba(107, 114, 128, 0.4)"
                  strokeWidth={1.5}
                />
                <text
                  x={midX}
                  y={midY - 4}
                  fill="var(--text-muted)"
                  fontSize={8}
                  textAnchor="middle"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {e.type}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {positionedNodes.map((node) => {
            const color = NODE_COLORS[node.type] || "#9ca3af";
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
              >
                {/* Glow ring for selected or target transaction */}
                {(isTarget || isSelected) && (
                  <circle
                    r={26}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.8}
                    strokeDasharray={isTarget ? "4 3" : undefined}
                  />
                )}
                <circle
                  r={18}
                  fill="#111827"
                  stroke={color}
                  strokeWidth={2.5}
                />
                <text
                  textAnchor="middle"
                  dy={4}
                  fill="#ffffff"
                  fontSize={8}
                  fontWeight={700}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.type.slice(0, 3).toUpperCase()}
                </text>
                <text
                  textAnchor="middle"
                  dy={30}
                  fill="var(--text-secondary)"
                  fontSize={9}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Details Floating Overlay */}
      {selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            background: "rgba(10, 14, 23, 0.95)",
            border: "1px solid var(--accent-cyan)",
            borderRadius: 0,
            padding: "10px 14px",
            fontSize: "0.78rem",
            maxWidth: 340,
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="font-mono" style={{ fontWeight: 700, color: NODE_COLORS[selectedNode.type] || "#fff", letterSpacing: "0.04em" }}>
              [{selectedNode.type.toUpperCase()}] {selectedNode.id}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
            >
              ✕
            </button>
          </div>
          <div style={{ maxHeight: 120, overflowY: "auto" }}>
            {Object.entries(selectedNode.attributes).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 2 }}>
                <span style={{ color: "var(--text-muted)" }}>{k}:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500, wordBreak: "break-all" }}>
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

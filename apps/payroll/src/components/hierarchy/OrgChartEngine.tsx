"use client";
import React, { useMemo, useState, useCallback } from "react";
import * as d3h from "d3-hierarchy";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { ChevronDown, ChevronRight, Building2, Minus, Plus, RotateCcw } from "lucide-react";
import { OrgNode, getAncestorIds, getDescendantIds } from "@/lib/orgChartUtils";
import { CompanyInfo } from "@/hooks/useOrgChart";

// ─── Layout constants ─────────────────────────────────────────────────────────
const NODE_W  = 200;
const NODE_H  = 80;
const ROOT_W  = 240;
const ROOT_H  = 72;
const HEAD_H  = 116;   // banner (~36px) + card (~80px)
const GAP_X   = 36;
const GAP_Y   = 72;

// ─── Brand blue ──────────────────────────────────────────────────────────────
const BLUE    = "#007AFF";
const BLUE_DK = "#0062CC";

// ─── Bezier edge ─────────────────────────────────────────────────────────────
function bezierPath(sx: number, sy: number, tx: number, ty: number) {
  const midY = (sy + ty) / 2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
}

// ─── Status colour ────────────────────────────────────────────────────────────
function statusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "active":   return "#22c55e";
    case "inactive": return "#ef4444";
    default:         return "#f59e0b";
  }
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
import { getAvatarColor as getUniversalAvatarColor, getInitials } from "@/utils/avatarColor";
function avatarBg(name: string) {
  return getUniversalAvatarColor(name).solid;
}

// ─── Zoom controls ─────────────────────────────────────────────────────────────
function ZoomControlsInner() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-5 right-5 flex flex-col gap-1.5 z-50">
      <button onClick={() => zoomIn()}
        className="w-8 h-8 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-[8px] shadow text-gray-600 dark:text-gray-300 flex items-center justify-center hover:border-[#007AFF] hover:text-[#007AFF] transition-all">
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => zoomOut()}
        className="w-8 h-8 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-[8px] shadow text-gray-600 dark:text-gray-300 flex items-center justify-center hover:border-[#007AFF] hover:text-[#007AFF] transition-all">
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => resetTransform()}
        className="w-8 h-8 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-[8px] shadow text-gray-600 dark:text-gray-300 flex items-center justify-center hover:border-[#007AFF] hover:text-[#007AFF] transition-all">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Prune collapsed subtrees ─────────────────────────────────────────────────
function pruneTree(node: OrgNode, collapsed: Set<string>): OrgNode {
  if (collapsed.has(node.id)) return { ...node, children: [] };
  return { ...node, children: (node.children ?? []).map(c => pruneTree(c, collapsed)) };
}

// ─── Company Root Card ────────────────────────────────────────────────────────
function CompanyRootCard({
  company, x, y, hasChildren, isCollapsed, onToggle,
}: {
  company: CompanyInfo; x: number; y: number;
  hasChildren: boolean; isCollapsed: boolean; onToggle: () => void;
}) {
  return (
    <div style={{ position: "absolute", left: x - ROOT_W / 2, top: y, width: ROOT_W, height: ROOT_H }}>
      <div
        className="relative w-full h-full rounded-[24px] flex items-center gap-3.5 px-4 shadow-[0_12px_32px_-8px_rgba(0,122,255,0.4)]"
        style={{ background: `linear-gradient(135deg, #154694 0%, #007AFF 100%)` }}
      >
        {/* Logo */}
        <div className="w-[44px] h-[44px] shrink-0 rounded-[12px] overflow-hidden bg-black/20 border border-white/10 flex items-center justify-center p-0.5">
          {company.logo
            ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-[8px]" />
            : <Building2 className="w-5 h-5 text-white" />
          }
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.1em] leading-none mb-1">Organization</p>
          <p className="text-[16px] font-extrabold text-white truncate leading-tight tracking-tight">{company.name}</p>
        </div>
        {/* Collapse button */}
        {hasChildren && (
          <button
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-[#007AFF] z-10 hover:scale-110 transition-transform"
            onClick={onToggle}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 ml-[0.5px]" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Department Head Card: dark banner + white card ───────────────────────────
function DeptHeadCard({
  node, isSelected, isHighlighted, sx, sy,
  hasChildren, isCollapsed, onToggle, onClick,
}: {
  node: OrgNode; isSelected: boolean; isHighlighted: boolean;
  sx: number; sy: number;
  hasChildren: boolean; isCollapsed: boolean;
  onToggle: () => void; onClick: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: sx - NODE_W / 2, top: sy, width: NODE_W,
        opacity: isHighlighted ? 1 : 0.28,
        transition: "opacity 0.2s, transform 0.15s",
        transform: isSelected ? "translateY(-2px)" : "none",
      }}
      onClick={onClick}
      className="flex flex-col cursor-pointer select-none drop-shadow-sm"
    >
      {/* Department banner */}
      <div
        className="w-[calc(100%-4px)] mx-auto text-white text-center py-2.5 px-3 rounded-t-[14px] text-[13px] font-bold tracking-wide relative translate-y-[10px] z-0 z-[1]"
        style={{ backgroundColor: "#1e3a5f" }}
      >
        {node.department || "Department"}
      </div>

      {/* Employee card */}
      <div className={`relative z-[2] w-full bg-white dark:bg-[#1C1C1E] rounded-[20px] py-3.5 px-4 flex items-center gap-3.5
        border-[2.5px] border-[#007AFF]
        shadow-[0_8px_20px_-6px_rgba(0,122,255,0.15)]
      `}>
        {/* Avatar */}
        <div
          className="w-[50px] h-[50px] shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-[18px] border-[2.5px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          style={{ backgroundColor: node.avatar ? "transparent" : avatarBg(node.name) }}
        >
          {node.avatar ? <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" /> : getInitials(node.name)}
        </div>
        
        {/* Name + Role */}
        <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
          <p className="text-[14px] font-bold text-[#1e293b] dark:text-white truncate w-full">{node.name}</p>
          <span
            className="inline-flex px-2.5 py-[3px] rounded-full text-[9px] font-extrabold text-white uppercase tracking-wider leading-none"
            style={{ backgroundColor: BLUE }}
          >
            {node.role}
          </span>
        </div>

        {/* Status dot */}
        <div className="absolute top-[8px] right-[10px] w-2 h-2 rounded-full ring-2 ring-white" style={{ backgroundColor: statusColor(node.status) }} />
      </div>

      {/* Collapse toggle */}
      {hasChildren && (
        <button
          className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-[#1C1C1E] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-400 hover:text-[#007AFF] z-10 transition-colors"
          onClick={e => { e.stopPropagation(); onToggle(); }}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

// ─── Regular Employee Card ────────────────────────────────────────────────────
function EmployeeCard({
  node, isSelected, isHighlighted, sx, sy,
  hasChildren, isCollapsed, onToggle, onClick,
}: {
  node: OrgNode; isSelected: boolean; isHighlighted: boolean;
  sx: number; sy: number;
  hasChildren: boolean; isCollapsed: boolean;
  onToggle: () => void; onClick: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: sx - NODE_W / 2, top: sy, width: NODE_W, height: NODE_H,
        opacity: isHighlighted ? 1 : 0.28,
        transition: "opacity 0.2s, transform 0.15s",
        transform: isSelected ? "translateY(-2px)" : "none",
      }}
      onClick={onClick}
    >
      <div className={`relative w-full h-full rounded-[14px] bg-white dark:bg-[#1C1C1E] flex items-center gap-2.5 px-3 cursor-pointer select-none
        border-2 ${isSelected ? "border-[#007AFF] shadow-[0_0_0_3px_rgba(0,122,255,0.15)]" : "border-gray-100 dark:border-gray-800 shadow-sm"}
        hover:border-[#007AFF]/40 hover:shadow-md transition-all
      `}>
        {/* Avatar */}
        <div
          className="w-[42px] h-[42px] shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-[14px] border-2 border-white dark:border-gray-800 shadow-sm"
          style={{ backgroundColor: node.avatar ? "transparent" : avatarBg(node.name) }}
        >
          {node.avatar ? <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" /> : getInitials(node.name)}
        </div>
        {/* Name + Role only */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate leading-tight">{node.name}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 capitalize">{node.role.toLowerCase()}</p>
        </div>
        {/* Status dot */}
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor(node.status) }} />
        {/* Collapse toggle */}
        {hasChildren && (
          <button
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 shadow flex items-center justify-center text-gray-500 hover:text-[#007AFF] z-10 transition-colors"
            onClick={e => { e.stopPropagation(); onToggle(); }}
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Fallback company info ─────────────────────────────────────────────────────
const VIRTUAL_COMPANY: CompanyInfo = { name: "Organization", logo: null };

// ─── OrgChartEngine ───────────────────────────────────────────────────────────
interface OrgChartEngineProps {
  root: OrgNode;
  company?: CompanyInfo | null;
  onSelectNode?: (node: OrgNode) => void;
}

export default function OrgChartEngine({ root, company, onSelectNode }: OrgChartEngineProps) {
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const companyInfo = company ?? VIRTUAL_COMPANY;

  const syntheticRoot: OrgNode = useMemo(() => ({
    id: "__company__",
    name: companyInfo.name,
    role: "",
    department: "",
    avatar: companyInfo.logo,
    status: "active",
    manager_id: null,
    children: root.id === "__virtual_root__" ? (root.children ?? []) : [root],
  }), [root, companyInfo]);

  const { nodes, links, width, height } = useMemo(() => {
    const pruned  = pruneTree(syntheticRoot, collapsed);
    const hier    = d3h.hierarchy<OrgNode>(pruned, d => d.children ?? []);
    const layout  = d3h
      .tree<OrgNode>()
      .nodeSize([NODE_W + GAP_X, NODE_H + GAP_Y])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.3));

    const computed = layout(hier);
    const all      = computed.descendants();
    const edges    = computed.links();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of all) {
      const nw = n.data.id === "__company__" ? ROOT_W : NODE_W;
      const nh = n.data.id === "__company__" ? ROOT_H : (n.data.isHead ? HEAD_H : NODE_H);
      minX = Math.min(minX, n.x - nw / 2);
      maxX = Math.max(maxX, n.x + nw / 2);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + nh);
    }

    const PAD  = 80;
    const offX = -minX + PAD;
    const offY = -minY + PAD;

    return {
      nodes: all.map(n => ({ ...n, px: n.x + offX, py: n.y + offY })),
      links: edges.map(l => {
        const srcNh = l.source.data.id === "__company__" ? ROOT_H : (l.source.data.isHead ? HEAD_H : NODE_H);
        return {
          id: `${l.source.data.id}-${l.target.data.id}`,
          srcId: l.source.data.id,
          tgtId: l.target.data.id,
          sx: (l.source as any).x + offX,
          sy: (l.source as any).y + offY + srcNh,
          tx: (l.target as any).x + offX,
          ty: (l.target as any).y + offY,
        };
      }),
      width:  maxX - minX + PAD * 2,
      height: maxY - minY + PAD * 2,
    };
  }, [syntheticRoot, collapsed]);

  const { ancestorIds, descendantIds } = useMemo(() => {
    if (!hoveredId) return { ancestorIds: new Set<string>(), descendantIds: new Set<string>() };
    const targetNode = nodes.find(n => n.data.id === hoveredId)?.data;
    return {
      ancestorIds:   getAncestorIds(syntheticRoot, hoveredId),
      descendantIds: targetNode ? getDescendantIds(targetNode) : new Set<string>(),
    };
  }, [hoveredId, nodes, syntheticRoot]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const isHighlighted = (id: string) =>
    hoveredId === null || id === hoveredId || ancestorIds.has(id) || descendantIds.has(id);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[linear-gradient(160deg,#f0f5ff_0%,#f8faff_60%,#eef2ff_100%)] dark:bg-[linear-gradient(160deg,#0a0a0f_0%,#121217_60%,#0a0a0f_100%)]"
      onMouseLeave={() => setHoveredId(null)}
    >
      <TransformWrapper
        initialScale={0.8} minScale={0.1} maxScale={2.5}
        centerOnInit limitToBounds={false}
        panning={{ velocityDisabled: false }}
        wheel={{ step: 0.08 }}
      >
        <>
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width, height, position: "relative" }}
          >
            {/* ── SVG edges ─────────────────────────────────────── */}
            <svg style={{ position: "absolute", top: 0, left: 0, width, height, pointerEvents: "none", overflow: "visible" }}>
              {links.map(l => {
                const hi = hoveredId === null || (isHighlighted(l.srcId) && isHighlighted(l.tgtId));
                return (
                  <path
                    key={l.id}
                    d={bezierPath(l.sx, l.sy, l.tx, l.ty)}
                    fill="none"
                    className={hi ? "stroke-[#007AFF] dark:stroke-[#0A84FF]" : "stroke-[#c7d7f5] dark:stroke-[#2E323A]"}
                    strokeWidth={hi && hoveredId !== null ? 2 : 1.5}
                    strokeOpacity={hi ? 0.85 : 0.3}
                    style={{ transition: "stroke 0.2s, stroke-opacity 0.2s" }}
                  />
                );
              })}
            </svg>

            {/* ── Node cards ────────────────────────────────────── */}
            {nodes.map(n => {
              const node       = n.data;
              const px         = (n as any).px as number;
              const py         = (n as any).py as number;
              const isCol       = collapsed.has(node.id);
              // IMPORTANT: pruneTree empties children when collapsed, so check isCol too
              // otherwise the expand button disappears and there's no way to re-open
              const hasChildren = isCol || (node.children?.length ?? 0) > 0;

              const isSel      = selectedId === node.id;
              const hi         = isHighlighted(node.id);

              if (node.id === "__company__") {
                return (
                  <div key={node.id}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ opacity: hi ? 1 : 0.28, transition: "opacity 0.2s" }}
                  >
                    <CompanyRootCard
                      company={companyInfo} x={px} y={py}
                      hasChildren={hasChildren} isCollapsed={isCol}
                      onToggle={() => toggleCollapse(node.id)}
                    />
                  </div>
                );
              }

              const commonProps = {
                node, isSelected: isSel, isHighlighted: hi,
                sx: px, sy: py,
                hasChildren, isCollapsed: isCol,
                onToggle: () => toggleCollapse(node.id),
                onClick:  () => { setSelectedId(node.id); onSelectNode?.(node); },
              };

              return (
                <div key={node.id}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {node.isHead
                    ? <DeptHeadCard {...commonProps} />
                    : <EmployeeCard {...commonProps} />
                  }
                </div>
              );
            })}
          </TransformComponent>

          <ZoomControlsInner />
        </>
      </TransformWrapper>
    </div>
  );
}

"use client";
import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { OrgMember } from "@/app/(dashboard)/hierarchy/data";

/* ─── CSS org-tree connectors ────────────────────────────────────────────
   Classic CSS-only horizontal-connector approach.
   Works for any depth / any number of children.
────────────────────────────────────────────────────────────────────────── */
const treeStyles = `
/* ── shared reset ───────────────────────────────── */
.org-tree, .org-tree * { box-sizing: border-box; }

/* ── row of siblings ────────────────────────────── */
.org-tree ul {
  display: flex;
  justify-content: center;
  padding-top: 28px;
  position: relative;
}

/* ── each node <li> ─────────────────────────────── */
.org-tree li {
  list-style: none;
  text-align: center;
  position: relative;
  padding: 28px 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all .3s;
}

/* ── connector bar across siblings ──────────────── */
.org-tree li::before,
.org-tree li::after {
  content: '';
  position: absolute;
  top: 0;
  width: 50%; height: 28px;
  border-top: 2px solid #c8cdd7;
}
.org-tree li::before { right: 50%; border-right: none; }
.org-tree li::after  { left: 50%;  border-left:  none; }

/* ── hide half-lines on edge siblings ───────────── */
.org-tree li:first-child::before,
.org-tree li:last-child::after  { display: none; }

/* ── solo child: no horizontal bar at all ────────── */
.org-tree li:only-child {
  padding-top: 0;
}
.org-tree li:only-child::before,
.org-tree li:only-child::after  { display: none; }

/* ── vertical drop from parent ───────────────────── */
.org-tree ul::before {
  content: '';
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  width: 2px; height: 28px;
  background: #c8cdd7;
}

/* dark mode variants */
.dark .org-tree li::before,
.dark .org-tree li::after  { border-top-color:  #3f3f46; }
.dark .org-tree ul::before { background: #3f3f46; }
`;

/* ─── NodeCard ──────────────────────────────────────────────────────────── */
function NodeCard({
  node,
  isActive,
  onDblClick,
}: {
  node: OrgMember;
  isActive: boolean;
  onDblClick: (n: OrgMember) => void;
}) {
  return (
    <div
      className="flex flex-col items-center group relative cursor-pointer"
      onDoubleClick={(e) => { e.stopPropagation(); onDblClick(node); }}
    >
      {node.departmentLabel && (
        <div className="bg-[#464D5B] dark:bg-[#2C3038] text-white px-10 py-2.5 rounded-t-[12px] text-[15px] font-semibold tracking-wide w-[240px] shadow-sm translate-y-0.5 z-0">
          {node.departmentLabel}
        </div>
      )}
      <div
        className={`relative z-10 w-[240px] bg-white dark:bg-[#1C1C1E] border ${
          isActive
            ? "border-[#1FC6A4] shadow-[0_8px_30px_rgba(31,198,164,0.3)] ring-4 ring-[#1FC6A4]/20"
            : "border-gray-200 dark:border-gray-800 shadow-sm"
        } rounded-[16px] p-4 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-lg duration-200`}
      >
        <div className="w-[50px] h-[50px] shrink-0 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#2C3038] shadow-sm flex items-center justify-center">
          {node.avatar
            ? <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" />
            : <div className="text-gray-400 font-bold">{node.name.charAt(0)}</div>
          }
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className={`text-[13px] font-bold truncate ${
            isActive
              ? "text-gray-900 dark:text-white"
              : "text-[#464D5B] dark:text-[#A1A1AA] group-hover:text-gray-900 dark:group-hover:text-white"
          }`}>
            {node.name}
          </h3>
          <div className="mt-1">
            <span
              className="inline-block px-3 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-sm"
              style={{ backgroundColor: node.badgeColor }}
            >
              {node.role}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-500 font-medium truncate">{node.location}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── OrgTreeRecursive ──────────────────────────────────────────────────── */
function OrgTreeRecursive({
  node,
  activeNodeId,
  onDblClick,
}: {
  node: OrgMember;
  activeNodeId?: string;
  onDblClick: (n: OrgMember) => void;
}) {
  // merge staffList into children so they use the same CSS connector system
  const allChildren = [
    ...(node.children ?? []),
    ...(node.staffList ?? []),
  ];

  return (
    <li>
      <NodeCard node={node} isActive={node.id === activeNodeId} onDblClick={onDblClick} />
      {allChildren.length > 0 && (
        <ul>
          {allChildren.map((child) => (
            <OrgTreeRecursive
              key={child.id}
              node={child}
              activeNodeId={activeNodeId}
              onDblClick={onDblClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ─── OrgChartViewer ────────────────────────────────────────────────────── */
export default function OrgChartViewer({
  data,
  activeNodeId,
  onNodeDoubleClick,
  onZoomChange,
}: {
  data: OrgMember;
  activeNodeId?: string;
  onNodeDoubleClick: (n: OrgMember) => void;
  onZoomChange: (z: number) => void;
}) {
  return (
    <>
      <style>{treeStyles}</style>
      <TransformWrapper
        initialScale={0.8}
        minScale={0.1}
        maxScale={2.5}
        centerOnInit
        limitToBounds={false}
        panning={{ velocityDisabled: false }}
        onZoom={(ref) => onZoomChange(ref.state.scale)}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="p-[120px] min-w-max min-h-max">
            <div className="org-tree">
              <ul>
                <OrgTreeRecursive
                  node={data}
                  activeNodeId={activeNodeId}
                  onDblClick={onNodeDoubleClick}
                />
              </ul>
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  Check,
  X,
  Layers,
  Eye,
  RotateCcw,
  Download,
  Type,
  Image as ImageIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Toggle component
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? "bg-[#007AFF] dark:bg-white" : "bg-[#E5E5EA] dark:bg-[#3A3A3C]"}`}
    >
      <span
        className={`inline-block transform rounded-full bg-white dark:bg-black shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Types
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
type SectionType = "header" | "employee_info" | "earnings" | "deductions" | "net_pay" | "footer" | "divider" | "custom_text";

interface TemplateSection {
  id: string;
  type: SectionType;
  label: string;
  visible: boolean;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  fontSize: number;
  color: string;
  bgColor: string;
  content?: string; // for custom_text
}

const DEFAULT_SECTIONS: TemplateSection[] = [
  { id: "s1", type: "header", label: "Company Header", visible: true, align: "center", bold: true, italic: false, fontSize: 16, color: "#111827", bgColor: "#F8F9FA", content: "" },
  { id: "s2", type: "employee_info", label: "Employee Information", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s3", type: "earnings", label: "Earnings Breakdown", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s4", type: "deductions", label: "Deductions", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "" },
  { id: "s5", type: "net_pay", label: "Net Pay Summary", visible: true, align: "right", bold: true, italic: false, fontSize: 15, color: "#007AFF", bgColor: "#EFF6FF", content: "" },
  { id: "s6", type: "divider", label: "Divider Line", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#E5E7EB", bgColor: "#FFFFFF", content: "" },
  { id: "s7", type: "footer", label: "Footer & Signature", visible: true, align: "center", bold: false, italic: true, fontSize: 11, color: "#9CA3AF", bgColor: "#FFFFFF", content: "" },
];

const SECTION_PREVIEWS: Record<SectionType, (s: TemplateSection, logo?: string, address?: string, footer?: string) => React.ReactNode> = {
  header: (s, logo, address) => (
    <div style={{ textAlign: s.align, background: s.bgColor, padding: "16px 24px", borderBottom: "2px solid #E5E7EB" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: s.align === "center" ? "center" : s.align === "right" ? "flex-end" : "flex-start" }}>
        {logo && <img src={logo} alt="logo" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }} />}
        <div>
          <div style={{ fontWeight: 700, fontSize: s.fontSize, color: s.color, fontStyle: s.italic ? "italic" : "normal" }}>Acme Corp Pte. Ltd.</div>
          <div style={{ fontSize: 10, color: "#6B7280" }}>{address || "123 Business St, Singapore 123456"}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginTop: 8, letterSpacing: 1 }}>PAYSLIP Ã¢â‚¬â€ JUNE 2025</div>
    </div>
  ),
  employee_info: (s) => (
    <div style={{ background: s.bgColor, padding: "12px 24px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>EMPLOYEE DETAILS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
        {[["Employee Name", "John Doe"], ["Employee ID", "EMP-0042"], ["Department", "Engineering"], ["Designation", "Senior Engineer"], ["Pay Period", "01Ã¢â‚¬â€œ30 June 2025"], ["Bank Account", "Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢7890"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: s.fontSize - 1, color: s.color, paddingBottom: 2 }}>
            <span style={{ color: "#9CA3AF" }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  ),
  earnings: (s) => (
    <div style={{ background: s.bgColor, padding: "12px 24px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>EARNINGS</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: s.fontSize - 1 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
            <th style={{ textAlign: "left", padding: "4px 0", color: "#6B7280", fontWeight: 600 }}>Component</th>
            <th style={{ textAlign: "right", padding: "4px 0", color: "#6B7280", fontWeight: 600 }}>Amount (SGD)</th>
          </tr>
        </thead>
        <tbody>
          {[["Basic Salary", "5,000.00"], ["Variable Allowance", "500.00"], ["Transport Allowance", "200.00"]].map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid #F9FAFB" }}>
              <td style={{ padding: "3px 0", color: s.color }}>{k}</td>
              <td style={{ padding: "3px 0", textAlign: "right", color: s.color }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  deductions: (s) => (
    <div style={{ background: s.bgColor, padding: "12px 24px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, marginBottom: 8 }}>DEDUCTIONS</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: s.fontSize - 1 }}>
        <tbody>
          {[["Employee CPF", "Ã¢Ë†â€™900.00"], ["CDAC Levy", "Ã¢Ë†â€™2.00"], ["Late Deductions", "Ã¢Ë†â€™50.00"]].map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid #F9FAFB" }}>
              <td style={{ padding: "3px 0", color: s.color }}>{k}</td>
              <td style={{ padding: "3px 0", textAlign: "right", color: "#EF4444" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  net_pay: (s) => (
    <div style={{ background: s.bgColor, padding: "12px 24px", borderRadius: 8, margin: "0 16px", textAlign: s.align }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: 1, marginBottom: 4 }}>NET PAY</div>
      <div style={{ fontSize: s.fontSize + 6, fontWeight: 800, color: s.color }}>SGD 4,748.00</div>
      <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>Credited to Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢7890 on 28 Jun 2025</div>
    </div>
  ),
  divider: (s) => (
    <div style={{ padding: "4px 24px", background: s.bgColor }}>
      <div style={{ height: 1, background: s.color }} />
    </div>
  ),
  footer: (s, _l, _a, footer) => (
    <div style={{ background: s.bgColor, padding: "12px 24px", textAlign: s.align }}>
      <div style={{ fontSize: s.fontSize, color: s.color, fontStyle: s.italic ? "italic" : "normal" }}>
        {footer || "This is a computer-generated payslip. No signature required unless requested."}
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: s.align === "center" ? "center" : s.align === "right" ? "flex-end" : "flex-start", gap: 32 }}>
        <div style={{ fontSize: 10, textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ width: 80, height: 1, background: "#D1D5DB", marginBottom: 4 }} />
          <div>Authorized Signatory</div>
          <div style={{ fontWeight: 600, color: "#374151" }}>Finance Director</div>
        </div>
      </div>
    </div>
  ),
  custom_text: (s) => (
    <div style={{ background: s.bgColor, padding: "10px 24px", textAlign: s.align, fontSize: s.fontSize, color: s.color, fontWeight: s.bold ? 700 : 400, fontStyle: s.italic ? "italic" : "normal" }}>
      {s.content || "Custom text block Ã¢â‚¬â€ click Edit to change."}
    </div>
  ),
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Frame size constants
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const FRAME_SIZES = {
  "a4-portrait":  { width: 794,  height: 1123, label: "A4 Portrait",  dpi96: "794 Ãƒâ€” 1123 px",  dpi300: "2480 Ãƒâ€” 3508 px" },
  "a4-landscape": { width: 1123, height: 794,  label: "A4 Landscape", dpi96: "1123 Ãƒâ€” 794 px", dpi300: "3508 Ãƒâ€” 2480 px" },
} as const;

type FrameKey = keyof typeof FRAME_SIZES;

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Payslip Canvas Editor (Full-screen modal)
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function PayslipCanvasEditor({
  open,
  onClose,
  initialSections,
  onSave,
  payslipLogo,
  payslipAddress,
  payslipFooter,
  selectedTheme,
}: {
  open: boolean;
  onClose: () => void;
  initialSections: TemplateSection[];
  onSave: (sections: TemplateSection[]) => void;
  payslipLogo: string;
  payslipAddress: string;
  payslipFooter: string;
  selectedTheme: string;
}) {
  const [sections, setSections] = useState<TemplateSection[]>(initialSections);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSrcId = useRef<string | null>(null);

  // Canvas / Frame state
  const [zoom, setZoom] = useState(65);
  const [frameSize, setFrameSize] = useState<FrameKey>("a4-portrait");
  const [showGrid, setShowGrid] = useState(false);
  const [margins] = useState({ top: 40, right: 40, bottom: 40, left: 40 });
  const [canvasBg, setCanvasBg] = useState("#FFFFFF");
  const [marginColor, setMarginColor] = useState("#FF5050");

  useEffect(() => {
    if (open) {
      setSections(initialSections);
      setSelectedId(null);
    }
  }, [open]);

  const selected = sections.find((s) => s.id === selectedId);
  const frame = FRAME_SIZES[frameSize];
  const scaledW = frame.width  * (zoom / 100);
  const scaledH = frame.height * (zoom / 100);

  const updateSection = (id: string, patch: Partial<TemplateSection>) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const moveUp = (id: string) =>
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });

  const moveDown = (id: string) =>
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      return arr;
    });

  const addCustomText = () => {
    const id = `ct_${Date.now()}`;
    setSections((prev) => [
      ...prev,
      { id, type: "custom_text", label: "Custom Text", visible: true, align: "left", bold: false, italic: false, fontSize: 13, color: "#374151", bgColor: "#FFFFFF", content: "Enter your text hereÃ¢â‚¬Â¦" },
    ]);
    setSelectedId(id);
  };

  const deleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS.map((s) => ({ ...s })));
    setSelectedId(null);
  };

  const onDragStart = (id: string) => { dragSrcId.current = id; };
  const onDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const onDrop = (targetId: string) => {
    const srcId = dragSrcId.current;
    if (!srcId || srcId === targetId) { setDragOverId(null); return; }
    setSections((prev) => {
      const arr = [...prev];
      const si = arr.findIndex((s) => s.id === srcId);
      const ti = arr.findIndex((s) => s.id === targetId);
      const [item] = arr.splice(si, 1);
      arr.splice(ti, 0, item);
      return arr;
    });
    setDragOverId(null);
    dragSrcId.current = null;
  };

  const handleExport = () => {
    const content = document.getElementById("payslip-canvas-frame");
    if (!content) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Payslip</title>
<style>
  body { margin:0; padding:0; background:white; }
  @page { size: ${frameSize === "a4-portrait" ? "A4 portrait" : "A4 landscape"}; margin:0; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body>${content.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payslip.html"; a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  const PRESET_COLORS = ["#FFFFFF", "#F8F9FA", "#FFF9F0", "#F0F7FF", "#F0FFF4", "#F5F3FF"];
  const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F0F2F5] text-gray-900">
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ TOP BAR Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-gray-200 bg-white flex-shrink-0 h-12">
        {/* Left: title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-gray-900 leading-tight">Payslip Template Editor</p>
            <p className="text-[10px] text-gray-400 font-medium leading-none">{frame.label} Ã‚Â· {frame.dpi96}</p>
          </div>
        </div>

        {/* Center: Zoom controls */}
        <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg px-1 py-0.5">
          <button
            onClick={() => setZoom((z) => Math.max(25, z - 25))}
            disabled={zoom <= 25}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition-all disabled:opacity-30 font-bold text-[13px]"
          >Ã¢Ë†â€™</button>
          <div className="relative group">
            <span className="text-[12px] font-bold text-gray-700 w-11 text-center block cursor-pointer select-none">{zoom}%</span>
            {/* Zoom preset dropdown */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1 hidden group-hover:block z-10 min-w-[80px]">
              {ZOOM_PRESETS.map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`w-full px-3 py-1 text-[12px] font-semibold text-left transition-colors ${zoom === z ? "text-[#007AFF] bg-[#007AFF]/5" : "text-gray-600 hover:bg-gray-50"}`}
                >{z}%</button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
            disabled={zoom >= 200}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition-all disabled:opacity-30 font-bold text-[13px]"
          >+</button>
          <div className="w-px h-4 bg-gray-300 mx-0.5" />
          <button
            onClick={() => setZoom(100)}
            className="px-2 h-6 flex items-center justify-center rounded-md text-[11px] font-bold text-gray-500 hover:bg-white hover:text-gray-900 transition-all"
          >1:1</button>
          <button
            onClick={() => setZoom(65)}
            className="px-2 h-6 flex items-center justify-center rounded-md text-[11px] font-bold text-gray-500 hover:bg-white hover:text-gray-900 transition-all"
          >Fit</button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreviewMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${previewMode ? "bg-[#007AFF]/10 border-[#007AFF]/20 text-[#007AFF]" : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            <Eye className="w-3.5 h-3.5" />
            {previewMode ? "Editing" : "Preview"}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={() => { onSave(sections); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Save Template
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* â”€â”€ LEFT: Layers panel (Figma-style dark) â”€â”€ */}
        {!previewMode && (
          <div className="w-56 flex-shrink-0 border-r border-[#2A2A3A] flex flex-col" style={{ background: "#1C1C28" }}>
            <div className="px-3 py-2.5 border-b border-[#2A2A3A] flex items-center justify-between flex-shrink-0">
              <p className="text-[11px] font-bold text-[#6B6B8A] uppercase tracking-widest">Layers</p>
              <button
                onClick={addCustomText}
                className="w-5 h-5 flex items-center justify-center rounded text-[#6B6B8A] hover:text-white hover:bg-[#2A2A3A] transition-all"
                title="Add text layer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {sections.map((sec) => {
                const isSelected = selectedId === sec.id;
                const isDragTarget = dragOverId === sec.id;
                const typeInfo: Record<string, { icon: string; color: string }> = {
                  company_header:  { icon: "#", color: "#5B8AF5" },
                  employee_info:   { icon: "#", color: "#5B8AF5" },
                  earnings_table:  { icon: "#", color: "#F5A623" },
                  deductions_table:{ icon: "#", color: "#F5A623" },
                  net_pay:         { icon: "#", color: "#4CD964" },
                  divider:         { icon: "â€”", color: "#8E8EA0" },
                  footer:          { icon: "#", color: "#5B8AF5" },
                  custom_text:     { icon: "T", color: "#FF6B9D" },
                };
                const ti = typeInfo[sec.type] ?? { icon: "#", color: "#5B8AF5" };
                return (
                  <div
                    key={sec.id}
                    draggable
                    onDragStart={() => onDragStart(sec.id)}
                    onDragOver={(e) => onDragOver(e, sec.id)}
                    onDrop={() => onDrop(sec.id)}
                    onClick={() => setSelectedId(sec.id === selectedId ? null : sec.id)}
                    className="flex items-center gap-0 cursor-pointer select-none group relative"
                    style={{
                      background: isSelected ? "rgba(91,138,245,0.15)" : isDragTarget ? "rgba(255,255,255,0.05)" : "transparent",
                      borderLeft: isSelected ? "2px solid #5B8AF5" : "2px solid transparent",
                      opacity: sec.visible ? 1 : 0.38,
                    }}
                  >
                    <div className="w-5 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-2.5 h-2.5 text-[#5A5A72] cursor-grab" />
                    </div>
                    <span
                      className="w-5 text-center text-[11px] font-bold flex-shrink-0 select-none leading-none"
                      style={{ color: ti.color, fontFamily: ti.icon === "T" ? "serif" : "monospace" }}
                    >
                      {ti.icon}
                    </span>
                    <span
                      className="flex-1 text-[12px] font-medium truncate py-[7px] pr-2"
                      style={{ color: isSelected ? "#FFFFFF" : "#C8C8E0" }}
                    >
                      {sec.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateSection(sec.id, { visible: !sec.visible }); }}
                      className="w-7 h-7 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={sec.visible ? "Hide" : "Show"}
                    >
                      <Eye className="w-3 h-3" style={{ color: sec.visible ? "#5B8AF5" : "#4A4A60" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-auto flex items-start justify-center p-10 bg-[#E8EAED]"
          style={{ backgroundImage: "radial-gradient(circle, #d0d3d8 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          <div
            style={{ width: scaledW, height: scaledH, flexShrink: 0, position: "relative" }}
          >
            <div
              id="payslip-canvas-frame"
              style={{
                width: frame.width,
                height: frame.height,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
                background: canvasBg,
                boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
                fontFamily:
                  selectedTheme === "modern"
                    ? "'Inter', sans-serif"
                    : selectedTheme === "minimalist"
                    ? "'Courier New', monospace"
                    : "Georgia, serif",
              }}
            >
              {showGrid && (
                <div
                  style={{
                    position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
                    backgroundImage:
                      "linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
              )}

              {!previewMode && (() => {
                const r = parseInt(marginColor.slice(1,3),16);
                const g = parseInt(marginColor.slice(3,5),16);
                const b = parseInt(marginColor.slice(5,7),16);
                return (
                  <>
                    <div
                      style={{
                        position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none",
                        boxShadow: `inset 0 ${margins.top}px rgba(${r},${g},${b},0.10), inset 0 -${margins.bottom}px rgba(${r},${g},${b},0.10), inset ${margins.left}px 0 rgba(${r},${g},${b},0.10), inset -${margins.right}px 0 rgba(${r},${g},${b},0.10)`,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: margins.top, left: margins.left,
                        right: margins.right, bottom: margins.bottom,
                        zIndex: 9, pointerEvents: "none",
                        border: `1px dashed rgba(${r},${g},${b},0.45)`,
                        borderRadius: 2,
                      }}
                    />
                  </>
                );
              })()}

              <div
                style={{
                  paddingTop: margins.top,
                  paddingRight: margins.right,
                  paddingBottom: margins.bottom,
                  paddingLeft: margins.left,
                  minHeight: "100%",
                  boxSizing: "border-box",
                }}
              >
                {sections
                  .filter((s) => s.visible)
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedId(s.id); }}
                      className={!previewMode ? "cursor-pointer" : ""}
                      style={{
                        outline: !previewMode && selectedId === s.id ? "2px solid #007AFF" : !previewMode ? "1px solid transparent" : "none",
                        outlineOffset: -1,
                        transition: "outline 0.1s",
                      }}
                    >
                      {SECTION_PREVIEWS[s.type]?.(s, payslipLogo, payslipAddress, payslipFooter)}
                    </div>
                  ))}
              </div>
            </div>

            {!previewMode && (
              <div
                style={{
                  position: "absolute",
                  top: scaledH + 8,
                  left: 0,
                  width: scaledW,
                  textAlign: "center",
                }}
              >
                <span className="text-[11px] font-semibold text-gray-400 select-none">{frame.label} Â· {frame.dpi96}</span>
              </div>
            )}
          </div>
        </div>

        {!previewMode && (
          <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
            {selected ? (
              <>
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedId(null)}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Properties</p>
                  </div>
                  {selected.type === "custom_text" && (
                    <button onClick={() => deleteSection(selected.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Label</p>
                    <input
                      value={selected.label}
                      onChange={(e) => updateSection(selected.id, { label: e.target.value })}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:bg-white focus:ring-1 focus:ring-[#007AFF]/10"
                    />
                  </div>

                  {selected.type === "custom_text" && (
                    <div className="p-4 flex flex-col gap-1.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Content</p>
                      <textarea
                        value={selected.content || ""}
                        onChange={(e) => updateSection(selected.id, { content: e.target.value })}
                        rows={3}
                        className="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:bg-white resize-none"
                      />
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Alignment</p>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                      {(["left", "center", "right"] as const).map((a) => (
                        <button
                          key={a}
                          onClick={() => updateSection(selected.id, { align: a })}
                          className={`flex-1 py-2 flex items-center justify-center transition-all ${selected.align === a ? "bg-[#007AFF] text-white" : "text-gray-400 hover:bg-gray-50"}`}
                        >
                          {a === "left" ? <AlignLeft className="w-3.5 h-3.5" /> : a === "center" ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Style</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSection(selected.id, { bold: !selected.bold })}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center border transition-all font-bold ${selected.bold ? "bg-[#007AFF]/10 border-[#007AFF]/30 text-[#007AFF]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateSection(selected.id, { italic: !selected.italic })}
                        className={`flex-1 py-2 rounded-lg flex items-center justify-center border transition-all ${selected.italic ? "bg-[#007AFF]/10 border-[#007AFF]/30 text-[#007AFF]" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Font Size</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSection(selected.id, { fontSize: Math.max(8, selected.fontSize - 1) })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all text-[15px] font-bold"
                      >âˆ’</button>
                      <div className="flex-1 text-center text-[13px] font-bold text-gray-900">{selected.fontSize}px</div>
                      <button
                        onClick={() => updateSection(selected.id, { fontSize: Math.min(36, selected.fontSize + 1) })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all text-[15px] font-bold"
                      >+</button>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Text Colour</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selected.color} onChange={(e) => updateSection(selected.id, { color: e.target.value })} className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                      <input value={selected.color} onChange={(e) => updateSection(selected.id, { color: e.target.value })} className="flex-1 bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-900 font-mono focus:outline-none focus:border-[#007AFF]" />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Background</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selected.bgColor} onChange={(e) => updateSection(selected.id, { bgColor: e.target.value })} className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                      <input value={selected.bgColor} onChange={(e) => updateSection(selected.id, { bgColor: e.target.value })} className="flex-1 bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-900 font-mono focus:outline-none focus:border-[#007AFF]" />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Order</p>
                    <div className="flex gap-2">
                      <button onClick={() => moveUp(selected.id)} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-[12px] font-semibold">
                        <ChevronUp className="w-3.5 h-3.5" /> Up
                      </button>
                      <button onClick={() => moveDown(selected.id)} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-[12px] font-semibold">
                        <ChevronDown className="w-3.5 h-3.5" /> Down
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-gray-700">Visible</span>
                    <Toggle on={selected.visible} onChange={() => updateSection(selected.id, { visible: !selected.visible })} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Design</p>
                </div>
                <div className="flex flex-col divide-y divide-gray-100">

                  <div className="p-4 flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-gray-800">Frame</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(FRAME_SIZES) as FrameKey[]).map((fk) => {
                        const fd = FRAME_SIZES[fk];
                        const isPortrait = fk === "a4-portrait";
                        return (
                          <button
                            key={fk}
                            onClick={() => setFrameSize(fk)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                              frameSize === fk
                                ? "bg-[#007AFF]/8 border-[#007AFF]/40 text-[#007AFF]"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            <div
                              className={`rounded-sm border-2 flex-shrink-0 ${frameSize === fk ? "border-[#007AFF]" : "border-gray-400"}`}
                              style={{ width: isPortrait ? 16 : 22, height: isPortrait ? 22 : 16 }}
                            />
                            <p className="text-[11px] font-bold leading-tight">{fd.label}</p>
                            <p className={`text-[9px] font-medium leading-none ${frameSize === fk ? "text-[#007AFF]/70" : "text-gray-400"}`}>
                              {fd.dpi96}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-semibold">96 DPI (Screen)</span>
                        <span className="text-[10px] font-bold text-gray-700">{frame.dpi96}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-semibold">300 DPI (Print)</span>
                        <span className="text-[10px] font-bold text-gray-700">{frame.dpi300}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">Layout Grid</p>
                      <p className="text-[10px] text-gray-400 font-medium">24px grid overlay</p>
                    </div>
                    <Toggle on={showGrid} onChange={() => setShowGrid(!showGrid)} />
                  </div>

                  {/* Margin Colour */}
                  <div className="p-4 flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-gray-800">Margin Colour</p>
                    <p className="text-[10px] text-gray-400 font-medium">Colour of the margin guide overlay</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={marginColor}
                        onChange={(e) => setMarginColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                      />
                      <input
                        value={marginColor}
                        onChange={(e) => setMarginColor(e.target.value)}
                        className="flex-1 bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-900 font-mono focus:outline-none focus:border-[#007AFF] focus:bg-white"
                        maxLength={7}
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["#FF5050", "#FF9500", "#34C759", "#007AFF", "#AF52DE", "#FF2D55"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setMarginColor(c)}
                          title={c}
                          style={{ background: c }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${marginColor === c ? "border-gray-900 scale-110" : "border-white hover:scale-105 hover:border-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[11px] font-bold text-gray-800">Content Width</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Available: {frame.width - margins.left - margins.right}px
                    </p>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-[#F8F9FA] focus-within:border-[#007AFF]">
                      <input
                        type="number"
                        value={frame.width - margins.left - margins.right}
                        disabled
                        className="w-full px-3 py-2 text-[12px] font-bold text-gray-500 bg-transparent focus:outline-none text-right cursor-not-allowed"
                      />
                      <span className="text-[10px] text-gray-400 font-medium pr-3 flex-shrink-0">px</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Adjust via Left / Right margins Ã¢â€ â€˜</p>
                  </div>

                  {/* Padding */}
                  <div className="p-4 flex flex-col gap-1.5">
                    <p className="text-[11px] font-bold text-gray-800">Padding</p>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-[#F8F9FA]">
                      <input
                        type="number"
                        value={margins.top}
                        disabled
                        className="w-full px-3 py-2 text-[12px] font-bold text-gray-500 bg-transparent focus:outline-none text-right cursor-not-allowed"
                      />
                      <span className="text-[10px] text-gray-400 font-medium pr-3 flex-shrink-0">px</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Fixed at 40px (all sides)</p>
                  </div>

                  {/* Colour */}
                  <div className="p-4 flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-gray-800">Colour</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={canvasBg}
                        onChange={(e) => setCanvasBg(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                      />
                      <input
                        value={canvasBg}
                        onChange={(e) => setCanvasBg(e.target.value)}
                        className="flex-1 bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-900 font-mono focus:outline-none focus:border-[#007AFF] focus:bg-white"
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["#FFFFFF", "#F8F9FA", "#FFF9F0", "#F0F7FF", "#F0FFF4", "#F5F3FF"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setCanvasBg(c)}
                          title={c}
                          style={{ background: c }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${canvasBg === c ? "border-[#007AFF] scale-110" : "border-gray-200 hover:scale-105 hover:border-gray-400"}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Export */}
                  <div className="p-4 flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-gray-800">Export</p>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-[12px] font-bold hover:bg-gray-700 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export as HTML
                    </button>
                    <p className="text-[10px] text-gray-400 text-center font-medium">Opens as print-ready HTML file</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Main Page
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export default function PayslipSettingsPage({ setActive }: { setActive?: (s: string) => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [userId, setUserId] = useState("");
  const [existingConfig, setExistingConfig] = useState<any>({});

  const [payslipLogo, setPayslipLogo] = useState("");
  const [payslipAddress, setPayslipAddress] = useState("");
  const [payslipFooter, setPayslipFooter] = useState("");
  const [showCPF, setShowCPF] = useState(true);
  const [showTax, setShowTax] = useState(true);
  const [signatureName, setSignatureName] = useState("");
  const [signatureRole, setSignatureRole] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [templateSections, setTemplateSections] = useState<TemplateSection[]>(DEFAULT_SECTIONS.map((s) => ({ ...s })));
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: comp } = await supabase
        .from("company_settings")
        .select("attendance_config, logo_url")
        .eq("company_id", user.id)
        .maybeSingle();

      if (comp) {
        setExistingConfig(comp.attendance_config || {});
        const pConfig = comp.attendance_config?.payroll_config || {};

        setPayslipLogo(pConfig.payslipLogo || comp.logo_url || "");
        setPayslipAddress(pConfig.payslipAddress || "");
        setPayslipFooter(pConfig.payslipFooter || "");
        setShowCPF(pConfig.showCPF ?? true);
        setShowTax(pConfig.showTax ?? true);
        setSignatureName(pConfig.signatureName || "");
        setSignatureRole(pConfig.signatureRole || "");
        setSignatureUrl(pConfig.signatureUrl || "");
        setSelectedTheme(pConfig.selectedTheme || "classic");

        if (pConfig.templateSections && Array.isArray(pConfig.templateSections)) {
          setTemplateSections(pConfig.templateSections);
        }
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const newPayrollConfig = {
        ...(existingConfig.payroll_config || {}),
        payslipLogo,
        payslipAddress,
        payslipFooter,
        showCPF,
        showTax,
        signatureName,
        signatureRole,
        signatureUrl,
        selectedTheme,
        templateSections,
      };

      const updatedAttendanceConfig = {
        ...existingConfig,
        payroll_config: newPayrollConfig,
      };

      const { error } = await supabase
        .from("company_settings")
        .update({ attendance_config: updatedAttendanceConfig })
        .eq("company_id", userId);

      if (error) throw error;
      setExistingConfig(updatedAttendanceConfig);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Error saving payslip settings:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: csRow } = await supabase
        .from("company_settings")
        .select("company_name")
        .eq("company_id", userId)
        .maybeSingle();
      const companySlug = (csRow?.company_name || userId)
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const fileExt = file.name.split(".").pop() || "jpg";
      const path = `Payroll_Settings/${companySlug}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("public_assets")
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("public_assets").getPublicUrl(path);
      const url = urlData.publicUrl;

      if (type === "logo") setPayslipLogo(url);
      else setSignatureUrl(url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Canvas editor modal */}
      <PayslipCanvasEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialSections={templateSections}
        onSave={(sections) => setTemplateSections(sections)}
        payslipLogo={payslipLogo}
        payslipAddress={payslipAddress}
        payslipFooter={payslipFooter}
        selectedTheme={selectedTheme}
      />

      <div className="flex flex-col w-full max-w-4xl animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() =>
              setActive ? setActive("admin_payroll") : (window.location.href = "/settings?tab=admin_payroll")
            }
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight">Payslip Settings</h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Configure visual layout and content for generated employee payslips
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121217] rounded-[24px] border border-[#E5E7EB] dark:border-[#2C2C35] p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
            <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">Document Appearance</h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Company Logo and Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Payslip Logo</label>
                <div className="flex items-center gap-4">
                  {payslipLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={payslipLogo} alt="Payslip Logo" className="w-14 h-14 object-contain rounded-xl bg-white border border-gray-200" />
                  ) : (
                    <div className="w-14 h-14 object-contain rounded-xl bg-[#F8F9FA] dark:bg-white/5 flex items-center justify-center text-gray-400 text-[10px]">No Logo</div>
                  )}
                  <label className="cursor-pointer bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 text-[12px] font-bold px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "logo")} />
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Company Address on Payslip</label>
                <textarea
                  value={payslipAddress}
                  onChange={(e) => setPayslipAddress(e.target.value)}
                  placeholder="123 Financial Way, Suite 400, Singapore"
                  rows={2}
                  className="w-full px-4 py-3 bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[14px] text-gray-900 dark:text-white font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Footer Notes</label>
              <input
                type="text"
                value={payslipFooter}
                onChange={(e) => setPayslipFooter(e.target.value)}
                placeholder="This is a computer generated payslip, signature not required unless requested."
                className="w-full px-4 py-3 bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[14px] text-gray-900 dark:text-white font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all"
              />
            </div>

            {/* Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between py-1 pr-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Show CPF Breakdown</p>
                  <p className="text-[12px] text-gray-500">Show detailed Employee and Employer CPF shares</p>
                </div>
                <Toggle on={showCPF} onChange={() => setShowCPF(!showCPF)} />
              </div>

              <div className="flex items-center justify-between py-1 pr-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Show Tax Breakdown</p>
                  <p className="text-[12px] text-gray-500">Show foreign worker levy or withholding tax lines</p>
                </div>
                <Toggle on={showTax} onChange={() => setShowTax(!showTax)} />
              </div>
            </div>

            {/* Template Theme Selector + Edit Template */}
            <div className="flex flex-col gap-4 pt-6 border-t border-gray-100 dark:border-white/5 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-gray-900 dark:text-white">Payslip Template</p>
                <button
                  onClick={() => setEditorOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF]/10 dark:bg-[#007AFF]/15 text-[#007AFF] text-[12px] font-bold border border-[#007AFF]/20 hover:bg-[#007AFF]/20 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Edit Template
                </button>
              </div>

              {/* Default Themes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: "classic", name: "Classic", desc: "Traditional corporate layout with structured tables" },
                  { id: "modern", name: "Modern", desc: "Clean modern layout with bold accents and clear sections" },
                  { id: "minimalist", name: "Minimalist", desc: "High density simple design with minimal borders" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTheme(t.id)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      selectedTheme === t.id
                        ? "bg-blue-500/5 border-[#007AFF] text-[#007AFF]"
                        : "bg-[#F8F9FA] dark:bg-[#121217] border-[#E5E7EB] dark:border-[#2C2C35] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white"
                    }`}
                  >
                    {/* Mini payslip preview thumbnail */}
                    <div className="w-full h-16 rounded-lg overflow-hidden mb-3 border border-gray-100 dark:border-white/5 bg-white relative">
                      <div
                        className="absolute inset-0 flex flex-col"
                        style={{
                          fontFamily: t.id === "modern" ? "Inter, sans-serif" : t.id === "minimalist" ? "monospace" : "Georgia, serif",
                        }}
                      >
                        <div className={`h-4 flex items-center px-2 ${t.id === "minimalist" ? "bg-gray-100" : t.id === "modern" ? "bg-[#007AFF]" : "bg-gray-800"}`}>
                          <div className="w-2 h-2 rounded-full bg-white opacity-80 mr-1" />
                          <div className="h-1 bg-white opacity-60 rounded flex-1" />
                        </div>
                        <div className="flex-1 p-1.5 flex flex-col gap-1">
                          <div className="h-1 bg-gray-200 rounded w-3/4" />
                          <div className="h-1 bg-gray-100 rounded w-1/2" />
                          <div className="h-1 bg-gray-200 rounded w-5/6" />
                          <div className={`h-1.5 rounded w-2/3 mt-auto ${t.id === "modern" ? "bg-[#007AFF]/30" : "bg-gray-300"}`} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] font-bold leading-tight">{t.name}</p>
                    <p className={`text-[11px] mt-1 font-medium ${selectedTheme === t.id ? "text-blue-500/70" : "text-gray-400"}`}>{t.desc}</p>
                  </button>
                ))}
              </div>

              {/* Edit template hint */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-white/3 rounded-xl border border-gray-100 dark:border-white/5">
                <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-[12px] text-gray-500 font-medium">
                  Click <span className="font-bold text-gray-700 dark:text-gray-300">Edit Template</span> to open the canvas editor Ã¢â‚¬â€ rearrange sections, change colors, typography, and add custom text blocks.
                </p>
              </div>
            </div>

            {/* Digital Signature */}
            <div className="flex flex-col gap-4 pt-6 border-t border-gray-100 dark:border-white/5 mt-2">
              <p className="text-[14px] font-bold text-gray-900 dark:text-white">Authorized Digital Signature</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Signature Image</label>
                  <div className="flex items-center gap-4">
                    {signatureUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={signatureUrl} alt="Signature" className="w-20 h-10 object-contain rounded-lg bg-white border border-gray-200" />
                    ) : (
                      <div className="w-20 h-10 rounded-lg bg-[#F8F9FA] dark:bg-white/5 flex items-center justify-center text-gray-400 text-[10px]">No signature</div>
                    )}
                    <label className="cursor-pointer bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "signature")} />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Signatory Name</label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Dinesh V C"
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13px] text-gray-900 dark:text-white font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Signatory Role</label>
                  <input
                    type="text"
                    value={signatureRole}
                    onChange={(e) => setSignatureRole(e.target.value)}
                    placeholder="Finance Director"
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[12px] text-[13px] text-gray-900 dark:text-white font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/5 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[14px] transition-all ${
                saveStatus === "success"
                  ? "bg-[#34C759] text-white"
                  : saveStatus === "error"
                  ? "bg-red-500 text-white"
                  : "bg-[#007AFF] text-white hover:bg-blue-600 active:scale-95"
              }`}
            >
              {saving ? (
                <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> SavingÃ¢â‚¬Â¦</>
              ) : saveStatus === "success" ? (
                <><Check className="h-4 w-4" /> Saved!</>
              ) : saveStatus === "error" ? (
                "Error Ã¢â‚¬â€ try again"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

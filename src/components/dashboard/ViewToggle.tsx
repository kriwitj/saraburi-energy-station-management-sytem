"use client";

import { LayoutGrid, Table } from "lucide-react";

interface ViewToggleProps {
  view: "grid" | "table";
  onChange: (v: "grid" | "table") => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex rounded-xl p-1"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <button
        id="view-grid"
        onClick={() => onChange("grid")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-target"
        style={{
          background: view === "grid" ? "rgba(14, 165, 233, 0.2)" : "transparent",
          color: view === "grid" ? "#0ea5e9" : "#64748b",
        }}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">การ์ด</span>
      </button>
      <button
        id="view-table"
        onClick={() => onChange("table")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-target"
        style={{
          background: view === "table" ? "rgba(14, 165, 233, 0.2)" : "transparent",
          color: view === "table" ? "#0ea5e9" : "#64748b",
        }}
      >
        <Table className="w-4 h-4" />
        <span className="hidden sm:inline">ตาราง</span>
      </button>
    </div>
  );
}

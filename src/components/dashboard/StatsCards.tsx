import { Fuel, Zap, Flame, Wind, LayoutGrid } from "lucide-react";
import type { StatsData } from "@/types/station";

interface StatsCardsProps {
  stats: StatsData;
}

const cards = [
  {
    key: "total" as const,
    label: "สถานีทั้งหมด",
    icon: LayoutGrid,
    iconBg: "rgba(14, 165, 233, 0.1)",
    iconColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  {
    key: "oil" as const,
    label: "น้ำมัน (OIL)",
    icon: Fuel,
    iconBg: "rgba(59, 130, 246, 0.1)",
    iconColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  {
    key: "lpg" as const,
    label: "ก๊าซ (LPG)",
    icon: Flame,
    iconBg: "rgba(249, 115, 22, 0.1)",
    iconColor: "#f97316",
    borderColor: "#f97316",
  },
  {
    key: "ngv" as const,
    label: "NGV",
    icon: Wind,
    iconBg: "rgba(139, 92, 246, 0.1)",
    iconColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },
  {
    key: "ev" as const,
    label: "EV Charger",
    icon: Zap,
    iconBg: "rgba(34, 197, 94, 0.1)",
    iconColor: "#22c55e",
    borderColor: "#22c55e",
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map(({ key, label, icon: Icon, iconBg, iconColor, borderColor }) => (
        <div
          key={key}
          className="bg-white p-4 rounded-xl shadow-sm border-l-4 flex items-center justify-between transition-all hover:shadow-md border-t border-r border-b border-slate-200"
          style={{ borderLeftColor: borderColor }}
        >
          <div>
            <div className="text-2xl font-bold text-slate-800 mb-0.5">
              {stats[key].toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {label}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: iconBg }}
          >
            <Icon className="w-5.5 h-5.5" style={{ color: iconColor }} />
          </div>
        </div>
      ))}
    </div>
  );
}

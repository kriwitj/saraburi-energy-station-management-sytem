"use client";

import { Search, SlidersHorizontal, X, Zap } from "lucide-react";
import { AMPHOE_LIST, ENERGY_TYPE_CONFIG } from "@/lib/constants";
import type { EnergyTypeKey } from "@/lib/constants";

export interface SearchFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  amphoe: string;
  onAmphoeChange: (v: string) => void;
  energyType: string;
  onEnergyTypeChange: (v: string) => void;
  chargerType?: string;
  onChargerTypeChange?: (v: string) => void;
  energyTypes: { id: string; name: string; icon: string; map_color: string }[];
  chargerTypes?: { id: string; name: string }[];
}

export default function SearchFilterBar({
  search,
  onSearchChange,
  amphoe,
  onAmphoeChange,
  energyType,
  onEnergyTypeChange,
  chargerType = "",
  onChargerTypeChange,
  energyTypes,
  chargerTypes = [],
}: SearchFilterBarProps) {
  const hasFilters = search || amphoe || energyType || chargerType;

  function clearAll() {
    onSearchChange("");
    onAmphoeChange("");
    onEnergyTypeChange("");
    if (onChargerTypeChange) {
      onChargerTypeChange("");
    }
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        />
        <input
          id="station-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาชื่อสถานี, ตำบล, รายละเอียด..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <SlidersHorizontal className="w-4 h-4 flex-shrink-0 text-slate-400" />

        {/* Amphoe Select */}
        <select
          id="amphoe-filter"
          value={amphoe}
          onChange={(e) => onAmphoeChange(e.target.value)}
          className="text-xs py-2 px-3 bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm"
        >
          <option value="">ทุกอำเภอ</option>
          {AMPHOE_LIST.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>

        {/* Energy Type Badges */}
        <div className="flex flex-wrap gap-1.5">
          {energyTypes.length > 0
            ? energyTypes.map((et) => {
                const isActive = energyType === et.id;
                return (
                  <button
                    key={et.id}
                    onClick={() => onEnergyTypeChange(isActive ? "" : et.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all touch-target"
                    style={{
                      background: isActive ? `${et.map_color}22` : "rgba(255, 255, 255, 0.8)",
                      color: isActive ? et.map_color : "#475569",
                      border: isActive ? `1px solid ${et.map_color}66` : "1px solid #cbd5e1",
                    }}
                  >
                    <span>{et.icon}</span>
                    {et.name}
                  </button>
                );
              })
            : (Object.keys(ENERGY_TYPE_CONFIG) as EnergyTypeKey[]).map((type) => {
                const config = ENERGY_TYPE_CONFIG[type];
                const isActive = energyType === type;
                return (
                  <button
                    key={type}
                    id={`filter-energy-${type}`}
                    onClick={() => onEnergyTypeChange(isActive ? "" : type)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all touch-target"
                    style={{
                      background: isActive ? `${config.mapColor}22` : "rgba(255, 255, 255, 0.8)",
                      color: isActive ? config.mapColor : "#475569",
                      border: isActive ? `1px solid ${config.mapColor}66` : "1px solid #cbd5e1",
                    }}
                  >
                    <span>{config.icon}</span>
                    {config.label}
                  </button>
                );
              })}
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors touch-target"
            style={{ color: "#94a3b8" }}
          >
            <X className="w-3 h-3" />
            ล้าง
          </button>
        )}
      </div>

      {/* EV Charger Type Sub-filter */}
      {energyType === "EV" && chargerTypes.length > 0 && onChargerTypeChange && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-6 border-t border-slate-100 animate-fadeIn">
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3" /> ประเภทหัวชาร์จ:
          </span>
          <button
            onClick={() => onChargerTypeChange("")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              !chargerType
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ทั้งหมด
          </button>
          {chargerTypes.map((ct) => {
            const isSelected = chargerType === ct.name || chargerType === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => onChargerTypeChange(isSelected ? "" : ct.name)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                ⚡ {ct.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

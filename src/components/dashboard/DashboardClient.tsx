"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import type { Station, StatsData } from "@/types/station";
import type { Amphoe } from "@prisma/client";
import StatsCards from "@/components/dashboard/StatsCards";
import SearchFilterBar from "@/components/dashboard/SearchFilterBar";
import ViewToggle from "@/components/dashboard/ViewToggle";
import StationGrid from "@/components/dashboard/StationGrid";
import StationTable from "@/components/dashboard/StationTable";
import { StationCardSkeleton, StatCardSkeleton } from "@/components/shared/LoadingSkeleton";

interface DashboardClientProps {
  userRole: string;
}

export default function DashboardClient({ userRole }: DashboardClientProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState("");
  const [amphoe, setAmphoe] = useState("");
  const [energyType, setEnergyType] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  async function downloadAllData() {
    try {
      const res = await fetch("/api/public/stations");
      const json = await res.json();
      const data = json.data || [];
      
      const headers = ["ID", "ชื่อสถานี (Name)", "ประเภทสถานี (Type)", "แบรนด์ (Brand)", "ประเภทพลังงาน (Energy)", "ตำบล (Tambon)", "อำเภอ (Amphoe)", "ละติจูด (Latitude)", "ลองจิจูด (Longitude)", "รายละเอียด (Details)", "จุดสังเกต/คำอธิบายเส้นทาง (Address Details)"];
      const csvRows = [headers.join(",")];
      
      for (const item of data) {
        const values = [
          `"${item.id}"`,
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.station_type?.name || ''}"`,
          `"${item.brand?.name || ''}"`,
          `"${item.energy_types.join(', ')}"`,
          `"${item.tambon.replace(/"/g, '""')}"`,
          `"${item.amphoe.replace(/"/g, '""')}"`,
          item.latitude,
          item.longitude,
          `"${(item.details || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(item.address_details || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];
        csvRows.push(values.join(","));
      }
      
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `saraburi-energy-stations-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลดข้อมูล CSV สำเร็จ");
    } catch (err) {
      console.error(err);
      toast.error("ดาวน์โหลดข้อมูลล้มเหลว");
    }
  }

  const [energyTypes, setEnergyTypes] = useState<{ id: string; name: string; icon: string; map_color: string }[]>([]);

  useEffect(() => {
    async function loadEts() {
      try {
        const res = await fetch("/api/energy-types");
        const data = await res.json();
        if (data.data) setEnergyTypes(data.data);
      } catch (err) {
        console.error("Failed to load energy types in dashboard:", err);
      }
    }
    loadEts();
  }, []);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(amphoe && { amphoe }),
        ...(energyType && { energy_type: energyType }),
      });
      const res = await fetch(`/api/stations?${params}`);
      const data = await res.json();
      setStations(data.data || []);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, [search, amphoe, energyType, page]);

  useEffect(() => {
    const timer = setTimeout(fetchStations, 300);
    return () => clearTimeout(timer);
  }, [fetchStations]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, amphoe, energyType]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            สถานีพลังงาน{" "}
            <span className="gradient-text font-black">จ.สระบุรี</span>
          </h1>
          <p className="text-xs mt-0.5 text-slate-500 font-medium">
            ระบบจัดการสารสนเทศครอบคลุม 13 อำเภอ
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadAllData}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all touch-target bg-white border border-slate-200 text-slate-600 hover:text-slate-800 shadow-sm text-xs font-bold"
            title="ดาวน์โหลดข้อมูลทั้งหมด (CSV)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ดาวน์โหลด CSV</span>
          </button>
          <button
            onClick={fetchStations}
            className="p-2.5 rounded-xl transition-all touch-target bg-white border border-slate-200 text-slate-600 hover:text-slate-800 shadow-sm"
            title="รีโหลด"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {userRole !== "VIEWER" && (
            <Link
              href="/stations/new"
              id="add-station-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white touch-target shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสถานี</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          amphoe={amphoe}
          onAmphoeChange={setAmphoe}
          energyType={energyType}
          onEnergyTypeChange={setEnergyType}
          energyTypes={energyTypes}
        />

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500">
            {loading ? "กำลังโหลด..." : `แสดง ${stations.length} จาก ${total} สถานี`}
          </p>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StationCardSkeleton key={i} />)}
        </div>
      ) : view === "grid" ? (
        <StationGrid stations={stations} userRole={userRole} onRefresh={fetchStations} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <StationTable stations={stations} userRole={userRole} onRefresh={fetchStations} />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3.5 py-2 rounded-xl text-xs font-bold touch-target disabled:opacity-40 transition-all bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50"
          >
            ก่อนหน้า
          </button>
          <span className="text-xs font-bold text-slate-500">
            หน้า {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3.5 py-2 rounded-xl text-xs font-bold touch-target disabled:opacity-40 transition-all bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}

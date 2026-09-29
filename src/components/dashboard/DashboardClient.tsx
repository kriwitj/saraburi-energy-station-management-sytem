"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Download, ChevronDown, FileSpreadsheet, Zap } from "lucide-react";
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
  const [chargerType, setChargerType] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function downloadCsvFile(csvRows: string[], filename: string) {
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 1. ตารางรวมสถานี (Power BI & Excel Master Flat Table) — พร้อม Flags และสรุป EV
  async function downloadPowerBiMaster() {
    try {
      const res = await fetch("/api/public/stations");
      const json = await res.json();
      const data = json.data || [];

      const headers = [
        "Station_ID",
        "ชื่อสถานี (Station_Name)",
        "แบรนด์ (Brand)",
        "ประเภทสถานี (Station_Type)",
        "ตำบล (Tambon)",
        "อำเภอ (Amphoe)",
        "จังหวัด (Province)",
        "ละติจูด (Latitude)",
        "ลองจิจูด (Longitude)",
        "มี_น้ำมัน (Has_OIL)",
        "มี_LPG (Has_LPG)",
        "มี_NGV (Has_NGV)",
        "มี_EV_Charger (Has_EV)",
        "ประเภทพลังงานทั้งหมด (Energy_Types)",
        "จำนวนตู้ชาร์จ_ตู้ (Total_Charger_Units)",
        "จำนวนหัวจ่ายชาร์จ_หัว (Total_Plugs)",
        "กำลังจ่ายไฟฟ้ารวม_kW (Total_Power_kW)",
        "กำลังไฟสูงสุดของสถานี_kW (Max_Power_kW)",
        "สรุปรายละเอียดหัวชาร์จ (Chargers_Summary)",
        "จุดสังเกต_ที่อยู่ (Address_Details)",
        "รายละเอียด (Details)",
        "วันที่บันทึกข้อมูล (Created_Date)",
        "วันที่แก้ไขล่าสุด (Updated_Date)",
      ];

      const csvRows = [headers.join(",")];

      for (const item of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chargers = item.chargers || [];
        const hasOil = item.energy_types?.includes("OIL") ? 1 : 0;
        const hasLpg = item.energy_types?.includes("LPG") ? 1 : 0;
        const hasNgv = item.energy_types?.includes("NGV") ? 1 : 0;
        const hasEv = item.has_ev_charger || item.energy_types?.includes("EV") ? 1 : 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalPlugs = chargers.reduce((sum: number, c: any) => sum + (Number(c.plug_count) || 0), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalPowerKw = chargers.reduce((sum: number, c: any) => sum + ((Number(c.power_kw) || 0) * (Number(c.plug_count) || 1)), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maxPowerKw = chargers.reduce((max: number, c: any) => Math.max(max, Number(c.power_kw) || 0), 0);

        const chargerSummary = chargers.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? chargers.map((c: any) => `${c.charger_type} ${c.power_kw}kW (${c.plug_count} หัว)`).join(" | ")
          : (hasEv ? "มีตู้ชาร์จ EV" : "-");

        const values = [
          `"${item.id}"`,
          `"${(item.name || "").replace(/"/g, '""')}"`,
          `"${(item.brand?.name || "").replace(/"/g, '""')}"`,
          `"${(item.station_type?.name || "").replace(/"/g, '""')}"`,
          `"${(item.tambon || "").replace(/"/g, '""')}"`,
          `"${(item.amphoe || "").replace(/"/g, '""')}"`,
          `"สระบุรี"`,
          item.latitude,
          item.longitude,
          hasOil,
          hasLpg,
          hasNgv,
          hasEv,
          `"${(item.energy_types || []).join(", ")}"`,
          chargers.length,
          totalPlugs,
          totalPowerKw,
          maxPowerKw,
          `"${chargerSummary.replace(/"/g, '""')}"`,
          `"${(item.address_details || "").replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`,
          `"${(item.details || "").replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`,
          `"${item.created_at ? item.created_at.slice(0, 10) : ""}"`,
          `"${item.updated_at ? item.updated_at.slice(0, 10) : ""}"`,
        ];

        csvRows.push(values.join(","));
      }

      downloadCsvFile(csvRows, `saraburi-energy-powerbi-master-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("ดาวน์โหลดตารางสรุปสำหรับ Power BI & Excel สำเร็จ");
    } catch (err) {
      console.error(err);
      toast.error("ดาวน์โหลดข้อมูลล้มเหลว");
    }
  }

  // 2. ตารางรายละเอียดหัวชาร์จ EV (Fact Table สำหรับวิเคราะห์เชิงลึกระดับหัวจ่าย)
  async function downloadEvChargersFact() {
    try {
      const res = await fetch("/api/public/stations");
      const json = await res.json();
      const data = json.data || [];

      const headers = [
        "Station_ID",
        "ชื่อสถานี (Station_Name)",
        "แบรนด์ (Brand)",
        "ตำบล (Tambon)",
        "อำเภอ (Amphoe)",
        "จังหวัด (Province)",
        "ละติจูด (Latitude)",
        "ลองจิจูด (Longitude)",
        "ประเภทหัวชาร์จ (Charger_Type)",
        "กำลังไฟฟ้าต่อหัว_kW (Power_kW)",
        "จำนวนหัวจ่าย (Plug_Count)",
        "กำลังไฟฟ้ารวมตู้_kW (Total_Cabinet_Power_kW)",
      ];

      const csvRows = [headers.join(",")];
      let rowCount = 0;

      for (const item of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chargers = item.chargers || [];
        if (chargers.length === 0) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const c of chargers) {
          const powerKw = Number(c.power_kw) || 0;
          const plugCount = Number(c.plug_count) || 0;
          const totalKw = powerKw * (plugCount || 1);

          const values = [
            `"${item.id}"`,
            `"${(item.name || "").replace(/"/g, '""')}"`,
            `"${(item.brand?.name || "").replace(/"/g, '""')}"`,
            `"${(item.tambon || "").replace(/"/g, '""')}"`,
            `"${(item.amphoe || "").replace(/"/g, '""')}"`,
            `"สระบุรี"`,
            item.latitude,
            item.longitude,
            `"${(c.charger_type || "").replace(/"/g, '""')}"`,
            powerKw,
            plugCount,
            totalKw,
          ];

          csvRows.push(values.join(","));
          rowCount++;
        }
      }

      if (rowCount === 0) {
        toast.info("ยังไม่มีข้อมูลหัวชาร์จ EV ในระบบ");
        return;
      }

      downloadCsvFile(csvRows, `saraburi-ev-chargers-fact-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`ดาวน์โหลดข้อมูลหัวชาร์จ EV (${rowCount} รายการ) สำเร็จ`);
    } catch (err) {
      console.error(err);
      toast.error("ดาวน์โหลดข้อมูลล้มเหลว");
    }
  }

  const [energyTypes, setEnergyTypes] = useState<{ id: string; name: string; icon: string; map_color: string }[]>([]);
  const [chargerTypes, setChargerTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [etsRes, ctsRes] = await Promise.all([
          fetch("/api/energy-types"),
          fetch("/api/charger-types"),
        ]);
        const [etsData, ctsData] = await Promise.all([etsRes.json(), ctsRes.json()]);
        if (etsData.data) setEnergyTypes(etsData.data);
        if (ctsData.data) setChargerTypes(ctsData.data);
      } catch (err) {
        console.error("Failed to load metadata in dashboard:", err);
      }
    }
    loadMetadata();
  }, []);

  const handleEnergyTypeChange = (val: string) => {
    setEnergyType(val);
    if (val !== "EV") {
      setChargerType("");
    }
  };

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(amphoe && { amphoe }),
        ...(energyType && { energy_type: energyType }),
        ...(chargerType && { charger_type: chargerType }),
      });
      const res = await fetch(`/api/stations?${params}`);
      const data = await res.json();
      setStations(data.data || []);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, [search, amphoe, energyType, chargerType, page]);

  useEffect(() => {
    const timer = setTimeout(fetchStations, 300);
    return () => clearTimeout(timer);
  }, [fetchStations]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, amphoe, energyType, chargerType]);

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
        <div className="flex items-center gap-2">
          {/* Download CSV Dropdown (Power BI / Fact) */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all touch-target bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm hover:shadow text-xs font-bold hover:border-slate-300"
              title="เลือกรูปแบบส่งออกข้อมูล CSV / Power BI"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ดาวน์โหลด CSV</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${exportDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    เลือกรูปแบบไฟล์ (CSV / Power BI)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">UTF-8 ภาษาไทย</span>
                </div>

                {/* Option 1: Power BI & Excel Master */}
                <button
                  onClick={() => {
                    downloadPowerBiMaster();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform border border-emerald-100">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>ตารางสรุปสถานี (Power BI & Excel)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">แนะนำ</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      1 แถว/สถานี มี Flag แยกพลังงาน (1/0), สรุปตู้ชาร์จ, kW รวม, และพิกัดพร้อมสร้างกราฟหรือ Map ได้ทันที
                    </p>
                  </div>
                </button>

                {/* Option 2: EV Fact Table */}
                <button
                  onClick={() => {
                    downloadEvChargersFact();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group border-t border-slate-100"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform border border-sky-100">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      ตารางหัวชาร์จ EV (Chargers Fact Table)
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      แจกแจงรายหัวชาร์จ, ประเภทหัว (CCS2/AC), ขนาด kW, และจำนวนหัว สำหรับต่อ Star Schema ใน Power BI
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
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
          onEnergyTypeChange={handleEnergyTypeChange}
          chargerType={chargerType}
          onChargerTypeChange={setChargerType}
          energyTypes={energyTypes}
          chargerTypes={chargerTypes}
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

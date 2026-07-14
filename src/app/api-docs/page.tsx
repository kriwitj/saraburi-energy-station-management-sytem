"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Database,
  Globe,
  ShieldCheck,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { AMPHOE_LIST, ENERGY_TYPE_CONFIG, type EnergyTypeKey } from "@/lib/constants";

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<"docs" | "table">("docs");
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedAmphoe, setSelectedAmphoe] = useState("");
  const [selectedEnergyType, setSelectedEnergyType] = useState("");
  const [selectedEvOnly, setSelectedEvOnly] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await fetch("/api/public/stations");
        const json = await res.json();
        if (json.data) {
          setStations(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch public stations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStations();
  }, []);

  // Filter stations
  const filteredStations = stations.filter((station) => {
    // Search
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      station.name.toLowerCase().includes(searchLower) ||
      station.brand?.name?.toLowerCase().includes(searchLower) ||
      station.station_type?.name?.toLowerCase().includes(searchLower) ||
      station.tambon.toLowerCase().includes(searchLower) ||
      station.amphoe.toLowerCase().includes(searchLower) ||
      (station.address_details && station.address_details.toLowerCase().includes(searchLower));

    // Amphoe filter
    const matchesAmphoe = !selectedAmphoe || station.amphoe === selectedAmphoe;

    // Energy type filter
    const matchesEnergy =
      !selectedEnergyType || station.energy_types?.includes(selectedEnergyType);

    // EV charger filter
    const matchesEv = !selectedEvOnly || station.has_ev_charger === true;

    return matchesSearch && matchesAmphoe && matchesEnergy && matchesEv;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedAmphoe, selectedEnergyType, selectedEvOnly]);

  // Paginated stations
  const startIndex = (currentPage - 1) * limit;
  const paginatedStations = filteredStations.slice(startIndex, startIndex + limit);
  const totalPages = Math.ceil(filteredStations.length / limit) || 1;

  // CSV download function (Excluding IDs)
  function handleDownloadCSV() {
    const headers = [
      "ชื่อสถานี (Station Name)",
      "แบรนด์ (Brand)",
      "ประเภทสถานี (Station Type)",
      "ประเภทพลังงาน (Energy Types)",
      "อำเภอ (Amphoe)",
      "ตำบล (Tambon)",
      "ละติจูด (Latitude)",
      "ลองจิจูด (Longitude)",
      "รายละเอียดที่อยู่ (Address Details)",
      "รายละเอียดเพิ่มเติม (Details)",
      "มีตู้ชาร์จ EV (Has EV Charger)",
      "รายละเอียดตู้ชาร์จ EV (EV Chargers Info)",
    ];

    const rows = filteredStations.map((station) => {
      const chargerInfo =
        station.chargers && station.chargers.length > 0
          ? station.chargers
              .map((c: any) => `${c.charger_type}: ${c.power_kw}kW (${c.plug_count} หัว)`)
              .join(" | ")
          : "-";

      return [
        station.name,
        station.brand?.name || "-",
        station.station_type?.name || "-",
        station.energy_types ? station.energy_types.join(", ") : "-",
        station.amphoe,
        station.tambon,
        station.latitude,
        station.longitude,
        station.address_details || "-",
        station.details || "-",
        station.has_ev_charger ? "มี" : "ไม่มี",
        chargerInfo,
      ];
    });

    const csvContent = [
      "\ufeff" + headers.join(","),
      ...rows.map((row) =>
        row
          .map((val) => {
            const strVal = String(val).replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `saraburi_energy_stations_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // JSON download function (Excluding IDs)
  function handleDownloadJSON() {
    const cleanedData = filteredStations.map((station) => {
      const cleanedBrand = station.brand
        ? {
            name: station.brand.name,
            short_name: station.brand.short_name,
            logo_url: station.brand.logo_url,
          }
        : null;

      const cleanedStationType = station.station_type
        ? {
            name: station.station_type.name,
            icon: station.station_type.icon,
          }
        : null;

      return {
        name: station.name,
        station_type: cleanedStationType,
        brand: cleanedBrand,
        energy_types: station.energy_types,
        latitude: station.latitude,
        longitude: station.longitude,
        tambon: station.tambon,
        amphoe: station.amphoe,
        address_details: station.address_details,
        details: station.details,
        image_url: station.image_url,
        has_ev_charger: station.has_ev_charger,
        chargers: station.chargers
          ? station.chargers.map((c: any) => ({
              charger_type: c.charger_type,
              power_kw: c.power_kw,
              plug_count: c.plug_count,
            }))
          : [],
      };
    });

    const exportObj = {
      metadata: {
        title: "ข้อมูลสถานีบริการพลังงาน จังหวัดสระบุรี",
        description: "ข้อมูลตำแหน่งสถานีบริการน้ำมัน ก๊าซ LPG/NGV และสถานีชาร์จรถไฟฟ้า EV ในพื้นที่จังหวัดสระบุรี",
        publisher: "สำนักงานพลังงานจังหวัดสระบุรี",
        format: "JSON",
        total_records: cleanedData.length,
        exported_at: new Date().toISOString(),
      },
      data: cleanedData,
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `saraburi_energy_stations_${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const badgeStyles: Record<string, string> = {
    OIL: "bg-blue-500/10 border border-blue-500/20 text-blue-400",
    LPG: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
    NGV: "bg-purple-500/10 border border-purple-500/20 text-purple-400",
    EV: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="min-h-screen text-slate-300 font-sans flex flex-col" style={{ background: "#0a1628" }}>
      {/* Top Navbar */}
      <header
        className="h-14 border-b backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50"
        style={{ background: "rgba(15, 32, 68, 0.85)", borderColor: "rgba(255, 255, 255, 0.08)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าแรกแผนที่
          </Link>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400">Open Data Gateway</span>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-10 px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              Saraburi Energy Hub API
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              ระบบศูนย์กลางข้อมูล <span className="text-[#0ea5e9]">Open Data API</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              บริการข้อมูลสารสนเทศและตู้ชาร์จไฟฟ้า EV ในจังหวัดสระบุรี เพื่อการนำข้อมูลไปประยุกต์ใช้งานวิเคราะห์หรือพัฒนาโปรแกรมต่อยอด
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" />
              CORS Enabled (*)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              No Auth Required
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-6 border-b border-white/5 pb-3">
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === "docs"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "text-slate-400 hover:text-slate-200 bg-white/5 border border-white/5"
            }`}
          >
            📖 คู่มือการเชื่อมต่อ API (API Documentation)
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === "table"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "text-slate-400 hover:text-slate-200 bg-white/5 border border-white/5"
            }`}
          >
            📊 ตารางข้อมูลสืบค้น & ดาวน์โหลด (Data Explorer)
          </button>
        </div>

        {/* TAB 1: API DOCUMENTATION */}
        {activeTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Left: Description */}
            <div className="lg:col-span-2 space-y-8">
              {/* API Endpoints */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-sky-400" />
                  API Endpoint ทั้งหมด
                </h2>

                {/* Endpoint Card */}
                <div className="rounded-2xl border p-5 space-y-4" style={{ background: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255, 255, 255, 0.06)" }}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-white font-bold text-[10px] tracking-wider uppercase">GET</span>
                    <code className="text-xs font-mono font-bold text-slate-100 break-all">
                      /api/public/stations
                    </code>
                  </div>
                  <p className="text-xs text-slate-400">
                    ดึงรายการสถานีบริการพลังงานทั้งหมดในจังหวัดสระบุรี ครอบคลุมข้อมูลแบรนด์ ประเภทสถานี ละติจูด ลองจิจูด ประเภทพลังงาน และรายละเอียดตู้ชาร์จไฟฟ้า EV อย่างครบถ้วน
                  </p>

                  {/* HTTP Headers */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Headers</span>
                    <div className="font-mono text-[11px] bg-slate-950/40 p-2.5 rounded-xl space-y-1 border border-white/5">
                      <span className="text-sky-400">Content-Type:</span> <span className="text-slate-300">application/json</span><br />
                      <span className="text-sky-400">Access-Control-Allow-Origin:</span> <span className="text-slate-300">*</span><br />
                      <span className="text-sky-400">Cache-Control:</span> <span className="text-slate-300">public, max-age=3600 (แคช 1 ชม.)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Properties Table */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  คำอธิบายฟิลด์ข้อมูล (Data Schema)
                </h2>
                <div className="overflow-x-auto border border-white/5 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
                        <th className="px-4 py-3 font-semibold text-slate-400 w-1/4">ฟิลด์ข้อมูล (Field)</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 w-1/4">ประเภท (Type)</th>
                        <th className="px-4 py-3 font-semibold text-slate-400">รายละเอียดคำอธิบาย (Description)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">id</td>
                        <td className="px-4 py-3 text-slate-400">string (UUID)</td>
                        <td className="px-4 py-3 text-slate-300">รหัส ID อ้างอิงของสถานีในระบบ</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">name</td>
                        <td className="px-4 py-3 text-slate-400">string</td>
                        <td className="px-4 py-3 text-slate-300">ชื่อสถานีบริการพลังงาน (เช่น ปตท. สาขาแก่งคอย)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">amphoe</td>
                        <td className="px-4 py-3 text-slate-400">string</td>
                        <td className="px-4 py-3 text-slate-300">อำเภอที่ตั้งของสถานี (เช่น เมืองสระบุรี, แก่งคอย)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">tambon</td>
                        <td className="px-4 py-3 text-slate-400">string</td>
                        <td className="px-4 py-3 text-slate-300">ตำบลที่ตั้งของสถานี</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">latitude</td>
                        <td className="px-4 py-3 text-slate-400">number</td>
                        <td className="px-4 py-3 text-slate-300">พิกัดทางภูมิศาสตร์ ละติจูด (Latitude)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">longitude</td>
                        <td className="px-4 py-3 text-slate-400">number</td>
                        <td className="px-4 py-3 text-slate-300">พิกัดทางภูมิศาสตร์ ลองจิจูด (Longitude)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">energy_types</td>
                        <td className="px-4 py-3 text-slate-400">array[string]</td>
                        <td className="px-4 py-3 text-slate-300">ประเภทเชื้อเพลิง/พลังงาน ได้แก่ `OIL`, `LPG`, `NGV`, `EV`</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">has_ev_charger</td>
                        <td className="px-4 py-3 text-slate-400">boolean</td>
                        <td className="px-4 py-3 text-slate-300">มีตู้ชาร์จ/เครื่องชาร์จรถยนต์ไฟฟ้าให้บริการ (true/false)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">chargers</td>
                        <td className="px-4 py-3 text-slate-400">array[object]</td>
                        <td className="px-4 py-3 text-slate-300">รายการตู้ชาร์จ ประกอบด้วย: ประเภทหัวจ่าย, ขนาดกำลังไฟ (kW), และจำนวนหัวชาร์จ</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">brand</td>
                        <td className="px-4 py-3 text-slate-400">object</td>
                        <td className="px-4 py-3 text-slate-300">ข้อมูลแบรนด์ปั๊ม (ชื่อแบรนด์, ชื่อย่อ, ลิงก์โลโก้)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-mono font-bold text-sky-400">station_type</td>
                        <td className="px-4 py-3 text-slate-400">object</td>
                        <td className="px-4 py-3 text-slate-300">ประเภทบริการของสถานี (ปั๊มน้ำมัน/สถานีบริการ หรือ ศูนย์ชาร์จ EV ล้วน)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Code Examples */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white font-sans">ตัวอย่างการเรียกใช้งาน (Code Samples)</h2>

                {/* JS Fetch */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">JavaScript (Fetch API)</span>
                  <pre className="text-xs font-mono bg-[#050b14] border border-white/5 p-4 rounded-xl text-slate-200 overflow-x-auto leading-relaxed">
{`fetch('https://energy.saraburidev.org/api/public/stations')
  .then(response => response.json())
  .then(json => {
    console.log("พบสถานีบริการทั้งหมด: " + json.metadata.total_records + " สถานี");
    console.log(json.data); // รายชื่อสถานีพร้อมข้อมูลตู้ชาร์จ EV
  })
  .catch(err => console.error("Error fetching data:", err));`}
                  </pre>
                </div>

                {/* Python */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Python (Requests)</span>
                  <pre className="text-xs font-mono bg-[#050b14] border border-white/5 p-4 rounded-xl text-slate-200 overflow-x-auto leading-relaxed">
{`import requests

url = "https://energy.saraburidev.org/api/public/stations"
response = requests.get(url)

if response.status_code == 200:
    json_data = response.json()
    print(f"Total: {json_data['metadata']['total_records']} records")
    for station in json_data['data']:
        print(station['name'], "EV Charger:", station['has_ev_charger'])`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right: Live Example JSON Output */}
            <div className="lg:col-span-1 space-y-4">
              <div className="sticky top-20 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                  รูปแบบ JSON ผลลัพธ์ (Response JSON)
                </h3>
                <div className="rounded-2xl border bg-[#050b14] p-4 text-[11px] font-mono text-slate-300 overflow-y-auto max-h-[600px] border-white/5 shadow-2xl leading-relaxed">
                  <pre>{`{
  "metadata": {
    "title": "ข้อมูลสถานีบริการพลังงาน จังหวัดสระบุรี",
    "description": "ข้อมูลตำแหน่งสถานีบริการน้ำมัน ก๊าซ LPG/NGV และสถานีชาร์จ EV",
    "publisher": "สำนักงานพลังงานจังหวัดสระบุรี",
    "format": "JSON",
    "total_records": 1
  },
  "data": [
    {
      "id": "5c8c44d7-cc96-466d-b8f8-840ceae2de12",
      "name": "บริษัท โสภาแก๊สออยล์ เทรดดิ้ง จำกัด",
      "station_type": {
        "name": "ปั๊มพลังงาน",
        "icon": "⛽"
      },
      "brand": {
        "name": "ปตท. / PTT",
        "short_name": "PTT",
        "logo_url": "/brands/logo_ptt.png"
      },
      "energy_types": [
        "OIL",
        "EV"
      ],
      "latitude": 14.5407588674883,
      "longitude": 100.926654083827,
      "tambon": "ตะกุด",
      "amphoe": "เมืองสระบุรี",
      "address_details": "ริมถนนมิตรภาพ",
      "has_ev_charger": true,
      "chargers": [
        {
          "charger_type": "CCS2",
          "power_kw": 120.0,
          "plug_count": 2
        },
        {
          "charger_type": "AC Type 2",
          "power_kw": 22.0,
          "plug_count": 1
        }
      ],
      "image_url": "https://...",
      "created_at": "2026-07-14T01:33:00.000Z",
      "updated_at": "2026-07-14T01:33:00.000Z"
    }
  ]
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATA EXPLORER TABLE */}
        {activeTab === "table" && (
          <div className="mt-6 flex-1 flex flex-col space-y-4">
            {/* Filter Panel Card */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                เครื่องมือกรองข้อมูลและสืบค้น (Filters & Options)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ, ตำบล, แบรนด์..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-950/70 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
                  />
                </div>

                {/* District Filter */}
                <div className="relative">
                  <select
                    value={selectedAmphoe}
                    onChange={(e) => setSelectedAmphoe(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl text-xs bg-slate-950/70 border border-white/10 text-slate-300 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all appearance-none"
                  >
                    <option value="">📍 ทุกอำเภอ</option>
                    {AMPHOE_LIST.map((a) => (
                      <option key={a.value} value={a.label}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                    <Filter className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Fuel Type Filter */}
                <div className="relative">
                  <select
                    value={selectedEnergyType}
                    onChange={(e) => setSelectedEnergyType(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl text-xs bg-slate-950/70 border border-white/10 text-slate-300 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all appearance-none"
                  >
                    <option value="">⛽ ทุกประเภทพลังงาน</option>
                    {Object.entries(ENERGY_TYPE_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.icon} {cfg.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                    <Filter className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Checkbox EV */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/50 border border-white/10">
                  <input
                    id="ev_only"
                    type="checkbox"
                    checked={selectedEvOnly}
                    onChange={(e) => setSelectedEvOnly(e.target.checked)}
                    className="w-4 h-4 text-sky-600 border-white/10 rounded focus:ring-sky-500/30 focus:ring-offset-slate-900 bg-slate-950"
                  />
                  <label htmlFor="ev_only" className="text-xs text-slate-300 font-bold cursor-pointer select-none">
                    🔌 เฉพาะสถานีที่มีตู้ชาร์จ EV
                  </label>
                </div>
              </div>

              {/* Download Buttons Panel */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                <span className="text-xs text-slate-400">
                  พบข้อมูลที่ตรงเงื่อนไข <strong className="text-sky-400 font-bold">{filteredStations.length}</strong> รายการ
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadCSV}
                    disabled={filteredStations.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    ดาวน์โหลดข้อมูล CSV
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    disabled={filteredStations.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    ดาวน์โหลดข้อมูล JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden flex-1 shadow-2xl">
              {loading ? (
                <div className="p-16 text-center text-slate-400 text-xs">
                  <span className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin inline-block mb-2" />
                  <p>กำลังโหลดตารางข้อมูลสถานีพลังงาน...</p>
                </div>
              ) : filteredStations.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-xs">
                  ไม่พบสถานีบริการพลังงานตามเงื่อนไขที่ค้นหา/กรอง
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-slate-300">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-12 text-center">ลำดับ</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-48">ชื่อสถานี</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-28">แบรนด์</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-32">ประเภทพลังงาน</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-24">อำเภอ</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-28">ตำบล</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-40">ละติจูด, ลองจิจูด</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs w-60">รายละเอียดตู้ชาร์จ EV (ประเภท, kW, จำนวน)</th>
                        <th className="px-4 py-3 font-semibold text-slate-400 text-xs">จุดสังเกต/ที่อยู่</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px] leading-relaxed">
                      {paginatedStations.map((station, index) => (
                        <tr key={index} className="hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3 text-center text-slate-500 font-bold">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-white text-xs block">
                              {station.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {station.station_type?.name || "สถานีบริการ"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {station.brand?.logo_url && (
                                <img
                                  src={station.brand.logo_url}
                                  alt={station.brand.name}
                                  className="w-4 h-4 object-contain rounded bg-white/10"
                                />
                              )}
                              <span>{station.brand?.name || "-"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {station.energy_types?.map((type: string) => (
                                <span
                                  key={type}
                                  className={`px-1.5 py-0.5 rounded-[6px] text-[9px] font-bold ${
                                    badgeStyles[type] || "bg-slate-500/10 border border-slate-500/20 text-slate-400"
                                  }`}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-300">
                            {station.amphoe}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {station.tambon}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {station.latitude?.toFixed(6)}, {station.longitude?.toFixed(6)}
                          </td>
                          <td className="px-4 py-3">
                            {station.has_ev_charger ? (
                              <div className="space-y-1">
                                {station.chargers && station.chargers.length > 0 ? (
                                  station.chargers.map((c: any, cIdx: number) => (
                                    <div
                                      key={cIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-semibold mr-1 mb-1"
                                    >
                                      🔌 {c.charger_type}: <strong>{c.power_kw} kW</strong> ({c.plug_count} หัว)
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-sky-400 font-bold">มีตู้ชาร์จ EV (ไม่ระบุรายละเอียด)</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={station.address_details || ""}>
                            {station.address_details || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredStations.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-500">
                  แสดงรายการที่ {startIndex + 1} ถึง {Math.min(startIndex + limit, filteredStations.length)} จากทั้งหมด {filteredStations.length} รายการ
                </div>
                <div className="flex items-center gap-4">
                  {/* Rows per page selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>แสดงหน้าละ:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 rounded bg-slate-950 border border-white/10 text-slate-300 text-xs focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Previous/Next buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg bg-slate-950 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-300 font-bold px-2">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg bg-slate-950 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-slate-600 border-t border-white/5">
        <p>Copyright © 2026 Saraburi Provincial Energy Office. All rights reserved.</p>
      </footer>
    </div>
  );
}

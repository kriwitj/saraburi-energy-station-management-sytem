import Link from "next/link";
import { ArrowLeft, Code2, Database, Globe, Key, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "เอกสารการเชื่อมต่อ API (API Docs) — ระบบแผนที่สถานีพลังงาน จ.สระบุรี",
  description: "คู่มือการดึงข้อมูลสถานีบริการพลังงาน (น้ำมัน, แก๊ส LPG/NGV, EV Charger) จังหวัดสระบุรีผ่าน Open API",
};

export default function ApiDocsPage() {
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
      <section className="py-12 px-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              Saraburi Energy Hub API
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              เอกสารการใช้งาน <span className="text-[#0ea5e9]">Open Data API</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              บริการช่องทางดึงข้อมูลสารสนเทศสถานีบริการพลังงาน (น้ำมัน, ก๊าซธรรมชาติ, และตู้ชาร์จไฟฟ้า EV) ของจังหวัดสระบุรีแบบ Real-time เพื่อนำข้อมูลไปพัฒนาหรือใช้วิเคราะห์ต่อยอด
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

        {/* Content Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
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
                  ดึงรายการสถานีบริการพลังงานทั้งหมดในจังหวัดสระบุรี ครอบคลุมข้อมูลแบรนด์ ประเภทสถานี ละติจูด ลองจิจูด และประเภทพลังงานที่รองรับ
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
                      <td className="px-4 py-3 text-slate-400">string (Thai)</td>
                      <td className="px-4 py-3 text-slate-300">อำเภอที่ตั้งของสถานี (เช่น เมืองสระบุรี, แก่งคอย)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">tambon</td>
                      <td className="px-4 py-3 text-slate-400">string</td>
                      <td className="px-4 py-3 text-slate-300">ตำบลที่ตั้งของสถานี</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">latitude</td>
                      <td className="px-4 py-3 text-slate-400">number (Float)</td>
                      <td className="px-4 py-3 text-slate-300">พิกัดทางภูมิศาสตร์ ละติจูด (Latitude)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">longitude</td>
                      <td className="px-4 py-3 text-slate-400">number (Float)</td>
                      <td className="px-4 py-3 text-slate-300">พิกัดทางภูมิศาสตร์ ลองจิจูด (Longitude)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">energy_types</td>
                      <td className="px-4 py-3 text-slate-400">array[string]</td>
                      <td className="px-4 py-3 text-slate-300">ประเภทเชื้อเพลิงที่รองรับ ได้แก่ `OIL` (น้ำมัน), `LPG`, `NGV`, `EV` (ไฟฟ้าชาร์จ)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">brand</td>
                      <td className="px-4 py-3 text-slate-400">object</td>
                      <td className="px-4 py-3 text-slate-300">ข้อมูลแบรนด์ปั๊ม ประกอบด้วย ID, ชื่อย่อ, และลิ้งค์โลโก้</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">station_type</td>
                      <td className="px-4 py-3 text-slate-400">object</td>
                      <td className="px-4 py-3 text-slate-300">ประเภทบริการของสถานี (เช่น ปั๊มพลังงาน หรือ สถานีชาร์จ EV)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">address_details</td>
                      <td className="px-4 py-3 text-slate-400">string | null</td>
                      <td className="px-4 py-3 text-slate-300">จุดสังเกต/รายละเอียดเส้นทางเพิ่มเติม</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Code Examples */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">ตัวอย่างการเรียกใช้งาน (Code Samples)</h2>

              {/* JS Fetch */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">JavaScript (Fetch API)</span>
                <pre className="text-xs font-mono bg-[#050b14] border border-white/5 p-4 rounded-xl text-slate-200 overflow-x-auto leading-relaxed">
{`fetch('https://energy.saraburidev.org/api/public/stations')
  .then(response => response.json())
  .then(json => {
    console.log("พบสถานีบริการทั้งหมด: " + json.metadata.total_records + " สถานี");
    console.log(json.data); // รายชื่อสถานีพร้อมพิกัด
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
        print(station['name'], station['amphoe'], station['latitude'], station['longitude'])`}
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
    "license": "Open Government License - Thailand",
    "format": "JSON",
    "total_records": 1
  },
  "data": [
    {
      "id": "5c8c44d7-cc96-466d-b8f8-840ceae2de12",
      "name": "บริษัท โสภาแก๊สออยล์ เทรดดิ้ง จำกัด",
      "station_type_id": "STATION",
      "station_type": {
        "id": "STATION",
        "name": "ปั๊มพลังงาน",
        "icon": "⛽"
      },
      "brand": {
        "id": "brand-ptt",
        "name": "ปตท. / PTT",
        "short_name": "PTT",
        "logo_url": "/brands/logo_ptt.png"
      },
      "energy_types": [
        "OIL"
      ],
      "latitude": 14.5407588674883,
      "longitude": 100.926654083827,
      "tambon": "ตะกุด",
      "amphoe": "เมืองสระบุรี",
      "address_details": "ริมถนนมิตรภาพ",
      "details": "มีสิ่งอำนวยความสะดวกครบครัน",
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
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-slate-500 border-t border-white/5">
        <p>Copyright © 2026 Saraburi Provincial Energy Office. All rights reserved.</p>
      </footer>
    </div>
  );
}

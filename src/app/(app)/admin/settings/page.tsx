"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, RefreshCw, Save, X, Upload, Image as ImageIcon, Palette, Settings } from "lucide-react";

interface StationType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  _count?: { stations: number };
}

interface Brand {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  _count?: { stations: number };
}

interface EnergyType {
  id: string;
  name: string;
  icon: string;
  map_color: string;
  show_icon: boolean;
}

type TabType = "station-types" | "brands" | "energy-types";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("station-types");
  const [isPending, startTransition] = useTransition();

  // General inputs style class
  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm";

  // ==========================================
  // STATE: Station Types
  // ==========================================
  const [stationTypes, setStationTypes] = useState<StationType[]>([]);
  const [loadingStationTypes, setLoadingStationTypes] = useState(true);
  const [showStForm, setShowStForm] = useState(false);
  const [editStId, setEditStId] = useState<string | null>(null);
  const [stForm, setStForm] = useState({ id: "", name: "", icon: "", description: "" });
  const [stErrors, setStErrors] = useState<Record<string, string>>({});

  // ==========================================
  // STATE: Brands
  // ==========================================
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editBrandId, setEditBrandId] = useState<string | null>(null);
  const [brandForm, setBrandForm] = useState({ name: "", short_name: "", logo_url: "" });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [brandErrors, setBrandErrors] = useState<Record<string, string>>({});

  // ==========================================
  // STATE: Energy Types
  // ==========================================
  const [energyTypes, setEnergyTypes] = useState<EnergyType[]>([]);
  const [loadingEnergyTypes, setLoadingEnergyTypes] = useState(true);
  const [showEtForm, setShowEtForm] = useState(false);
  const [editEtId, setEditEtId] = useState<string | null>(null);
  const [etForm, setEtForm] = useState({ id: "", name: "", icon: "", map_color: "#3B82F6", show_icon: true });
  const [etErrors, setEtErrors] = useState<Record<string, string>>({});

  // ==========================================
  // FETCH FUNCTIONS
  // ==========================================
  async function fetchStationTypes() {
    setLoadingStationTypes(true);
    try {
      const res = await fetch("/api/station-types");
      const data = await res.json();
      setStationTypes(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStationTypes(false);
    }
  }

  async function fetchBrands() {
    setLoadingBrands(true);
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      setBrands(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBrands(false);
    }
  }

  async function fetchEnergyTypes() {
    setLoadingEnergyTypes(true);
    try {
      const res = await fetch("/api/energy-types");
      const data = await res.json();
      setEnergyTypes(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEnergyTypes(false);
    }
  }

  useEffect(() => {
    fetchStationTypes();
    fetchBrands();
    fetchEnergyTypes();
  }, []);

  // ==========================================
  // CRUD Handlers: Station Types
  // ==========================================
  function resetStForm() {
    setStForm({ id: "", name: "", icon: "", description: "" });
    setEditStId(null);
    setStErrors({});
  }

  function validateSt() {
    const e: Record<string, string> = {};
    if (!editStId && !stForm.id) e.id = "กรุณาระบุ ID";
    if (!editStId && !/^[A-Z0-9_]+$/.test(stForm.id)) e.id = "ID ต้องเป็นภาษาอังกฤษพิมพ์ใหญ่, ตัวเลข และ _ เท่านั้น";
    if (!stForm.name) e.name = "กรุณาระบุชื่อ";
    if (!stForm.icon) e.icon = "กรุณาระบุไอคอน (emoji)";
    setStErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSaveSt(e: React.FormEvent) {
    e.preventDefault();
    if (!validateSt()) return;

    startTransition(async () => {
      if (editStId) {
        // PUT
        const res = await fetch(`/api/station-types/${editStId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: stForm.name, icon: stForm.icon, description: stForm.description }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success("แก้ไขประเภทสถานีสำเร็จ!");
      } else {
        // POST
        const res = await fetch("/api/station-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stForm),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success("เพิ่มประเภทสถานีสำเร็จ!");
      }
      setShowStForm(false);
      resetStForm();
      fetchStationTypes();
    });
  }

  // Edit St
  function handleEditSt(st: StationType) {
    setEditStId(st.id);
    setStForm({ id: st.id, name: st.name, icon: st.icon, description: st.description || "" });
    setShowStForm(true);
  }

  async function handleDeleteSt(id: string, name: string) {
    if (!confirm(`ลบประเภทสถานี "${name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/station-types/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("ลบประเภทสถานีสำเร็จ");
    fetchStationTypes();
  }

  // ==========================================
  // CRUD Handlers: Brands
  // ==========================================
  function resetBrandForm() {
    setBrandForm({ name: "", short_name: "", logo_url: "" });
    setEditBrandId(null);
    setBrandErrors({});
  }

  function validateBrand() {
    const e: Record<string, string> = {};
    if (!brandForm.name) e.name = "กรุณาระบุชื่อแบรนด์";
    if (!brandForm.short_name) e.short_name = "กรุณาระบุชื่อย่อแบรนด์";
    setBrandErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาดในการอัปโหลด");
        return;
      }

      setBrandForm((prev) => ({ ...prev, logo_url: data.url }));
      toast.success("อัปโหลดโลโก้สำเร็จ!");
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถอัปโหลดโลโก้ได้");
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!validateBrand()) return;

    startTransition(async () => {
      if (editBrandId) {
        // PUT
        const res = await fetch(`/api/brands/${editBrandId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(brandForm),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success("แก้ไขแบรนด์สำเร็จ!");
      } else {
        // POST
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(brandForm),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success("เพิ่มแบรนด์สำเร็จ!");
      }
      setShowBrandForm(false);
      resetBrandForm();
      fetchBrands();
    });
  }

  function handleEditBrand(b: Brand) {
    setEditBrandId(b.id);
    setBrandForm({ name: b.name, short_name: b.short_name, logo_url: b.logo_url || "" });
    setShowBrandForm(true);
  }

  async function handleDeleteBrand(id: string, name: string) {
    if (!confirm(`ลบแบรนด์ "${name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("ลบแบรนด์สำเร็จ");
    fetchBrands();
  }

  // ==========================================
  // CRUD Handlers: Energy Types
  // ==========================================
  function resetEtForm() {
    setEtForm({ id: "", name: "", icon: "", map_color: "#3B82F6", show_icon: true });
    setEditEtId(null);
    setEtErrors({});
  }

  // Validate Et
  function validateEt() {
    const e: Record<string, string> = {};
    if (!editEtId && !etForm.id) e.id = "กรุณาระบุ ID";
    if (!editEtId && !/^[A-Z0-9_]+$/.test(etForm.id)) e.id = "ID ต้องเป็นภาษาอังกฤษพิมพ์ใหญ่, ตัวเลข และ _ เท่านั้น";
    if (!etForm.name) e.name = "กรุณาระบุชื่อ";
    if (!etForm.icon) e.icon = "กรุณาระบุไอคอน (emoji)";
    if (!etForm.map_color) e.map_color = "กรุณาเลือกสีบนแผนที่";
    setEtErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSaveEt(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEt()) return;

    startTransition(async () => {
      if (editEtId) {
        // PUT
        const res = await fetch(`/api/energy-types/${editEtId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: etForm.name, icon: etForm.icon, map_color: etForm.map_color, show_icon: etForm.show_icon }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success("แก้ไขประเภทพลังงานสำเร็จ!");
      } else {
        // POST
        const res = await fetch("/api/energy-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(etForm),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success("เพิ่มประเภทพลังงานสำเร็จ!");
      }
      setShowEtForm(false);
      resetEtForm();
      fetchEnergyTypes();
    });
  }

  function handleEditEt(et: EnergyType) {
    setEditEtId(et.id);
    setEtForm({ 
      id: et.id, 
      name: et.name, 
      icon: et.icon, 
      map_color: et.map_color, 
      show_icon: et.show_icon !== undefined ? et.show_icon : true 
    });
    setShowEtForm(true);
  }

  async function handleDeleteEt(id: string, name: string) {
    if (!confirm(`ลบประเภทพลังงาน "${name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/energy-types/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("ลบประเภทพลังงานสำเร็จ");
    fetchEnergyTypes();
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Title & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-600 animate-pulse" />
            ตั้งค่าระบบ (System Configuration)
          </h1>
          <p className="text-xs text-slate-500 mt-1">จัดการข้อมูลพื้นฐาน เชื้อเพลิง แบรนด์ผู้ให้บริการ และกลุ่มประเภทสถานีแบบเรียลไทม์</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (activeTab === "station-types") fetchStationTypes();
              if (activeTab === "brands") fetchBrands();
              if (activeTab === "energy-types") fetchEnergyTypes();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 bg-slate-50 rounded-t-xl overflow-hidden">
        <button
          onClick={() => setActiveTab("station-types")}
          className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "station-types"
              ? "border-sky-500 text-sky-600 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          ⛽ ประเภทสถานี ({stationTypes.length})
        </button>
        <button
          onClick={() => setActiveTab("brands")}
          className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "brands"
              ? "border-sky-500 text-sky-600 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          🏢 แบรนด์บริการ ({brands.length})
        </button>
        <button
          onClick={() => setActiveTab("energy-types")}
          className={`flex-1 sm:flex-initial px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "energy-types"
              ? "border-sky-500 text-sky-600 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          ⚡ ประเภทพลังงาน ({energyTypes.length})
        </button>
      </div>

      {/* TAB CONTENT: STATION TYPES */}
      {activeTab === "station-types" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">รายการประเภทสถานี</h2>
            <button
              onClick={() => { resetStForm(); setShowStForm((v) => !v); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มประเภทสถานี
            </button>
          </div>

          {showStForm && (
            <form onSubmit={handleSaveSt} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-1.5">
                {editStId ? `แก้ไขประเภทสถานี: ${editStId}` : "สร้างประเภทสถานีใหม่"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {!editStId && (
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-slate-500">ID (ตัวพิมพ์ใหญ่ เช่น CHARGING_HUB)</label>
                    <input
                      type="text"
                      value={stForm.id}
                      onChange={(e) => setStForm(f => ({ ...f, id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") }))}
                      className={inputClass}
                      placeholder="CHARGING_HUB"
                    />
                    {stErrors.id && <p className="text-[10px] mt-0.5 text-red-500">{stErrors.id}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">ชื่อประเภท</label>
                  <input
                    type="text"
                    value={stForm.name}
                    onChange={(e) => setStForm(f => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                    placeholder="ศูนย์ชาร์จรถยนต์ไฟฟ้า"
                  />
                  {stErrors.name && <p className="text-[10px] mt-0.5 text-red-500">{stErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">ไอคอน (Emoji/อักษรย่อ)</label>
                  <input
                    type="text"
                    value={stForm.icon}
                    onChange={(e) => setStForm(f => ({ ...f, icon: e.target.value }))}
                    className={`${inputClass} text-lg`}
                    placeholder="🔌"
                    maxLength={2}
                  />
                  {stErrors.icon && <p className="text-[10px] mt-0.5 text-red-500">{stErrors.icon}</p>}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 text-slate-500">คำอธิบาย</label>
                <input
                  type="text"
                  value={stForm.description}
                  onChange={(e) => setStForm(f => ({ ...f, description: e.target.value }))}
                  className={inputClass}
                  placeholder="รายละเอียดสำหรับกลุ่มสถานีนี้"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowStForm(false); resetStForm(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-500 border hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
                >
                  {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            {loadingStationTypes ? (
              <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลด...</div>
            ) : stationTypes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">ยังไม่มีข้อมูลประเภทสถานี</div>
            ) : (
              <table className="w-full text-left border-collapse text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b">
                    <th className="p-3 w-16 text-center">ไอคอน</th>
                    <th className="p-3">ประเภท / ID</th>
                    <th className="p-3">คำอธิบาย</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {stationTypes.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center text-2xl">{st.icon}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{st.name}</p>
                        <span className="inline-block mt-0.5 text-[9px] font-mono bg-sky-50 text-sky-600 border border-sky-100 px-1 py-0.2 rounded font-bold">
                          {st.id}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{st.description || "-"}</td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleEditSt(st)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all border border-transparent hover:border-slate-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSt(st.id, st.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BRANDS */}
      {activeTab === "brands" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">รายการแบรนด์สถานี</h2>
            <button
              onClick={() => { resetBrandForm(); setShowBrandForm((v) => !v); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มแบรนด์ใหม่
            </button>
          </div>

          {showBrandForm && (
            <form onSubmit={handleSaveBrand} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-1.5">
                {editBrandId ? "แก้ไขข้อมูลแบรนด์" : "เพิ่มแบรนด์ผู้ให้บริการใหม่"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-slate-500">ชื่อแบรนด์เต็ม (เช่น ปตท.)</label>
                    <input
                      type="text"
                      value={brandForm.name}
                      onChange={(e) => setBrandForm(f => ({ ...f, name: e.target.value }))}
                      className={inputClass}
                      placeholder="ปตท."
                    />
                    {brandErrors.name && <p className="text-[10px] mt-0.5 text-red-500">{brandErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-slate-500">ชื่อย่อ/รหัสแบรนด์ (เช่น PTT)</label>
                    <input
                      type="text"
                      value={brandForm.short_name}
                      onChange={(e) => setBrandForm(f => ({ ...f, short_name: e.target.value }))}
                      className={inputClass}
                      placeholder="PTT"
                    />
                    {brandErrors.short_name && <p className="text-[10px] mt-0.5 text-red-500">{brandErrors.short_name}</p>}
                  </div>
                </div>

                {/* Brand Logo Upload Section */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 mb-2">อัปโหลดโลโก้แบรนด์</p>
                    <div className="w-16 h-16 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                      {brandForm.logo_url ? (
                        <img src={brandForm.logo_url} alt="Brand Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-sky-600 hover:text-sky-700 text-xs font-semibold rounded-xl cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingLogo ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพ"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                    {brandForm.logo_url && (
                      <button
                        type="button"
                        onClick={() => setBrandForm(f => ({ ...f, logo_url: "" }))}
                        className="mt-1.5 w-full text-center text-[10px] text-red-500 hover:underline"
                      >
                        ลบภาพโลโก้
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowBrandForm(false); resetBrandForm(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-500 border hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending || uploadingLogo}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
                >
                  {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            {loadingBrands ? (
              <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลด...</div>
            ) : brands.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">ยังไม่มีข้อมูลแบรนด์สถานี</div>
            ) : (
              <table className="w-full text-left border-collapse text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b">
                    <th className="p-3 w-16 text-center">โลโก้</th>
                    <th className="p-3">ชื่อแบรนด์ / ตัวย่อ</th>
                    <th className="p-3">ลิ้งค์โลโก้</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {brands.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center">
                        <div className="w-10 h-10 mx-auto rounded-lg bg-slate-50 border flex items-center justify-center overflow-hidden">
                          {b.logo_url ? (
                            <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{b.name}</p>
                        <span className="inline-block mt-0.5 text-[9px] font-mono bg-slate-100 border px-1 py-0.2 rounded font-semibold text-slate-500">
                          {b.short_name}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate text-[10px]">
                        {b.logo_url || <span className="italic text-slate-300">ไม่มีโลโก้</span>}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleEditBrand(b)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all border border-transparent hover:border-slate-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(b.id, b.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ENERGY TYPES */}
      {activeTab === "energy-types" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">รายการประเภทพลังงาน/เชื้อเพลิง</h2>
            <button
              onClick={() => { resetEtForm(); setShowEtForm((v) => !v); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มประเภทพลังงาน
            </button>
          </div>

          {showEtForm && (
            <form onSubmit={handleSaveEt} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-1.5">
                {editEtId ? `แก้ไขพลังงาน: ${editEtId}` : "สร้างประเภทพลังงานใหม่"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {!editEtId && (
                  <div>
                    <label className="block text-[10px] font-bold mb-1 text-slate-500">ID (ตัวย่อ/สัญลักษณ์ เช่น EV)</label>
                    <input
                      type="text"
                      value={etForm.id}
                      onChange={(e) => setEtForm(f => ({ ...f, id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") }))}
                      className={inputClass}
                      placeholder="EV"
                    />
                    {etErrors.id && <p className="text-[10px] mt-0.5 text-red-500">{etErrors.id}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">ชื่อพลังงาน (เช่น รถยนต์ไฟฟ้า)</label>
                  <input
                    type="text"
                    value={etForm.name}
                    onChange={(e) => setEtForm(f => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                    placeholder="รถยนต์ไฟฟ้า"
                  />
                  {etErrors.name && <p className="text-[10px] mt-0.5 text-red-500">{etErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">ไอคอน (Emoji)</label>
                  <input
                    type="text"
                    value={etForm.icon}
                    onChange={(e) => setEtForm(f => ({ ...f, icon: e.target.value }))}
                    className={`${inputClass} text-lg`}
                    placeholder="🔌"
                    maxLength={2}
                  />
                  {etErrors.icon && <p className="text-[10px] mt-0.5 text-red-500">{etErrors.icon}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">สีของมาร์กเกอร์บนแผนที่</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={etForm.map_color}
                      onChange={(e) => setEtForm(f => ({ ...f, map_color: e.target.value }))}
                      className="w-10 h-10 border rounded-xl cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={etForm.map_color}
                      onChange={(e) => setEtForm(f => ({ ...f, map_color: e.target.value }))}
                      className={inputClass}
                      placeholder="#3B82F6"
                    />
                  </div>
                  {etErrors.map_color && <p className="text-[10px] mt-0.5 text-red-500">{etErrors.map_color}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="etForm-show-icon"
                  type="checkbox"
                  checked={etForm.show_icon}
                  onChange={(e) => setEtForm(f => ({ ...f, show_icon: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="etForm-show-icon" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
                  แสดงสัญลักษณ์ข้างในจุดตำแหน่งบนแผนที่ (ถ้าไม่ได้ติ๊กจะแสดงเป็นจุดวงกลมสีธรรมดา)
                </label>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowEtForm(false); resetEtForm(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-500 border hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
                >
                  {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            {loadingEnergyTypes ? (
              <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลด...</div>
            ) : energyTypes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">ยังไม่มีข้อมูลประเภทพลังงาน</div>
            ) : (
              <table className="w-full text-left border-collapse text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b">
                    <th className="p-3 w-16 text-center">สัญลักษณ์</th>
                    <th className="p-3">ประเภทพลังงาน / ID</th>
                    <th className="p-3">สีแสดงผลบนแผนที่</th>
                    <th className="p-3">แสดงสัญลักษณ์บนแผนที่</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {energyTypes.map((et) => (
                    <tr key={et.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center text-2xl">{et.icon}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{et.name}</p>
                        <span className="inline-block mt-0.5 text-[9px] font-mono bg-sky-50 text-sky-600 border border-sky-100 px-1 py-0.2 rounded font-bold">
                          {et.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 inline-block shadow-sm"
                            style={{ backgroundColor: et.map_color }}
                          />
                          <span className="font-mono text-[10px]">{et.map_color}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          et.show_icon || et.show_icon === undefined 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {et.show_icon || et.show_icon === undefined ? 'แสดง' : 'ซ่อน (จุดกลมทึบ)'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleEditEt(et)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all border border-transparent hover:border-slate-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEt(et.id, et.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Helper Box */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-700 space-y-1.5 shadow-sm">
        <p className="font-bold flex items-center gap-1">
          <Palette className="w-4 h-4" />
          💡 คำแนะนำการใช้งาน
        </p>
        <p>• <strong>ประเภทสถานี:</strong> ใช้แยกประเภทของสถานีภาพรวม เช่น ปั๊มน้ำมันทั่วไป หรือ ศูนย์ชาร์จ EV ล้วน</p>
        <p>• <strong>แบรนด์สถานี:</strong> แบรนด์ผู้ดูแล เช่น ปตท., บางจาก, เชลล์, พีที, คาลเท็กซ์ ซึ่งสามารถอัปโหลดโลโก้เพื่อนำไปจัดแสดงในแผนที่และข้อมูลทั่วไปได้</p>
        <p>• <strong>ประเภทพลังงาน:</strong> บริการพลังงานทางเลือกที่มีในปั๊ม (ใน 1 สถานีบริการสามารถเลือกพลังงานได้มากกว่า 1 ประเภท เช่น มีทั้งน้ำมันดีเซล แก๊ส LPG และตู้อัดประจุไฟฟ้า EV ร่วมกัน)</p>
      </div>
    </div>
  );
}

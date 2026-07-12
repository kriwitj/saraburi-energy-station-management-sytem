"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, RefreshCw, Save, X } from "lucide-react";

interface StationType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  _count?: { stations: number };
}

export default function AdminStationTypesPage() {
  const [types, setTypes] = useState<StationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ id: "", name: "", icon: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm";

  async function fetchTypes() {
    setLoading(true);
    try {
      const res = await fetch("/api/station-types");
      const data = await res.json();
      setTypes(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTypes(); }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!editId && !form.id) e.id = "กรุณาระบุ ID";
    if (!editId && !/^[A-Z_]+$/.test(form.id)) e.id = "ID ต้องเป็นตัวพิมพ์ใหญ่และ _ เท่านั้น (เช่น STATION)";
    if (!form.name) e.name = "กรุณาระบุชื่อ";
    if (!form.icon) e.icon = "กรุณาระบุไอคอน (emoji)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    startTransition(async () => {
      const res = await fetch("/api/station-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("เพิ่มประเภทสถานีสำเร็จ!");
      setShowForm(false);
      resetForm();
      fetchTypes();
    });
  }

  function handleEdit(st: StationType) {
    setEditId(st.id);
    setForm({ id: st.id, name: st.name, icon: st.icon, description: st.description || "" });
    setShowForm(true);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.icon) { toast.error("กรุณากรอกชื่อและไอคอน"); return; }
    startTransition(async () => {
      const res = await fetch(`/api/station-types/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, icon: form.icon, description: form.description }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("แก้ไขประเภทสถานีสำเร็จ!");
      setShowForm(false);
      resetForm();
      fetchTypes();
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ลบประเภท "${name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/station-types/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("ลบประเภทสถานีสำเร็จ");
    fetchTypes();
  }

  function resetForm() {
    setForm({ id: "", name: "", icon: "", description: "" });
    setEditId(null);
    setErrors({});
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">จัดการประเภทสถานี</h1>
          <p className="text-xs mt-0.5 text-slate-500">กำหนดประเภทสถานีบริการพลังงานแบบ Dynamic</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTypes}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-800 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => { resetForm(); setShowForm((v) => !v); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
          >
            <Plus className="w-4 h-4" />
            เพิ่มประเภท
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={editId ? handleUpdate : handleCreate}
          className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4"
        >
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            {editId ? `แก้ไขประเภท: ${editId}` : "เพิ่มประเภทสถานีใหม่"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!editId && (
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500">
                  ID <span className="text-slate-400 font-normal">(ตัวพิมพ์ใหญ่ เช่น STATION)</span>
                </label>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => setForm(f => ({ ...f, id: e.target.value.toUpperCase().replace(/[^A-Z_]/g, "") }))}
                  className={inputClass}
                  placeholder="STATION"
                />
                {errors.id && <p className="text-xs mt-1 text-red-500">{errors.id}</p>}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">ชื่อประเภท</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="ปั๊มพลังงาน"
              />
              {errors.name && <p className="text-xs mt-1 text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">ไอคอน (Emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                className={`${inputClass} text-2xl`}
                placeholder="⛽"
                maxLength={2}
              />
              {errors.icon && <p className="text-xs mt-1 text-red-500">{errors.icon}</p>}
            </div>
            <div className={editId ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold mb-1 text-slate-500">คำอธิบาย (ไม่บังคับ)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputClass}
                placeholder="คำอธิบายสั้น ๆ ของประเภทสถานีนี้"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-all"
            >
              <X className="w-4 h-4" />
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1 flex-1 justify-center py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
            >
              <Save className="w-4 h-4" />
              {isPending ? "กำลังบันทึก..." : (editId ? "บันทึกการแก้ไข" : "สร้างประเภท")}
            </button>
          </div>
        </form>
      )}

      {/* Types Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <p className="text-sm font-bold text-slate-700">ประเภทสถานีทั้งหมด ({types.length} ประเภท)</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">กำลังโหลด...</div>
        ) : types.length === 0 ? (
          <div className="p-8 text-center text-slate-400">ยังไม่มีประเภทสถานี</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {types.map((st) => (
              <div key={st.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-100 flex-shrink-0">
                    {st.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{st.name}</p>
                      <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                        {st.id}
                      </span>
                    </div>
                    {st.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{st.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(st)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all border border-transparent hover:border-slate-200"
                    title="แก้ไข"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(st.id, st.name)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-700 space-y-1">
        <p className="font-bold">💡 หมายเหตุ</p>
        <p>• ID ของประเภทสถานีจะถูกใช้เป็น Foreign Key ในตารางสถานี และไม่สามารถเปลี่ยนแปลงได้หลังสร้างแล้ว</p>
        <p>• ไม่สามารถลบประเภทที่มีสถานีบริการเชื่อมโยงอยู่ได้</p>
        <p>• ตัวอย่าง ID: <span className="font-mono">STATION</span>, <span className="font-mono">CHARGING_HUB</span>, <span className="font-mono">SERVICE_CENTER</span></p>
      </div>
    </div>
  );
}

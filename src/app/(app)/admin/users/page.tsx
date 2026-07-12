"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Shield, UserCheck, Eye, RefreshCw } from "lucide-react";
import type { User } from "@/types/station";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

function RoleBadge({ role }: { role: Role }) {
  const config = ROLE_LABELS[role];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "EDITOR" as Role });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.data || []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.username || form.username.length < 3) e.username = "Username ต้องมีอย่างน้อย 3 ตัวอักษร";
    if (!form.password || form.password.length < 6) e.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (!form.name) e.name = "กรุณากรอกชื่อ";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    startTransition(async () => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("สร้างผู้ใช้สำเร็จ!");
      setShowForm(false);
      setForm({ username: "", password: "", name: "", role: "EDITOR" });
      fetchUsers();
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ลบผู้ใช้ "${name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("ลบผู้ใช้สำเร็จ");
    fetchUsers();
  }

  async function handleRoleChange(id: string, role: Role) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) { toast.error("เปลี่ยน Role ไม่สำเร็จ"); return; }
    toast.success("เปลี่ยน Role สำเร็จ");
    fetchUsers();
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm";

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">จัดการผู้ใช้งาน</h1>
          <p className="text-xs mt-0.5 text-slate-500">เฉพาะผู้ดูแลระบบ (Admin)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-800 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            id="add-user-btn"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white touch-target shadow-md hover:shadow-lg transition-all"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
          >
            <Plus className="w-4 h-4" />
            เพิ่มผู้ใช้
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">สร้างผู้ใช้ใหม่</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">Username</label>
              <input id="new-username" type="text" value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} className={inputClass} placeholder="ตัวอักษรพิมพ์เล็ก, ตัวเลข, _" />
              {errors.username && <p className="text-xs mt-1 text-red-500">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">ชื่อ-นามสกุล</label>
              <input id="new-name" type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="ชื่อผู้ใช้งาน" />
              {errors.name && <p className="text-xs mt-1 text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">รหัสผ่าน</label>
              <input id="new-password" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className={inputClass} placeholder="อย่างน้อย 6 ตัวอักษร" />
              {errors.password && <p className="text-xs mt-1 text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">บทบาท</label>
              <select id="new-role" value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as Role }))} className={inputClass}>
                <option value="ADMIN">ADMIN — ผู้ดูแลระบบ</option>
                <option value="EDITOR">EDITOR — เจ้าหน้าที่</option>
                <option value="VIEWER">VIEWER — ผู้ชม</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-all">ยกเลิก</button>
            <button type="submit" disabled={isPending} id="create-user-submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all" style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}>
              {isPending ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <p className="text-sm font-bold text-slate-700">ผู้ใช้งานทั้งหมด ({users.length} คน)</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">กำลังโหลด...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)", color: "white" }}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className="text-xs rounded-xl py-1.5 px-3 bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-sky-500 shadow-sm transition-all"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                    title="ลบผู้ใช้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Guide */}
      <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-3">
        <p className="text-sm font-bold text-slate-800">คำอธิบายบทบาทสิทธิ์การใช้งาน</p>
        {[
          { icon: Shield, role: "ADMIN", desc: "จัดการทุกอย่าง รวมถึงผู้ใช้งาน ลบสถานีได้", color: "#ef4444" },
          { icon: UserCheck, role: "EDITOR", desc: "เพิ่มและแก้ไขสถานีได้ ไม่สามารถลบหรือจัดการผู้ใช้ได้", color: "#0ea5e9" },
          { icon: Eye, role: "VIEWER", desc: "ดูข้อมูลสถานีและแผนที่ได้เท่านั้น", color: "#64748b" },
        ].map(({ icon: Icon, role, desc, color }) => (
          <div key={role} className="flex gap-3">
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
            <div>
              <span className="text-xs font-bold" style={{ color }}>{role}</span>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ChevronLeft } from "lucide-react";
import type { Station } from "@/types/station";
import { AMPHOE_LIST, ENERGY_TYPE_CONFIG } from "@/lib/constants";
import type { EnergyTypeKey } from "@/lib/constants";
import { ENERGY_TYPES } from "@/lib/validations";
import LocationPicker from "./LocationPicker";
import ImageUploader from "./ImageUploader";

interface StationFormProps {
  initialData?: Station;
  isEdit?: boolean;
}

export default function StationForm({ initialData, isEdit = false }: StationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [brands, setBrands] = useState<{ id: string; name: string; short_name: string; logo_url: string | null }[]>([]);
  const [energyTypes, setEnergyTypes] = useState<{ id: string; name: string; icon: string; map_color: string }[]>([]);
  const [stationTypes, setStationTypes] = useState<{ id: string; name: string; icon: string }[]>([]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [resBrands, resEts, resSts] = await Promise.all([
          fetch("/api/brands"),
          fetch("/api/energy-types"),
          fetch("/api/station-types"),
        ]);
        const brandsData = await resBrands.json();
        const etsData = await resEts.json();
        const stsData = await resSts.json();
        if (brandsData.data) setBrands(brandsData.data);
        if (etsData.data) setEnergyTypes(etsData.data);
        if (stsData.data) setStationTypes(stsData.data);
      } catch (err) {
        console.error("Failed to load form metadata:", err);
      }
    }
    loadMetadata();
  }, []);

  const [form, setForm] = useState({
    station_code: initialData?.station_code ?? "",
    station_name: initialData?.station_name ?? "",
    station_type_id: (initialData as unknown as { station_type_id?: string })?.station_type_id ?? "STATION",
    brand_id: initialData?.brand_id ?? "",
    energy_types: (initialData?.energy_types ?? []) as string[],
    details: initialData?.details ?? "",
    latitude: initialData?.latitude?.toString() ?? "",
    longitude: initialData?.longitude?.toString() ?? "",
    amphoe: initialData?.amphoe ?? "",
    tambon: initialData?.tambon ?? "",
    address_details: initialData?.address_details ?? "",
    image_url: initialData?.image_url ?? "",
    google_map_url: initialData?.google_map_url ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleEnergyType(type: string) {
    setForm((f) => ({
      ...f,
      energy_types: f.energy_types.includes(type)
        ? f.energy_types.filter((t) => t !== type)
        : [...f.energy_types, type],
    }));
  }

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.station_name.trim()) newErrors.station_name = "กรุณากรอกชื่อสถานี";
    if (!form.station_code.trim()) newErrors.station_code = "กรุณากรอกรหัสปั๊ม (StationID)";
    if (!form.brand_id) newErrors.brand_id = "กรุณาเลือกแบรนด์ป๊ัม";
    if (!form.station_type_id) newErrors.station_type_id = "กรุณาเลือกประเภทสถานี";
    if (form.energy_types.length === 0) newErrors.energy_types = "กรุณาเลือกประเภทพลังงาน";
    if (!form.latitude) newErrors.latitude = "กรุณากรอกละติจูด";
    if (!form.longitude) newErrors.longitude = "กรุณากรอกลองจิจูด";
    if (!form.amphoe) newErrors.amphoe = "กรุณาเลือกอำเภอ";
    if (!form.tambon.trim()) newErrors.tambon = "กรุณากรอกตำบล";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        const payload = {
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          image_url: form.image_url || undefined,
          google_map_url: form.google_map_url || undefined,
          details: form.details || undefined,
          address_details: form.address_details || undefined,
        };

        const url = isEdit ? `/api/stations/${initialData!.id}` : "/api/stations";
        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "เกิดข้อผิดพลาด");
          return;
        }

        toast.success(isEdit ? "แก้ไขข้อมูลสถานีสำเร็จ!" : "เพิ่มสถานีใหม่สำเร็จ!");
        router.push(isEdit ? `/stations/${initialData!.id}` : "/dashboard");
        router.refresh();
      } catch {
        toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      }
    });
  }

  const inputClass = "w-full px-3 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm";
  const labelClass = "block text-xs font-bold mb-1.5 text-slate-500";
  const errorClass = "text-xs mt-1 text-red-500";
  const sectionClass = "bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4";

  return (
    <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-800 shadow-sm transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {isEdit ? "แก้ไขข้อมูลสถานี" : "เพิ่มสถานีใหม่"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEdit ? initialData?.station_name : "กรอกข้อมูลสถานีบริการพลังงาน"}
          </p>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <div className={sectionClass}>
        <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          ข้อมูลพื้นฐาน
        </h2>

        {/* Station Name */}
        <div>
          <label className={labelClass} htmlFor="station_name">
            <span className="text-red-400">*</span> ชื่อสถานี
          </label>
          <input
            id="station_name"
            type="text"
            value={form.station_name}
            onChange={(e) => set("station_name", e.target.value)}
            placeholder="เช่น ปตท. แก่งคอย สาขา 1"
            className={inputClass}
          />
          {errors.station_name && (
            <p className={errorClass}>{errors.station_name}</p>
          )}
        </div>

        {/* StationID & Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="station_code">
              <span className="text-red-400">*</span> รหัสปั๊ม (StationID)
            </label>
            <input
              id="station_code"
              type="text"
              value={form.station_code}
              onChange={(e) => set("station_code", e.target.value)}
              placeholder="เช่น ST-PTT-001"
              className={inputClass}
            />
            {errors.station_code && (
              <p className={errorClass}>{errors.station_code}</p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="station_type_id">
              <span className="text-red-400">*</span> ประเภทสถานี
            </label>
            <select
              id="station_type_id"
              value={form.station_type_id}
              onChange={(e) => set("station_type_id", e.target.value)}
              className={inputClass}
            >
              <option value="">เลือกประเภทสถานี</option>
              {stationTypes.length > 0
                ? stationTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.icon} {st.name}
                    </option>
                  ))
                : (
                  <>
                    <option value="STATION">⛽ ปั๊มพลังงาน</option>
                    <option value="CHARGING_HUB">🔌 สถานีชาร์จ EV</option>
                  </>
                )
              }
            </select>
            {errors.station_type_id && (
              <p className={errorClass}>{errors.station_type_id}</p>
            )}
          </div>
        </div>

        {/* Brand Selector */}
        <div>
          <label className={labelClass} htmlFor="brand_id">
            <span className="text-red-400">*</span> แบรนด์ปั๊ม
          </label>
          <select
            id="brand_id"
            value={form.brand_id}
            onChange={(e) => set("brand_id", e.target.value)}
            className={inputClass}
          >
            <option value="">เลือกแบรนด์ปั๊ม</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.short_name})
              </option>
            ))}
          </select>
          {errors.brand_id && (
            <p className={errorClass}>{errors.brand_id}</p>
          )}
        </div>

        {/* Energy Types */}
        <div>
          <label className={labelClass}>
            <span className="text-red-400">*</span> ประเภทพลังงาน (เลือกได้มากกว่า 1)
          </label>
          <div className="flex flex-wrap gap-2">
            {energyTypes.length > 0
              ? energyTypes.map((et) => {
                  const isSelected = form.energy_types.includes(et.id);
                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => toggleEnergyType(et.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target"
                      style={{
                        background: isSelected ? `${et.map_color}15` : "rgba(0,0,0,0.02)",
                        color: isSelected ? et.map_color : "#64748b",
                        border: isSelected ? `1.5px solid ${et.map_color}55` : "1.5px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <span>{et.icon}</span>
                      {et.name}
                    </button>
                  );
                })
              : ENERGY_TYPES.map((type) => {
                  const config = ENERGY_TYPE_CONFIG[type as EnergyTypeKey];
                  const isSelected = form.energy_types.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      id={`energy-type-${type}`}
                      onClick={() => toggleEnergyType(type)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target"
                      style={{
                        background: isSelected ? `${config.mapColor}15` : "rgba(0,0,0,0.02)",
                        color: isSelected ? config.mapColor : "#64748b",
                        border: isSelected ? `1.5px solid ${config.mapColor}55` : "1.5px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <span>{config.icon}</span>
                      {config.label}
                    </button>
                  );
                })}
          </div>
          {errors.energy_types && (
            <p className={errorClass}>{errors.energy_types}</p>
          )}
        </div>

        {/* Details */}
        <div>
          <label className={labelClass} htmlFor="details">
            รายละเอียดเพิ่มเติม
          </label>
          <textarea
            id="details"
            value={form.details}
            onChange={(e) => set("details", e.target.value)}
            placeholder="เช่น จำนวนหัวจ่าย, แบรนด์ตู้ชาร์จ, สิ่งอำนวยความสะดวก (ร้านกาแฟ, ห้องน้ำ)"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Section 2: Location */}
      <div className={sectionClass}>
        <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          ตำแหน่งที่ตั้ง
        </h2>

        {/* Amphoe + Tambon */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="amphoe">
              <span className="text-red-400">*</span> อำเภอ
            </label>
            <select
              id="amphoe"
              value={form.amphoe}
              onChange={(e) => set("amphoe", e.target.value)}
              className={inputClass}
            >
              <option value="">เลือกอำเภอ</option>
              {AMPHOE_LIST.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            {errors.amphoe && (
              <p className={errorClass}>{errors.amphoe}</p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="tambon">
              <span className="text-red-400">*</span> ตำบล
            </label>
            <input
              id="tambon"
              type="text"
              value={form.tambon}
              onChange={(e) => set("tambon", e.target.value)}
              placeholder="ชื่อตำบล"
              className={inputClass}
            />
            {errors.tambon && (
              <p className={errorClass}>{errors.tambon}</p>
            )}
          </div>
        </div>

        {/* Address Details */}
        <div>
          <label className={labelClass} htmlFor="address_details">
            คำอธิบายเส้นทาง / จุดสังเกต
          </label>
          <textarea
            id="address_details"
            value={form.address_details}
            onChange={(e) => set("address_details", e.target.value)}
            placeholder="เช่น ริมถนนพหลโยธิน ก่อนถึงสี่แยกหนองแค, ตรงข้ามห้าง..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Google Maps URL Link (Optional) */}
        <div>
          <label className={labelClass} htmlFor="google_map_url">
            ลิงก์แผนที่ Google Maps (ระบุพิกัดสถานที่โดยตรง / ปักหมุดแชร์ - ถ้ามี)
          </label>
          <input
            id="google_map_url"
            type="url"
            value={form.google_map_url}
            onChange={(e) => set("google_map_url", e.target.value)}
            placeholder="เช่น https://maps.app.goo.gl/... หรือ https://www.google.com/maps/place/..."
            className={inputClass}
          />
          {errors.google_map_url && (
            <p className={errorClass}>{errors.google_map_url}</p>
          )}
        </div>

        {/* GPS Picker */}
        <LocationPicker
          latitude={form.latitude}
          longitude={form.longitude}
          onLatChange={(v) => set("latitude", v)}
          onLngChange={(v) => set("longitude", v)}
        />
        {(errors.latitude || errors.longitude) && (
          <p className={errorClass}>
            {errors.latitude || errors.longitude}
          </p>
        )}
      </div>

      {/* Section 3: Image */}
      <div className={sectionClass}>
        <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          รูปภาพสถานี
        </h2>
        <ImageUploader
          value={form.image_url}
          onChange={(url) => set("image_url", url)}
        />
      </div>

      {/* Submit */}
      <button
        id="submit-station-form"
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold text-white touch-target transition-all"
        style={{
          background: isPending
            ? "rgba(14, 165, 233, 0.5)"
            : "linear-gradient(135deg, #0ea5e9, #00c9a7)",
          cursor: isPending ? "not-allowed" : "pointer",
          boxShadow: isPending ? "none" : "0 8px 32px rgba(14, 165, 233, 0.3)",
        }}
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            กำลังบันทึก...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {isEdit ? "บันทึกการแก้ไข" : "บันทึกสถานีใหม่"}
          </>
        )}
      </button>
    </form>
  );
}

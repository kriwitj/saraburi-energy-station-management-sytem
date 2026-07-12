import type { Amphoe } from "@prisma/client";

// ==============================
// 13 อำเภอของจังหวัดสระบุรี
// ==============================
export const AMPHOE_LIST: { value: Amphoe; label: string }[] = [
  { value: "MUEANG_SARABURI", label: "เมืองสระบุรี" },
  { value: "KAENG_KHOI", label: "แก่งคอย" },
  { value: "NONG_KHAE", label: "หนองแค" },
  { value: "WIHAN_DAENG", label: "วิหารแดง" },
  { value: "NONG_SAENG", label: "หนองแซง" },
  { value: "BAN_MO", label: "บ้านหมอ" },
  { value: "DON_PHUT", label: "ดอนพุด" },
  { value: "NONG_DON", label: "หนองโดน" },
  { value: "PHRA_PHUTTHABAT", label: "พระพุทธบาท" },
  { value: "SAO_HAI", label: "เสาไห้" },
  { value: "MUAK_LEK", label: "มวกเหล็ก" },
  { value: "WANG_MUANG", label: "วังม่วง" },
  { value: "CHALOEM_PHRA_KIAT", label: "เฉลิมพระเกียรติ" },
];

export function getAmphoeLabel(value: Amphoe): string {
  return AMPHOE_LIST.find((a) => a.value === value)?.label ?? value;
}

// ==============================
// Energy Types
// ==============================
export const ENERGY_TYPE_CONFIG = {
  OIL: {
    label: "น้ำมัน",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    mapColor: "#3B82F6",
    icon: "⛽",
  },
  LPG: {
    label: "ก๊าซ LPG",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgLight: "bg-orange-50",
    borderColor: "border-orange-200",
    mapColor: "#F97316",
    icon: "🔵",
  },
  NGV: {
    label: "NGV",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200",
    mapColor: "#8B5CF6",
    icon: "🟣",
  },
  EV: {
    label: "EV Charger",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
    mapColor: "#22C55E",
    icon: "⚡",
  },
} as const;

export type EnergyTypeKey = keyof typeof ENERGY_TYPE_CONFIG;

// ==============================
// Geographic Center of each Amphoe (for map flyTo)
// ==============================
export const AMPHOE_CENTERS: Record<Amphoe, [number, number]> = {
  MUEANG_SARABURI: [14.5295, 100.9101],
  KAENG_KHOI: [14.5834, 101.0023],
  NONG_KHAE: [14.3384, 100.8734],
  WIHAN_DAENG: [14.4789, 101.0956],
  NONG_SAENG: [14.5567, 100.6789],
  BAN_MO: [14.5234, 100.6123],
  DON_PHUT: [14.4012, 100.9345],
  NONG_DON: [14.6123, 100.7234],
  PHRA_PHUTTHABAT: [14.7189, 100.7956],
  SAO_HAI: [14.6634, 100.8234],
  MUAK_LEK: [14.5789, 101.3456],
  WANG_MUANG: [14.4456, 101.2345],
  CHALOEM_PHRA_KIAT: [14.3789, 101.0678],
};

// Center of Saraburi Province
export const SARABURI_CENTER: [number, number] = [14.5295, 100.9101];
export const SARABURI_DEFAULT_ZOOM = 10;
export const SARABURI_DISTRICT_ZOOM = 12;

// ==============================
// Role Labels
// ==============================
export const ROLE_LABELS = {
  ADMIN: { label: "ผู้ดูแลระบบ", color: "bg-red-100 text-red-700" },
  EDITOR: { label: "เจ้าหน้าที่", color: "bg-blue-100 text-blue-700" },
  VIEWER: { label: "ผู้ชม", color: "bg-gray-100 text-gray-700" },
} as const;

// Simplified polygon outline of Saraburi Province boundaries
export const SARABURI_BOUNDARY: [number, number][] = [
  [14.632, 100.560], // Don Phut West
  [14.730, 100.575],
  [14.810, 100.670], // Nong Don North
  [14.920, 100.750], // Phra Phutthabat North
  [14.945, 100.860],
  [14.870, 101.000],
  [14.935, 101.120], // Wang Muang North
  [14.835, 101.320], // Muak Lek Northeast
  [14.720, 101.425],
  [14.620, 101.465], // Muak Lek East (Pak Chong border)
  [14.500, 101.325],
  [14.415, 101.215], // Kaeng Khoi Southeast
  [14.285, 100.995], // Wihan Daeng South (Nakhon Nayok border)
  [14.280, 100.840], // Nong Khae South (Pathum Thani border)
  [14.335, 100.750],
  [14.475, 100.700], // Nong Saeng West
  [14.560, 100.560], // Sao Hai West (Ayutthaya border)
];


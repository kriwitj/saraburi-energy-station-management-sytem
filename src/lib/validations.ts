import { z } from "zod";

export const ENERGY_TYPES = ["OIL", "LPG", "NGV", "EV"] as const;
export type EnergyType = (typeof ENERGY_TYPES)[number];

// ==============================
// Station Schemas
// ==============================
export const stationSchema = z.object({
  station_name: z
    .string()
    .min(2, "ชื่อสถานีต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(200, "ชื่อสถานีต้องไม่เกิน 200 ตัวอักษร"),
  station_code: z
    .string()
    .max(50)
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  station_type_id: z
    .string()
    .min(1, "กรุณาเลือกประเภทสถานี"),
  brand_id: z
    .string()
    .min(1, "กรุณาเลือกแบรนด์ปั๊ม"),
  energy_types: z
    .array(z.string()) // Can map to any dynamic energy types
    .min(1, "ต้องเลือกประเภทพลังงานอย่างน้อย 1 ประเภท"),
  details: z.string().optional(),
  latitude: z
    .number({ error: "กรุณากรอกละติจูด" })
    .min(-90)
    .max(90),
  longitude: z
    .number({ error: "กรุณากรอกลองจิจูด" })
    .min(-180)
    .max(180),
  amphoe: z.enum([
    "เมืองสระบุรี",
    "แก่งคอย",
    "หนองแค",
    "วิหารแดง",
    "หนองแซง",
    "บ้านหมอ",
    "ดอนพุด",
    "หนองโดน",
    "พระพุทธบาท",
    "เสาไห้",
    "มวกเหล็ก",
    "วังม่วง",
    "เฉลิมพระเกียรติ",
  ]),
  tambon: z
    .string()
    .min(1, "กรุณากรอกตำบล")
    .max(100, "ชื่อตำบลต้องไม่เกิน 100 ตัวอักษร"),
  address_details: z.string().optional(),
  image_url: z.string().url("URL รูปภาพไม่ถูกต้อง").optional().or(z.literal("")).or(z.null()),
  google_map_url: z.string().url("รูปแบบ URL ไม่ถูกต้อง").optional().or(z.literal("")).or(z.null()),
  has_ev_charger: z.boolean().optional().default(false),
  chargers: z
    .array(
      z.object({
        charger_type_id: z.string().min(1, "กรุณาเลือกประเภทหัวจ่าย"),
        power_kw: z.number({ error: "กรุณาระบุกำลังไฟ" }).min(0.1, "กำลังไฟต้องมากกว่า 0"),
        plug_count: z.number({ error: "กรุณาระบุจำนวนหัว" }).int().min(1, "จำนวนต้องอย่างน้อย 1"),
      })
    )
    .optional()
    .default([]),
});

export type StationFormData = z.infer<typeof stationSchema>;

// ==============================
// User Schemas
// ==============================
export const loginSchema = z.object({
  username: z.string().min(1, "กรุณากรอก username"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Username ใช้ได้เฉพาะตัวอักษรพิมพ์เล็ก ตัวเลข และ _"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional().or(z.literal("")),
});

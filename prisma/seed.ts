import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load local environment variables (like DATABASE_URL)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ==============================
  // Create default Admin user (password: saraburi2025)
  // ==============================
  const adminHashedPassword = "$2b$12$wdv6KO6glKyuq/EYW8.H6eID90INUtYPKHj46jvcaYH1WAUMR0o6e";

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminHashedPassword,
      name: "ผู้ดูแลระบบ",
      role: "ADMIN",
    },
  });

  // ==============================
  // Create default Editor user (password: editor2025)
  // ==============================
  const editorHashedPassword = "$2b$12$LhnnLphb2RDnJkhBS9KECeJTqUVc/7OIU4OA2w9/eDPe4Y7mTHwTi";

  await prisma.user.upsert({
    where: { username: "editor01" },
    update: {},
    create: {
      username: "editor01",
      password: editorHashedPassword,
      name: "เจ้าหน้าที่ภาคสนาม 01",
      role: "EDITOR",
    },
  });

  console.log("✅ Users seeded");

  // ==============================
  // Create dynamic Energy Types
  // ==============================
  const energyTypes = [
    { id: "OIL", name: "น้ำมัน", icon: "⛽", map_color: "#3B82F6" },
    { id: "LPG", name: "ก๊าซ LPG", icon: "🔵", map_color: "#F97316" },
    { id: "NGV", name: "ก๊าซ NGV", icon: "🟣", map_color: "#8B5CF6" },
    { id: "EV", name: "EV Charger", icon: "⚡", map_color: "#22C55E" },
  ];

  for (const et of energyTypes) {
    await prisma.energyType.upsert({
      where: { id: et.id },
      update: et,
      create: et,
    });
  }
  console.log("✅ Energy Types seeded");

  // ==============================
  // Create dynamic Station Types
  // ==============================
  const stationTypes = [
    { id: "STATION",      name: "ปั๊มพลังงาน",     icon: "⛽", description: "สถานีบริการน้ำมัน ก๊าซ LPG/NGV ทั่วไป" },
    { id: "CHARGING_HUB", name: "สถานีชาร์จ EV",   icon: "🔌", description: "สถานีชาร์จรถยนต์ไฟฟ้า (EV Charging Hub)" },
  ];

  for (const st of stationTypes) {
    await prisma.stationType.upsert({
      where: { id: st.id },
      update: st,
      create: st,
    });
  }
  console.log("✅ Station Types seeded");

  // ==============================
  // Create default Brands
  // ==============================
  const brandsSeed = [
    { id: "brand-ptt",     name: "ปตท. / PTT",            short_name: "PTT",      logo_url: "/brands/logo_ptt.png" },
    { id: "brand-bangchak",name: "บางจาก / Bangchak",      short_name: "BCP",      logo_url: "/brands/logo_bangchak.png" },
    { id: "brand-shell",   name: "เชลล์ / Shell",          short_name: "Shell",    logo_url: "/brands/logo_shell.png" },
    { id: "brand-pt",      name: "พีที / PT",              short_name: "PT",       logo_url: "/brands/logo_pt.png" },
    { id: "brand-caltex",  name: "คาลเท็กซ์ / Caltex",    short_name: "Caltex",   logo_url: "/brands/logo_caltex.png" },
    { id: "brand-pea",     name: "พีอีเอ โวลต้า / PEA Volta", short_name: "PEA Volta", logo_url: "/brands/logo_pea.png" },
  ];

  const brandMap: Record<string, string> = {};
  for (const b of brandsSeed) {
    const brand = await prisma.brand.upsert({
      where: { id: b.id },
      update: { name: b.name, short_name: b.short_name, logo_url: b.logo_url },
      create: b,
    });
    brandMap[b.short_name] = brand.id;
  }
  console.log("✅ Brands seeded");

  // ==============================
  // Create sample stations
  // ==============================
  const stations = [
    {
      station_code: "ST-PTT-001",
      station_name: "ปตท. แก่งคอย สาขา 1",
      station_type_id: "STATION",
      brand_id: brandMap["PTT"],
      energy_types: ["OIL", "LPG"],
      details: "สถานีบริการขนาดใหญ่ มีหัวจ่ายน้ำมัน 8 หัว LPG 2 หัว มีร้านกาแฟ Amazon และห้องน้ำสะอาด",
      latitude: 14.5834,
      longitude: 101.0023,
      amphoe: "KAENG_KHOI" as const,
      tambon: "แก่งคอย",
      address_details: "ติดถนนมิตรภาพ ใกล้ห้างโลตัสแก่งคอย",
      image_url: null,
    },
    {
      station_code: "ST-BCP-001",
      station_name: "บางจาก หนองแค",
      station_type_id: "STATION",
      brand_id: brandMap["BCP"],
      energy_types: ["OIL"],
      details: "สถานีบริการน้ำมัน หัวจ่าย 6 หัว มีร้านสะดวกซื้อ มีบริการล้างรถ",
      latitude: 14.3384,
      longitude: 100.8734,
      amphoe: "NONG_KHAE" as const,
      tambon: "หนองแค",
      address_details: "ริมถนนพหลโยธิน ก่อนถึงสี่แยกหนองแค",
      image_url: null,
    },
    {
      station_code: "ST-PEA-001",
      station_name: "EV Station พระพุทธบาท",
      station_type_id: "CHARGING_HUB",
      brand_id: brandMap["PEA Volta"],
      energy_types: ["EV"],
      details: "สถานีชาร์จรถยนต์ไฟฟ้า 4 หัวชาร์จ DC Fast Charge 150kW แบรนด์ EA Anywhere มีที่นั่งพักและ WiFi ฟรี",
      latitude: 14.7189,
      longitude: 100.7956,
      amphoe: "PHRA_PHUTTHABAT" as const,
      tambon: "พระพุทธบาท",
      address_details: "ในบริเวณลานจอดรถวัดพระพุทธบาท ด้านข้างประตูทางเข้า",
      image_url: null,
    },
    {
      station_code: "ST-SHL-001",
      station_name: "เชลล์ เมืองสระบุรี",
      station_type_id: "STATION",
      brand_id: brandMap["Shell"],
      energy_types: ["OIL", "NGV"],
      details: "สถานีน้ำมันเชลล์ มีหัวจ่าย NGV 2 หัว น้ำมัน 6 หัว มีร้าน Select ห้องน้ำสะอาด",
      latitude: 14.5295,
      longitude: 100.9101,
      amphoe: "MUEANG_SARABURI" as const,
      tambon: "ปากเพรียว",
      address_details: "ถนนพิชัยรณรงค์สงคราม ใจกลางเมืองสระบุรี",
      image_url: null,
    },
    {
      station_code: "ST-PTG-001",
      station_name: "PTG มวกเหล็ก",
      station_type_id: "STATION",
      brand_id: brandMap["PT"],
      energy_types: ["OIL", "LPG"],
      details: "สถานีน้ำมัน PTG Energy หัวจ่าย 4 หัว LPG 1 หัว รองรับรถบรรทุก มีที่จอดขนาดใหญ่",
      latitude: 14.5234,
      longitude: 101.3456,
      amphoe: "MUAK_LEK" as const,
      tambon: "มวกเหล็ก",
      address_details: "ริมทางหลวงหมายเลข 2 ก่อนขึ้นเขาใหญ่",
      image_url: null,
    },
    {
      station_code: "ST-PEA-002",
      station_name: "สถานีชาร์จ EV บ้านหมอ",
      station_type_id: "CHARGING_HUB",
      brand_id: brandMap["PEA Volta"],
      energy_types: ["EV", "OIL"],
      details: "Hybrid Station มีทั้งน้ำมันและ EV ชาร์จ 2 หัว AC 22kW แบรนด์ PEA VOLTA",
      latitude: 14.5567,
      longitude: 100.6789,
      amphoe: "BAN_MO" as const,
      tambon: "บ้านหมอ",
      address_details: "ถนนสายบ้านหมอ-สระบุรี ใกล้วงเวียนบ้านหมอ",
      image_url: null,
    },
    {
      station_code: "ST-CTX-001",
      station_name: "คาลเท็กซ์ เสาไห้",
      station_type_id: "STATION",
      brand_id: brandMap["Caltex"],
      energy_types: ["OIL"],
      details: "สถานีน้ำมันเอสโซ่ มีหัวจ่ายน้ำมันทุกประเภท 8 หัว มีร้าน Tiger Mart",
      latitude: 14.6123,
      longitude: 100.8234,
      amphoe: "SAO_HAI" as const,
      tambon: "เสาไห้",
      address_details: "หน้าโรงเรียนเสาไห้งามพิทยาคม",
      image_url: null,
    },
  ];

  for (const station of stations) {
    await prisma.station.upsert({
      where: { station_code: station.station_code },
      update: station,
      create: station,
    });
  }

  console.log(`✅ Seeded ${stations.length} sample stations`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import LandingClient from "@/components/landing/LandingClient";
import type { Station } from "@/types/station";

export const metadata = {
  title: "หน้าแรก — ระบบค้นหาสถานีพลังงาน จ.สระบุรี",
  description: "ระบบสืบค้นข้อมูลสถานีบริการพลังงาน จังหวัดสระบุรี ค้นหาน้ำมัน ก๊าซ LPG/NGV และจุดบริการชาร์จรถไฟฟ้า EV",
};

export default async function HomePage() {
  const session = await getSession();

  // Fetch all stations from database for the public map
  const stations = await prisma.station.findMany({
    include: { brand: true, station_type: true },
    orderBy: { created_at: "desc" },
  });

  // Serialize Dates for client side compatibility
  const serializedStations: Station[] = stations.map((s) => ({
    ...s,
    created_at: s.created_at.toISOString(),
    updated_at: s.updated_at.toISOString(),
  }));

  return <LandingClient initialStations={serializedStations} session={session} />;
}

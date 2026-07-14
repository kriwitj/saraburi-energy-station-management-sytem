import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAmphoeLabel } from "@/lib/constants";

// GET /api/public/stations
// Public Open Data API — returns all stations in a standardized format
export async function GET() {
  try {
    const stations = await prisma.station.findMany({
      include: {
        brand: true,
        station_type: true,
        chargers: {
          include: {
            charger_type: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const formattedData = stations.map((station) => ({
      id: station.id,
      name: station.station_name,
      station_type_id: station.station_type_id,
      station_type: {
        id: station.station_type.id,
        name: station.station_type.name,
        icon: station.station_type.icon,
      },
      brand: {
        id: station.brand.id,
        name: station.brand.name,
        short_name: station.brand.short_name,
        logo_url: station.brand.logo_url || null,
      },
      energy_types: station.energy_types,
      latitude: station.latitude,
      longitude: station.longitude,
      tambon: station.tambon,
      amphoe: getAmphoeLabel(station.amphoe),
      address_details: station.address_details || null,
      details: station.details || null,
      image_url: station.image_url || null,
      has_ev_charger: station.has_ev_charger,
      chargers: station.chargers.map((c) => ({
        charger_type: c.charger_type.name,
        power_kw: c.power_kw,
        plug_count: c.plug_count,
      })),
      created_at: station.created_at.toISOString(),
      updated_at: station.updated_at.toISOString(),
    }));

    return NextResponse.json(
      {
        metadata: {
          title: "ข้อมูลสถานีบริการพลังงาน จังหวัดสระบุรี (Saraburi Energy Stations Data)",
          description: "ข้อมูลตำแหน่งสถานีบริการน้ำมัน ก๊าซ LPG/NGV และสถานีชาร์จรถไฟฟ้า EV ในพื้นที่จังหวัดสระบุรี ครอบคลุม 13 อำเภอ",
          publisher: "สำนักงานพลังงานจังหวัดสระบุรี (Saraburi Provincial Energy Office)",
          license: "Open Government License - Thailand (OGDL)",
          documentation_url: "https://github.com/kriwit-j/saraburi-pump-charger",
          format: "JSON",
          last_updated: new Date().toISOString(),
          total_records: stations.length,
        },
        data: formattedData,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error("Open data API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "ไม่สามารถเรียกข้อมูล Open Data ได้ ณ ขณะนี้" },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

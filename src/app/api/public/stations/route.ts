import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAmphoeLabel, AMPHOE_MAP_TO_ENUM } from "@/lib/constants";
import type { Amphoe } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/public/stations
// Public Open Data API — returns stations in a standardized format with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const amphoeParam = searchParams.get("amphoe")?.trim() || "";
    const energyTypeParam = searchParams.get("energy_type")?.trim().toUpperCase() || "";
    const hasEvParam = searchParams.get("has_ev_charger")?.trim();
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    // Build Prisma where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { station_name: { contains: search, mode: "insensitive" } },
        { tambon: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { address_details: { contains: search, mode: "insensitive" } },
      ];
    }

    if (amphoeParam) {
      let amphoeEnum: Amphoe | undefined;
      if (amphoeParam in AMPHOE_MAP_TO_ENUM) {
        amphoeEnum = AMPHOE_MAP_TO_ENUM[amphoeParam];
      } else if (Object.values(AMPHOE_MAP_TO_ENUM).includes(amphoeParam as Amphoe)) {
        amphoeEnum = amphoeParam as Amphoe;
      }
      if (amphoeEnum) {
        where.amphoe = amphoeEnum;
      }
    }

    if (energyTypeParam) {
      where.energy_types = { has: energyTypeParam };
    }

    if (hasEvParam !== undefined && hasEvParam !== null && hasEvParam !== "") {
      where.has_ev_charger = hasEvParam.toLowerCase() === "true" || hasEvParam === "1";
    }

    // Pagination (optional: if omitted, all matching records are returned)
    let take: number | undefined = undefined;
    let skip: number | undefined = undefined;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        take = parsedLimit;
        const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
        skip = (!isNaN(parsedPage) && parsedPage > 0 ? parsedPage - 1 : 0) * take;
      }
    }

    const [stations, totalCount] = await Promise.all([
      prisma.station.findMany({
        where,
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
        ...(take ? { take, skip } : {}),
      }),
      prisma.station.count({ where }),
    ]);

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
          total_records: totalCount,
          returned_records: formattedData.length,
          filters_applied: {
            energy_type: energyTypeParam || null,
            amphoe: amphoeParam || null,
            search: search || null,
            has_ev_charger:
              hasEvParam !== undefined && hasEvParam !== null && hasEvParam !== ""
                ? hasEvParam.toLowerCase() === "true" || hasEvParam === "1"
                : null,
          },
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

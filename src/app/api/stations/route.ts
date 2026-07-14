import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stationSchema } from "@/lib/validations";
import type { Amphoe } from "@prisma/client";
import { getAmphoeLabel, AMPHOE_MAP_TO_ENUM } from "@/lib/constants";

// GET /api/stations
export async function GET(request: NextRequest) {
  const session = await getSession(); // Keep session load for potential personalized logic if needed

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const amphoeParam = searchParams.get("amphoe") || "";
  const amphoe = AMPHOE_MAP_TO_ENUM[amphoeParam] as Amphoe | undefined;
  const energy_type = searchParams.get("energy_type") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // Build Prisma where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { station_name: { contains: search, mode: "insensitive" } },
      { tambon: { contains: search, mode: "insensitive" } },
      { details: { contains: search, mode: "insensitive" } },
    ];
  }

  if (amphoe) {
    where.amphoe = amphoe;
  }

  if (energy_type) {
    where.energy_types = { has: energy_type };
  }

  const [stations, total] = await Promise.all([
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
      skip,
      take: limit,
    }),
    prisma.station.count({ where }),
  ]);

  // Calculate stats
  const allStations = await prisma.station.findMany({
    select: { energy_types: true, amphoe: true },
  });

  const stats = {
    total: allStations.length,
    oil: allStations.filter((s) => s.energy_types.includes("OIL")).length,
    lpg: allStations.filter((s) => s.energy_types.includes("LPG")).length,
    ngv: allStations.filter((s) => s.energy_types.includes("NGV")).length,
    ev: allStations.filter((s) => s.energy_types.includes("EV")).length,
  };

  return NextResponse.json({
    data: stations.map((s) => {
      const { station_code, ...rest } = s;
      return {
        ...rest,
        amphoe: getAmphoeLabel(s.amphoe),
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats,
  });
}

// POST /api/stations
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role === "VIEWER") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = stationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prismaAmphoe = AMPHOE_MAP_TO_ENUM[parsed.data.amphoe] as Amphoe;

    const { chargers, ...stationData } = parsed.data;

    const generatedStationCode = stationData.station_code || `ST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const station = await prisma.station.create({
      data: {
        ...stationData,
        station_code: generatedStationCode,
        amphoe: prismaAmphoe,
        energy_types: stationData.energy_types as string[],
        details: stationData.details || null,
        address_details: stationData.address_details || null,
        image_url: stationData.image_url || null,
        google_map_url: stationData.google_map_url || null,
        has_ev_charger: stationData.has_ev_charger ?? false,
        chargers: stationData.has_ev_charger && chargers && chargers.length > 0
          ? {
              create: chargers.map((c) => ({
                charger_type_id: c.charger_type_id,
                power_kw: c.power_kw,
                plug_count: c.plug_count,
              })),
            }
          : undefined,
      },
      include: {
        chargers: {
          include: {
            charger_type: true,
          },
        },
      },
    });

    return NextResponse.json({ data: station }, { status: 201 });
  } catch (error) {
    console.error("Create station error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}

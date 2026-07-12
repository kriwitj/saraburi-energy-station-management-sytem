import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stationSchema } from "@/lib/validations";
import type { Amphoe } from "@prisma/client";

// GET /api/stations
export async function GET(request: NextRequest) {
  const session = await getSession(); // Keep session load for potential personalized logic if needed

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const amphoe = searchParams.get("amphoe") as Amphoe | null;
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
      include: { brand: true, station_type: true },
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
    data: stations,
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

    const station = await prisma.station.create({
      data: {
        ...parsed.data,
        energy_types: parsed.data.energy_types as string[],
        details: parsed.data.details || null,
        address_details: parsed.data.address_details || null,
        image_url: parsed.data.image_url || null,
        google_map_url: parsed.data.google_map_url || null,
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

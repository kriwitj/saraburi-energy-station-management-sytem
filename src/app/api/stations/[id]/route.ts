import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stationSchema } from "@/lib/validations";
import { deleteFileByUrl } from "@/lib/minio";
import { getAmphoeLabel, AMPHOE_MAP_TO_ENUM } from "@/lib/constants";
import type { Amphoe } from "@prisma/client";

// GET /api/stations/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(); // Optional check

  const { id } = await params;
  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      brand: true,
      station_type: true,
      chargers: {
        include: {
          charger_type: true,
        },
      },
    },
  });

  if (!station) {
    return NextResponse.json({ error: "ไม่พบข้อมูลสถานี" }, { status: 404 });
  }

  const { station_code, ...rest } = station;
  const formattedStation = {
    ...rest,
    amphoe: getAmphoeLabel(station.amphoe),
  };

  return NextResponse.json({ data: formattedStation });
}

// PUT /api/stations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role === "VIEWER") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { id } = await params;

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

    const { station_code, chargers, ...restData } = parsed.data;

    const updateData: any = {
      ...restData,
      amphoe: prismaAmphoe,
      energy_types: parsed.data.energy_types as string[],
      details: parsed.data.details || null,
      address_details: parsed.data.address_details || null,
      image_url: parsed.data.image_url || null,
      google_map_url: parsed.data.google_map_url || null,
      has_ev_charger: parsed.data.has_ev_charger ?? false,
    };

    if (station_code && station_code.trim()) {
      updateData.station_code = station_code;
    }

    const station = await prisma.$transaction(async (tx) => {
      // Delete existing chargers
      await tx.stationCharger.deleteMany({
        where: { station_id: id },
      });

      // Create new chargers if needed
      if (parsed.data.has_ev_charger && chargers && chargers.length > 0) {
        updateData.chargers = {
          create: chargers.map((c) => ({
            charger_type_id: c.charger_type_id,
            power_kw: c.power_kw,
            plug_count: c.plug_count,
          })),
        };
      }

      return tx.station.update({
        where: { id },
        data: updateData,
        include: {
          brand: true,
          station_type: true,
          chargers: {
            include: {
              charger_type: true,
            },
          },
        },
      });
    });

    const { station_code: _, ...rest } = station;
    const formattedStation = {
      ...rest,
      amphoe: getAmphoeLabel(station.amphoe),
    };

    return NextResponse.json({ data: formattedStation });
  } catch (error) {
    console.error("Update station error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" },
      { status: 500 }
    );
  }
}

// DELETE /api/stations/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "เฉพาะ Admin เท่านั้นที่ลบได้" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const station = await prisma.station.findUnique({ where: { id } });
    if (!station) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสถานี" }, { status: 404 });
    }

    // Delete image from MinIO if exists
    if (station.image_url) {
      await deleteFileByUrl(station.image_url);
    }

    await prisma.station.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete station error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    );
  }
}

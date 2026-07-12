import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { stationSchema } from "@/lib/validations";
import { deleteFileByUrl } from "@/lib/minio";

// GET /api/stations/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(); // Optional check

  const { id } = await params;
  const station = await prisma.station.findUnique({
    where: { id },
    include: { brand: true, station_type: true },
  });

  if (!station) {
    return NextResponse.json({ error: "ไม่พบข้อมูลสถานี" }, { status: 404 });
  }

  return NextResponse.json({ data: station });
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

    const station = await prisma.station.update({
      where: { id },
      data: {
        ...parsed.data,
        energy_types: parsed.data.energy_types as string[],
        details: parsed.data.details || null,
        address_details: parsed.data.address_details || null,
        image_url: parsed.data.image_url || null,
        google_map_url: parsed.data.google_map_url || null,
      },
    });

    return NextResponse.json({ data: station });
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

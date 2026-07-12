import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PUT /api/station-types/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "VIEWER") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  try {
    const body = await request.json();
    const { name, icon, description } = body;

    if (!name || !icon) {
      return NextResponse.json({ error: "กรุณาระบุชื่อและไอคอน" }, { status: 400 });
    }

    const stationType = await prisma.stationType.update({
      where: { id },
      data: { name, icon, description: description || null },
    });

    return NextResponse.json({ data: stationType });
  } catch (error) {
    console.error("Update station type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/station-types/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only admins can delete station types" }, { status: 403 });

  try {
    const stationsUsing = await prisma.station.count({ where: { station_type_id: id } });
    if (stationsUsing > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ เนื่องจากมีสถานี ${stationsUsing} แห่งใช้ประเภทนี้อยู่` },
        { status: 400 }
      );
    }

    await prisma.stationType.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "ลบประเภทสถานีสำเร็จ" });
  } catch (error) {
    console.error("Delete station type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PUT /api/energy-types/[id] — update an energy type (admin/editor only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "VIEWER") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  try {
    const body = await request.json();
    const { name, icon, map_color } = body;

    if (!name || !icon || !map_color) {
      return NextResponse.json({ error: "กรุณาระบุชื่อ, ไอคอน และสีบนแผนที่" }, { status: 400 });
    }

    const energyType = await prisma.energyType.update({
      where: { id },
      data: { name, icon, map_color },
    });

    return NextResponse.json({ data: energyType });
  } catch (error) {
    console.error("Update energy type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/energy-types/[id] — delete an energy type (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only admins can delete energy types" }, { status: 403 });

  try {
    // Check if any stations are using this energy type
    const stationsUsing = await prisma.station.count({
      where: {
        energy_types: {
          has: id
        }
      }
    });

    if (stationsUsing > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ เนื่องจากมีสถานี ${stationsUsing} แห่งใช้พลังงานประเภทนี้อยู่` },
        { status: 400 }
      );
    }

    await prisma.energyType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "ลบประเภทพลังงานสำเร็จ" });
  } catch (error) {
    console.error("Delete energy type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PUT /api/charger-types/[id] — update charger type name
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "VIEWER") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อหัวจ่าย" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check duplicate
    const existing = await prisma.chargerType.findFirst({
      where: {
        name: trimmedName,
        id: { not: id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "ประเภทหัวจ่ายนี้มีอยู่แล้ว" }, { status: 400 });
    }

    const chargerType = await prisma.chargerType.update({
      where: { id },
      data: { name: trimmedName },
    });

    return NextResponse.json({ data: chargerType });
  } catch (error) {
    console.error("Update charger type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/charger-types/[id] — delete charger type
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Only admins can delete charger types" }, { status: 403 });

  try {
    // Check if any station is using this charger type
    const count = await prisma.stationCharger.count({
      where: { charger_type_id: id },
    });

    if (count > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ เนื่องจากมีสถานีบริการใช้ประเภทหัวจ่ายนี้อยู่ ${count} รายการ` },
        { status: 400 }
      );
    }

    await prisma.chargerType.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "ลบประเภทหัวจ่ายสำเร็จ" });
  } catch (error) {
    console.error("Delete charger type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

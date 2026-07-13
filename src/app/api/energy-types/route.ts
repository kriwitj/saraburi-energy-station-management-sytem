import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/energy-types
// Fetch all dynamic energy types
export async function GET() {
  try {
    const ets = await prisma.energyType.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ data: ets });
  } catch (error) {
    console.error("Fetch energy types error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/energy-types — create a new energy type (admin/editor only)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "VIEWER") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  try {
    const body = await request.json();
    const { id, name, icon, map_color, show_icon } = body;

    if (!id || !name || !icon || !map_color) {
      return NextResponse.json({ error: "กรุณาระบุ ID, ชื่อ, ไอคอน และสีบนแผนที่" }, { status: 400 });
    }

    // Validate ID format: uppercase letters, underscores only
    if (!/^[A-Z0-9_]+$/.test(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์ใหญ่, ตัวเลข, และ _ เท่านั้น" }, { status: 400 });
    }

    const energyType = await prisma.energyType.create({
      data: {
        id,
        name,
        icon,
        map_color,
        show_icon: show_icon !== undefined ? Boolean(show_icon) : true,
      },
    });

    return NextResponse.json({ data: energyType });
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("Unique constraint")) {
      return NextResponse.json({ error: "ID นี้มีอยู่แล้ว" }, { status: 409 });
    }
    console.error("Create energy type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

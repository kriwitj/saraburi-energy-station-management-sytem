import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/station-types — public, fetch all station types
export async function GET() {
  try {
    const types = await prisma.stationType.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json({ data: types });
  } catch (error) {
    console.error("Fetch station types error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/station-types — create (admin/editor only)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "VIEWER") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  try {
    const body = await request.json();
    const { id, name, icon, description } = body;

    if (!id || !name || !icon) {
      return NextResponse.json({ error: "กรุณาระบุ ID, ชื่อ และไอคอน" }, { status: 400 });
    }

    // Validate ID format: uppercase letters, underscores only
    if (!/^[A-Z_]+$/.test(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์ใหญ่และ _ เท่านั้น" }, { status: 400 });
    }

    const stationType = await prisma.stationType.create({
      data: { id, name, icon, description: description || null },
    });

    return NextResponse.json({ data: stationType });
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("Unique constraint")) {
      return NextResponse.json({ error: "ID นี้มีอยู่แล้ว" }, { status: 409 });
    }
    console.error("Create station type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

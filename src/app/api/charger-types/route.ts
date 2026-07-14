import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/charger-types — public, fetch all charger types
export async function GET() {
  try {
    const types = await prisma.chargerType.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ data: types });
  } catch (error) {
    console.error("Fetch charger types error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/charger-types — create (admin/editor only)
export async function POST(request: NextRequest) {
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
    const existing = await prisma.chargerType.findUnique({
      where: { name: trimmedName },
    });
    if (existing) {
      return NextResponse.json({ error: "ประเภทหัวจ่ายนี้มีอยู่แล้ว" }, { status: 400 });
    }

    const chargerType = await prisma.chargerType.create({
      data: { name: trimmedName },
    });

    return NextResponse.json({ data: chargerType }, { status: 201 });
  } catch (error) {
    console.error("Create charger type error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

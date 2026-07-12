import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/brands
// Fetch all brands
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: brands });
  } catch (error) {
    console.error("Fetch brands error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/brands
// Create a new brand (requires Authentication)
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
    const { name, short_name, logo_url } = body;

    if (!name || !short_name) {
      return NextResponse.json({ error: "กรุณาระบุชื่อและชื่อย่อแบรนด์" }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        short_name,
        logo_url: logo_url || null,
      },
    });

    return NextResponse.json({ data: brand });
  } catch (error) {
    console.error("Create brand error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

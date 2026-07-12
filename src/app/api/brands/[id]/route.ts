import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PUT /api/brands/[id]
// Update a brand (requires Authentication)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        short_name,
        logo_url: logo_url || null,
      },
    });

    return NextResponse.json({ data: brand });
  } catch (error) {
    console.error("Update brand error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/brands/[id]
// Delete a brand (requires Authentication)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete brands" }, { status: 403 });
  }

  try {
    // Check if any stations are using this brand
    const stationsUsing = await prisma.station.count({
      where: { brand_id: id },
    });

    if (stationsUsing > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบแบรนด์นี้ได้ เนื่องจากมีสถานีบริการเชื่อมโยงอยู่" },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "ลบแบรนด์สำเร็จ" });
  } catch (error) {
    console.error("Delete brand error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

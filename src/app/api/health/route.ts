import { NextResponse } from "next/server";

// GET /health — used by Docker healthcheck
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

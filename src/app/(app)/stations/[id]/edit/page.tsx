import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import StationForm from "@/components/forms/StationForm";
import { getAmphoeLabel } from "@/lib/constants";
import type { Station } from "@/types/station";

export const metadata = { title: "แก้ไขสถานี — Saraburi Energy" };

export default async function EditStationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role === "VIEWER") redirect("/dashboard");

  const { id } = await params;
  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      brand: true,
      station_type: true,
      chargers: {
        include: {
          charger_type: true,
        },
      },
    },
  });
  if (!station) notFound();

  // Serialize dates for client component
  const serialized: Station = {
    ...station,
    amphoe: getAmphoeLabel(station.amphoe),
    created_at: station.created_at.toISOString(),
    updated_at: station.updated_at.toISOString(),
  };

  return <StationForm initialData={serialized} isEdit />;
}

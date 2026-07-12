import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, FileText, Calendar, Pencil, ArrowLeft, ExternalLink } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { EnergyTypeBadgeList } from "@/components/shared/EnergyTypeBadge";
import { getAmphoeLabel } from "@/lib/constants";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const station = await prisma.station.findUnique({ where: { id } });
  return { title: station ? `${station.station_name} — Saraburi Energy` : "ไม่พบสถานี" };
}

export default async function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  const { id } = await params;
  const station = await prisma.station.findUnique({
    where: { id },
    include: { brand: true, station_type: true },
  });
  if (!station) notFound();

  const mapsUrl = station.google_map_url || `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
  const navUrl = station.google_map_url || `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2 text-sm touch-target" style={{ color: "#94a3b8" }}>
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>
        <div className="flex items-center gap-2">
          {session && session.role !== "VIEWER" && (
            <Link
              href={`/stations/${station.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium touch-target"
              style={{
                background: "rgba(14, 165, 233, 0.1)",
                color: "#0ea5e9",
                border: "1px solid rgba(14, 165, 233, 0.2)",
              }}
            >
              <Pencil className="w-4 h-4" />
              แก้ไข
            </Link>
          )}
          {session && session.role === "ADMIN" && (
            <DeleteConfirmDialog
              stationId={station.id}
              stationName={station.station_name}
            />
          )}
        </div>
      </div>

      {/* Image */}
      {station.image_url && (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: "240px" }}>
          <img
            src={station.image_url}
            alt={station.station_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Main Info */}
      <div className="glass-card p-5 space-y-4">
        <div>
          <EnergyTypeBadgeList types={station.energy_types} size="md" />
          <h1 className="text-xl font-bold text-white mt-2">{station.station_name}</h1>
        </div>

        {/* Brand, Type, & StationID Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/2 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">รหัสปั๊ม (ID)</span>
            <span className="font-mono font-bold text-sky-400 mt-1 block">{station.station_code || "-"}</span>
          </div>
          <div className="bg-white/2 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">แบรนด์</span>
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
              {station.brand?.logo_url ? (
                <img
                  src={station.brand.logo_url}
                  alt={station.brand.name}
                  className="w-4 h-4 object-contain rounded flex-shrink-0"
                />
              ) : (
                <span className="text-xs">🏷️</span>
              )}
              <span className="font-bold text-white truncate">{station.brand?.name || "ไม่ระบุ"}</span>
            </div>
          </div>
          <div className="bg-white/2 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">ประเภทสถานี</span>
            <span className="font-bold text-white mt-1 block truncate">
              {station.station_type ? `${station.station_type.icon} ${station.station_type.name}` : station.station_type_id}
            </span>
          </div>
        </div>

        {station.details && (
          <div className="flex gap-3">
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#0ea5e9" }} />
            <p className="text-sm" style={{ color: "#94a3b8" }}>{station.details}</p>
          </div>
        )}

        <div className="flex gap-3">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#00c9a7" }} />
          <div>
            <p className="text-sm text-white">
              ต.{station.tambon} อ.{getAmphoeLabel(station.amphoe)} จ.สระบุรี
            </p>
            {station.address_details && (
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>{station.address_details}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#64748b" }} />
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm transition-colors text-slate-400 hover:text-sky-400">
            {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
          </a>
        </div>

        <div className="flex gap-3">
          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#64748b" }} />
          <p className="text-xs" style={{ color: "#64748b" }}>
            บันทึกเมื่อ {new Date(station.created_at).toLocaleDateString("th-TH", {
              year: "numeric", month: "long", day: "numeric"
            })}
          </p>
        </div>
      </div>

      {/* Navigate Button */}
      <a
        href={navUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="navigate-btn"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-bold text-white touch-target"
        style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
      >
        <ExternalLink className="w-5 h-5" />
        นำทางไป Google Maps
      </a>
    </div>
  );
}

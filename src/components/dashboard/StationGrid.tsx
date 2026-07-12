import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";
import type { Station } from "@/types/station";
import { EnergyTypeBadgeList } from "@/components/shared/EnergyTypeBadge";
import { getAmphoeLabel } from "@/lib/constants";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";

interface StationGridProps {
  stations: Station[];
  userRole: string;
  onRefresh: () => void;
}

export default function StationGrid({ stations, userRole, onRefresh }: StationGridProps) {
  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">⛽</div>
        <p className="text-white font-semibold mb-1">ไม่พบข้อมูลสถานี</p>
        <p className="text-sm" style={{ color: "#64748b" }}>
          ลองเปลี่ยนคำค้นหาหรือตัวกรอง
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {stations.map((station) => (
        <div key={station.id} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all">
          {/* Image */}
          <div className="relative h-44 w-full" style={{ background: "#f1f5f9" }}>
            {station.image_url ? (
              <img
                src={station.image_url}
                alt={station.station_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-5xl opacity-20">⛽</span>
              </div>
            )}

            {/* Energy type overlay */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              <EnergyTypeBadgeList types={station.energy_types} />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-sky-600">{station.station_code || "-"}</span>
              <span className="text-[10px] font-bold text-slate-600 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                {station.station_type ? `${station.station_type.icon} ${station.station_type.name}` : station.station_type_id}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {station.brand?.logo_url && (
                <img
                  src={station.brand.logo_url}
                  alt={station.brand.name}
                  className="w-4.5 h-4.5 object-contain rounded flex-shrink-0"
                />
              )}
              <h3 className="font-bold text-slate-800 text-sm truncate flex-1 leading-tight">
                {station.station_name}
              </h3>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="text-xs font-medium truncate">
                ต.{station.tambon} • อ.{getAmphoeLabel(station.amphoe)}
              </span>
            </div>

            {station.details && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {station.details}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <Link
                href={`/stations/${station.id}`}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-center touch-target bg-sky-50 text-sky-600 border border-sky-200/60 hover:bg-sky-100 transition-all"
              >
                ดูรายละเอียด
              </Link>
              {userRole !== "VIEWER" && (
                <Link
                  href={`/stations/${station.id}/edit`}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium touch-target bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              )}
              {userRole === "ADMIN" && (
                <DeleteConfirmDialog
                  stationId={station.id}
                  stationName={station.station_name}
                  onDeleted={onRefresh}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

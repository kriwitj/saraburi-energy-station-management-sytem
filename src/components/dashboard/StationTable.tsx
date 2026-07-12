import Link from "next/link";
import { MapPin, Pencil, ExternalLink } from "lucide-react";
import type { Station } from "@/types/station";
import { EnergyTypeBadgeList } from "@/components/shared/EnergyTypeBadge";
import { getAmphoeLabel } from "@/lib/constants";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";

interface StationTableProps {
  stations: Station[];
  userRole: string;
  onRefresh: () => void;
}

export default function StationTable({ stations, userRole, onRefresh }: StationTableProps) {
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
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            {["รหัสปั๊ม (ID)", "แบรนด์", "ชื่อสถานี", "ประเภท", "ประเภทเชื้อเพลิง", "อำเภอ / ตำบล", "พิกัด", "Google Maps", ""].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                style={{ color: "#475569" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "#f1f5f9" }}>
          {stations.map((station) => (
            <tr
              key={station.id}
              className="transition-colors duration-150 border-b border-slate-100"
              style={{ color: "#334155" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background =
                  "rgba(15, 23, 42, 0.015)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
              }}
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-sky-600 font-bold">{station.station_code || "-"}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  {station.brand?.logo_url && (
                    <img
                      src={station.brand.logo_url}
                      alt={station.brand.name}
                      className="w-5 h-5 object-contain rounded flex-shrink-0"
                    />
                  )}
                  <span className="text-xs text-slate-700 font-semibold truncate">{station.brand?.name || "ไม่ระบุ"}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-bold text-sm text-slate-800 max-w-[200px] truncate">
                  {station.station_name}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-block text-[10px] font-bold text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                  {station.station_type ? `${station.station_type.icon} ${station.station_type.name}` : station.station_type_id}
                </span>
              </td>
              <td className="px-4 py-3">
                <EnergyTypeBadgeList types={station.energy_types} />
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-semibold">{getAmphoeLabel(station.amphoe)}</div>
                <div className="text-xs" style={{ color: "#64748b" }}>
                  ต.{station.tambon}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-xs text-slate-500 font-mono">
                  {station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}
                </div>
              </td>
              <td className="px-4 py-3">
                <a
                  href={`https://www.google.com/maps?q=${station.latitude},${station.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  เปิดแผนที่
                </a>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 justify-end">
                  <Link
                    href={`/stations/${station.id}`}
                    className="p-1.5 rounded-lg transition-colors touch-target"
                    style={{ color: "#0ea5e9" }}
                    title="ดูรายละเอียด"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  {userRole !== "VIEWER" && (
                    <Link
                      href={`/stations/${station.id}/edit`}
                      className="p-1.5 rounded-lg transition-colors touch-target"
                      style={{ color: "#94a3b8" }}
                      title="แก้ไข"
                    >
                      <Pencil className="w-4 h-4" />
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

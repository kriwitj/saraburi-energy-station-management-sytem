"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Station } from "@/types/station";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#0a1628" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm" style={{ color: "#64748b" }}>กำลังโหลดแผนที่...</p>
      </div>
    </div>
  ),
});

export default function MapPageClient() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stations?limit=500")
      .then((r) => r.json())
      .then((data) => { setStations(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 lg:left-64 top-14 lg:top-0 bottom-16 lg:bottom-0">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "#0a1628" }}>
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#64748b" }}>กำลังโหลดข้อมูลสถานี...</p>
          </div>
        </div>
      ) : (
        <MapView stations={stations} />
      )}
    </div>
  );
}

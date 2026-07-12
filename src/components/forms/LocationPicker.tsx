"use client";

import { useState, useCallback } from "react";
import { MapPin, Crosshair, Loader2 } from "lucide-react";

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLatChange,
  onLngChange,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("เบราว์เซอร์ของคุณไม่รองรับ Geolocation");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLatChange(position.coords.latitude.toFixed(6));
        onLngChange(position.coords.longitude.toFixed(6));
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("ไม่สามารถระบุตำแหน่งได้");
            break;
          case err.TIMEOUT:
            setError("หมดเวลาในการระบุตำแหน่ง กรุณาลองใหม่");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLatChange, onLngChange]);

  const mapsUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500">
          <span className="text-red-400">*</span> พิกัดสถานี (Lat/Long)
        </label>
        <div className="flex items-center gap-2">
          {(latitude || longitude) && (
            <button
              type="button"
              onClick={() => {
                onLatChange("");
                onLngChange("");
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all border border-slate-200 hover:border-slate-300 bg-slate-50 touch-target shadow-sm"
            >
              ล้างพิกัด
            </button>
          )}
          <button
            type="button"
            id="get-location-btn"
            onClick={getCurrentLocation}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all touch-target relative overflow-hidden"
            style={{
              background: loading
                ? "rgba(0, 201, 167, 0.1)"
                : "rgba(0, 201, 167, 0.08)",
              color: "#00c9a7",
              border: "1px solid rgba(0, 201, 167, 0.25)",
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
            {loading ? "กำลังดึงพิกัด..." : "ดึงพิกัดปัจจุบัน"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">
            ละติจูด (Latitude)
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => onLatChange(e.target.value)}
              placeholder="14.529481"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">
            ลองจิจูด (Longitude)
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => onLngChange(e.target.value)}
              placeholder="100.910217"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm"
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-xl text-red-600 bg-red-50 border border-red-100">
          {error}
        </p>
      )}

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 transition-colors font-medium"
        >
          <MapPin className="w-3 h-3" />
          ดูตำแหน่งใน Google Maps
        </a>
      )}
    </div>
  );
}

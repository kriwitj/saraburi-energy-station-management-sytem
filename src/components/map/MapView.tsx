"use client";

import { useEffect, useRef, useState } from "react";
import type { Station } from "@/types/station";
import {
  AMPHOE_LIST,
  AMPHOE_CENTERS,
  SARABURI_CENTER,
  SARABURI_DEFAULT_ZOOM,
  SARABURI_DISTRICT_ZOOM,
  ENERGY_TYPE_CONFIG,
  getAmphoeLabel,
  type EnergyTypeKey,
} from "@/lib/constants";
import type { Amphoe } from "@prisma/client";

interface MapViewProps {
  stations: Station[];
  selectedStation?: Station | null;
  onSelectStation?: (station: Station | null) => void;
  userLocation?: [number, number] | null;
  selectedType?: string;
  energyTypes?: any[];
}

export default function MapView({
  stations,
  selectedStation: externalSelectedStation,
  onSelectStation,
  userLocation,
  selectedType,
  energyTypes,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  const [selectedAmphoe, setSelectedAmphoe] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Sync external selection
  useEffect(() => {
    if (externalSelectedStation !== undefined) {
      setSelectedStation(externalSelectedStation);
    }
  }, [externalSelectedStation]);

  // Fly to selected station
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !selectedStation) return;
    leafletMapRef.current.flyTo(
      [selectedStation.latitude, selectedStation.longitude],
      16,
      {
        duration: 1.5,
        easeLinearity: 0.25,
      }
    );
  }, [mapReady, selectedStation]);

  // Place User Location Marker
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;

    import("leaflet").then((L) => {
      const map = leafletMapRef.current;

      // Remove old user location marker
      map.eachLayer((layer: any) => {
        if (layer.options?.isUserLocationMarker) {
          map.removeLayer(layer);
        }
      });

      if (!userLocation) return;

      const userIcon = L.divIcon({
        className: "",
        html: `
          <div style="
            position: relative;
            width: 18px;
            height: 18px;
            background: #0ea5e9;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(14, 165, 233, 0.8);
          ">
            <div class="pulse-ring" style="
              position: absolute;
              left: -3px;
              top: -3px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker(userLocation, {
        icon: userIcon,
        // @ts-expect-error - custom option
        isUserLocationMarker: true,
      }).addTo(map);

      // Pan to user location when it first arrives
      map.flyTo(userLocation, 14, { duration: 1.5 });
    });
  }, [mapReady, userLocation]);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    import("leaflet").then((L) => {
      // Fix Leaflet icon in Next.js
      // @ts-expect-error - Leaflet typing issue
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: SARABURI_CENTER,
        zoom: SARABURI_DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 150,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      // Add zoom control at bottomright (Google Maps style)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Draw Saraburi Province boundary polygon dynamically
      fetch("/saraburi_boundary.json")
        .then((res) => res.json())
        .then((boundaryCoords) => {
          L.polygon(boundaryCoords, {
            color: "#0ea5e9",
            weight: 3,
            opacity: 0.7,
            fillColor: "#0ea5e9",
            fillOpacity: 0.05,
            dashArray: "5, 10",
            interactive: false,
          } as any).addTo(map);
        })
        .catch((err) => console.error("Failed to load Saraburi boundary GeoJSON:", err));

      leafletMapRef.current = map;
      setMapReady(true);
    });

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Place markers
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;

    // Build dynamic lookup configuration from db energyTypes
    const dynamicConfigs = (energyTypes && energyTypes.length > 0)
      ? energyTypes.reduce((acc, et) => {
          acc[et.id] = {
            label: et.name,
            icon: et.icon,
            mapColor: et.map_color,
            showIcon: et.show_icon !== undefined ? et.show_icon : true,
          };
          return acc;
        }, {} as any)
      : null;

    import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      // Remove old markers
      map.eachLayer((layer: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((layer as any).options?.isStationMarker) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.removeLayer(layer as any);
        }
      });

      stations.forEach((station) => {
        // Determine color from selectedType or first energy type
        const highlightType = (selectedType && station.energy_types.includes(selectedType))
          ? selectedType
          : (station.energy_types[0] || "OIL");

        const config = dynamicConfigs?.[highlightType]
          || ENERGY_TYPE_CONFIG[highlightType as EnergyTypeKey];

        const color = config?.mapColor ?? config?.map_color ?? "#64748b";
        const iconSymbol = config?.icon ?? "⛽";
        
        // Use showIcon from database config: if true, show symbol inside 22px circle. Else show 12px dot.
        const shouldShowIcon = config?.showIcon !== undefined ? config.showIcon : true;

        const size = shouldShowIcon ? 22 : 12;
        const radius = size / 2;

        const htmlContent = shouldShowIcon
          ? `<div style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              background: ${color};
              border: 1.5px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              line-height: 1;
            ">${iconSymbol}</div>`
          : `<div style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              background: ${color};
              border: 1.5px solid white;
              box-shadow: 0 1.5px 3.5px rgba(0,0,0,0.4);
            "></div>`;

        const icon = L.divIcon({
          className: "",
          html: htmlContent,
          iconSize: [size, size],
          iconAnchor: [radius, radius],
          popupAnchor: [0, -radius],
        });

        const marker = L.marker([station.latitude, station.longitude], {
          icon,
          // @ts-expect-error - custom option
          isStationMarker: true,
        }).addTo(map);

        marker.on("click", () => {
          setSelectedStation(station);
          if (onSelectStation) {
            onSelectStation(station);
          }
        });
      });
    });
  }, [mapReady, stations, selectedType, energyTypes]);

  // FlyTo district
  function handleAmphoeChange(value: string) {
    setSelectedAmphoe(value);
    if (value && leafletMapRef.current) {
      const center = AMPHOE_CENTERS[value as Amphoe];
      if (center) {
        leafletMapRef.current.flyTo(center, SARABURI_DISTRICT_ZOOM, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row gap-2 pointer-events-none">
        {/* District selector */}
        <div className="pointer-events-auto">
          <select
            id="map-amphoe-select"
            value={selectedAmphoe}
            onChange={(e) => handleAmphoeChange(e.target.value)}
            className="text-sm py-2.5 px-3 rounded-xl touch-target"
            style={{
              background: "rgba(15, 32, 68, 0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#f1f5f9",
              backdropFilter: "blur(12px)",
              minWidth: "160px",
            }}
          >
            <option value="" style={{ color: "#334155" }}>🗺 ทุกอำเภอ</option>
            {AMPHOE_LIST.map((a) => (
              <option key={a.value} value={a.value} style={{ color: "#334155" }}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Station count */}
        <div className="pointer-events-none px-3 py-2 rounded-xl text-sm font-medium"
          style={{
            background: "rgba(15, 32, 68, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8",
            backdropFilter: "blur(12px)",
            alignSelf: "flex-start",
          }}>
          📍 {stations.length} สถานี
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-16 sm:bottom-4 left-4 z-[1000] p-3 rounded-xl text-xs"
        style={{
          background: "rgba(15, 32, 68, 0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
        }}>
        {(Object.entries(ENERGY_TYPE_CONFIG) as [EnergyTypeKey, (typeof ENERGY_TYPE_CONFIG)[EnergyTypeKey]][]).map(
          ([key, config]) => (
            <div key={key} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: config.mapColor }} />
              <span style={{ color: "#94a3b8" }}>{config.label}</span>
            </div>
          )
        )}
      </div>

      {/* Station Info Panel */}
      {selectedStation && (
        <div
          className="absolute bottom-16 sm:bottom-4 right-4 z-[1000] rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15, 32, 68, 0.97)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
            width: "280px",
            maxHeight: "380px",
          }}
        >
          {/* Image */}
          {selectedStation.image_url && (
            <div className="relative w-full h-36">
              <img
                src={selectedStation.image_url}
                alt={selectedStation.station_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f2044] to-transparent" />
            </div>
          )}

          <div className="p-4">
            {/* Energy badges */}
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedStation.energy_types.map((type) => {
                const config = ENERGY_TYPE_CONFIG[type as EnergyTypeKey];
                return config ? (
                  <span key={type} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${config.mapColor}22`, color: config.mapColor, border: `1px solid ${config.mapColor}44` }}>
                    {config.icon} {config.label}
                  </span>
                ) : null;
              })}
            </div>

            <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">
              {selectedStation.station_name}
            </h3>
            <p className="text-xs mb-3" style={{ color: "#64748b" }}>
              ต.{selectedStation.tambon} • {getAmphoeLabel(selectedStation.amphoe)}
            </p>

            <div className="flex gap-2">
              <a href={`/stations/${selectedStation.id}`}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-center"
                style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)" }}>
                รายละเอียด
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl text-xs font-medium text-center"
                style={{ background: "rgba(0,201,167,0.15)", color: "#00c9a7", border: "1px solid rgba(0,201,167,0.2)" }}>
                นำทาง
              </a>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelectedStation(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-lg"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

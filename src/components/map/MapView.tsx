"use client";

import { useEffect, useRef, useState } from "react";
import type { Station } from "@/types/station";
import {
  AMPHOE_LIST,
  AMPHOE_CENTERS,
  AMPHOE_MAP_TO_ENUM,
  SARABURI_CENTER,
  SARABURI_DEFAULT_ZOOM,
  SARABURI_DISTRICT_ZOOM,
  ENERGY_TYPE_CONFIG,
  getAmphoeLabel,
  type EnergyTypeKey,
  CARTO_BASEMAP_URL,
} from "@/lib/constants";
import type { Amphoe } from "@prisma/client";
import { Layers } from "lucide-react";

export interface BasemapOption {
  id: string;
  name: string;
  url: string;
  subdomains: string | string[];
  maxZoom: number;
}

export const MAP_BASEMAPS: Record<string, BasemapOption> = {
  GOOGLE_THAI: {
    id: "google_thai",
    name: "🇹🇭 แผนที่ภาษาไทย (Google)",
    url: "https://mt{s}.google.com/vt/lyrs=m&hl=th&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 20,
  },
  OSM_THAI: {
    id: "osm_thai",
    name: "🗺️ OpenStreetMap (ไทย)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
  },
  CARTO_VOYAGER: {
    id: "carto_voyager",
    name: "🎨 CARTO Voyager",
    url: CARTO_BASEMAP_URL,
    subdomains: "abcd",
    maxZoom: 19,
  },
  GOOGLE_SATELLITE: {
    id: "google_satellite",
    name: "🛰️ ดาวเทียม (Satellite)",
    url: "https://mt{s}.google.com/vt/lyrs=y&hl=th&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 20,
  },
};

export const DEFAULT_BASEMAP = MAP_BASEMAPS.GOOGLE_THAI;

interface MapViewProps {
  stations: Station[];
  selectedStation?: Station | null;
  onSelectStation?: (station: Station | null) => void;
  userLocation?: [number, number] | null;
  selectedType?: string;
  energyTypes?: any[];
  selectedAmphoe?: string;
  hideDistrictSelect?: boolean;
  hideStationPanel?: boolean;
  flyToUserLocationTrigger?: number;
}

export default function MapView({
  stations,
  selectedStation: externalSelectedStation,
  onSelectStation,
  userLocation,
  selectedType,
  energyTypes,
  selectedAmphoe: externalSelectedAmphoe,
  hideDistrictSelect = false,
  hideStationPanel = false,
  flyToUserLocationTrigger,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null);

  const [selectedAmphoe, setSelectedAmphoe] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState<string>("GOOGLE_THAI");
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);

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

  // Sync external Amphoe selection and fly to district
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;
    if (externalSelectedAmphoe) {
      const center =
        AMPHOE_CENTERS[externalSelectedAmphoe as Amphoe] ||
        (AMPHOE_MAP_TO_ENUM[externalSelectedAmphoe] ? AMPHOE_CENTERS[AMPHOE_MAP_TO_ENUM[externalSelectedAmphoe]] : null);
      if (center) {
        leafletMapRef.current.flyTo(center, SARABURI_DISTRICT_ZOOM, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    } else if (externalSelectedAmphoe === "") {
      leafletMapRef.current.flyTo(SARABURI_CENTER, SARABURI_DEFAULT_ZOOM, {
        duration: 1.2,
      });
    }
  }, [mapReady, externalSelectedAmphoe]);

  // Fly to user location when requested
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !userLocation || !flyToUserLocationTrigger) return;
    leafletMapRef.current.flyTo(userLocation, 16, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [mapReady, flyToUserLocationTrigger, userLocation]);

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
        className: "custom-user-marker",
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(14, 165, 233, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #0ea5e9; border: 2.5px solid white; box-shadow: 0 0 10px rgba(14, 165, 233, 0.8); z-index: 10;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(userLocation, {
        icon: userIcon,
        // @ts-expect-error - custom option
        isUserLocationMarker: true,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-size: 12px; font-weight: bold; color: #0f172a; text-align: center; padding: 4px;">📍 ตำแหน่งของคุณ</div>`,
          { closeButton: false }
        );
    });
  }, [mapReady, userLocation]);

  // Initialize Map
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

      const initialBase = MAP_BASEMAPS[activeBasemap] || DEFAULT_BASEMAP;
      const tileLayer = L.tileLayer(initialBase.url, {
        maxZoom: initialBase.maxZoom,
        subdomains: initialBase.subdomains,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

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

  // Switch Basemap dynamically
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;

    import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const selectedBase = MAP_BASEMAPS[activeBasemap] || DEFAULT_BASEMAP;
      const newTileLayer = L.tileLayer(selectedBase.url, {
        maxZoom: selectedBase.maxZoom,
        subdomains: selectedBase.subdomains,
      }).addTo(map);

      newTileLayer.bringToBack();
      tileLayerRef.current = newTileLayer;
    });
  }, [activeBasemap, mapReady]);

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
            showIcon: et.show_icon !== false,
          };
          return acc;
        }, {} as Record<string, { label: string; icon: string; mapColor: string; showIcon?: boolean }>)
      : null;

    import("leaflet").then((L) => {
      const map = leafletMapRef.current;

      // Remove existing markers
      map.eachLayer((layer: any) => {
        if (layer.options?.isStationMarker) {
          map.removeLayer(layer);
        }
      });

      stations.forEach((station) => {
        // Filter by energy type if specified
        if (selectedType && !station.energy_types.includes(selectedType)) {
          return;
        }

        // Determine pin appearance
        const primaryType = station.energy_types[0] as EnergyTypeKey;
        const config = dynamicConfigs
          ? (dynamicConfigs[primaryType] || { label: primaryType, icon: "📍", mapColor: "#64748b", showIcon: false })
          : (ENERGY_TYPE_CONFIG[primaryType] || { label: primaryType, icon: "📍", mapColor: "#64748b", showIcon: false });

        const isChargingHub = station.station_type_id === "CHARGING_HUB";
        const hasEv = station.energy_types.includes("EV");
        const isOil = station.energy_types.includes("OIL");

        let color = config.mapColor;
        let iconSymbol = config.icon;

        if (isChargingHub) {
          color = "#00c9a7";
          iconSymbol = "⚡";
        } else if (hasEv && isOil) {
          color = "#0ea5e9";
        }

        const showIconOnMarker = config.showIcon !== false;
        const size = showIconOnMarker ? 24 : 14;
        const radius = size / 2;

        const htmlContent = showIconOnMarker
          ? `<div style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              background: ${color};
              border: 2px solid white;
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
      <div className={`absolute top-4 ${hideDistrictSelect ? "right-4" : "left-4 right-4"} z-[1000] flex flex-col sm:flex-row items-end sm:items-center justify-between gap-2 pointer-events-none`}>
        {/* District selector */}
        {!hideDistrictSelect && (
          <div className="pointer-events-auto">
            <select
              id="map-amphoe-select"
              value={selectedAmphoe}
              onChange={(e) => handleAmphoeChange(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl touch-target"
              style={{
                background: "rgba(15, 32, 68, 0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: selectedAmphoe ? "#f1f5f9" : "#94a3b8",
                backdropFilter: "blur(12px)",
              }}
            >
              <option value="" style={{ color: "#334155" }}>🗺 ทุกอำเภอ</option>
              {AMPHOE_LIST.map((a) => (
                <option key={a.value} value={a.value} style={{ color: "#334155" }}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Basemap Style Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold touch-target transition-all shadow-lg"
              style={{
                background: "rgba(15, 32, 68, 0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#f1f5f9",
                backdropFilter: "blur(12px)",
              }}
              title="เปลี่ยนรูปแบบแผนที่"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">
                {MAP_BASEMAPS[activeBasemap]?.name || "รูปแบบแผนที่"}
              </span>
            </button>

            {showBasemapMenu && (
              <div
                className="absolute right-0 mt-1.5 w-56 rounded-xl shadow-2xl border overflow-hidden z-[1100] animate-in fade-in duration-150"
                style={{
                  background: "rgba(15, 32, 68, 0.98)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="px-3 py-2 border-b border-white/10 text-[10px] font-bold uppercase text-slate-400">
                  เลือกรูปแบบแผนที่
                </div>
                <div className="p-1 space-y-0.5">
                  {Object.entries(MAP_BASEMAPS).map(([key, opt]) => {
                    const isSelected = activeBasemap === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveBasemap(key);
                          setShowBasemapMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{opt.name}</span>
                        {isSelected && <span className="text-sky-400 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Station count */}
          {!hideDistrictSelect && (
            <div
              className="pointer-events-none px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                background: "rgba(15, 32, 68, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                backdropFilter: "blur(12px)",
              }}
            >
              📍 {stations.length} สถานี
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-16 sm:bottom-4 left-4 z-[1000] p-3 rounded-xl text-xs"
        style={{
          background: "rgba(15, 32, 68, 0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        {(Object.entries(ENERGY_TYPE_CONFIG) as [EnergyTypeKey, (typeof ENERGY_TYPE_CONFIG)[EnergyTypeKey]][]).map(
          ([key, config]) => (
            <div key={key} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: config.mapColor }} />
              <span style={{ color: "#94a3b8" }}>{config.label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

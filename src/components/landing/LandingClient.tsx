"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Zap,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  Navigation,
  Users,
  Shield,
  UserCheck,
  Eye as EyeIcon,
  ChevronUp,
  ChevronDown,
  Info,
  Calendar,
  FileText,
} from "lucide-react";
import type { Station, SessionUser, User as DBUser } from "@/types/station";
import {
  AMPHOE_LIST,
  ENERGY_TYPE_CONFIG,
  getAmphoeLabel,
  ROLE_LABELS,
} from "@/lib/constants";
import type { EnergyTypeKey } from "@/lib/constants";
import { EnergyTypeBadgeList } from "@/components/shared/EnergyTypeBadge";
import LocationPicker from "@/components/forms/LocationPicker";
import ImageUploader from "@/components/forms/ImageUploader";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { ENERGY_TYPES } from "@/lib/validations";
import type { Role } from "@prisma/client";

// Dynamic import for Leaflet map to prevent SSR window reference error
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a1628]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">กำลังโหลดแผนที่อัจฉริยะ...</p>
      </div>
    </div>
  ),
});

interface LandingClientProps {
  initialStations: Station[];
  session: SessionUser | null;
}

type PanelView = "search" | "detail" | "create" | "edit";

export default function LandingClient({ initialStations, session: initialSession }: LandingClientProps) {
  const router = useRouter();

  // App States
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [session, setSession] = useState<SessionUser | null>(initialSession);
  const [activeView, setActiveView] = useState<PanelView>("search");
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAmphoe, setSelectedAmphoe] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Modals State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);

  // Mobile Bottom Sheet State
  // heightState: 'collapsed' (h-14), 'half' (h-1/2), 'full' (h-[85vh])
  const [mobileSheetHeight, setMobileSheetHeight] = useState<"collapsed" | "half" | "full">("half");

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  // Metadata dynamic states
  const [brands, setBrands] = useState<{ id: string; name: string; short_name: string; logo_url: string | null }[]>([]);
  const [energyTypes, setEnergyTypes] = useState<{ id: string; name: string; icon: string; map_color: string; show_icon?: boolean }[]>([]);
  const [stationTypes, setStationTypes] = useState<{ id: string; name: string; icon: string }[]>([]);

  // Form State (For Add/Edit Station)
  const [formPending, startFormTransition] = useTransition();
  const [stationForm, setStationForm] = useState({
    id: "",
    station_code: "",
    station_name: "",
    station_type_id: "STATION",
    brand_id: "",
    energy_types: [] as string[],
    details: "",
    latitude: "",
    longitude: "",
    amphoe: "",
    tambon: "",
    address_details: "",
    image_url: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Login Form State
  const [loginPending, startLoginTransition] = useTransition();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Admin Users List State
  const [adminUsers, setAdminUsers] = useState<DBUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ username: "", password: "", name: "", role: "EDITOR" as Role });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});

  // Refresh stations data
  async function refreshStations() {
    try {
      const res = await fetch("/api/stations?limit=500");
      const data = await res.json();
      if (data.data) {
        setStations(data.data);
      }
    } catch (e) {
      console.error("Refresh error:", e);
    }
  }

  // Fetch admin users list
  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.data) setAdminUsers(data.data);
    } catch {
      toast.error("โหลดรายชื่อผู้ใช้ล้มเหลว");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (showUsersModal) fetchUsers();
  }, [showUsersModal]);

  // Client-side stats computation
  const stats = useMemo(() => {
    return {
      total: stations.length,
      oil: stations.filter((s) => s.energy_types.includes("OIL")).length,
      lpg: stations.filter((s) => s.energy_types.includes("LPG")).length,
      ngv: stations.filter((s) => s.energy_types.includes("NGV")).length,
      ev: stations.filter((s) => s.energy_types.includes("EV")).length,
    };
  }, [stations]);

  // Auto-get GPS location silently on mount to enable distance calculation and sorting immediately
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.warn("Initial GPS fetch skipped/denied:", err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Load dynamic Brands, EnergyTypes and StationTypes on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [resBrands, resEts, resSts] = await Promise.all([
          fetch("/api/brands"),
          fetch("/api/energy-types"),
          fetch("/api/station-types"),
        ]);
        const brandsData = await resBrands.json();
        const etsData = await resEts.json();
        const stsData = await resSts.json();
        if (brandsData.data) setBrands(brandsData.data);
        if (etsData.data) setEnergyTypes(etsData.data);
        if (stsData.data) setStationTypes(stsData.data);
      } catch (error) {
        console.error("Failed to load map metadata:", error);
      }
    }
    fetchMetadata();
  }, []);

  // Instant client-side filtering & distance-based sorting
  const filteredStations = useMemo(() => {
    const filtered = stations.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tambon.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.details && s.details.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAmphoe = !selectedAmphoe || s.amphoe === selectedAmphoe || getAmphoeLabel(s.amphoe) === selectedAmphoe;
      const matchType = !selectedType || s.energy_types.includes(selectedType);

      return matchSearch && matchAmphoe && matchType;
    });

    // Map distance and sort if user's location is resolved
    if (userLocation) {
      const mapped = filtered.map((s) => ({
        ...s,
        distance: calculateDistance(
          userLocation[0],
          userLocation[1],
          s.latitude,
          s.longitude
        ),
      }));
      return mapped.sort((a, b) => a.distance - b.distance);
    }

    return filtered;
  }, [stations, searchQuery, selectedAmphoe, selectedType, userLocation]);

  // Select station handler (from list or map marker click)
  function handleSelectStation(station: Station | null) {
    setSelectedStation(station);
    if (station) {
      setActiveView("detail");
      setMobileSheetHeight("half");
    } else {
      setActiveView("search");
    }
  }

  // Login handler
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    startLoginTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginForm),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "ล็อกอินล้มเหลว");
          return;
        }
        setSession(data.user);
        setShowLoginModal(false);
        setLoginForm({ username: "", password: "" });
        toast.success(`ยินดีต้อนรับ, ${data.user.name}`);
        router.refresh();
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    });
  }

  // Logout handler
  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    setSession(null);
    setActiveView("search");
    toast.success("ออกจากระบบเรียบร้อยแล้ว");
    router.refresh();
  }

  // Edit station action initiator
  function startEditStation(station: Station) {
    setStationForm({
      id: station.id,
      station_code: station.station_code || "",
      station_name: station.station_name,
      station_type_id: station.station_type_id || "STATION",
      brand_id: station.brand_id || "",
      energy_types: station.energy_types,
      details: station.details || "",
      latitude: station.latitude.toString(),
      longitude: station.longitude.toString(),
      amphoe: station.amphoe,
      tambon: station.tambon,
      address_details: station.address_details || "",
      image_url: station.image_url || "",
    });
    setFormErrors({});
    setActiveView("edit");
    setMobileSheetHeight("full");
  }

  // Add station action initiator
  function startCreateStation() {
    setStationForm({
      id: "",
      station_code: "",
      station_name: "",
      station_type_id: "STATION",
      brand_id: "",
      energy_types: [],
      details: "",
      latitude: "",
      longitude: "",
      amphoe: "",
      tambon: "",
      address_details: "",
      image_url: "",
    });
    setFormErrors({});
    setActiveView("create");
    setMobileSheetHeight("full");
  }

  // Validate station form
  function validateStationForm() {
    const errs: Record<string, string> = {};
    if (!stationForm.station_name.trim()) errs.station_name = "กรุณากรอกชื่อสถานี";
    if (!stationForm.station_code.trim()) errs.station_code = "กรุณากรอกรหัสปั๊ม (StationID)";
    if (!stationForm.brand_id) errs.brand_id = "กรุณาเลือกแบรนด์ปั๊ม";
    if (!stationForm.station_type_id) errs.station_type_id = "กรุณาเลือกประเภทสถานี";
    if (stationForm.energy_types.length === 0) errs.energy_types = "เลือกประเภทพลังงานอย่างน้อย 1 อย่าง";
    if (!stationForm.latitude) errs.latitude = "กรุณาระบุละติจูด";
    if (!stationForm.longitude) errs.longitude = "กรุณาระบุลองจิจูด";
    if (!stationForm.amphoe) errs.amphoe = "เลือกอำเภอ";
    if (!stationForm.tambon.trim()) errs.tambon = "ระบุตำบล";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Handle save/create station
  function handleSaveStation(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStationForm()) return;

    startFormTransition(async () => {
      try {
        const isEdit = activeView === "edit";
        const url = isEdit ? `/api/stations/${stationForm.id}` : "/api/stations";
        const method = isEdit ? "PUT" : "POST";

        const payload = {
          ...stationForm,
          latitude: parseFloat(stationForm.latitude),
          longitude: parseFloat(stationForm.longitude),
          image_url: stationForm.image_url || undefined,
          details: stationForm.details || undefined,
          address_details: stationForm.address_details || undefined,
        };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "บันทึกล้มเหลว");
          return;
        }

        toast.success(isEdit ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มสถานีสำเร็จ");
        await refreshStations();
        
        if (isEdit) {
          setSelectedStation(data.data);
          setActiveView("detail");
        } else {
          setActiveView("search");
        }
        setMobileSheetHeight("half");
      } catch {
        toast.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
      }
    });
  }

  // Admin: create user handler
  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const e_errs: Record<string, string> = {};
    if (!createUserForm.username || createUserForm.username.length < 3) e_errs.username = "ขั้นต่ำ 3 ตัวอักษร";
    if (!createUserForm.password || createUserForm.password.length < 6) e_errs.password = "ขั้นต่ำ 6 ตัวอักษร";
    if (!createUserForm.name) e_errs.name = "ระบุชื่อผู้ใช้";
    setUserFormErrors(e_errs);
    if (Object.keys(e_errs).length > 0) return;

    startFormTransition(async () => {
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createUserForm),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success("สร้างบัญชีผู้ใช้ใหม่สำเร็จ");
        setCreateUserForm({ username: "", password: "", name: "", role: "EDITOR" });
        setShowAddUserForm(false);
        fetchUsers();
      } catch {
        toast.error("เชื่อมต่อล้มเหลว");
      }
    });
  }

  // Admin: delete user handler
  async function handleDeleteUser(id: string, name: string) {
    if (!confirm(`ต้องการลบผู้ใช้ "${name}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("ลบล้มเหลว"); return; }
      toast.success("ลบผู้ใช้สำเร็จ");
      fetchUsers();
    } catch {
      toast.error("เชื่อมต่อล้มเหลว");
    }
  }

  // Admin: update user role handler
  async function handleUpdateUserRole(id: string, role: Role) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { toast.error("อัปเดตล้มเหลว"); return; }
      toast.success("อัปเดตบทบาทสำเร็จ");
      fetchUsers();
    } catch {
      toast.error("เชื่อมต่อล้มเหลว");
    }
  }

  // Clear filters
  const hasFiltersActive = searchQuery || selectedAmphoe || selectedType;

  function clearFilters() {
    setSearchQuery("");
    setSelectedAmphoe("");
    setSelectedType("");
  }

  // Haversine distance formula (in km)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get user's current GPS location
  function getUserGPSLocation(callback?: (coords: [number, number]) => void) {
    if (!navigator.geolocation) {
      toast.error("เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด");
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        setLocatingUser(false);
        toast.success("ระบุตำแหน่งของคุณสำเร็จ");
        if (callback) callback(coords);
      },
      (err) => {
        setLocatingUser(false);
        console.error("GPS error:", err);
        toast.error("ไม่สามารถดึงตำแหน่งได้ กรุณาเปิดสิทธิ์ระบุพิกัดในเบราว์เซอร์");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Find the nearest station from the user's location
  function findNearestStation(coordsToUse?: [number, number]) {
    const activeCoords = coordsToUse || userLocation;
    
    if (!activeCoords) {
      // If user location isn't loaded yet, fetch it first, then find the nearest
      getUserGPSLocation((coords) => {
        findNearestStation(coords);
      });
      return;
    }

    if (stations.length === 0) {
      toast.error("ไม่มีข้อมูลสถานีในระบบ");
      return;
    }

    // Calculate distance to each station
    const stationsWithDistance = stations.map((s) => {
      const dist = calculateDistance(
        activeCoords[0],
        activeCoords[1],
        s.latitude,
        s.longitude
      );
      return { station: s, dist };
    });

    // Sort by distance ascending
    stationsWithDistance.sort((a, b) => a.dist - b.dist);

    const nearest = stationsWithDistance[0];
    handleSelectStation(nearest.station);
    toast.success(
      `สถานีที่ใกล้ที่สุดคือ: "${nearest.station.station_name}" (ห่างออกไป ${nearest.dist.toFixed(2)} กม.)`
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col" style={{ background: "#0a1628" }}>
      
      {/* 1. Header (Premium Floating / Top Navbar) */}
      <header
        className="relative z-[1050] h-14 border-b backdrop-blur-md flex items-center justify-between px-4"
        style={{ background: "rgba(15, 32, 68, 0.85)", borderColor: "rgba(255, 255, 255, 0.08)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xs sm:text-sm text-white">Saraburi Energy Hub</h1>
            <p className="text-[9px] text-slate-400">ระบบแผนที่อัจฉริยะ (Google Maps Style)</p>
          </div>
        </div>

        {/* Action Panel: Login/User details */}
        <div className="flex items-center gap-2">
          <Link
            href="/api-docs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors border border-white/10 hover:border-white/20 touch-target"
            style={{ background: "rgba(255, 255, 255, 0.03)" }}
          >
            <FileText className="w-4 h-4 text-[#0ea5e9]" />
            <span className="hidden sm:inline">ดึงข้อมูลผ่าน API</span>
            <span className="sm:hidden">API Docs</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-2">
              {/* Admin users list trigger */}
              {session.role === "ADMIN" && (
                <button
                  onClick={() => setShowUsersModal(true)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white transition-colors touch-target"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  title="จัดการผู้ใช้งาน"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              {/* Profile display & log out */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-white">{session.name}</span>
                <span className="text-[9px] text-[#0ea5e9] font-medium">{session.role}</span>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}>
                {session.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-red-400 hover:text-red-300 transition-colors touch-target"
                style={{ background: "rgba(239,68,68,0.1)" }}
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white touch-target transition-all"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
            >
              <LogIn className="w-4.5 h-4.5" />
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </header>

      {/* 2. Interactive Map Container (Full Screen Layout) */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Full-width Map Background */}
        <div className="absolute inset-0 z-0">
          <MapView
            stations={filteredStations}
            selectedStation={selectedStation}
            onSelectStation={handleSelectStation}
            userLocation={userLocation}
            selectedType={selectedType}
            energyTypes={energyTypes}
          />
        </div>

        {/* Floating GPS Button on Map */}
        <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => getUserGPSLocation()}
            disabled={locatingUser}
            className="p-3 rounded-full bg-[#0f2044]/90 backdrop-blur-md border border-white/10 text-white shadow-xl touch-target transition-all hover:bg-[#162850]"
            title="ระบุพิกัดของฉัน"
          >
            <Navigation className={`w-5 h-5 ${locatingUser ? "animate-spin text-[#0ea5e9]" : "text-white"}`} />
          </button>
        </div>

        {/* 3. Floating Sidebar Panel (Desktop: Left Side Over Map) */}
        <aside
          className="hidden lg:flex absolute left-4 top-4 bottom-4 w-[380px] z-[1000] flex-col pointer-events-none"
        >
          <div
            className="w-full h-full flex flex-col pointer-events-auto rounded-2xl border shadow-2xl overflow-hidden"
            style={{
              background: "rgba(15, 32, 68, 0.92)",
              borderColor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* VIEW 1: SEARCH & RESULTS */}
            {activeView === "search" && (
              <div className="flex flex-col h-full">
                {/* Search Bar Block */}
                <div className="p-4 border-b space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">ค้นหาสถานีพลังงาน</span>
                    {/* Add button removed */}
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ป้อนชื่อสถานี, ตำบล..."
                      className="input-dark w-full pl-9 pr-3 py-2.5 text-xs"
                      style={{ borderRadius: "10px" }}
                    />
                  </div>

                  {/* Dropdown Filters */}
                  <div className="grid grid-cols-1 gap-2">
                    <select
                      value={selectedAmphoe}
                      onChange={(e) => setSelectedAmphoe(e.target.value)}
                      className="input-dark w-full px-3 py-2 text-xs"
                      style={{ color: selectedAmphoe ? "#f1f5f9" : "#64748b", borderRadius: "8px" }}
                    >
                      <option value="" style={{ color: "#334155" }}>🗺 ทุกอำเภอ</option>
                      {AMPHOE_LIST.map((a) => (
                        <option key={a.value} value={a.value} style={{ color: "#334155" }}>{a.label}</option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-1">
                      {energyTypes.length > 0
                        ? energyTypes.map((et) => {
                            const isActive = selectedType === et.id;
                            return (
                              <button
                                key={et.id}
                                onClick={() => setSelectedType(isActive ? "" : et.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all touch-target"
                                style={{
                                  background: isActive ? `${et.map_color}33` : `${et.map_color}11`,
                                  color: isActive ? et.map_color : "#64748b",
                                  border: isActive ? `1px solid ${et.map_color}66` : "1px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <span>{et.icon}</span>
                                {et.name}
                              </button>
                            );
                          })
                        : (Object.keys(ENERGY_TYPE_CONFIG) as EnergyTypeKey[]).map((type) => {
                            const config = ENERGY_TYPE_CONFIG[type];
                            const isActive = selectedType === type;
                            return (
                              <button
                                key={type}
                                onClick={() => setSelectedType(isActive ? "" : type)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all touch-target"
                                style={{
                                  background: isActive ? `${config.mapColor}33` : `${config.mapColor}11`,
                                  color: isActive ? config.mapColor : "#64748b",
                                  border: isActive ? `1px solid ${config.mapColor}66` : "1px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <span>{config.icon}</span>
                                {config.label}
                              </button>
                            );
                          })}
                    </div>
                  </div>

                  {hasFiltersActive && (
                    <button
                      onClick={clearFilters}
                      className="text-[10px] text-slate-400 hover:text-white transition-colors"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                </div>

                {/* Stations Results List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="text-[10px] text-slate-400">ค้นพบ {filteredStations.length} สถานี</div>
                  {filteredStations.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">ไม่พบสถานีบริการพลังงาน</div>
                  ) : (
                    filteredStations.map((station) => (
                      <div
                        key={station.id}
                        onClick={() => handleSelectStation(station)}
                        className="glass-card p-3 cursor-pointer transition-all border border-white/5 hover:border-white/10"
                        style={{
                          background: selectedStation?.id === station.id ? "rgba(14, 165, 233, 0.12)" : "rgba(255, 255, 255, 0.02)",
                          borderColor: selectedStation?.id === station.id ? "rgba(14, 165, 233, 0.25)" : "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {station.brand?.logo_url && (
                              <img
                                src={station.brand.logo_url}
                                alt={station.brand.name}
                                className="w-4 h-4 object-contain rounded flex-shrink-0"
                              />
                            )}
                            <h4 className="font-bold text-white text-xs line-clamp-1">{station.station_name}</h4>
                          </div>
                          {"distance" in station && (
                            <span className="text-[9px] font-bold text-[#00c9a7] bg-[#00c9a7]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {(station as any).distance.toFixed(1)} กม.
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          ต.{station.tambon} อ.{getAmphoeLabel(station.amphoe)}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                          <EnergyTypeBadgeList types={station.energy_types} />
                          <span className="text-[9px] text-[#0ea5e9]">รายละเอียด &rarr;</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: STATION DETAILS */}
            {activeView === "detail" && selectedStation && (
              <div className="flex flex-col h-full">
                {/* Back Button */}
                <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <button
                    onClick={() => handleSelectStation(null)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors touch-target"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    กลับไปหน้ารายการ
                  </button>

                  <div className="flex items-center gap-1">
                    {session && session.role !== "VIEWER" && (
                      <button
                        onClick={() => startEditStation(selectedStation)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Delete button removed */}
                  </div>
                </div>

                {/* Details Scroll Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Image */}
                  <div className="relative h-44 w-full bg-[#162850]/50 border-b border-white/5">
                    {selectedStation.image_url ? (
                      <img
                        src={selectedStation.image_url}
                        alt={selectedStation.station_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl opacity-30">⛽</div>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Badge types */}
                    <div className="flex flex-wrap gap-1">
                      <EnergyTypeBadgeList types={selectedStation.energy_types} size="md" />
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {selectedStation.station_name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        ต.{selectedStation.tambon} อ.{getAmphoeLabel(selectedStation.amphoe)}
                      </p>
                    </div>

                    {/* Brand, Type, & StationID Cards */}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="glass-card p-2.5 flex flex-col justify-between min-h-[56px]">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">แบรนด์</span>
                          <div className="flex items-center gap-1.5 mt-1 min-w-0">
                            {selectedStation.brand?.logo_url ? (
                              <img
                                src={selectedStation.brand.logo_url}
                                alt={selectedStation.brand.name}
                                className="w-4 h-4 object-contain rounded flex-shrink-0"
                              />
                            ) : (
                              <span className="text-xs">🏷️</span>
                            )}
                            <span className="font-bold text-white truncate">{selectedStation.brand?.name || "ไม่ระบุ"}</span>
                          </div>
                        </div>

                        <div className="glass-card p-2.5 flex flex-col justify-between min-h-[56px]">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">ประเภทสถานี</span>
                          <span className="font-bold text-white block mt-1 truncate">
                            {selectedStation.station_type ? `${selectedStation.station_type.icon} ${selectedStation.station_type.name}` : selectedStation.station_type_id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Box */}
                    {selectedStation.details && (
                      <div className="glass-card p-3 space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">รายละเอียด / สิ่งอำนวยความสะดวก</span>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">{selectedStation.details}</p>
                      </div>
                    )}

                    {/* Route instructions */}
                    {selectedStation.address_details && (
                      <div className="glass-card p-3 space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">คำแนะนำที่ตั้ง / จุดสังเกต</span>
                        <p className="text-xs text-slate-300">{selectedStation.address_details}</p>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="space-y-1 px-1 text-[10px] text-slate-400">
                      <div className="flex justify-between">
                        <span>พิกัดละติจูด/ลองจิจูด:</span>
                        <span className="font-mono">{selectedStation.latitude.toFixed(6)}, {selectedStation.longitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>วันที่บันทึก:</span>
                        <span>{new Date(selectedStation.created_at).toLocaleDateString("th-TH")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action: Navigation */}
                <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 touch-target shadow-lg"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
                  >
                    <Navigation className="w-4.5 h-4.5" />
                    นำทางด้วย Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* VIEW 3 & 4: CREATE / EDIT STATION FORM */}
            {(activeView === "create" || activeView === "edit") && (
              <form onSubmit={handleSaveStation} className="flex flex-col h-full">
                {/* Header title */}
                <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <span className="text-sm font-bold text-white">
                    {activeView === "edit" ? "แก้ไขข้อมูลสถานี" : "เพิ่มสถานีใหม่"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeView === "edit" && selectedStation) {
                        setActiveView("detail");
                      } else {
                        setActiveView("search");
                        setSelectedStation(null);
                      }
                      setMobileSheetHeight("half");
                    }}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Fields Scroll Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      <span className="text-red-400">*</span> ชื่อสถานี
                    </label>
                    <input
                      type="text"
                      value={stationForm.station_name}
                      onChange={(e) => setStationForm((f) => ({ ...f, station_name: e.target.value }))}
                      placeholder="เช่น ปตท. แก่งคอย"
                      className="input-dark w-full px-3 py-2 text-xs"
                      required
                    />
                    {formErrors.station_name && (
                      <p className="text-[10px] text-red-400 mt-1">{formErrors.station_name}</p>
                    )}
                  </div>

                  {/* Station Code (StationID) & Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        <span className="text-red-400">*</span> รหัสปั๊ม (StationID)
                      </label>
                      <input
                        type="text"
                        value={stationForm.station_code}
                        onChange={(e) => setStationForm((f) => ({ ...f, station_code: e.target.value }))}
                        placeholder="เช่น ST-PTT-001"
                        className="input-dark w-full px-3 py-2 text-xs"
                        required
                      />
                      {formErrors.station_code && (
                        <p className="text-[10px] text-red-400 mt-1">{formErrors.station_code}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        <span className="text-red-400">*</span> ประเภทสถานี
                      </label>
                      <select
                        value={stationForm.station_type_id}
                        onChange={(e) => setStationForm((f) => ({ ...f, station_type_id: e.target.value }))}
                        className="input-dark w-full px-3 py-2 text-xs"
                        required
                      >
                        <option value="">เลือกประเภท</option>
                        {stationTypes.length > 0
                          ? stationTypes.map((st) => (
                            <option key={st.id} value={st.id}>{st.icon} {st.name}</option>
                          ))
                          : <>
                            <option value="STATION">⛽ ป๊ัมพลังงาน</option>
                            <option value="CHARGING_HUB">🔌 ชาร์จรถไฟฟ้า</option>
                          </>
                        }
                      </select>
                      {formErrors.station_type_id && (
                        <p className="text-[10px] text-red-400 mt-1">{formErrors.station_type_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Brand Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      <span className="text-red-400">*</span> แบรนด์ปั๊ม
                    </label>
                    <select
                      value={stationForm.brand_id}
                      onChange={(e) => setStationForm((f) => ({ ...f, brand_id: e.target.value }))}
                      className="input-dark w-full px-3 py-2 text-xs"
                      required
                    >
                      <option value="">เลือกแบรนด์ปั๊ม</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.short_name})
                        </option>
                      ))}
                    </select>
                    {formErrors.brand_id && (
                      <p className="text-[10px] text-red-400 mt-1">{formErrors.brand_id}</p>
                    )}
                  </div>

                  {/* Energy Types Checklist */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      <span className="text-red-400">*</span> ประเภทเชื้อเพลิง
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {energyTypes.length > 0
                        ? energyTypes.map((et) => {
                            const isSelected = stationForm.energy_types.includes(et.id);
                            return (
                              <button
                                key={et.id}
                                type="button"
                                onClick={() => {
                                  setStationForm((f) => ({
                                    ...f,
                                    energy_types: isSelected
                                      ? f.energy_types.filter((t) => t !== et.id)
                                      : [...f.energy_types, et.id],
                                  }));
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-target"
                                style={{
                                  background: isSelected ? `${et.map_color}22` : "rgba(255,255,255,0.03)",
                                  color: isSelected ? et.map_color : "#64748b",
                                  border: isSelected ? `1.5px solid ${et.map_color}44` : "1.5px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <span>{et.icon}</span>
                                {et.name}
                              </button>
                            );
                          })
                        : ENERGY_TYPES.map((type) => {
                            const config = ENERGY_TYPE_CONFIG[type as EnergyTypeKey];
                            const isSelected = stationForm.energy_types.includes(type);
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setStationForm((f) => ({
                                    ...f,
                                    energy_types: isSelected
                                      ? f.energy_types.filter((t) => t !== type)
                                      : [...f.energy_types, type],
                                  }));
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all touch-target"
                                style={{
                                  background: isSelected ? `${config.mapColor}22` : "rgba(255,255,255,0.03)",
                                  color: isSelected ? config.mapColor : "#64748b",
                                  border: isSelected ? `1.5px solid ${config.mapColor}44` : "1.5px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <span>{config.icon}</span>
                                {config.label}
                              </button>
                            );
                          })}
                    </div>
                    {formErrors.energy_types && (
                      <p className="text-[10px] text-red-400 mt-1">{formErrors.energy_types}</p>
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      รายละเอียดเพิ่มเติม / สิ่งอำนวยความสะดวก
                    </label>
                    <textarea
                      value={stationForm.details}
                      onChange={(e) => setStationForm((f) => ({ ...f, details: e.target.value }))}
                      placeholder="เช่น แบรนด์ตู้ชาร์จ, ร้านสะดวกซื้อ, เวลาทำการ"
                      className="input-dark w-full px-3 py-2 text-xs resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Amphoe + Tambon */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        <span className="text-red-400">*</span> อำเภอ
                      </label>
                      <select
                        value={stationForm.amphoe}
                        onChange={(e) => setStationForm((f) => ({ ...f, amphoe: e.target.value }))}
                        className="input-dark w-full px-3 py-2 text-xs"
                      >
                        <option value="" style={{ color: "#334155" }}>เลือกอำเภอ</option>
                        {AMPHOE_LIST.map((a) => (
                          <option key={a.value} value={a.value} style={{ color: "#334155" }}>{a.label}</option>
                        ))}
                      </select>
                      {formErrors.amphoe && (
                        <p className="text-[10px] text-red-400 mt-1">{formErrors.amphoe}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        <span className="text-red-400">*</span> ตำบล
                      </label>
                      <input
                        type="text"
                        value={stationForm.tambon}
                        onChange={(e) => setStationForm((f) => ({ ...f, tambon: e.target.value }))}
                        placeholder="ชื่อตำบล"
                        className="input-dark w-full px-3 py-2 text-xs"
                        required
                      />
                      {formErrors.tambon && (
                        <p className="text-[10px] text-red-400 mt-1">{formErrors.tambon}</p>
                      )}
                    </div>
                  </div>

                  {/* Address Details */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      จุดสังเกต / คำอธิบายที่ตั้ง
                    </label>
                    <textarea
                      value={stationForm.address_details}
                      onChange={(e) => setStationForm((f) => ({ ...f, address_details: e.target.value }))}
                      placeholder="เช่น อยู่ติดถนนใหญ่ ก่อนถึงสามแยกไฟแดง"
                      className="input-dark w-full px-3 py-2 text-xs resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Location picker */}
                  <LocationPicker
                    latitude={stationForm.latitude}
                    longitude={stationForm.longitude}
                    onLatChange={(v) => setStationForm((f) => ({ ...f, latitude: v }))}
                    onLngChange={(v) => setStationForm((f) => ({ ...f, longitude: v }))}
                  />

                  {/* Image Uploader */}
                  <ImageUploader
                    value={stationForm.image_url}
                    onChange={(url) => setStationForm((f) => ({ ...f, image_url: url }))}
                  />
                </div>

                {/* Footer Save Button */}
                <div className="p-4 border-t flex gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeView === "edit" && selectedStation) {
                        setActiveView("detail");
                      } else {
                        setActiveView("search");
                        setSelectedStation(null);
                      }
                      setMobileSheetHeight("half");
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 touch-target"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={formPending}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white touch-target shadow-lg"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
                  >
                    {formPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </aside>

        {/* 4. Responsive Mobile Bottom Sheet (Mobile View Overlay Map) */}
        <aside
          className="lg:hidden absolute bottom-0 left-0 right-0 z-[1000] flex flex-col pointer-events-none transition-all duration-300"
          style={{
            height: mobileSheetHeight === "collapsed" ? "56px" : mobileSheetHeight === "half" ? "45vh" : "82vh",
          }}
        >
          <div
            className="w-full h-full flex flex-col pointer-events-auto rounded-t-2xl border-t shadow-2xl overflow-hidden"
            style={{
              background: "rgba(15, 32, 68, 0.95)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Sheet Handle / Drag bar */}
            <div
              className="h-7 w-full flex items-center justify-center flex-shrink-0 cursor-pointer"
              onClick={() => {
                setMobileSheetHeight((h) => (h === "collapsed" ? "half" : h === "half" ? "full" : "collapsed"));
              }}
            >
              <div className="w-10 h-1 rounded-full bg-slate-500 opacity-60" />
            </div>

            {/* Mobile Content (re-renders the exact same views as desktop) */}
            <div className="flex-1 overflow-hidden">
              {/* VIEW 1: MOBILE SEARCH */}
              {activeView === "search" && (
                <div className="flex flex-col h-full">
                  <div className="px-4 pb-2 border-b space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">ค้นหาสถานีบริการพลังงาน ({filteredStations.length})</span>
                      {/* Add button removed */}
                    </div>
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ป้อนชื่อสถานี, อำเภอ..."
                        className="input-dark w-full pl-9 pr-3 py-2 text-xs"
                        style={{ borderRadius: "8px" }}
                      />
                    </div>
                  </div>

                  {/* Search Results List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredStations.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs">ไม่พบสถานีบริการพลังงาน</div>
                    ) : (
                      filteredStations.map((station) => (
                        <div
                          key={station.id}
                          onClick={() => handleSelectStation(station)}
                          className="glass-card p-3 border border-white/5"
                          style={{ background: "rgba(255, 255, 255, 0.02)" }}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="font-bold text-white text-xs leading-tight">{station.station_name}</h4>
                            {"distance" in station && (
                              <span className="text-[9px] font-bold text-[#00c9a7] bg-[#00c9a7]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {(station as any).distance.toFixed(1)} กม.
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1">
                            ต.{station.tambon} อ.{getAmphoeLabel(station.amphoe)}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                            <EnergyTypeBadgeList types={station.energy_types} />
                            <span className="text-[9px] text-[#0ea5e9]">รายละเอียด &rarr;</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: MOBILE DETAILS */}
              {activeView === "detail" && selectedStation && (
                <div className="flex flex-col h-full">
                  <div className="px-4 pb-2 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <button
                      onClick={() => handleSelectStation(null)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      กลับ
                    </button>
                    <div className="flex items-center gap-1">
                      {session && session.role !== "VIEWER" && (
                        <button
                          onClick={() => startEditStation(selectedStation)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {/* Delete button removed */}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedStation.image_url && (
                      <img
                        src={selectedStation.image_url}
                        alt={selectedStation.station_name}
                        className="w-full h-32 object-cover rounded-xl border border-white/5"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-white text-sm">{selectedStation.station_name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        ต.{selectedStation.tambon} อ.{getAmphoeLabel(selectedStation.amphoe)}
                      </p>
                    </div>
                    <EnergyTypeBadgeList types={selectedStation.energy_types} />
                    {selectedStation.details && (
                      <p className="text-xs text-slate-300 bg-white/2 p-3 rounded-xl leading-normal">{selectedStation.details}</p>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 touch-target"
                      style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
                    >
                      <Navigation className="w-4 h-4" />
                      นำทาง
                    </a>
                  </div>
                </div>
              )}

              {/* VIEW 3 & 4: MOBILE FORMS */}
              {(activeView === "create" || activeView === "edit") && (
                <div className="flex flex-col h-full">
                  <div className="px-4 pb-2 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <span className="text-xs font-bold text-white">กรอกข้อมูลสถานี</span>
                    <button
                      onClick={() => {
                        if (activeView === "edit" && selectedStation) {
                          setActiveView("detail");
                        } else {
                          setActiveView("search");
                          setSelectedStation(null);
                        }
                        setMobileSheetHeight("half");
                      }}
                      className="text-xs text-slate-400"
                    >
                      ปิด
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        <span className="text-red-400">*</span> ชื่อสถานี
                      </label>
                      <input
                        type="text"
                        value={stationForm.station_name}
                        onChange={(e) => setStationForm((f) => ({ ...f, station_name: e.target.value }))}
                        placeholder="ชื่อสถานี"
                        className="input-dark w-full px-3 py-2 text-xs"
                        required
                      />
                    </div>

                    {/* Station Code & Type */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          <span className="text-red-400">*</span> รหัสปั๊ม (ID)
                        </label>
                        <input
                          type="text"
                          value={stationForm.station_code}
                          onChange={(e) => setStationForm((f) => ({ ...f, station_code: e.target.value }))}
                          placeholder="รหัสปั๊ม"
                          className="input-dark w-full px-3 py-2 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          <span className="text-red-400">*</span> ประเภท
                        </label>
                        <select
                          value={stationForm.station_type_id}
                          onChange={(e) => setStationForm((f) => ({ ...f, station_type_id: e.target.value }))}
                          className="input-dark w-full px-3 py-2 text-xs"
                          required
                        >
                          {stationTypes.length > 0
                            ? stationTypes.map((st) => (
                              <option key={st.id} value={st.id}>{st.icon} {st.name}</option>
                            ))
                            : <>
                              <option value="STATION">⛽ ปั๊มพลังงาน</option>
                              <option value="CHARGING_HUB">🔌 ชาร์จรถไฟฟ้า</option>
                            </>
                          }
                        </select>
                      </div>
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        <span className="text-red-400">*</span> แบรนด์ปั๊ม
                      </label>
                      <select
                        value={stationForm.brand_id}
                        onChange={(e) => setStationForm((f) => ({ ...f, brand_id: e.target.value }))}
                        className="input-dark w-full px-3 py-2 text-xs"
                        required
                      >
                        <option value="">เลือกแบรนด์ปั๊ม</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dynamic Energy Types Checklist */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        <span className="text-red-400">*</span> ประเภทเชื้อเพลิง
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {energyTypes.map((et) => {
                          const isSelected = stationForm.energy_types.includes(et.id);
                          return (
                            <button
                              key={et.id}
                              type="button"
                              onClick={() => {
                                setStationForm((f) => ({
                                  ...f,
                                  energy_types: isSelected
                                    ? f.energy_types.filter((t) => t !== et.id)
                                    : [...f.energy_types, et.id],
                                }));
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                              style={{
                                background: isSelected ? `${et.map_color}22` : "rgba(255,255,255,0.03)",
                                color: isSelected ? et.map_color : "#64748b",
                                border: isSelected ? `1px solid ${et.map_color}44` : "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <span>{et.icon}</span> {et.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Amphoe + Tambon */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          อำเภอ
                        </label>
                        <select
                          value={stationForm.amphoe}
                          onChange={(e) => setStationForm((f) => ({ ...f, amphoe: e.target.value }))}
                          className="input-dark w-full px-3 py-2 text-xs"
                        >
                          <option value="" style={{ color: "#334155" }}>เลือกอำเภอ</option>
                          {AMPHOE_LIST.map((a) => (
                            <option key={a.value} value={a.value} style={{ color: "#334155" }}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          ตำบล
                        </label>
                        <input
                          type="text"
                          value={stationForm.tambon}
                          onChange={(e) => setStationForm((f) => ({ ...f, tambon: e.target.value }))}
                          placeholder="ตำบล"
                          className="input-dark w-full px-3 py-2 text-xs"
                          required
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        รายละเอียดเพิ่มเติม
                      </label>
                      <textarea
                        value={stationForm.details}
                        onChange={(e) => setStationForm((f) => ({ ...f, details: e.target.value }))}
                        placeholder="รายละเอียด"
                        className="input-dark w-full px-3 py-2 text-xs resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Location picker */}
                    <LocationPicker
                      latitude={stationForm.latitude}
                      longitude={stationForm.longitude}
                      onLatChange={(v) => setStationForm((f) => ({ ...f, latitude: v }))}
                      onLngChange={(v) => setStationForm((f) => ({ ...f, longitude: v }))}
                    />

                    {/* Image Uploader */}
                    <ImageUploader
                      value={stationForm.image_url}
                      onChange={(url) => setStationForm((f) => ({ ...f, image_url: url }))}
                    />
                    
                    {/* Save Buttons */}
                    <button
                      onClick={handleSaveStation}
                      disabled={formPending}
                      className="w-full py-3 rounded-xl font-bold text-white shadow-lg mt-4"
                      style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
                    >
                      {formPending ? "กำลังบันทึก..." : "บันทึกสถานี"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ==============================
          MODAL: FLOATING AUTH LOGIN
         ============================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative glass-card p-6 w-full max-w-sm border border-white/10 z-10">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6">
              <Zap className="w-8 h-8 text-[#0ea5e9] mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">เข้าสู่ระบบหลังบ้าน</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Saraburi Energy Station Management</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                    className="input-dark w-full pl-9 pr-3 py-2.5 text-xs"
                    placeholder="กรอกชื่อผู้ใช้งาน"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    className="input-dark w-full pl-9 pr-10 py-2.5 text-xs"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginPending}
                className="w-full py-3 rounded-xl font-bold text-white transition-all text-xs"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
              >
                {loginPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==============================
          MODAL: FLOATING USERS ADMIN PANEL
         ============================== */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowUsersModal(false)} />
          <div className="relative glass-card p-5 w-full max-w-lg border border-white/10 z-10 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">จัดการบัญชีผู้ใช้งาน</h3>
                <p className="text-[10px] text-slate-400">ควบคุมระดับสิทธิ์เจ้าหน้าที่และผู้ชมระบบ</p>
              </div>
              <button
                onClick={() => setShowUsersModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Toggle Add User Form */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                style={{ background: showAddUserForm ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}
              >
                {showAddUserForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddUserForm ? "ปิดหน้าฟอร์ม" : "สร้างผู้ใช้งานใหม่"}
              </button>

              {showAddUserForm && (
                <form onSubmit={handleCreateUser} className="glass-card p-4 mt-3 space-y-3 border border-white/5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="text"
                        placeholder="ชื่อล็อกอิน (Username)"
                        value={createUserForm.username}
                        onChange={(e) => setCreateUserForm((f) => ({ ...f, username: e.target.value }))}
                        className="input-dark w-full px-2.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="ชื่อ-นามสกุลจริง"
                        value={createUserForm.name}
                        onChange={(e) => setCreateUserForm((f) => ({ ...f, name: e.target.value }))}
                        className="input-dark w-full px-2.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="รหัสผ่านเข้าใช้งาน"
                        value={createUserForm.password}
                        onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                        className="input-dark w-full px-2.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <select
                        value={createUserForm.role}
                        onChange={(e) => setCreateUserForm((f) => ({ ...f, role: e.target.value as Role }))}
                        className="input-dark w-full px-2.5 py-2 text-xs"
                      >
                        <option value="ADMIN">ADMIN (แอดมิน)</option>
                        <option value="EDITOR">EDITOR (เจ้าหน้าที่)</option>
                        <option value="VIEWER">VIEWER (ผู้ชม)</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 rounded-lg text-xs font-bold text-white" style={{ background: "#0ea5e9" }}>
                    บันทึกบัญชีใหม่
                  </button>
                </form>
              )}
            </div>

            {/* Users list list view */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingUsers ? (
                <div className="text-center py-6 text-xs text-slate-500">กำลังโหลด...</div>
              ) : (
                adminUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">{user.name}</span>
                      <span className="text-[10px] text-slate-400">@{user.username}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value as Role)}
                        className="text-[10px] rounded-lg py-1 px-2 input-dark"
                        disabled={user.id === session?.id}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>

                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1 rounded text-red-400 hover:text-red-300"
                        disabled={user.id === session?.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

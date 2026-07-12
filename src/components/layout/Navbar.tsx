"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, PlusCircle, Users, LogOut, Zap, Menu, X, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { SessionUser } from "@/types/station";

interface NavbarProps {
  user: SessionUser;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/map", icon: Map, label: "แผนที่" },
    { href: "/stations/new", icon: PlusCircle, label: "เพิ่มสถานี" },
    ...(user.role === "ADMIN" ? [
      { href: "/admin/users", icon: Users, label: "จัดการผู้ใช้" },
      { href: "/admin/settings", icon: Settings, label: "ตั้งค่าระบบ" },
    ] : []),
  ];

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    toast.success("ออกจากระบบแล้ว");
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-full z-40 border-r"
        style={{ background: "#222d32", borderColor: "rgba(255,255,255,0.05)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">Saraburi Energy</p>
            <p className="text-xs" style={{ color: "#64748b" }}>Station Management</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? "rgba(14, 165, 233, 0.15)" : "transparent",
                  color: isActive ? "#0ea5e9" : "#94a3b8",
                  borderLeft: isActive ? "2px solid #0ea5e9" : "2px solid transparent",
                }}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)", color: "white" }}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: "#64748b" }}>{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors duration-200"
            style={{ color: "#94a3b8" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b"
        style={{ background: "#222d32", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #00c9a7)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white">Saraburi Energy</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="p-2 rounded-lg touch-target"
          style={{ color: "#94a3b8" }}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Slide Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
          <div className="absolute top-0 right-0 h-full w-64 p-4 pt-6"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#222d32", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
            <nav className="space-y-1 mt-4">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ color: pathname === href ? "#0ea5e9" : "#94a3b8" }}>
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                style={{ color: "#ef4444" }}>
                <LogOut className="w-5 h-5" />
                ออกจากระบบ
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

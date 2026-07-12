"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, PlusCircle, Users } from "lucide-react";
import type { SessionUser } from "@/types/station";

interface MobileBottomNavProps {
  user: SessionUser;
}

export default function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "หน้าหลัก" },
    { href: "/map", icon: Map, label: "แผนที่" },
    { href: "/stations/new", icon: PlusCircle, label: "เพิ่ม" },
    ...(user.role === "ADMIN"
      ? [{ href: "/admin/users", icon: Users, label: "ผู้ใช้" }]
      : []),
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bottom-nav"
      style={{
        background: "#0f2044",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className={`grid h-16 ${navItems.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 transition-all"
              style={{ color: isActive ? "#0ea5e9" : "#64748b" }}
            >
              <div
                className="relative p-1.5 rounded-xl"
                style={{
                  background: isActive ? "rgba(14, 165, 233, 0.15)" : "transparent",
                }}
              >
                <Icon className="w-5 h-5" />
                {href === "/stations/new" && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                    style={{ background: "#00c9a7" }}
                  />
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

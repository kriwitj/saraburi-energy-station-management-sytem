import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isPublicStation = pathname.startsWith("/stations/") && !pathname.endsWith("/edit") && pathname !== "/stations/new";

  if (!session && !isPublicStation) {
    redirect("/login");
  }

  if (!session) {
    return (
      <div className="min-h-screen text-slate-100" style={{ background: "#0a1628" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh text-slate-800" style={{ background: "#f4f6f9" }}>
      <Navbar user={session} />
      <MobileBottomNav user={session} />

      {/* Main content area */}
      <main
        className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0"
        style={{ minHeight: "100dvh" }}
      >
        {children}
      </main>
    </div>
  );
}

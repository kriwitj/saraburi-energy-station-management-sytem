import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
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

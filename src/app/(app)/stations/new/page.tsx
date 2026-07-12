import StationForm from "@/components/forms/StationForm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "เพิ่มสถานีใหม่ — Saraburi Energy" };

export default async function NewStationPage() {
  const session = await getSession();
  if (!session || session.role === "VIEWER") redirect("/dashboard");

  return <StationForm />;
}

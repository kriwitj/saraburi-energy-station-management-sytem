"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteConfirmDialogProps {
  stationId: string;
  stationName: string;
  onDeleted?: () => void;
}

export default function DeleteConfirmDialog({
  stationId,
  stationName,
  onDeleted,
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsPending(true);
    try {
      const res = await fetch(`/api/stations/${stationId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาดในการลบ");
        return;
      }

      toast.success(`ลบสถานี "${stationName}" สำเร็จแล้ว`);
      setOpen(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        id={`delete-station-${stationId}`}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all touch-target"
        style={{
          background: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        }}
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">ลบ</span>
      </button>

      {/* Dialog Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !isPending && setOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />

          <div
            className="relative glass-card p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto"
              style={{ background: "rgba(239, 68, 68, 0.15)" }}>
              <AlertTriangle className="w-6 h-6" style={{ color: "#ef4444" }} />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-2">
              ยืนยันการลบข้อมูล
            </h3>
            <p className="text-sm text-center mb-1" style={{ color: "#94a3b8" }}>
              คุณต้องการลบสถานี
            </p>
            <p className="text-sm font-semibold text-white text-center mb-4 break-words">
              &quot;{stationName}&quot;
            </p>
            <p className="text-xs text-center mb-6" style={{ color: "#64748b" }}>
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium touch-target"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                ยกเลิก
              </button>
              <button
                id={`confirm-delete-${stationId}`}
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white touch-target"
                style={{
                  background: isPending ? "rgba(239,68,68,0.5)" : "#ef4444",
                  cursor: isPending ? "not-allowed" : "pointer",
                }}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังลบ...
                  </span>
                ) : (
                  "ลบข้อมูล"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

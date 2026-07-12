"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Zap, Lock, User } from "lucide-react";

// Inner component that uses useSearchParams — must be inside Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "เกิดข้อผิดพลาด");
          return;
        }

        toast.success(`ยินดีต้อนรับ, ${data.user.name}!`);
        router.replace(callbackUrl);
        router.refresh();
      } catch {
        toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
          Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748b" }} />
          <input
            id="username"
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            autoComplete="username"
            placeholder="กรอก username"
            className="input-dark w-full pl-10 pr-4 py-3 text-sm touch-target"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
          รหัสผ่าน
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748b" }} />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            autoComplete="current-password"
            placeholder="กรอกรหัสผ่าน"
            className="input-dark w-full pl-10 pr-12 py-3 text-sm touch-target"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
            style={{ color: "#64748b" }}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        id="login-submit"
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl font-semibold text-white touch-target transition-all duration-200 mt-2"
        style={{
          background: isPending
            ? "rgba(14, 165, 233, 0.5)"
            : "linear-gradient(135deg, #0ea5e9 0%, #00c9a7 100%)",
          cursor: isPending ? "not-allowed" : "pointer",
        }}>
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            กำลังเข้าสู่ระบบ...
          </span>
        ) : (
          "เข้าสู่ระบบ"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1e3d 50%, #0a1628 100%)" }}>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00c9a7, transparent)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #00c9a7 100%)" }}>
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Saraburi Energy</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            ระบบบริหารสถานีพลังงาน จ.สระบุรี
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">เข้าสู่ระบบ</h2>

          {/* Wrap the form with Suspense because useSearchParams requires it */}
          <Suspense fallback={
            <div className="space-y-4">
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#475569" }}>
          Saraburi Energy Station Management System v1.0
        </p>
      </div>
    </div>
  );
}

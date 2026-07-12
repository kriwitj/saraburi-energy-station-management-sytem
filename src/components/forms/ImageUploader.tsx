"use client";

import { useCallback, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("ขนาดไฟล์ต้องไม่เกิน 10MB");
        return;
      }

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "อัปโหลดล้มเหลว");
          setPreview(value || null);
          return;
        }
        onChange(data.url);
        setPreview(data.url);
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      } catch {
        toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
        setPreview(value || null);
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [value, onChange]
  );

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function clearImage() {
    setPreview(null);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-500 mb-1.5">
        รูปภาพสถานี
      </label>

      {preview ? (
        // Preview state
        <div className="relative rounded-xl overflow-hidden" style={{ height: "200px" }}>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button
            type="button"
            onClick={clearImage}
            disabled={uploading}
            className="absolute top-2 right-2 p-1.5 rounded-full touch-target"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">กำลังอัปโหลด...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Drop zone
        <label
          id="image-upload-zone"
          htmlFor="image-upload-input"
          className="flex flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-dashed transition-all"
          style={{
            height: "160px",
            borderColor: dragOver ? "#0ea5e9" : "#e2e8f0",
            background: dragOver ? "rgba(14, 165, 233, 0.04)" : "rgba(0,0,0,0.01)",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="text-center p-4">
            {uploading ? (
              <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin" style={{ color: "#0ea5e9" }} />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(14, 165, 233, 0.08)" }}>
                <ImageIcon className="w-6 h-6 text-sky-500" />
              </div>
            )}
            <p className="text-sm font-semibold text-slate-700 mb-1">
              {uploading ? "กำลังอัปโหลด..." : "คลิกหรือลากรูปภาพมาวางที่นี่"}
            </p>
            <p className="text-xs text-slate-400">
              รองรับ JPEG, PNG, WebP, HEIC (สูงสุด 10MB)
            </p>
          </div>
          <input
            id="image-upload-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={uploading}
            capture="environment"
          />
        </label>
      )}

      {/* Manual URL input */}
      <div>
        <input
          type="url"
          id="image-url-input"
          value={value}
          onChange={(e) => { onChange(e.target.value); if (e.target.value) setPreview(e.target.value); }}
          placeholder="หรือกรอก URL รูปภาพโดยตรง (https://...)"
          className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl transition-all shadow-sm"
        />
      </div>
    </div>
  );
}

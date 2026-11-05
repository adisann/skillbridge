import { useState } from "react";
import { CheckCircle2, Loader2, ScanText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalError, ModalFooter, ModalHeader, ModalShell } from "./modal-shell";

interface ImportOcrModalProps {
  isExtracting: boolean;
  onSubmit: (file: File) => void;
  onClose: () => void;
}

export function ImportOcrModal({ isExtracting, onSubmit, onClose }: ImportOcrModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Silakan pilih file poster/flyer lowongan kerja terlebih dahulu.");
      return;
    }
    onSubmit(file);
  };

  const fileInput = (
    <input
      type="file"
      accept="image/*,application/pdf"
      onChange={handleFileChange}
      className="hidden"
      disabled={isExtracting}
    />
  );

  return (
    <ModalShell size="compact">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sb-mist-faint text-sb-blue flex items-center justify-center">
            <ScanText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-sb-navy">Impor Lowongan via OCR (Flyer / Poster)</h3>
            <p className="text-xs text-sb-text-2">Multi-Tier OCR (Gemini Vision • Groq Vision • LlamaParse)</p>
          </div>
        </div>
      </ModalHeader>

      <div className="p-2.5 rounded-lg bg-sb-mist-soft border border-sb-border text-[11px] text-sb-navy flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-sb-good shrink-0" />
        <span>
          Didukung multi-layer OCR: <strong>Gemini Vision</strong> &rarr; <strong>Groq Vision (Qwen 3.8-27B)</strong> &rarr; <strong>LlamaParse v2</strong> dengan fallback otomatis saat server padat.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-sb-navy">
            Unggah File Poster / Flyer Lowongan Kerja *
          </label>
          <div className="border-2 border-dashed border-sb-border rounded-xl p-4 text-center hover:border-sb-blue transition-colors bg-sb-mist-faint/50">
            {preview ? (
              <div className="space-y-3">
                <div className="relative inline-block max-h-48 rounded-lg overflow-hidden border border-sb-border shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau data URL lokal, tidak cocok untuk next/image */}
                  <img src={preview} alt="Pratinjau Flyer" className="max-h-48 object-contain mx-auto" />
                </div>
                <p className="text-xs font-semibold text-sb-navy">{file?.name}</p>
                <label className="inline-block cursor-pointer">
                  {fileInput}
                  <span className="text-xs text-sb-blue hover:underline font-semibold">
                    Ganti Gambar / File
                  </span>
                </label>
              </div>
            ) : (
              <label className="cursor-pointer block py-4 space-y-2">
                {fileInput}
                <div className="w-10 h-10 rounded-full bg-sb-mist-soft text-sb-blue flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-sb-navy">Klik untuk memilih flyer/poster</span>
                  <span className="text-xs text-sb-text-2"> atau seret file ke sini</span>
                </div>
                <p className="text-[11px] text-sb-text-2">
                  Mendukung PNG, JPG, WEBP, atau PDF (Maks. 10 MB)
                </p>
              </label>
            )}
          </div>
        </div>

        {error && <ModalError message={error} />}

        <ModalFooter>
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isExtracting}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isExtracting || !file}
            leftIcon={isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanText className="w-3.5 h-3.5" />}
          >
            {isExtracting ? "Membaca Teks (OCR)..." : "Baca & Ekstrak OCR"}
          </Button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}

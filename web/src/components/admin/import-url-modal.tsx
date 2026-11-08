import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { ModalFooter, ModalHeader, ModalShell } from "./modal-shell";

const DEMO_LINKS = [
  { label: "• Greenhouse: Cloudflare - Data Analyst", url: "https://boards.greenhouse.io/cloudflare/jobs/8109620?gh_jid=8109620" },
  { label: "• Lever: Kwalee - Senior Data Analyst", url: "https://jobs.eu.lever.co/kwalee/5f40e053-75ed-408c-b3b4-7523e746e8a3" },
  { label: "• JobStreet: Sinau Bina Sampoerno - Product Analyst", url: "https://id.jobstreet.com/id/job/95044393" },
];

interface ImportUrlModalProps {
  isExtracting: boolean;
  onSubmit: (url: string) => void;
  onClose: () => void;
}

export function ImportUrlModal({ isExtracting, onSubmit, onClose }: ImportUrlModalProps) {
  const [inputUrl, setInputUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = inputUrl.trim();
    if (targetUrl) onSubmit(targetUrl);
  };

  return (
    <ModalShell size="compact" onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sb-mist-faint text-sb-blue flex items-center justify-center">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-sb-navy">Impor Lowongan via Tautan (URL)</h3>
            <p className="text-xs text-sb-text-2">Ambil informasi lowongan, lalu periksa sebelum disimpan.</p>
          </div>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <TextInput
            label="URL Lowongan Pekerjaan *"
            placeholder="cth. https://boards.greenhouse.io/... atau https://www.linkedin.com/jobs/view/..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            required
            disabled={isExtracting}
          />
          <p className="text-[11px] text-sb-text-2 mt-1">
            Mendukung link dari Greenhouse, Lever, LinkedIn, JobStreet, atau situs karir perusahaan resmi.
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-sb-text-2">Contoh Tautan Siap Uji Demo:</span>
          <div className="flex flex-col gap-1 text-[11px]">
            {DEMO_LINKS.map((link) => (
              <button
                key={link.url}
                type="button"
                onClick={() => setInputUrl(link.url)}
                className="text-left text-sb-blue hover:underline truncate"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isExtracting}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isExtracting || !inputUrl.trim()}
            leftIcon={isExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
          >
            {isExtracting ? "Mengambil & Mengekstrak..." : "Ambil & Ekstrak"}
          </Button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-extrabold text-sb-blue">404</p>
      <h1 className="text-lg font-bold text-sb-navy">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-sb-text-2">
        Alamat yang kamu buka tidak ada atau sudah dipindahkan.
      </p>
      <Link href="/dashboard">
        <Button variant="primary" size="md">
          Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
}

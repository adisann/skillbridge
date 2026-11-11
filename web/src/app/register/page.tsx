"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { UI_COPY } from "@/lib/copy";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SweetAlert } from "@/components/ui/sweet-alert";

/** Pendaftaran publik sengaja ditutup (mencegah penyalahgunaan kuota AI & upload). */
export default function RegisterPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-stack-2xl px-stack-md sm:px-stack-xl lg:px-stack-2xl space-y-stack-lg">
      <div className="w-full max-w-md space-y-stack-xl">
        <div className="text-center space-y-stack-xs">
          <SkillBridgeLogo size="lg" />
          <p className="text-sm font-medium text-sb-text-2">{UI_COPY.tagline}</p>
          <h1 className="text-2xl font-extrabold text-sb-navy tracking-tight pt-stack-xs">Pendaftaran Belum Dibuka</h1>
        </div>

        <Card className="border-sb-border shadow-md text-center">
          <CardHeader className="items-center">
            <div className="w-12 h-12 rounded-full bg-sb-mist-soft text-sb-blue flex items-center justify-center mx-auto mb-stack-xs">
              <UserX className="w-6 h-6" aria-hidden="true" />
            </div>
            <CardTitle>Pendaftaran akun baru dinonaktifkan</CardTitle>
            <CardDescription>Untuk menjaga keamanan dan kestabilan layanan, pendaftaran akun baru sementara dinonaktifkan. Pengguna yang telah memiliki akun dapat masuk untuk mengakses SkillBridge.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full justify-center">
                Masuk ke Akun
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <SweetAlert
        open={open}
        icon="info"
        title="Pendaftaran belum dibuka"
        text="Pengguna yang telah memiliki akun dapat masuk untuk mengakses SkillBridge."
        confirmText="Mengerti"
        onConfirm={() => {
          setOpen(false);
          router.push("/login");
        }}
      />
    </div>
  );
}

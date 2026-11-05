"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SweetAlert } from "@/components/ui/sweet-alert";

/** Pendaftaran ditutup sementara: hanya akun demo yang bisa masuk. */
export default function RegisterPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <SkillBridgeLogo size="lg" />
          <h2 className="text-2xl font-extrabold text-sb-navy tracking-tight pt-2">Pendaftaran Ditutup</h2>
        </div>

        <Card className="border-sb-border shadow-md text-center">
          <CardHeader className="items-center">
            <div className="w-12 h-12 rounded-full bg-sb-mist-soft text-sb-blue flex items-center justify-center mx-auto mb-2">
              <UserX className="w-6 h-6" aria-hidden="true" />
            </div>
            <CardTitle>Saat ini hanya bisa akun demo</CardTitle>
            <CardDescription>Pendaftaran akun baru belum dibuka. Silakan masuk dengan akun yang sudah tersedia.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full justify-center">
                Ke Halaman Masuk
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <SweetAlert
        open={open}
        icon="info"
        title="Pendaftaran belum dibuka"
        text="Saat ini hanya bisa akun demo."
        confirmText="Mengerti"
        onConfirm={() => {
          setOpen(false);
          router.push("/login");
        }}
      />
    </div>
  );
}

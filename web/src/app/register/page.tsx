"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { TextInput, Checkbox } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/error";
import { useAuth } from "@/lib/supabase/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setErrorMessage("Kamu harus menyetujui pemrosesan CV untuk mendaftar akun.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    const res = await register(email, password, name);
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || "Pendaftaran akun gagal. Silakan periksa kembali datamu.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <SkillBridgeLogo size="lg" />
          <h2 className="text-2xl font-extrabold text-sb-navy tracking-tight pt-2">
            Daftar Akun Baru
          </h2>
          <p className="text-xs text-sb-text-2">
            Buat akun untuk menyimpan CV dan menganalisis kesesuaian pasar kerja
          </p>
        </div>

        {errorMessage && (
          <AlertBanner
            type="error"
            title="Registrasi Belum Berhasil"
            message={errorMessage}
          />
        )}

        <Card className="border-sb-border shadow-md">
          <CardHeader>
            <CardTitle>Registrasi Pelamar</CardTitle>
            <CardDescription>
              Isi data berikut untuk mendaftar akun pencari kerja.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <TextInput
                label="Nama Lengkap"
                placeholder="cth. Budi Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <TextInput
                label="Email"
                type="email"
                placeholder="budi@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <TextInput
                label="Kata Sandi"
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Checkbox
                label="Saya menyetujui pemrosesan CV untuk analisis"
                description="CV-mu diproses secara privat dan dapat dihapus permanen kapan pun."
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center mt-2"
                isLoading={isLoading}
              >
                Daftar Sekarang
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-xs text-sb-text-2">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="ml-1 font-semibold text-sb-blue hover:underline">
              Masuk
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

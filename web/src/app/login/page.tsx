"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, UserCheck } from "lucide-react";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/error";
import { useAuth } from "@/lib/supabase/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { loginDemoJuri, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setDemoNotice(true);
    await loginDemoJuri();
  };

  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <SkillBridgeLogo size="lg" />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight pt-2">
            Masuk ke Akun SkillBridge
          </h2>
          <p className="text-xs text-slate-500">
            Akses dashboard rekomendasi karier dan analisis skill pasar kerja
          </p>
        </div>

        {demoNotice && (
          <AlertBanner
            type="success"
            title="Kredensial Demo Terpasang"
            message="Masuk sebagai Budi Pratama (Juri Lomba) (juri@skillbridge.demo). Mengalihkan ke Dashboard..."
          />
        )}

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle>Masuk</CardTitle>
            <CardDescription>
              Silakan masukkan email dan kata sandi Anda, atau gunakan akses instan demo untuk juri lomba.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Tombol Demo 1-Klik untuk Juri Lomba */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/90 space-y-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Akses Cepat Juri INVOFEST 2026
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                Akun demo sudah terisi CV contoh dan analisis lowongan siap uji.
              </p>
              <Button
                type="button"
                variant="success"
                size="md"
                className="w-full justify-center shadow-xs"
                isLoading={isLoading}
                leftIcon={<UserCheck className="w-4 h-4" />}
                onClick={handleDemoLogin}
              >
                Masuk sebagai Juri / Akun Demo (1-Klik)
              </Button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Atau Menggunakan Form
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <form onSubmit={handleRegularLogin} className="space-y-3.5">
              <TextInput
                label="Email"
                type="email"
                placeholder="juri@skillbridge.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <TextInput
                label="Kata Sandi"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center mt-2"
                isLoading={isLoading}
              >
                Masuk ke Akun
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-xs text-slate-500">
            Belum memiliki akun?{" "}
            <Link href="/register" className="ml-1 font-semibold text-blue-600 hover:underline">
              Daftar Baru
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

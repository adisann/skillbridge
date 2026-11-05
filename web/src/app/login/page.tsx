"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, UserCheck } from "lucide-react";
import { SkillBridgeLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertBanner } from "@/components/ui/error";
import { useAuth } from "@/lib/supabase/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    const res = await login(email, password);
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || "Gagal masuk. Periksa kembali email dan kata sandimu.");
      return;
    }
    if (res.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <SkillBridgeLogo size="lg" />
          <h2 className="text-2xl font-extrabold text-sb-navy tracking-tight pt-2">
            Masuk ke Akun SkillBridge
          </h2>
          <p className="text-xs text-sb-text-2">
            Akses dashboard rekomendasi karier dan analisis skill pasar kerja
          </p>
        </div>

        {errorMessage && (
          <AlertBanner
            type="error"
            title="Autentikasi Gagal"
            message={errorMessage}
          />
        )}

        {user ? (
          <Card className="border-sb-border shadow-md bg-sb-mist-faint text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-sb-mist-soft text-sb-blue flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-sb-navy">
                Kamu Sudah Masuk
              </h3>
              <p className="text-xs text-sb-text-2">
                Terhubung sebagai <strong>{user.fullName}</strong> ({user.email}).
              </p>
            </div>
            <div className="pt-2">
              <Link href="/dashboard" className="block">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Buka Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="border-sb-border shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle>Masuk</CardTitle>
              <CardDescription>
                Masukkan email dan kata sandi akunmu.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleRegularLogin} className="space-y-3.5">
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
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

            <CardFooter className="justify-center text-xs text-sb-text-2">
              Belum memiliki akun?{" "}
              <Link href="/register" className="ml-1 font-semibold text-sb-blue hover:underline">
                Daftar Baru
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Lock, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isLoading, isAuthenticated, isAdmin, loginDemoJuri } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <Spinner size="lg" />
        <p className="text-xs text-sb-text-2 font-medium">Memverifikasi sesi autentikasi...</p>
      </div>
    );
  }

  // Case 1: Unauthenticated -> Need login
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-sb-border shadow-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-sb-mist-soft text-sb-blue flex items-center justify-center mx-auto mb-2 border border-sb-border">
              <Lock className="w-6 h-6" />
            </div>
            <CardTitle>Masuk Dulu</CardTitle>
            <CardDescription>
              Masuk dulu untuk melihat halaman ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="success"
              size="md"
              className="w-full justify-center"
              onClick={loginDemoJuri}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Coba dengan akun demo
            </Button>
            <Link href="/login" className="block">
              <Button variant="outline" size="md" className="w-full justify-center">
                Masuk via Form Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case 2: Non-admin trying to access Admin page (Requirement: non-admin tidak bisa membuka admin)
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-red-200 shadow-md bg-white">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="text-red-950">Akses Administrator Terbatas</CardTitle>
            <CardDescription>
              Halaman ini dikhususkan untuk Administrator (manajemen crawler, review skema skill, dan audit log worker_runs).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 space-y-1" suppressHydrationWarning>
              <p>
                <strong>Status Akunmu:</strong> {user.fullName} ({user.email})
              </p>
              <p>
                <strong>Peran Akun:</strong> <span className="font-mono uppercase font-bold text-red-700">{user.role}</span> (Non-Admin diblokir oleh RLS & route guard).
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Link href="/login" className="block">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  leftIcon={<Lock className="w-4 h-4" />}
                >
                  Masuk dengan Kredensial Admin
                </Button>
              </Link>

              <Link href="/dashboard" className="block">
                <Button variant="outline" size="md" className="w-full justify-center">
                  Kembali ke Dashboard Pelamar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

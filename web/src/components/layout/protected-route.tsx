"use client";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
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
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

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
            <Link href="/login" className="block">
              <Button variant="outline" size="md" className="w-full justify-center">
                Masuk
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case 2: non-admin membuka halaman admin -> tampilkan 404 (halaman dianggap tidak ada)
  if (requireAdmin && !isAdmin) notFound();

  return <>{children}</>;
}

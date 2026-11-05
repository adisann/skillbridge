"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./client";
import { clearDedupedCache } from "@/lib/fetcher";

interface AuthProfile {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  targetRole: string;
}

interface AuthContextType {
  user: AuthProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; role?: "user" | "admin" }>;
  logout: () => Promise<void>;
  resetDemoState: () => Promise<void>;
  updateUserTargetRole: (newRole: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load session saat awal muat via endpoint server /api/me (berbasis cookie httpOnly)
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const res = await fetch("/api/me", {
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user || null);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("[AuthContext] Inisialisasi sesi server:", err);
      }

      if (isMounted) {
        setUser(null);
        setIsLoading(false);
      }
    };

    fetchSession();

    // Listener sinkronisasi perubahan auth di browser
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        try {
          const res = await fetch("/api/me");
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setUser(data.user || null);
          }
        } catch {
          // ignore
        }
      } else if (!session) {
        // Cek apakah cookie sesi server masih aktif
        try {
          const res = await fetch("/api/me");
          const data = await res.json();
          if (isMounted) setUser(data.user || null);
        } catch {
          if (isMounted) setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string; role?: "user" | "admin" }> => {
    setIsLoading(true);

    if (!pass || !pass.trim()) {
      setIsLoading(false);
      return { success: false, error: "Kata sandi wajib diisi." };
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        setIsLoading(false);
        return { success: false, error: data.error || "Email atau kata sandi tidak valid." };
      }

      clearDedupedCache();
      setUser(data.user);
      setIsLoading(false);
      return { success: true, role: data.user.role };
    } catch (err: unknown) {
      const error = err as Error;
      setIsLoading(false);
      return { success: false, error: error.message || "Gagal menghubungi layanan autentikasi." };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    clearDedupedCache();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // offline fallback
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("skillbridge_demo_session");
    }
    setIsLoading(false);
    router.push("/login");
  };

  const resetDemoState = async () => {
    clearDedupedCache();
    try {
      await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
    } catch (e) {
      console.error("Gagal reset akun demo di server:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("skillbridge_demo_session");
      // Hapus data tracker lokal demo
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("skillbridge_job_tracker") || key.startsWith("skillbridge_demo"))) {
          localStorage.removeItem(key);
        }
      }
    }
    // Sesi tetap sama (sudah login); halaman memuat ulang datanya setelah reset.
  };

  const updateUserTargetRole = (newRole: string) => {
    if (user) {
      const updated: AuthProfile = { ...user, targetRole: newRole };
      setUser(updated);
      clearDedupedCache();
      // Simpan perubahan ke database profile bila bukan offline
      const supabase = createClient();
      Promise.resolve(
        supabase
          .from("profiles")
          .update({ target_role: newRole })
          .eq("id", user.id)
      ).catch(() => {});
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        resetDemoState,
        updateUserTargetRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./client";
import { clearDedupedCache, fetchDeduped } from "@/lib/fetcher";

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
  updateUserTargetRole: (newRole: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const sessionGeneration = useRef(0);

  // Share session requests across the initial mount and auth notifications.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const generation = ++sessionGeneration.current;
      try {
        const data = await fetchDeduped<{ user: AuthProfile | null }>("/api/me");
        if (mounted && generation === sessionGeneration.current) setUser(data.user || null);
      } catch { if (mounted && generation === sessionGeneration.current) setUser(null); }
      finally { if (mounted && generation === sessionGeneration.current) setIsLoading(false); }
    };
    void load();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!mounted || event === "INITIAL_SESSION") return;
      clearDedupedCache("/api/me");
      void load();
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string; role?: "user" | "admin" }> => {
    sessionGeneration.current++;
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
    sessionGeneration.current++;
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

  const updateUserTargetRole = async (newRole: string) => {
    if (!user) return;
    await fetch("/api/career-context", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetRole: newRole }),
    }).then(async (res) => { if (!res.ok) throw new Error((await res.json()).error || "Gagal menyimpan target."); });
    clearDedupedCache();
    setUser({ ...user, targetRole: newRole.trim() });
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

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./client";

export interface AuthProfile {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  targetRole: "Data Analyst" | "BI Analyst";
}

interface AuthContextType {
  user: AuthProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginDemoJuri: () => Promise<void>;
  loginDemoAdmin: () => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetDemoState: () => Promise<void>;
  updateUserTargetRole: (newRole: "Data Analyst" | "BI Analyst") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_JURI_USER: AuthProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "juri@skillbridge.demo",
  fullName: "Budi Pratama",
  role: "user",
  targetRole: "Data Analyst",
};

export const DEMO_ADMIN_USER: AuthProfile = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "admin@skillbridge.demo",
  fullName: "Administrator SkillBridge",
  role: "admin",
  targetRole: "Data Analyst",
};

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

  const loginDemoJuri = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "juri" }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.error || "Gagal masuk ke akun juri demo.");
      }

      setUser(data.user);
      setIsLoading(false);
      router.push("/dashboard");
    } catch (err) {
      console.error("[Auth] loginDemoJuri gagal:", err);
      setIsLoading(false);
    }
  };

  const loginDemoAdmin = async () => {
    // Admin harus memasukkan kata sandi nyata, diarahkan ke form login
    router.push("/login?admin=1");
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
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

      setUser(data.user);
      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const error = err as Error;
      setIsLoading(false);
      return { success: false, error: error.message || "Gagal menghubungi layanan autentikasi." };
    }
  };

  const register = async (email: string, pass: string, name: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: name,
            target_role: "Data Analyst",
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message || "Pendaftaran gagal." };
      }

      if (data?.user) {
        // Otomatis login ke sesi cookie server
        return await login(cleanEmail, pass);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setIsLoading(false);
      return { success: false, error: error.message || "Gagal menghubungkan ke server autentikasi." };
    }

    setIsLoading(false);
    return { success: false, error: "Pendaftaran tidak dapat diselesaikan." };
  };

  const logout = async () => {
    setIsLoading(true);
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
    await loginDemoJuri();
  };

  const updateUserTargetRole = (newRole: "Data Analyst" | "BI Analyst") => {
    if (user) {
      const updated: AuthProfile = { ...user, targetRole: newRole };
      setUser(updated);
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
        loginDemoJuri,
        loginDemoAdmin,
        register,
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

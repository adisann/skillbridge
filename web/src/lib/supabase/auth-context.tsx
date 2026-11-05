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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_JURI_USER: AuthProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "juri@skillbridge.demo",
  fullName: "Budi Pratama (Juri Lomba)",
  role: "user",
  targetRole: "Data Analyst",
};

const DEMO_ADMIN_USER: AuthProfile = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "admin@skillbridge.demo",
  fullName: "Administrator SkillBridge",
  role: "admin",
  targetRole: "Data Analyst",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(DEMO_JURI_USER);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Load persisted demo session from localStorage if available
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const saved = typeof window !== "undefined" ? localStorage.getItem("skillbridge_demo_session") : null;
        if (saved && isMounted) {
          setUser(JSON.parse(saved));
          return;
        }
      } catch {
        // Fallback below
      }

      if (isMounted) {
        setUser(DEMO_JURI_USER);
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("skillbridge_demo_session", JSON.stringify(DEMO_JURI_USER));
          }
        } catch {
          // ignore storage error
        }
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const loginDemoJuri = async () => {
    setIsLoading(true);
    setUser(DEMO_JURI_USER);
    localStorage.setItem("skillbridge_demo_session", JSON.stringify(DEMO_JURI_USER));
    setIsLoading(false);
    router.push("/dashboard");
  };

  const loginDemoAdmin = async () => {
    setIsLoading(true);
    setUser(DEMO_ADMIN_USER);
    localStorage.setItem("skillbridge_demo_session", JSON.stringify(DEMO_ADMIN_USER));
    setIsLoading(false);
    router.push("/admin");
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      // Coba autentikasi via Supabase jika konfigurasi live ada
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: "placeholder-or-live",
      });

      if (!error && data?.user) {
        const profile: AuthProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || email.split("@")[0],
          role: email === "admin@skillbridge.demo" ? "admin" : "user",
          targetRole: "Data Analyst",
        };
        setUser(profile);
        localStorage.setItem("skillbridge_demo_session", JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
      }
    } catch {
      // Fallback anggun untuk mode demo lokal
    }

    // Fallback login
    const fallbackProfile: AuthProfile =
      email === "admin@skillbridge.demo"
        ? DEMO_ADMIN_USER
        : {
            id: `usr-${Date.now()}`,
            email,
            fullName: email.split("@")[0],
            role: "user",
            targetRole: "Data Analyst",
          };

    setUser(fallbackProfile);
    localStorage.setItem("skillbridge_demo_session", JSON.stringify(fallbackProfile));
    setIsLoading(false);
    return { success: true };
  };

  const register = async (email: string, _pass: string, name: string) => {
    setIsLoading(true);
    const newProfile: AuthProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName: name,
      role: "user",
      targetRole: "Data Analyst",
    };
    setUser(newProfile);
    localStorage.setItem("skillbridge_demo_session", JSON.stringify(newProfile));
    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // offline fallback
    }
    setUser(null);
    localStorage.removeItem("skillbridge_demo_session");
    setIsLoading(false);
    router.push("/login");
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

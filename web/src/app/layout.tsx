import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootShell } from "@/components/layout/root-shell";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { AsyncTaskProvider } from "@/context/async-task-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillBridge — Pencocokan CV & Analisis Kebutuhan Skill Pasar Kerja",
  description:
    "SkillBridge membantu pencari kerja mengetahui lowongan yang relevan dengan CV mereka, gap skill yang belum ditemukan, dan skill pasar yang paling sering diminta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-slate-50/50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AsyncTaskProvider>
            <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
              <RootShell>{children}</RootShell>
            </Suspense>
          </AsyncTaskProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

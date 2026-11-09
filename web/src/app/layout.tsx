import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "sweetalert2/dist/sweetalert2.min.css";
import "./globals.css";
import { RootShell } from "@/components/layout/root-shell";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { CareerProvider, CareerContent } from "@/context/career-context";
import { LearningProvider } from "@/context/learning-context";
import { AsyncTaskProvider } from "@/context/async-task-context";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillBridge | Pencocokan CV & Analisis Kebutuhan Skill Pasar Kerja",
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
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-radial-orbs text-sb-text font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AsyncTaskProvider>
            <Suspense fallback={<div className="min-h-screen bg-sb-mist-faint/50" />}>
              <CareerProvider><LearningProvider><RootShell><CareerContent>{children}</CareerContent></RootShell></LearningProvider></CareerProvider>
            </Suspense>
          </AsyncTaskProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import { Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SweetAlertIcon = "info" | "success" | "warning";

interface SweetAlertProps {
  open: boolean;
  title: string;
  text: string;
  icon?: SweetAlertIcon;
  confirmText?: string;
  onConfirm: () => void;
}

const ICONS = {
  info: { Icon: Info, ring: "border-sb-sky/60 text-sb-blue bg-sb-mist-soft" },
  success: { Icon: CheckCircle2, ring: "border-emerald-300 text-sb-good bg-emerald-50" },
  warning: { Icon: AlertTriangle, ring: "border-amber-300 text-sb-warning bg-amber-50" },
} as const;

/** Dialog pemberitahuan bergaya SweetAlert: ikon besar di tengah, judul, teks, satu tombol konfirmasi. */
export function SweetAlert({ open, title, text, icon = "info", confirmText = "Mengerti", onConfirm }: SweetAlertProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onConfirm]);

  if (!open) return null;
  const { Icon, ring } = ICONS[icon];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-sb-navy/40 backdrop-blur-xs animate-fade-in" onClick={onConfirm} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sweet-alert-title"
        aria-describedby="sweet-alert-text"
        className="relative w-full max-w-sm rounded-3xl bg-white border border-sb-border shadow-2xl p-7 text-center space-y-4 animate-pop-in"
      >
        <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4", ring)}>
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 id="sweet-alert-title" className="text-xl font-extrabold text-sb-navy tracking-tight">
            {title}
          </h2>
          <p id="sweet-alert-text" className="text-sm text-sb-text-2 leading-relaxed">
            {text}
          </p>
        </div>
        <Button ref={buttonRef} variant="primary" size="md" className="w-full justify-center" onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </div>
  );
}

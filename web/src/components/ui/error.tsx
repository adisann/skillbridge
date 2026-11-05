import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface AlertBannerProps {
  type?: "error" | "warning" | "info" | "success";
  title?: string;
  message: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({
  type = "error",
  title,
  message,
  action,
  className,
}: AlertBannerProps) {
  const config = {
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      icon: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-900",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    },
  };

  const curr = config[type];

  return (
    <div
      className={cn(
        "p-3.5 rounded-lg border flex items-start justify-between gap-3 text-xs",
        curr.bg,
        curr.border,
        curr.text,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        {curr.icon}
        <div>
          {title && <h5 className="font-bold tracking-tight mb-0.5">{title}</h5>}
          <p className="leading-relaxed opacity-95">{message}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Terjadi Kendala Memuat Data",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-red-200 bg-red-50/40",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm sm:text-base font-bold text-red-950 tracking-tight">
        {title}
      </h4>
      <p className="mt-1 text-xs sm:text-sm text-red-800/80 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}


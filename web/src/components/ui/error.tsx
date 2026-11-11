import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface AlertBannerProps {
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
      icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-stack-3xs" />,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-stack-3xs" />,
    },
    info: {
      bg: "bg-sb-mist-soft",
      border: "border-sb-border",
      text: "text-sb-navy",
      icon: <Info className="w-4 h-4 text-sb-blue shrink-0 mt-stack-3xs" />,
    },
    success: {
      bg: "bg-sb-good/10",
      border: "border-sb-good/30",
      text: "text-sb-good",
      icon: <CheckCircle2 className="w-4 h-4 text-sb-good shrink-0 mt-stack-3xs" />,
    },
  };

  const curr = config[type];

  return (
    <div
      className={cn(
        "p-stack-sm rounded-lg border flex items-start justify-between gap-stack-sm text-xs",
        curr.bg,
        curr.border,
        curr.text,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-stack-xs">
        {curr.icon}
        <div>
          {title && <h5 className="font-bold tracking-tight mb-stack-3xs">{title}</h5>}
          <p className="leading-relaxed opacity-95">{message}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
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
        "flex flex-col items-center justify-center text-center p-stack-2xl sm:p-stack-4xl rounded-xl border border-red-200 bg-red-50/40",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mb-stack-sm">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm sm:text-base font-bold text-red-950 tracking-tight">
        {title}
      </h4>
      <p className="mt-stack-2xs text-xs sm:text-sm text-red-800/80 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-stack-md">
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


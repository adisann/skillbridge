import React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-stack-2xl sm:p-stack-4xl rounded-2xl border border-dashed border-sb-border bg-sb-mist-faint/60",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-white border border-sb-border text-sb-blue flex items-center justify-center mb-stack-sm shadow-2xs">
        {icon || <FolderSearch className="w-6 h-6 text-sb-blue" />}
      </div>
      <h4 className="text-sm sm:text-base font-bold text-sb-navy tracking-tight">
        {title}
      </h4>
      <p className="mt-stack-2xs text-xs sm:text-sm text-sb-text-2 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-stack-md">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

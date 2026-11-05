import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "dark" | "glass";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold transition-ui duration-150 rounded-full cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sb-blue disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]";

    const variantStyles = {
      primary:
        "bg-sb-sky text-sb-navy hover:bg-sb-sky-hover shadow-xs font-bold",
      secondary:
        "bg-white hover:bg-sb-mist-soft text-sb-navy border border-sb-border shadow-xs font-semibold",
      outline:
        "border border-sb-border bg-white/70 hover:bg-white hover:border-sb-sky text-sb-navy font-semibold",
      ghost:
        "bg-transparent text-sb-text-2 hover:text-sb-navy hover:bg-sb-mist-soft font-semibold",
      dark:
        "bg-sb-mist-soft text-sb-navy border border-sb-border hover:bg-sb-mist font-semibold",
      danger:
        "bg-sb-critical text-white hover:opacity-90 shadow-sm",
      success:
        "bg-sb-good text-white hover:opacity-90 shadow-sm",
      glass:
        "glass-soft hover:bg-white text-sb-navy border border-sb-border shadow-xs font-semibold",
    };

    const sizeStyles = {
      sm: "h-9 px-4 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-12 px-7 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon
        )}
        <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
          {children}
        </span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

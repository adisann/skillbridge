import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// TextInput
// -----------------------------------------------------------------------------
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-sb-navy"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-sb-text-2 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-10 rounded-xl border bg-white/80 backdrop-blur-xs px-3 text-sm text-sb-navy placeholder:text-sb-text-2/70 transition-colors focus:outline-none focus:ring-2 focus:ring-sb-blue focus:border-sb-blue disabled:bg-sb-mist-faint disabled:text-sb-text-2/40 disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error
                ? "border-sb-critical focus:border-sb-critical focus:ring-sb-critical/20 text-sb-critical"
                : "border-sb-border hover:border-sb-blue/40",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-sb-text-2 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-sb-critical font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-sb-text-2">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
TextInput.displayName = "TextInput";

// -----------------------------------------------------------------------------
// SearchInput
// -----------------------------------------------------------------------------
export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  label?: string;
}

export function SearchInput({
  className,
  value,
  onChange,
  onClear,
  placeholder = "Cari posisi, perusahaan, atau skill...",
  label,
  ...props
}: SearchInputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-sb-navy">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-sb-text-2 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 pl-10 pr-9 rounded-xl border border-sb-border bg-white/80 backdrop-blur-xs text-sm text-sb-navy placeholder:text-sb-text-2/70 transition-colors focus:outline-none focus:ring-2 focus:ring-sb-blue focus:border-sb-blue",
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              if (onClear) onClear();
            }}
            className="absolute right-3 p-0.5 text-sb-text-2 hover:text-sb-navy rounded-full hover:bg-sb-mist-soft cursor-pointer"
            aria-label="Bersihkan pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Select
// -----------------------------------------------------------------------------
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-sb-navy"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full h-10 rounded-xl border border-sb-border bg-white/80 backdrop-blur-xs px-3 text-sm text-sb-navy transition-colors focus:outline-none focus:ring-2 focus:ring-sb-blue focus:border-sb-blue",
            error && "border-sb-critical focus:ring-sb-critical/20 text-sb-critical",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-sb-critical font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// -----------------------------------------------------------------------------
// Textarea
// -----------------------------------------------------------------------------
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-sb-navy"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full min-h-[96px] rounded-xl border border-sb-border bg-white/80 p-3 text-sm text-sb-navy placeholder:text-sb-text-2/70 transition-colors focus:outline-none focus:ring-2 focus:ring-sb-blue focus:border-sb-blue",
            error && "border-sb-critical focus:ring-sb-critical/20 text-sb-critical",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-sb-critical font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-sb-text-2">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// -----------------------------------------------------------------------------
// Checkbox
// -----------------------------------------------------------------------------
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function Checkbox({
  className,
  label,
  description,
  id,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  return (
    <div className="flex items-start gap-2.5">
      <input
        type="checkbox"
        id={checkboxId}
        className={cn(
          "w-4 h-4 mt-0.5 rounded border-sb-border text-sb-blue focus:ring-sb-blue focus:ring-offset-0 transition-colors cursor-pointer",
          className
        )}
        {...props}
      />
      <div className="text-sm">
        <label
          htmlFor={checkboxId}
          className="font-medium text-sb-navy cursor-pointer select-none"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-sb-text-2">{description}</p>
        )}
      </div>
    </div>
  );
}

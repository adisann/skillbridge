import type { ReactNode } from "react";
import { X } from "lucide-react";

const PANEL_SIZE = {
  form: "max-w-2xl max-h-[90vh] overflow-y-auto",
  compact: "max-w-lg",
} as const;

interface ModalShellProps {
  size: keyof typeof PANEL_SIZE;
  children: ReactNode;
}

export function ModalShell({ size, children }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className={`bg-white rounded-2xl w-full p-6 shadow-2xl space-y-4 ${PANEL_SIZE[size]}`}>
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  onClose: () => void;
  children: ReactNode;
}

export function ModalHeader({ onClose, children }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-sb-border pb-3">
      {children}
      <button
        type="button"
        onClick={onClose}
        className="text-sb-text-2 hover:text-sb-navy p-1 rounded-md"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3 border-t border-sb-border">{children}</div>
  );
}

export function ModalError({ message }: { message: string }) {
  return <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{message}</div>;
}

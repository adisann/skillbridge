import { useEffect, useRef, useId, type ReactNode } from "react";
import { X } from "lucide-react";

const PANEL_SIZE = {
  form: "max-w-2xl max-h-[90vh] overflow-y-auto",
  compact: "max-w-lg max-h-[90vh] overflow-y-auto",
} as const;

interface ModalShellProps {
  size: keyof typeof PANEL_SIZE;
  children: ReactNode;
  onClose: () => void;
}

export function ModalShell({ size, children, onClose }: ModalShellProps) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const id = useId();
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = panel.current;
    const title = element?.querySelector("h3");
    if (title) title.id = id;
    const focusable = () => Array.from(element?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
    (focusable()[0] || element)?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close.current(); }
      if (e.key === "Tab") {
        const items = focusable(); const first = items[0]; const last = items[items.length-1];
        if (!first) { e.preventDefault(); element?.focus(); }
        else if (e.shiftKey && (document.activeElement === first || document.activeElement === element)) {e.preventDefault();last.focus();}
        else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown",keydown);
    return () => {document.body.style.overflow=overflow;document.removeEventListener("keydown",keydown);previous?.focus();};
  }, [id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className={`bg-white rounded-2xl w-full p-6 shadow-2xl space-y-4 ${PANEL_SIZE[size]}`}>
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
    <div className="sticky bottom-0 bg-white flex flex-wrap items-center justify-end gap-3 py-3 border-t border-sb-border">{children}</div>
  );
}

export function ModalError({ message }: { message: string }) {
  return <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{message}</div>;
}

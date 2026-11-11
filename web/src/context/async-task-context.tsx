"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Loader2, CheckCircle2, AlertCircle, X, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-context";
import { persistedTaskNotifications } from "@/lib/async-task-persistence";

type AsyncTaskStatus = "running" | "success" | "error";

interface AsyncTaskAction<T = unknown> {
  label: string;
  url?: string;
  onClick?: (data?: T) => void;
}

interface AsyncTask<T = unknown> {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: AsyncTaskStatus;
  startedAt: number;
  completedAt?: number;
  data?: T;
  error?: string;
  action?: AsyncTaskAction<T>;
}

interface RunTaskOptions<T = unknown> {
  id?: string;
  type?: string;
  title: string;
  description?: string;
  success?: { title: string; description?: string };
  promise: Promise<T> | (() => Promise<T>);
  onSuccess?: (data: T) => void;
  onError?: (err: Error) => void;
  action?: AsyncTaskAction<T>;
  autoDismissMs?: number; // default 8000ms after success
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface AsyncTaskContextType {
  tasks: AsyncTask[];
  runTask: <T = unknown>(options: RunTaskOptions<T>) => string;
  dismissTask: (id: string) => void;
  clearAllTasks: () => void;
  activeTasksCount: number;
  showToast: (message: string, type?: Toast["type"]) => void;
}

const STORAGE_PREFIX = "skillbridge_async_tasks_v3";
const LEGACY_STORAGE_KEY = "skillbridge_async_tasks_v2";

const AsyncTaskContext = createContext<AsyncTaskContextType | undefined>(undefined);

function getInitialTasks(ownerKey: string): AsyncTask[] {
  if (typeof window === "undefined" || ownerKey === "loading") return [];
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}_${ownerKey}`);
    if (!saved) return [];
    const parsed: AsyncTask[] = JSON.parse(saved);
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    return parsed.filter((t) => t.status !== "running" && now - t.startedAt < twoHours);
  } catch (e) {
    console.warn("[AsyncTask] Gagal membaca state dari localStorage:", e);
    return [];
  }
}

export function AsyncTaskProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const ownerKey = isLoading ? "loading" : user?.id || "guest";
  return <AsyncTaskSession key={ownerKey} ownerKey={ownerKey}>{children}</AsyncTaskSession>;
}

function AsyncTaskSession({ children, ownerKey }: { children: ReactNode; ownerKey: string }) {
  const [tasks, setTasks] = useState<AsyncTask[]>(() => getInitialTasks(ownerKey));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = React.useRef(0);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++nextToastId.current;
    setToasts((current) => [{ id, message, type }, ...current].slice(0, 3));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  // Simpan tugas ke localStorage saat ada perubahan
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      if (ownerKey === "loading") return;
      // Hasil CV/payload tugas hanya ada di memori. Persistensi hanya metadata notifikasi.
      const serializableTasks = persistedTaskNotifications(tasks);
      localStorage.setItem(`${STORAGE_PREFIX}_${ownerKey}`, JSON.stringify(serializableTasks));
    } catch (e) {
      console.warn("[AsyncTask] Gagal menyimpan state ke localStorage:", e);
    }
  }, [tasks, ownerKey]);

  // 3. Hapus toast tugas tertentu
  const dismissTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 4. Bersihkan semua tugas yang sudah selesai
  const clearAllTasks = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === "running"));
  }, []);

  // 5. Jalankan proses asynchronous non-blocking
  const runTask = useCallback(<T = unknown>(options: RunTaskOptions<T>): string => {
    const taskId = options.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const taskType = options.type || "general";
    const autoDismissMs = options.autoDismissMs ?? 8000;

    const newTask: AsyncTask<T> = {
      id: taskId,
      type: taskType,
      title: options.title,
      description: options.description,
      status: "running",
      startedAt: Date.now(),
      action: options.action,
    };

    setTasks((prev) => [newTask as AsyncTask, ...prev.filter((t) => t.id !== taskId)]);

    // Jalankan promise di background secara non-blocking
    const execPromise = typeof options.promise === "function" ? options.promise() : options.promise;

    execPromise
      .then((data) => {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                ...options.success,
                status: "success",
                completedAt: Date.now(),
                data,
              };
            }
            return t;
          })
        );

        if (options.onSuccess) {
          try {
            options.onSuccess(data);
          } catch (callbackErr) {
            console.error("[AsyncTask] Error on onSuccess callback:", callbackErr);
          }
        }

        // Auto dismiss jika sudah success setelah jeda waktu tertentu
        if (autoDismissMs > 0) {
          setTimeout(() => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
          }, autoDismissMs);
        }
      })
      .catch((err: unknown) => {
        const error = err as Error;
        const errorMessage = error?.message || "Terjadi kesalahan saat memproses tugas di latar belakang.";

        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                status: "error",
                completedAt: Date.now(),
                error: errorMessage,
              };
            }
            return t;
          })
        );

        if (options.onError) {
          try {
            options.onError(error);
          } catch (callbackErr) {
            console.error("[AsyncTask] Error on onError callback:", callbackErr);
          }
        }
      });

    return taskId;
  }, []);

  const activeTasksCount = tasks.filter((t) => t.status === "running").length;
  const value = useMemo(() => ({
    tasks, runTask, dismissTask, clearAllTasks, activeTasksCount, showToast,
  }), [tasks, runTask, dismissTask, clearAllTasks, activeTasksCount, showToast]);

  return (
    <AsyncTaskContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-2 top-2 z-[9999] flex max-h-[calc(100dvh-1rem)] min-w-0 flex-col gap-stack-xs overflow-y-auto p-2 sm:left-auto sm:right-3 sm:top-3 sm:w-[25rem]">
        <div aria-live="polite" aria-relevant="additions" className="sr-only">
          {toasts.filter((toast) => toast.type === "success").map((toast) => (
            <span key={toast.id}>{toast.message}</span>
          ))}
        </div>
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />)}
        <AsyncTaskToastContainer tasks={tasks} onDismiss={dismissTask} />
      </div>
    </AsyncTaskContext.Provider>
  );
}

export function useAsyncTask() {
  const context = useContext(AsyncTaskContext);
  if (!context) {
    throw new Error("useAsyncTask must be used within an AsyncTaskProvider");
  }
  return context;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [focused, setFocused] = useState(false);
  const isError = toast.type === "error";

  useEffect(() => {
    if (focused) return;
    const timer = setTimeout(() => onDismiss(toast.id), isError ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [focused, isError, onDismiss, toast.id]);

  return (
    <ToastFrame
      status={toast.type}
      onDismiss={() => onDismiss(toast.id)}
      onFocusChange={setFocused}
    >
      <p role={isError ? "alert" : undefined} className="text-sm font-semibold text-sb-navy">
        {toast.message}
      </p>
    </ToastFrame>
  );
}

const TOAST_STATUS = {
  running: { Icon: Loader2, border: "border-sb-border", icon: "text-sb-blue motion-safe:animate-spin" },
  success: { Icon: CheckCircle2, border: "border-emerald-200", icon: "text-sb-good" },
  error: { Icon: AlertCircle, border: "border-red-200", icon: "text-sb-critical" },
};

function ToastFrame({ status, onDismiss, onFocusChange, children }: {
  status: AsyncTaskStatus;
  onDismiss: () => void;
  onFocusChange?: (focused: boolean) => void;
  children: ReactNode;
}) {
  const { Icon, border, icon } = TOAST_STATUS[status];

  return (
    <div className={cn(
      "pointer-events-auto grid w-full min-w-0 shrink-0 animate-drop-in grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-stack-xs rounded-2xl border bg-white py-stack-2xs pl-stack-sm pr-stack-2xs shadow-md",
      border,
    )}>
      <Icon aria-hidden="true" className={cn("mt-3 h-5 w-5", icon)} />
      <div className="min-w-0 wrap-anywhere py-stack-xs">{children}</div>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={onDismiss}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sb-text-2 hover:bg-sb-mist-soft focus-visible:outline-2 focus-visible:outline-sb-blue"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

function AsyncTaskToastContainer({
  tasks,
  onDismiss,
}: {
  tasks: AsyncTask[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div aria-live="polite" className="flex min-w-0 flex-col gap-stack-xs">
      {tasks.map((task) => (
        <AsyncTaskToastItem key={task.id} task={task} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function AsyncTaskToastItem({ task, onDismiss }: {
  task: AsyncTask;
  onDismiss: (id: string) => void;
}) {
  const { action, description, error, status, title } = task;
  const detail = status === "error" ? error : description;
  const actionClass = "inline-flex max-w-full items-center gap-stack-2xs text-left text-xs font-bold text-sb-blue hover:underline";

  return (
    <ToastFrame status={status} onDismiss={() => onDismiss(task.id)}>
      <p className="text-sm font-semibold leading-snug text-sb-navy">
        {status === "running" && <span className="sr-only">Sedang diproses. </span>}
        {status === "error" && <span className="text-sb-critical">Gagal. </span>}
        {title}
      </p>
      {detail && <p className="mt-stack-3xs text-xs leading-relaxed text-sb-text-2">{detail}</p>}
      {action && status === "success" && (
        <div className="mt-stack-xs">
          {action.url ? (
            <a href={action.url} className={actionClass}>
              {action.label}
              <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
            </a>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={() => {
                action.onClick?.(task.data);
                onDismiss(task.id);
              }}
              className={actionClass}
            >
              {action.label}
              <ArrowRight aria-hidden="true" className="h-3 w-3 shrink-0" />
            </button>
          ) : null}
        </div>
      )}
    </ToastFrame>
  );
}

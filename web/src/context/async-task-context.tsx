"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Loader2, CheckCircle2, AlertCircle, X, ArrowRight, ExternalLink } from "lucide-react";

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
  promise: Promise<T> | (() => Promise<T>);
  onSuccess?: (data: T) => void;
  onError?: (err: Error) => void;
  action?: AsyncTaskAction<T>;
  autoDismissMs?: number; // default 8000ms after success
}

interface AsyncTaskContextType {
  tasks: AsyncTask[];
  runTask: <T = unknown>(options: RunTaskOptions<T>) => string;
  dismissTask: (id: string) => void;
  clearAllTasks: () => void;
  activeTasksCount: number;
}

const STORAGE_KEY = "skillbridge_async_tasks_v2";

const AsyncTaskContext = createContext<AsyncTaskContextType | undefined>(undefined);

function getInitialTasks(): AsyncTask[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: AsyncTask[] = JSON.parse(saved);
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    return parsed
      .filter((t) => now - t.startedAt < twoHours)
      .map((t) => {
        if (t.status === "running") {
          return {
            ...t,
            status: "success" as AsyncTaskStatus,
            description: `${t.description || ""} (Dipulihkan setelah refresh halaman)`.trim(),
          };
        }
        return t;
      });
  } catch (e) {
    console.warn("[AsyncTask] Gagal membaca state dari localStorage:", e);
    return [];
  }
}

export function AsyncTaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<AsyncTask[]>(getInitialTasks);

  // Simpan tugas ke localStorage saat ada perubahan
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Simpan maksimal 10 tugas terakhir (tanpa menyertakan data fungsi onClick)
      const serializableTasks = tasks.slice(0, 10).map((t) => ({
        ...t,
        action: t.action
          ? {
              label: t.action.label,
              url: t.action.url,
            }
          : undefined,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableTasks));
    } catch (e) {
      console.warn("[AsyncTask] Gagal menyimpan state ke localStorage:", e);
    }
  }, [tasks]);

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

  return (
    <AsyncTaskContext.Provider
      value={{
        tasks,
        runTask,
        dismissTask,
        clearAllTasks,
        activeTasksCount,
      }}
    >
      {children}
      <AsyncTaskToastContainer tasks={tasks} onDismiss={dismissTask} />
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

/**
 * Global Toast Container Component (Top-Right Corner)
 */
function AsyncTaskToastContainer({
  tasks,
  onDismiss,
}: {
  tasks: AsyncTask[];
  onDismiss: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {tasks.map((task) => (
        <AsyncTaskToastItem key={task.id} task={task} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Item
 */
function AsyncTaskToastItem({
  task,
  onDismiss,
}: {
  task: AsyncTask;
  onDismiss: (id: string) => void;
}) {
  const isRunning = task.status === "running";
  const isSuccess = task.status === "success";
  const isError = task.status === "error";

  return (
    <div
      className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-[transform,opacity] duration-300 ease-out-strong ${
        isRunning
          ? "bg-white/95 border-sb-border shadow-sb-blue/10"
          : isSuccess
          ? "bg-white/95 border-emerald-200 shadow-emerald-500/10"
          : "bg-white/95 border-red-200 shadow-red-500/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Status Icon */}
        <div className="shrink-0 mt-0.5">
          {isRunning && (
            <div className="w-8 h-8 rounded-xl bg-sb-mist-soft text-sb-blue flex items-center justify-center animate-pulse border border-sb-border">
              <Loader2 className="w-4 h-4 animate-spin text-sb-blue" />
            </div>
          )}
          {isSuccess && (
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          )}
          {isError && (
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isRunning
                  ? "bg-sb-mist-soft text-sb-navy"
                  : isSuccess
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isRunning ? "Memproses Latar Belakang" : isSuccess ? "Berhasil Selesai" : "Gagal"}
            </span>
            <span className="text-[10px] text-sb-text-2">
              {new Date(task.startedAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          <h4 className="text-sm font-bold text-sb-navy leading-snug">{task.title}</h4>

          {task.description && (
            <p className="text-xs text-sb-text-2 mt-0.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {isRunning && (
            <p className="text-[11px] text-sb-text-2 font-medium mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sb-sky animate-ping" />
              Navigasi tetap aktif • Kamu bebas berpindah halaman
            </p>
          )}

          {isError && task.error && (
            <div className="mt-2 p-2 rounded-lg bg-red-50 text-[11px] text-red-700 border border-red-100">
              {task.error}
            </div>
          )}

          {/* Action Button */}
          {task.action && (isSuccess || !isRunning) && (
            <div className="mt-3 pt-2 border-t border-sb-border flex items-center gap-2">
              {task.action.url ? (
                <a
                  href={task.action.url}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sb-blue hover:underline"
                >
                  {task.action.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : task.action.onClick ? (
                <button
                  type="button"
                  onClick={() => {
                    task.action?.onClick?.(task.data);
                    onDismiss(task.id);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-sb-sky text-sb-navy hover:bg-sb-sky-hover transition-colors shadow-xs"
                >
                  {task.action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(task.id)}
          className="text-sb-text-2 hover:text-sb-navy p-1 rounded-lg hover:bg-sb-mist-soft transition-colors shrink-0"
          title="Tutup Notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

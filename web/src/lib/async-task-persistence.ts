interface TaskNotification {
  id: string; type: string; title: string; description?: string;
  status: "running" | "success" | "error";
  startedAt: number; completedAt?: number; error?: string;
  action?: { label: string; url?: string };
}

/** Allowlist metadata; hasil CV, signed URL upload, dan callback tidak ikut disimpan. */
export function persistedTaskNotifications(tasks: TaskNotification[]) {
  return tasks.filter((task) => task.status !== "running").slice(0, 10).map((task) => ({
    id: task.id, type: task.type, title: task.title, description: task.description,
    status: task.status, startedAt: task.startedAt, completedAt: task.completedAt, error: task.error,
    action: task.action ? { label: task.action.label, url: task.action.url } : undefined,
  }));
}

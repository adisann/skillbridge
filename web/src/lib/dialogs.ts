let confirming = false;
export async function confirmAction(title: string, options: { destructive?: boolean; confirmText?: string; text?: string } = {}): Promise<boolean> {
  if (confirming) return false;
  confirming = true;
  try {
    const { default: Swal } = await import("sweetalert2");
    const result = await Swal.fire({
      titleText: title, text: options.text, icon: options.destructive === false ? "question" : "warning",
      showCancelButton: true, confirmButtonText: options.confirmText || "Ya, hapus", cancelButtonText: "Batal",
      focusCancel: true, reverseButtons: true, heightAuto: false, buttonsStyling: false,
      customClass: { popup: "sb-dialog", title: "sb-dialog-title", htmlContainer: "sb-dialog-text", actions: "sb-dialog-actions", confirmButton: options.destructive === false ? "sb-dialog-confirm" : "sb-dialog-danger", cancelButton: "sb-dialog-cancel" },
    });
    return result.isConfirmed;
  } finally { confirming = false; }
}
export async function showNotice(title: string) {
  const { default: Swal } = await import("sweetalert2");
  await Swal.fire({ titleText: title, icon: "info", confirmButtonText: "Mengerti", heightAuto: false, buttonsStyling: false, customClass: { popup: "sb-dialog", confirmButton: "sb-dialog-confirm" } });
}

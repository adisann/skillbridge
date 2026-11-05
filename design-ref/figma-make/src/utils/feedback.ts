export function showFeedback(message: string) {
  window.dispatchEvent(
    new CustomEvent<string>('skillbridge-feedback', { detail: message })
  );
}

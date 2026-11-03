/** Escape untrusted text before adding the application's own HTML markup. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}

export function boldTextHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

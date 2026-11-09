
export interface RetainedProjectFile { id: string; name: string; mime: string; size: number; base64: string; at: string }
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
  return btoa(binary);
}
export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
}
export async function retainProjectFile(_file: File, _projectId?: string): Promise<void> {
  // Original files stay on the user's device; only extracted work is persisted.
}
export function createRetainedTextReader(_file: File): FileReader {
  return new FileReader();
}
export function downloadRetainedFile(file: RetainedProjectFile) {
  const url = URL.createObjectURL(new Blob([base64ToBytes(file.base64)], { type: file.mime }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

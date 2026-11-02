import { getActiveProjectId, getProject, now, updateProject, reportProjectStorageError } from './projectService';

export interface RetainedProjectFile { id: string; name: string; mime: string; size: number; base64: string; at: string }
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
  return btoa(binary);
}
export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
}
export async function retainProjectFile(file: File, projectId = getActiveProjectId()): Promise<void> {
  if (!getProject(projectId)) return;
  if (file.size > 40 * 1024 * 1024) throw new Error('Original files larger than 40 MB are not retained. Keep the source file separately.');
  const buffer = await file.arrayBuffer();
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const fileId = `${hash}-${file.name}`;
  if (getProject(projectId)?.files?.some(saved => saved.id === fileId)) return;
  const retained: RetainedProjectFile = { id: fileId, name: file.name, size: file.size, mime: file.type || 'application/octet-stream', base64: bytesToBase64(new Uint8Array(buffer)), at: now() };
  updateProject(project => ({ ...project, files: [...(project.files || []), retained] }), projectId);
}
export function createRetainedTextReader(file: File): FileReader {
  const reader = new FileReader();
  const projectId = getActiveProjectId();
  reader.addEventListener('load', () => { void retainProjectFile(file, projectId).catch(() => reportProjectStorageError(`The original file “${file.name}” could not be retained. Keep that file separately; extracted text may still be saved.`)); }, { once: true });
  return reader;
}
export function downloadRetainedFile(file: RetainedProjectFile) {
  const url = URL.createObjectURL(new Blob([base64ToBytes(file.base64)], { type: file.mime }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

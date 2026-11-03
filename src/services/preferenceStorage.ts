import { reportProjectStorageError } from './projectService';

export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writePreference(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; }
  catch {
    reportProjectStorageError('A browser preference could not be saved. Storage may be full or unavailable. Export a project backup before closing this tab.');
    return false;
  }
}

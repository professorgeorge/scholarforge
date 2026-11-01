import { getToolState, setToolState } from './projectService';
/**
 * Universal Research Binder Service
 * Provides persistent cross-tab clipping and dossier synthesis across ScholarForge.
 */

export interface BinderItem {
  id: string;
  type: 'paper' | 'claim' | 'stat' | 'journal' | 'note';
  title: string;
  snippet: string;
  sourcePillar: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'scholarforge_universal_binder';

export function getBinderItems(): BinderItem[] {
  try {
    return getToolState<BinderItem[]>(STORAGE_KEY, []);
  } catch {
    return [];
  }
}

export function saveBinderItems(items: BinderItem[]): void {
  try {
    setToolState(STORAGE_KEY, items);
    window.dispatchEvent(new CustomEvent('scholarforge_binder_updated'));
  } catch {
    // The project workspace displays storage failures.
  }
}

export function addBinderItem(item: Omit<BinderItem, 'id' | 'timestamp'>): void {
  const current = getBinderItems();
  const newItem: BinderItem = {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  saveBinderItems([newItem, ...current]);
}

export function removeBinderItem(id: string): void {
  const current = getBinderItems();
  saveBinderItems(current.filter((i) => i.id !== id));
}

export function clearBinder(): void {
  saveBinderItems([]);
}

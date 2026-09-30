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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialDefaultItems();
    return JSON.parse(raw);
  } catch {
    return getInitialDefaultItems();
  }
}

export function saveBinderItems(items: BinderItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('scholarforge_binder_updated'));
  } catch {
    // Ignore quota issues
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

function getInitialDefaultItems(): BinderItem[] {
  return [
    {
      id: 'default-1',
      type: 'paper',
      title: 'Attention is All You Need',
      snippet: 'Seminal architecture for transformer-based foundation models with self-attention mechanism.',
      sourcePillar: 'Literature Search',
      timestamp: '10:00 AM',
      metadata: { doi: '10.48550/arXiv.1706.03762', year: 2017 }
    },
    {
      id: 'default-2',
      type: 'claim',
      title: 'Cognitive autonomy moderates burnout attrition',
      snippet: 'Empirical analysis confirmed moderation effect (beta = 0.28, p < .001) in high-stress healthcare environments.',
      sourcePillar: 'Claims Workbench',
      timestamp: '10:05 AM'
    },
    {
      id: 'default-3',
      type: 'journal',
      title: 'PLOS ONE (Scopus Q1 • Gold OA)',
      snippet: 'Broad multidisciplinary scope with rigorous methodology review. 5 to 7 weeks turnaround.',
      sourcePillar: 'Journal Sentinel',
      timestamp: '10:12 AM',
      metadata: { citeScore: 5.6, apc: '$2,290' }
    }
  ];
}

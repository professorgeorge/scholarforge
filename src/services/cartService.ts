import { getProject, updateProject } from './projectService';
import type { AcademicPaper } from '../types/citation';



export function getCartPapers(): AcademicPaper[] {
  try {
    return getProject()?.papers ?? [];
  } catch (err) {
    console.error('Failed to load research cart from storage', err);
    return [];
  }
}

export function saveCartPapers(papers: AcademicPaper[]): void {
  try {
    // The cart is the shared source library. Removing a card must not orphan
    // evidence, imported full text, or an existing screening ledger.
    const project = getProject();
    const linked = new Set([
      ...(project?.evidence || []).map(entry => entry.paperId),
      ...(project?.documents || []).map(entry => entry.paperId),
      ...(project?.screening || []).map(entry => entry.paperId),
    ]);
    const retained = (project?.papers || []).filter(paper => linked.has(paper.id) && !papers.some(next => next.id === paper.id));
    const updated = [...papers, ...retained];
    updateProject({ papers: updated });
    window.dispatchEvent(new CustomEvent('scholarforge_cart_updated', { detail: updated }));
  } catch (err) {
    console.error('Failed to save research cart', err);
  }
}

export function addPaperToCart(paper: AcademicPaper): boolean {
  const current = getCartPapers();
  const exists = current.some(
    (p) =>
      p.id === paper.id ||
      (p.doi && paper.doi && p.doi.toLowerCase() === paper.doi.toLowerCase()) ||
      p.title.toLowerCase().trim() === paper.title.toLowerCase().trim()
  );

  if (exists) return false;

  const updated = [paper, ...current];
  saveCartPapers(updated);
  return true;
}

export function addMultiplePapersToCart(papers: AcademicPaper[]): number {
  const current = getCartPapers();
  let addedCount = 0;
  const currentKeys = new Set(
    current.map((p) => (p.doi || p.id || p.title).toLowerCase().trim())
  );

  const newUnique: AcademicPaper[] = [];
  papers.forEach((p) => {
    const key = (p.doi || p.id || p.title).toLowerCase().trim();
    if (!currentKeys.has(key)) {
      currentKeys.add(key);
      newUnique.push(p);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    saveCartPapers([...newUnique, ...current]);
  }
  return addedCount;
}

export function removePaperFromCart(idOrDoi: string): void {
  const current = getCartPapers();
  const updated = current.filter(
    (p) => p.id !== idOrDoi && (!p.doi || p.doi.toLowerCase() !== idOrDoi.toLowerCase())
  );
  saveCartPapers(updated);
}

export function isPaperInCart(paper: AcademicPaper): boolean {
  const current = getCartPapers();
  return current.some(
    (p) =>
      p.id === paper.id ||
      (p.doi && paper.doi && p.doi.toLowerCase() === paper.doi.toLowerCase()) ||
      p.title.toLowerCase().trim() === paper.title.toLowerCase().trim()
  );
}

export function clearCart(): void {
  saveCartPapers([]);
}

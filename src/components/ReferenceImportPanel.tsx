import React, { useState } from 'react';
import type { AcademicPaper } from '../types/citation';
import { fetchZoteroLibrary, importReferences } from '../services/libraryInteropService';
import { getActiveProjectId } from '../services/projectService';
import { retainProjectFile } from '../services/projectFileService';

interface ReferenceImportPanelProps {
  disabled?: boolean;
  onImport: (papers: AcademicPaper[], origin: string) => void;
}

/** Imports are previewed; nothing is written to the user's Zotero library. */
export function ReferenceImportPanel({ disabled, onImport }: ReferenceImportPanelProps) {
  const [preview, setPreview] = useState<AcademicPaper[]>([]);
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const abort = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => abort.current?.abort(), []);

  const readFile = async (file: File) => {
    const projectId = getActiveProjectId();
    setBusy(true);
    setError('');
    setPreview([]);
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('Use a reference file smaller than 20 MB.');
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['ris', 'bib', 'json'].includes(extension || '')) throw new Error('Choose a RIS, BibTeX, or CSL/Zotero JSON file.');
      const records = importReferences(await file.text(), extension === 'ris' ? 'ris' : extension === 'bib' ? 'bib' : 'json');
      if (!records.length) throw new Error('No bibliographic records were found. Export a RIS, BibTeX, or CSL-JSON file and try again.');
      await retainProjectFile(file, projectId);
      setPreview(records);
      setOrigin(`File import: ${file.name}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not read this reference file.');
    } finally { setBusy(false); }
  };

  return <details className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5">
    <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-white">Import from Zotero, Publish or Perish, or a reference file</summary>
    <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
      <p>Bring existing search results into this list. Export RIS from Publish or Perish, or RIS, BibTeX, or CSL-JSON from Zotero. This also supports compatible exports from Scopus and Web of Science.</p>
      <label className="block text-xs font-semibold">Reference file (RIS, BibTeX, or JSON)
        <input type="file" accept=".ris,.bib,.json" disabled={busy || disabled} className="block mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 font-normal" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); event.target.value = ''; }} />
      </label>
      <details className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
        <summary className="cursor-pointer text-xs font-semibold">Read a Zotero online library</summary>
        <p className="mt-2 text-xs leading-relaxed">Public user or group libraries need no key. Private libraries require a read-access key. The key is used only for this import and is not saved. Attachments and notes are not downloaded.</p>
        <form className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          setBusy(true); setError(''); setPreview([]);
          const controller = new AbortController();
          abort.current = controller;
          try {
            const kind = values.get('kind') === 'groups' ? 'groups' : 'users';
            const library = String(values.get('library') || '').trim();
            const records = await fetchZoteroLibrary(library, kind, String(values.get('key') || '').trim(), controller.signal);
            if (!records.length) throw new Error('This library returned no bibliographic records. Check its ID and read access.');
            setPreview(records); setOrigin(`Zotero ${kind}/${library}`);
          } catch (failure) { setError(failure instanceof Error ? failure.message : 'Zotero could not be reached.'); }
          finally { form.reset(); setBusy(false); abort.current = null; }
        }}>
          <label className="text-xs font-semibold">Library kind<select name="kind" disabled={busy || disabled} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2"><option value="users">User library</option><option value="groups">Group library</option></select></label>
          <label className="text-xs font-semibold">Numeric library ID<input name="library" required pattern="[0-9]+" disabled={busy || disabled} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" /></label>
          <label className="text-xs font-semibold sm:col-span-2">Read-access API key (optional for public libraries)<input name="key" type="password" autoComplete="off" disabled={busy || disabled} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2" /></label>
          <button type="submit" disabled={busy || disabled} className="btn-academic-secondary px-3 py-2 cursor-pointer disabled:opacity-50">Preview Zotero records</button>
          {busy && <button type="button" onClick={() => abort.current?.abort()} className="underline text-xs cursor-pointer">Cancel request</button>}
        </form>
      </details>
      {busy && <p role="status">Reading reference records…</p>}
      {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
      {preview.length > 0 && <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 space-y-3">
        <p className="text-xs font-semibold">{preview.length} records ready from {origin}</p>
        <ul className="max-h-48 overflow-y-auto space-y-2 text-xs">{preview.slice(0, 20).map((paper, index) => <li key={index}>{paper.title} ({paper.year || 'year unknown'})</li>)}</ul>
        {preview.length > 20 && <p className="text-xs">Showing the first 20 records.</p>}
        <p className="text-xs">Duplicates will be merged by DOI or title, year, and author. Live-search filters are not applied to imports. Imported records have not been verified or counted as a live registry search.</p>
        <button type="button" disabled={disabled || busy} onClick={() => { onImport(preview, origin); setPreview([]); }} className="btn-academic-primary px-4 py-2 cursor-pointer">Add {preview.length} records to results</button>
        <button type="button" onClick={() => setPreview([])} className="ml-3 underline text-xs cursor-pointer">Discard preview</button>
      </div>}
      <p className="text-xs">Use the results export menu to send RIS or BibTeX back to your reference manager. Google Scholar, Scopus, Lens, and Web of Science are not queried directly here; use their permitted export workflows.</p>
    </div>
  </details>;
}

import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Loader2, 
  Copy, 
  Check, 
  BookmarkPlus, 
  BookOpen
} from 'lucide-react';
import { verifyReferenceBatch, type VerifiedReferenceResult } from '../services/referenceVerifierService';
import { CITATION_STYLES } from '../services/citationFormatter';
import { addPaperToCart, isPaperInCart } from '../services/cartService';

export const DoiResolverTab: React.FC = () => {
  const [doiInput, setDoiInput] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolvedResult, setResolvedResult] = useState<VerifiedReferenceResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleResolve = async () => {
    if (!doiInput.trim() || isResolving) return;
    setIsResolving(true);
    setResolvedResult(null);
    setErrorMessage('');
    setAddedToCart(false);

    try {
      const res = await verifyReferenceBatch(doiInput.trim());
      if (res.results.length > 0 && res.results[0].verifiedPaper) {
        setResolvedResult(res.results[0]);
      } else {
        setErrorMessage('Could not resolve DOI or citation. Please verify the identifier or format.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lookup failed.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAddToCart = () => {
    if (!resolvedResult?.verifiedPaper) return;
    addPaperToCart(resolvedResult.verifiedPaper);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
        <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200 font-serif flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Instant DOI &amp; BibTeX Single-Reference Resolver</span>
        </h3>
        <p className="text-xs text-blue-900/80 dark:text-blue-300/80 mt-0.5 font-sans">
          Resolve any raw DOI, PubMed ID, or BibTeX snippet into verified CrossRef publisher metadata, official links, and all citation styles.
        </p>
      </div>

      {/* Input Field and Action */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-serif block">
          Enter Digital Object Identifier (DOI) or Raw Citation / BibTeX:
        </label>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={doiInput}
            onChange={(e) => setDoiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
            placeholder="e.g. 10.1038/s41586-020-2649-2 or 10.1145/3318464.3389700"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-700"
          />
          <button
            type="button"
            onClick={handleResolve}
            disabled={isResolving || !doiInput.trim()}
            className="btn-academic-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isResolving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Search className="w-3.5 h-3.5" />}
            <span>Resolve Reference</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Resolved Result Card */}
      {resolvedResult && resolvedResult.verifiedPaper && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs animate-in fade-in duration-150">
          
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Publisher Record Found ({resolvedResult.confidence}% confidence)</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs transition"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>{addedToCart || isPaperInCart(resolvedResult.verifiedPaper) ? 'Saved in Cart' : 'Save to Cart'}</span>
              </button>

              <a
                href={resolvedResult.verifiedPaper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs transition"
              >
                <span>Publisher Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white font-serif leading-snug">
              {resolvedResult.verifiedPaper.title}
            </h4>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-1.5 flex flex-wrap items-center gap-2">
              <span><strong>Authors:</strong> {resolvedResult.verifiedPaper.authors.map((a) => a.name).join(', ')}</span>
              <span>•</span>
              <span><strong>{resolvedResult.verifiedPaper.year}</strong></span>
              <span>•</span>
              <span><em>{resolvedResult.verifiedPaper.venue}</em></span>
              {resolvedResult.verifiedPaper.doi && (
                <>
                  <span>•</span>
                  <span className="font-mono text-blue-700 dark:text-blue-400">{resolvedResult.verifiedPaper.doi}</span>
                </>
              )}
            </div>
          </div>

          {/* Formatted Citations in All Styles */}
          <div className="pt-2">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-serif mb-2.5">
              Citation Formats Ready to Copy:
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CITATION_STYLES.map((st) => (
                <div key={st.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider font-serif">
                      {st.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(resolvedResult.correctedCitations[st.id] || '', st.id)}
                      className="text-xs text-blue-800 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedKey === st.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === st.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-serif text-xs text-slate-900 dark:text-white leading-relaxed">
                    {resolvedResult.correctedCitations[st.id]}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

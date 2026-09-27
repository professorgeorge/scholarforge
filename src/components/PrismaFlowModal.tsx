import React, { useState } from 'react';
import { X, Copy, Check, FileText, ArrowDown, Database, Filter, CheckCircle2 } from 'lucide-react';
import type { PrismaFlowStats } from '../services/federatedSearchEngine';
import { generatePrismaProse } from '../services/federatedSearchEngine';

interface PrismaFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PrismaFlowStats;
  query: string;
}

export const PrismaFlowModal: React.FC<PrismaFlowModalProps> = ({
  isOpen,
  onClose,
  stats,
  query,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const prose = generatePrismaProse(query, stats);

  const handleCopy = () => {
    navigator.clipboard.writeText(prose);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dbs = stats.identification.databaseCounts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 dark:bg-blue-800 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                  PRISMA 2020 Flow Protocol &amp; Metrics
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Systematic Standard
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Audit trail for identification, screening attrition, and included review corpus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* PRISMA 2020 Flow Diagram Cards */}
          <div className="space-y-4">
            
            {/* 1. Identification Box */}
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  1. Identification Phase
                </span>
                <span className="text-sm font-extrabold text-blue-950 dark:text-blue-200 font-mono">
                  {stats.identification.totalIdentified} Records Identified
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px]">OpenAlex</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dbs.openalex}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px]">Europe PMC</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dbs.europepmc}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px]">Crossref</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dbs.crossref}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px]">Semantic Scholar</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dbs.semanticscholar}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-slate-400 block text-[10px]">arXiv</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dbs.arxiv}</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-blue-700 dark:text-blue-300">
                Duplicates removed before screening: <strong>{stats.identification.duplicatesRemoved} records</strong>
              </div>
            </div>

            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            {/* 2. Screening Box */}
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  2. Screening &amp; Eligibility
                </span>
                <span className="text-sm font-extrabold text-amber-950 dark:text-amber-200 font-mono">
                  {stats.screening.recordsScreened} Records Screened
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex justify-between">
                  <span>Excluded non-peer-reviewed preprints:</span>
                  <strong className="font-mono">{stats.screening.excludedPreprints}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Excluded below citation impact threshold:</span>
                  <strong className="font-mono">{stats.screening.excludedLowCitations}</strong>
                </div>
                <div className="flex justify-between border-t border-amber-200 dark:border-amber-900 pt-1 font-bold">
                  <span>Total Excluded:</span>
                  <span className="font-mono">{stats.screening.totalExcluded}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </div>

            {/* 3. Included Box */}
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  3. Included in Synthesis Corpus
                </span>
                <span className="text-base font-extrabold text-emerald-950 dark:text-emerald-200 font-mono">
                  {stats.included.totalIncluded} Verified Studies
                </span>
              </div>
            </div>
          </div>

          {/* Generated Publication Methodology Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Manuscript Methodology Text (PRISMA 2020 Statement)
              </h4>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-900 dark:bg-blue-800 text-white flex items-center gap-1.5 cursor-pointer hover:bg-blue-800 dark:hover:bg-blue-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Methodology Prose'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {prose}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

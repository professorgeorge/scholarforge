import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  Copy,
  Check,
  ArrowRight,
  FileText,
  Layers,
  Award,
  BarChart3
} from 'lucide-react';
import {
  evaluateEditorialReadiness,
  generateReadinessCertificateMarkdown,
  type EditorialReadinessReport,
  type ReadinessCheckItem
} from '../services/editorialReadinessService';
import type { ActiveManuscriptContext } from '../services/manuscriptParserService';
import type { AcademicPillar } from './Navbar';

interface EditorialReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  manuscript: ActiveManuscriptContext | null;
  onNavigateToPillar: (pillar: AcademicPillar) => void;
}

export const EditorialReadinessModal: React.FC<EditorialReadinessModalProps> = ({
  isOpen,
  onClose,
  manuscript,
  onNavigateToPillar,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'all_checks' | 'certificate'>('overview');
  const [copiedCertificate, setCopiedCertificate] = useState(false);

  // Compute live report
  const report: EditorialReadinessReport = useMemo(() => {
    return evaluateEditorialReadiness(manuscript);
  }, [manuscript]);

  if (!isOpen) return null;

  const handleCopyCertificate = () => {
    const md = generateReadinessCertificateMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopiedCertificate(true);
    setTimeout(() => setCopiedCertificate(false), 2500);
  };

  const handleDownloadCertificate = () => {
    const md = generateReadinessCertificateMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Editorial_Readiness_Certificate_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerAction = (item: ReadinessCheckItem) => {
    if (item.targetPillar) {
      onNavigateToPillar(item.targetPillar);
      onClose();
    }
  };

  // Color scheme helpers based on score
  const getScoreColor = (score: number) => {
    if (score >= 88) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500';
    if (score >= 72) return 'text-blue-600 dark:text-blue-400 border-blue-500';
    if (score >= 52) return 'text-amber-600 dark:text-amber-400 border-amber-500';
    return 'text-rose-600 dark:text-rose-400 border-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 88) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';
    if (score >= 72) return 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    if (score >= 52) return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800';
    return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                  Pre-Submission Editorial Readiness Scorecard
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                  The Confidence Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated pre-flight desk-rejection risk audit against Nature, Elsevier, Springer, and APA standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCertificate}
              disabled={report.overallScore === 0}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
              title="Download Markdown Certificate"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export Certificate</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs font-semibold">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Readiness Overview &amp; Fixes</span>
            </button>

            <button
              onClick={() => setActiveTab('all_checks')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'all_checks'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All 16 Editorial Checks</span>
            </button>

            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'certificate'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Certificate Dossier</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden md:inline">
            Active: <strong className="text-slate-700 dark:text-slate-200">{report.manuscriptTitle.slice(0, 35)}...</strong>
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: OVERVIEW & PRIORITY REMEDIATIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Hero Scorecard Card */}
              <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-5 shadow-xs ${getScoreBg(report.overallScore)}`}>
                <div className="flex items-center gap-4">
                  {/* Circular Score Badge */}
                  <div className={`w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 flex flex-col items-center justify-center shadow-md shrink-0 ${getScoreColor(report.overallScore)}`}>
                    <span className="text-2xl font-black font-mono leading-none">
                      {report.overallScore}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      / 100 pts
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-serif text-slate-900 dark:text-white">
                        {report.tierLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                      {report.tierDescription}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>📄 <strong>{report.wordCount.toLocaleString()}</strong> words</span>
                      <span>•</span>
                      <span>📚 <strong>{report.referenceCount}</strong> detected citations</span>
                      <span>•</span>
                      <span>🛡️ <strong>{report.actionableRemediations.length}</strong> action items flagged</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCertificate}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Audit Certificate</span>
                </button>
              </div>

              {/* 5-Category Progress Bars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {report.categories.map((cat) => {
                  const pass = cat.percentage >= 75;
                  const warn = cat.percentage >= 50 && cat.percentage < 75;
                  return (
                    <div
                      key={cat.category}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                          {cat.label.split(' ')[0]}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${
                          pass ? 'text-emerald-600 dark:text-emerald-400' : warn ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {cat.percentage}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pass ? 'bg-emerald-500' : warn ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {cat.score} / {cat.maxScore} pts
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Priority Actionable Remediation Center */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-serif flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Editorial Pre-Flight Remediation Checklist ({report.actionableRemediations.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Fix items below to prevent desk rejection before submitting to journal portals.
                  </span>
                </div>

                {report.actionableRemediations.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h5 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                        Zero Editorial Deficiencies Detected!
                      </h5>
                      <p className="text-xs text-emerald-800/80 dark:text-emerald-400 mt-0.5">
                        Your manuscript successfully passed all 16 editorial integrity and formatting checks.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {report.actionableRemediations.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          item.status === 'fail'
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                        } flex flex-wrap items-center justify-between gap-4`}
                      >
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                              item.status === 'fail'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {item.status === 'fail' ? 'Desk-Reject Risk' : 'Advisory Polish'}
                            </span>
                            <h5 className="font-bold text-slate-900 dark:text-white text-xs font-serif">
                              {item.title}
                            </h5>
                            {item.metric && (
                              <span className="text-[10px] font-mono text-slate-400">
                                ({item.metric})
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {item.description}
                          </p>

                          {item.recommendation && (
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pt-1">
                              <ArrowRight className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{item.recommendation}</span>
                            </p>
                          )}
                        </div>

                        {item.targetPillar && (
                          <button
                            type="button"
                            onClick={() => handleTriggerAction(item)}
                            className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition shrink-0"
                          >
                            <span>{item.actionLabel || 'Fix in Workbench'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ALL 16 CHECKS (COMPREHENSIVE AUDIT LEDGER) */}
          {activeTab === 'all_checks' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {report.categories.map((cat) => (
                <div key={cat.category} className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold font-serif text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <span>{cat.label}</span>
                      <span className="text-[10px] font-mono font-normal text-slate-400">
                        ({cat.score} / {cat.maxScore} points)
                      </span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {cat.percentage}% compliant
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {cat.items.map((it) => (
                      <div
                        key={it.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {it.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {it.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                          {it.status === 'fail' && <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
                          
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-white mr-2">
                              {it.title}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {it.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            {it.pointsEarned} / {it.pointsPossible} pts
                          </span>
                          {it.targetPillar && it.status !== 'pass' && (
                            <button
                              type="button"
                              onClick={() => handleTriggerAction(it)}
                              className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: AUDIT CERTIFICATE DOSSIER */}
          {activeTab === 'certificate' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Ready-to-export markdown certificate. Authors can save this dossier or include it in their submission package.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCertificate}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition border border-slate-200 dark:border-slate-700"
                  >
                    {copiedCertificate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCertificate ? 'Copied' : 'Copy Markdown'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCertificate}
                    className="btn-academic-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[55vh] overflow-y-auto">
                {generateReadinessCertificateMarkdown(report)}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deterministic editorial evaluation • Client-side local architecture (No central server storage)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
};

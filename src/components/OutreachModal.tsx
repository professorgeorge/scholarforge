import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Mail, Sparkles, Award, FileEdit, Briefcase, ShieldCheck } from 'lucide-react';
import type { ReviewerCandidate, SearchObjective } from '../types/expertSearch';
import { generateOutreachEmail, type OutreachTone } from '../services/outreachGenerator';

interface OutreachModalProps {
  candidate: ReviewerCandidate | null;
  manuscriptTitle: string;
  objective?: SearchObjective;
  onClose: () => void;
}

export const OutreachModal: React.FC<OutreachModalProps> = ({
  candidate,
  manuscriptTitle,
  objective = 'reviewer',
  onClose
}) => {
  const [tone, setTone] = useState<OutreachTone>('collegial');

  const defaultContext = useMemo(() => {
    switch (objective) {
      case 'grant_coi': return 'Multi-Disciplinary Research Consortium';
      case 'coauthor': return 'Collaborative Research Initiative';
      case 'consultant': return 'Strategic Innovation & Due Diligence Advisory';
      case 'reviewer':
      default: return 'Journal of Advanced Scientific Inquiry';
    }
  }, [objective]);

  const [customContextName, setCustomContextName] = useState<string | null>(null);
  const contextName = customContextName !== null ? customContextName : defaultContext;

  const generated = useMemo(() => {
    if (!candidate) return { subject: '', body: '', objective };
    return generateOutreachEmail(candidate, manuscriptTitle, contextName, tone, objective);
  }, [candidate, manuscriptTitle, contextName, tone, objective]);

  const [editedSubject, setEditedSubject] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const subject = editedSubject !== null ? editedSubject : generated.subject;
  const body = editedBody !== null ? editedBody : generated.body;

  const handleToneChange = (newTone: OutreachTone) => {
    setTone(newTone);
    setEditedSubject(null);
    setEditedBody(null);
  };

  const handleContextChange = (newContext: string) => {
    setCustomContextName(newContext);
    setEditedSubject(null);
    setEditedBody(null);
  };

  if (!candidate) return null;

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailto = () => {
    const emailTo = candidate.email || '';
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const getObjectiveModalConfig = () => {
    switch (objective) {
      case 'grant_coi':
        return {
          title: 'Tailored Grant Co-I Outreach Pitch',
          icon: <Award className="w-5 h-5 text-amber-500" />,
          contextLabel: 'Consortium / Submitting Lead Organization',
          toneOptions: [
            { value: 'collegial', label: 'Collegial Partnership Pitch (Higher Response Rate)' },
            { value: 'formal', label: 'Formal Co-Investigator Invitation' },
            { value: 'expedited', label: 'Upcoming Grant Deadline (Time-Sensitive)' }
          ]
        };
      case 'coauthor':
        return {
          title: 'Paper Co-Authorship Collaboration Invitation',
          icon: <FileEdit className="w-5 h-5 text-emerald-500" />,
          contextLabel: 'Research Group / Lead Institution',
          toneOptions: [
            { value: 'collegial', label: 'Collegial Collaboration Invitation (Recommended)' },
            { value: 'formal', label: 'Formal Co-Authorship Proposal' },
            { value: 'expedited', label: 'Fast-Track Manuscript Finalization' }
          ]
        };
      case 'consultant':
        return {
          title: 'Consulting & SME Advisory Retainer Inquiry',
          icon: <Briefcase className="w-5 h-5 text-blue-500" />,
          contextLabel: 'Company / Advisory Practice / Investment Firm',
          toneOptions: [
            { value: 'collegial', label: 'Collegial Advisory Inquiry' },
            { value: 'formal', label: 'Formal Retainer / Diligence Engagement' },
            { value: 'expedited', label: 'Time-Critical Diligence Requirement' }
          ]
        };
      case 'reviewer':
      default:
        return {
          title: 'Editorial Peer Review Invitation Letter',
          icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
          contextLabel: 'Journal Title / Editorial Office',
          toneOptions: [
            { value: 'collegial', label: 'Personalized Collegial Invitation' },
            { value: 'formal', label: 'Standard Editorial Board Invitation' },
            { value: 'expedited', label: 'Expedited Decision Required (10 Days)' }
          ]
        };
    }
  };

  const config = getObjectiveModalConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {config.icon}
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                {config.title}
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Recipient: <strong>{candidate.name}</strong> ({candidate.primaryInstitution})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Tone Selector & Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold uppercase tracking-wider block mb-1.5 text-slate-600 dark:text-slate-400 font-sans">
                Outreach Tone & Urgency:
              </label>
              <select
                value={tone}
                onChange={(e) => handleToneChange(e.target.value as OutreachTone)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
              >
                {config.toneOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider block mb-1.5 text-slate-600 dark:text-slate-400 font-sans">
                {config.contextLabel}:
              </label>
              <input
                type="text"
                value={contextName}
                onChange={(e) => handleContextChange(e.target.value)}
                placeholder="Organization or journal name..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* Email Subject */}
          <div>
            <label className="font-bold uppercase tracking-wider block mb-1.5 text-slate-600 dark:text-slate-400 font-sans">
              Subject Line:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-700 font-sans"
            />
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-sans">
                Personalized Message Body:
              </label>
              <span className="text-[11px] text-blue-800 dark:text-blue-400 flex items-center gap-1 font-sans">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cites candidate's recent publication</span>
              </span>
            </div>
            <textarea
              rows={11}
              value={body}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-sans text-xs leading-relaxed focus:outline-none focus:border-blue-700"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Contact:</span>
            {candidate.email ? (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                {candidate.email}
              </span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                Email pending manual resolution
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
            </button>

            {candidate.email && (
              <button
                onClick={handleOpenMailto}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Mail className="w-4 h-4" />
                <span>Open in Email App</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

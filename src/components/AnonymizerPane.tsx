import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  Copy,
  Send,
  BookOpen,
  EyeOff,
  Lock,
  FileText,
  Zap,
  Info,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnonymizerPaneProps {
  onSendToStudio?: (text: string) => void;
  onNavigateToStudio?: () => void;
  initialText?: string;
}

const SAMPLE_IDENTIFIABLE_TEXT = `This multi-center clinical evaluation was conducted at Stanford University School of Medicine in collaboration with Oxford University. As we showed in our earlier work (George & Henderson, 2023), early biomarker detection significantly improves patient survival curves.

The experimental protocol was approved under Institutional Review Board Protocol #IRB-2022-8491 and supported by NIH Grant #R01-HL145290 and NSF Award #CNS-2018491. Complete de-identified datasets and replication source code are maintained at https://github.com/professorgeorge/clinical-biomarkers-evaluation. Direct correspondence can be addressed to the lead investigator at bgeorge@stanford.edu.

Acknowledgements:
The authors thank Professor Elizabeth Warren and the clinical oncology staff at Massachusetts General Hospital for specimen preparation and statistical review.`;

export const AnonymizerPane: React.FC<AnonymizerPaneProps> = ({
  onSendToStudio,
  onNavigateToStudio,
  initialText = ''
}) => {
  const [inputText, setInputText] = useState<string>(initialText);
  const [copied, setCopied] = useState<boolean>(false);
  const [studioSent, setStudioSent] = useState<boolean>(false);

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setInputText(initialText);
    }
  }, [initialText]);

  const anonymizationResult = useMemo(() => {
    if (!inputText.trim()) {
      return { output: '', count: 0, items: [] };
    }

    let text = inputText;
    let count = 0;
    const items: { type: string; original: string; replacement: string }[] = [];

    // 1. Self-citation patterns
    const selfCiteRegex = /(?:in\s+our\s+(?:previous|earlier|prior|recent)\s+(?:work|study|investigation|paper|findings)|as\s+(?:we|the\s+authors|our\s+group)\s+(?:showed|demonstrated|reported|published|established))\s*\(([^)]+)\)/gi;
    text = text.replace(selfCiteRegex, (match) => {
      count++;
      items.push({
        type: 'Self-Citation Pattern',
        original: match,
        replacement: '[Self-citation redacted for double-blind review]'
      });
      return `[Self-citation and author identification redacted for double-blind review]`;
    });

    // 2. Institutional names & Universities
    const instRegex = /\b(?:at|from|conducted\s+at|approved\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College|Institute|Hospital|Center|School\s+of\s+[A-Z][a-z]+|Medical\s+Center))\b/g;
    text = text.replace(instRegex, (_match, inst) => {
      count++;
      items.push({
        type: 'Institutional Affiliation',
        original: inst,
        replacement: '[Institutional Affiliation Redacted]'
      });
      return `at [Institutional Affiliation Redacted for Review]`;
    });

    // 3. Grant / IRB / Protocol numbers
    const grantRegex = /\b(?:NSF|NIH|Grant|Protocol|IRB|CIHR|UKRI|Wellcome\s+Trust|ERC|Horizon)\s*#?\s*([A-Z0-9-]+)\b/gi;
    text = text.replace(grantRegex, (match) => {
      count++;
      items.push({
        type: 'Grant / Ethics ID',
        original: match,
        replacement: '[Grant/Ethics Protocol Redacted]'
      });
      return `[Grant / Protocol Number Redacted for Review]`;
    });

    // 4. Institutional & Personal Email Addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:edu|ac\.uk|org|com|net|gov)\b/gi;
    text = text.replace(emailRegex, (match) => {
      count++;
      items.push({
        type: 'Author Email Address',
        original: match,
        replacement: '[author-email-redacted@anonymous.org]'
      });
      return `[author-email-redacted@anonymous.org]`;
    });

    // 5. Code Repositories & User Profiles (GitHub, OSF, GitLab)
    const repoRegex = /https?:\/\/(?:www\.)?(?:github|osf|gitlab)\.(?:com|io)\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)/gi;
    text = text.replace(repoRegex, (match) => {
      count++;
      items.push({
        type: 'Repository URL with Username',
        original: match,
        replacement: 'https://anonymous-repository-redacted.org'
      });
      return `https://anonymous-repository-redacted.org/view`;
    });

    // 6. Acknowledgments Block
    const ackRegex = /(?:Acknowledgements?|Author\s+Contributions?|Funding\s+Disclosures?):[\s\S]*?(?=\n\n[A-Z]|\n\n#|\n\n$|$)/gi;
    text = text.replace(ackRegex, (match) => {
      count++;
      items.push({
        type: 'Acknowledgements Block',
        original: match.slice(0, 60) + '...',
        replacement: '[Acknowledgements Section Redacted]'
      });
      return `[Acknowledgements and Author Disclosures Redacted for Double-Blind Review]`;
    });

    return { output: text, count, items };
  }, [inputText]);

  const handleCopy = () => {
    if (!anonymizationResult.output) return;
    navigator.clipboard.writeText(anonymizationResult.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToStudio = () => {
    if (!anonymizationResult.output || !onSendToStudio) return;
    onSendToStudio(anonymizationResult.output);
    setStudioSent(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#059669', '#10b981', '#3b82f6']
    });
    setTimeout(() => setStudioSent(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold uppercase tracking-wider font-mono">
              Stage 4 • Submission Integrity
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-300">
              Double-Blind Peer Review Sanitize &amp; De-Identification
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif mt-1">
            Double-Blind Peer Review Anonymizer &amp; De-Identifier
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Automatically scrub self-citations, institutional affiliations, contact emails, grant award IDs, and personal repositories.
          </p>
        </div>

        {onNavigateToStudio && (
          <button
            type="button"
            onClick={onNavigateToStudio}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Manuscript Studio</span>
          </button>
        )}
      </div>

      {/* 1-Click Demo Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Double-Blind De-Identification Demo:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInputText(SAMPLE_IDENTIFIABLE_TEXT)}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 cursor-pointer transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Load Sample Text with Identifiers</span>
          </button>

          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Pane Anonymizer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: Input Text */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                Original Manuscript Draft / Methods / Acknowledgments:
              </label>
            </div>

            <textarea
              rows={14}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste manuscript sections, grant details, acknowledgments, or methods with institution names..."
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 font-sans leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{inputText.length} characters • {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words</span>
            <span>Scans: Self-citations, Affiliations, Grants, Repos, Emails</span>
          </div>
        </div>

        {/* Right: Sanitized Output */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-serif flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sanitized Double-Blind Output:</span>
              </label>

              {anonymizationResult.count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                  {anonymizationResult.count} {anonymizationResult.count === 1 ? 'redaction' : 'redactions'} applied
                </span>
              )}
            </div>

            {anonymizationResult.output ? (
              <div className="w-full min-h-[310px] p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                {anonymizationResult.output}
              </div>
            ) : (
              <div className="w-full min-h-[310px] p-5 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif">
                      Double-Blind Peer Review Compliance Protocol
                    </h4>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Automated redaction filters for premier journal refereeing
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. Self-Citations</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Replaces "as we showed in Smith et al." with <em>[Author Citation Redacted]</em>.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. Institutions &amp; Clinics</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Masks university departments, medical center names, and geographic sites.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>3. Grants &amp; IRB Protocols</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Shields NIH/NSF award numbers, grant contracts, and institutional ethics IDs.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>4. Repositories &amp; Links</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Neutralizes author-identifying GitHub / OSF usernames and contact emails.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ready. Paste your manuscript text on the left or click the sample demo button above.</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-slate-500 font-sans">
              Complies with APA, Elsevier, Springer &amp; IEEE double-blind review mandates.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!anonymizationResult.output}
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Sanitized Text'}</span>
              </button>

              {onSendToStudio && (
                <button
                  type="button"
                  disabled={!anonymizationResult.output}
                  onClick={handleSendToStudio}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  title="Update Manuscript Studio draft with this sanitized copy"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{studioSent ? '✓ Draft Updated!' : 'Replace Draft in Studio'}</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Redaction Audit Log when items found */}
      {anonymizationResult.items.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-serif">
                Applied Redactions Audit Log ({anonymizationResult.items.length} Elements Masked):
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Double-Blind Verification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {anonymizationResult.items.map((item, idx) => (
              <div 
                key={idx} 
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
              >
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  {item.type}
                </span>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono truncate">
                  - {item.original}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                  + {item.replacement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

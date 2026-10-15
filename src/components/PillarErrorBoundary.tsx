import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  pillarName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class PillarErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Pillar [${this.props.pillarName}] Error Caught:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  private handleCopy = () => {
    const details = `Pillar: ${this.props.pillarName}\nError: ${this.state.error?.message || 'Unknown'}\nStack: ${this.state.error?.stack || ''}\nComponentStack: ${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 shadow-sm max-w-3xl mx-auto my-8 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 font-mono">
                  Isolated Workspace Error
                </span>
                <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                  {this.props.pillarName}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif mt-1">
                This tool encountered an unexpected rendering exception
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Your active manuscript, loaded citations, and other tools remain safe and unaffected in session memory.
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 font-mono text-xs text-rose-700 dark:text-rose-300 overflow-x-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload {this.props.pillarName}</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied Trace</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Error Details</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

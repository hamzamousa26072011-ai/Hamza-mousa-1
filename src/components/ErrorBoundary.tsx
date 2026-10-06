import React, { ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends (React.Component as new (props: Props) => any) {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error("[Engez ErrorBoundary] Uncaught React Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem("engez_chat_threads_v3");
      localStorage.removeItem("engez_active_thread_id_v3");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isQuotaError = 
        this.state.error?.name === "QuotaExceededError" ||
        this.state.error?.message?.includes("quota") ||
        this.state.error?.message?.includes("exceeded the quota");

      return (
        <div className="min-h-screen w-full bg-[#FAF9F5] text-[#1D1D1B] flex items-center justify-center p-4 font-sans">
          <div className="max-w-lg w-full bg-white border border-[#E3E0D8] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9] flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-sans tracking-tight text-[#1D1D1B]">
                {isQuotaError ? "Storage Limit Reached" : "Engez Workspace Recovery"}
              </h1>
              <p className="text-xs text-[#77736B] leading-relaxed max-w-sm mx-auto">
                {isQuotaError
                  ? "A large document or image attachment exceeded the browser's local cache quota. Your session is protected."
                  : "An unexpected rendering event was intercepted. You can reload your workspace smoothly."}
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-[#F7F6F2] border border-[#E3E0D8] rounded-xl p-3 text-[11px] font-mono text-[#77736B] overflow-x-auto max-h-28">
                <span className="font-bold text-[#1D1D1B] block mb-1">Diagnostic Details:</span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C96F55] hover:bg-[#B85F48] text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw size={14} />
                <span>Reload Workspace</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-rose-50 border border-[#E3E0D8] hover:border-rose-300 text-[#77736B] hover:text-rose-600 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Clears corrupted chat cache while preserving your account settings"
              >
                <Trash2 size={13} />
                <span>Reset Chat Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

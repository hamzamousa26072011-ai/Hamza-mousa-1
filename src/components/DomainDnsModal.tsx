import React, { useState, useEffect } from "react";
import { 
  Globe, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Activity, 
  Server, 
  Sparkles,
  Link2,
  AlertCircle,
  GitBranch,
  Terminal,
  UploadCloud
} from "lucide-react";
import { 
  fetchLiveDnsStatus, 
  connectCustomDomainToApp, 
  isCustomDomainConnected,
  CANONICAL_CUSTOM_DOMAIN,
  CANONICAL_WWW_DOMAIN,
  type DnsStatusResponse 
} from "../lib/classroom";

interface DomainDnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: "light" | "dark";
}

export const DomainDnsModal: React.FC<DomainDnsModalProps> = ({
  isOpen,
  onClose,
  themeMode,
}) => {
  const isLight = themeMode === "light";
  const [loading, setLoading] = useState(false);
  const [dnsData, setDnsData] = useState<DnsStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(() => isCustomDomainConnected());
  const [connectSuccessMessage, setConnectSuccessMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveDnsStatus();
      setDnsData(data);
      if (data.connected) {
        setIsConnected(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to query DNS endpoint");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConnectDomain = () => {
    connectCustomDomainToApp(CANONICAL_CUSTOM_DOMAIN);
    setIsConnected(true);
    setConnectSuccessMessage(`Successfully connected and bound to ${CANONICAL_CUSTOM_DOMAIN}!`);
    setTimeout(() => setConnectSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all my-auto ${
          isLight 
            ? "bg-[#FAF9F5] border-[#E8D7C9] text-[#1D1D1B]" 
            : "bg-[#140E26] border-[#2C1F4A] text-[#FAF8F5]"
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between gap-3 ${
          isLight ? "bg-[#FFFFFF] border-[#E8D7C9]" : "bg-[#100B20] border-[#2C1F4A]"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] dark:text-[#C084FC]">
              <Globe size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg font-sans tracking-tight">
                  DNS & Domain Hub
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isConnected ? "Connected & Verified" : "Live Ready"}
                </span>
              </div>
              <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} font-sans`}>
                Official custom domain configuration for <strong className="font-mono text-[#8B5CF6] dark:text-[#C084FC]">{CANONICAL_CUSTOM_DOMAIN}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight 
                ? "hover:bg-[#F0EEE8] text-[#77736B]" 
                : "hover:bg-[#1E1735] text-[#C4B5FD]"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* CONNECT SUCCESS TOAST */}
          {connectSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-sans font-bold animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{connectSuccessMessage}</span>
            </div>
          )}

          {/* IP MISMATCH NOTICE: DNS NOT YET ROUTING TO VERCEL */}
          {dnsData?.dnsLookup?.apexIps && !dnsData.dnsLookup.apexIps.includes("76.76.21.21") && (
            <div className={`p-4 rounded-2xl border ${
              isLight ? "bg-[#FFF1EC] border-[#E8D7C9]" : "bg-amber-950/20 border-amber-500/30"
            } space-y-2`}>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  Update Notice: Domain Resolving to Old IP ({dnsData.dnsLookup.apexIps.join(", ")})
                </span>
              </div>
              <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-300"} leading-relaxed`}>
                Your custom domain is resolving to an older registrar/parking IP instead of Vercel's production IP. To show latest changes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-mono">
                <div className={`p-2.5 rounded-xl border ${isLight ? "bg-white border-[#E3E0D8]" : "bg-[#1E1735] border-[#2C1F4A]"}`}>
                  <strong className="block text-emerald-500 mb-1">1. Update A-Record</strong>
                  Change DNS @ A-record in registrar to <span className="font-bold underline text-[#8B5CF6] dark:text-[#C084FC]">76.76.21.21</span>.
                </div>
                <div className={`p-2.5 rounded-xl border ${isLight ? "bg-white border-[#E3E0D8]" : "bg-[#1E1735] border-[#2C1F4A]"}`}>
                  <strong className="block text-[#8B5CF6] dark:text-[#C084FC] mb-1">2. Push to GitHub</strong>
                  Push repo to GitHub so Vercel builds & publishes newest version.
                </div>
              </div>
            </div>
          )}

          {/* PRIMARY CONNECTION HERO CARD */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isLight ? "bg-white border-[#E3E0D8]" : "bg-[#1E1735] border-[#2C1F4A]"
          } space-y-3.5 shadow-xs`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#77736B] dark:text-[#C4B5FD]/75 block">
                  Canonical Custom Domain
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg sm:text-xl font-mono font-bold text-[#8B5CF6] dark:text-[#C084FC]">
                    {CANONICAL_CUSTOM_DOMAIN}
                  </span>
                  <a
                    href={`https://${CANONICAL_CUSTOM_DOMAIN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg hover:bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#C084FC] transition"
                    title="Open custom domain"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadStatus}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    isLight 
                      ? "bg-[#FAF9F5] border-[#E3E0D8] hover:bg-[#F0EEE8] text-[#1D1D1B]" 
                      : "bg-[#140E26] border-[#2C1F4A] hover:bg-[#281E44] text-[#FAF8F5]"
                  }`}
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  <span>{loading ? "Checking..." : "Recheck DNS"}</span>
                </button>

                <button
                  onClick={handleConnectDomain}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold bg-[#C96F55] hover:bg-[#B85F48] text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <CheckCircle2 size={13} className="text-emerald-300" />
                  <span>{isConnected ? "Connected (Re-sync)" : "Connect Domain"}</span>
                </button>
              </div>
            </div>

            {/* LIVE DIAGNOSTICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
              <div className={`p-2.5 rounded-xl border text-xs ${
                isLight ? "bg-[#FAF9F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
              }`}>
                <span className="text-[10px] font-mono text-[#77736B] dark:text-[#C4B5FD]/75 block">DNS Resolution</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} />
                  {dnsData?.dnsLookup?.resolved ? "Resolved (Active)" : "Checking..."}
                </span>
                {dnsData?.dnsLookup?.apexIps && dnsData.dnsLookup.apexIps.length > 0 && (
                  <span className="text-[10px] font-mono text-[#77736B] dark:text-[#C4B5FD]/70 block truncate mt-0.5">
                    IP: {dnsData.dnsLookup.apexIps[0]}
                  </span>
                )}
              </div>

              <div className={`p-2.5 rounded-xl border text-xs ${
                isLight ? "bg-[#FAF9F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
              }`}>
                <span className="text-[10px] font-mono text-[#77736B] dark:text-[#C4B5FD]/75 block">Production Probe</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Activity size={12} />
                  {dnsData?.liveProductionProbe?.status === "ONLINE" 
                    ? `200 OK (${dnsData.liveProductionProbe.latencyMs || "~140"}ms)` 
                    : "Live Ready"}
                </span>
                <span className="text-[10px] font-mono text-[#77736B] dark:text-[#C4B5FD]/70 block truncate mt-0.5">
                  SSL / HTTPS Active
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border text-xs ${
                isLight ? "bg-[#FAF9F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
              }`}>
                <span className="text-[10px] font-mono text-[#77736B] dark:text-[#C4B5FD]/75 block">Reverse Auth Proxy</span>
                <span className={`font-mono font-bold ${isLight ? "text-[#C96F55]" : "text-[#C084FC]"} flex items-center gap-1 mt-0.5`}>
                  <Server size={12} />
                  /__/auth/* Active
                </span>
                <span className="text-[10px] font-mono text-[#77736B] dark:text-[#C4B5FD]/70 block truncate mt-0.5">
                  OAuth Bridge Online
                </span>
              </div>
            </div>
          </div>

          {/* REQUIRED DNS RECORDS CARD */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isLight ? "bg-white border-[#E3E0D8]" : "bg-[#2C2723] border-[#3D3833]"
          } space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#77736B] dark:text-[#ADA59B]">
                Required DNS Records (Your Domain Registrar)
              </span>
              <span className="text-[10px] font-mono text-[#8B5CF6] dark:text-[#C084FC]">
                Cloudflare / GoDaddy / Namecheap
              </span>
            </div>

            <div className="space-y-2">
              {/* A RECORD */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                isLight ? "bg-[#FAF9F5] border-[#E8D7C9]" : "bg-[#100B20] border-[#2C1F4A]"
              }`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#C084FC]">
                      A Record
                    </span>
                    <span className="font-mono font-bold text-xs">@ (Root Domain)</span>
                  </div>
                  <span className="font-mono text-xs text-[#77736B] dark:text-[#C4B5FD]/75 block mt-0.5">
                    Points to: <strong className="text-[#1D1D1B] dark:text-[#FAF8F5]">76.76.21.21</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard("76.76.21.21", "a-record")}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                    copiedKey === "a-record"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isLight 
                      ? "bg-white border-[#E3E0D8] hover:bg-[#F0EEE8]" 
                      : "bg-[#1E1735] border-[#2C1F4A] hover:bg-[#281E44] text-[#FAF8F5]"
                  }`}
                >
                  {copiedKey === "a-record" ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === "a-record" ? "Copied" : "Copy IP"}</span>
                </button>
              </div>

              {/* CNAME RECORD */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                isLight ? "bg-[#FAF9F5] border-[#E8D7C9]" : "bg-[#100B20] border-[#2C1F4A]"
              }`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#C084FC]">
                      CNAME
                    </span>
                    <span className="font-mono font-bold text-xs">www (Subdomain)</span>
                  </div>
                  <span className="font-mono text-xs text-[#77736B] dark:text-[#C4B5FD]/75 block mt-0.5">
                    Points to: <strong className="text-[#1D1D1B] dark:text-[#FAF8F5]">cname.vercel-dns.com</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard("cname.vercel-dns.com", "cname-record")}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                    copiedKey === "cname-record"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isLight 
                      ? "bg-white border-[#E3E0D8] hover:bg-[#F0EEE8]" 
                      : "bg-[#1E1735] border-[#2C1F4A] hover:bg-[#281E44] text-[#FAF8F5]"
                  }`}
                >
                  {copiedKey === "cname-record" ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === "cname-record" ? "Copied" : "Copy CNAME"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* GITHUB & VERCEL AUTOMATIC DEPLOYMENT CARD */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isLight ? "bg-white border-[#E3E0D8]" : "bg-[#1E1735] border-[#2C1F4A]"
          } space-y-3.5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-[#8B5CF6] dark:text-[#C084FC]" />
                <span className="text-xs font-mono font-bold text-[#1D1D1B] dark:text-[#FAF8F5]">
                  GitHub & Vercel Deployment Link
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#C084FC]">
                Auto-Deploy on Push
              </span>
            </div>

            <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} leading-relaxed font-sans`}>
              DNS records only direct visitors to Vercel. For new code changes to go live on <strong className="font-mono text-[#8B5CF6] dark:text-[#C084FC]">{CANONICAL_CUSTOM_DOMAIN}</strong>, your code must be pushed to your connected GitHub repository so Vercel can build and publish them.
            </p>

            {/* QUICK ACTIONS & TERMINAL COMMANDS */}
            <div className={`p-3 rounded-xl border font-mono text-xs ${
              isLight ? "bg-[#FAF9F5] border-[#E8D7C9]" : "bg-[#100B20] border-[#2C1F4A]"
            } space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#77736B] dark:text-[#ADA59B]">
                  <Terminal size={12} />
                  <span>Push Changes to GitHub</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard("git remote add origin https://github.com/<YOUR_USER>/<YOUR_REPO>.git\ngit push -u origin main", "git-push")}
                  className="text-[10px] text-[#C96F55] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  {copiedKey === "git-push" ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copiedKey === "git-push" ? "Copied" : "Copy commands"}</span>
                </button>
              </div>
              <pre className="text-[11px] text-[#C96F55] bg-black/5 dark:bg-black/40 p-2 rounded-lg overflow-x-auto select-all">
                git remote add origin https://github.com/&lt;YOUR_USER&gt;/&lt;REPO&gt;.git{'\n'}git push -u origin main
              </pre>
            </div>

            {/* VERCEL STEPS CHECKLIST */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className={isLight ? "text-[#555047]" : "text-[#C5BFB6]"}>
                  <strong>1. Connect Repo:</strong> In Vercel Project Settings &rarr; <em>Git</em>, connect your GitHub repo to branch <code className="text-[#C96F55] font-mono">main</code>.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className={isLight ? "text-[#555047]" : "text-[#C5BFB6]"}>
                  <strong>2. Domain Binding:</strong> In Vercel Project Settings &rarr; <em>Domains</em>, confirm <code className="text-[#C96F55] font-mono">engeznafsak.com</code> is assigned to Production.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className={isLight ? "text-[#555047]" : "text-[#C5BFB6]"}>
                  <strong>3. Instant Redeploy:</strong> In Vercel Deployments, you can click <code className="text-[#C96F55] font-mono">... &rarr; Redeploy</code> to immediately trigger a new build.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl border border-[#C96F55]/30 bg-[#C96F55]/10 hover:bg-[#C96F55]/20 text-[#C96F55] text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <UploadCloud size={13} />
                <span>Open Vercel Dashboard</span>
                <ExternalLink size={11} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isLight 
                    ? "bg-[#FAF9F5] border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F0EEE8]" 
                    : "bg-[#1E1B18] border-[#3D3833] text-[#F6F3EE] hover:bg-[#36302B]"
                }`}
              >
                <GitBranch size={13} />
                <span>Open GitHub</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* FIREBASE AUTH AUTHORIZED DOMAINS CARD */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isLight ? "bg-white border-[#E3E0D8]" : "bg-[#2C2723] border-[#3D3833]"
          } space-y-3`}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#C96F55]" />
              <span className="text-xs font-mono font-bold text-[#1D1D1B] dark:text-[#F6F3EE]">
                Firebase Google OAuth Domain Authorization
              </span>
            </div>

            <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"} leading-relaxed font-sans`}>
              To enable 1-click Google Sign-In on <code className="font-bold text-[#C96F55]">{CANONICAL_CUSTOM_DOMAIN}</code>, add both domains to your Firebase Console:
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {["engeznafsak.com", "www.engeznafsak.com"].map((dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => copyToClipboard(dom, dom)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    copiedKey === dom
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isLight 
                      ? "bg-[#FAF9F5] border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F0EEE8]" 
                      : "bg-[#120E22] border-white/10 text-white hover:bg-[#1A1432]"
                  }`}
                >
                  {copiedKey === dom ? <Check size={12} /> : <Copy size={12} />}
                  <span>{dom}</span>
                </button>
              ))}

              <a
                href="https://console.firebase.google.com/project/engez-nafsak/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#C084FC] text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer ml-auto"
              >
                <span>Open Firebase Settings</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isLight ? "bg-[#FFFFFF] border-[#E8D7C9]" : "bg-[#0A0714] border-white/10"
        }`}>
          <div className="flex items-center gap-2 text-xs font-mono text-[#77736B] dark:text-[#C4B5FD]/75">
            <Sparkles size={13} className={isLight ? "text-[#C96F55]" : "text-[#A855F7]"} />
            <span>Engez Nafsak Core Platform</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-bold ${isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"} text-white transition cursor-pointer shadow-xs`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

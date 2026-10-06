import React, { useState } from "react";
import { 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  KeyRound,
  FileCode2,
  ShieldCheck
} from "lucide-react";
import { clearClientQuarantine } from "../lib/securityShield";

interface SecurityLockdownModalProps {
  isOpen: boolean;
  incidentId: string;
  threatReason: string;
  onUnlocked: () => void;
}

export default function SecurityLockdownModal({
  isOpen,
  incidentId,
  threatReason,
  onUnlocked
}: SecurityLockdownModalProps) {
  const [challengeStep, setChallengeStep] = useState<"BLOCKED" | "SOLVING" | "VERIFIED">("BLOCKED");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("SECURE-8492");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleStartChallenge = () => {
    // Generate randomized human challenge code
    const randomCode = "HUMAN-" + Math.floor(1000 + Math.random() * 9000);
    setCaptchaCode(randomCode);
    setChallengeStep("SOLVING");
    setErrorMessage("");
  };

  const handleVerifyCaptcha = (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.trim().toUpperCase() === captchaCode) {
      setChallengeStep("VERIFIED");
      setTimeout(() => {
        clearClientQuarantine();
        onUnlocked();
        setChallengeStep("BLOCKED");
        setCaptchaInput("");
      }, 1200);
    } else {
      setErrorMessage("Verification code incorrect. Please re-enter the cryptographic human token.");
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-[#0a0812] border-2 border-red-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_80px_rgba(239,68,68,0.25)] relative overflow-hidden text-white space-y-6">
        
        {/* Ambient Threat Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Threat Header */}
        <div className="flex items-start justify-between border-b border-red-500/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl animate-pulse">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  CRITICAL DEFENSE ACTIVE
                </span>
                <span className="text-xs font-mono text-slate-400">WAF INTRUSION DETECTED</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                Security Threat Neutralized
              </h2>
            </div>
          </div>
          <Lock size={20} className="text-red-400/60 shrink-0 mt-1" />
        </div>

        {/* Threat Technical Breakdown */}
        <div className="space-y-3 bg-[#130d22] border border-red-500/20 rounded-2xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Terminal size={14} className="text-purple-400" />
              Incident Reference ID:
            </span>
            <span className="font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
              {incidentId || "SEC-BLOCKED-UNKNOWN"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 pt-1 text-slate-300">
            <span className="flex items-center gap-1.5 shrink-0 text-slate-400">
              <AlertTriangle size={14} className="text-amber-400" />
              Threat Vector:
            </span>
            <span className="text-right text-amber-200 break-all font-semibold">
              {threatReason || "Malicious Payload / Injection Signature Neutralized"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileCode2 size={14} className="text-indigo-400" />
              Action Enforced:
            </span>
            <span className="text-emerald-400 font-bold">
              HOSTILE_PAYLOAD_QUARANTINED
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong className="text-purple-300">Engez Automated Intrusion Prevention System</strong> detected an unauthorized pattern (SQL Injection, Script Injection, or System Probing). To safeguard your personal data, past papers, and study notes, all hazardous inputs have been isolated and blocked.
        </p>

        {/* Resolution Options */}
        {challengeStep === "BLOCKED" && (
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleStartChallenge}
              className="flex-1 py-3 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <KeyRound size={16} />
              <span>Verify Human Identity & Clear Lockdown</span>
            </button>
          </div>
        )}

        {challengeStep === "SOLVING" && (
          <form onSubmit={handleVerifyCaptcha} className="space-y-4 pt-1">
            <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-3 text-center">
              <span className="text-[11px] text-purple-200 block font-medium">
                Type the human verification code below to confirm this was a safe test:
              </span>
              <div className="font-mono text-xl font-black tracking-widest text-indigo-300 bg-black/60 py-2.5 px-4 rounded-xl border border-indigo-500/40 select-all inline-block">
                {captchaCode}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter code exactly..."
                className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Unlock</span>
              </button>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-red-400 font-mono text-center">
                {errorMessage}
              </p>
            )}
          </form>
        )}

        {challengeStep === "VERIFIED" && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-center gap-3 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>Verification Successful. Restoring Secure Session...</span>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            Zero-Trust Architecture Armed
          </span>
          <span>CIE / GDPR Cyber Standards</span>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from "react";
import { 
  Settings, 
  Clock, 
  Moon, 
  Sun, 
  BookOpen, 
  Plus, 
  Trash2, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  UserCheck, 
  Loader2, 
  Check,
  Globe
} from "lucide-react";
import { AppSettings } from "../types";
import { User } from "firebase/auth";

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  subjects: string[];
  onAddSubject: (subject: string) => void;
  onDeleteSubject: (subject: string) => void;
  currentUser: User | null;
  onLogout: () => Promise<void> | void;
  onLogin: () => Promise<void> | void;
  onGoogleLogin?: () => Promise<void> | void;
  onOpenPrivacyPolicy?: () => void;
  onOpenDnsModal?: () => void;
  isGoogleLoading?: boolean;
  themeMode?: "light" | "dark";
}

const COMMON_SYLLABUSES = [
  "CIE Mathematics 0580",
  "CIE Physics 0625",
  "CIE Chemistry 0620",
  "CIE Computer Science 0478",
  "CIE Biology 0610",
  "CIE English First Lang 0500",
  "Edexcel Pure Math (A-Level)",
  "Digital SAT Prep"
];

export default function SettingsTab({
  settings,
  onUpdateSettings,
  subjects,
  onAddSubject,
  onDeleteSubject,
  currentUser,
  onLogout,
  onLogin,
  onGoogleLogin,
  onOpenPrivacyPolicy,
  onOpenDnsModal,
  isGoogleLoading = false,
  themeMode = "light"
}: SettingsTabProps) {
  const isLight = themeMode === "light";
  const [newSubject, setNewSubject] = useState("");
  const [isSignActionLoading, setIsSignActionLoading] = useState(false);

  const handleCreateSubject = (e?: React.FormEvent, customName?: string) => {
    if (e) e.preventDefault();
    const nameToAdd = (customName || newSubject).trim();
    if (!nameToAdd || subjects.includes(nameToAdd)) return;
    onAddSubject(nameToAdd);
    if (!customName) setNewSubject("");
  };

  const handleLogoutAction = async () => {
    setIsSignActionLoading(true);
    try {
      await onLogout();
    } finally {
      setIsSignActionLoading(false);
    }
  };

  const handleLoginAction = async () => {
    setIsSignActionLoading(true);
    try {
      await onLogin();
    } finally {
      setIsSignActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 select-none">
      
      {/* Title Header */}
      <div className={`border-b ${isLight ? "border-[#E3E0D8]" : "border-white/5"} pb-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <span className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-indigo-400"} font-bold uppercase tracking-widest flex items-center gap-2`}>
            <Settings size={14} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
            Personalization & Workspace Controls
          </span>
          <h1 className={`text-2xl md:text-3xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"} mt-1`}>Application Settings</h1>
          <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} max-w-xl`}>
            Configure your revision schedule parameters, manage course syllabuses, customize clock formats, and synchronize your cloud profile.
          </p>
        </div>

        {/* Global Cloud Sync & Protection Status */}
        <div className={`flex items-center gap-3 ${
          isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" : "bg-[#0a0f1d] border-white/10 text-white shadow-lg"
        } border px-4 py-2 rounded-2xl`}>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold uppercase">Cloud Sync</span>
              <span className={`text-[9px] font-mono font-bold ${
                isLight ? "bg-[#EAF3EC] text-[#66856D] border-[#CDE3D2]" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              } px-1.5 py-0.5 rounded border`}>
                ACTIVE
              </span>
            </div>
            <span className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>Zero-Trust Secured</span>
          </div>
        </div>
      </div>

      {/* Grid of Clean Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Visual Theme & Clock Format */}
        <div className={`p-6 ${
          isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" : "bg-[#0E1322]/80 border-white/10 text-white shadow-lg"
        } border rounded-3xl space-y-6 relative overflow-hidden`}>
          
          <div className="flex items-center gap-2.5">
            <div className={`p-2 ${
              isLight ? "bg-[#FFF1EC] text-[#C96F55]" : "bg-indigo-500/10 text-indigo-400"
            } rounded-xl`}>
              <Clock size={18} />
            </div>
            <h3 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-100"} font-mono uppercase tracking-wider`}>
              Time & Display
            </h3>
          </div>

          {/* Time System */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-200"} block`}>Time System Display</span>
                <span className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>Choose between standard 12-hour AM/PM or military 24-hour display.</span>
              </div>
            </div>

            <div className={`flex ${
              isLight ? "bg-[#F0EEE8] border-[#E3E0D8]" : "bg-[#0B0F19] border-white/5"
            } border p-1 rounded-2xl w-full`}>
              <button
                type="button"
                onClick={() => onUpdateSettings({ timeSystem: "12" })}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.timeSystem === "12"
                    ? isLight ? "bg-[#C96F55] text-white shadow-xs" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>12-Hour (AM/PM)</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ timeSystem: "24" })}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.timeSystem === "24"
                    ? isLight ? "bg-[#C96F55] text-white shadow-xs" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>24-Hour (Military)</span>
              </button>
            </div>
          </div>

          {/* Theme Mode */}
          <div className={`space-y-3 pt-3 border-t ${isLight ? "border-[#E3E0D8]" : "border-[#38332E]"}`}>
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-[#F6F3EE]"} block`}>Theme & Brand Identity</span>
                <span className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"}`}>Switch between warm minimalist dark mode or the logo-inspired light theme.</span>
              </div>
              {settings.themeMode === "light" ? (
                <Sun size={16} className="text-[#C96F55] shrink-0" />
              ) : (
                <Moon size={16} className="text-[#C96F55] shrink-0" />
              )}
            </div>

            <div className={`grid grid-cols-2 gap-2 ${
              isLight ? "bg-[#F0EEE8] border-[#E3E0D8]" : "bg-[#120E22] border-white/10"
            } border p-1 rounded-2xl w-full`}>
              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: "dark" })}
                className={`py-2 rounded-xl text-xs font-mono font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.themeMode === "dark"
                    ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/25"
                    : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-[#C4B5FD]/75 hover:text-white"
                }`}
              >
                <Moon size={13} />
                <span>Engez Dark</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: "light" })}
                className={`py-2 rounded-xl text-xs font-mono font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.themeMode === "light"
                    ? "bg-[#C96F55] text-white shadow-lg shadow-[#C96F55]/20"
                    : "text-[#C4B5FD]/75 hover:text-white"
                }`}
              >
                <Sun size={13} />
                <span>Engez Light</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Subject & Syllabus Manager */}
        <div className={`p-6 ${
          isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" : "bg-[#0A0714]/85 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        } border rounded-3xl space-y-5 relative overflow-hidden`}>

          <div className="flex items-center gap-2.5">
            <div className={`p-2 ${
              isLight ? "bg-[#EAF3EC] text-[#66856D]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
            } rounded-xl`}>
              <BookOpen size={18} />
            </div>
            <h3 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} font-mono uppercase tracking-wider`}>
              Syllabus & Subjects
            </h3>
          </div>

          {/* Add Subject Input */}
          <form onSubmit={handleCreateSubject} className="space-y-2">
            <label className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} block`}>Add New Course / Subject</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., CIE Computer Science 0478"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className={`flex-1 ${
                  isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B] placeholder:text-[#9B9890] focus:border-[#C96F55]" : "bg-[#120E22] border-white/10 text-white placeholder:text-[#8B82A8] focus:border-[#8B5CF6]"
                } border rounded-xl px-3.5 py-2 text-xs focus:outline-none`}
              />
              <button
                type="submit"
                className={`p-2.5 ${isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"} text-white rounded-xl transition cursor-pointer shadow-2xs`}
                title="Add Subject"
              >
                <Plus size={16} />
              </button>
            </div>
          </form>

          {/* Quick Add Presets */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase block`}>Quick Add Syllabus:</span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {COMMON_SYLLABUSES.filter(s => !subjects.includes(s)).slice(0, 4).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleCreateSubject(undefined, preset)}
                  className={`px-2 py-1 rounded-lg ${
                    isLight ? "bg-[#F7F6F2] hover:bg-[#FFF1EC] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#120E22] hover:bg-[#1A1432] border-white/10 text-[#C4B5FD]"
                  } border text-[10px] font-mono transition cursor-pointer flex items-center gap-1`}
                >
                  <Plus size={10} className={isLight ? "text-[#C96F55]" : "text-[#A855F7]"} />
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Subject List */}
          <div className={`space-y-2 pt-2 border-t ${isLight ? "border-[#E3E0D8]" : "border-white/10"}`}>
            <span className={`text-[11px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} block uppercase`}>Active Subjects ({subjects.length})</span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {subjects.map((sub) => (
                <div
                  key={sub}
                  className={`flex items-center justify-between p-2 ${
                    isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#120E22] border-white/10"
                  } border rounded-xl transition`}
                >
                  <span className={`text-xs font-medium ${isLight ? "text-[#1D1D1B]" : "text-white"} truncate`}>{sub}</span>
                  {subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteSubject(sub)}
                      className={`p-1 ${isLight ? "text-[#77736B] hover:text-[#B85C5C]" : "text-[#C4B5FD]/60 hover:text-rose-400"} transition cursor-pointer`}
                      title="Remove subject"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Account & Cloud Session */}
        <div className={`p-6 ${
          isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" : "bg-[#0A0714]/85 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        } border rounded-3xl space-y-6 relative overflow-hidden flex flex-col justify-between`}>

          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 ${
                isLight ? "bg-[#EAF3EC] text-[#66856D]" : "bg-emerald-500/10 text-emerald-400"
              } rounded-xl`}>
                <UserCheck size={18} />
              </div>
              <h3 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} font-mono uppercase tracking-wider`}>
                Account & Sync
              </h3>
            </div>

            {currentUser ? (
              <div className="space-y-4">
                <div className={`p-3.5 ${
                  isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#120E22] border-white/10"
                } border rounded-2xl space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase`}>Logged In As</span>
                    <span className={`text-[9px] font-mono ${
                      isLight ? "bg-[#EAF3EC] text-[#66856D] border-[#CDE3D2]" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
                    } px-2 py-0.5 rounded-full border font-bold`}>
                      Verified
                    </span>
                  </div>
                  <div className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} truncate`}>
                    {currentUser.displayName || currentUser.email || "Scholar User"}
                  </div>
                  <div className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"} truncate font-mono`}>
                    {currentUser.email}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"}`}>Auth Provider:</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                    currentUser.providerData?.[0]?.providerId === "google.com"
                      ? isLight ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      : isLight ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-white/10 text-slate-300 border border-white/10"
                  } font-semibold flex items-center gap-1.5`}>
                    {currentUser.providerData?.[0]?.providerId === "google.com" ? (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Google Account</span>
                      </>
                    ) : (
                      <span>Email / Password</span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutAction}
                  disabled={isSignActionLoading}
                  className={`w-full py-2.5 ${
                    isLight ? "bg-[#FFF1EC] hover:bg-[#F5E2E2] text-[#B85C5C] border-[#E8D7C9]" : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/25"
                  } border font-mono font-bold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2`}
                >
                  {isSignActionLoading ? (
                    <Loader2 size={13} className="animate-spin text-rose-300" />
                  ) : (
                    <>
                      <LogOut size={13} />
                      <span>Sign Out Account</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"} leading-relaxed font-sans`}>
                  Sign in with your Google or email account to synchronize your study schedules, matrix tasks, and notes securely.
                </p>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={onGoogleLogin || handleLoginAction}
                  disabled={isSignActionLoading || isGoogleLoading}
                  className={`w-full py-2.5 px-3 ${
                    isLight ? "bg-[#FFFFFF] hover:bg-[#FAF9F5] text-[#1D1D1B] border-[#E3E0D8]" : "bg-[#2D2824] hover:bg-[#38312B] text-[#F6F3EE] border-[#3D3833]"
                  } border font-sans font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs`}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#C96F55]" />
                      <span>Connecting with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Email Sign-In Button */}
                <button
                  type="button"
                  onClick={handleLoginAction}
                  disabled={isSignActionLoading || isGoogleLoading}
                  className="w-full py-2.5 bg-[#C96F55] hover:bg-[#B85F48] text-white font-mono font-bold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <LogIn size={13} />
                  <span>Sign In with Email</span>
                </button>
              </div>
            )}
          </div>

          <div className={`pt-3 border-t ${isLight ? "border-[#E3E0D8]" : "border-white/5"} flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] ${isLight ? "text-[#77736B]" : "text-slate-400"} font-mono`}>
            <span className={`flex items-center gap-1.5 ${isLight ? "text-[#66856D]" : "text-emerald-400"}`}>
              <ShieldCheck size={13} />
              <span>Zero-Retention Student AI Shield</span>
            </span>
            {onOpenPrivacyPolicy && (
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="underline hover:text-[#C96F55] transition cursor-pointer font-bold"
              >
                Privacy Policy & Data Controls
              </button>
            )}
          </div>

        </div>

        {/* Card 4: Custom Domain & DNS (engeznafsak.com) */}
        <div className={`p-6 ${
          isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" : "bg-[#0A0714]/85 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        } border rounded-3xl space-y-4 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 ${isLight ? "bg-[#C96F55]/15 text-[#C96F55] border-[#C96F55]/30" : "bg-[#8B5CF6]/20 text-[#C084FC] border-[#8B5CF6]/40"} rounded-xl border`}>
                <Globe size={18} />
              </div>
              <div>
                <h3 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} font-mono uppercase tracking-wider`}>
                  Custom Domain & DNS
                </h3>
                <span className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-[#C084FC]"} font-bold`}>engeznafsak.com</span>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>

          <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"} leading-relaxed font-sans`}>
            Official production domain is connected with A-record routing (<code className="font-bold text-[#C96F55]">76.76.21.21</code>), CNAME (<code className="font-bold text-[#C96F55]">cname.vercel-dns.com</code>), and Firebase Auth reverse proxy.
          </p>

          <button
            type="button"
            onClick={onOpenDnsModal}
            className="w-full py-2.5 px-3 bg-[#C96F55] hover:bg-[#B85F48] text-white font-sans font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <Globe size={14} />
            <span>Open Domain & DNS Hub</span>
          </button>
        </div>

      </div>


    </div>
  );
}

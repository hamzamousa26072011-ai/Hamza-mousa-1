import React, { useState } from "react";
import { 
  Settings, 
  Sun, 
  Moon, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Trash2, 
  HelpCircle, 
  ShieldCheck, 
  Database, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Cloud,
  BookOpen,
  Plus,
  X,
  Sparkles,
  Sliders
} from "lucide-react";
import { User } from "firebase/auth";
import { 
  saveCustomFirebaseConfig, 
  getSavedCustomFirebaseConfig 
} from "../lib/classroom";

interface SettingsTabProps {
  settings?: {
    timeSystem: "12" | "24";
    themeMode: "light" | "dark";
  };
  onUpdateSettings?: (fields: Partial<{ timeSystem: "12" | "24"; themeMode: "light" | "dark" }>) => void;
  subjects?: string[];
  onAddSubject?: (subj: string) => void;
  onDeleteSubject?: (subj: string) => void;
  currentUser?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onGoogleLogin?: () => void;
  isGoogleLoading?: boolean;
  offlineMode?: boolean;
  focusMinutesSelected?: number;
  onDurationChange?: (mins: number) => void;
  subjectsCount?: number;
  tasksCount?: number;
  onClearWorkspace?: () => void;
  themeMode?: "light" | "dark";
  onThemeChange?: (mode: "light" | "dark") => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenPrivacy?: () => void;
  onOpenDnsModal?: () => void;
  onOpenUserGuide?: () => void;
  onOpenGuide?: () => void;
}

export default function SettingsTab({
  settings,
  onUpdateSettings,
  subjects = [],
  onAddSubject,
  onDeleteSubject,
  currentUser,
  onLogin,
  onLogout,
  offlineMode = false,
  focusMinutesSelected = 50,
  onDurationChange,
  subjectsCount,
  tasksCount = 0,
  onClearWorkspace,
  themeMode: propThemeMode,
  onThemeChange,
  onOpenPrivacyPolicy,
  onOpenPrivacy,
  onOpenUserGuide,
  onOpenGuide
}: SettingsTabProps) {
  const activeTheme = settings?.themeMode || propThemeMode || "dark";
  const isLight = activeTheme === "light";

  // Dual-theme accents matching website & Study Apps tab:
  // Dark mode -> Purple palette (#8B5CF6 / #7C3AED / #C084FC)
  // Light mode -> Less-saturated darker terracotta bronze (#C25E42 / #B25136 / #FFF2ED / #F0D5CC)
  const primaryColor = isLight ? "#C25E42" : "#8B5CF6";
  const primaryHoverColor = isLight ? "#B25136" : "#7C3AED";
  const accentText = isLight ? "text-[#C25E42]" : "text-[#C084FC]";
  const softBg = isLight ? "bg-[#FFF2ED]" : "bg-[#8B5CF6]/15";
  const softBorder = isLight ? "border-[#F0D5CC]" : "border-[#8B5CF6]/30";

  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showAdvancedFirebase, setShowAdvancedFirebase] = useState(false);

  const savedConfig = getSavedCustomFirebaseConfig();
  const [customProjectId, setCustomProjectId] = useState(savedConfig?.projectId || "");
  const [customApiKey, setCustomApiKey] = useState(savedConfig?.apiKey || "");
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  const isGuestOrLocal =
    !currentUser ||
    currentUser.isAnonymous ||
    offlineMode ||
    currentUser.uid?.startsWith("local-") ||
    currentUser.uid === "guest-workspace-user";

  const handleSetTheme = (mode: "light" | "dark") => {
    if (onUpdateSettings) {
      onUpdateSettings({ themeMode: mode });
    }
    if (onThemeChange) {
      onThemeChange(mode);
    }
  };

  const handleSetTimeSystem = (sys: "12" | "24") => {
    if (onUpdateSettings) {
      onUpdateSettings({ timeSystem: sys });
    }
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectInput.trim() || !onAddSubject) return;
    onAddSubject(newSubjectInput.trim());
    setNewSubjectInput("");
  };

  const handleSaveCustomFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customProjectId.trim() || !customApiKey.trim()) return;
    saveCustomFirebaseConfig({
      projectId: customProjectId.trim(),
      apiKey: customApiKey.trim(),
      authDomain: `${customProjectId.trim()}.firebaseapp.com`,
      storageBucket: `${customProjectId.trim()}.appspot.com`,
      appId: ""
    });
    setConfigMessage("Custom Firebase project saved. Reloading workspace...");
    setTimeout(() => window.location.reload(), 1000);
  };

  const DURATION_OPTIONS = [
    { mins: 25, label: "25m (Pomodoro)" },
    { mins: 45, label: "45m (Paper 2)" },
    { mins: 50, label: "50m (Deep Study)" },
    { mins: 60, label: "60m (Paper 6)" },
    { mins: 75, label: "75m (Paper 4)" },
    { mins: 120, label: "120m (Full Math)" }
  ];

  const handlePrivacyClick = onOpenPrivacyPolicy || onOpenPrivacy;
  const handleGuideClick = onOpenUserGuide || onOpenGuide;
  const displaySubjectsCount = subjectsCount ?? subjects.length;

  return (
    <div className={`space-y-6 pb-16 max-w-4xl ${isLight ? "text-[#1A1614]" : "text-[#F1F3F8]"}`}>
      {/* Header & Status */}
      <header
        className={`rounded-2xl border p-5 sm:p-6 ${
          isLight
            ? "bg-[#FFFFFF] border-[#EBE4DC] shadow-xs"
            : "bg-[#191E28] border-[#283040]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
            }`}
          >
            <Settings size={18} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Workspace Settings</h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
              Customize your visual theme, time format, active subjects, and account storage.
            </p>
          </div>
        </div>
      </header>

      {/* Section 1: Appearance & Display */}
      <section
        aria-labelledby="appearance-heading"
        className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${
          isLight ? "bg-[#FFFFFF] border-[#EBE4DC] shadow-xs" : "bg-[#191E28] border-[#283040]"
        }`}
      >
        <div className="flex items-center gap-2">
          <Sliders size={16} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
          <h2 id="appearance-heading" className="text-base sm:text-lg font-bold">
            Appearance & Display
          </h2>
        </div>

        {/* Theme Switcher Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" role="radiogroup" aria-label="Color Theme">
          {/* Light Theme Card */}
          <button
            type="button"
            role="radio"
            aria-checked={isLight}
            onClick={() => handleSetTheme("light")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start justify-between cursor-pointer ${
              isLight
                ? "bg-[#FFF2ED] border-[#C25E42] ring-2 ring-[#C25E42]/25 shadow-xs"
                : "bg-[#12161F] border-[#283040] hover:border-[#8B5CF6]/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isLight ? "bg-[#C25E42] text-white shadow-xs" : "bg-[#191E28] text-slate-400"
                }`}
              >
                <Sun size={18} />
              </div>
              <div>
                <div className={`text-sm font-bold ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                  Light Theme
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? "text-[#82776E]" : "text-slate-400"}`}>
                  Warm ivory canvas with terracotta bronze accents and high contrast text.
                </p>
              </div>
            </div>
            {isLight && <CheckCircle2 size={18} className="text-[#C25E42] shrink-0 mt-0.5" />}
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            role="radio"
            aria-checked={!isLight}
            onClick={() => handleSetTheme("dark")}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start justify-between cursor-pointer ${
              !isLight
                ? "bg-[#8B5CF6]/15 border-[#8B5CF6] ring-2 ring-[#8B5CF6]/30 shadow-xs"
                : "bg-[#FAF8F5] border-[#EBE4DC] hover:border-[#C25E42]/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !isLight ? "bg-[#8B5CF6] text-white shadow-xs" : "bg-white text-[#82776E] border border-[#EBE4DC]"
                }`}
              >
                <Moon size={18} />
              </div>
              <div>
                <div className={`text-sm font-bold ${!isLight ? "text-white" : "text-[#1A1614]"}`}>
                  Dark Theme
                </div>
                <p className={`text-xs mt-0.5 ${!isLight ? "text-slate-300" : "text-[#82776E]"}`}>
                  Deep midnight slate (#0C0D17) with radiant purple accents for low-glare study.
                </p>
              </div>
            </div>
            {!isLight && <CheckCircle2 size={18} className="text-[#C084FC] shrink-0 mt-0.5" />}
          </button>
        </div>

        {/* Time Format Preference */}
        {settings && (
          <div className={`pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? "border-[#EBE4DC]" : "border-[#283040]"
          }`}>
            <div>
              <div className="text-sm font-bold">
                Clock & Exam Time Format
              </div>
              <p className={`text-xs ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
                Choose how timetable hours, deadlines, and countdowns appear.
              </p>
            </div>

            <div className={`inline-flex p-1 rounded-xl border ${
              isLight ? "bg-[#FAF8F5] border-[#EBE4DC]" : "bg-[#12161F] border-[#283040]"
            }`}>
              <button
                type="button"
                onClick={() => handleSetTimeSystem("12")}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  settings.timeSystem === "12"
                    ? isLight
                      ? "bg-[#C25E42] text-white shadow-xs"
                      : "bg-[#8B5CF6] text-white shadow-xs"
                    : isLight
                    ? "text-[#82776E] hover:text-[#1A1614]"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                12-Hour (AM/PM)
              </button>
              <button
                type="button"
                onClick={() => handleSetTimeSystem("24")}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  settings.timeSystem === "24"
                    ? isLight
                      ? "bg-[#C25E42] text-white shadow-xs"
                      : "bg-[#8B5CF6] text-white shadow-xs"
                    : isLight
                    ? "text-[#82776E] hover:text-[#1A1614]"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                24-Hour (14:00)
              </button>
            </div>
          </div>
        )}

        {/* Default Focus Timer Duration */}
        {onDurationChange && (
          <div className={`pt-4 border-t ${isLight ? "border-[#EBE4DC]" : "border-[#283040]"}`}>
            <div className="flex items-center gap-2 mb-2.5">
              <Clock size={15} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
              <label className="text-sm font-bold">
                Default Focus Timer Duration
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DURATION_OPTIONS.map((opt) => {
                const selected = focusMinutesSelected === opt.mins;
                return (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => onDurationChange(opt.mins)}
                    className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      selected
                        ? isLight
                          ? "bg-[#FFF2ED] border-[#C25E42] text-[#C25E42] shadow-xs"
                          : "bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#C084FC] shadow-xs"
                        : isLight
                        ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#4A433E] hover:border-[#C25E42]/50 hover:bg-white"
                        : "bg-[#12161F] border-[#283040] text-slate-300 hover:border-[#8B5CF6]/40 hover:bg-[#191E28]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckCircle2 size={14} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Section 2: Active Subjects Management */}
      {onAddSubject && onDeleteSubject && (
        <section
          aria-labelledby="subjects-heading"
          className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
            isLight ? "bg-[#FFFFFF] border-[#EBE4DC] shadow-xs" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
            <div>
              <h2 id="subjects-heading" className="text-base sm:text-lg font-bold">
                Enrolled Subjects ({subjects.length})
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
                Your active syllabus courses, exam subjects, and study tracks.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSubject} className="flex gap-2">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              placeholder="Add a subject (e.g., IGCSE Biology 0610, Pure Math, Chemistry)..."
              aria-label="New subject name"
              className={`flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition ${
                isLight
                  ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#1A1614] focus:border-[#C25E42] focus:bg-white"
                  : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
              }`}
            />
            <button
              type="submit"
              disabled={!newSubjectInput.trim()}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight
                  ? "bg-[#C25E42] hover:bg-[#B25136]"
                  : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
              }`}
            >
              <Plus size={15} />
              <span>Add Subject</span>
            </button>
          </form>

          {subjects.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {subjects.map((subj) => (
                <span
                  key={subj}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    isLight
                      ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#1A1614] hover:border-[#C25E42]/50"
                      : "bg-[#12161F] border-[#283040] text-[#F1F3F8] hover:border-[#8B5CF6]/50"
                  }`}
                >
                  <BookOpen size={12} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                  <span>{subj}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteSubject(subj)}
                    aria-label={`Remove ${subj}`}
                    className={`p-0.5 rounded-md hover:bg-black/10 cursor-pointer transition ${
                      isLight ? "text-[#82776E] hover:text-rose-600" : "text-slate-400 hover:text-rose-400"
                    }`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className={`p-4 rounded-xl border border-dashed text-center text-xs ${
              isLight ? "border-[#EBE4DC] text-[#82776E]" : "border-[#283040] text-slate-400"
            }`}>
              No subjects enrolled yet. Add your subjects above to organize past papers and study tasks.
            </div>
          )}
        </section>
      )}

      {/* Section 3: Account & Data Sync */}
      <section
        aria-labelledby="account-heading"
        className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${
          isLight ? "bg-[#FFFFFF] border-[#EBE4DC] shadow-xs" : "bg-[#191E28] border-[#283040]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs ${
                isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
              }`}
            >
              {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon size={20} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="account-heading" className="text-base font-bold">
                  {currentUser?.displayName || "Guest Student"}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                    isGuestOrLocal
                      ? isLight
                        ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#B25136]"
                        : "bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#DDD6FE]"
                      : isLight
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  {isGuestOrLocal ? <HardDrive size={12} /> : <Cloud size={12} />}
                  <span>{isGuestOrLocal ? "Saved Locally" : "Cloud Account Active"}</span>
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
                {currentUser?.email || "Using local browser workspace on this device"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <button
                type="button"
                onClick={onLogout}
                className={`min-h-[40px] px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isLight
                    ? "bg-white border-[#EBE4DC] text-rose-600 hover:bg-rose-50"
                    : "bg-[#12161F] border-[#283040] text-rose-400 hover:bg-rose-500/15"
                }`}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                  isLight
                    ? "bg-[#C25E42] hover:bg-[#B25136]"
                    : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                }`}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Truthful storage explanation */}
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed ${
            isLight
              ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#4A433E]"
              : "bg-[#12161F] border-[#283040] text-[#B7C0CF]"
          }`}
        >
          {isGuestOrLocal ? (
            <p>
              <strong>Local Workspace Mode:</strong> Your tasks, exam countdowns, study apps, and habit logs are currently saved directly to this browser&apos;s offline database. Sign in with Google to enable permanent multi-device cloud synchronization.
            </p>
          ) : (
            <p>
              <strong>Cloud Sync Active:</strong> Your workspace is linked to your Google account and backed up to Firebase Firestore for instant access across all your study devices.
            </p>
          )}
        </div>

        {/* Collapsible Advanced Firebase Configuration */}
        <div className={`pt-2 border-t ${isLight ? "border-[#EBE4DC]" : "border-[#283040]"}`}>
          <button
            type="button"
            onClick={() => setShowAdvancedFirebase(!showAdvancedFirebase)}
            aria-expanded={showAdvancedFirebase}
            className={`w-full py-2 flex items-center justify-between text-xs font-bold cursor-pointer transition ${
              isLight ? "text-[#82776E] hover:text-[#1A1614]" : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <Database size={14} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
              <span>Advanced: Custom Firebase Project Connection</span>
            </span>
            {showAdvancedFirebase ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showAdvancedFirebase && (
            <form onSubmit={handleSaveCustomFirebase} className="mt-3 space-y-3 pt-3 border-t border-inherit">
              {configMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium">
                  {configMessage}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Firebase Project ID</label>
                  <input
                    type="text"
                    value={customProjectId}
                    onChange={(e) => setCustomProjectId(e.target.value)}
                    placeholder="e.g., engez-nafsak"
                    className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-mono outline-none ${
                      isLight
                        ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#1A1614] focus:border-[#C25E42]"
                        : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Firebase Web API Key</label>
                  <input
                    type="text"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-mono outline-none ${
                      isLight
                        ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#1A1614] focus:border-[#C25E42]"
                        : "bg-[#12161F] border-[#283040] text-[#F1F3F8] focus:border-[#8B5CF6]"
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-xs ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                  }`}
                >
                  Save Project Config
                </button>
                {savedConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("ENGEZ_CUSTOM_FIREBASE_CONFIG");
                      window.location.reload();
                    }}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      isLight ? "border-[#EBE4DC] text-[#82776E] hover:bg-[#FAF8F5]" : "border-[#283040] text-[#94A3B8] hover:bg-[#12161F]"
                    }`}
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Section 4: Guide, Privacy & Workspace Tools */}
      <section
        aria-labelledby="help-privacy-heading"
        className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
          isLight ? "bg-[#FFFFFF] border-[#EBE4DC] shadow-xs" : "bg-[#191E28] border-[#283040]"
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
          <h2 id="help-privacy-heading" className="text-base sm:text-lg font-bold">
            Guide, Privacy & Workspace Data
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {handleGuideClick && (
            <button
              type="button"
              onClick={handleGuideClick}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                isLight
                  ? "bg-[#FAF8F5] border-[#EBE4DC] hover:border-[#C25E42]/60 hover:bg-white"
                  : "bg-[#12161F] border-[#283040] hover:border-[#8B5CF6]/60 hover:bg-[#191E28]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
                  }`}
                >
                  <HelpCircle size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">Workspace Guide</div>
                  <div className={`text-xs ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
                    Review exam planner features and revision workflows
                  </div>
                </div>
              </div>
            </button>
          )}

          {handlePrivacyClick && (
            <button
              type="button"
              onClick={handlePrivacyClick}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                isLight
                  ? "bg-[#FAF8F5] border-[#EBE4DC] hover:border-[#C25E42]/60 hover:bg-white"
                  : "bg-[#12161F] border-[#283040] hover:border-[#8B5CF6]/60 hover:bg-[#191E28]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">Privacy & Data Tools</div>
                  <div className={`text-xs ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
                    Export personal JSON data or clear cached past papers
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Workspace Reset Row */}
        {onClearWorkspace && (
          <div
            className={`mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? "border-[#EBE4DC]" : "border-[#283040]"
            }`}
          >
            <div>
              <div className="text-sm font-bold">Reset Tasks & Study Progress</div>
              <p className={`text-xs ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
                Currently storing {tasksCount} {tasksCount === 1 ? "task" : "tasks"} and {displaySubjectsCount} configured {displaySubjectsCount === 1 ? "subject" : "subjects"}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className={`min-h-[40px] px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isLight
                  ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
              }`}
            >
              <Trash2 size={14} />
              <span>Reset Tasks & Streak</span>
            </button>
          </div>
        )}
      </section>

      {/* Confirm Reset Dialog */}
      {confirmResetOpen && onClearWorkspace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-workspace-title"
          onClick={() => setConfirmResetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#EBE4DC] text-[#1A1614]"
                : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle size={20} />
              <h3 id="reset-workspace-title" className="text-base font-bold">
                Reset Tasks & Study Streak?
              </h3>
            </div>
            <p className={`text-sm mt-2 leading-relaxed ${isLight ? "text-[#82776E]" : "text-[#94A3B8]"}`}>
              This will clear your current task list and reset your study streak counter to zero. Your exam countdowns and account credentials remain completely intact.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  isLight
                    ? "bg-white border-[#EBE4DC] text-[#82776E] hover:bg-[#FAF8F5]"
                    : "bg-[#12161F] border-[#283040] text-[#94A3B8] hover:bg-[#191E28]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearWorkspace();
                  setConfirmResetOpen(false);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

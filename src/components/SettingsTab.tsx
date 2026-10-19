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
  X
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
    { mins: 25, label: "25 min (Pomodoro)" },
    { mins: 45, label: "45 min (Paper 2)" },
    { mins: 50, label: "50 min (Deep Study)" },
    { mins: 60, label: "60 min (Paper 6)" },
    { mins: 75, label: "75 min (Paper 4)" },
    { mins: 120, label: "120 min (Full Math)" }
  ];

  const handlePrivacyClick = onOpenPrivacyPolicy || onOpenPrivacy;
  const handleGuideClick = onOpenUserGuide || onOpenGuide;
  const displaySubjectsCount = subjectsCount ?? subjects.length;

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <header
        className={`rounded-2xl border p-6 ${
          isLight
            ? "bg-[#FFFFFF] border-[#E2E6EE] shadow-[0_1px_3px_rgba(24,32,43,0.04)]"
            : "bg-[#191E28] border-[#2B3344]"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-medium mb-1">
          <Settings size={14} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
          <span className={isLight ? "text-[#596474]" : "text-[#B7C0CF]"}>Preferences & Account</span>
        </div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
          Workspace Settings
        </h1>
        <p className={`text-sm mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
          Customize your visual theme, time format, active subjects, and account storage preferences.
        </p>
      </header>

      {/* Section 1: Appearance & Time Format */}
      <section
        aria-labelledby="appearance-heading"
        className={`rounded-2xl border p-6 space-y-6 ${
          isLight ? "bg-[#FFFFFF] border-[#E2E6EE]" : "bg-[#191E28] border-[#2B3344]"
        }`}
      >
        <div>
          <h2 id="appearance-heading" className={`text-lg font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
            Appearance & Display
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            Choose a calm surface theme for daytime or late-night revision.
          </p>
        </div>

        {/* Theme Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" role="radiogroup" aria-label="Color Theme">
          <button
            type="button"
            role="radio"
            aria-checked={isLight}
            onClick={() => handleSetTheme("light")}
            className={`p-4 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${
              isLight
                ? "bg-[#EFEEFA] border-[#5F55C8] ring-2 ring-[#5F55C8]/20"
                : "bg-[#222938] border-[#2B3344] hover:border-[#8590A2]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isLight ? "bg-[#5F55C8] text-white" : "bg-[#191E28] text-[#B7C0CF]"
              }`}>
                <Sun size={18} />
              </div>
              <div>
                <div className={`text-sm font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                  Light Theme
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  Soft neutral daylight canvas (#F6F7FA) with crisp dark ink.
                </p>
              </div>
            </div>
            {isLight && <CheckCircle2 size={18} className="text-[#5F55C8] shrink-0" />}
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={!isLight}
            onClick={() => handleSetTheme("dark")}
            className={`p-4 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${
              !isLight
                ? "bg-[#222938] border-[#A99BFF] ring-2 ring-[#A99BFF]/20"
                : "bg-[#F6F7FA] border-[#D0D7E2] hover:border-[#7A8699]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                !isLight ? "bg-[#A99BFF] text-[#10131A]" : "bg-white text-[#596474]"
              }`}>
                <Moon size={18} />
              </div>
              <div>
                <div className={`text-sm font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                  Dark Theme
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  Deep charcoal slate (#10131A) for low-glare evening study.
                </p>
              </div>
            </div>
            {!isLight && <CheckCircle2 size={18} className="text-[#A99BFF] shrink-0" />}
          </button>
        </div>

        {/* Time Format Preference */}
        {settings && (
          <div className={`pt-5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"
          }`}>
            <div>
              <div className={`text-sm font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                Clock & Exam Time Format
              </div>
              <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Choose how exam times and schedules are displayed.
              </p>
            </div>
            <div className={`inline-flex p-1 rounded-xl border ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#10131A] border-[#2B3344]"
            }`}>
              <button
                type="button"
                onClick={() => handleSetTimeSystem("12")}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  settings.timeSystem === "12"
                    ? isLight
                      ? "bg-[#5F55C8] text-white"
                      : "bg-[#A99BFF] text-[#10131A]"
                    : isLight
                    ? "text-[#596474] hover:text-[#18202B]"
                    : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                }`}
              >
                12-Hour (AM/PM)
              </button>
              <button
                type="button"
                onClick={() => handleSetTimeSystem("24")}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  settings.timeSystem === "24"
                    ? isLight
                      ? "bg-[#5F55C8] text-white"
                      : "bg-[#A99BFF] text-[#10131A]"
                    : isLight
                    ? "text-[#596474] hover:text-[#18202B]"
                    : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                }`}
              >
                24-Hour (14:00)
              </button>
            </div>
          </div>
        )}

        {/* Default Timer Duration */}
        {onDurationChange && (
          <div className={`pt-5 border-t ${isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"}`}>
            <div className="flex items-center gap-2 mb-2.5">
              <Clock size={15} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
              <label className={`text-sm font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
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
                    className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                      selected
                        ? isLight
                          ? "bg-[#5F55C8] border-[#5F55C8] text-white"
                          : "bg-[#A99BFF] border-[#A99BFF] text-[#10131A]"
                        : isLight
                        ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] hover:bg-[#ECEFF5]"
                        : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:bg-[#2B3344]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <CheckCircle2 size={14} />}
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
          className={`rounded-2xl border p-6 space-y-4 ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EE]" : "bg-[#191E28] border-[#2B3344]"
          }`}
        >
          <div>
            <h2 id="subjects-heading" className={`text-lg font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
              Enrolled Subjects ({subjects.length})
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              Subjects appear as quick options when creating tasks on your Today dashboard.
            </p>
          </div>

          <form onSubmit={handleCreateSubject} className="flex gap-2">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              placeholder="Add a subject (e.g., IGCSE Biology 0610)..."
              aria-label="New subject name"
              className={`flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                isLight
                  ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] focus:bg-white focus:border-[#5F55C8]"
                  : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
              }`}
            />
            <button
              type="submit"
              disabled={!newSubjectInput.trim()}
              className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#5F55C8] hover:bg-[#4E45B0] disabled:opacity-40 text-white transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus size={15} />
              <span>Add Subject</span>
            </button>
          </form>

          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {subjects.map((subj) => (
                <span
                  key={subj}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#18202B]"
                      : "bg-[#222938] border-[#2B3344] text-[#F1F3F8]"
                  }`}
                >
                  <BookOpen size={12} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
                  <span>{subj}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteSubject(subj)}
                    aria-label={`Remove ${subj}`}
                    className={`p-0.5 rounded hover:bg-black/10 cursor-pointer ${
                      isLight ? "text-[#7A8699] hover:text-[#C93B3B]" : "text-[#8590A2] hover:text-[#F87171]"
                    }`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Section 3: Account & Data Sync Status */}
      <section
        aria-labelledby="account-heading"
        className={`rounded-2xl border p-6 space-y-5 ${
          isLight ? "bg-[#FFFFFF] border-[#E2E6EE]" : "bg-[#191E28] border-[#2B3344]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                isLight ? "bg-[#EFEEFA] text-[#5F55C8]" : "bg-[#222938] text-[#A99BFF]"
              }`}
            >
              {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon size={20} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="account-heading" className={`text-base font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                  {currentUser?.displayName || "Guest Student"}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                    isGuestOrLocal
                      ? isLight
                        ? "bg-[#FEF5E7] border-[#F8D9A0] text-[#B86E00]"
                        : "bg-[#332714] border-[#B86E00]/40 text-[#FBBF24]"
                      : isLight
                      ? "bg-[#E9F7EF] border-[#B7E4C7] text-[#1F7A4C]"
                      : "bg-[#143024] border-[#1F7A4C]/40 text-[#4ADE80]"
                  }`}
                >
                  {isGuestOrLocal ? <HardDrive size={12} /> : <Cloud size={12} />}
                  <span>{isGuestOrLocal ? "Saved on This Device" : "Cloud Account Active"}</span>
                </span>
              </div>
              <p className={`text-xs mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                {currentUser?.email || "Using local browser workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <button
                type="button"
                onClick={onLogout}
                className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                  isLight
                    ? "bg-white border-[#D0D7E2] text-[#C93B3B] hover:bg-[#FDECEC]"
                    : "bg-[#222938] border-[#2B3344] text-[#F87171] hover:bg-[#3A1D24]"
                }`}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#5F55C8] hover:bg-[#4E45B0] text-white transition flex items-center gap-2 cursor-pointer"
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
              ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#596474]"
              : "bg-[#10131A] border-[#2B3344] text-[#B7C0CF]"
          }`}
        >
          {isGuestOrLocal ? (
            <p>
              <strong>Local Browser Storage:</strong> Your tasks, exam countdowns, and habit logs are currently stored in this browser's local storage. Clearing your browser site data will remove local items unless you sign in with a cloud-connected account.
            </p>
          ) : (
            <p>
              <strong>Cloud & Local Persistence:</strong> Your workspace is linked to your signed-in account and backed up locally in this browser for instant loading.
            </p>
          )}
        </div>

        {/* Collapsible Advanced Firebase Configuration */}
        <div className={`pt-2 border-t ${isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"}`}>
          <button
            type="button"
            onClick={() => setShowAdvancedFirebase(!showAdvancedFirebase)}
            aria-expanded={showAdvancedFirebase}
            className={`w-full py-2 flex items-center justify-between text-xs font-semibold cursor-pointer ${
              isLight ? "text-[#596474] hover:text-[#18202B]" : "text-[#B7C0CF] hover:text-[#F1F3F8]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Database size={14} />
              <span>Advanced: Custom Firebase Project Connection</span>
            </span>
            {showAdvancedFirebase ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showAdvancedFirebase && (
            <form onSubmit={handleSaveCustomFirebase} className="mt-3 space-y-3 pt-3 border-t border-inherit">
              {configMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium">
                  {configMessage}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Firebase Project ID</label>
                  <input
                    type="text"
                    value={customProjectId}
                    onChange={(e) => setCustomProjectId(e.target.value)}
                    placeholder="e.g., engez-nafsak"
                    className={`w-full min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B]"
                        : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8]"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Firebase Web API Key</label>
                  <input
                    type="text"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className={`w-full min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-mono ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B]"
                        : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8]"
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#5F55C8] text-white cursor-pointer"
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
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      isLight ? "border-[#D0D7E2] text-[#596474]" : "border-[#2B3344] text-[#B7C0CF]"
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

      {/* Section 4: Help, Guide & Privacy */}
      <section
        aria-labelledby="help-privacy-heading"
        className={`rounded-2xl border p-6 space-y-4 ${
          isLight ? "bg-[#FFFFFF] border-[#E2E6EE]" : "bg-[#191E28] border-[#2B3344]"
        }`}
      >
        <h2 id="help-privacy-heading" className={`text-lg font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
          Guide, Privacy & Workspace Data
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {handleGuideClick && (
            <button
              type="button"
              onClick={handleGuideClick}
              className={`p-4 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                isLight
                  ? "bg-[#F6F7FA] border-[#E2E6EE] hover:border-[#5F55C8]"
                  : "bg-[#222938] border-[#2B3344] hover:border-[#A99BFF]"
              }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
                <div>
                  <div className={`text-sm font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                    Workspace Guide
                  </div>
                  <div className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                    Review key features and study workflows
                  </div>
                </div>
              </div>
            </button>
          )}

          {handlePrivacyClick && (
            <button
              type="button"
              onClick={handlePrivacyClick}
              className={`p-4 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                isLight
                  ? "bg-[#F6F7FA] border-[#E2E6EE] hover:border-[#5F55C8]"
                  : "bg-[#222938] border-[#2B3344] hover:border-[#A99BFF]"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className={isLight ? "text-[#1F7A4C]" : "text-[#4ADE80]"} />
                <div>
                  <div className={`text-sm font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                    Privacy & Data Tools
                  </div>
                  <div className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                    Export your JSON data or clear cached files
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
              isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"
            }`}
          >
            <div>
              <div className={`text-sm font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                Reset Tasks & Study Progress
              </div>
              <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Currently storing {tasksCount} {tasksCount === 1 ? "task" : "tasks"} and {displaySubjectsCount} configured {displaySubjectsCount === 1 ? "subject" : "subjects"}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className={`min-h-[40px] px-4 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isLight
                  ? "bg-[#FDECEC] border-[#F7C6C6] text-[#C93B3B] hover:bg-[#F9D7D7]"
                  : "bg-[#3A1D24] border-[#C93B3B]/40 text-[#FCA5A5] hover:bg-[#4C232D]"
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
                ? "bg-[#FFFFFF] border-[#E2E6EE] text-[#18202B]"
                : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8]"
            }`}
          >
            <div className="flex items-center gap-3 text-[#C93B3B]">
              <AlertTriangle size={20} />
              <h3 id="reset-workspace-title" className="text-base font-bold">
                Reset Tasks & Study Streak?
              </h3>
            </div>
            <p className={`text-sm mt-2 leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              This will clear your current task list and reset your study streak counter to zero. Your exam countdowns and account remain intact.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isLight
                    ? "bg-white border-[#D0D7E2] text-[#596474]"
                    : "bg-[#222938] border-[#2B3344] text-[#B7C0CF]"
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
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#C93B3B] hover:bg-[#B02E2E] text-white cursor-pointer"
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

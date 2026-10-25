import React, { useState } from "react";
import { 
  Settings, 
  Sun, 
  Moon, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Plus, 
  X, 
  Sliders 
} from "lucide-react";

interface SettingsTabProps {
  settings?: {
    timeSystem: "12" | "24";
    themeMode: "light" | "dark";
  };
  onUpdateSettings?: (fields: Partial<{ timeSystem: "12" | "24"; themeMode: "light" | "dark" }>) => void;
  subjects?: string[];
  onAddSubject?: (subj: string) => void;
  onDeleteSubject?: (subj: string) => void;
  focusMinutesSelected?: number;
  onDurationChange?: (mins: number) => void;
  themeMode?: "light" | "dark";
  onThemeChange?: (mode: "light" | "dark") => void;
  currentUser?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  onGoogleLogin?: () => void;
  isGoogleLoading?: boolean;
  offlineMode?: boolean;
  subjectsCount?: number;
  tasksCount?: number;
  onClearWorkspace?: () => void;
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
  focusMinutesSelected = 50,
  onDurationChange,
  themeMode: propThemeMode,
  onThemeChange,
}: SettingsTabProps) {
  const activeTheme = settings?.themeMode || propThemeMode || "dark";
  const isLight = activeTheme === "light";

  const [newSubjectInput, setNewSubjectInput] = useState("");

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

  const DURATION_OPTIONS = [
    { mins: 25, label: "25m (Quick Focus)" },
    { mins: 45, label: "45m (Paper 2)" },
    { mins: 50, label: "50m (Deep Study)" },
    { mins: 60, label: "60m (Paper 6)" },
    { mins: 75, label: "75m (Paper 4)" },
    { mins: 120, label: "120m (Full Math)" }
  ];

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
              Customize your visual theme, time format, active subjects, and study preferences.
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
                  Deep midnight slate with radiant purple accents for low-glare study.
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
    </div>
  );
}

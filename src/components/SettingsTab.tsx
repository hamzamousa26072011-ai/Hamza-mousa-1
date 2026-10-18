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
  HelpCircle,
  MessageSquareHeart,
  Star,
  Send,
  Sparkles,
  Quote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Mail,
  ExternalLink
} from "lucide-react";
import { AppSettings, UserFeedbackItem } from "../types";
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
  onOpenUserGuide?: () => void;
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

const IMPROVEMENT_CATEGORIES = [
  { id: "General Improvements", label: "General Improvements", icon: "✨" },
  { id: "Focus Mode & Audio", label: "Focus Mode & Audio", icon: "🎧" },
  { id: "Habit Tracker & Tasks", label: "Habit Tracker & Tasks", icon: "📋" },
  { id: "AI Scholar & Worksheet", label: "AI Scholar & Worksheet", icon: "🧠" },
  { id: "Design & Themes", label: "Design & Themes", icon: "🎨" },
  { id: "Speed & Performance", label: "Speed & Performance", icon: "⚡" },
  { id: "New Feature Requests", label: "New Feature Requests", icon: "💡" },
];

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Could Be Better",
  3: "Good Experience",
  4: "Very Good",
  5: "Outstanding!",
};

const CREATOR_GMAIL = "hamzamousa26072011@gmail.com";

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
  onOpenUserGuide,
  isGoogleLoading = false,
  themeMode = "dark"
}: SettingsTabProps) {
  const isLight = themeMode === "light";
  const [newSubject, setNewSubject] = useState("");
  const [isSignActionLoading, setIsSignActionLoading] = useState(false);

  // App Improvement / Feedback State ("Your opinion matters")
  const [feedbackCategory, setFeedbackCategory] = useState("General Improvements");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackEmail, setFeedbackEmail] = useState(currentUser?.email || "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Private local history of what this user previously submitted
  const [submittedHistory, setSubmittedHistory] = useState<UserFeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem("engez_improvement_feedback");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setFeedbackError("Please share the points that I can improve in the app.");
      return;
    }
    setFeedbackError(null);
    setIsSubmittingFeedback(true);

    const payload = {
      pointsToImprove: feedbackText.trim(),
      category: feedbackCategory,
      rating: feedbackRating,
      contactEmail: isAnonymous ? undefined : (feedbackEmail.trim() || currentUser?.email || undefined),
      userId: isAnonymous ? undefined : (currentUser?.uid || undefined),
      userEmail: isAnonymous ? undefined : (currentUser?.email || undefined),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resJson.error || "Failed to submit feedback. Please try again.");
      }

      const newRecord: UserFeedbackItem = {
        id: resJson.id || Math.random().toString(36).substring(2),
        pointsToImprove: feedbackText.trim(),
        category: feedbackCategory,
        rating: feedbackRating,
        contactEmail: isAnonymous ? undefined : (feedbackEmail.trim() || currentUser?.email || undefined),
        userId: isAnonymous ? undefined : currentUser?.uid,
        userEmail: isAnonymous ? undefined : currentUser?.email,
        submittedAt: new Date().toISOString(),
      };

      const updatedHistory = [newRecord, ...submittedHistory];
      setSubmittedHistory(updatedHistory);
      try {
        localStorage.setItem("engez_improvement_feedback", JSON.stringify(updatedHistory.slice(0, 30)));
      } catch (err) {
        console.warn("Could not save feedback to localStorage:", err);
      }

      setFeedbackSuccess(true);
      setFeedbackText("");
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to send points. Please check your connection.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Pre-filled direct mailto link to Hamza's Gmail
  const mailtoHref = `mailto:${CREATOR_GMAIL}?subject=${encodeURIComponent(
    `[Engez Nafsak Suggestion] ${feedbackCategory}`
  )}&body=${encodeURIComponent(
    feedbackText
      ? `${feedbackText}\n\nCategory: ${feedbackCategory}\nRating: ${feedbackRating}/5\nFrom: ${feedbackEmail || currentUser?.email || "Scholar User"}`
      : `Hi Hamza,\n\nHere are some points to improve in Engez Nafsak:\n\nCategory: ${feedbackCategory}\nRating: ${feedbackRating}/5\n\n`
  )}`;

  return (
    <div className="space-y-6 md:space-y-8 select-none">
      
      {/* Title Header */}
      <div className={`border-b ${isLight ? "border-[#E8D7C9]" : "border-white/5"} pb-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <span className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-indigo-400"} font-bold uppercase tracking-widest flex items-center gap-2`}>
            <Settings size={14} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
            Personalization & Workspace Controls
          </span>
          <h1 className={`text-2xl md:text-3xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"} mt-1`}>Application Settings</h1>
          <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} max-w-xl`}>
            Configure your revision schedule parameters, manage course syllabuses, customize clock formats, synchronize cloud profiles, and send points to improve the app.
          </p>
        </div>

        {/* Creator Direct Contact Pill */}
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${CREATOR_GMAIL}`}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition flex items-center gap-1.5 ${
              isLight 
                ? "bg-[#FFF8F5] hover:bg-[#FFEAE0] border-[#E8D7C9] text-[#C96F55]" 
                : "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-300"
            }`}
            title="Direct Creator Contact"
          >
            <Mail size={13} />
            <span>{CREATOR_GMAIL}</span>
          </a>
        </div>
      </div>

      {/* Grid of Clean Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Visual Theme & Clock Format */}
        <div className={`p-6 ${
          isLight ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B] shadow-2xs" : "bg-[#0E1322]/80 border-white/10 text-white shadow-lg"
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
              isLight ? "bg-[#F0EEE8] border-[#E8D7C9]" : "bg-[#0B0F19] border-white/5"
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
          <div className={`space-y-3 pt-3 border-t ${isLight ? "border-[#EBE4DC]" : "border-white/10"}`}>
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-xs font-bold ${isLight ? "text-[#1A1614]" : "text-[#F8FAFC]"} block`}>Theme & Brand Identity</span>
                <span className={`text-[11px] ${isLight ? "text-[#82776E]" : "text-slate-400"}`}>Switch between the aesthetic Velvet Obsidian dark theme and the warm Ivory Calico light theme.</span>
              </div>
              {settings.themeMode === "light" ? (
                <Sun size={16} className="text-[#C25E42] shrink-0" />
              ) : (
                <Moon size={16} className="text-[#C084FC] shrink-0" />
              )}
            </div>

            <div className={`grid grid-cols-2 gap-2 ${
              isLight ? "bg-[#F5EFE9] border-[#EBE4DC]" : "bg-[#161A2B] border-white/10"
            } border p-1 rounded-2xl w-full`}>
              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: "dark" })}
                className={`py-2 rounded-xl text-xs font-mono font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.themeMode === "dark"
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30"
                    : isLight ? "text-[#736B63] hover:text-[#1A1614]" : "text-[#C084FC]/75 hover:text-white"
                }`}
              >
                <Moon size={13} />
                <span>Velvet Dark</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ themeMode: "light" })}
                className={`py-2 rounded-xl text-xs font-mono font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.themeMode === "light"
                    ? "bg-[#C25E42] text-white shadow-lg shadow-[#C25E42]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sun size={13} />
                <span>Ivory Light</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Subject & Syllabus Manager */}
        <div className={`p-6 ${
          isLight ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B] shadow-2xs" : "bg-[#0A0714]/85 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
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
                  isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B] placeholder:text-[#9B9890] focus:border-[#C96F55]" : "bg-[#120E22] border-white/10 text-white placeholder:text-[#8B82A8] focus:border-[#8B5CF6]"
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
                    isLight ? "bg-[#FAF8F5] hover:bg-[#FFF1EC] border-[#E8D7C9] text-[#1D1D1B]" : "bg-[#120E22] hover:bg-[#1A1432] border-white/10 text-[#C4B5FD]"
                  } border text-[10px] font-mono transition cursor-pointer flex items-center gap-1`}
                >
                  <Plus size={10} className={isLight ? "text-[#C96F55]" : "text-[#A855F7]"} />
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Subject List */}
          <div className={`space-y-2 pt-2 border-t ${isLight ? "border-[#E8D7C9]" : "border-white/10"}`}>
            <span className={`text-[11px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} block uppercase`}>Active Subjects ({subjects.length})</span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {subjects.map((sub) => (
                <div
                  key={sub}
                  className={`flex items-center justify-between p-2 ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
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
          isLight ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B] shadow-2xs" : "bg-[#0A0714]/85 border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
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
                  isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
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
                    isLight ? "bg-[#FFFFFF] hover:bg-[#FAF9F5] text-[#1D1D1B] border-[#E8D7C9]" : "bg-[#2D2824] hover:bg-[#38312B] text-[#F6F3EE] border-[#3D3833]"
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

          <div className={`pt-3 border-t ${isLight ? "border-[#E8D7C9]" : "border-white/5"} flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] ${isLight ? "text-[#77736B]" : "text-slate-400"} font-mono`}>
            <span className={`flex items-center gap-1.5 ${isLight ? "text-[#66856D]" : "text-emerald-400"}`}>
              <ShieldCheck size={13} />
              <span>Zero-Retention Student AI Shield</span>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {onOpenUserGuide && (
                <button
                  type="button"
                  onClick={onOpenUserGuide}
                  className="hover:text-[#C96F55] transition cursor-pointer font-bold flex items-center gap-1 text-[10px]"
                >
                  <HelpCircle size={12} />
                  <span>Interactive User Guide</span>
                </button>
              )}
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

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION: Direct Suggestion Portal to hamzamousa26072011@gmail.com */}
      {/* Quote: "your opinion matters" */}
      {/* ========================================================================= */}
      <div className={`p-6 sm:p-8 ${
        isLight ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B] shadow-sm" : "bg-[#0E1322]/85 border-white/10 text-white shadow-2xl"
      } border rounded-3xl space-y-6 relative overflow-hidden transition-all duration-300`}>
        
        {/* Subtle decorative background glow */}
        <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isLight ? "bg-[#C96F55]" : "bg-indigo-600"
        }`} />

        {/* Header with Quote Badge */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 relative z-10 ${
          isLight ? 'border-[#E8D7C9]' : 'border-white/10'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${
                isLight ? "bg-[#FFF1EC] text-[#C96F55]" : "bg-indigo-500/15 text-indigo-400"
              }`}>
                <MessageSquareHeart size={20} />
              </div>
              <div>
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isLight ? "text-[#C96F55]" : "text-indigo-400"
                }`}>
                  Direct Creator Feedback • Sent to Hamza
                </span>
                <h2 className={`text-xl md:text-2xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                  Points to Improve in the App
                </h2>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            {/* Featured Quote Pill: "your opinion matters" */}
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border shadow-xs transition-all ${
              isLight 
                ? "bg-[#FFF8F5] border-[#E8D7C9] text-[#C96F55] shadow-[#C96F55]/5" 
                : "bg-indigo-500/10 border-indigo-500/25 text-indigo-300 shadow-indigo-500/10"
            }`}>
              <Quote size={12} className="rotate-180 opacity-75 shrink-0" />
              <span className="font-serif italic font-bold text-xs tracking-wide">
                your opinion matters
              </span>
              <Quote size={12} className="opacity-75 shrink-0" />
            </div>
          </div>
        </div>

        {/* Welcome Callout Banner with Quote */}
        <div className={`p-4 sm:p-5 rounded-2xl border relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22]/60 border-white/10"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
              isLight ? "bg-[#FFF1EC] text-[#C96F55]" : "bg-amber-400/15 text-amber-300"
            }`}>
              <Sparkles size={18} />
            </div>
            <div className="space-y-1">
              <h3 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-100"}`}>
                Tell me what I can improve to make your study experience better
              </h3>
              <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-300"} leading-relaxed max-w-2xl`}>
                All suggestions are delivered directly and privately to my personal inbox at <strong className={isLight ? "text-[#C96F55]" : "text-indigo-300"}>{CREATOR_GMAIL}</strong>. Whether it is the sound looping consistency, study tools, or interface details — <strong className={isLight ? "text-[#C96F55]" : "text-indigo-300"}>your opinion matters</strong> and directly drives the next updates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            {submittedHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isLight 
                    ? "bg-white hover:bg-[#FFF1EC] border-[#E8D7C9] text-[#1D1D1B]" 
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                }`}
              >
                <span>My Sent Points ({submittedHistory.length})</span>
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            <a
              href={mailtoHref}
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isLight 
                  ? "bg-white hover:bg-[#FFF1EC] border-[#E8D7C9] text-[#1D1D1B]" 
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
              }`}
              title="Open email in your mail client"
            >
              <Mail size={13} />
              <span>Email Hamza</span>
              <ExternalLink size={11} className="opacity-60" />
            </a>
          </div>
        </div>

        {/* Private Local Feedback History (Only for current user on this browser) */}
        {showHistory && submittedHistory.length > 0 && (
          <div className={`p-4 rounded-2xl border space-y-3 relative z-10 ${
            isLight ? "bg-[#F7F5F0] border-[#E8D7C9]" : "bg-[#0A0714] border-white/10"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono uppercase font-bold ${
                isLight ? "text-[#77736B]" : "text-slate-400"
              }`}>
                Your Sent Improvement Points
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isLight ? "bg-[#EAF3EC] text-[#66856D]" : "bg-emerald-500/15 text-emerald-400"
              }`}>
                Dispatched to {CREATOR_GMAIL} 🤍
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {submittedHistory.map((item) => (
                <div 
                  key={item.id}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isLight ? "bg-white border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isLight ? "bg-[#FFF1EC] text-[#C96F55]" : "bg-indigo-500/20 text-indigo-300"
                    }`}>
                      {item.category}
                    </span>
                    <span className={`text-[10px] font-mono ${isLight ? "text-[#9B9890]" : "text-slate-400"}`}>
                      {new Date(item.submittedAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? "text-[#1D1D1B]" : "text-slate-200"} whitespace-pre-wrap leading-relaxed`}>
                    {item.pointsToImprove}
                  </p>
                  {item.rating && (
                    <div className="flex items-center gap-1 text-amber-400 text-xs pt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={11} 
                          fill={i < item.rating! ? "currentColor" : "none"} 
                          className={i < item.rating! ? "text-amber-400" : "text-slate-600"} 
                        />
                      ))}
                      <span className={`text-[10px] font-mono ml-1 ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                        ({RATING_LABELS[item.rating] || `${item.rating}/5`})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Confirmation Card */}
        {feedbackSuccess ? (
          <div className={`p-6 rounded-2xl border text-center space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-300 ${
            isLight ? "bg-[#F3FAF5] border-[#CDE3D2]" : "bg-emerald-950/30 border-emerald-500/30"
          }`}>
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className={`text-lg font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                Points Sent to Hamza ({CREATOR_GMAIL})!
              </h3>
              <p className="text-xs font-serif italic text-emerald-600 dark:text-emerald-300 font-semibold text-base">
                “Your opinion matters”
              </p>
              <p className={`text-xs ${isLight ? "text-[#66856D]" : "text-emerald-200/80"} leading-relaxed`}>
                Thank you for taking the time to share your perspective. Your suggestion has been dispatched directly to Hamza's personal inbox and will guide upcoming refinements to Engez Nafsak.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setFeedbackSuccess(false)}
                className={`px-5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  isLight ? "bg-[#C96F55] hover:bg-[#B85F48] text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                Send Another Suggestion
              </button>
              <a
                href={mailtoHref}
                target="_blank"
                rel="noreferrer"
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  isLight ? "bg-white border-[#E8D7C9] text-[#1D1D1B]" : "bg-white/10 border-white/10 text-white"
                }`}
              >
                <Mail size={13} />
                <span>Open in Mail App</span>
              </a>
            </div>
          </div>
        ) : (
          /* Improvement Submission Form */
          <form onSubmit={handleSubmitFeedback} className="space-y-5 relative z-10">

            {/* Category Selector */}
            <div className="space-y-2">
              <label className={`text-xs font-bold block ${isLight ? "text-[#1D1D1B]" : "text-slate-200"}`}>
                1. What area would you like to improve?
              </label>
              <div className="flex flex-wrap gap-2">
                {IMPROVEMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                      feedbackCategory === cat.id
                        ? isLight 
                          ? "bg-[#C96F55] text-white border-[#C96F55] shadow-xs" 
                          : "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                        : isLight 
                          ? "bg-[#FAF8F5] hover:bg-[#FFF1EC] text-[#1D1D1B] border-[#E8D7C9]" 
                          : "bg-[#120E22] hover:bg-[#1A1432] text-slate-300 border-white/10"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Improvement Points Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="points-input" className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-200"}`}>
                  2. Tell me about the points I can improve in the app:
                </label>
                <span className={`text-[10px] font-mono ${isLight ? "text-[#9B9890]" : "text-slate-500"}`}>
                  {feedbackText.length} / 2000
                </span>
              </div>
              <textarea
                id="points-input"
                rows={4}
                value={feedbackText}
                maxLength={2000}
                onChange={(e) => {
                  setFeedbackText(e.target.value);
                  if (feedbackError) setFeedbackError(null);
                }}
                placeholder="Write your points to improve here... (e.g., sound looping consistency, study features you wish were added, or UI tweaks). This is sent directly to Hamza (hamzamousa26072011@gmail.com)!"
                className={`w-full rounded-2xl p-4 text-xs font-sans leading-relaxed transition focus:outline-none border ${
                  isLight 
                    ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B] placeholder:text-[#9B9890] focus:border-[#C96F55] focus:bg-white" 
                    : "bg-[#120E22] border-white/10 text-white placeholder:text-[#8B82A8] focus:border-indigo-500 focus:bg-[#16122c]"
                }`}
              />
              {feedbackError && (
                <p className="text-xs text-rose-500 font-medium">{feedbackError}</p>
              )}
            </div>

            {/* Rating & Contact row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              
              {/* Star Rating */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-200"}`}>
                    Overall Experience
                  </span>
                  <span className={`text-[11px] font-mono font-bold ${
                    isLight ? "text-[#C96F55]" : "text-indigo-400"
                  }`}>
                    {hoverRating ? RATING_LABELS[hoverRating] : RATING_LABELS[feedbackRating]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = hoverRating ? star <= hoverRating : star <= feedbackRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                        title={RATING_LABELS[star]}
                      >
                        <Star 
                          size={22} 
                          className={active ? "text-amber-400" : isLight ? "text-stone-300" : "text-slate-700"} 
                          fill={active ? "currentColor" : "none"} 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Email & Anonymous switch */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-200"}`}>
                    Your Email for Follow-up (Optional)
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded accent-[#C96F55] cursor-pointer"
                    />
                    <span className={isLight ? "text-[#77736B]" : "text-slate-400"}>Anonymous</span>
                  </label>
                </div>
                <input
                  type="email"
                  disabled={isAnonymous}
                  value={isAnonymous ? "" : feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder={isAnonymous ? "Sending anonymously to Hamza" : "Your email address so Hamza can reply"}
                  className={`w-full text-xs px-3.5 py-2 rounded-xl border focus:outline-none transition ${
                    isAnonymous 
                      ? "opacity-50 cursor-not-allowed bg-stone-100 border-stone-200 dark:bg-stone-900 dark:border-stone-800" 
                      : isLight 
                        ? "bg-white border-[#E8D7C9] text-[#1D1D1B] placeholder:text-[#9B9890] focus:border-[#C96F55]" 
                        : "bg-[#0A0714] border-white/10 text-white placeholder:text-[#8B82A8] focus:border-indigo-500"
                  }`}
                />
              </div>

            </div>

            {/* Footer with Submit Button & Quote */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <HeartHandshake size={15} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                <span className={`text-[11px] font-serif italic ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  “Your opinion matters” — Delivered directly to Hamza's Gmail.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                  className={`px-6 py-3 rounded-2xl font-mono text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                    !feedbackText.trim()
                      ? "opacity-50 cursor-not-allowed " + (isLight ? "bg-stone-300 text-stone-600" : "bg-white/10 text-slate-500")
                      : isLight
                        ? "bg-[#C96F55] hover:bg-[#B85F48] text-white shadow-[#C96F55]/20 hover:shadow-lg"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-lg"
                  }`}
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Sending to Hamza...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send to hamzamousa26072011@gmail.com</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>

    </div>
  );
}

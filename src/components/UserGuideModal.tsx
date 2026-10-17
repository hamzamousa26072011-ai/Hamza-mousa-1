import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  CalendarClock, 
  Timer, 
  GraduationCap, 
  Flame, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Compass, 
  Volume2, 
  Maximize2,
  Clock,
  BookOpen,
  HelpCircle,
  Play
} from "lucide-react";
import { EngezBrandLogo } from "./EngezBrandLogo";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
  themeMode?: "light" | "dark";
  onNavigateTab?: (tab: string) => void;
}

interface GuideStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  points: { title: string; desc: string }[];
  preview: React.ReactNode;
}

export default function UserGuideModal({
  isOpen,
  onClose,
  onSkip,
  themeMode = "dark",
  onNavigateTab
}: UserGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const isLight = themeMode === "light";

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onClose();
    }
  };

  const steps: GuideStep[] = [
    {
      id: "welcome",
      badge: "GETTING STARTED",
      title: "Welcome to Engez Nafsak",
      subtitle: "Your complete high-yield academic workstation for IGCSE, Cambridge & top grades.",
      icon: Sparkles,
      accentColor: "#C96F55",
      points: [
        {
          title: "All-in-One Study Hub",
          desc: "Centralize your exams, study timers, AI tutor, habits, and past papers in one distraction-free platform."
        },
        {
          title: "Built for Retention",
          desc: "Targeted countdowns and intervals structured specifically around real Cambridge & IGCSE paper durations."
        },
        {
          title: "Sync Across Devices",
          desc: "Sign in with Google or Email to automatically backup your exam dates and revision logs to the cloud."
        }
      ],
      preview: (
        <div className={`p-4 rounded-2xl border ${isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#0E1322] border-white/10"} flex flex-col items-center justify-center text-center space-y-3`}>
          <div className="w-16 h-16 shrink-0">
            <EngezBrandLogo themeMode={isLight ? "light" : "dark"} withContainer={true} className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div>
            <h4 className="font-sans font-black text-base">إنجز نفسك • Engez Nafsak</h4>
            <p className={`text-[11px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} mt-0.5`}>
              High-Speed Revision & Exam Preparation
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isLight ? "bg-[#FFF1EC] text-[#C96F55]" : "bg-indigo-950/60 text-indigo-300"}`}>
              ✓ Offline & Cloud Sync
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isLight ? "bg-[#EAF3EC] text-[#66856D]" : "bg-emerald-950/60 text-emerald-300"}`}>
              ✓ Zero Distractions
            </span>
          </div>
        </div>
      )
    },
    {
      id: "countdown",
      badge: "STEP 1 OF 4",
      title: "Exam Countdown & Subjects",
      subtitle: "Track every paper with real-time countdowns and urgency alerts.",
      icon: CalendarClock,
      accentColor: "#3B82F6",
      points: [
        {
          title: "Live Exam Timers",
          desc: "Add your Cambridge / Pearson exams with subject codes (e.g., 0620 Chemistry, 0580 Math) to see days, hours, and minutes remaining."
        },
        {
          title: "Urgency Alerts",
          desc: "Color-coded indicators warn you when an exam is imminent so you can prioritize critical revision blocks."
        },
        {
          title: "Study with Friends",
          desc: "Invite friends via email or invite codes to share countdowns and stay accountable together."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#0E1322] border-white/10"} space-y-2.5`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-500">
              Cambridge IGCSE
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-bold">
              🔥 14 Days Left
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold text-xs font-mono">
              0580
            </div>
            <div>
              <h5 className="font-bold text-xs">Mathematics (Extended) - Paper 4</h5>
              <p className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>May 08 • 09:00 AM</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
            {["14d", "06h", "42m", "15s"].map((t, idx) => (
              <div key={idx} className={`py-1 rounded-lg ${isLight ? "bg-white border border-[#E8D7C9]" : "bg-white/5"} text-[10px] font-bold`}>
                {t}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "timer",
      badge: "STEP 2 OF 4",
      title: "Exam-Tuned Countdown Timer",
      subtitle: "Pre-configured for P2, P4, P6, Math, or any custom duration.",
      icon: Timer,
      accentColor: "#C96F55",
      points: [
        {
          title: "Official Exam Presets",
          desc: "Instant one-click presets for Paper 2 (45m), Paper 4 (1h 15m), Paper 6 (1h), and Math (2h)."
        },
        {
          title: "Type Any Custom Time",
          desc: "Type exact hours and minutes directly into the input bar to create any custom study duration."
        },
        {
          title: "Gentle Rain White Noise & Full Screen",
          desc: "Enjoy soothing procedural rain ambience to block out noise, and press 'F' for immersive full screen with automatic screen wake lock."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#0E1322] border-white/10"} space-y-2.5`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-mono font-bold uppercase ${isLight ? "text-[#C96F55]" : "text-indigo-400"}`}>
              Timer Presets
            </span>
            <span className="text-[9px] font-mono flex items-center gap-1 text-amber-400">
              <Volume2 size={10} />
              <span>White Noise Rain</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] font-bold">
            <div className={`py-1 rounded-lg ${isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#C96F55]" : "bg-indigo-600 text-white"}`}>P2 (45m)</div>
            <div className={`py-1 rounded-lg ${isLight ? "bg-white border border-[#E8D7C9]" : "bg-white/5 text-slate-300"}`}>P4 (1h 15m)</div>
            <div className={`py-1 rounded-lg ${isLight ? "bg-white border border-[#E8D7C9]" : "bg-white/5 text-slate-300"}`}>P6 (1h)</div>
            <div className={`py-1 rounded-lg ${isLight ? "bg-white border border-[#E8D7C9]" : "bg-white/5 text-slate-300"}`}>Math (2h)</div>
          </div>
          <div className="flex items-center justify-center py-2 font-mono text-xl font-black tracking-widest text-[#C96F55]">
            00:45:00
          </div>
        </div>
      )
    },
    {
      id: "scholar",
      badge: "STEP 3 OF 4",
      title: "AI Tutor & Exam Checker",
      subtitle: "Instant syllabus explanations and step-by-step past paper guidance.",
      icon: GraduationCap,
      accentColor: "#8B5CF6",
      points: [
        {
          title: "Ask Anything 24/7",
          desc: "Stuck on tricky Physics equations, Organic Chemistry mechanisms, or Biology mark schemes? The AI tutor provides step-by-step breakdowns."
        },
        {
          title: "Interactive AI Worksheet Checker",
          desc: "Upload or type exam question solutions and get immediate feedback mapped against Cambridge grading criteria."
        },
        {
          title: "Math & Formula Support",
          desc: "Mathematical equations and LaTeX formulas render crystal clear directly in the chat responses."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#0E1322] border-white/10"} space-y-2`}>
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
            <Sparkles size={13} />
            <span>AI Tutor Response</span>
          </div>
          <div className={`p-2.5 rounded-xl ${isLight ? "bg-white border border-[#E8D7C9]" : "bg-white/5"} text-[10px] space-y-1 font-mono`}>
            <p className="font-bold text-[#C96F55]">Q: Explain Le Chatelier's Principle for pressure increase?</p>
            <p className={isLight ? "text-[#1D1D1B]" : "text-slate-300"}>
              ✓ Equilibrium shifts toward the side with fewer gas moles.<br/>
              ✓ Maximizes yield according to standard Cambridge mark scheme.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "habits",
      badge: "STEP 4 OF 4",
      title: "Habit Tracker & Daily Streaks",
      subtitle: "Consistency creates top performers. Build your non-negotiable routine.",
      icon: Flame,
      accentColor: "#EA580C",
      points: [
        {
          title: "Daily Habit Streaks",
          desc: "Log daily past paper practice, flashcard reviews, and study blocks to build and protect your streak."
        },
        {
          title: "Interactive Visual Grid",
          desc: "View your monthly calendar grid and celebrate milestones with motivational streak counters."
        },
        {
          title: "Customizable Themes",
          desc: "Toggle between Dark Theme and White Theme in Settings to match your study aesthetic day or night."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-2xl border ${isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#0E1322] border-white/10"} space-y-2.5`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#C96F55]">
              <Flame size={14} className="fill-current text-[#C96F55]" />
              <span>Current Streak: 7 Days</span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
              100% Today
            </span>
          </div>
          <div className="space-y-1.5">
            {["Complete 1 Chemistry Past Paper", "Revise Physics Formula Sheet", "45m Deep Study Session"].map((h, i) => (
              <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${isLight ? "bg-white border border-[#E8D7C9]" : "bg-white/5"} text-[10px] font-mono`}>
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                <span className="truncate">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative max-w-xl w-full rounded-3xl border shadow-2xl overflow-hidden my-auto ${
            isLight ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B]" : "bg-[#0B0F1D] border-white/15 text-white"
          }`}
        >
          {/* Top Decorative Header Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#C96F55] via-indigo-500 to-emerald-500" />

          {/* Top Actions: Skip Guide & Close */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={handleSkip}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1 border ${
                isLight
                  ? "bg-[#FAF8F5] hover:bg-[#F0EEE8] border-[#E8D7C9] text-[#77736B] hover:text-[#1D1D1B]"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
              }`}
              title="Skip guide and start using app"
            >
              <span>Skip Guide</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isLight
                  ? "bg-[#FAF8F5] hover:bg-[#F0EEE8] border-[#E8D7C9] text-[#77736B] hover:text-[#1D1D1B]"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Close Guide"
            >
              <X size={15} />
            </button>
          </div>

          {/* Slide Content with Smooth AnimatePresence */}
          <div className="p-5 sm:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5"
              >
                {/* Step Header Badge & Icon */}
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: `${currentStep.accentColor}20`, color: currentStep.accentColor }}
                  >
                    <StepIcon size={20} />
                  </div>
                  <div>
                    <span 
                      className="text-[9px] font-mono uppercase tracking-widest font-black block"
                      style={{ color: currentStep.accentColor }}
                    >
                      {currentStep.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold font-sans leading-tight">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>

                <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} font-sans leading-relaxed`}>
                  {currentStep.subtitle}
                </p>

                {/* Step Interactive Visual Preview Card */}
                {currentStep.preview}

                {/* Key Guidance Points */}
                <div className="space-y-2.5 pt-1">
                  {currentStep.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-mono font-bold"
                        style={{ backgroundColor: `${currentStep.accentColor}25`, color: currentStep.accentColor }}
                      >
                        ✓
                      </div>
                      <div>
                        <span className={`text-xs font-bold font-sans ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                          {pt.title}:{" "}
                        </span>
                        <span className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} font-sans`}>
                          {pt.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Bar: Indicators & Navigation Controls */}
          <div className={`p-4 sm:px-7 border-t ${
            isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#070A14] border-white/10"
          } flex items-center justify-between gap-3`}>
            {/* Step indicator dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStepIndex === idx
                      ? "w-6 bg-[#C96F55]"
                      : isLight ? "w-2 bg-[#E8D7C9] hover:bg-[#D5C2B1]" : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  title={`Jump to step ${idx + 1}`}
                />
              ))}
              <span className={`text-[10px] font-mono ml-2 ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                {currentStepIndex + 1}/{steps.length}
              </span>
            </div>

            {/* Prev & Next / Finish buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                  isLight 
                    ? "text-[#77736B] hover:text-[#1D1D1B] hover:bg-[#F0EEE8]" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title="Skip entire guide"
              >
                Skip Guide
              </button>

              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1 border ${
                    isLight 
                      ? "bg-white hover:bg-[#F0EEE8] border-[#E8D7C9] text-[#1D1D1B]" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                  }`}
                >
                  <ArrowLeft size={13} />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5 shadow-md ${
                  isLastStep
                    ? "bg-[#C96F55] hover:bg-[#B85F48] text-white"
                    : isLight
                    ? "bg-[#C96F55] hover:bg-[#B85F48] text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                }`}
              >
                <span>{isLastStep ? "Start Studying" : "Next"}</span>
                {isLastStep ? <CheckCircle2 size={13} /> : <ArrowRight size={13} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from "react";
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
  Volume2
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
  themeMode = "dark"
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

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const steps: GuideStep[] = [
    {
      id: "welcome",
      badge: "Welcome",
      title: "Welcome to Engez Nafsak (إنجز نفسك)",
      subtitle: "A calm, focused academic workspace for planning exams, study habits, and timed revision sessions.",
      icon: Sparkles,
      accentColor: "#5F55C8",
      points: [
        {
          title: "Today View & Tasks",
          desc: "Organize daily study tasks, see your next upcoming exam, and launch a timed study session from one clean view."
        },
        {
          title: "Exam Countdowns & Urgency",
          desc: "Track exam papers with clear status indicators: On Track (>10 days), Approaching (4–10 days), and Imminent (≤3 days)."
        },
        {
          title: "Local or Signed-In Storage",
          desc: "Use Guest mode to store data locally in this browser, or sign in to link your workspace to your account."
        }
      ],
      preview: (
        <div className={`p-4 rounded-2xl border ${isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#222938] border-[#2B3344]"} flex flex-col items-center justify-center text-center space-y-3`}>
          <div className="w-14 h-14 shrink-0">
            <EngezBrandLogo themeMode={isLight ? "light" : "dark"} withContainer={true} className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className={`font-sans font-bold text-base ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
              Engez Nafsak • <span lang="ar" dir="rtl" className="font-arabic">إنجز نفسك</span>
            </h4>
            <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"} mt-0.5`}>
              Focused Academic & Exam Preparation Workspace
            </p>
          </div>
        </div>
      )
    },
    {
      id: "countdown",
      badge: "Step 1 of 4",
      title: "Exam Countdowns & Study Circle",
      subtitle: "Keep track of every upcoming exam paper and stay accountable with classmates.",
      icon: CalendarClock,
      accentColor: "#1F7A4C",
      points: [
        {
          title: "Clear Paper Schedule",
          desc: "Add your exams with paper code, exam board, target grade, and exact date and time."
        },
        {
          title: "Accessible Urgency Status",
          desc: "Exams more than 10 days away are shown in a calm green 'On Track' theme, shifting to amber and red as exam day approaches."
        },
        {
          title: "Study Circle Leaderboard",
          desc: "Compare weekly focus minutes with invited study partners."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#E9F7EF] border-[#B7E4C7]" : "bg-[#143024] border-[#1F7A4C]/50"} space-y-2`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-semibold ${isLight ? "text-[#1F7A4C]" : "text-[#4ADE80]"}`}>
              Cambridge IGCSE • 0580
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${isLight ? "bg-white text-[#1F7A4C]" : "bg-[#191E28] text-[#4ADE80]"}`}>
              On Track • 18 Days Left
            </span>
          </div>
          <div className={`font-bold text-sm ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
            Mathematics (Extended) — Paper 4
          </div>
        </div>
      )
    },
    {
      id: "timer",
      badge: "Step 2 of 4",
      title: "Focus Timer & Exam Paper Presets",
      subtitle: "Practice under real paper durations or run structured Pomodoro study intervals.",
      icon: Timer,
      accentColor: "#5F55C8",
      points: [
        {
          title: "Exam Paper Presets",
          desc: "Switch between Pomodoro (25m), Paper 2 (45m), Paper 6 (60m), Paper 4 (75m), or Full Math (120m)."
        },
        {
          title: "Custom Duration & Fullscreen",
          desc: "Set any custom hours and minutes or open distraction-free fullscreen mode."
        },
        {
          title: "Optional Rain Ambience",
          desc: "Toggle gentle synthesized rain audio with a mute and volume control whenever you want background focus sound."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#222938] border-[#2B3344]"} space-y-2`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`}>Paper 2 Preset (45m)</span>
            <span className={`flex items-center gap-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              <Volume2 size={12} /> Rain Ambience
            </span>
          </div>
          <div className={`text-center py-2 font-mono text-2xl font-bold tracking-wider ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
            00:45:00
          </div>
        </div>
      )
    },
    {
      id: "habits",
      badge: "Step 3 of 4",
      title: "Habit Tracker & Daily Routine",
      subtitle: "Build steady daily study habits and log rest and mood.",
      icon: Flame,
      accentColor: "#B86E00",
      points: [
        {
          title: "Daily Checklist & Multi-Day Grid",
          desc: "Use the compact Daily Checklist on phones or switch to the 7/14/21/30-day matrix on larger screens."
        },
        {
          title: "Mood & Sleep Logging",
          desc: "Record your daily wellbeing (1–10) and sleep quality to see how rest affects your consistency."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#222938] border-[#2B3344]"} space-y-1.5`}>
          {["Complete 1 Past Paper", "Review Formula Sheet"].map((h, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium ${isLight ? "bg-white border-[#E2E6EE] text-[#18202B]" : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8]"}`}>
              <CheckCircle2 size={14} className="text-[#1F7A4C] shrink-0" />
              <span className="truncate">{h}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "scholar",
      badge: "Step 4 of 4",
      title: "AI Tutor & Mark Scheme Assistant",
      subtitle: "Upload past paper questions or notes for step-by-step explanations.",
      icon: GraduationCap,
      accentColor: "#5F55C8",
      points: [
        {
          title: "Attach Questions or Working",
          desc: "Upload PDFs, text notes, or photos of your handwritten answers to review concepts."
        },
        {
          title: "Syllabus Breakdown",
          desc: "Ask for step-by-step derivations and mark scheme keyword checks."
        }
      ],
      preview: (
        <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#222938] border-[#2B3344]"} space-y-1.5 text-xs`}>
          <div className={`font-semibold ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`}>
            Example Prompt
          </div>
          <p className={isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}>
            "Explain Le Chatelier's Principle when pressure increases and list key mark scheme terms."
          </p>
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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={`relative max-w-xl w-full rounded-2xl border shadow-2xl overflow-hidden my-auto ${
            isLight
              ? "bg-[#FFFFFF] border-[#E2E6EE] text-[#18202B]"
              : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8]"
          }`}
        >
          {/* Top Actions: Skip Guide & Close */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-inherit">
            <span className={`text-xs font-semibold ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`}>
              {currentStep.badge}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isLight
                    ? "bg-[#F6F7FA] hover:bg-[#ECEFF5] border-[#D0D7E2] text-[#596474] hover:text-[#18202B]"
                    : "bg-[#222938] hover:bg-[#2B3344] border-[#2B3344] text-[#B7C0CF] hover:text-[#F1F3F8]"
                }`}
              >
                Skip Guide
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close guide"
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLight
                    ? "bg-[#F6F7FA] hover:bg-[#ECEFF5] border-[#D0D7E2] text-[#596474]"
                    : "bg-[#222938] hover:bg-[#2B3344] border-[#2B3344] text-[#B7C0CF]"
                }`}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Slide Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isLight ? "bg-[#EFEEFA] text-[#5F55C8]" : "bg-[#222938] text-[#A99BFF]"
                    }`}
                  >
                    <StepIcon size={20} />
                  </div>
                  <h2 id="guide-modal-title" className="text-lg sm:text-xl font-bold leading-tight">
                    {currentStep.title}
                  </h2>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  {currentStep.subtitle}
                </p>

                {currentStep.preview}

                <div className="space-y-2.5 pt-1">
                  {currentStep.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`} />
                      <div className="text-xs leading-relaxed">
                        <span className={`font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                          {pt.title}:{" "}
                        </span>
                        <span className={isLight ? "text-[#596474]" : "text-[#B7C0CF]"}>
                          {pt.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Bar */}
          <div
            className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#10131A] border-[#2B3344]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to step ${idx + 1}`}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStepIndex === idx
                      ? "w-6 bg-[#5F55C8]"
                      : isLight
                      ? "w-2 bg-[#D0D7E2]"
                      : "w-2 bg-[#2B3344]"
                  }`}
                />
              ))}
              <span className={`text-xs font-mono ml-2 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                {currentStepIndex + 1}/{steps.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 border ${
                    isLight
                      ? "bg-white hover:bg-[#ECEFF5] border-[#D0D7E2] text-[#18202B]"
                      : "bg-[#222938] hover:bg-[#2B3344] border-[#2B3344] text-[#F1F3F8]"
                  }`}
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#5F55C8] hover:bg-[#4E45B0] text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{isLastStep ? "Open Workspace" : "Next"}</span>
                {isLastStep ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

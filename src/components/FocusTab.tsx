import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Award, 
  Zap, 
  Lock, 
  Unlock, 
  Minus, 
  Plus, 
  Coffee, 
  Brain, 
  Trees, 
  SkipForward, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  CloudRain, 
  Volume2, 
  VolumeX, 
  Headphones,
  Wind,
  Moon,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  SoundscapeType,
  setSoundscape,
  setSoundscapeVolume,
  stopAllSoundscapes,
  pauseSoundscape,
  resumeSoundscape,
  getCurrentSoundscape
} from "../lib/ambientSoundscapes";
import { FlipClockTimer } from "./FlipClockTimer";

interface FocusTabProps {
  focusModeActive: boolean;
  onStartFocus: () => void;
  onPauseFocus?: () => void;
  onResetFocus?: () => void;
  onStopFocus: () => void;
  focusMinutesSelected: number;
  onDurationChange: (mins: number) => void;
  focusTimeRemaining: string;
  isPaused?: boolean;
  pomodoroMode?: "work" | "break" | "long";
  onModeChange?: (mode: "work" | "break" | "long") => void;
  pomodoroCount?: number;
  themeMode?: "light" | "dark";
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

export default function FocusTab({
  focusModeActive,
  onStartFocus,
  onPauseFocus,
  onResetFocus,
  onStopFocus,
  focusMinutesSelected,
  onDurationChange,
  focusTimeRemaining,
  isPaused = false,
  pomodoroMode = "work",
  onModeChange,
  pomodoroCount = 0,
  themeMode = "light",
  onFullScreenChange
}: FocusTabProps) {

  const isLight = themeMode === "light";

  // Pomodoro Interval durations (in minutes) - Defaults: 50 min study / 10 min break / 20 min long break
  const [workDuration, setWorkDuration] = useState(50);
  const [shortBreakDuration, setShortBreakDuration] = useState(10);
  const [longBreakDuration, setLongBreakDuration] = useState(20);
  
  const [currentMode, setCurrentMode] = useState<"work" | "break" | "long">(pomodoroMode);
  const [currentCycleStep, setCurrentCycleStep] = useState(1); // 1 to 2 in 2-Hour cycle mode
  const [isLocked, setIsLocked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Ambient Soundscapes State - Default is "silent" (Quiet) per user requirement!
  const [selectedSoundscape, setSelectedSoundscape] = useState<SoundscapeType>(() => {
    const saved = localStorage.getItem("ENGEZ_SELECTED_SOUNDSCAPE");
    if (saved && ["silent", "white_noise", "gentle_rain", "gamma_40hz", "warm_hearth"].includes(saved)) {
      return saved as SoundscapeType;
    }
    return "silent"; // Default quiet!
  });

  const [soundVolume, setSoundVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem("ENGEZ_SOUND_VOLUME");
    return saved ? parseFloat(saved) : 0.6;
  });

  const [autoSoundOnStudy, setAutoSoundOnStudy] = useState<boolean>(() => {
    const saved = localStorage.getItem("ENGEZ_AUTO_SOUND_STUDY");
    return saved !== null ? saved === "true" : false; // Default false (quiet by default)
  });

  const [lastNonSilentSoundscape, setLastNonSilentSoundscape] = useState<SoundscapeType>(() => {
    const saved = localStorage.getItem("ENGEZ_LAST_SOUNDSCAPE");
    if (saved && ["white_noise", "gentle_rain", "gamma_40hz", "warm_hearth"].includes(saved)) {
      return saved as SoundscapeType;
    }
    return "white_noise";
  });
  
  // Custom accomplishment modal (silent visual celebration)
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedMode, setCompletedMode] = useState<"work" | "break" | "long">("work");
  
  // Track focus transitions to trigger completion modal
  const [prevFocusActive, setPrevFocusActive] = useState(focusModeActive);

  // Save ambient sound preferences
  useEffect(() => {
    localStorage.setItem("ENGEZ_SELECTED_SOUNDSCAPE", selectedSoundscape);
    if (selectedSoundscape !== "silent") {
      localStorage.setItem("ENGEZ_LAST_SOUNDSCAPE", selectedSoundscape);
      setLastNonSilentSoundscape(selectedSoundscape);
    }
  }, [selectedSoundscape]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_SOUND_VOLUME", soundVolume.toString());
  }, [soundVolume]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_AUTO_SOUND_STUDY", autoSoundOnStudy.toString());
  }, [autoSoundOnStudy]);

  // Handle ambient sound lifecycle: immediately pause sound when timer is paused, resume when active
  useEffect(() => {
    if (selectedSoundscape === "silent") {
      stopAllSoundscapes();
      return;
    }

    if (isPaused) {
      pauseSoundscape();
    } else if (focusModeActive && currentMode === "work") {
      setSoundscape(selectedSoundscape, soundVolume);
    }
  }, [focusModeActive, isPaused, currentMode, selectedSoundscape, soundVolume]);

  // Stop sounds on unmount
  useEffect(() => {
    return () => {
      stopAllSoundscapes();
    };
  }, []);

  // Handle user selecting a soundscape tile
  const handleSelectSoundscape = (type: SoundscapeType) => {
    if (type === "silent") {
      setSelectedSoundscape("silent");
      stopAllSoundscapes();
      return;
    }

    if (selectedSoundscape === type && !isPaused) {
      // Toggle to silent if clicking active non-silent
      setSelectedSoundscape("silent");
      stopAllSoundscapes();
    } else {
      setSelectedSoundscape(type);
      setLastNonSilentSoundscape(type);

      if (isPaused) {
        // When timer is paused, set selection and keep sound paused until session resumes
        pauseSoundscape();
      } else {
        // Timer is running or idle ready to start: play the selected soundscape immediately!
        setSoundscape(type, soundVolume);
      }
    }
  };

  // Handle quick toggle between silent and last chosen soundscape
  const handleQuickToggleSound = () => {
    if (selectedSoundscape !== "silent") {
      setSelectedSoundscape("silent");
      stopAllSoundscapes();
    } else {
      const toPlay = lastNonSilentSoundscape || "white_noise";
      setSelectedSoundscape(toPlay);
      if (isPaused) {
        pauseSoundscape();
      } else {
        setSoundscape(toPlay, soundVolume);
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVol: number) => {
    setSoundVolumeState(newVol);
    setSoundscapeVolume(newVol);
  };

  // Full Screen Mode Handlers
  const handleEnterFullscreen = async () => {
    setIsFullScreen(true);
    setIsLocked(true);
    onFullScreenChange?.(true);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // In-app immersive full screen still engages seamlessly
    }
  };

  const handleExitFullscreen = () => {
    setIsFullScreen(false);
    setIsLocked(false);
    onFullScreenChange?.(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  // Synchronize state with native browser fullscreen changes (e.g. user pressed Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
        setIsLocked(false);
        onFullScreenChange?.(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFullScreen, onFullScreenChange]);

  // Lock background body scrolling & notify parent when fullscreen or locked focus mode is active
  useEffect(() => {
    if (isFullScreen || isLocked) {
      onFullScreenChange?.(true);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    } else {
      onFullScreenChange?.(false);
    }
  }, [isFullScreen, isLocked, onFullScreenChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onFullScreenChange?.(false);
      document.body.style.overflow = "";
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onFullScreenChange]);

  // Global Keyboard shortcuts:
  // - [F]: Toggle Full Screen
  // - [Esc]: Exit Full Screen
  // - [Space]: Start/Pause session when in Full Screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

      if (e.key === "Escape" && (isFullScreen || isLocked)) {
        handleExitFullscreen();
      } else if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isFullScreen || isLocked) {
          handleExitFullscreen();
        } else {
          handleEnterFullscreen();
        }
      } else if (e.code === "Space" && (isFullScreen || isLocked)) {
        e.preventDefault();
        if (focusModeActive) {
          pauseSoundscape();
          onPauseFocus ? onPauseFocus() : onStopFocus();
        } else {
          if (selectedSoundscape !== "silent") {
            setSoundscape(selectedSoundscape, soundVolume);
          }
          onStartFocus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen, isLocked, focusModeActive, onPauseFocus, onStopFocus, onStartFocus, selectedSoundscape, soundVolume]);

  // Synchronize initial component load default state
  useEffect(() => {
    if (pomodoroMode) {
      setCurrentMode(pomodoroMode);
    }
  }, [pomodoroMode]);

  // Listen back for timer completion triggers
  useEffect(() => {
    if (prevFocusActive && !focusModeActive && !isPaused) {
      setCompletedMode(currentMode);
      setShowCompletionModal(true);
      
      if (currentMode === "work") {
        if (currentCycleStep >= 2) {
          setCurrentMode("long");
          onModeChange?.("long");
          onDurationChange(longBreakDuration);
          setCurrentCycleStep(1);
        } else {
          setCurrentMode("break");
          onModeChange?.("break");
          onDurationChange(shortBreakDuration);
        }
      } else if (currentMode === "break") {
        setCurrentCycleStep((prev) => Math.min(2, prev + 1));
        setCurrentMode("work");
        onModeChange?.("work");
        onDurationChange(workDuration);
      } else {
        setCurrentCycleStep(1);
        setCurrentMode("work");
        onModeChange?.("work");
        onDurationChange(workDuration);
      }
    }
    setPrevFocusActive(focusModeActive);
  }, [focusModeActive, isPaused]);

  // Handle manual mode switches
  const handleModeSwitch = (mode: "work" | "break" | "long") => {
    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }
    setCurrentMode(mode);
    onModeChange?.(mode);
    const targetMins = mode === "work" ? workDuration : mode === "break" ? shortBreakDuration : longBreakDuration;
    onDurationChange(targetMins);
    onResetFocus?.();
  };

  // Skip to next stage in Pomodoro cycle
  const handleSkipToNext = () => {
    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }
    if (currentMode === "work") {
      if (currentCycleStep >= 2) {
        handleModeSwitch("long");
      } else {
        handleModeSwitch("break");
      }
    } else {
      if (currentMode === "break") {
        setCurrentCycleStep((prev) => (prev >= 2 ? 1 : prev + 1));
      }
      handleModeSwitch("work");
    }
  };

  // Handles updating durations from settings sliders
  const handleSlideChange = (mode: "work" | "break" | "long", value: number) => {
    if (mode === "work") {
      setWorkDuration(value);
      if (currentMode === "work") {
        onDurationChange(value);
      }
    } else if (mode === "break") {
      setShortBreakDuration(value);
      if (currentMode === "break") {
        onDurationChange(value);
      }
    } else if (mode === "long") {
      setLongBreakDuration(value);
      if (currentMode === "long") {
        onDurationChange(value);
      }
    }
  };

  // Quick Presets Actions
  const applyPreset = (work: number, breakMins: number, longMins: number) => {
    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }
    setWorkDuration(work);
    setShortBreakDuration(breakMins);
    setLongBreakDuration(longMins);

    const targetMins = currentMode === "work" ? work : currentMode === "break" ? breakMins : longMins;
    onDurationChange(targetMins);
    onResetFocus?.();
  };

  // Render SVG circular variables
  const currentTotalMinutes = currentMode === "work" ? workDuration : currentMode === "break" ? shortBreakDuration : longBreakDuration;
  
  // Parse remaining seconds safely
  let remainingSeconds = 0;
  try {
    const parts = focusTimeRemaining.split(":");
    if (parts.length === 3) {
      remainingSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    } else if (parts.length === 2) {
      remainingSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
  } catch (e) {
    remainingSeconds = currentTotalMinutes * 60;
  }
  
  const totalSeconds = currentTotalMinutes * 60;
  const progressRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 1;

  const getModeTheme = () => {
    if (currentMode === "work") {
      return {
        label: "Study Focus",
        icon: Brain,
        colorClass: isLight ? "text-[#C96F55]" : "text-indigo-400",
        badgeBg: isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" : "bg-indigo-950/60 border-indigo-500/30 text-indigo-300",
        strokeColor: isLight ? "#C96F55" : "#6366F1",
        gradientBg: isLight ? "from-[#FFF1EC]/50 to-transparent" : "from-indigo-600/10 via-indigo-950/20 to-transparent",
        accentGlow: isLight ? "shadow-md" : "shadow-indigo-500/20"
      };
    } else if (currentMode === "break") {
      return {
        label: "Short Break",
        icon: Coffee,
        colorClass: isLight ? "text-[#66856D]" : "text-emerald-400",
        badgeBg: isLight ? "bg-[#EAF3EC] border-[#CDE3D2] text-[#66856D]" : "bg-emerald-950/60 border-emerald-500/30 text-emerald-300",
        strokeColor: isLight ? "#66856D" : "#10B981",
        gradientBg: isLight ? "from-[#EAF3EC]/50 to-transparent" : "from-emerald-600/10 via-emerald-950/20 to-transparent",
        accentGlow: isLight ? "shadow-md" : "shadow-emerald-500/20"
      };
    } else {
      return {
        label: "Long Break",
        icon: Trees,
        colorClass: isLight ? "text-[#587B8C]" : "text-cyan-400",
        badgeBg: isLight ? "bg-[#E8F1F5] border-[#CADEE8] text-[#587B8C]" : "bg-cyan-950/60 border-cyan-500/30 text-cyan-300",
        strokeColor: isLight ? "#587B8C" : "#06B6D4",
        gradientBg: isLight ? "from-[#E8F1F5]/50 to-transparent" : "from-cyan-600/10 via-cyan-950/20 to-transparent",
        accentGlow: isLight ? "shadow-md" : "shadow-cyan-500/20"
      };
    }
  };

  const theme = getModeTheme();

  return (
    <div className="space-y-6 md:space-y-8 relative">

      {/* Full Screen Immersive Focus Mode Overlay (Rendered directly on document.body to break out of all parent layout constraints) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {(isFullScreen || isLocked) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen min-h-[100dvh] h-[100dvh] ${
                isLight ? "bg-[#FAF9F5] text-[#1D1D1B]" : "bg-[#000000] text-white"
              } z-[999999] flex flex-col justify-between p-4 sm:p-6 md:p-8 text-center select-none overflow-y-auto overscroll-none`}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100%",
                minHeight: "100%",
                zIndex: 999999,
              }}
            >
            {/* Fullscreen Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-6xl mx-auto w-full">
              {/* Left: Brand & Mode Tag */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/engez_brand_emblem.svg"
                    alt="Engez"
                    className="w-8 h-8 rounded-xl object-contain bg-[#FAF8F5] border border-[#E8D7C9] p-0.5 shadow-xs"
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono tracking-widest ${isLight ? "text-[#C96F55]" : "text-indigo-400"} font-black uppercase`}>
                        FULL SCREEN FOCUS
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.2 rounded-full border ${theme.badgeBg} font-bold uppercase`}>
                        {theme.label}
                      </span>
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-200"}`}>
                      {currentMode === "work" ? "Deep Study Session" : currentMode === "break" ? "Rest & Recharge Interval" : "Extended Recovery Period"}
                    </h3>
                  </div>
                </div>

                {/* Mobile-only exit button */}
                <button
                  onClick={handleExitFullscreen}
                  className={`sm:hidden p-2 ${
                    isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                  } border rounded-xl transition cursor-pointer`}
                  title="Exit Full Screen (Esc)"
                >
                  <Minimize2 size={16} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                </button>
              </div>

              {/* Center: Quick Mode Switcher in Full Screen */}
              <div className={`hidden md:flex items-center border ${
                isLight ? "border-[#E3E0D8] bg-[#F0EEE8]" : "border-white/10 bg-[#0C101E]"
              } p-1 rounded-2xl`}>
                <button
                  onClick={() => handleModeSwitch("work")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                    currentMode === "work"
                      ? isLight ? "bg-[#C96F55] text-white shadow-xs font-extrabold" : "bg-indigo-600 text-white shadow-md font-extrabold"
                      : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Brain size={12} />
                  <span>Study ({workDuration}m)</span>
                </button>

                <button
                  onClick={() => handleModeSwitch("break")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                    currentMode === "break"
                      ? isLight ? "bg-[#66856D] text-white shadow-xs font-extrabold" : "bg-emerald-600 text-white shadow-md font-extrabold"
                      : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Coffee size={12} />
                  <span>Break ({shortBreakDuration}m)</span>
                </button>

                <button
                  onClick={() => handleModeSwitch("long")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                    currentMode === "long"
                      ? isLight ? "bg-[#587B8C] text-white shadow-xs font-extrabold" : "bg-cyan-600 text-white shadow-md font-extrabold"
                      : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Trees size={12} />
                  <span>Long Break ({longBreakDuration}m)</span>
                </button>
              </div>

              {/* Right: Soundscape Quick Toggle & Exit Button */}
              <div className="hidden sm:flex items-center gap-2.5">
                <button
                  onClick={handleQuickToggleSound}
                  className={`py-2 px-3 ${
                    isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                  } border rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer`}
                  title={
                    selectedSoundscape !== "silent"
                      ? isPaused
                        ? `Soundscape: ${selectedSoundscape} (Paused with timer)`
                        : `Soundscape: ${selectedSoundscape} (Click to mute)`
                      : "Click to play ambient sound"
                  }
                >
                  {selectedSoundscape === "silent" ? (
                    <VolumeX size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                  ) : isPaused ? (
                    <VolumeX size={13} className="text-amber-500" />
                  ) : (
                    <Volume2 size={13} className="text-[#C96F55] animate-pulse" />
                  )}
                  <span className="text-[11px]">
                    {selectedSoundscape === "silent"
                      ? "Quiet"
                      : isPaused
                      ? `${selectedSoundscape.replace("_", " ")} (Paused)`
                      : selectedSoundscape.replace("_", " ")}
                  </span>
                </button>

                <button
                  onClick={handleExitFullscreen}
                  className={`py-2 px-3.5 ${
                    isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                  } border rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                  title="Exit Full Screen (Esc)"
                >
                  <Minimize2 size={14} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                  <span>Exit Full Screen</span>
                  <kbd className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLight ? "bg-[#F0EEE8] text-[#77736B]" : "bg-white/10 text-slate-300"}`}>
                    Esc
                  </kbd>
                </button>
              </div>
            </div>

            {/* Central Massive Chrono */}
            <div className="my-auto py-4 flex flex-col items-center justify-center">
              
              {/* Pomodoro 4-step Cycle Pill Tracker */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold transition ${
                      step < currentCycleStep
                        ? isLight ? "bg-[#EAF3EC] text-[#66856D] border border-[#CDE3D2]" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : step === currentCycleStep
                        ? isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9] shadow-xs" : "bg-indigo-500/30 text-indigo-200 border border-indigo-500/50 shadow-lg shadow-indigo-500/20 scale-105"
                        : isLight ? "bg-[#FFFFFF] text-[#77736B] border border-[#E3E0D8]" : "bg-white/5 text-slate-500 border border-white/5"
                    }`}
                  >
                    <span>🍅</span>
                    <span>Set {step}</span>
                  </div>
                ))}
              </div>

              {/* Timer Showcase without circular frame */}
              <div className="flex flex-col items-center justify-center select-none text-center my-4 sm:my-6 md:my-8">
                <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest py-1.5 px-4 rounded-full border mb-4 sm:mb-6 ${theme.badgeBg}`}>
                  {currentMode === "work" ? "🧠 STUDY FOCUS" : currentMode === "break" ? "☕ SHORT BREAK" : "🌴 LONG BREAK"}
                </span>
                
                <div className="my-2 sm:my-4 md:my-6 transform origin-center transition-all duration-300">
                  <FlipClockTimer 
                    timeRemaining={focusTimeRemaining} 
                    size="2xl" 
                    themeMode={themeMode} 
                    isPaused={isPaused} 
                  />
                </div>

                {/* Subtle linear progress bar when focus session is running */}
                {focusModeActive && (
                  <div className="w-64 sm:w-80 md:w-96 lg:w-[32rem] h-2 bg-black/10 dark:bg-white/10 rounded-full mt-4 sm:mt-5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        currentMode === "work" 
                          ? isLight ? "bg-[#C96F55]" : "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" 
                          : currentMode === "break" 
                          ? isLight ? "bg-[#66856D]" : "bg-emerald-500" 
                          : isLight ? "bg-[#587B8C]" : "bg-cyan-500"
                      }`}
                      style={{ width: `${Math.round((1 - progressRatio) * 100)}%` }}
                    />
                  </div>
                )}
                
                {isPaused && (
                  <span className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-widest text-[#B85C5C] bg-[#FFF1EC] border border-[#E8D7C9] px-3.5 py-1 rounded-full mt-4 animate-pulse">
                    ⏸ PAUSED
                  </span>
                )}

                {!isPaused && (
                  <span className={`text-[10px] sm:text-xs font-mono tracking-widest ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase font-black mt-4`}>
                    {focusModeActive ? `ACTIVE COUNTDOWN • SET ${currentCycleStep} OF 4` : "READY TO LAUNCH"}
                  </span>
                )}
              </div>

              {/* Sound Effects Selector (Directly beneath timer dial) */}
              <div className="w-full max-w-2xl mx-auto mt-6 mb-2 px-2 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <Headphones size={14} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLight ? "text-[#77736B]" : "text-slate-300"}`}>
                    Sound Effects & Ambience
                  </span>
                  {selectedSoundscape !== "silent" ? (
                    isPaused ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Paused with timer
                      </span>
                    ) : focusModeActive && currentMode === "work" ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Playing
                      </span>
                    ) : (
                      <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${isLight ? "bg-black/5 text-[#77736B] border-[#E3E0D8]" : "bg-white/5 text-slate-400 border-white/10"}`}>
                        Ready on start
                      </span>
                    )
                  ) : (
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${isLight ? "bg-black/5 text-[#77736B] border-[#E3E0D8]" : "bg-white/5 text-slate-400 border-white/10"}`}>
                      Quiet
                    </span>
                  )}
                </div>

                {/* Sound effect choice buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 w-full">
                  {[
                    { id: "silent" as SoundscapeType, label: "Quiet", desc: "No audio", icon: <VolumeX size={14} /> },
                    { id: "white_noise" as SoundscapeType, label: "White Noise", desc: "Night breeze", icon: <Moon size={14} /> },
                    { id: "gentle_rain" as SoundscapeType, label: "Gentle Rain", desc: "Droplets", icon: <CloudRain size={14} /> },
                    { id: "gamma_40hz" as SoundscapeType, label: "40Hz Gamma", desc: "Focus waves", icon: <Brain size={14} /> },
                    { id: "warm_hearth" as SoundscapeType, label: "Warm Hearth", desc: "Fireplace", icon: <Flame size={14} /> },
                  ].map((s) => {
                    const isSelected = selectedSoundscape === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSoundscape(s.id)}
                        className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer select-none ${
                          isSelected
                            ? isLight
                              ? "bg-[#FFF1EC] text-[#C96F55] border-2 border-[#C96F55] shadow-xs font-bold scale-[1.02]"
                              : "bg-indigo-600/30 text-indigo-200 border-2 border-indigo-500 shadow-md shadow-indigo-500/20 font-bold scale-[1.02]"
                            : isLight
                            ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] text-[#1D1D1B] border border-[#E3E0D8] hover:border-[#C96F55]/40"
                            : "bg-[#0C101E]/80 hover:bg-[#151B2E] text-slate-300 border border-white/10 hover:border-white/20"
                        }`}
                        title={`${s.label} (${s.desc})`}
                      >
                        <span className={isSelected ? (isLight ? "text-[#C96F55]" : "text-indigo-400") : (isLight ? "text-[#77736B]" : "text-slate-400")}>
                          {s.icon}
                        </span>
                        <span>{s.label}</span>
                        {isSelected && s.id !== "silent" && (
                          isPaused ? (
                            <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 ml-0.5">
                              PAUSED
                            </span>
                          ) : focusModeActive && currentMode === "work" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C96F55] ml-0.5" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Inline Volume control when audio is selected */}
                <div className="flex items-center justify-center gap-3 mt-3 w-full max-w-sm px-3 py-1.5 rounded-xl">
                  <Volume2 size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-[#E3E0D8] dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C96F55]"
                    title={`Volume: ${Math.round(soundVolume * 100)}%`}
                  />
                  <span className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} w-8 text-right`}>
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Fullscreen Action Controls */}
            <div className="max-w-2xl mx-auto w-full space-y-3 z-10 pb-2">
              
              {/* Primary Session Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center items-center">
                {focusModeActive ? (
                  <button
                    onClick={() => {
                      pauseSoundscape();
                      onPauseFocus ? onPauseFocus() : onStopFocus();
                    }}
                    className="py-3 px-8 bg-[#C96F55] hover:bg-[#B85F48] text-white rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Pause size={14} fill="currentColor" />
                    <span>Pause Session</span>
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">Space</kbd>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (selectedSoundscape !== "silent") {
                        setSoundscape(selectedSoundscape, soundVolume);
                      }
                      onStartFocus();
                    }}
                    className="py-3 px-8 bg-[#C96F55] hover:bg-[#B85F48] text-white rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>{isPaused ? "Resume Session" : "Start Session"}</span>
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">Space</kbd>
                  </button>
                )}

                <button
                  onClick={() => {
                    pauseSoundscape();
                    onResetFocus ? onResetFocus() : onStopFocus();
                    const targetMins = currentMode === "work" ? workDuration : currentMode === "break" ? shortBreakDuration : longBreakDuration;
                    onDurationChange(targetMins);
                  }}
                  className={`py-3 px-5 ${
                    isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] hover:bg-[#161D30] border-white/10 text-slate-300"
                  } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                  title="Reset timer to beginning of stage"
                >
                  <RotateCcw size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => {
                    pauseSoundscape();
                    handleSkipToNext();
                  }}
                  className={`py-3 px-5 ${
                    isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] hover:bg-[#161D30] border-white/10 text-slate-300"
                  } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                  title="Skip to next Pomodoro stage"
                >
                  <SkipForward size={13} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                  <span>Skip to {currentMode === "work" ? "Break" : "Study"}</span>
                </button>
              </div>

              {/* Keyboard Shortcuts Hint Bar */}
              <div className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-500"} flex items-center justify-center gap-4 pt-1`}>
                <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">Space</kbd> Play / Pause</span>
                <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">F</kbd> Toggle Full Screen</span>
                <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">Esc</kbd> Exit Full Screen</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Completion Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showCompletionModal && (
            <div
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] h-[100dvh] bg-black/60 backdrop-blur-md z-[100000] flex items-center justify-center p-4"
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000 }}
            >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full ${
                isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0E1322] border-indigo-500/30 text-white"
              } border rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-2xl`}
            >
              <div className={`w-14 h-14 rounded-2xl ${
                isLight ? "bg-[#FFF1EC] border border-[#E8D7C9]" : "bg-indigo-500/10 border border-indigo-500/20"
              } flex items-center justify-center mx-auto mb-4`}>
                <Sparkles size={26} className="text-[#C96F55] animate-bounce" />
              </div>

              <h3 className={`text-xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                {completedMode === "work" ? "Pomodoro Complete! 🍅" : "Break Complete! ⚡"}
              </h3>
              <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} font-mono tracking-tight mt-1`}>
                {completedMode === "work" 
                  ? "Great job staying focused and undistracted." 
                  : "You're rested and ready for your next study block."}
              </p>
              
              <div className={`my-5 p-4 ${
                isLight ? "bg-[#F7F6F2] border border-[#E3E0D8]" : "bg-indigo-950/30 border border-indigo-900/40"
              } rounded-2xl`}>
                <div className="flex justify-between text-left items-center">
                  <div>
                    <h5 className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-indigo-400"} uppercase tracking-wider font-extrabold`}>Cycle Milestone</h5>
                    <p className={`font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} text-md mt-0.5`}>
                      {completedMode === "work" ? "50m Focus Block Conquered! 🎯" : "Recovery Interval Finished! ⚡"}
                    </p>
                  </div>
                  <span className="text-2xl">{completedMode === "work" ? "🏆" : "☕"}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    onStartFocus();
                  }}
                  className="flex-1 py-3 bg-[#C96F55] hover:bg-[#B85F48] text-white font-mono font-bold text-xs uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Start Next Block</span>
                </button>

                <button
                  onClick={() => setShowCompletionModal(false)}
                  className={`py-3 px-4 ${
                    isLight ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] text-[#1D1D1B] border-[#E3E0D8]" : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                  } border font-mono font-bold text-xs uppercase rounded-xl transition cursor-pointer`}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Header Section */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b ${
        isLight ? "border-[#E3E0D8]" : "border-white/5"
      } pb-5 shrink-0 select-none`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${
              isLight ? "bg-[#FFF1EC] border border-[#E8D7C9] text-[#C96F55]" : "bg-indigo-950/60 border border-indigo-900/50 text-indigo-400"
            } font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full`}>
              POMODORO STUDY METHOD
            </span>
            <span className={`text-[10px] font-mono ${
              isLight ? "bg-[#EAF3EC] border border-[#CDE3D2] text-[#66856D]" : "bg-emerald-950/40 border border-emerald-900/40 text-emerald-400"
            } font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
              <span>🍅</span>
              <span>{pomodoroCount} completed today</span>
            </span>
          </div>
          <h1 className={`text-2xl md:text-3xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"} mt-2`}>Study & Break Cycles</h1>
          <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} max-w-xl mt-0.5`}>
            Structured intervals for high retention. Pause anytime and switch between study and recovery periods.
          </p>
        </div>

        {/* Full Screen Mode & Lockdown Triggers */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleEnterFullscreen}
            className="py-2.5 px-4 bg-[#C96F55] hover:bg-[#B85F48] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wide transition flex items-center gap-2 cursor-pointer select-none shadow-md"
            title="Enter distraction-free Full Screen Focus Mode (F)"
          >
            <Maximize2 size={13} />
            <span>Full Screen Mode</span>
            <kbd className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">F</kbd>
          </button>

          <button
            onClick={() => setIsLocked(true)}
            className={`py-2.5 px-3.5 ${
              isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
            } border rounded-xl text-xs font-mono font-bold uppercase tracking-wide transition flex items-center gap-1.5 cursor-pointer select-none shadow-2xs`}
            title="Lock screen companion"
          >
            <Lock size={13} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
            <span className="hidden sm:inline">Lockdown</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: THE CENTRAL VISUAL POMODORO TIMER DISPLAY */}
        <div className={`lg:col-span-7 xl:col-span-8 ${
          isLight 
            ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs text-[#1D1D1B]" 
            : `bg-gradient-to-b ${theme.gradientBg} bg-[#0A0D18] border border-white/10 shadow-2xl`
        } rounded-3xl p-6 md:p-8 flex flex-col items-center justify-between min-h-[490px] relative overflow-hidden`}>
          
          {/* 2-Hour Study Cycle Tracker Bar */}
          <div className={`w-full flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isLight ? "bg-[#F7F6F2] border border-[#E3E0D8]" : "bg-white/5 border border-white/5"
          } p-3 rounded-2xl select-none`}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase`}>2-Hour Cycle:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2].map((step) => {
                  const isDone = step < currentCycleStep;
                  const isCurrent = step === currentCycleStep;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold transition ${
                        isDone
                          ? isLight ? "bg-[#EAF3EC] text-[#66856D] border border-[#CDE3D2]" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isCurrent
                          ? isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9] shadow-xs" : "bg-indigo-500/30 text-indigo-200 border border-indigo-500/50 shadow-sm"
                          : isLight ? "bg-[#FFFFFF] text-[#77736B] border border-[#E3E0D8]" : "bg-black/30 text-slate-600 border border-white/5"
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={10} className={isLight ? "text-[#66856D]" : "text-emerald-400"} /> : <span>🍅</span>}
                      <span>Session {step}/2</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} hidden sm:flex items-center gap-1.5`}>
                <span>Next reward:</span>
                <span className={`${isLight ? "text-[#587B8C]" : "text-cyan-400"} font-bold`}>{longBreakDuration}m Long Break</span>
              </div>

              <button
                onClick={handleEnterFullscreen}
                className={`py-1 px-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isLight
                    ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]"
                    : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                }`}
                title="Enter Full Screen Focus View (F)"
              >
                <Maximize2 size={11} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                <span>Full Screen</span>
              </button>
            </div>
          </div>

          {/* Centered Top Mode Switcher segmented tabs */}
          <div className={`flex max-w-full overflow-x-auto no-scrollbar border ${
            isLight ? "border-[#E3E0D8] bg-[#F0EEE8]" : "border-white/10 bg-[#07090F]"
          } p-1.5 rounded-2xl w-full sm:w-fit my-4 select-none`}>
            <button
              onClick={() => handleModeSwitch("work")}
              className={`px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer ${
                currentMode === "work"
                  ? isLight ? "bg-[#C96F55] text-white shadow-xs font-extrabold" : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold"
                  : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Brain size={13} />
              <span>Study ({workDuration}m)</span>
            </button>

            <button
              onClick={() => handleModeSwitch("break")}
              className={`px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer ${
                currentMode === "break"
                  ? isLight ? "bg-[#66856D] text-white shadow-xs font-extrabold" : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-extrabold"
                  : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Coffee size={13} />
              <span>Short Break ({shortBreakDuration}m)</span>
            </button>

            <button
              onClick={() => handleModeSwitch("long")}
              className={`px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer ${
                currentMode === "long"
                  ? isLight ? "bg-[#587B8C] text-white shadow-xs font-extrabold" : "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-extrabold"
                  : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Trees size={13} />
              <span>Long Break ({longBreakDuration}m)</span>
            </button>
          </div>

          {/* Timer Display Showcase without circular frame */}
          <div className="flex flex-col items-center justify-center shrink-0 my-4 sm:my-6 select-none text-center">
            <span className={`text-[10px] font-mono font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full border mb-3 ${theme.badgeBg}`}>
              {theme.label}
            </span>

            <div className="my-1 scale-95 sm:scale-105 transform origin-center">
              <FlipClockTimer 
                timeRemaining={focusTimeRemaining} 
                size="lg" 
                themeMode={themeMode} 
                isPaused={isPaused} 
              />
            </div>

            {/* Subtle linear progress bar when focus session is running */}
            {focusModeActive && (
              <div className="w-56 sm:w-72 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentMode === "work" 
                      ? isLight ? "bg-[#C96F55]" : "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" 
                      : currentMode === "break" 
                      ? isLight ? "bg-[#66856D]" : "bg-emerald-500" 
                      : isLight ? "bg-[#587B8C]" : "bg-cyan-500"
                  }`}
                  style={{ width: `${Math.round((1 - progressRatio) * 100)}%` }}
                />
              </div>
            )}

            {isPaused ? (
              <span className={`text-[10px] font-mono font-extrabold uppercase tracking-widest ${
                isLight ? "text-[#B85C5C] bg-[#FFF1EC] border-[#E8D7C9]" : "text-amber-400 bg-amber-950/40 border-amber-500/30"
              } border px-3 py-0.5 rounded-full mt-3 animate-pulse`}>
                ⏸ PAUSED
              </span>
            ) : (
              <span className={`text-[10px] font-mono tracking-widest ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase font-black mt-3`}>
                {focusModeActive ? "ACTIVE COUNTDOWN" : "READY TO LAUNCH"}
              </span>
            )}
          </div>

          {/* Bottom Actions Row: Play, Pause, Reset, Skip */}
          <div className="w-full max-w-lg flex flex-col items-center gap-3 shrink-0 mt-4 select-none">
            <div className="flex flex-wrap gap-3 justify-center items-center w-full">
              
              {/* Play / Pause Toggle Button */}
              {focusModeActive ? (
                <button
                  onClick={() => {
                    pauseSoundscape();
                    onPauseFocus ? onPauseFocus() : onStopFocus();
                  }}
                  className={`py-3 px-8 ${
                    isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                >
                  <Pause size={14} fill="currentColor" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (selectedSoundscape !== "silent") {
                      setSoundscape(selectedSoundscape, soundVolume);
                    }
                    onStartFocus();
                  }}
                  className={`py-3 px-8 ${
                    isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500"
                  } text-white rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-md`}
                >
                  <Play size={14} fill="currentColor" />
                  <span>{isPaused ? "Resume" : "Start Study"}</span>
                </button>
              )}

              {/* Reset timer button */}
              <button
                onClick={() => {
                  pauseSoundscape();
                  onResetFocus ? onResetFocus() : onStopFocus();
                  const targetMins = currentMode === "work" ? workDuration : currentMode === "break" ? shortBreakDuration : longBreakDuration;
                  onDurationChange(targetMins);
                }}
                className={`py-3 px-5 ${
                  isLight ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] hover:bg-[#161D30] border-white/10 text-slate-300"
                } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                title="Reset to full interval"
              >
                <RotateCcw size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                <span>Reset</span>
              </button>

              {/* Skip to Next Stage button */}
              <button
                onClick={handleSkipToNext}
                className={`py-3 px-5 ${
                  isLight ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] hover:bg-[#161D30] border-white/10 text-slate-300"
                } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                title="Advance to next step in Pomodoro routine"
              >
                <SkipForward size={13} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                <span>Skip to {currentMode === "work" ? "Break" : "Study"}</span>
              </button>

              {/* Quick Ambient Soundscape Toggle Pill */}
              <button
                onClick={handleQuickToggleSound}
                className={`py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                  selectedSoundscape !== "silent"
                    ? isLight ? "bg-[#FFF1EC] text-[#C96F55] border-[#E8D7C9]" : "bg-[#C96F55]/20 text-[#C96F55] border-[#C96F55]/40"
                    : isLight ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] border-[#E3E0D8] text-[#77736B]" : "bg-[#111626] hover:bg-[#161D30] border-white/10 text-slate-400 hover:text-slate-200"
                }`}
                title={selectedSoundscape !== "silent" ? `Active sound: ${selectedSoundscape} - Click for Quiet` : "Activate ambient soundscape"}
              >
                {selectedSoundscape === "silent" ? (
                  <VolumeX size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                ) : (
                  <Volume2 size={13} className="text-[#C96F55] animate-pulse" />
                )}
                <span>
                  {selectedSoundscape === "silent" 
                    ? "Quiet" 
                    : selectedSoundscape === "white_noise" 
                      ? "White Noise" 
                      : selectedSoundscape === "gentle_rain" 
                        ? "Rain" 
                        : selectedSoundscape === "gamma_40hz" 
                          ? "40Hz Gamma" 
                          : "Hearth"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TIMER SETTINGS & EDITABLE INTERVAL TIMERS */}
        <div className={`lg:col-span-5 xl:col-span-4 ${
          isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs text-[#1D1D1B]" : "bg-[#0E1322]/80 border border-white/10 text-white"
        } rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden`}>
          
          <div className="space-y-4">
            <div>
              <span className={`text-[9px] font-mono uppercase tracking-widest ${isLight ? "text-[#77736B]" : "text-slate-400"} font-extrabold`}>
                CUSTOMIZE INTERVALS
              </span>
              <h2 className={`text-base font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} tracking-wide mt-0.5`}>Pomodoro Durations</h2>
              <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-slate-400"} mt-1`}>
                Fine-tune your study and recovery blocks. Changes apply directly to your timer.
              </p>
            </div>

            {/* SLIDERS SPACE */}
            <div className="space-y-5 pt-2">
              
              {/* Slider 1: STUDY (WORK) */}
              <div className={`space-y-2 ${isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#12192B]/60 border-white/5"} border p-3.5 rounded-2xl`}>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className={`${isLight ? "text-[#1D1D1B]" : "text-slate-300"} uppercase font-black text-[10px] tracking-wider flex items-center gap-1.5`}>
                    <span className="w-2 h-2 rounded-full bg-[#C96F55]" />
                    <span>Study Session</span>
                  </span>
                  <span className={`font-extrabold uppercase text-[11px] ${
                    isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" : "bg-indigo-950/60 border-indigo-800/40 text-white"
                  } border px-2 py-0.5 rounded-md`}>
                    {workDuration} min
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSlideChange("work", Math.max(5, workDuration - 5))}
                    className={`w-8 h-8 rounded-lg ${
                      isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-400"
                    } border flex items-center justify-center transition cursor-pointer`}
                  >
                    <Minus size={12} />
                  </button>
                  
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={workDuration}
                    onChange={(e) => handleSlideChange("work", Number(e.target.value))}
                    className="flex-1 h-1.5 bg-[#E3E0D8] rounded-lg appearance-none cursor-pointer accent-[#C96F55]"
                  />
                  
                  <button
                    onClick={() => handleSlideChange("work", Math.min(120, workDuration + 5))}
                    className={`w-8 h-8 rounded-lg ${
                      isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-400"
                    } border flex items-center justify-center transition cursor-pointer`}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Slider 2: SHORT BREAK */}
              <div className={`space-y-2 ${isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#12192B]/60 border-white/5"} border p-3.5 rounded-2xl`}>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className={`${isLight ? "text-[#1D1D1B]" : "text-slate-300"} uppercase font-black text-[10px] tracking-wider flex items-center gap-1.5`}>
                    <span className="w-2 h-2 rounded-full bg-[#66856D]" />
                    <span>Short Break</span>
                  </span>
                  <span className={`font-extrabold uppercase text-[11px] ${
                    isLight ? "bg-[#EAF3EC] border-[#CDE3D2] text-[#66856D]" : "bg-emerald-950/60 border-emerald-800/40 text-white"
                  } border px-2 py-0.5 rounded-md`}>
                    {shortBreakDuration} min
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSlideChange("break", Math.max(1, shortBreakDuration - 1))}
                    className={`w-8 h-8 rounded-lg ${
                      isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-400"
                    } border flex items-center justify-center transition cursor-pointer`}
                  >
                    <Minus size={12} />
                  </button>
                  
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={shortBreakDuration}
                    onChange={(e) => handleSlideChange("break", Number(e.target.value))}
                    className="flex-1 h-1.5 bg-[#E3E0D8] rounded-lg appearance-none cursor-pointer accent-[#66856D]"
                  />
                  
                  <button
                    onClick={() => handleSlideChange("break", Math.min(30, shortBreakDuration + 1))}
                    className={`w-8 h-8 rounded-lg ${
                      isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-400"
                    } border flex items-center justify-center transition cursor-pointer`}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Slider 3: LONG BREAK */}
              <div className={`space-y-2 ${isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#12192B]/60 border-white/5"} border p-3.5 rounded-2xl`}>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className={`${isLight ? "text-[#1D1D1B]" : "text-slate-300"} uppercase font-black text-[10px] tracking-wider flex items-center gap-1.5`}>
                    <span className="w-2 h-2 rounded-full bg-[#587B8C]" />
                    <span>Long Break</span>
                  </span>
                  <span className={`font-extrabold uppercase text-[11px] ${
                    isLight ? "bg-[#E8F1F5] border-[#CADEE8] text-[#587B8C]" : "bg-cyan-950/60 border-cyan-800/40 text-white"
                  } border px-2 py-0.5 rounded-md`}>
                    {longBreakDuration} min
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSlideChange("long", Math.max(5, longBreakDuration - 5))}
                    className={`w-8 h-8 rounded-lg ${
                      isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-400"
                    } border flex items-center justify-center transition cursor-pointer`}
                  >
                    <Minus size={12} />
                  </button>
                  
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={longBreakDuration}
                    onChange={(e) => handleSlideChange("long", Number(e.target.value))}
                    className="flex-1 h-1.5 bg-[#E3E0D8] rounded-lg appearance-none cursor-pointer accent-[#587B8C]"
                  />
                  
                  <button
                    onClick={() => handleSlideChange("long", Math.min(60, longBreakDuration + 5))}
                    className={`w-8 h-8 rounded-lg ${
                      isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-400"
                    } border flex items-center justify-center transition cursor-pointer`}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* QUICK PRESETS ROW */}
          <div className={`pt-3 border-t ${isLight ? "border-[#E3E0D8]" : "border-white/5"} space-y-2.5`}>
            <span className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest font-black block`}>
              Quick Method Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 select-none">
              <button
                onClick={() => applyPreset(50, 10, 20)}
                className={`py-2 px-3 ${
                  isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" : "bg-indigo-600/20 border-indigo-500/40 text-indigo-200"
                } border rounded-xl text-[10px] font-mono font-bold transition flex items-center justify-between cursor-pointer`}
              >
                <span>🧠 Standard · 50/10</span>
                <span className={`text-[8px] ${isLight ? "bg-[#FFFFFF] text-[#C96F55]" : "bg-indigo-500/30 text-indigo-200"} py-0.5 px-1 rounded font-mono`}>Default</span>
              </button>

              <button
                onClick={() => applyPreset(25, 5, 15)}
                className={`py-2 px-3 ${
                  isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-300"
                } border rounded-xl text-[10px] font-mono font-bold transition flex items-center justify-between cursor-pointer`}
              >
                <span>🍅 Classic · 25/5</span>
                <span className={`text-[8px] ${isLight ? "bg-[#FFFFFF] text-[#77736B]" : "bg-white/5 text-slate-400"} py-0.5 px-1 rounded font-mono`}>15m Long</span>
              </button>

              <button
                onClick={() => applyPreset(15, 3, 10)}
                className={`py-2 px-3 ${
                  isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-300"
                } border rounded-xl text-[10px] font-mono font-bold transition flex items-center justify-between cursor-pointer`}
              >
                <span>⚡ Sprint · 15/3</span>
                <span className={`text-[8px] ${isLight ? "bg-[#FFFFFF] text-[#77736B]" : "bg-white/5 text-slate-400"} py-0.5 px-1 rounded font-mono`}>10m Long</span>
              </button>

              <button
                onClick={() => applyPreset(90, 20, 30)}
                className={`py-2 px-3 ${
                  isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#111626] border-white/10 text-slate-300"
                } border rounded-xl text-[10px] font-mono font-bold transition flex items-center justify-between cursor-pointer`}
              >
                <span>🌊 Ultradian · 90/20</span>
                <span className={`text-[8px] ${isLight ? "bg-[#FFFFFF] text-[#77736B]" : "bg-white/5 text-slate-400"} py-0.5 px-1 rounded font-mono`}>30m Long</span>
              </button>
            </div>
          </div>

          {/* AMBIENT FOCUS SOUNDSCAPES CONTROLS */}
          <div className={`pt-4 border-t ${isLight ? "border-[#E3E0D8]" : "border-white/5"} space-y-3.5 ${
            isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#0A0E1A]/90 border-white/10"
          } p-4 md:p-5 rounded-2xl border`}>
            
            {/* Header with audio wave bars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-[#C96F55]">
                  <span className="w-1 h-3 bg-[#C96F55] rounded-full inline-block animate-pulse" />
                  <span className="w-1 h-5 bg-[#C96F55] rounded-full inline-block" />
                  <span className="w-1 h-2.5 bg-[#C96F55] rounded-full inline-block animate-pulse" />
                  <span className="w-1 h-4 bg-[#C96F55] rounded-full inline-block" />
                </div>
                <h3 className={`text-xs md:text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                  Ambient Focus Soundscapes
                </h3>
              </div>

              {selectedSoundscape !== "silent" ? (
                isPaused ? (
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    isLight ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-amber-950/40 text-amber-400 border border-amber-500/30"
                  } flex items-center gap-1`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Paused with timer
                  </span>
                ) : focusModeActive && currentMode === "work" ? (
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]" : "bg-[#C96F55]/20 text-[#C96F55] border border-[#C96F55]/30"
                  } flex items-center gap-1 animate-pulse`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C96F55]" />
                    Playing
                  </span>
                ) : (
                  <span className={`text-[9px] font-mono font-medium ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                    Ready on start
                  </span>
                )
              ) : (
                <span className={`text-[9px] font-mono font-medium ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Default Quiet
                </span>
              )}
            </div>

            {/* 5 Soundscape Cards Row (Matching image.png) */}
            <div className="grid grid-cols-5 gap-2">
              {[
                {
                  id: "silent" as SoundscapeType,
                  name: "Silent",
                  icon: (
                    <div className="relative inline-flex items-center justify-center">
                      <VolumeX size={18} className={selectedSoundscape === "silent" ? "text-white" : isLight ? "text-[#77736B]" : "text-slate-400"} />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                    </div>
                  )
                },
                {
                  id: "white_noise" as SoundscapeType,
                  name: "White Noise",
                  icon: <Moon size={18} className={selectedSoundscape === "white_noise" ? "text-white" : "text-sky-400"} />
                },
                {
                  id: "gentle_rain" as SoundscapeType,
                  name: "Gentle Rain",
                  icon: <CloudRain size={18} className={selectedSoundscape === "gentle_rain" ? "text-white" : "text-blue-400"} />
                },
                {
                  id: "gamma_40hz" as SoundscapeType,
                  name: "40Hz Gamma",
                  icon: <Brain size={18} className={selectedSoundscape === "gamma_40hz" ? "text-white" : "text-pink-400"} />
                },
                {
                  id: "warm_hearth" as SoundscapeType,
                  name: "Warm Hearth",
                  icon: <Flame size={18} className={selectedSoundscape === "warm_hearth" ? "text-white" : "text-amber-400"} />
                }
              ].map((item) => {
                const isActive = selectedSoundscape === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSoundscape(item.id)}
                    className={`py-3 px-1.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border select-none ${
                      isActive
                        ? "bg-[#C96F55] text-white border-[#C96F55] shadow-md -translate-y-0.5"
                        : isLight
                          ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] text-[#1D1D1B] border-[#E3E0D8]"
                          : "bg-[#0E1322] hover:bg-[#161D30] text-slate-300 border-white/5"
                    }`}
                    title={item.id === "silent" ? "Pure quiet (no ambient audio)" : `Play ${item.name}`}
                  >
                    <div className="flex items-center justify-center h-5">
                      {item.icon}
                    </div>
                    <span className={`text-[10px] leading-tight font-mono font-medium text-center truncate max-w-full ${
                      isActive ? "text-white font-bold" : isLight ? "text-[#1D1D1B]" : "text-slate-300"
                    }`}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ambience Volume Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className={`${isLight ? "text-[#77736B]" : "text-slate-400"} flex items-center gap-1`}>
                  <Headphones size={11} className={isLight ? "text-[#77736B]" : "text-slate-500"} />
                  <span>Ambience Volume</span>
                </span>
                <span className={`${isLight ? "text-[#C96F55]" : "text-amber-300"} font-bold font-mono`}>
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={soundVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#E3E0D8] rounded-lg appearance-none cursor-pointer accent-[#C96F55]"
              />
            </div>

            {/* Auto-play Soundscape on Study Toggle */}
            <label className="flex items-center justify-between pt-1 cursor-pointer select-none">
              <span className={`text-[10px] font-mono ${isLight ? "text-[#1D1D1B]" : "text-slate-300"} flex items-center gap-1.5`}>
                <span>Play automatically during study</span>
              </span>
              <input
                type="checkbox"
                checked={autoSoundOnStudy}
                onChange={(e) => setAutoSoundOnStudy(e.target.checked)}
                className="w-4 h-4 rounded bg-[#FFFFFF] border-[#E3E0D8] text-[#C96F55] focus:ring-0 cursor-pointer accent-[#C96F55]"
              />
            </label>
          </div>

        </div>

      </div>

    </div>
  );
}

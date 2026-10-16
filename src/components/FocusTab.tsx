import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Award, 
  Lock, 
  Unlock, 
  Minus, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Volume2, 
  VolumeX, 
  Headphones,
  CloudRain,
  Maximize2,
  Minimize2,
  Sun,
  Timer,
  Clock,
  BookOpen,
  Edit3
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

export type TimerModeType = "p2" | "p4" | "p6" | "math" | "custom";

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
  pomodoroCount = 0,
  themeMode = "dark",
  onFullScreenChange
}: FocusTabProps) {

  const isLight = themeMode === "light";

  // Determine current active mode based on focusMinutesSelected:
  // P2: exactly 45 min
  // P4: 1 hour 15 min = 75 min
  // P6: 1 hour = 60 min
  // Math: 2 hours = 120 min
  // Otherwise: custom
  const determineMode = (mins: number): TimerModeType => {
    if (mins === 45) return "p2";
    if (mins === 75) return "p4";
    if (mins === 60) return "p6";
    if (mins === 120) return "math";
    return "custom";
  };

  const [activeMode, setActiveMode] = useState<TimerModeType>(() => determineMode(focusMinutesSelected));
  const [isLocked, setIsLocked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Custom Time Input State (Hours & Minutes)
  const [customHours, setCustomHours] = useState<number>(() => Math.floor(focusMinutesSelected / 60));
  const [customMinutes, setCustomMinutes] = useState<number>(() => focusMinutesSelected % 60);
  const [isCustomEditing, setIsCustomEditing] = useState(false);

  // Synchronize custom inputs whenever focusMinutesSelected changes externally
  useEffect(() => {
    setActiveMode(determineMode(focusMinutesSelected));
    setCustomHours(Math.floor(focusMinutesSelected / 60));
    setCustomMinutes(focusMinutesSelected % 60);
  }, [focusMinutesSelected]);

  // Ambient Soundscapes State - Default is "silent" (Quiet)
  // Only 2 sounds exist: "silent" (mute) and "white_noise" (gentle rain)
  const [selectedSoundscape, setSelectedSoundscape] = useState<SoundscapeType>(() => {
    const saved = localStorage.getItem("ENGEZ_SELECTED_SOUNDSCAPE");
    if (saved === "white_noise" || saved === "silent") {
      return saved as SoundscapeType;
    }
    return "silent";
  });

  const [soundVolume, setSoundVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem("ENGEZ_SOUND_VOLUME");
    return saved ? parseFloat(saved) : 0.6;
  });

  const [autoSoundOnStudy, setAutoSoundOnStudy] = useState<boolean>(() => {
    const saved = localStorage.getItem("ENGEZ_AUTO_SOUND_STUDY");
    return saved !== null ? saved === "true" : false;
  });

  // Custom accomplishment modal (silent visual celebration upon timer zero)
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [prevFocusActive, setPrevFocusActive] = useState(focusModeActive);

  // Save ambient sound preferences
  useEffect(() => {
    localStorage.setItem("ENGEZ_SELECTED_SOUNDSCAPE", selectedSoundscape);
  }, [selectedSoundscape]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_SOUND_VOLUME", soundVolume.toString());
  }, [soundVolume]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_AUTO_SOUND_STUDY", autoSoundOnStudy.toString());
  }, [autoSoundOnStudy]);

  // Handle ambient sound lifecycle: pause sound when timer is paused, resume when active
  useEffect(() => {
    if (selectedSoundscape === "silent") {
      stopAllSoundscapes();
      return;
    }

    if (isPaused) {
      pauseSoundscape();
    } else if (focusModeActive) {
      setSoundscape(selectedSoundscape, soundVolume);
    }
  }, [focusModeActive, isPaused, selectedSoundscape, soundVolume]);

  // Stop sounds on unmount
  useEffect(() => {
    return () => {
      stopAllSoundscapes();
    };
  }, []);

  // Handle user selecting a soundscape
  const handleSelectSoundscape = (type: SoundscapeType) => {
    if (type === "silent") {
      setSelectedSoundscape("silent");
      stopAllSoundscapes();
      return;
    }

    if (selectedSoundscape === type && !isPaused) {
      // Toggle to silent if clicking active
      setSelectedSoundscape("silent");
      stopAllSoundscapes();
    } else {
      setSelectedSoundscape(type);
      if (isPaused) {
        pauseSoundscape();
      } else {
        setSoundscape(type, soundVolume);
      }
    }
  };

  // Quick toggle in fullscreen
  const handleQuickToggleSound = () => {
    if (selectedSoundscape !== "silent") {
      setSelectedSoundscape("silent");
      stopAllSoundscapes();
    } else {
      setSelectedSoundscape("white_noise");
      if (isPaused) {
        pauseSoundscape();
      } else {
        setSoundscape("white_noise", soundVolume);
      }
    }
  };

  // Full Screen Mode Handlers
  const handleEnterFullscreen = async () => {
    setIsFullScreen(true);
    onFullScreenChange?.(true);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request not allowed or supported:", e);
    }
  };

  const handleExitFullscreen = () => {
    setIsFullScreen(false);
    onFullScreenChange?.(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn("Exit fullscreen error:", e);
    }
  };

  // Synchronize state with native browser fullscreen changes (e.g. user pressed Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
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
      document.body.style.overflow = "hidden";
    } else {
      onFullScreenChange?.(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullScreen, isLocked, onFullScreenChange]);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "Escape" && (isFullScreen || isLocked)) {
        handleExitFullscreen();
      } else if (e.key === "f" || e.key === "F") {
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

  // Listen for timer completion
  useEffect(() => {
    if (prevFocusActive && !focusModeActive && !isPaused) {
      setShowCompletionModal(true);
    }
    setPrevFocusActive(focusModeActive);
  }, [focusModeActive, isPaused]);

  // Handle switching to one of the 3 exam modes or custom
  const handleSelectMode = (mode: TimerModeType) => {
    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }
    setActiveMode(mode);

    if (mode === "p2") {
      // P2: exactly 45 min
      onDurationChange(45);
      setCustomHours(0);
      setCustomMinutes(45);
      setIsCustomEditing(false);
    } else if (mode === "p4") {
      // P4: 1 hour and 15 min = 75 min
      onDurationChange(75);
      setCustomHours(1);
      setCustomMinutes(15);
      setIsCustomEditing(false);
    } else if (mode === "p6") {
      // P6: exactly 1 hour = 60 min
      onDurationChange(60);
      setCustomHours(1);
      setCustomMinutes(0);
      setIsCustomEditing(false);
    } else if (mode === "math") {
      // Math: exactly 2 hours = 120 min
      onDurationChange(120);
      setCustomHours(2);
      setCustomMinutes(0);
      setIsCustomEditing(false);
    } else if (mode === "custom") {
      setIsCustomEditing(true);
    }
    onResetFocus?.();
  };

  // Apply custom typed hours and minutes
  const handleApplyCustomTime = (h: number, m: number) => {
    const validH = Math.max(0, Math.min(23, isNaN(h) ? 0 : h));
    const validM = Math.max(0, Math.min(59, isNaN(m) ? 0 : m));
    const totalMins = validH * 60 + validM;
    
    // Minimum 1 minute
    const finalMins = Math.max(1, totalMins);
    
    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }
    
    setCustomHours(Math.floor(finalMins / 60));
    setCustomMinutes(finalMins % 60);
    onDurationChange(finalMins);
    setActiveMode(determineMode(finalMins));
    onResetFocus?.();
  };

  // Parse remaining seconds safely for visual progress bar
  let remainingSeconds = 0;
  try {
    const parts = focusTimeRemaining.split(":");
    if (parts.length === 3) {
      remainingSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    } else if (parts.length === 2) {
      remainingSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
  } catch (e) {
    remainingSeconds = focusMinutesSelected * 60;
  }
  
  const totalSeconds = focusMinutesSelected * 60;
  const progressRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 1;

  // Format mode display label
  const getModeLabel = () => {
    if (activeMode === "p2") return "P2 (45 min)";
    if (activeMode === "p4") return "P4 (1h 15m)";
    if (activeMode === "p6") return "P6 (1 hour)";
    if (activeMode === "math") return "Math (2 hours)";
    return `Custom (${focusMinutesSelected}m)`;
  };

  return (
    <>
      {/* =========================================================================
          FULL SCREEN IMMERSIVE TIMER OVERLAY
          ========================================================================= */}
      {typeof document !== "undefined" &&
        createPortal(
          (isFullScreen || isLocked) && (
            <div
              className={`fixed inset-0 z-9999 flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none transition-colors duration-500 overflow-y-auto ${
                isLight ? "bg-[#F7F5F0] text-[#1D1D1B]" : "bg-[#05070D] text-white"
              }`}
            >
              {/* Fullscreen Header */}
              <div className="w-full flex items-center justify-between gap-3">
                {/* Left: Mode Title */}
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLight ? "bg-[#C96F55]" : "bg-indigo-500"} animate-pulse`} />
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? "text-[#C96F55]" : "text-indigo-400"}`}>
                    {getModeLabel()}
                  </span>

                  {/* Mobile-only exit button */}
                  <button
                    onClick={handleExitFullscreen}
                    className={`sm:hidden p-2 ${
                      isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E8D7C9] text-[#1D1D1B]" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                    } border rounded-xl transition cursor-pointer`}
                    title="Exit Full Screen (Esc)"
                  >
                    <Minimize2 size={16} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                  </button>
                </div>

                {/* Center: Mode Switcher Pills in Full Screen */}
                <div className={`hidden md:flex items-center border ${
                  isLight ? "border-[#E8D7C9] bg-[#F0EEE8]" : "border-white/10 bg-[#0C101E]"
                } p-1 rounded-2xl gap-1`}>
                  <button
                    onClick={() => handleSelectMode("p2")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                      activeMode === "p2"
                        ? isLight ? "bg-[#C96F55] text-white shadow-xs font-extrabold" : "bg-indigo-600 text-white shadow-md font-extrabold"
                        : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    P2 · 45m
                  </button>

                  <button
                    onClick={() => handleSelectMode("p4")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                      activeMode === "p4"
                        ? isLight ? "bg-[#C96F55] text-white shadow-xs font-extrabold" : "bg-indigo-600 text-white shadow-md font-extrabold"
                        : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    P4 · 1h 15m
                  </button>

                  <button
                    onClick={() => handleSelectMode("p6")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                      activeMode === "p6"
                        ? isLight ? "bg-[#C96F55] text-white shadow-xs font-extrabold" : "bg-indigo-600 text-white shadow-md font-extrabold"
                        : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    P6 · 1h
                  </button>

                  <button
                    onClick={() => handleSelectMode("math")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                      activeMode === "math"
                        ? isLight ? "bg-[#C96F55] text-white shadow-xs font-extrabold" : "bg-indigo-600 text-white shadow-md font-extrabold"
                        : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Math · 2h
                  </button>

                  <button
                    onClick={() => handleSelectMode("custom")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
                      activeMode === "custom"
                        ? isLight ? "bg-[#C96F55] text-white shadow-xs font-extrabold" : "bg-indigo-600 text-white shadow-md font-extrabold"
                        : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {/* Right: Sound Quick Toggle & Exit Button */}
                <div className="hidden sm:flex items-center gap-2.5">
                  <button
                    onClick={handleQuickToggleSound}
                    className={`py-2 px-3 ${
                      isLight 
                        ? selectedSoundscape !== "silent" ? "bg-[#FFF1EC] border-[#C96F55] text-[#C96F55]" : "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E8D7C9] text-[#1D1D1B]" 
                        : selectedSoundscape !== "silent" ? "bg-indigo-600 hover:bg-indigo-500 border-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                    } border rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer`}
                    title={selectedSoundscape !== "silent" ? "Sound: White Noise (Gentle Rain)" : "Quiet (Click to play White Noise)"}
                  >
                    {selectedSoundscape === "silent" ? (
                      <VolumeX size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                    ) : (
                      <Volume2 size={13} className={isLight ? "text-[#C96F55] animate-pulse" : "text-white animate-pulse"} />
                    )}
                    <span className="text-[11px]">
                      {selectedSoundscape === "silent" ? "Quiet" : "White Noise"}
                    </span>
                  </button>

                  <button
                    onClick={handleExitFullscreen}
                    className={`py-2 px-3.5 ${
                      isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E8D7C9] text-[#1D1D1B]" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
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

              {/* Central Chrono Display */}
              <div className="my-auto py-6 flex flex-col items-center justify-center">
                <div className="transform scale-110 sm:scale-125 md:scale-135 lg:scale-150 transition-transform">
                  <FlipClockTimer 
                    timeRemaining={focusTimeRemaining} 
                    size="xl" 
                    themeMode={themeMode} 
                    isPaused={isPaused} 
                  />
                </div>

                {/* Linear progress bar */}
                {focusModeActive && (
                  <div className="w-64 sm:w-80 md:w-96 lg:w-[32rem] h-2 bg-black/10 dark:bg-white/10 rounded-full mt-6 sm:mt-8 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLight ? "bg-[#C96F55]" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                      }`}
                      style={{ width: `${Math.round((1 - progressRatio) * 100)}%` }}
                    />
                  </div>
                )}
                
                {isPaused && (
                  <span className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-widest text-[#B85C5C] bg-[#FFF1EC] border border-[#E8D7C9] px-3.5 py-1 rounded-full mt-5 animate-pulse">
                    ⏸ PAUSED
                  </span>
                )}

                {!isPaused && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 mt-5">
                    <span className={`text-[10px] sm:text-xs font-mono tracking-widest ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase font-black`}>
                      {focusModeActive ? `ACTIVE COUNTDOWN • ${getModeLabel()}` : "READY TO LAUNCH"}
                    </span>
                    {focusModeActive && (
                      <span className={`text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                        isLight ? "bg-black/5 text-[#77736B]" : "bg-white/10 text-slate-300"
                      }`} title="Screen timeout prevented while timer is on">
                        <Sun size={10} className="text-amber-400" />
                        <span>Screen Kept On</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Fullscreen Action Controls */}
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  {focusModeActive ? (
                    <button
                      onClick={() => {
                        pauseSoundscape();
                        onPauseFocus ? onPauseFocus() : onStopFocus();
                      }}
                      className={`py-3 px-8 ${
                        isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-md`}
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
                      className={`py-3 px-8 ${
                        isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                      } text-white rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-lg`}
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
                      onDurationChange(focusMinutesSelected);
                    }}
                    className={`py-3 px-5 ${
                      isLight ? "bg-[#FFFFFF] hover:bg-[#F0EEE8] border-[#E8D7C9] text-[#1D1D1B]" : "bg-white/10 hover:bg-white/15 border-white/10 text-slate-300"
                    } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                    title="Reset to full interval"
                  >
                    <RotateCcw size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Keyboard hints */}
                <div className={`hidden sm:flex items-center gap-4 text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-500"}`}>
                  <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">Space</kbd> Start/Pause</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">Esc</kbd> Exit Full Screen</span>
                </div>
              </div>
            </div>
          ),
          document.body
        )}

      {/* =========================================================================
          MAIN PAGE VIEW
          ========================================================================= */}
      <div className="space-y-6">
        {/* Top Header Bar */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b ${
          isLight ? "border-[#E8D7C9]" : "border-white/10"
        } pb-6`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono uppercase tracking-widest ${
                isLight ? "bg-[#FFF1EC] border border-[#E8D7C9] text-[#C96F55]" : "bg-indigo-950/60 border border-indigo-900/50 text-indigo-400"
              } font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                <Timer size={10} />
                <span>EXAM & STUDY TIMER</span>
              </span>
              <span className={`text-[9px] font-mono ${
                isLight ? "bg-[#EAF3EC] border border-[#CDE3D2] text-[#66856D]" : "bg-emerald-950/40 border border-emerald-900/40 text-emerald-400"
              } font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                <span>🍅</span>
                <span>{pomodoroCount} sessions completed</span>
              </span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"} mt-2`}>Timer</h1>
            <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} max-w-xl mt-0.5`}>
              Exam countdown for Paper 2 (45m), Paper 4 (1h 15m), Paper 6 (1h), Math (2h), or type any custom study time.
            </p>
          </div>

          {/* Full Screen Mode Trigger */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleEnterFullscreen}
              className={`py-2.5 px-4 ${
                isLight
                  ? "bg-[#C96F55] hover:bg-[#B85E45] shadow-md shadow-[#C96F55]/25"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              } text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wide transition flex items-center gap-2 cursor-pointer select-none`}
              title="Enter distraction-free Full Screen Focus Mode (F)"
            >
              <Maximize2 size={13} />
              <span>Full Screen Mode</span>
              <kbd className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">F</kbd>
            </button>
          </div>
        </div>

        {/* Central Master Module */}
        <div className={`p-4 sm:p-6 md:p-8 rounded-3xl border ${
          isLight ? "bg-[#FFFFFF] border-[#E8D7C9] shadow-sm" : "bg-[#090C16] border-white/10 shadow-xl"
        } relative overflow-hidden transition-all duration-300`}>

          {/* Module Header with Quick Full Screen button */}
          <div className="flex items-center justify-between border-b pb-4 mb-4 select-none border-inherit">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isLight ? "bg-[#C96F55]" : "bg-indigo-500"} ${focusModeActive ? "animate-ping" : ""}`} />
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                {getModeLabel()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleEnterFullscreen}
                className={`py-1.5 px-3 rounded-lg border text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isLight
                    ? "bg-[#C96F55] hover:bg-[#B85E45] border-[#C96F55] text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 border-indigo-600 text-white"
                }`}
                title="Enter Full Screen Focus View (F)"
              >
                <Maximize2 size={11} className="text-white" />
                <span>Full Screen</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              EXAM MODES (P2, P4, P6, Custom)
              ========================================================================= */}
          <div className="flex flex-col gap-3 my-2 select-none">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-black ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                SELECT MODE OR TYPE TIME
              </span>
              <span className={`text-[10px] font-mono font-semibold ${isLight ? "text-[#C96F55]" : "text-indigo-400"}`}>
                Current: {focusMinutesSelected >= 60 ? `${Math.floor(focusMinutesSelected / 60)}h ${focusMinutesSelected % 60 > 0 ? `${focusMinutesSelected % 60}m` : ""}` : `${focusMinutesSelected}m`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {/* Mode P2: exactly 45 min */}
              <button
                type="button"
                onClick={() => handleSelectMode("p2")}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  activeMode === "p2"
                    ? isLight
                      ? "bg-[#FFF1EC] border-[#C96F55] shadow-xs ring-1 ring-[#C96F55]"
                      : "bg-indigo-600/25 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                    : isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5F2EC] border-[#E8D7C9]"
                    : "bg-[#101524] hover:bg-[#151D33] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-extrabold uppercase ${
                    activeMode === "p2" ? (isLight ? "text-[#C96F55]" : "text-indigo-300") : (isLight ? "text-[#1D1D1B]" : "text-white")
                  }`}>
                    P2
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    activeMode === "p2"
                      ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white"
                      : isLight ? "bg-[#E8D7C9] text-[#1D1D1B]" : "bg-white/10 text-slate-300"
                  }`}>
                    45 min
                  </span>
                </div>
                <p className={`text-[10px] font-mono leading-tight ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Paper 2 · 45 minutes
                </p>
              </button>

              {/* Mode P4: 1 hour and 15 min (75m) */}
              <button
                type="button"
                onClick={() => handleSelectMode("p4")}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  activeMode === "p4"
                    ? isLight
                      ? "bg-[#FFF1EC] border-[#C96F55] shadow-xs ring-1 ring-[#C96F55]"
                      : "bg-indigo-600/25 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                    : isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5F2EC] border-[#E8D7C9]"
                    : "bg-[#101524] hover:bg-[#151D33] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-extrabold uppercase ${
                    activeMode === "p4" ? (isLight ? "text-[#C96F55]" : "text-indigo-300") : (isLight ? "text-[#1D1D1B]" : "text-white")
                  }`}>
                    P4
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    activeMode === "p4"
                      ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white"
                      : isLight ? "bg-[#E8D7C9] text-[#1D1D1B]" : "bg-white/10 text-slate-300"
                  }`}>
                    1h 15m
                  </span>
                </div>
                <p className={`text-[10px] font-mono leading-tight ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Paper 4 · 75 minutes
                </p>
              </button>

              {/* Mode P6: exactly 1 hour (60m) */}
              <button
                type="button"
                onClick={() => handleSelectMode("p6")}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  activeMode === "p6"
                    ? isLight
                      ? "bg-[#FFF1EC] border-[#C96F55] shadow-xs ring-1 ring-[#C96F55]"
                      : "bg-indigo-600/25 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                    : isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5F2EC] border-[#E8D7C9]"
                    : "bg-[#101524] hover:bg-[#151D33] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-extrabold uppercase ${
                    activeMode === "p6" ? (isLight ? "text-[#C96F55]" : "text-indigo-300") : (isLight ? "text-[#1D1D1B]" : "text-white")
                  }`}>
                    P6
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    activeMode === "p6"
                      ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white"
                      : isLight ? "bg-[#E8D7C9] text-[#1D1D1B]" : "bg-white/10 text-slate-300"
                  }`}>
                    1 hour
                  </span>
                </div>
                <p className={`text-[10px] font-mono leading-tight ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Paper 6 · 60 minutes
                </p>
              </button>

              {/* Mode Math: exactly 2 hours (120m) */}
              <button
                type="button"
                onClick={() => handleSelectMode("math")}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  activeMode === "math"
                    ? isLight
                      ? "bg-[#FFF1EC] border-[#C96F55] shadow-xs ring-1 ring-[#C96F55]"
                      : "bg-indigo-600/25 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                    : isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5F2EC] border-[#E8D7C9]"
                    : "bg-[#101524] hover:bg-[#151D33] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-extrabold uppercase ${
                    activeMode === "math" ? (isLight ? "text-[#C96F55]" : "text-indigo-300") : (isLight ? "text-[#1D1D1B]" : "text-white")
                  }`}>
                    Math
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    activeMode === "math"
                      ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white"
                      : isLight ? "bg-[#E8D7C9] text-[#1D1D1B]" : "bg-white/10 text-slate-300"
                  }`}>
                    2 hours
                  </span>
                </div>
                <p className={`text-[10px] font-mono leading-tight ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Mathematics · 120 minutes
                </p>
              </button>

              {/* Custom Mode / Type Time */}
              <button
                type="button"
                onClick={() => handleSelectMode("custom")}
                className={`py-3 px-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  activeMode === "custom"
                    ? isLight
                      ? "bg-[#FFF1EC] border-[#C96F55] shadow-xs ring-1 ring-[#C96F55]"
                      : "bg-indigo-600/25 border-indigo-500 shadow-md ring-1 ring-indigo-500/50"
                    : isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5F2EC] border-[#E8D7C9]"
                    : "bg-[#101524] hover:bg-[#151D33] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-extrabold uppercase ${
                    activeMode === "custom" ? (isLight ? "text-[#C96F55]" : "text-indigo-300") : (isLight ? "text-[#1D1D1B]" : "text-white")
                  }`}>
                    Custom
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    activeMode === "custom"
                      ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white"
                      : isLight ? "bg-[#E8D7C9] text-[#1D1D1B]" : "bg-white/10 text-slate-300"
                  }`}>
                    <Edit3 size={10} />
                    <span>Type</span>
                  </span>
                </div>
                <p className={`text-[10px] font-mono leading-tight ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Type any time you want
                </p>
              </button>
            </div>

            {/* Direct Type-In Time Bar */}
            <div className={`mt-2 p-3 sm:p-4 rounded-2xl border ${
              isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#0E1322] border-white/10"
            } flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3`}>
              <div className="flex items-center gap-2">
                <Clock size={16} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                <div>
                  <h4 className={`text-xs font-mono font-bold uppercase ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                    Type Your Own Duration
                  </h4>
                  <p className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                    Enter hours and minutes to set any custom timer duration
                  </p>
                </div>
              </div>

              {/* Hours & Minutes Input Fields */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <span className={`text-[8px] font-mono uppercase font-bold mb-0.5 ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                      Hours
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={customHours}
                      onChange={(e) => {
                        const h = parseInt(e.target.value, 10) || 0;
                        setCustomHours(h);
                        handleApplyCustomTime(h, customMinutes);
                      }}
                      className={`w-14 text-center font-mono font-bold text-sm py-1.5 px-2 rounded-xl border ${
                        isLight
                          ? "bg-white border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C96F55] focus:ring-1 focus:ring-[#C96F55]"
                          : "bg-[#060810] border-white/15 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      } outline-none`}
                    />
                  </div>

                  <span className={`font-mono font-black text-lg mt-3 ${isLight ? "text-[#77736B]" : "text-slate-500"}`}>:</span>

                  <div className="flex flex-col items-center">
                    <span className={`text-[8px] font-mono uppercase font-bold mb-0.5 ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                      Minutes
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customMinutes}
                      onChange={(e) => {
                        const m = parseInt(e.target.value, 10) || 0;
                        setCustomMinutes(m);
                        handleApplyCustomTime(customHours, m);
                      }}
                      className={`w-14 text-center font-mono font-bold text-sm py-1.5 px-2 rounded-xl border ${
                        isLight
                          ? "bg-white border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C96F55] focus:ring-1 focus:ring-[#C96F55]"
                          : "bg-[#060810] border-white/15 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      } outline-none`}
                    />
                  </div>
                </div>

                {/* Quick adjustments */}
                <div className="flex items-center gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newTotal = Math.max(1, focusMinutesSelected - 5);
                      handleApplyCustomTime(Math.floor(newTotal / 60), newTotal % 60);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
                      isLight ? "bg-white border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F0EEE8]" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                    title="Subtract 5 minutes"
                  >
                    -5m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newTotal = focusMinutesSelected + 5;
                      handleApplyCustomTime(Math.floor(newTotal / 60), newTotal % 60);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
                      isLight ? "bg-white border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F0EEE8]" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                    title="Add 5 minutes"
                  >
                    +5m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newTotal = focusMinutesSelected + 15;
                      handleApplyCustomTime(Math.floor(newTotal / 60), newTotal % 60);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
                      isLight ? "bg-white border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F0EEE8]" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                    title="Add 15 minutes"
                  >
                    +15m
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              TIMER DISPLAY CHRONO
              ========================================================================= */}
          <div className="flex flex-col items-center justify-center shrink-0 my-6 select-none text-center">
            <div>
              <FlipClockTimer 
                timeRemaining={focusTimeRemaining} 
                size="lg" 
                themeMode={themeMode} 
                isPaused={isPaused} 
              />
            </div>

            {/* Linear progress bar */}
            {focusModeActive && (
              <div className="w-56 sm:w-72 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLight ? "bg-[#C96F55]" : "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
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
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-3">
                <span className={`text-[10px] font-mono tracking-widest ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase font-black`}>
                  {focusModeActive ? `ACTIVE COUNTDOWN • ${getModeLabel()}` : "READY TO LAUNCH"}
                </span>
                {focusModeActive && (
                  <span className={`text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                    isLight ? "bg-black/5 text-[#77736B]" : "bg-white/10 text-slate-300"
                  }`} title="Screen timeout prevented while timer is on">
                    <Sun size={10} className="text-amber-400" />
                    <span>Screen Kept On</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* =========================================================================
              BOTTOM ACTIONS ROW: Play, Pause, Reset
              ========================================================================= */}
          <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-3 shrink-0 my-4 select-none">
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
                  onDurationChange(focusMinutesSelected);
                }}
                className={`py-3 px-5 ${
                  isLight ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] border-[#E8D7C9] text-[#1D1D1B]" : "bg-[#111626] hover:bg-[#161D30] border-white/10 text-slate-300"
                } border rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-xs`}
                title="Reset to full interval"
              >
                <RotateCcw size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              AMBIENT SOUNDSCAPES CONTROLS (Only Silent & White Noise)
              ========================================================================= */}
          <div className={`mt-6 pt-4 border-t ${isLight ? "border-[#E8D7C9]" : "border-white/5"} space-y-3.5`}>
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
                ) : focusModeActive ? (
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]" : "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  } flex items-center gap-1 animate-pulse`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLight ? "bg-[#C96F55]" : "bg-indigo-400"}`} />
                    Playing White Noise
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

            {/* Exactly 2 Soundscape Cards: Silent & White Noise (Gentle Rain) */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto sm:mx-0">
              {/* Card 1: Silent */}
              <button
                type="button"
                onClick={() => handleSelectSoundscape("silent")}
                className={`py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer border select-none ${
                  selectedSoundscape === "silent"
                    ? isLight
                      ? "bg-[#FAF8F5] border-[#C96F55] ring-1 ring-[#C96F55] text-[#1D1D1B] shadow-xs"
                      : "bg-white/10 border-indigo-500 ring-1 ring-indigo-500/50 text-white shadow-md"
                    : isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5F2EC] text-[#77736B] border-[#E8D7C9]"
                    : "bg-[#101524] hover:bg-[#151D33] text-slate-400 border-white/10"
                }`}
              >
                <div className="relative inline-flex items-center justify-center">
                  <VolumeX size={18} className={selectedSoundscape === "silent" ? (isLight ? "text-[#C96F55]" : "text-indigo-400") : "text-slate-400"} />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <div className="text-left">
                  <div className={`text-xs font-mono font-bold leading-tight ${
                    selectedSoundscape === "silent" ? (isLight ? "text-[#1D1D1B]" : "text-white") : ""
                  }`}>
                    Silent
                  </div>
                  <div className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                    No audio
                  </div>
                </div>
              </button>

              {/* Card 2: White Noise (Gentle Rain) */}
              <button
                type="button"
                onClick={() => handleSelectSoundscape("white_noise")}
                className={`py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer border select-none ${
                  selectedSoundscape === "white_noise"
                    ? isLight
                      ? "bg-[#C96F55] text-white border-[#C96F55] shadow-md -translate-y-0.5"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-600/30 -translate-y-0.5"
                    : isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5F2EC] text-[#77736B] border-[#E8D7C9]"
                    : "bg-[#101524] hover:bg-[#151D33] text-slate-400 border-white/10"
                }`}
              >
                <CloudRain size={18} className={selectedSoundscape === "white_noise" ? "text-white" : "text-blue-400"} />
                <div className="text-left">
                  <div className={`text-xs font-mono font-bold leading-tight ${
                    selectedSoundscape === "white_noise" ? "text-white" : ""
                  }`}>
                    White Noise
                  </div>
                  <div className={`text-[9px] font-mono ${
                    selectedSoundscape === "white_noise" ? "text-white/80" : isLight ? "text-[#77736B]" : "text-slate-400"
                  }`}>
                    Gentle Rain
                  </div>
                </div>
              </button>
            </div>

            {/* Sound Volume Slider & Auto-Play Toggle */}
            <div className={`pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
              <div className="flex items-center gap-3 w-full sm:w-64">
                <span className="text-[10px] flex items-center gap-1 font-bold shrink-0">
                  <Headphones size={12} />
                  <span>Volume:</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setSoundVolumeState(newVol);
                    setSoundscapeVolume(newVol);
                  }}
                  className="flex-1 h-1.5 bg-[#E8D7C9] dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C96F55]"
                />
                <span className="text-[10px] w-8 text-right font-bold text-[#C96F55]">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-mono">
                <input
                  type="checkbox"
                  checked={autoSoundOnStudy}
                  onChange={(e) => setAutoSoundOnStudy(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#E8D7C9] text-[#C96F55] accent-[#C96F55] cursor-pointer"
                />
                <span>Play automatically when timer starts</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COMPLETION CELEBRATION MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full p-6 sm:p-8 rounded-3xl border shadow-2xl text-center select-none ${
                isLight ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B]" : "bg-[#0F1424] border-white/15 text-white"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-[#C96F55]/15 text-[#C96F55] mb-4">
                <Sparkles size={32} />
              </div>

              <h2 className="text-xl font-bold font-sans">Session Completed!</h2>
              <p className={`text-xs mt-2 font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                You successfully completed your {getModeLabel()} study block. Excellent work staying focused!
              </p>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className={`py-2.5 px-6 rounded-xl font-mono text-xs font-bold uppercase transition cursor-pointer ${
                    isLight ? "bg-[#C96F55] hover:bg-[#B85F48] text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  Awesome, Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

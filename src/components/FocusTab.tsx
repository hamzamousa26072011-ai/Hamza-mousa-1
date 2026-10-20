import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Headphones, 
  CloudRain, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Edit3,
  Coffee,
  Activity
} from "lucide-react";
import {
  SoundscapeType,
  setSoundscape,
  setSoundscapeVolume,
  stopAllSoundscapes,
  pauseSoundscape
} from "../lib/ambientSoundscapes";

export type TimerPresetId = "p2" | "p4" | "p6" | "math" | "custom" | "pomodoro" | "shortBreak";

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
  pomodoroMode?: "work" | "break";
  onModeChange?: (mode: "work" | "break") => void;
  pomodoroCount?: number;
  themeMode?: "light" | "dark";
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

interface FlipCardProps {
  value: string;
  label: string;
  isLight: boolean;
  isPaused: boolean;
  isActive: boolean;
  size?: "default" | "fullscreen";
}

/**
 * Authentic 180-degree Mechanical Split-Flap Clock Card
 * Rotates smoothly in true 3D perspective from 0° to -180° with physical gravity easing.
 */
const FlipCard: React.FC<FlipCardProps> = React.memo(({
  value,
  label,
  isLight,
  isPaused,
  isActive,
  size = "default"
}) => {
  const [currentVal, setCurrentVal] = useState(value);
  const [previousVal, setPreviousVal] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (value !== currentVal) {
      setPreviousVal(currentVal);
      setCurrentVal(value);
      setIsFlipping(true);
      setFlipKey((k) => k + 1);

      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value, currentVal]);

  const isFullscreen = size === "fullscreen";

  const cardDim = isFullscreen
    ? "w-28 sm:w-44 md:w-60 lg:w-76 xl:w-92 h-36 sm:h-56 md:h-72 lg:h-88 xl:h-[26rem] rounded-2xl sm:rounded-3xl lg:rounded-[36px] xl:rounded-[44px]"
    : "w-24 sm:w-40 md:w-52 lg:w-60 xl:w-68 h-28 sm:h-44 md:h-56 lg:h-64 xl:h-72 rounded-2xl sm:rounded-3xl lg:rounded-[32px] xl:rounded-[36px]";

  const fontDim = isFullscreen
    ? "text-5xl sm:text-7xl md:text-9xl lg:text-[10rem] xl:text-[12.5rem]"
    : "text-4xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[10rem]";

  const cardBgTop = isLight 
    ? "bg-gradient-to-b from-[#FFFFFF] to-[#FAF5F0] border-[#E8DFD5]" 
    : "bg-gradient-to-b from-[#1C1838] to-[#14112B] border-white/10";

  const cardBgBottom = isLight 
    ? "bg-gradient-to-b from-[#F5EFE9] to-[#EBE3D8] border-[#E8DFD5]" 
    : "bg-gradient-to-b from-[#110E24] to-[#0A0817] border-white/10";

  const textColor = isLight ? "text-[#1A1614]" : "text-white";

  const glowBorder = isActive 
    ? isLight ? "ring-2 ring-[#C25E42]/50 shadow-[0_0_20px_rgba(194,94,66,0.25)]" : "ring-1 ring-[#8B5CF6]/60 shadow-[0_0_30px_rgba(139,92,246,0.35)]" 
    : isPaused 
    ? isLight ? "ring-1 ring-[#C25E42]/50 shadow-[0_0_25px_rgba(194,94,66,0.25)]" : "ring-1 ring-[#A855F7]/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]" 
    : isLight ? "border border-[#E8DFD5]" : "border border-white/10";

  return (
    <div className="flex flex-col items-center">
      {/* 3D PERSPECTIVE CONTAINER */}
      <div 
        className={`relative ${cardDim} select-none perspective-1000 preserve-3d ${glowBorder}`}
        style={{ perspective: "1000px" }}
      >
        
        {/* 1. UPPER STATIC BACKGROUND: Displays the NEW value */}
        <div className={`absolute top-0 left-0 right-0 h-1/2 overflow-hidden rounded-t-2xl sm:rounded-t-3xl lg:rounded-t-[36px] xl:rounded-t-[44px] border-t border-x ${cardBgTop} shadow-inner`}>
          <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${fontDim} font-mono font-black tracking-tight leading-none ${textColor} tabular-nums drop-shadow-md select-none`}>
              {currentVal}
            </span>
          </div>
          <div className="absolute inset-0 bg-white/[0.04] pointer-events-none" />
        </div>

        {/* 2. LOWER STATIC BACKGROUND: Displays OLD value while flipping, then NEW value */}
        <div className={`absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden rounded-b-2xl sm:rounded-b-3xl lg:rounded-b-[36px] xl:rounded-b-[44px] border-b border-x ${cardBgBottom} shadow-2xl`}>
          <div className="absolute inset-x-0 top-[-100%] h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${fontDim} font-mono font-black tracking-tight leading-none ${textColor} tabular-nums drop-shadow-md select-none`}>
              {isFlipping ? previousVal : currentVal}
            </span>
          </div>
          <div className="absolute inset-0 bg-black/[0.14] pointer-events-none" />
          {/* Shadow that darkens lower background as leaf falls towards it */}
          {isFlipping && (
            <div className="absolute inset-0 bg-black/40 pointer-events-none animate-flip-shadow" />
          )}
        </div>

        {/* 3. FLIPPING 180° MECHANICAL LEAF */}
        {isFlipping && (
          <div 
            key={`flip-leaf-${flipKey}`}
            className="absolute top-0 left-0 right-0 h-1/2 z-20 pointer-events-none animate-flip-down"
            style={{
              transformOrigin: "50% 100%",
              transformStyle: "preserve-3d"
            }}
          >
            {/* FACE A (Front Face): Shows OLD upper half as it folds forward and down */}
            <div 
              className={`absolute inset-0 overflow-hidden rounded-t-2xl sm:rounded-t-3xl lg:rounded-t-[36px] xl:rounded-t-[44px] border-t border-x ${cardBgTop} backface-hidden shadow-lg`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
                <span className={`${fontDim} font-mono font-black tracking-tight leading-none ${textColor} tabular-nums drop-shadow-md select-none`}>
                  {previousVal}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/15 pointer-events-none" />
            </div>

            {/* FACE B (Back Face): Shows NEW lower half, right-side up when rotated 180° */}
            <div 
              className={`absolute inset-0 overflow-hidden rounded-b-2xl sm:rounded-b-3xl lg:rounded-b-[36px] xl:rounded-b-[44px] border-b border-x ${cardBgBottom} backface-hidden shadow-2xl`}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateX(180deg)"
              }}
            >
              <div className="absolute inset-x-0 top-[-100%] h-[200%] flex items-center justify-center pointer-events-none">
                <span className={`${fontDim} font-mono font-black tracking-tight leading-none ${textColor} tabular-nums drop-shadow-md select-none`}>
                  {currentVal}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Midline horizontal seam divider */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] sm:h-[3px] -translate-y-1/2 bg-[#090814] z-30 pointer-events-none shadow-[0_1px_1px_rgba(255,255,255,0.08)]" />
        
        {/* Physical side hinge notches */}
        <div className={`absolute top-1/2 -left-1.5 sm:-left-2 md:-left-2.5 w-3 sm:w-4 md:w-5 h-4 sm:h-5 md:h-6 -translate-y-1/2 rounded-r-full ${isLight ? "bg-[#EDE5DB]" : "bg-[#0C0D17]"} z-30 pointer-events-none border-r border-y border-black/40`} />
        <div className={`absolute top-1/2 -right-1.5 sm:-right-2 md:-right-2.5 w-3 sm:w-4 md:w-5 h-4 sm:h-5 md:h-6 -translate-y-1/2 rounded-l-full ${isLight ? "bg-[#EDE5DB]" : "bg-[#0C0D17]"} z-30 pointer-events-none border-l border-y border-black/40`} />
      </div>

      {/* Label beneath card */}
      <span className={`${isFullscreen ? "text-xs sm:text-sm md:text-base font-mono font-black uppercase tracking-[0.25em] mt-3 sm:mt-5" : "text-[10px] sm:text-xs md:text-sm font-mono font-black uppercase tracking-widest mt-2.5 sm:mt-3.5"} ${
        isLight ? "text-[#C25E42]" : "text-purple-300/80"
      }`}>
        {label}
      </span>
    </div>
  );
});

FlipCard.displayName = "FlipCard";

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
  themeMode = "dark",
  onFullScreenChange
}: FocusTabProps) {
  const isLight = themeMode === "light";

  // Active preset determination (Long break removed)
  const activePreset = useMemo<TimerPresetId>(() => {
    if (focusMinutesSelected === 45) return "p2";
    if (focusMinutesSelected === 75) return "p4";
    if (focusMinutesSelected === 60) return "p6";
    if (focusMinutesSelected === 120) return "math";
    if (pomodoroMode === "break" && focusMinutesSelected === 5) return "shortBreak";
    if (pomodoroMode === "work" && focusMinutesSelected === 25) return "pomodoro";
    return "custom";
  }, [focusMinutesSelected, pomodoroMode]);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [customHours, setCustomHours] = useState<number>(() => Math.floor(focusMinutesSelected / 60));
  const [customMinutes, setCustomMinutes] = useState<number>(() => focusMinutesSelected % 60);

  useEffect(() => {
    setCustomHours(Math.floor(focusMinutesSelected / 60));
    setCustomMinutes(focusMinutesSelected % 60);
  }, [focusMinutesSelected]);

  // Ambient Soundscapes state
  const [selectedSoundscape, setSelectedSoundscape] = useState<SoundscapeType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ENGEZ_SELECTED_SOUNDSCAPE");
      return (saved === "white_noise" || saved === "silent") ? (saved as SoundscapeType) : "silent";
    }
    return "silent";
  });

  const [soundVolume, setSoundVolumeState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ENGEZ_SOUND_VOLUME");
      return saved ? parseFloat(saved) : 0.6;
    }
    return 0.6;
  });

  const [autoSoundOnStudy, setAutoSoundOnStudy] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ENGEZ_AUTO_SOUND_STUDY");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [prevFocusActive, setPrevFocusActive] = useState(focusModeActive);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ENGEZ_SELECTED_SOUNDSCAPE", selectedSoundscape);
    }
  }, [selectedSoundscape]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ENGEZ_SOUND_VOLUME", soundVolume.toString());
    }
  }, [soundVolume]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ENGEZ_AUTO_SOUND_STUDY", autoSoundOnStudy.toString());
    }
  }, [autoSoundOnStudy]);

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

  useEffect(() => {
    setSoundscapeVolume(soundVolume);
  }, [soundVolume]);

  useEffect(() => {
    return () => {
      stopAllSoundscapes();
    };
  }, []);

  const handleSelectSoundscape = (type: SoundscapeType) => {
    if (type === "silent") {
      setSelectedSoundscape("silent");
      stopAllSoundscapes();
      return;
    }

    if (selectedSoundscape === type && !isPaused) {
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

  // Fullscreen Handlers
  const handleEnterFullscreen = async () => {
    setIsFullScreen(true);
    onFullScreenChange?.(true);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request error:", e);
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

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);

  // Keyboard Shortcuts (Space: Play/Pause, Esc: Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "Escape") {
        if (showCompletionModal) {
          setShowCompletionModal(false);
        } else if (isFullScreen) {
          handleExitFullscreen();
        }
      } else if (e.key === "f" || e.key === "F") {
        if (isFullScreen) {
          handleExitFullscreen();
        } else {
          handleEnterFullscreen();
        }
      } else if (e.code === "Space") {
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
  }, [isFullScreen, focusModeActive, showCompletionModal, onPauseFocus, onStopFocus, onStartFocus, selectedSoundscape, soundVolume]);

  useEffect(() => {
    if (prevFocusActive && !focusModeActive && !isPaused) {
      setShowCompletionModal(true);
    }
    setPrevFocusActive(focusModeActive);
  }, [focusModeActive, isPaused]);

  // Preset Selection Handlers (Long break removed)
  const handleSelectPreset = (preset: TimerPresetId) => {
    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }

    if (preset === "p2") {
      onModeChange?.("work");
      onDurationChange(45);
      setCustomHours(0);
      setCustomMinutes(45);
    } else if (preset === "p4") {
      onModeChange?.("work");
      onDurationChange(75);
      setCustomHours(1);
      setCustomMinutes(15);
    } else if (preset === "p6") {
      onModeChange?.("work");
      onDurationChange(60);
      setCustomHours(1);
      setCustomMinutes(0);
    } else if (preset === "math") {
      onModeChange?.("work");
      onDurationChange(120);
      setCustomHours(2);
      setCustomMinutes(0);
    } else if (preset === "pomodoro") {
      onModeChange?.("work");
      onDurationChange(25);
      setCustomHours(0);
      setCustomMinutes(25);
    } else if (preset === "shortBreak") {
      onModeChange?.("break");
      onDurationChange(5);
      setCustomHours(0);
      setCustomMinutes(5);
    }
  };

  const handleApplyCustomTime = (h: number, m: number) => {
    const validH = Math.max(0, Math.min(23, isNaN(h) ? 0 : h));
    const validM = Math.max(0, Math.min(59, isNaN(m) ? 0 : m));
    const finalMins = Math.max(1, validH * 60 + validM);

    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }

    setCustomHours(Math.floor(finalMins / 60));
    setCustomMinutes(finalMins % 60);
    onDurationChange(finalMins);
    onModeChange?.("work");
  };

  // Break down focusTimeRemaining (HH:MM:SS) safely
  const timeParts = focusTimeRemaining.split(":");
  let hoursStr = "00";
  let minsStr = "00";
  let secsStr = "00";

  if (timeParts.length === 3) {
    hoursStr = timeParts[0].padStart(2, "0");
    minsStr = timeParts[1].padStart(2, "0");
    secsStr = timeParts[2].padStart(2, "0");
  } else if (timeParts.length === 2) {
    minsStr = timeParts[0].padStart(2, "0");
    secsStr = timeParts[1].padStart(2, "0");
  }

  const getPresetLabel = () => {
    if (activePreset === "p2") return "P2 (45 MINUTES)";
    if (activePreset === "p4") return "P4 (1 HOUR 15 MIN)";
    if (activePreset === "p6") return "P6 (1 HOUR)";
    if (activePreset === "math") return "MATH (2 HOURS)";
    if (activePreset === "pomodoro") return "POMODORO (25 MIN)";
    if (activePreset === "shortBreak") return "SHORT BREAK (5 MIN)";
    return `CUSTOM (${focusMinutesSelected} MIN)`;
  };

  const getActiveDurationLabel = () => {
    const h = Math.floor(focusMinutesSelected / 60);
    const m = focusMinutesSelected % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  return (
    <>
      {/* =========================================================================
          IMMERSIVE FULL-SCREEN OVERLAY
          ========================================================================= */}
      {typeof document !== "undefined" &&
        createPortal(
          isFullScreen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Full screen focus timer"
              className={`fixed inset-0 z-9999 flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-y-auto ${
                isLight ? "bg-[#FBF9F5] text-[#1A1614]" : "bg-[#090A10] text-[#F8FAFC]"
              }`}
            >
              {/* Fullscreen Header */}
              <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLight ? "bg-[#8B5CF6]" : "bg-[#8B5CF6]"} ${focusModeActive ? "animate-ping" : ""}`} />
                  <span className="text-sm font-mono font-black tracking-wide uppercase">{getPresetLabel()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSoundscape(selectedSoundscape === "silent" ? "white_noise" : "silent")}
                    className={`py-2 px-3 border rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                      selectedSoundscape !== "silent"
                        ? isLight
                          ? "bg-[#FAF5FF] border-[#E9D5FF] text-[#7E22CE]"
                          : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                        : isLight
                        ? "bg-[#FFFFFF] border-[#EBE4DC] text-[#736B63]"
                        : "bg-[#101322] border-white/10 text-slate-400"
                    }`}
                  >
                    {selectedSoundscape === "silent" ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{selectedSoundscape === "silent" ? "Muted" : "Rain"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExitFullscreen}
                    className={`py-2 px-3.5 border rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                      isLight
                        ? "bg-[#FFFFFF] hover:bg-[#FAF5FF] border-[#EBE4DC] text-[#1A1614]"
                        : "bg-[#101322] hover:bg-[#161A2B] border-white/10 text-white"
                    }`}
                  >
                    <Minimize2 size={14} />
                    <span>Exit Full Screen</span>
                  </button>
                </div>
              </div>

              {/* Central Fullscreen Mechanical Flip Clock */}
              <div className="my-auto py-8 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 my-6">
                  {/* Hours Flip Card */}
                  <FlipCard 
                    value={hoursStr} 
                    label="HOURS" 
                    isLight={isLight} 
                    isPaused={isPaused} 
                    isActive={focusModeActive}
                    size="fullscreen"
                  />

                  {/* Colon Separator 1 */}
                  <div className="flex flex-col gap-3 sm:gap-5 md:gap-7 items-center justify-center pb-6 sm:pb-10 md:pb-14">
                    <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full ${
                      isPaused 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                        : focusModeActive 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                        : "bg-white/20"
                    }`} />
                    <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full ${
                      isPaused 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                        : focusModeActive 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                        : "bg-white/20"
                    }`} />
                  </div>

                  {/* Minutes Flip Card */}
                  <FlipCard 
                    value={minsStr} 
                    label="MINUTES" 
                    isLight={isLight} 
                    isPaused={isPaused} 
                    isActive={focusModeActive}
                    size="fullscreen"
                  />

                  {/* Colon Separator 2 */}
                  <div className="flex flex-col gap-3 sm:gap-5 md:gap-7 items-center justify-center pb-6 sm:pb-10 md:pb-14">
                    <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full ${
                      isPaused 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                        : focusModeActive 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                        : "bg-white/20"
                    }`} />
                    <span className={`w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full ${
                      isPaused 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                        : focusModeActive 
                        ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                        : "bg-white/20"
                    }`} />
                  </div>

                  {/* Seconds Flip Card */}
                  <FlipCard 
                    value={secsStr} 
                    label="SECONDS" 
                    isLight={isLight} 
                    isPaused={isPaused} 
                    isActive={focusModeActive}
                    size="fullscreen"
                  />
                </div>

                {/* Status Pill (Orange in light theme, purple in dark theme) */}
                <div className="mt-4">
                  {isPaused ? (
                    <div className={`px-4 py-1.5 rounded-full border font-mono text-xs font-bold flex items-center gap-2 ${
                      isLight 
                        ? "border-[#C25E42]/50 bg-[#C25E42]/20 text-[#C25E42] shadow-[0_0_15px_rgba(194,94,66,0.25)]" 
                        : "border-[#8B5CF6]/50 bg-[#8B5CF6]/20 text-[#C084FC] shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                    }`}>
                      <Pause size={12} fill="currentColor" />
                      <span>PAUSED</span>
                    </div>
                  ) : focusModeActive ? (
                    <div className={`px-4 py-1.5 rounded-full border font-mono text-xs font-bold flex items-center gap-2 ${
                      isLight 
                        ? "border-[#C25E42]/50 bg-[#C25E42]/15 text-[#C25E42] shadow-[0_0_15px_rgba(194,94,66,0.25)]" 
                        : "border-[#8B5CF6]/50 bg-[#8B5CF6]/15 text-[#C084FC] shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"} animate-ping`} />
                      <span>STUDYING</span>
                    </div>
                  ) : (
                    <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400 font-mono text-xs font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>READY</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Fullscreen Controls */}
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  {focusModeActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        pauseSoundscape();
                        onPauseFocus ? onPauseFocus() : onStopFocus();
                      }}
                      className={`py-3.5 px-8 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                        isLight
                          ? "bg-[#C25E42]/20 border-[#C25E42]/40 text-[#C25E42]"
                          : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                      }`}
                    >
                      <Pause size={16} fill="currentColor" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSoundscape !== "silent") {
                          setSoundscape(selectedSoundscape, soundVolume);
                        }
                        onStartFocus();
                      }}
                      className={`py-3.5 px-10 rounded-2xl text-xs font-mono font-black uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer ${
                        isLight
                          ? "bg-[#C25E42] hover:bg-[#B25136] shadow-xl shadow-[#C25E42]/35"
                          : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-xl shadow-[#8B5CF6]/35"
                      }`}
                    >
                      <Play size={16} fill="currentColor" />
                      <span>{isPaused ? "Resume" : "Start"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      pauseSoundscape();
                      onResetFocus ? onResetFocus() : onStopFocus();
                    }}
                    className={`py-3.5 px-6 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                      isLight
                        ? "bg-[#FFFFFF] hover:bg-[#FFF2ED] border-[#EBE4DC] text-[#1A1614]"
                        : "bg-[#101322] hover:bg-[#161A2B] border-white/10 text-white"
                    }`}
                  >
                    <RotateCcw size={15} />
                    <span>Reset</span>
                  </button>
                </div>

                <p className={`text-[11px] font-mono ${isLight ? "text-[#C25E42]" : "text-purple-300/80"}`}>
                  Space: Play/Pause · Esc: Exit Full Screen
                </p>
              </div>
            </div>
          ),
          document.body
        )}

      {/* =========================================================================
          MAIN TIMER VIEW (ACCURATE MECHANICAL FLIP CLOCK WITH ZERO YELLOW)
          ========================================================================= */}
      <div className={`space-y-6 ${isLight ? "text-[#1A1614]" : "text-[#F8FAFC]"}`}>
        
        {/* Top Header Card */}
        <div className={`p-5 sm:p-6 rounded-3xl border space-y-6 ${
          isLight ? "bg-[#FFFFFF] border-[#EBE4DC] shadow-xs" : "bg-[#0C0D17] border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
        }`}>
          
          {/* Top Bar: Mode Indicator + Full Screen Button */}
          <div className="flex items-center justify-between pb-3 border-b border-inherit">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"} ${focusModeActive ? "animate-ping" : ""}`} />
              <span className="text-sm font-mono font-black tracking-wide uppercase">{getPresetLabel()}</span>
            </div>

            <button
              type="button"
              onClick={handleEnterFullscreen}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 cursor-pointer transition shadow-md active:scale-95 ${
                isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-[0_4px_16px_rgba(139,92,246,0.35)]"
              }`}
            >
              <Maximize2 size={13} />
              <span className="uppercase tracking-wider">Full Screen</span>
            </button>
          </div>

          {/* Preset Mode Selector Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-bold uppercase tracking-wider ${isLight ? "text-[#C25E42]" : "text-slate-400"}`}>
                SELECT MODE OR TYPE TIME
              </span>
              <span className={`font-bold ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                Current: {getActiveDurationLabel()}
              </span>
            </div>

            {/* 5 Preset Cards (P2, P4, P6, MATH, CUSTOM) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: "p2" as const, title: "P2", badge: "45 min", desc: "Paper 2 · 45 minutes" },
                { id: "p4" as const, title: "P4", badge: "1h 15m", desc: "Paper 4 · 75 minutes" },
                { id: "p6" as const, title: "P6", badge: "1 hour", desc: "Paper 6 · 60 minutes" },
                { id: "math" as const, title: "MATH", badge: "2 hours", desc: "Mathematics · 120 minutes" },
                { id: "custom" as const, title: "CUSTOM", badge: "Type", desc: "Type any time you want", isCustom: true },
              ].map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (preset.isCustom) {
                        handleApplyCustomTime(customHours, customMinutes);
                      } else {
                        handleSelectPreset(preset.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[78px] ${
                      isSelected
                        ? isLight
                          ? "bg-[#FFF2ED] border-[#C25E42] shadow-xs"
                          : "bg-[#8B5CF6]/15 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                        : isLight
                        ? "bg-[#FAF8F5] hover:bg-[#FFF2ED] border-[#EBE4DC]"
                        : "bg-[#121320] hover:bg-[#18192A] border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs sm:text-sm font-mono font-black ${
                        isSelected 
                          ? isLight ? "text-[#B25136]" : "text-white" 
                          : isLight ? "text-[#1A1614]" : "text-slate-200"
                      }`}>
                        {preset.title}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                        isSelected
                          ? isLight ? "bg-[#C25E42] text-white shadow-xs" : "bg-[#8B5CF6] text-white shadow-xs"
                          : isLight ? "bg-[#FFEDD5] text-[#B25136]" : "bg-white/10 text-slate-300"
                      }`}>
                        {preset.isCustom && <Edit3 size={9} />}
                        <span>{preset.badge}</span>
                      </span>
                    </div>

                    <p className={`text-[11px] font-sans truncate mt-2 ${
                      isSelected 
                        ? isLight ? "text-[#B25136] font-semibold" : "text-[#C084FC] font-semibold" 
                        : isLight ? "text-[#82776E]" : "text-slate-400"
                    }`}>
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Pomodoro Mode Secondary Row (Only 25m Pomodoro and 5m Short Break - LONG BREAK REMOVED) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`text-[11px] font-mono ${isLight ? "text-[#82776E]" : "text-slate-400"}`}>
                Pomodoro Mode:
              </span>
              {[
                { id: "pomodoro" as const, label: "🍅 Pomodoro (25m)" },
                { id: "shortBreak" as const, label: "☕ Short Break (5m)" }
              ].map((pomo) => (
                <button
                  key={pomo.id}
                  type="button"
                  onClick={() => handleSelectPreset(pomo.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer border transition ${
                    activePreset === pomo.id
                      ? isLight ? "bg-[#C25E42] text-white border-[#C25E42]" : "bg-[#8B5CF6] text-white border-[#8B5CF6]"
                      : isLight ? "bg-[#FAF8F5] text-[#B25136] border-[#FED7AA]" : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {pomo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Your Own Duration Drawer */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? "bg-[#FAF8F5] border-[#EBE4DC]" : "bg-[#121320] border-white/5"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
              }`}>
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-wide uppercase">TYPE YOUR OWN DURATION</h3>
                <p className={`text-[11px] font-sans ${isLight ? "text-[#82776E]" : "text-slate-400"}`}>
                  Enter hours and minutes to set any custom timer duration
                </p>
              </div>
            </div>

            {/* Inputs & Quick Adjustments */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-0.5">HOURS</span>
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
                    className={`w-14 h-9 text-center font-mono font-black text-sm rounded-xl border outline-none ${
                      isLight ? "bg-[#FFFFFF] border-[#EBE4DC] text-[#1A1614]" : "bg-[#18192A] border-white/10 text-white"
                    }`}
                  />
                </div>

                <span className="font-mono font-bold text-lg text-slate-400 mt-3">:</span>

                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-0.5">MINUTES</span>
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
                    className={`w-14 h-9 text-center font-mono font-black text-sm rounded-xl border outline-none ${
                      isLight ? "bg-[#FFFFFF] border-[#EBE4DC] text-[#1A1614]" : "bg-[#18192A] border-white/10 text-white"
                    }`}
                  />
                </div>
              </div>

              {/* Quick Adjustment Pills */}
              <div className="flex items-center gap-1.5 mt-3 sm:mt-0">
                {[
                  { label: "-5m", delta: -5 },
                  { label: "+5m", delta: 5 },
                  { label: "+15m", delta: 15 },
                ].map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => {
                      const newTotal = Math.max(1, focusMinutesSelected + pill.delta);
                      handleApplyCustomTime(Math.floor(newTotal / 60), newTotal % 60);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition ${
                      isLight
                        ? "bg-[#FFFFFF] hover:bg-[#F5EFE9] border-[#EBE4DC] text-[#736B63]"
                        : "bg-[#18192A] hover:bg-[#202238] border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* =========================================================================
              MECHANICAL 3D FLIP CLOCK (HOURS : MINUTES : SECONDS)
              ANIMATES SMOOTHLY ON FLIP WITH ZERO CUT-OFF
              ========================================================================= */}
          <div className="py-6 sm:py-10 flex flex-col items-center justify-center relative">
            
            {/* Background Ambient Glow */}
            {!isLight && (
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none -z-10"
                style={{
                  background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)"
                }}
              />
            )}

            {/* The Three Flip Cards */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 my-2">
              
              {/* HOURS FLIP CARD */}
              <FlipCard
                value={hoursStr}
                label="HOURS"
                isLight={isLight}
                isPaused={isPaused}
                isActive={focusModeActive}
              />

              {/* COLON SEPARATOR 1 */}
              <div className="flex flex-col gap-2.5 sm:gap-3.5 md:gap-4 items-center justify-center pb-5 sm:pb-7 md:pb-9">
                <span className={`w-2 h-2 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full ${
                  isPaused 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                    : focusModeActive 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                    : isLight ? "bg-[#FFEDD5]" : "bg-white/20"
                }`} />
                <span className={`w-2 h-2 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full ${
                  isPaused 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                    : focusModeActive 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                    : isLight ? "bg-[#FFEDD5]" : "bg-white/20"
                }`} />
              </div>

              {/* MINUTES FLIP CARD */}
              <FlipCard
                value={minsStr}
                label="MINUTES"
                isLight={isLight}
                isPaused={isPaused}
                isActive={focusModeActive}
              />

              {/* COLON SEPARATOR 2 */}
              <div className="flex flex-col gap-2.5 sm:gap-3.5 md:gap-4 items-center justify-center pb-5 sm:pb-7 md:pb-9">
                <span className={`w-2 h-2 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full ${
                  isPaused 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                    : focusModeActive 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                    : isLight ? "bg-[#FFEDD5]" : "bg-white/20"
                }`} />
                <span className={`w-2 h-2 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full ${
                  isPaused 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_12px_rgba(194,94,66,0.85)]" : "bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.85)]") 
                    : focusModeActive 
                    ? (isLight ? "bg-[#C25E42] shadow-[0_0_14px_rgba(194,94,66,0.9)] animate-pulse" : "bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse") 
                    : isLight ? "bg-[#FFEDD5]" : "bg-white/20"
                }`} />
              </div>

              {/* SECONDS FLIP CARD */}
              <FlipCard
                value={secsStr}
                label="SECONDS"
                isLight={isLight}
                isPaused={isPaused}
                isActive={focusModeActive}
              />
            </div>

            {/* Status Indicator Pill */}
            <div className="mt-4">
              {isPaused ? (
                <div className={`px-4 py-1.5 rounded-full border font-mono text-xs font-bold flex items-center gap-2 ${
                  isLight 
                    ? "border-[#C25E42]/50 bg-[#C25E42]/20 text-[#C25E42] shadow-[0_0_15px_rgba(194,94,66,0.3)]" 
                    : "border-[#8B5CF6]/50 bg-[#8B5CF6]/20 text-[#C084FC] shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                }`}>
                  <Pause size={12} fill="currentColor" />
                  <span>PAUSED</span>
                </div>
              ) : focusModeActive ? (
                <div className={`px-4 py-1.5 rounded-full border font-mono text-xs font-bold flex items-center gap-2 ${
                  isLight 
                    ? "border-[#C25E42]/50 bg-[#C25E42]/15 text-[#C25E42] shadow-[0_0_15px_rgba(194,94,66,0.3)]" 
                    : "border-[#8B5CF6]/50 bg-[#8B5CF6]/15 text-[#C084FC] shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"} animate-ping`} />
                  <span>STUDYING</span>
                </div>
              ) : (
                <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400 font-mono text-xs font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>READY</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Resume/Start + Reset */}
            <div className="flex items-center gap-3 mt-6">
              {focusModeActive ? (
                <button
                  type="button"
                  onClick={() => {
                    pauseSoundscape();
                    onPauseFocus ? onPauseFocus() : onStopFocus();
                  }}
                  className={`py-3 px-8 rounded-2xl border text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition shadow-lg active:scale-95 ${
                    isLight 
                      ? "bg-[#C25E42]/20 border-[#C25E42]/40 text-[#C25E42]" 
                      : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                  }`}
                >
                  <Pause size={15} fill="currentColor" />
                  <span>PAUSE</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSoundscape !== "silent") {
                      setSoundscape(selectedSoundscape, soundVolume);
                    }
                    onStartFocus();
                  }}
                  className={`py-3 px-10 rounded-2xl text-xs font-mono font-black uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer transition shadow-lg active:scale-95 ${
                    isLight 
                      ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[0_4px_24px_rgba(194,94,66,0.45)]" 
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-[0_4px_24px_rgba(139,92,246,0.45)]"
                  }`}
                >
                  <Play size={15} fill="currentColor" />
                  <span>{isPaused ? "RESUME" : "START"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  pauseSoundscape();
                  onResetFocus ? onResetFocus() : onStopFocus();
                }}
                className={`py-3 px-6 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition active:scale-95 ${
                  isLight
                    ? "bg-[#FFFFFF] hover:bg-[#FFF2ED] border-[#EBE4DC] text-[#1A1614]"
                    : "bg-[#18192A] hover:bg-[#202238] border-white/10 text-white"
                }`}
              >
                <RotateCcw size={14} />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Ambient Focus Soundscapes Section */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? "bg-[#FAF8F5] border-[#EBE4DC]" : "bg-[#121320] border-white/5"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={18} className={isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"} />
                <h3 className="text-xs font-mono font-bold tracking-wide uppercase">
                  Ambient Focus Soundscapes
                </h3>
              </div>

              {/* Status Pill matching user's screenshot with PURPLE when paused in dark mode, ORANGE in light mode */}
              <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                isPaused
                  ? isLight ? "bg-[#C25E42]/15 border-[#C25E42]/40 text-[#C25E42]" : "bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#C084FC]"
                  : focusModeActive && selectedSoundscape !== "silent"
                  ? isLight ? "bg-[#FFF2ED] border-[#FFEDD5] text-[#B25136]" : "bg-purple-500/15 border-purple-500/30 text-purple-400"
                  : isLight ? "bg-black/5 border-black/10 text-[#82776E]" : "bg-white/5 border-white/10 text-slate-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isPaused 
                    ? isLight ? "bg-[#C25E42]" : "bg-[#A855F7]" 
                    : focusModeActive && selectedSoundscape !== "silent" 
                    ? isLight ? "bg-[#C25E42] animate-ping" : "bg-purple-400 animate-ping" 
                    : "bg-slate-400"
                }`} />
                <span>
                  {isPaused 
                    ? "PAUSED WITH TIMER" 
                    : focusModeActive && selectedSoundscape !== "silent" 
                    ? "PLAYING NOW" 
                    : "MUTED"}
                </span>
              </div>
            </div>

            {/* Sound Toggles & Volume */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectSoundscape("silent")}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    selectedSoundscape === "silent"
                      ? isLight ? "bg-[#FFF2ED] border-[#C25E42] text-[#B25136]" : "bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#C084FC]"
                      : isLight ? "bg-white border-[#EBE4DC] text-[#736B63]" : "bg-[#18192A] border-white/10 text-slate-400"
                  }`}
                >
                  <VolumeX size={13} />
                  <span>Silent</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSoundscape("white_noise")}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    selectedSoundscape === "white_noise"
                      ? isLight ? "bg-[#FFF2ED] border-[#C25E42] text-[#B25136]" : "bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#C084FC]"
                      : isLight ? "bg-white border-[#EBE4DC] text-[#736B63]" : "bg-[#18192A] border-white/10 text-slate-400"
                  }`}
                >
                  <CloudRain size={13} />
                  <span>Gentle Rain</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 w-full sm:w-60">
                <Headphones size={13} className="text-slate-400 shrink-0" />
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
                  className={`flex-1 h-1.5 rounded-lg cursor-pointer ${isLight ? "accent-[#C25E42]" : "accent-[#8B5CF6]"}`}
                />
                <span className="font-mono text-xs w-9 text-right font-bold text-slate-400">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SESSION COMPLETION CELEBRATION MODAL
          ========================================================================= */}
      {showCompletionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div className={`max-w-md w-full p-6 sm:p-7 rounded-3xl border shadow-2xl text-center space-y-4 ${
            isLight ? "bg-[#FFFFFF] border-[#EBE4DC] text-[#1A1614]" : "bg-[#101322] border-white/10 text-white"
          }`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              isLight ? "bg-[#C25E42]/20 text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
            }`}>
              <CheckCircle2 size={30} />
            </div>
            
            <div className="space-y-1">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-black ${
                isLight ? "text-[#C25E42]" : "text-[#C084FC]"
              }`}>
                STUDY BLOCK COMPLETED
              </span>
              <h2 className="text-xl font-black font-sans">
                Session Complete! 🎉
              </h2>
              <p className={`text-xs ${isLight ? "text-[#82776E]" : "text-slate-400"} leading-relaxed font-sans`}>
                Great job! You finished your {getPresetLabel()} study block. Take a well-deserved recovery break.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  handleSelectPreset("shortBreak");
                  onStartFocus();
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white cursor-pointer ${
                  isLight 
                    ? "bg-[#C25E42] hover:bg-[#B25136] shadow-md shadow-[#C25E42]/30" 
                    : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-md shadow-[#8B5CF6]/30"
                }`}
              >
                Take 5m Break
              </button>

              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider cursor-pointer ${
                  isLight
                    ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#1A1614] hover:bg-[#F5EFE9]"
                    : "bg-[#161A2B] border-white/10 text-white hover:bg-[#1E2338]"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

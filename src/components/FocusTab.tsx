import React, { useState, useEffect } from "react";
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
  Sun,
  Timer,
  Clock,
  Edit3
} from "lucide-react";
import {
  SoundscapeType,
  setSoundscape,
  setSoundscapeVolume,
  stopAllSoundscapes,
  pauseSoundscape
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

  const [customHours, setCustomHours] = useState<number>(() => Math.floor(focusMinutesSelected / 60));
  const [customMinutes, setCustomMinutes] = useState<number>(() => focusMinutesSelected % 60);

  useEffect(() => {
    setActiveMode(determineMode(focusMinutesSelected));
    setCustomHours(Math.floor(focusMinutesSelected / 60));
    setCustomMinutes(focusMinutesSelected % 60);
  }, [focusMinutesSelected]);

  // Ambient Soundscapes State
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

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [prevFocusActive, setPrevFocusActive] = useState(focusModeActive);

  useEffect(() => {
    localStorage.setItem("ENGEZ_SELECTED_SOUNDSCAPE", selectedSoundscape);
  }, [selectedSoundscape]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_SOUND_VOLUME", soundVolume.toString());
  }, [soundVolume]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_AUTO_SOUND_STUDY", autoSoundOnStudy.toString());
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
  }, [focusModeActive, isPaused, selectedSoundscape]);

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
    setIsLocked(false);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "Escape") {
        if (showCompletionModal) {
          setShowCompletionModal(false);
        } else if (isFullScreen || isLocked) {
          handleExitFullscreen();
        }
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
  }, [isFullScreen, isLocked, focusModeActive, showCompletionModal, onPauseFocus, onStopFocus, onStartFocus, selectedSoundscape, soundVolume]);

  useEffect(() => {
    if (prevFocusActive && !focusModeActive && !isPaused) {
      setShowCompletionModal(true);
    }
    setPrevFocusActive(focusModeActive);
  }, [focusModeActive, isPaused]);

  const handleSelectMode = (mode: TimerModeType) => {
    if (focusModeActive) {
      onPauseFocus ? onPauseFocus() : onStopFocus();
    }
    setActiveMode(mode);

    if (mode === "p2") {
      onDurationChange(45);
      setCustomHours(0);
      setCustomMinutes(45);
    } else if (mode === "p4") {
      onDurationChange(75);
      setCustomHours(1);
      setCustomMinutes(15);
    } else if (mode === "p6") {
      onDurationChange(60);
      setCustomHours(1);
      setCustomMinutes(0);
    } else if (mode === "math") {
      onDurationChange(120);
      setCustomHours(2);
      setCustomMinutes(0);
    }
    onResetFocus?.();
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
    setActiveMode(determineMode(finalMins));
    onResetFocus?.();
  };

  let remainingSeconds = 0;
  try {
    const parts = focusTimeRemaining.split(":");
    if (parts.length === 3) {
      remainingSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    } else if (parts.length === 2) {
      remainingSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
  } catch {
    remainingSeconds = focusMinutesSelected * 60;
  }

  const totalSeconds = focusMinutesSelected * 60;
  const progressRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 1;

  const getModeLabel = () => {
    if (activeMode === "p2") return "Paper 2 (45 min)";
    if (activeMode === "p4") return "Paper 4 (1h 15m)";
    if (activeMode === "p6") return "Paper 6 (1 hour)";
    if (activeMode === "math") return "Mathematics (2 hours)";
    return `Custom (${focusMinutesSelected}m)`;
  };

  return (
    <>
      {/* FULL SCREEN FOCUS OVERLAY */}
      {typeof document !== "undefined" &&
        createPortal(
          (isFullScreen || isLocked) && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Full screen focus timer"
              className={`fixed inset-0 z-9999 flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-y-auto ${
                isLight ? "bg-[#F6F7FA] text-[#18202B]" : "bg-[#10131A] text-[#F1F3F8]"
              }`}
            >
              {/* Fullscreen Header */}
              <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Timer size={16} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
                  <span className="text-xs sm:text-sm font-semibold">{getModeLabel()}</span>
                </div>

                {/* Preset Switcher in Full Screen */}
                <div
                  className={`hidden md:flex items-center border p-1 rounded-xl gap-1 ${
                    isLight ? "border-[#E2E6EF] bg-[#FFFFFF]" : "border-[#283040] bg-[#191E28]"
                  }`}
                >
                  {(
                    [
                      { id: "p2", label: "P2 · 45m" },
                      { id: "p6", label: "P6 · 1h" },
                      { id: "p4", label: "P4 · 1h 15m" },
                      { id: "math", label: "Math · 2h" },
                      { id: "custom", label: "Custom" }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMode(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeMode === m.id
                          ? isLight
                            ? "bg-[#5F55C8] text-white"
                            : "bg-[#6D5DF6] text-white"
                          : isLight
                          ? "text-[#596474] hover:text-[#18202B]"
                          : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Sound & Exit */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickToggleSound}
                    className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      selectedSoundscape !== "silent"
                        ? isLight
                          ? "bg-[#F0EEFF] border-[#D8D3F8] text-[#5F55C8]"
                          : "bg-[#6D5DF6]/20 border-[#6D5DF6]/40 text-[#A99BFF]"
                        : isLight
                        ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#596474]"
                        : "bg-[#191E28] border-[#283040] text-[#B7C0CF]"
                    }`}
                  >
                    {selectedSoundscape === "silent" ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{selectedSoundscape === "silent" ? "Quiet" : "Gentle Rain"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExitFullscreen}
                    className={`py-2 px-3.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      isLight
                        ? "bg-[#FFFFFF] hover:bg-[#E8ECF4] border-[#E2E6EF] text-[#18202B]"
                        : "bg-[#191E28] hover:bg-[#222938] border-[#283040] text-[#F1F3F8]"
                    }`}
                  >
                    <Minimize2 size={14} />
                    <span>Exit Full Screen</span>
                  </button>
                </div>
              </div>

              {/* Central Timer Readout */}
              <div className="my-auto py-8 flex flex-col items-center justify-center">
                <FlipClockTimer
                  timeRemaining={focusTimeRemaining}
                  size="xl"
                  themeMode={themeMode}
                  isPaused={isPaused}
                  showLabels
                />

                {focusModeActive && (
                  <div className="w-64 sm:w-80 md:w-96 h-2 bg-black/10 dark:bg-white/10 rounded-full mt-8 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLight ? "bg-[#5F55C8]" : "bg-[#6D5DF6]"
                      }`}
                      style={{ width: `${Math.round((1 - progressRatio) * 100)}%` }}
                    />
                  </div>
                )}

                <p className={`text-xs font-medium mt-4 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  {isPaused
                    ? "Session paused — press Space or Resume to continue"
                    : focusModeActive
                    ? `Active study block · ${getModeLabel()}`
                    : `Ready · ${getModeLabel()}`}
                </p>
              </div>

              {/* Bottom Controls */}
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  {focusModeActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        pauseSoundscape();
                        onPauseFocus ? onPauseFocus() : onStopFocus();
                      }}
                      className={`py-3 px-8 border rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                        isLight
                          ? "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]"
                          : "bg-[#F59E0B]/15 border-[#FBBF24]/30 text-[#FBBF24]"
                      }`}
                    >
                      <Pause size={15} fill="currentColor" />
                      <span>Pause Session</span>
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
                      className={`py-3 px-8 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer ${
                        isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                      }`}
                    >
                      <Play size={15} fill="currentColor" />
                      <span>{isPaused ? "Resume Session" : "Start Session"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      pauseSoundscape();
                      onResetFocus ? onResetFocus() : onStopFocus();
                      onDurationChange(focusMinutesSelected);
                    }}
                    className={`py-3 px-5 border rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                      isLight
                        ? "bg-[#FFFFFF] hover:bg-[#E8ECF4] border-[#E2E6EF] text-[#18202B]"
                        : "bg-[#191E28] hover:bg-[#222938] border-[#283040] text-[#F1F3F8]"
                    }`}
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>

                <p className={`text-[11px] font-mono ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  Keyboard: Space to Play/Pause · Esc to Exit Full Screen
                </p>
              </div>
            </div>
          ),
          document.body
        )}

      {/* MAIN TIMER PAGE */}
      <div className={`space-y-6 ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Focus &amp; Exam Timer</h1>
            <p className={`text-xs sm:text-sm mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              Practice under real exam paper durations or set a custom focus block. ({pomodoroCount} sessions completed)
            </p>
          </div>

          <button
            type="button"
            onClick={handleEnterFullscreen}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer ${
              isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
            }`}
          >
            <Maximize2 size={14} />
            <span>Full Screen Mode</span>
          </button>
        </div>

        {/* Main Timer Container */}
        <div
          className={`p-5 sm:p-7 rounded-2xl border space-y-6 ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          {/* 1. Exam Paper Duration Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Select Duration Preset</h2>
              <span className={`text-xs font-mono font-semibold ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`}>
                Active: {getModeLabel()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {[
                { id: "p2" as const, code: "Paper 2", time: "45 min", desc: "Multiple Choice / Short" },
                { id: "p6" as const, code: "Paper 6", time: "1 hour", desc: "Alternative to Practical" },
                { id: "p4" as const, code: "Paper 4", time: "1h 15m", desc: "Extended Theory" },
                { id: "math" as const, code: "Mathematics", time: "2 hours", desc: "Full Extended Paper" },
                { id: "custom" as const, code: "Custom", time: `${focusMinutesSelected}m`, desc: "Set hours & minutes" }
              ].map((preset) => {
                const isSelected = activeMode === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectMode(preset.id)}
                    aria-pressed={isSelected}
                    className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? isLight
                          ? "bg-[#F0EEFF] border-[#5F55C8] text-[#18202B]"
                          : "bg-[#6D5DF6]/20 border-[#A99BFF] text-[#F1F3F8]"
                        : isLight
                        ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] border-[#E2E6EF] text-[#18202B]"
                        : "bg-[#222938] hover:bg-[#2A3244] border-[#364054] text-[#F1F3F8]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold">{preset.code}</span>
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          isSelected
                            ? isLight
                              ? "text-[#5F55C8]"
                              : "text-[#A99BFF]"
                            : isLight
                            ? "text-[#596474]"
                            : "text-[#B7C0CF]"
                        }`}
                      >
                        {preset.time}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-snug ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Duration Input Bar */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock size={16} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
                <div>
                  <h3 className="text-xs font-bold">Custom Study Duration</h3>
                  <p className={`text-[11px] ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                    Set exact hours and minutes or adjust by 5/15-minute steps
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="timer-custom-hours" className="text-[11px] font-medium">
                    Hrs
                  </label>
                  <input
                    id="timer-custom-hours"
                    type="number"
                    min={0}
                    max={23}
                    value={customHours}
                    onChange={(e) => {
                      const h = parseInt(e.target.value, 10) || 0;
                      setCustomHours(h);
                      handleApplyCustomTime(h, customMinutes);
                    }}
                    className={`w-14 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border outline-none ${
                      isLight
                        ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#18202B]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                    }`}
                  />
                  <span className="font-mono font-bold">:</span>
                  <label htmlFor="timer-custom-mins" className="text-[11px] font-medium">
                    Mins
                  </label>
                  <input
                    id="timer-custom-mins"
                    type="number"
                    min={0}
                    max={59}
                    value={customMinutes}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10) || 0;
                      setCustomMinutes(m);
                      handleApplyCustomTime(customHours, m);
                    }}
                    className={`w-14 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border outline-none ${
                      isLight
                        ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#18202B]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { label: "-5m", delta: -5 },
                    { label: "+5m", delta: 5 },
                    { label: "+15m", delta: 15 }
                  ].map((adj) => (
                    <button
                      key={adj.label}
                      type="button"
                      onClick={() => {
                        const newTotal = Math.max(1, focusMinutesSelected + adj.delta);
                        handleApplyCustomTime(Math.floor(newTotal / 60), newTotal % 60);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold cursor-pointer ${
                        isLight
                          ? "bg-[#FFFFFF] hover:bg-[#E8ECF4] border-[#CBD2E0] text-[#18202B]"
                          : "bg-[#191E28] hover:bg-[#2A3244] border-[#364054] text-[#F1F3F8]"
                      }`}
                    >
                      {adj.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Central Timer Display */}
          <div
            className={`py-8 px-4 rounded-2xl border flex flex-col items-center justify-center text-center ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#10131A] border-[#283040]"
            }`}
          >
            <FlipClockTimer
              timeRemaining={focusTimeRemaining}
              size="lg"
              themeMode={themeMode}
              isPaused={isPaused}
              showLabels
            />

            {focusModeActive && (
              <div className="w-56 sm:w-72 h-2 bg-black/10 dark:bg-white/10 rounded-full mt-5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLight ? "bg-[#5F55C8]" : "bg-[#6D5DF6]"
                  }`}
                  style={{ width: `${Math.round((1 - progressRatio) * 100)}%` }}
                />
              </div>
            )}

            <p className={`text-xs font-medium mt-4 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              {isPaused
                ? "Paused — click Resume to continue your study session"
                : focusModeActive
                ? `Active countdown · ${getModeLabel()}`
                : `Ready · ${getModeLabel()}`}
            </p>

            {/* Primary Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              {focusModeActive ? (
                <button
                  type="button"
                  onClick={() => {
                    pauseSoundscape();
                    onPauseFocus ? onPauseFocus() : onStopFocus();
                  }}
                  className={`min-h-[44px] py-2.5 px-7 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                    isLight
                      ? "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]"
                      : "bg-[#F59E0B]/15 border-[#FBBF24]/30 text-[#FBBF24]"
                  }`}
                >
                  <Pause size={15} fill="currentColor" />
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
                  className={`min-h-[44px] py-2.5 px-7 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer ${
                    isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                  }`}
                >
                  <Play size={15} fill="currentColor" />
                  <span>{isPaused ? "Resume Study" : "Start Study"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  pauseSoundscape();
                  onResetFocus ? onResetFocus() : onStopFocus();
                  onDurationChange(focusMinutesSelected);
                }}
                className={`min-h-[44px] py-2.5 px-5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                  isLight
                    ? "bg-[#FFFFFF] hover:bg-[#E8ECF4] border-[#CBD2E0] text-[#18202B]"
                    : "bg-[#191E28] hover:bg-[#222938] border-[#364054] text-[#F1F3F8]"
                }`}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* 3. Ambient Background Audio */}
          <div className="pt-4 border-t border-inherit space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Background Audio</h3>
              <span className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                {selectedSoundscape === "silent" ? "Muted (Quiet)" : "Gentle Rain"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleSelectSoundscape("silent")}
                aria-pressed={selectedSoundscape === "silent"}
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer ${
                  selectedSoundscape === "silent"
                    ? isLight
                      ? "bg-[#F0EEFF] border-[#5F55C8] text-[#18202B]"
                      : "bg-[#6D5DF6]/20 border-[#A99BFF] text-[#F1F3F8]"
                    : isLight
                    ? "bg-[#F6F7FA] border-[#E2E6EF] text-[#596474]"
                    : "bg-[#222938] border-[#364054] text-[#B7C0CF]"
                }`}
              >
                <VolumeX size={18} />
                <div className="text-left">
                  <span className="block text-xs font-bold">Silent</span>
                  <span className="block text-[11px] opacity-80">No background sound</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSoundscape("white_noise")}
                aria-pressed={selectedSoundscape === "white_noise"}
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer ${
                  selectedSoundscape === "white_noise"
                    ? isLight
                      ? "bg-[#F0EEFF] border-[#5F55C8] text-[#18202B]"
                      : "bg-[#6D5DF6]/20 border-[#A99BFF] text-[#F1F3F8]"
                    : isLight
                    ? "bg-[#F6F7FA] border-[#E2E6EF] text-[#596474]"
                    : "bg-[#222938] border-[#364054] text-[#B7C0CF]"
                }`}
              >
                <CloudRain size={18} className="text-sky-500" />
                <div className="text-left">
                  <span className="block text-xs font-bold">Gentle Rain</span>
                  <span className="block text-[11px] opacity-80">Steady ambient rain loop</span>
                </div>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-3 w-full sm:w-64">
                <label htmlFor="sound-volume-slider" className="flex items-center gap-1.5 font-medium shrink-0">
                  <Headphones size={13} />
                  <span>Volume</span>
                </label>
                <input
                  id="sound-volume-slider"
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
                  className="flex-1 h-1.5 rounded-lg cursor-pointer accent-[#5F55C8]"
                />
                <span className="font-mono text-xs w-9 text-right">{Math.round(soundVolume * 100)}%</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={autoSoundOnStudy}
                  onChange={(e) => setAutoSoundOnStudy(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#5F55C8] cursor-pointer"
                />
                <span>Start audio automatically with timer</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETION DIALOG */}
      {showCompletionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-complete-title"
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            className={`max-w-md w-full p-6 rounded-2xl border shadow-xl text-center space-y-4 ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-1">
              <h2 id="session-complete-title" className="text-lg font-bold">
                Focus Session Complete
              </h2>
              <p className={`text-xs leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                You completed your {getModeLabel()} study block. Take a short break before starting your next session.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCompletionModal(false)}
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
              }`}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

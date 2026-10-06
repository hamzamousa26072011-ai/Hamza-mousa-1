import React, { useState, useEffect } from "react";

interface FlipClockTimerProps {
  timeRemaining: string; // "HH:MM:SS" or "MM:SS"
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  themeMode?: "light" | "dark";
  isPaused?: boolean;
  showHours?: boolean;
  showLabels?: boolean;
}

interface FlipCardUnitProps {
  value: string; // e.g. "01", "15", "00"
  label?: string;
  size: "sm" | "md" | "lg" | "xl" | "2xl";
  isLight: boolean;
  showLabels?: boolean;
}

const FlipCardUnit: React.FC<FlipCardUnitProps> = ({ 
  value, 
  label, 
  size, 
  isLight, 
  showLabels = false 
}) => {
  const [currentVal, setCurrentVal] = useState(value);
  const [prevVal, setPrevVal] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== currentVal) {
      setPrevVal(currentVal);
      setCurrentVal(value);
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [value, currentVal]);

  // Dimension presets strictly matching the user's uploaded reference proportions
  const sizeStyles = {
    sm: {
      card: "w-14 sm:w-16 h-18 sm:h-20 rounded-xl sm:rounded-2xl",
      font: "text-2xl sm:text-3xl",
      divider: "h-[1px]",
      label: "text-[8px] sm:text-[9px]"
    },
    md: {
      card: "w-16 sm:w-20 md:w-22 h-20 sm:h-24 md:h-28 rounded-2xl md:rounded-3xl",
      font: "text-3xl sm:text-4xl md:text-5xl",
      divider: "h-[1.2px]",
      label: "text-[9px] sm:text-[10px]"
    },
    lg: {
      card: "w-22 sm:w-28 md:w-32 h-26 sm:h-34 md:h-38 rounded-2xl sm:rounded-3xl",
      font: "text-4xl sm:text-5xl md:text-6xl",
      divider: "h-[1.5px]",
      label: "text-[10px] sm:text-xs"
    },
    xl: {
      card: "w-24 sm:w-32 md:w-44 h-30 sm:h-40 md:h-54 rounded-2xl sm:rounded-3xl",
      font: "text-4xl sm:text-6xl md:text-7xl",
      divider: "h-[2px]",
      label: "text-[10px] sm:text-xs"
    },
    "2xl": {
      card: "w-24 sm:w-36 md:w-52 lg:w-64 xl:w-72 h-32 sm:h-48 md:h-68 lg:h-84 xl:h-96 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] lg:rounded-[3rem]",
      font: "text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] xl:text-[8.5rem]",
      divider: "h-[1.5px] sm:h-[2px] md:h-[2.5px] lg:h-[3px]",
      label: "text-[10px] sm:text-xs md:text-sm"
    }
  }[size];

  // Colors matching the cosmic obsidian dark theme and light theme
  const cardBg = isLight 
    ? "bg-gradient-to-b from-[#FFFFFF] to-[#F3EFE9] border-[#D8D4CA] shadow-md shadow-black/5"
    : "bg-gradient-to-b from-[#161028] to-[#0D081B] border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)]";

  const numColor = isLight ? "text-[#1D1D1B]" : "text-white";
  const dividerColor = isLight ? "bg-[#C4BFB4]" : "bg-black/85 shadow-[0_1px_0_rgba(255,255,255,0.06)]";

  return (
    <div className="flex flex-col items-center">
      {/* 2-Digit Split-Flap Card (Matches the uploaded reference screenshot) */}
      <div 
        className={`relative ${sizeStyles.card} ${cardBg} border flex flex-col overflow-hidden select-none`}
        style={{ perspective: "800px" }}
      >
        {/* TOP FLAP HALF */}
        <div className="relative w-full h-1/2 overflow-hidden flex items-end justify-center pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${sizeStyles.font} font-sans font-bold ${numColor} tracking-tight leading-none select-none`}>
              {currentVal}
            </span>
          </div>
          {/* Subtle top ambient specular light */}
          <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>

        {/* CENTER HORIZONTAL SPLIT GROOVE */}
        <div className={`w-full ${sizeStyles.divider} ${dividerColor} relative z-20`} />

        {/* BOTTOM FLAP HALF */}
        <div className="relative w-full h-1/2 overflow-hidden flex items-start justify-center pointer-events-none">
          <div className="absolute inset-x-0 -top-full h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${sizeStyles.font} font-sans font-bold ${numColor} tracking-tight leading-none select-none`}>
              {currentVal}
            </span>
          </div>
          {/* Subtle bottom shadow vignette */}
          <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
        </div>

        {/* MECHANICAL FLIP ANIMATION DURING NUMBER CHANGES */}
        {isFlipping && (
          <div 
            className="absolute inset-x-0 top-0 h-1/2 overflow-hidden pointer-events-none origin-bottom z-30 animate-flip-down"
            style={{
              animation: "flipTop 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards"
            }}
          >
            <div className={`w-full h-full ${cardBg} border border-b-0 relative overflow-hidden flex items-end justify-center`}>
              <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
                <span className={`${sizeStyles.font} font-sans font-bold ${numColor} tracking-tight leading-none select-none`}>
                  {prevVal}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>
        )}
      </div>

      {/* Optional Sub-Label */}
      {showLabels && label && (
        <span className={`${sizeStyles.label} font-mono uppercase font-bold tracking-widest mt-2 ${
          isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
        }`}>
          {label}
        </span>
      )}
    </div>
  );
};

export const FlipClockTimer: React.FC<FlipClockTimerProps> = ({
  timeRemaining,
  size = "md",
  themeMode = "dark",
  isPaused = false,
  showHours = true,
  showLabels = false
}) => {
  const isLight = themeMode === "light";

  // Parse "HH:MM:SS" or "MM:SS" or seconds gracefully into Hours, Minutes, Seconds
  let hours = "01";
  let minutes = "15";
  let seconds = "00";

  try {
    const parts = (timeRemaining || "").trim().split(":");
    if (parts.length === 3) {
      hours = parts[0].padStart(2, "0");
      minutes = parts[1].padStart(2, "0");
      seconds = parts[2].padStart(2, "0");
    } else if (parts.length === 2) {
      const totalMinutes = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      const hrs = Math.floor(totalMinutes / 60);
      const remainingMins = totalMinutes % 60;
      hours = hrs.toString().padStart(2, "0");
      minutes = remainingMins.toString().padStart(2, "0");
      seconds = secs.toString().padStart(2, "0");
    }
  } catch {
    hours = "01";
    minutes = "15";
    seconds = "00";
  }

  // Spacing & colon dot sizes
  const colonStyles = {
    sm: {
      container: "flex flex-col items-center justify-center gap-2 mx-1 sm:mx-1.5",
      dot: "w-1.5 h-1.5 rounded-full"
    },
    md: {
      container: "flex flex-col items-center justify-center gap-2.5 sm:gap-3 mx-1.5 sm:mx-2.5",
      dot: "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
    },
    lg: {
      container: "flex flex-col items-center justify-center gap-3 sm:gap-4 mx-2 sm:mx-3.5",
      dot: "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
    },
    xl: {
      container: "flex flex-col items-center justify-center gap-3 sm:gap-5 mx-2 sm:mx-3.5",
      dot: "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full"
    },
    "2xl": {
      container: "flex flex-col items-center justify-center gap-3 sm:gap-6 md:gap-8 lg:gap-10 mx-2 sm:mx-4 md:mx-6 lg:mx-8",
      dot: "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full"
    }
  }[size];

  // Colon dot styling: soft glowing violet in dark theme, brand terracotta in light theme
  const dotColor = isLight 
    ? "bg-[#C96F55]" 
    : "bg-[#C4B5FD] shadow-[0_0_10px_rgba(168,85,247,0.7)]";

  return (
    <div className="flex items-center justify-center select-none py-1">
      {/* 1. HOURS UNIT CARD (As shown in screenshot: '01') */}
      {showHours && (
        <>
          <FlipCardUnit 
            value={hours} 
            label="Hours" 
            size={size} 
            isLight={isLight} 
            showLabels={showLabels} 
          />

          {/* First Colon Separator */}
          <div className={colonStyles.container}>
            <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-35" : "animate-pulse"}`} />
            <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-35" : "animate-pulse"}`} />
          </div>
        </>
      )}

      {/* 2. MINUTES UNIT CARD (As shown in screenshot: '15') */}
      <FlipCardUnit 
        value={minutes} 
        label="Minutes" 
        size={size} 
        isLight={isLight} 
        showLabels={showLabels} 
      />

      {/* Second Colon Separator */}
      <div className={colonStyles.container}>
        <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-35" : "animate-pulse"}`} />
        <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-35" : "animate-pulse"}`} />
      </div>

      {/* 3. SECONDS UNIT CARD (As shown in screenshot: '00') */}
      <FlipCardUnit 
        value={seconds} 
        label="Seconds" 
        size={size} 
        isLight={isLight} 
        showLabels={showLabels} 
      />
    </div>
  );
};

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
  const [displayedVal, setDisplayedVal] = useState(value);
  const [prevVal, setPrevVal] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (value !== displayedVal) {
      setPrevVal(displayedVal);
      setDisplayedVal(value);
      setIsFlipping(true);
      setFlipKey(k => (k + 1) % 10000);
      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 430);
      return () => clearTimeout(timer);
    }
  }, [value, displayedVal]);

  // Dimension presets matching proportions
  const sizeStyles = {
    sm: {
      card: "w-14 sm:w-16 h-[4.5rem] sm:h-20",
      font: "text-2xl sm:text-3xl",
      rounded: "rounded-xl sm:rounded-2xl",
      roundedTop: "rounded-t-xl sm:rounded-t-2xl",
      roundedBottom: "rounded-b-xl sm:rounded-b-2xl",
      divider: "h-[1px]",
      label: "text-[8px] sm:text-[9px]"
    },
    md: {
      card: "w-16 sm:w-20 md:w-24 h-20 sm:h-24 md:h-28",
      font: "text-3xl sm:text-4xl md:text-5xl",
      rounded: "rounded-2xl md:rounded-3xl",
      roundedTop: "rounded-t-2xl md:rounded-t-3xl",
      roundedBottom: "rounded-b-2xl md:rounded-b-3xl",
      divider: "h-[1.5px]",
      label: "text-[9px] sm:text-[10px]"
    },
    lg: {
      card: "w-20 sm:w-28 md:w-32 h-24 sm:h-32 md:h-36",
      font: "text-4xl sm:text-5xl md:text-6xl",
      rounded: "rounded-2xl sm:rounded-3xl",
      roundedTop: "rounded-t-2xl sm:rounded-t-3xl",
      roundedBottom: "rounded-b-2xl sm:rounded-b-3xl",
      divider: "h-[2px]",
      label: "text-[10px] sm:text-xs"
    },
    xl: {
      card: "w-24 sm:w-36 md:w-44 h-[7.5rem] sm:h-44 md:h-52",
      font: "text-4xl sm:text-6xl md:text-7xl",
      rounded: "rounded-2xl sm:rounded-3xl",
      roundedTop: "rounded-t-2xl sm:rounded-t-3xl",
      roundedBottom: "rounded-b-2xl sm:rounded-b-3xl",
      divider: "h-[2px]",
      label: "text-[10px] sm:text-xs"
    },
    "2xl": {
      card: "w-24 sm:w-36 md:w-52 lg:w-64 xl:w-72 h-32 sm:h-48 md:h-64 lg:h-80 xl:h-96",
      font: "text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] xl:text-[8.5rem]",
      rounded: "rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] lg:rounded-[3rem]",
      roundedTop: "rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2.5rem] lg:rounded-t-[3rem]",
      roundedBottom: "rounded-b-2xl sm:rounded-b-3xl md:rounded-b-[2.5rem] lg:rounded-b-[3rem]",
      divider: "h-[2px] sm:h-[2.5px] lg:h-[3px]",
      label: "text-[10px] sm:text-xs md:text-sm"
    }
  }[size];

  // Colors matching the cosmic obsidian dark theme and light theme
  const cardBg = isLight 
    ? "bg-gradient-to-b from-[#FFFFFF] to-[#F3EFE9]"
    : "bg-gradient-to-b from-[#161028] to-[#0D081B]";

  const cardBorder = isLight 
    ? "border-[#D8D4CA]" 
    : "border-white/10";

  const cardShadow = isLight
    ? "shadow-md shadow-black/5"
    : "shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)]";

  const numColor = isLight ? "text-[#1D1D1B]" : "text-white";
  const dividerColor = isLight ? "bg-[#C4BFB4]" : "bg-black/90 shadow-[0_1px_0_rgba(255,255,255,0.06)]";
  const hingeColor = isLight ? "bg-[#C4BFB4]" : "bg-black/80 border border-white/5";

  return (
    <div className="flex flex-col items-center">
      {/* 2-Digit Split-Flap Card */}
      <div 
        className={`relative ${sizeStyles.card} ${cardBg} ${cardBorder} border ${cardShadow} ${sizeStyles.rounded} select-none`}
        style={{ 
          perspective: "1000px",
          WebkitPerspective: "1000px"
        }}
      >
        {/* LAYER 1: STATIC TOP HALF (Always displays the new/current digit) */}
        <div className={`absolute inset-x-0 top-0 h-1/2 ${sizeStyles.roundedTop} overflow-hidden pointer-events-none`}>
          <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${sizeStyles.font} font-sans font-bold ${numColor} tracking-tight leading-none select-none`}>
              {displayedVal}
            </span>
          </div>
          {/* Subtle top ambient specular light */}
          <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        </div>

        {/* LAYER 2: STATIC BOTTOM HALF (Displays OLD value during flip, NEW value when idle) */}
        <div className={`absolute inset-x-0 bottom-0 h-1/2 ${sizeStyles.roundedBottom} overflow-hidden pointer-events-none`}>
          <div className="absolute inset-x-0 -top-full h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${sizeStyles.font} font-sans font-bold ${numColor} tracking-tight leading-none select-none`}>
              {isFlipping ? prevVal : displayedVal}
            </span>
          </div>
          {/* Subtle bottom shadow vignette */}
          <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
        </div>

        {/* LAYER 3: CENTER HORIZONTAL SPLIT GROOVE & MECHANICAL HINGE BRACKETS */}
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${sizeStyles.divider} ${dividerColor} z-20 pointer-events-none`} />
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-3 sm:h-4 ${hingeColor} rounded-r-xs z-35 pointer-events-none shadow-xs`} />
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-3 sm:h-4 ${hingeColor} rounded-l-xs z-35 pointer-events-none shadow-xs`} />

        {/* LAYER 4: MECHANICAL FLIPPING LEAVES (Rendered during active transition) */}
        {isFlipping && (
          <React.Fragment key={flipKey}>
            {/* 4A. TOP FLAP FALLING DOWNWARD (Displays OLD digit, rotates 0deg to -90deg) */}
            <div 
              className={`absolute inset-x-0 top-0 h-1/2 ${cardBg} ${cardBorder} border-t border-x ${sizeStyles.roundedTop} overflow-hidden flap-fold-top z-30 pointer-events-none`}
            >
              <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
                <span className={`${sizeStyles.font} font-sans font-bold ${numColor} tracking-tight leading-none select-none`}>
                  {prevVal}
                </span>
              </div>
              {/* Specular sheen */}
              <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              {/* Gravitational shadow darkening on fold */}
              <div 
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ animation: "flapShadowDarken 0.20s cubic-bezier(0.38, 0, 0.65, 0.25) forwards" }}
              />
            </div>

            {/* 4B. BOTTOM FLAP UNFOLDING DOWNWARD (Displays NEW digit, rotates 90deg to 0deg) */}
            <div 
              className={`absolute inset-x-0 bottom-0 h-1/2 ${cardBg} ${cardBorder} border-b border-x ${sizeStyles.roundedBottom} overflow-hidden flap-unfold-bottom z-40 pointer-events-none`}
            >
              <div className="absolute inset-x-0 -top-full h-[200%] flex items-center justify-center pointer-events-none">
                <span className={`${sizeStyles.font} font-sans font-bold ${numColor} tracking-tight leading-none select-none`}>
                  {displayedVal}
                </span>
              </div>
              {/* Bottom vignette */}
              <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
              {/* Shadow lightening on landing */}
              <div 
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ animation: "flapShadowLighten 0.22s cubic-bezier(0.15, 0.85, 0.35, 1.15) 0.18s both" }}
              />
            </div>
          </React.Fragment>
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
  let hours = "00";
  let minutes = "25";
  let seconds = "00";

  try {
    const raw = (timeRemaining || "").trim();
    const parts = raw.split(":");
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
    hours = "00";
    minutes = "25";
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
      {/* 1. HOURS UNIT CARD */}
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

      {/* 2. MINUTES UNIT CARD */}
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

      {/* 3. SECONDS UNIT CARD */}
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

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
  value: string;
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
      setFlipKey((k) => (k + 1) % 10000);
      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 380);
      return () => clearTimeout(timer);
    }
  }, [value, displayedVal]);

  // Responsive, overflow-safe dimension presets
  const sizeStyles = {
    sm: {
      card: "w-14 sm:w-16 h-16 sm:h-18",
      font: "text-2xl sm:text-3xl",
      rounded: "rounded-xl",
      roundedTop: "rounded-t-xl",
      roundedBottom: "rounded-b-xl",
      divider: "h-[1px]",
      label: "text-[10px]"
    },
    md: {
      card: "w-16 sm:w-20 h-20 sm:h-24",
      font: "text-3xl sm:text-4xl",
      rounded: "rounded-xl sm:rounded-2xl",
      roundedTop: "rounded-t-xl sm:rounded-t-2xl",
      roundedBottom: "rounded-b-xl sm:rounded-b-2xl",
      divider: "h-[1px]",
      label: "text-[10px]"
    },
    lg: {
      card: "w-20 sm:w-28 md:w-32 h-24 sm:h-32 md:h-36",
      font: "text-4xl sm:text-5xl md:text-6xl",
      rounded: "rounded-2xl",
      roundedTop: "rounded-t-2xl",
      roundedBottom: "rounded-b-2xl",
      divider: "h-[1.5px]",
      label: "text-xs"
    },
    xl: {
      card: "w-20 sm:w-32 md:w-40 h-24 sm:h-36 md:h-44",
      font: "text-4xl sm:text-6xl md:text-7xl",
      rounded: "rounded-2xl sm:rounded-3xl",
      roundedTop: "rounded-t-2xl sm:rounded-t-3xl",
      roundedBottom: "rounded-b-2xl sm:rounded-b-3xl",
      divider: "h-[1.5px]",
      label: "text-xs"
    },
    "2xl": {
      card: "w-24 sm:w-36 md:w-48 h-28 sm:h-40 md:h-52",
      font: "text-4xl sm:text-6xl md:text-7xl",
      rounded: "rounded-2xl sm:rounded-3xl",
      roundedTop: "rounded-t-2xl sm:rounded-t-3xl",
      roundedBottom: "rounded-b-2xl sm:rounded-b-3xl",
      divider: "h-[2px]",
      label: "text-xs"
    }
  }[size];

  const cardBg = isLight
    ? "bg-[#FFFFFF]"
    : "bg-[#222938]";

  const cardBorder = isLight
    ? "border-[#CBD2E0]"
    : "border-[#364054]";

  const cardShadow = isLight
    ? "shadow-xs"
    : "shadow-md";

  const numColor = isLight ? "text-[#18202B]" : "text-[#F1F3F8]";
  const dividerColor = isLight ? "bg-[#E2E6EF]" : "bg-[#10131A]/70";
  const hingeColor = isLight ? "bg-[#CBD2E0]" : "bg-[#364054]";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${sizeStyles.card} ${cardBg} ${cardBorder} border ${cardShadow} ${sizeStyles.rounded} select-none`}
        style={{ perspective: "900px" }}
      >
        {/* Static Top Half */}
        <div className={`absolute inset-x-0 top-0 h-1/2 ${sizeStyles.roundedTop} overflow-hidden pointer-events-none`}>
          <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${sizeStyles.font} font-mono font-bold tabular-nums ${numColor} tracking-tight leading-none`}>
              {displayedVal}
            </span>
          </div>
        </div>

        {/* Static Bottom Half */}
        <div className={`absolute inset-x-0 bottom-0 h-1/2 ${sizeStyles.roundedBottom} overflow-hidden pointer-events-none`}>
          <div className="absolute inset-x-0 -top-full h-[200%] flex items-center justify-center pointer-events-none">
            <span className={`${sizeStyles.font} font-mono font-bold tabular-nums ${numColor} tracking-tight leading-none`}>
              {isFlipping ? prevVal : displayedVal}
            </span>
          </div>
        </div>

        {/* Center Split Line & Hinges */}
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${sizeStyles.divider} ${dividerColor} z-20 pointer-events-none`} />
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2.5 ${hingeColor} rounded-r-xs z-30 pointer-events-none`} />
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2.5 ${hingeColor} rounded-l-xs z-30 pointer-events-none`} />

        {/* Flipping Leaves */}
        {isFlipping && (
          <React.Fragment key={flipKey}>
            <div
              className={`absolute inset-x-0 top-0 h-1/2 ${cardBg} ${cardBorder} border-t border-x ${sizeStyles.roundedTop} overflow-hidden flap-fold-top z-30 pointer-events-none`}
            >
              <div className="absolute inset-x-0 top-0 h-[200%] flex items-center justify-center pointer-events-none">
                <span className={`${sizeStyles.font} font-mono font-bold tabular-nums ${numColor} tracking-tight leading-none`}>
                  {prevVal}
                </span>
              </div>
            </div>

            <div
              className={`absolute inset-x-0 bottom-0 h-1/2 ${cardBg} ${cardBorder} border-b border-x ${sizeStyles.roundedBottom} overflow-hidden flap-unfold-bottom z-40 pointer-events-none`}
            >
              <div className="absolute inset-x-0 -top-full h-[200%] flex items-center justify-center pointer-events-none">
                <span className={`${sizeStyles.font} font-mono font-bold tabular-nums ${numColor} tracking-tight leading-none`}>
                  {displayedVal}
                </span>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>

      {showLabels && label && (
        <span
          className={`${sizeStyles.label} font-mono uppercase font-semibold tracking-wider mt-1.5 ${
            isLight ? "text-[#596474]" : "text-[#B7C0CF]"
          }`}
        >
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

  const colonStyles = {
    sm: {
      container: "flex flex-col items-center justify-center gap-1.5 mx-1 sm:mx-1.5",
      dot: "w-1.5 h-1.5 rounded-full"
    },
    md: {
      container: "flex flex-col items-center justify-center gap-2 mx-1.5 sm:mx-2",
      dot: "w-2 h-2 rounded-full"
    },
    lg: {
      container: "flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 mx-1.5 sm:mx-3",
      dot: "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
    },
    xl: {
      container: "flex flex-col items-center justify-center gap-3 sm:gap-4 mx-1.5 sm:mx-3",
      dot: "w-2 h-2 sm:w-3 sm:h-3 rounded-full"
    },
    "2xl": {
      container: "flex flex-col items-center justify-center gap-3 sm:gap-5 mx-2 sm:mx-4",
      dot: "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full"
    }
  }[size];

  const dotColor = isLight ? "bg-[#5F55C8]" : "bg-[#A99BFF]";

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${hours} hours, ${minutes} minutes, ${seconds} seconds`}
      className="flex items-center justify-center select-none py-1 max-w-full"
    >
      {showHours && (
        <>
          <FlipCardUnit value={hours} label="Hours" size={size} isLight={isLight} showLabels={showLabels} />
          <div className={colonStyles.container} aria-hidden="true">
            <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-40" : ""}`} />
            <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-40" : ""}`} />
          </div>
        </>
      )}

      <FlipCardUnit value={minutes} label="Minutes" size={size} isLight={isLight} showLabels={showLabels} />

      <div className={colonStyles.container} aria-hidden="true">
        <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-40" : ""}`} />
        <div className={`${colonStyles.dot} ${dotColor} ${isPaused ? "opacity-40" : ""}`} />
      </div>

      <FlipCardUnit value={seconds} label="Seconds" size={size} isLight={isLight} showLabels={showLabels} />
    </div>
  );
};

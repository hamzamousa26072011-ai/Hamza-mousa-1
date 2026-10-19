import React from "react";

interface CyberWaveBackgroundProps {
  isLight?: boolean;
}

/**
 * Calm, distraction-free surface backdrop.
 * Removes glowing purple fog, ambient neon blurs, and noisy grids
 * in favor of a quiet academic canvas in both light and dark modes.
 */
export const CyberWaveBackground: React.FC<CyberWaveBackgroundProps> = ({ isLight = false }) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none -z-10 transition-colors duration-200 ${
        isLight ? "bg-[#F6F7FA]" : "bg-[#10131A]"
      }`}
    />
  );
};

import React from "react";

interface EngezBrandLogoProps {
  themeMode?: "light" | "dark";
  className?: string;
  size?: number | string;
  withContainer?: boolean;
}

export const EngezBrandLogo: React.FC<EngezBrandLogoProps> = ({
  themeMode = "dark",
  className = "w-full h-full",
  size,
  withContainer = true
}) => {
  const isLight = themeMode === "light";

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      width={size || "100%"} 
      height={size || "100%"} 
      fill="none"
      className={className}
      aria-label="Engez Nafsak Logo"
    >
      <defs>
        {/* Aesthetic Velvet Obsidian & Royal Iris Brand Gradients */}
        <linearGradient id="engez-dark-flame-brand" x1="256" y1="208" x2="256" y2="348" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="28%" stopColor="#C084FC" />
          <stop offset="65%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>

        <linearGradient id="engez-dark-border-brand" x1="16" y1="16" x2="496" y2="496" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C084FC" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#8B5CF6" stopOpacity="0.50" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.65" />
        </linearGradient>

        <radialGradient id="engez-dark-bg-brand" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#181C30" />
          <stop offset="55%" stopColor="#101322" />
          <stop offset="100%" stopColor="#08090E" />
        </radialGradient>

        {/* Soft luminous brand glow filter */}
        <filter id="engez-dark-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Squircle Container */}
      {withContainer && (
        isLight ? (
          <rect 
            x="16" 
            y="16" 
            width="480" 
            height="480" 
            rx="104" 
            fill="#FAF8F5" 
            stroke="#E8D7C9" 
            strokeWidth="4" 
          />
        ) : (
          <g>
            <rect 
              x="16" 
              y="16" 
              width="480" 
              height="480" 
              rx="104" 
              fill="url(#engez-dark-bg-brand)" 
              stroke="url(#engez-dark-border-brand)" 
              strokeWidth="4" 
            />
          </g>
        )
      )}

      {/* Brand Mark Geometry */}
      <g id="engez-brand-mark" transform="translate(0, 10)">
        {/* 1. Radiating Sunburst Rays */}
        {/* Top Center Ray: Vibrant Violet (#A855F7) */}
        <line 
          x1="256" 
          y1="88" 
          x2="256" 
          y2="124" 
          stroke={isLight ? "#C96F55" : "#C084FC"} 
          strokeWidth="12" 
          strokeLinecap="round" 
        />
        
        {/* Top-Left Diagonal Ray: Starlight Lavender (#C4B5FD) */}
        <line 
          x1="204" 
          y1="116" 
          x2="224" 
          y2="134" 
          stroke={isLight ? "#DEBAA2" : "#A855F7"} 
          strokeWidth="11" 
          strokeLinecap="round" 
        />
        
        {/* Top-Right Diagonal Ray: Starlight Lavender (#C4B5FD) */}
        <line 
          x1="308" 
          y1="116" 
          x2="288" 
          y2="134" 
          stroke={isLight ? "#DEBAA2" : "#A855F7"} 
          strokeWidth="11" 
          strokeLinecap="round" 
        />
        
        {/* Far-Left Horizontal Ray: Crisp White (#F8FAFC) */}
        <line 
          x1="182" 
          y1="156" 
          x2="204" 
          y2="160" 
          stroke={isLight ? "#1D1D1B" : "#F8FAFC"} 
          strokeWidth="11" 
          strokeLinecap="round" 
        />
        
        {/* Far-Right Horizontal Ray: Crisp White (#F8FAFC) */}
        <line 
          x1="330" 
          y1="156" 
          x2="308" 
          y2="160" 
          stroke={isLight ? "#1D1D1B" : "#F8FAFC"} 
          strokeWidth="11" 
          strokeLinecap="round" 
        />

        {/* 2. Dynamic Upward Accomplishment Arrow: Pure Crisp White (#FFFFFF) */}
        <path 
          d="M 256 142 
             L 286 182 
             L 266 182 
             L 266 210 
             L 246 210 
             L 246 182 
             L 226 182 
             Z" 
          fill={isLight ? "#1D1D1B" : "#FFFFFF"} 
          stroke={isLight ? "#1D1D1B" : "#FFFFFF"} 
          strokeWidth="2" 
          strokeLinejoin="round" 
        />

        {/* 3. Central Flame / Bulb of Mastery */}
        <path 
          d="M 246 208 
             C 246 226, 204 246, 200 278 
             C 196 308, 230 334, 256 348 
             C 282 334, 316 308, 312 278 
             C 308 246, 266 226, 266 208 
             Z" 
          fill={isLight ? "#C96F55" : "url(#engez-dark-flame-brand)"} 
          stroke={isLight ? "#B85C42" : "#E9D5FF"}
          strokeWidth={isLight ? "0" : "1.5"}
        />

        {/* 4. Open Book Pages */}
        {/* Left Page Wing */}
        <path 
          d="M 112 328 
             C 152 326, 196 338, 236 352 
             C 236 358, 230 364, 222 366 
             C 180 364, 138 354, 106 342 
             C 107 334, 109 330, 112 328 
             Z" 
          fill={isLight ? "#DEBAA2" : "#A1A1AA"} 
          stroke={isLight ? "#CCA389" : "#71717A"} 
          strokeWidth="1.5" 
        />

        {/* Right Page Wing */}
        <path 
          d="M 400 328 
             C 360 326, 316 338, 276 352 
             C 276 358, 282 364, 290 366 
             C 332 364, 374 354, 406 342 
             C 405 334, 403 330, 400 328 
             Z" 
          fill={isLight ? "#DEBAA2" : "#A1A1AA"} 
          stroke={isLight ? "#CCA389" : "#71717A"} 
          strokeWidth="1.5" 
        />

        {/* 5. Minimalist Foundation Line / Book Base */}
        <path 
          d="M 96 350 
             C 142 376, 202 378, 256 360 
             C 310 378, 370 376, 416 350" 
          fill="none" 
          stroke={isLight ? "#1D1D1B" : "#FFFFFF"} 
          strokeWidth="16" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </g>
    </svg>
  );
};

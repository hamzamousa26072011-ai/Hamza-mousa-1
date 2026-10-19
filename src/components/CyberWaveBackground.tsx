import React from "react";

interface CyberWaveBackgroundProps {
  isLight?: boolean;
}

export const CyberWaveBackground: React.FC<CyberWaveBackgroundProps> = ({ isLight = false }) => {
  if (isLight) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#FBF9F5] transform-gpu will-change-transform">
        {/* Soft, warm architectural ambient blooms */}
        <div 
          className="absolute -top-[10%] right-[15%] w-[420px] sm:w-[650px] md:w-[750px] h-[350px] sm:h-[500px] md:h-[600px] rounded-full blur-3xl sm:blur-[100px] md:blur-[140px] opacity-60"
          style={{
            background: "radial-gradient(circle at center, rgba(194, 94, 66, 0.08) 0%, rgba(216, 180, 152, 0.05) 50%, transparent 75%)"
          }}
        />
        <div 
          className="absolute -bottom-[10%] left-[10%] w-[380px] sm:w-[600px] md:w-[700px] h-[300px] sm:h-[450px] md:h-[550px] rounded-full blur-3xl sm:blur-[110px] md:blur-[150px] opacity-50"
          style={{
            background: "radial-gradient(circle at center, rgba(216, 180, 152, 0.09) 0%, rgba(194, 94, 66, 0.04) 45%, transparent 75%)"
          }}
        />

        {/* Micro-architectural precision grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1A1614 1px, transparent 1px),
              linear-gradient(to bottom, #1A1614 1px, transparent 1px)
            `,
            backgroundSize: "52px 52px"
          }}
        />

        {/* Subtle warm contour curves */}
        <svg 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-[0.18]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <path d="M -100 280 C 400 360, 950 200, 1540 280" fill="none" stroke="#C25E42" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M -100 480 C 500 560, 1000 380, 1540 500" fill="none" stroke="#D8B498" strokeWidth="0.8" />
        </svg>
      </div>
    );
  }

  // VELVET OBSIDIAN & ROYAL IRIS DARK CANVAS
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#090A10] transform-gpu will-change-transform"
      style={{
        backgroundColor: "#090A10"
      }}
    >
      {/* 1. Luminous Cosmic Violet & Starlight Amethyst Nebulas */}
      {/* Top Center-Right: Royal Iris Bloom */}
      <div 
        className="absolute -top-[15%] right-[10%] w-[480px] sm:w-[750px] md:w-[950px] h-[380px] sm:h-[550px] md:h-[700px] rounded-full pointer-events-none blur-3xl sm:blur-[120px] md:blur-[160px] opacity-75"
        style={{
          background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.16) 0%, rgba(192, 132, 252, 0.09) 40%, transparent 70%)"
        }}
      />
      
      {/* Bottom Center-Left: Deep Indigo & Celestial Amethyst */}
      <div 
        className="absolute -bottom-[15%] left-[5%] w-[420px] sm:w-[700px] md:w-[880px] h-[350px] sm:h-[500px] md:h-[650px] rounded-full pointer-events-none blur-3xl sm:blur-[120px] md:blur-[160px] opacity-65"
        style={{
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.14) 0%, rgba(168, 85, 247, 0.08) 45%, transparent 75%)"
        }}
      />

      {/* 2. Micro-precision architectural grid with velvet depth */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #C084FC 1px, transparent 1px),
            linear-gradient(to bottom, #C084FC 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px"
        }}
      />

      {/* 3. Minimalist Horizon Contour & Focus Geometry (Ultra-fine vector lines) */}
      <svg 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-[0.35]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="irisLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.0" />
            <stop offset="25%" stopColor="#A855F7" stopOpacity="0.5" />
            <stop offset="65%" stopColor="#C084FC" stopOpacity="0.7" />
            <stop offset="85%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="irisDepthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Quiet, architectural horizon arcs */}
        <path d="M -100 280 C 400 360, 950 200, 1540 280" fill="none" stroke="url(#irisLineGrad)" strokeWidth="1" />
        <path d="M -100 420 C 500 520, 1000 360, 1540 440" fill="none" stroke="url(#irisDepthGrad)" strokeWidth="0.8" />
        <path d="M -100 600 C 450 680, 1050 540, 1540 620" fill="none" stroke="url(#irisLineGrad)" strokeWidth="0.6" />
      </svg>

      {/* 4. Elegant Focus Vignette: Subtle edge grounding */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, transparent 55%, rgba(9, 10, 16, 0.75) 100%)"
        }}
      />
    </div>
  );
};

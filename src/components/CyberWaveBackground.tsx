import React from "react";

interface CyberWaveBackgroundProps {
  isLight?: boolean;
}

export const CyberWaveBackground: React.FC<CyberWaveBackgroundProps> = ({ isLight = false }) => {
  if (isLight) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#F7F6F2]">
        {/* Subtle warm ambient glows for light mode */}
        <div className="absolute top-12 left-12 w-[450px] h-[450px] bg-[#C96F55]/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-16 right-16 w-[500px] h-[500px] bg-[#DFC0A9]/10 rounded-full blur-[140px]" />
        {/* Subtle architectural grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1D1D1B 1px, transparent 1px),
              linear-gradient(to bottom, #1D1D1B 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px"
          }}
        />
      </div>
    );
  }

  // EXACT REPRODUCTION OF THE "RIDE THE CREATIVE WAVE" LANDING TEMPLATE REFERENCE
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-black"
      style={{
        backgroundColor: "#000000"
      }}
    >
      {/* 1. DEEP VIOLET & PURPLE AMBIENT BLOOM (Bottom Right & Center Radiant Glow) */}
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[900px] sm:w-[1100px] h-[650px] sm:h-[800px] rounded-full pointer-events-none blur-[140px] opacity-80"
        style={{
          background: "radial-gradient(ellipse at 60% 70%, rgba(139, 92, 246, 0.45) 0%, rgba(124, 58, 237, 0.35) 30%, rgba(76, 29, 149, 0.20) 60%, transparent 80%)"
        }}
      />
      
      {/* Center Subtle Violet Ambience */}
      <div 
        className="absolute top-[40%] left-[30%] w-[600px] h-[400px] rounded-full pointer-events-none blur-[150px] opacity-35"
        style={{
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)"
        }}
      />

      {/* 2. AUTHENTIC 3D CONCAVE CYBER WAVE WIREFRAME MESH (Matching reference screenshot) */}
      <svg 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Subtle Grid Line Shimmer Gradient */}
          <linearGradient id="gridWireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="75%" stopColor="#C4B5FD" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.35" />
          </linearGradient>

          {/* Glowing Ring Radial Gradient (Top Right) */}
          <radialGradient id="ringTopGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="70%" stopColor="transparent" stopOpacity="0" />
            <stop offset="88%" stopColor="#A855F7" stopOpacity="0.3" />
            <stop offset="97%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* --- CONCAVE HORIZONTAL CURVED ARCS (Curving downwards across the stadium mesh) --- */}
        <path d="M -80 60 Q 720 180 1520 60" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.1" />
        <path d="M -80 130 Q 720 260 1520 130" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.15" />
        <path d="M -80 215 Q 720 355 1520 215" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.2" />
        <path d="M -80 315 Q 720 465 1520 315" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.25" />
        <path d="M -80 430 Q 720 590 1520 430" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.3" />
        <path d="M -80 560 Q 720 730 1520 560" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.4" />
        <path d="M -80 705 Q 720 885 1520 705" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.5" />
        <path d="M -80 860 Q 720 1050 1520 860" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.6" />

        {/* --- VERTICAL MERIDIAN PERSPECTIVE LINES (Bowing gently towards the horizon) --- */}
        <path d="M 720 -50 L 720 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.3" />
        
        {/* Inner meridians */}
        <path d="M 610 -50 Q 660 450 560 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.2" />
        <path d="M 830 -50 Q 780 450 880 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.2" />

        <path d="M 500 -50 Q 590 450 410 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.2" />
        <path d="M 940 -50 Q 850 450 1030 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.2" />

        <path d="M 380 -50 Q 510 450 250 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.15" />
        <path d="M 1060 -50 Q 930 450 1190 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.15" />

        {/* Outer meridians */}
        <path d="M 250 -50 Q 420 450 80 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.1" />
        <path d="M 1190 -50 Q 1020 450 1360 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.1" />

        <path d="M 110 -50 Q 320 450 -100 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.0" />
        <path d="M 1330 -50 Q 1120 450 1540 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="1.0" />

        <path d="M -30 -50 Q 210 450 -290 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="0.9" />
        <path d="M 1470 -50 Q 1230 450 1730 950" fill="none" stroke="url(#gridWireGradient)" strokeWidth="0.9" />
      </svg>

      {/* 3. TOP RIGHT 3D GLOWING TORUS / RING (As in Reference Screenshot) */}
      <div 
        className="absolute top-[16%] right-[14%] sm:right-[18%] w-[150px] sm:w-[210px] h-[150px] sm:h-[210px] rounded-full pointer-events-none"
        style={{
          border: "14px solid rgba(255, 255, 255, 0.95)",
          borderBottomColor: "#A855F7",
          borderLeftColor: "#C084FC",
          boxShadow: "0 0 35px rgba(255, 255, 255, 0.8), 0 0 70px rgba(168, 85, 247, 0.65), inset 0 0 25px rgba(192, 132, 252, 0.45)",
          transform: "rotate(-18deg) rotateX(25deg)",
          opacity: 0.95
        }}
      >
        {/* Soft internal rim highlight */}
        <div className="absolute inset-1 rounded-full border border-white/40" />
      </div>

      {/* 4. BOTTOM LEFT 3D GLOWING TORUS / RING (As in Reference Screenshot) */}
      <div 
        className="absolute -bottom-[8%] left-[4%] sm:left-[8%] w-[240px] sm:w-[320px] h-[240px] sm:h-[320px] rounded-full pointer-events-none"
        style={{
          border: "22px solid rgba(255, 255, 255, 0.92)",
          borderTopColor: "#E9D5FF",
          borderBottomColor: "#7C3AED",
          borderRightColor: "#A855F7",
          boxShadow: "0 0 45px rgba(255, 255, 255, 0.7), 0 0 90px rgba(147, 51, 234, 0.7), inset 0 0 35px rgba(168, 85, 247, 0.5)",
          transform: "rotate(35deg) rotateX(48deg) rotateY(-15deg)",
          opacity: 0.9
        }}
      >
        <div className="absolute inset-1.5 rounded-full border border-white/50" />
      </div>

      {/* 5. BOTTOM RIGHT GIANT VOLUMETRIC GLOWING PURPLE PLANET / SPHERE (As in Reference Screenshot) */}
      <div 
        className="absolute -bottom-[22%] sm:-bottom-[18%] -right-[8%] sm:right-[3%] w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle at 40% 30%, #E9D5FF 0%, #C084FC 14%, #9333EA 36%, #6B21A8 62%, #3B0764 85%, #17032B 100%)",
          boxShadow: "0 0 120px rgba(147, 51, 234, 0.75), 0 0 60px rgba(192, 132, 252, 0.5), inset -20px -20px 60px rgba(15, 3, 30, 0.9), inset 15px 15px 35px rgba(255, 255, 255, 0.6)",
          opacity: 0.95
        }}
      >
        {/* Atmospheric outer glow aura */}
        <div className="absolute -inset-8 rounded-full bg-purple-600/30 blur-[40px] pointer-events-none" />
      </div>

      {/* 6. FOUR-POINT RETRO STARBURSTS / SPARKLES (Matching the reference frame corners) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-left corner primary sparkle */}
        <g transform="translate(65, 80) scale(0.85)" stroke="#FFFFFF" strokeWidth="2.0" fill="#FFFFFF" opacity="0.9">
          <path d="M 0 -28 Q 0 0 28 0 Q 0 0 0 28 Q 0 0 -28 0 Q 0 0 0 -28" />
        </g>
        {/* Top-left secondary smaller sparkle */}
        <g transform="translate(130, 45) scale(0.5)" stroke="#E9D5FF" strokeWidth="1.8" fill="#E9D5FF" opacity="0.75">
          <path d="M 0 -24 Q 0 0 24 0 Q 0 0 0 24 Q 0 0 -24 0 Q 0 0 0 -24" />
        </g>
        {/* Bottom-right sparkle */}
        <g transform="translate(1380, 840) scale(0.75)" stroke="#FFFFFF" strokeWidth="2.0" fill="#FFFFFF" opacity="0.85">
          <path d="M 0 -26 Q 0 0 26 0 Q 0 0 0 26 Q 0 0 -26 0 Q 0 0 0 -26" />
        </g>
      </svg>

      {/* 7. CINEMATIC VIGNETTE (Keeps focus crisp and black around edges) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.55) 100%)"
        }}
      />
    </div>
  );
};

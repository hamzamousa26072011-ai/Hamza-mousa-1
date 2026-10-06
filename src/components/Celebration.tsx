import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, CheckCircle, Sparkles, X, Flame } from "lucide-react";

interface CelebrationProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function Celebration({ isVisible, onClose }: CelebrationProps) {
  const [arabicTextIndex, setArabicTextIndex] = useState(0);

  const celebratoryTexts = [
    { ar: "شاطوووور! 🏆", en: "Excellent work! Keep climbing, ya basha!" },
    { ar: "إنجز نفسك.. يا بطل! 💪", en: "Finish early, play harder. You are unstoppable!" },
    { ar: "القمة بإذن الله 🚀", en: "The top awaits. Success is a decision!" },
    { ar: "الله ينور عليك يا فنان! ✨", en: "Absolutely marvelous calculation speed!" },
    { ar: "وحش الإمتحانات 🎯", en: "You are mastering those Cambridge structures!" }
  ];

  useEffect(() => {
    if (isVisible) {
      // Pick a random motivation combo
      const randomIdx = Math.floor(Math.random() * celebratoryTexts.length);
      setArabicTextIndex(randomIdx);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Confetti simulation elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  y: -50, 
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                  scale: Math.random() * 0.8 + 0.4 
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 360 + 360,
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: Math.random() * 3 + 2, 
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
                className={`absolute w-3 h-3 rounded-full ${
                  i % 3 === 0 ? "bg-indigo-500" : i % 3 === 1 ? "bg-emerald-400" : "bg-yellow-400"
                }`}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-[#0F1422] rounded-3xl border border-white/10 p-6 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/10"
          >
            {/* Soft decorative background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Corner Close Button */}
            <button
              onClick={onClose}
              id="celebrity-close-btn"
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Icon Block */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 animate-bounce">
              <Award size={32} />
            </div>

            {/* Main Header Content */}
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-900/40">
              ACADEMIC REWARD EARNED
            </span>

            {/* Large Arabic text display with gorgeous styling */}
            <h2 className="text-3xl font-black text-white tracking-wide mt-4 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              {celebratoryTexts[arabicTextIndex].ar}
            </h2>

            {/* English companion description */}
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto mb-6">
              {celebratoryTexts[arabicTextIndex].en}
            </p>

            {/* Session Milestone Indicator */}
            <div className="bg-[#151D33] border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-sm">
                <Flame size={16} className="animate-pulse" />
                <span>Focus Session Complete!</span>
              </div>
              <div className="w-1 h-4 bg-white/10" />
              <div className="text-xs text-slate-300 font-mono">
                Syllabus streak active 🔥
              </div>
            </div>

            {/* CTA Close Button */}
            <button
              onClick={onClose}
              id="celebrity-continue-btn"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all glow-indigo cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>Yalla, Keep studying!</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

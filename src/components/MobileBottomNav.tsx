import React from "react";
import { 
  LayoutGrid, 
  GraduationCap, 
  Timer, 
  Compass, 
  Settings, 
  CalendarCheck,
  CalendarClock
} from "lucide-react";

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingTasksCount?: number;
  focusModeActive: boolean;
  focusTimeRemaining: string;
  themeMode?: "light" | "dark";
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isFocus?: boolean;
  badge?: number;
}

export default function MobileBottomNav({
  currentTab,
  onTabChange,
  pendingTasksCount = 0,
  focusModeActive,
  focusTimeRemaining,
  themeMode = "dark"
}: MobileBottomNavProps) {
  const isLight = themeMode === "light";

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Home", icon: LayoutGrid, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: "countdown", label: "Exams", icon: CalendarClock },
    { id: "habits", label: "Habits", icon: CalendarCheck },
    { id: "scholar", label: "Tutor", icon: GraduationCap },
    { id: "focus", label: "Timer", icon: Timer, isFocus: true },
    { id: "apps", label: "Apps", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${
        isLight 
          ? "bg-[#FFFFFF]/98 border-t border-[#EBE4DC] text-[#1A1614] shadow-[0_-4px_20px_rgba(28,25,23,0.06)]" 
          : "bg-[#0C0E18]/98 border-t border-white/[0.1] text-white shadow-[0_-6px_28px_rgba(0,0,0,0.7)]"
      } backdrop-blur-md px-1 pt-1 safe-area-bottom select-none`}
    >
      <div className="flex items-center justify-between w-full max-w-md mx-auto gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center min-w-0 min-h-[48px] py-1 px-0.5 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                isActive 
                  ? isLight 
                    ? "bg-[#FFF2ED] text-[#C25E42] font-bold" 
                    : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/40 font-bold shadow-[0_0_12px_rgba(139,92,246,0.22)]" 
                  : isLight
                    ? "text-[#736B63] hover:text-[#1A1614]"
                    : "text-slate-400 hover:text-[#F8FAFC]"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  size={18} 
                  className={`${
                    isActive 
                      ? isLight ? "text-[#C25E42]" : "text-[#C084FC]"
                      : isLight ? "text-[#736B63]" : "text-slate-400"
                  } ${
                    item.isFocus && focusModeActive 
                      ? isLight ? "animate-pulse text-[#C25E42]" : "animate-pulse text-[#C084FC]" 
                      : ""
                  }`} 
                />
                
                {/* Dynamic Task Badge Counter */}
                {item.badge !== undefined && (
                  <span className={`absolute -top-1.5 -right-2.5 ${
                    isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"
                  } text-white text-[8px] font-mono font-black rounded-full px-1 min-w-[14px] h-[14px] flex items-center justify-center border border-white shadow-xs`}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}

                {/* Focus Active Ping Dot */}
                {item.isFocus && focusModeActive && (
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    isLight ? "bg-[#C25E42]" : "bg-[#C084FC]"
                  } animate-ping`} />
                )}
              </div>

              <span className={`text-[9.5px] mt-0.5 leading-none font-medium tracking-tight truncate w-full text-center font-sans ${
                isActive 
                  ? isLight ? "text-[#C25E42] font-bold" : "text-[#C084FC] font-bold"
                  : isLight ? "text-[#736B63]" : "text-slate-400"
              }`}>
                {item.isFocus && focusModeActive ? focusTimeRemaining : item.label}
              </span>

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <div className={`w-3.5 h-0.5 ${isLight ? "bg-[#C25E42]" : "bg-[#C084FC]"} rounded-full mt-1`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

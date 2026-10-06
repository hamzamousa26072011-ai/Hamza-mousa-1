import React from "react";
import { 
  LayoutGrid, 
  CheckSquare, 
  GraduationCap, 
  Timer, 
  Compass, 
  Settings,
  Flame,
  Clock,
  CalendarCheck,
  CalendarClock
} from "lucide-react";

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingTasksCount: number;
  focusModeActive: boolean;
  focusTimeRemaining: string;
  themeMode?: "light" | "dark";
}

export default function MobileBottomNav({
  currentTab,
  onTabChange,
  pendingTasksCount,
  focusModeActive,
  focusTimeRemaining,
  themeMode = "light"
}: MobileBottomNavProps) {
  const isLight = themeMode === "light";

  const navItems = [
    { id: "dashboard", label: "Home", icon: LayoutGrid },
    { id: "countdown", label: "Exams", icon: CalendarClock },
    { id: "matrix", label: "Tasks", icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: "habits", label: "Habits", icon: CalendarCheck },
    { id: "scholar", label: "Tutor", icon: GraduationCap },
    { id: "focus", label: "Focus", icon: Timer, isFocus: true },
    { id: "apps", label: "Apps", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${
      isLight 
        ? "bg-[#FFFFFF]/95 border-t border-[#E3E0D8] text-[#1D1D1B]" 
        : "bg-[#000000]/90 border-t border-white/10 text-white"
    } backdrop-blur-2xl px-2 py-1.5 safe-area-bottom shadow-lg`}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive 
                  ? isLight 
                    ? "bg-[#FFF1EC] text-[#C96F55] font-bold shadow-2xs" 
                    : "bg-[#C96F55]/20 text-[#E0C6B5] border border-[#C96F55]/30 font-bold shadow-2xs" 
                  : isLight
                    ? "text-[#77736B] hover:text-[#1D1D1B]"
                    : "text-[#ADA59B] hover:text-[#F6F3EE]"
              }`}
            >
              <div className="relative">
                <Icon 
                  size={20} 
                  className={`${isActive ? "text-[#C96F55]" : isLight ? "text-[#77736B]" : "text-[#ADA59B]"} ${
                    item.isFocus && focusModeActive ? "animate-pulse text-[#C96F55]" : ""
                  }`} 
                />
                
                {/* Dynamic Task Badge Counter */}
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#C96F55] text-white text-[9px] font-mono font-black rounded-full px-1.5 min-w-[15px] h-[15px] flex items-center justify-center border border-white shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}

                {/* Focus Active Ping Dot */}
                {item.isFocus && focusModeActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C96F55] animate-ping" />
                )}
              </div>

              <span className={`text-[10px] mt-0.5 font-medium tracking-tight truncate max-w-[50px] font-sans ${
                isActive 
                  ? isLight ? "text-[#C96F55] font-bold" : "text-[#E0C6B5] font-bold"
                  : isLight ? "text-[#77736B]" : "text-[#ADA59B]"
              }`}>
                {item.isFocus && focusModeActive ? focusTimeRemaining : item.label}
              </span>

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <div className={`w-4 h-0.5 bg-[#C96F55] rounded-full mt-0.5`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

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
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${
      isLight 
        ? "bg-[#FFFFFF]/95 border-t border-[#EBE4DC] text-[#1A1614] shadow-[0_-4px_16px_rgba(28,25,23,0.04)]" 
        : "bg-[#0C0E18]/95 border-t border-white/[0.08] text-white shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
    } backdrop-blur-2xl px-2 py-1.5 safe-area-bottom`}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive 
                  ? isLight 
                    ? "bg-[#FFF2ED] text-[#C25E42] font-bold shadow-2xs" 
                    : "bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/35 font-bold shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
                  : isLight
                    ? "text-[#736B63] hover:text-[#1A1614]"
                    : "text-slate-400 hover:text-[#F8FAFC]"
              }`}
            >
              <div className="relative">
                <Icon 
                  size={19} 
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
                  } text-white text-[9px] font-mono font-black rounded-full px-1.5 min-w-[15px] h-[15px] flex items-center justify-center border border-white shadow-xs`}>
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

              <span className={`text-[10px] mt-0.5 font-medium tracking-tight truncate max-w-[48px] font-sans ${
                isActive 
                  ? isLight ? "text-[#C25E42] font-bold" : "text-[#C084FC] font-bold"
                  : isLight ? "text-[#736B63]" : "text-slate-400"
              }`}>
                {item.isFocus && focusModeActive ? focusTimeRemaining : item.label}
              </span>

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <div className={`w-4 h-0.5 ${isLight ? "bg-[#C25E42]" : "bg-[#C084FC]"} rounded-full mt-0.5`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

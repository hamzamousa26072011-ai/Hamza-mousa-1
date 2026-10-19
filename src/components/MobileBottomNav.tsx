import React from "react";
import { 
  LayoutGrid, 
  BookOpen, 
  Timer, 
  Compass, 
  Settings, 
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
  focusModeActive,
  focusTimeRemaining,
  themeMode = "dark"
}: MobileBottomNavProps) {
  const isLight = themeMode === "light";

  const navItems = [
    { id: "dashboard", label: "Today", icon: LayoutGrid },
    { id: "countdown", label: "Exams", icon: CalendarClock },
    { id: "habits", label: "Habits", icon: CalendarCheck },
    { id: "scholar", label: "Tutor", icon: BookOpen },
    { id: "focus", label: "Timer", icon: Timer },
    { id: "apps", label: "Apps", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t transition-colors duration-200 safe-area-bottom ${
        isLight
          ? "bg-[#FFFFFF]/95 border-[#E2E6EF] text-[#18202B]"
          : "bg-[#191E28]/95 border-[#283040] text-[#F1F3F8]"
      } backdrop-blur-md`}
    >
      <div className="grid grid-cols-7 items-center px-1 pt-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isTimerRunning = item.id === "focus" && focusModeActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`min-h-[48px] py-1 px-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? isLight
                    ? "text-[#5F55C8] font-semibold"
                    : "text-[#A99BFF] font-semibold"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#B7C0CF] hover:text-[#F1F3F8]"
              }`}
            >
              <div
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  isActive
                    ? isLight
                      ? "bg-[#F0EEFF]"
                      : "bg-[#6D5DF6]/20"
                    : ""
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.25 : 1.85} />
              </div>
              <span className="text-[10px] leading-tight truncate max-w-full">
                {isTimerRunning ? focusTimeRemaining : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import React, { useState } from "react";
import { 
  LayoutGrid, 
  CheckSquare, 
  FolderLock, 
  GraduationCap, 
  CalendarClock, 
  CalendarCheck,
  Timer, 
  Sparkles,
  Lock,
  Compass,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogIn,
  LogOut,
  User as UserIcon,
  Loader2
} from "lucide-react";
import { User } from "firebase/auth";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  focusModeActive: boolean;
  focusTimeRemaining: string;
  currentUser: User | null;
  isAuthLoading: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isFirestoreOffline?: boolean;
  themeMode?: "light" | "dark";
}

export default function Sidebar({
  currentTab,
  onTabChange,
  focusModeActive,
  focusTimeRemaining,
  currentUser,
  isAuthLoading,
  onLogin,
  onLogout,
  isFirestoreOffline = false,
  themeMode = "light"
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "countdown", label: "Exam Countdown", icon: CalendarClock },
    { id: "matrix", label: "Your Tasks", icon: CheckSquare },
    { id: "habits", label: "Habit Tracker", icon: CalendarCheck },
    { id: "scholar", label: "Ai tutor", icon: Sparkles },
    { id: "focus", label: "Focus Time", icon: Timer },
    { id: "apps", label: "Study Apps", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isLight = themeMode === "light";

  return (
    <nav className={`hidden md:flex shrink-0 flex-col items-center py-6 lg:py-7 gap-6 lg:gap-7 ${
      isLight 
        ? "bg-[#FFFFFF] border-r border-[#E3E0D8] text-[#1D1D1B]" 
        : "bg-[#000000]/85 border-r border-white/10 text-white"
    } backdrop-blur-2xl z-20 transition-all duration-300 ${
      isCollapsed ? "w-20 md:w-20 lg:w-24" : "w-56 md:w-60 lg:w-64"
    }`}>
      
      {/* Premium Engez Logo & Expand/Collapse Toggle Row */}
      <div className={`flex items-center justify-between w-full px-4 ${isCollapsed ? "flex-col gap-4" : "flex-row"}`}>
        <button 
          onClick={() => window.location.reload()}
          className="relative group focus:outline-none cursor-pointer bg-transparent border-0 p-0 text-left"
          title="Engez Nafsak"
        >
          {isCollapsed ? (
            <div className="w-11 h-11 rounded-2xl bg-[#FAF8F5] border border-[#E8D7C9] p-1 flex items-center justify-center shadow-md transform hover:scale-105 duration-300 overflow-hidden">
              <img src="/engez_brand_emblem.svg" alt="Engez Nafsak" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="h-12 px-1 flex items-center justify-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8D7C9] p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden transform hover:scale-105 transition-transform">
                <img src="/engez_brand_emblem.svg" alt="Emblem" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`text-base font-black tracking-tight leading-tight ${isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"} font-sans`}>
                  Engez Nafsak
                </span>
                <span className="text-[11px] font-bold text-[#8B5CF6] dark:text-[#A855F7] leading-tight font-sans">
                  إنجز نفسك
                </span>
              </div>
            </div>
          )}
        </button>

        {/* Collapsible Trigger button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-xl transition cursor-pointer border shadow-2xs ${
            isLight 
              ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] text-[#77736B] hover:text-[#1D1D1B] border-[#E3E0D8]" 
              : "bg-[#161026] hover:bg-[#231B3B] text-[#C4B5FD] hover:text-[#FAF8F5] border-[#36255B]"
          }`}
          title={isCollapsed ? "Expand side menu" : "Collapse side menu"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Icon/Text Queue */}
      <div className="flex-1 flex flex-col items-center gap-2.5 w-full px-3">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              id={`sidebar-tab-btn-${item.id}`}
              title={isCollapsed ? item.label : undefined}
              className={`relative p-3 w-full h-11 rounded-xl flex items-center transition-all duration-200 group cursor-pointer border ${
                isCollapsed ? "justify-center" : "justify-start gap-3.5 px-3.5"
              } ${
                isActive 
                  ? isLight
                    ? "text-[#C96F55] bg-[#FFF1EC] border-[#E8D7C9] font-bold shadow-2xs"
                    : "text-[#C084FC] bg-[#8B5CF6]/15 border-[#8B5CF6]/40 shadow-[0_0_20px_rgba(139,92,246,0.22)] font-bold"
                  : isLight
                    ? "text-[#77736B] hover:text-[#1D1D1B] hover:bg-[#F0EEE8] border-transparent"
                    : "text-[#C4B5FD]/70 hover:text-[#FAF8F5] hover:bg-[#1B1333] border-transparent"
              }`}
            >
              <IconComponent size={19} className={isActive ? "scale-105 shrink-0 text-[#8B5CF6] dark:text-[#C084FC]" : "scale-100 group-hover:scale-105 duration-200 shrink-0 text-[#C4B5FD]/60"} />
              
              {/* If Sidebar is expanded, show the label directly beside the icon */}
              {!isCollapsed && (
                <span className={`text-xs font-sans tracking-tight block truncate ${isActive ? (isLight ? "font-bold text-[#1D1D1B]" : "font-bold text-[#FAF8F5]") : "font-medium"}`}>
                  {item.label}
                </span>
              )}

              {/* Tooltip Overlay (Only show if sidebar is collapsed) */}
              {isCollapsed && (
                <div className={`absolute left-16 md:left-20 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-left ${
                  isLight ? "bg-[#FFFFFF] text-[#1D1D1B] border-[#E3E0D8]" : "bg-[#18112C] text-[#FAF8F5] border-[#36255B]"
                } text-xs font-mono font-medium py-1.5 px-3 rounded-lg border shadow-xl whitespace-nowrap z-50 pointer-events-none`}>
                  {item.label}
                </div>
              )}

              {/* Active Indicator bar */}
              {isActive && (
                <div className={`absolute left-0 w-1 h-5 rounded-r-md ${isLight ? "bg-[#C96F55] shadow-[0_0_8px_#C96F55]" : "bg-[#8B5CF6] shadow-[0_0_12px_#8B5CF6]"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Account Profile Connection Card */}
      <div className={`w-full px-3 border-t pt-4 flex flex-col items-center gap-3 ${
        isLight ? "border-[#E3E0D8]" : "border-white/10"
      }`}>
        {isAuthLoading ? (
          <div className="py-2 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin text-[#77736B]" />
          </div>
        ) : currentUser ? (
          <div className={`w-full flex ${isCollapsed ? "flex-col items-center gap-2.5" : "flex-row items-center justify-between gap-1.5"} p-2 ${
            isLight ? "bg-[#F7F6F2] border border-[#E3E0D8]" : "bg-[#0A0714] border border-white/10 text-white"
          } rounded-xl`}>
            <div className="flex items-center gap-2 min-w-0">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || "User"} 
                  className="w-7 h-7 rounded-lg shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-7 h-7 rounded-lg ${
                  isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]" : "bg-[#C96F55]/20 text-[#DE7A5E] border border-[#C96F55]/30"
                } flex items-center justify-center shrink-0`}>
                  <UserIcon size={14} />
                </div>
              )}
              {!isCollapsed && (
                <div className="flex flex-col text-left max-w-[95px] truncate">
                  <span className={`text-[11px] font-bold ${isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"} truncate leading-tight`}>
                    {currentUser.displayName || "Student"}
                  </span>
                  {isFirestoreOffline ? (
                    <span className="text-[8px] font-mono text-amber-500 uppercase tracking-wider leading-none font-bold" title="Using local browser sandbox (Firestore offline)">
                      Sandbox
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider leading-none font-bold">
                      Synced
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={onLogout}
              className={`p-1.5 ${
                isLight ? "hover:bg-[#F5E2E2] text-[#B85C5C]" : "hover:bg-rose-500/15 text-rose-300"
              } rounded-md transition cursor-pointer flex items-center justify-center shrink-0`}
              title="Sign Out Account"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            title="Log In to save details"
            className={`w-full py-2.5 ${
              isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-[#3B82F6] hover:bg-[#2563EB] shadow-[0_0_15px_rgba(59,130,246,0.25)]"
            } text-white rounded-xl text-xs font-sans font-bold transition cursor-pointer flex items-center justify-center shadow-xs ${
              isCollapsed ? "h-10 w-10 p-0 rounded-xl" : "px-3 gap-2"
            }`}
          >
            <LogIn size={14} />
            {!isCollapsed && <span>Sign In</span>}
          </button>
        )}
      </div>

      {/* Footer Indicator and Focus HUD */}
      <div className="mt-auto flex flex-col items-center gap-3 w-full px-3">
        {focusModeActive ? (
          <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : `flex-row ${isLight ? "bg-[#FFF1EC] border border-[#E8D7C9]" : "bg-blue-600/20 border border-blue-500/40"} rounded-xl px-3 py-2 w-full justify-center`}`}>
            <div className={`w-7 h-7 rounded-full ${isLight ? "bg-[#C96F55]/15 border border-[#C96F55]/25 text-[#C96F55]" : "bg-blue-500/15 border border-blue-500/30 text-blue-400"} flex items-center justify-center animate-pulse shrink-0`}>
              <Lock size={13} />
            </div>
            <span className={`text-xs font-mono ${isLight ? "text-[#C96F55]" : "text-blue-400"} font-black tracking-tight shrink-0`}>
              {focusTimeRemaining}
            </span>
          </div>
        ) : (
          <div className={`p-2 ${isLight ? "text-[#77736B] hover:text-[#C96F55]" : "text-[#94A3B8] hover:text-blue-400"} cursor-help flex items-center gap-2`} title="Calibration: IGCSE, SAT & College Specs">
            <Sparkles size={16} className={`shrink-0 ${isLight ? "text-[#C96F55]" : "text-blue-400"}`} />
            {!isCollapsed && (
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isLight ? "text-[#77736B]" : "text-[#94A3B8]"}`}>CALIBRATED</span>
            )}
          </div>
        )}
      </div>

    </nav>
  );
}

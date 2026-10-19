import React, { useState } from "react";
import { 
  LayoutGrid, 
  Sparkles, 
  Timer, 
  Compass, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogIn,
  LogOut,
  User as UserIcon,
  Loader2,
  Lock,
  CalendarCheck,
  CalendarClock
} from "lucide-react";
import { User } from "firebase/auth";
import { EngezBrandLogo } from "./EngezBrandLogo";

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
  themeMode = "dark"
}: SidebarProps) {
  // Auto-collapse sidebar on iPads & portrait tablets to maximize study workspace
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1180;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1180) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "countdown", label: "Exam Countdown", icon: CalendarClock },
    { id: "habits", label: "Habit Tracker", icon: CalendarCheck },
    { id: "scholar", label: "Ai tutor", icon: Sparkles },
    { id: "focus", label: "Timer", icon: Timer },
    { id: "apps", label: "Study Apps", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isLight = themeMode === "light";

  return (
    <nav className={`hidden md:flex shrink-0 flex-col items-center py-5 lg:py-6 gap-5 lg:gap-6 ${
      isLight 
        ? "bg-[#FFFFFF]/98 border-r border-[#EBE4DC] text-[#1A1614] shadow-[1px_0_12px_rgba(28,25,23,0.02)]" 
        : "bg-[#0C0E18]/98 border-r border-white/[0.08] text-white shadow-[1px_0_24px_rgba(0,0,0,0.5)]"
    } z-20 transition-all duration-300 select-none ${
      isCollapsed ? "w-20" : "w-56 lg:w-64"
    }`}>
      
      {/* Premium Engez Logo & Expand/Collapse Toggle Row */}
      <div className={`flex items-center justify-between w-full px-4 ${isCollapsed ? "flex-col gap-4" : "flex-row"}`}>
        <button 
          onClick={() => window.location.reload()}
          className="relative group focus:outline-none cursor-pointer bg-transparent border-0 p-0 text-left"
          title="Engez Nafsak"
        >
          {isCollapsed ? (
            <div className={`w-11 h-11 rounded-2xl ${
              isLight 
                ? "bg-[#FAF8F5] border-[#EBE4DC] shadow-xs" 
                : "bg-[#101322] border-[#8B5CF6]/35 shadow-[0_4px_16px_rgba(139,92,246,0.22)]"
            } border p-1 flex items-center justify-center shadow-md transform hover:scale-105 duration-300 overflow-hidden`}>
              <EngezBrandLogo themeMode={themeMode} withContainer={false} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="h-12 px-1 flex items-center justify-start gap-2.5">
              <div className={`w-10 h-10 rounded-xl ${
                isLight 
                  ? "bg-[#FAF8F5] border-[#EBE4DC] shadow-xs" 
                  : "bg-[#101322] border-[#8B5CF6]/35 shadow-[0_4px_16px_rgba(139,92,246,0.22)]"
              } border p-1 flex items-center justify-center shrink-0 overflow-hidden transform hover:scale-105 transition-transform`}>
                <EngezBrandLogo themeMode={themeMode} withContainer={false} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`text-base font-black tracking-tight leading-tight ${isLight ? "text-[#1A1614]" : "text-[#F8FAFC]"} font-sans`}>
                  Engez Nafsak
                </span>
                <span className={`text-[11px] font-bold ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"} leading-tight font-sans`}>
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
              ? "bg-[#F5EFE9] hover:bg-[#EDE4DC] text-[#C25E42] hover:text-[#B25136] border-[#EBE4DC]" 
              : "bg-[#161A2B] hover:bg-[#1E2338] text-slate-300 hover:text-white border-white/[0.08]"
          }`}
          title={isCollapsed ? "Expand side menu" : "Collapse side menu"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Icon/Queue */}
      <div className="flex-1 flex flex-col items-center gap-2 w-full px-3">
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
                    ? "text-[#C25E42] bg-[#FFF2ED] border-[#F2D5CA] font-bold shadow-2xs"
                    : "text-[#C084FC] bg-[#8B5CF6]/15 border-[#8B5CF6]/35 shadow-[0_0_20px_rgba(139,92,246,0.18)] font-bold"
                  : isLight
                    ? "text-[#736B63] hover:text-[#1A1614] hover:bg-[#F5EFE9] border-transparent"
                    : "text-slate-400 hover:text-white hover:bg-[#161A2B] border-transparent"
              }`}
            >
              <IconComponent 
                size={19} 
                className={isActive 
                  ? (isLight ? "scale-105 shrink-0 text-[#C25E42]" : "scale-105 shrink-0 text-[#C084FC]") 
                  : (isLight ? "scale-100 group-hover:scale-105 duration-200 shrink-0 text-[#736B63]" : "scale-100 group-hover:scale-105 duration-200 shrink-0 text-slate-400")
                } 
              />
              
              {/* If Sidebar is expanded, show label */}
              {!isCollapsed && (
                <span className={`text-xs font-sans tracking-tight block truncate ${isActive ? (isLight ? "font-bold text-[#1A1614]" : "font-bold text-[#F8FAFC]") : "font-medium"}`}>
                  {item.label}
                </span>
              )}

              {/* Tooltip Overlay (when collapsed) */}
              {isCollapsed && (
                <div className={`absolute left-16 md:left-20 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-left ${
                  isLight ? "bg-[#FFFFFF] text-[#1A1614] border-[#EBE4DC]" : "bg-[#101322] text-[#F8FAFC] border-white/10"
                } text-xs font-mono font-medium py-1.5 px-3 rounded-lg border shadow-xl whitespace-nowrap z-50 pointer-events-none`}>
                  {item.label}
                </div>
              )}

              {/* Active Indicator bar */}
              {isActive && (
                <div className={`absolute left-0 w-1 h-5 rounded-r-md ${isLight ? "bg-[#C25E42] shadow-[0_0_8px_#C25E42]" : "bg-[#8B5CF6] shadow-[0_0_12px_#8B5CF6]"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Account Profile Connection Card */}
      <div className={`w-full px-3 border-t pt-4 flex flex-col items-center gap-3 ${
        isLight ? "border-[#EBE4DC]" : "border-white/[0.08]"
      }`}>
        {isAuthLoading ? (
          <div className="py-2 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin text-[#736B63]" />
          </div>
        ) : currentUser ? (
          <div className={`w-full p-2.5 rounded-2xl flex items-center justify-between border ${
            isLight 
              ? "bg-[#F5EFE9] border-[#EBE4DC] text-[#1A1614]" 
              : "bg-[#161A2B] border-white/[0.08] text-white"
          } transition-all duration-200`}>
            <div className="flex items-center gap-2 min-w-0">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || "User"} 
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/50" 
                />
              ) : (
                <div className={`w-7 h-7 rounded-full ${
                  isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
                } flex items-center justify-center shrink-0 text-xs font-bold`}>
                  <UserIcon size={14} />
                </div>
              )}
              {!isCollapsed && (
                <div className="flex flex-col text-left max-w-[95px] truncate">
                  <span className={`text-[11px] font-bold ${isLight ? "text-[#1A1614]" : "text-[#F8FAFC]"} truncate leading-tight`}>
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
                isLight ? "hover:bg-[#FDECEC] text-[#B84747]" : "hover:bg-rose-500/15 text-rose-300"
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
              isLight 
                ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[0_2px_8px_rgba(194,94,66,0.22)]" 
                : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-[0_4px_16px_rgba(139,92,246,0.35)]"
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
          <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : `flex-row ${isLight ? "bg-[#FFF2ED] border border-[#F2D5CA]" : "bg-[#8B5CF6]/15 border border-[#8B5CF6]/30"} rounded-xl px-3 py-2 w-full justify-center`}`}>
            <div className={`w-7 h-7 rounded-full ${isLight ? "bg-[#C25E42]/15 border border-[#C25E42]/25 text-[#C25E42]" : "bg-[#8B5CF6]/20 border border-[#8B5CF6]/35 text-[#C084FC]"} flex items-center justify-center animate-pulse shrink-0`}>
              <Lock size={13} />
            </div>
            <span className={`text-xs font-mono ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"} font-black tracking-tight shrink-0`}>
              {focusTimeRemaining}
            </span>
          </div>
        ) : (
          <div className={`p-2 ${isLight ? "text-[#736B63] hover:text-[#C25E42]" : "text-slate-400 hover:text-[#C084FC]"} cursor-help flex items-center gap-2`} title="Calibration: IGCSE, SAT & College Specs">
            <Sparkles size={16} className={`shrink-0 ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`} />
            {!isCollapsed && (
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isLight ? "text-[#736B63]" : "text-[#94A3B8]"}`}>CALIBRATED</span>
            )}
          </div>
        )}
      </div>

    </nav>
  );
}

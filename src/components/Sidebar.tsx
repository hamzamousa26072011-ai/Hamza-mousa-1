import React, { useState } from "react";
import { 
  LayoutGrid, 
  BookOpen, 
  Timer, 
  Compass, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogIn,
  LogOut,
  User as UserIcon,
  Loader2,
  CalendarCheck,
  CalendarClock,
  HardDrive,
  Cloud
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Today", icon: LayoutGrid },
    { id: "countdown", label: "Exams & Friends", icon: CalendarClock },
    { id: "habits", label: "Habit Tracker", icon: CalendarCheck },
    { id: "scholar", label: "AI Tutor", icon: BookOpen },
    { id: "focus", label: "Focus Timer", icon: Timer },
    { id: "apps", label: "Study Apps", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isLight = themeMode === "light";

  return (
    <aside
      aria-label="Primary Navigation"
      className={`hidden md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto shrink-0 flex-col justify-between py-5 px-3 select-none z-20 transition-all duration-200 border-r ${
        isLight
          ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
          : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
      } ${isCollapsed ? "w-20" : "w-60 lg:w-64"}`}
    >
      {/* Top Section: Brand + Navigation */}
      <div className="space-y-6">
        {/* Brand Header & Collapse Control */}
        <div className={`flex items-center ${isCollapsed ? "flex-col gap-3" : "justify-between px-1.5"}`}>
          <button
            type="button"
            onClick={() => onTabChange("dashboard")}
            className="flex items-center gap-2.5 text-left rounded-xl p-1 transition-colors cursor-pointer focus-visible:outline-2"
            title="Go to Today overview"
            aria-label="Engez Nafsak — Go to Today overview"
          >
            <div
              className={`w-10 h-10 rounded-xl border p-1 flex items-center justify-center shrink-0 overflow-hidden ${
                isLight
                  ? "bg-[#F6F7FA] border-[#E2E6EF]"
                  : "bg-[#10131A] border-[#283040]"
              }`}
            >
              <EngezBrandLogo themeMode={themeMode} withContainer={false} className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span
                  className={`block text-[15px] font-bold tracking-tight leading-snug ${
                    isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
                  }`}
                >
                  Engez Nafsak
                </span>
                <span
                  dir="rtl"
                  lang="ar"
                  className={`block text-xs font-semibold leading-snug font-arabic ${
                    isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"
                  }`}
                >
                  إنجز نفسك
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
              isLight
                ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] text-[#596474] hover:text-[#18202B] border-[#E2E6EF]"
                : "bg-[#222938] hover:bg-[#2A3244] text-[#B7C0CF] hover:text-[#F1F3F8] border-[#283040]"
            }`}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Workspace sections">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                id={`sidebar-tab-btn-${item.id}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                title={isCollapsed ? item.label : undefined}
                className={`w-full min-h-[42px] rounded-xl flex items-center transition-colors duration-150 cursor-pointer border ${
                  isCollapsed ? "justify-center px-2" : "justify-start gap-3 px-3.5"
                } ${
                  isActive
                    ? isLight
                      ? "bg-[#F0EEFF] text-[#5F55C8] border-[#D8D3F8] font-semibold"
                      : "bg-[#6D5DF6]/18 text-[#A99BFF] border-[#6D5DF6]/40 font-semibold"
                    : isLight
                    ? "text-[#596474] hover:text-[#18202B] hover:bg-[#F0F2F7] border-transparent font-medium"
                    : "text-[#B7C0CF] hover:text-[#F1F3F8] hover:bg-[#222938] border-transparent font-medium"
                }`}
              >
                <IconComponent
                  size={18}
                  className={`shrink-0 ${
                    isActive
                      ? isLight
                        ? "text-[#5F55C8]"
                        : "text-[#A99BFF]"
                      : isLight
                      ? "text-[#596474]"
                      : "text-[#B7C0CF]"
                  }`}
                />
                {!isCollapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Active Timer Status + Account/Storage Status */}
      <div className="space-y-3 pt-4 border-t border-inherit">
        {/* Live Focus Session Indicator when active */}
        {focusModeActive && (
          <button
            type="button"
            onClick={() => onTabChange("focus")}
            title="Active Focus Session — Click to open timer"
            className={`w-full rounded-xl p-2.5 border text-left transition-colors cursor-pointer flex items-center ${
              isCollapsed ? "justify-center" : "justify-between gap-2"
            } ${
              isLight
                ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#15803D]"
                : "bg-[#10B981]/12 border-[#34D399]/30 text-[#34D399]"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Timer size={16} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-xs font-semibold truncate">Timer running</span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-xs font-mono font-bold tabular-nums shrink-0">
                {focusTimeRemaining}
              </span>
            )}
          </button>
        )}

        {/* Account & Data Persistence Status */}
        <div
          className={`rounded-xl border p-2.5 ${
            isLight
              ? "bg-[#F6F7FA] border-[#E2E6EF]"
              : "bg-[#10131A] border-[#283040]"
          }`}
        >
          {isAuthLoading ? (
            <div className="flex items-center justify-center py-1.5 text-xs gap-2">
              <Loader2 size={14} className="animate-spin text-[#5F55C8]" />
              {!isCollapsed && <span>Checking account...</span>}
            </div>
          ) : currentUser ? (
            <div className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "justify-between gap-2"}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "Student profile"}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-black/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isLight
                        ? "bg-[#F0EEFF] text-[#5F55C8]"
                        : "bg-[#6D5DF6]/20 text-[#A99BFF]"
                    }`}
                  >
                    <UserIcon size={15} />
                  </div>
                )}
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
                      }`}
                    >
                      {currentUser.displayName || currentUser.email?.split("@")[0] || "Student"}
                    </p>
                    <p
                      className={`text-[11px] flex items-center gap-1 truncate ${
                        isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                      }`}
                    >
                      {isFirestoreOffline ? (
                        <>
                          <HardDrive size={11} className="shrink-0" />
                          <span>Saved locally</span>
                        </>
                      ) : (
                        <>
                          <Cloud size={11} className="shrink-0 text-[#15803D] dark:text-[#34D399]" />
                          <span>Cloud synced</span>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out of account"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? "text-[#596474] hover:text-[#BE123C] hover:bg-[#FFF1F2]"
                    : "text-[#B7C0CF] hover:text-[#FB7185] hover:bg-[#FB7185]/10"
                }`}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {!isCollapsed && (
                <div className="flex items-center gap-1.5 text-[11px] px-0.5">
                  <HardDrive size={12} className={isLight ? "text-[#596474]" : "text-[#B7C0CF]"} />
                  <span className={isLight ? "text-[#596474]" : "text-[#B7C0CF]"}>
                    Guest · Saved on this device
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={onLogin}
                title="Sign in to sync across devices"
                aria-label="Sign in to sync across devices"
                className={`w-full min-h-[38px] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  isLight
                    ? "bg-[#5F55C8] hover:bg-[#4E45B0] text-white"
                    : "bg-[#6D5DF6] hover:bg-[#5B4BE8] text-white"
                }`}
              >
                <LogIn size={14} />
                {!isCollapsed && <span>Sign in to sync</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

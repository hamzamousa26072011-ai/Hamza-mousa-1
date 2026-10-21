import React, { useState, useEffect, useMemo } from "react";
import { 
  CalendarClock, 
  Plus, 
  Bell, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Pin, 
  Users, 
  Sparkles, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Flame, 
  Trophy, 
  Coffee, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  UserX,
  Inbox
} from "lucide-react";
import { User } from "firebase/auth";
import { ExamItem, FriendItem, FriendLeaderboardEntry, FriendRequestItem } from "../types";
import { saveUserExams, saveUserFriendsData } from "../lib/classroom";

interface ExamCountdownTabProps {
  currentUser: User | null;
  exams: ExamItem[];
  setExams: React.Dispatch<React.SetStateAction<ExamItem[]>>;
  friends: FriendItem[];
  setFriends: React.Dispatch<React.SetStateAction<FriendItem[]>>;
  friendRequests?: FriendRequestItem[];
  setFriendRequests?: React.Dispatch<React.SetStateAction<FriendRequestItem[]>>;
  friendUsername: string;
  setFriendUsername: React.Dispatch<React.SetStateAction<string>>;
  inviteCode: string;
  setInviteCode: React.Dispatch<React.SetStateAction<string>>;
  totalFocusMinutes?: number;
  userStreak?: number;
  themeMode?: "light" | "dark";
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

export interface ExamUrgencyStyle {
  tierId: string;
  tierName: string;
  badgeLabel: string;
  badgeClasses: string;
  cardBg: string;
  borderColor: string;
  glowShadow: string;
  titleColor: string;
  subtitleColor: string;
  pillBg: string;
  pillBorder: string;
  digitColor: string;
  unitColor: string;
  dotColor: string;
}

export const URGENCY_TIERS_LEGEND = [
  { id: "critical", label: "< 24h", name: "Critical", dot: "bg-[#F43F5E]", lightDot: "bg-[#F43F5E]", darkDot: "bg-[#F43F5E]", lightBadge: "bg-[#FFF1F2] text-[#BE123C] border-[#FDA4AF]", darkBadge: "bg-[#F43F5E]/15 text-[#FDA4AF] border-[#F43F5E]/30" },
  { id: "very-urgent", label: "1–2d", name: "Urgent", dot: "bg-[#FB7185]", lightDot: "bg-[#FB7185]", darkDot: "bg-[#FB7185]", lightBadge: "bg-[#FFF5F5] text-[#B91C1C] border-[#FCA5A5]", darkBadge: "bg-[#FB7185]/15 text-[#FECDD3] border-[#FB7185]/30" },
  { id: "high-urgency", label: "3–4d", name: "High", dot: "bg-[#F97316]", lightDot: "bg-[#F97316]", darkDot: "bg-[#F97316]", lightBadge: "bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]", darkBadge: "bg-[#F97316]/15 text-[#FED7AA] border-[#F97316]/30" },
  { id: "this-week", label: "5–7d", name: "This Week", dot: "bg-[#FBBF24]", lightDot: "bg-[#FBBF24]", darkDot: "bg-[#FBBF24]", lightBadge: "bg-[#FFFBEB] text-[#B45309] border-[#FCD34D]", darkBadge: "bg-[#FBBF24]/15 text-[#FDE68A] border-[#FBBF24]/30" },
  { id: "next-week", label: "8–14d", name: "Next Week", dot: "bg-[#C25E42]", lightDot: "bg-[#C25E42]", darkDot: "bg-[#8B5CF6]", lightBadge: "bg-[#FFF2ED] text-[#C25E42] border-[#F0D5CC]", darkBadge: "bg-[#8B5CF6]/15 text-[#C084FC] border-[#8B5CF6]/30" },
  { id: "on-track", label: "15–21d", name: "On Track", dot: "bg-[#10B981]", lightDot: "bg-[#10B981]", darkDot: "bg-[#6366F1]", lightBadge: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]", darkBadge: "bg-[#6366F1]/15 text-[#A5B4FC] border-[#6366F1]/30" },
  { id: "horizon", label: "22–35d", name: "Horizon", dot: "bg-[#16A34A]", lightDot: "bg-[#16A34A]", darkDot: "bg-[#06B6D4]", lightBadge: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]", darkBadge: "bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30" },
  { id: "distant", label: "> 35d", name: "Distant", dot: "bg-[#78716C]", lightDot: "bg-[#78716C]", darkDot: "bg-[#38BDF8]", lightBadge: "bg-[#F5F4F0] text-[#57534E] border-[#E2DFD8]", darkBadge: "bg-[#38BDF8]/15 text-[#BAE6FD] border-[#38BDF8]/30" }
];

export const getExamUrgencyTheme = (
  countdown: TimeRemaining,
  isLight: boolean,
  cardColor?: string
): ExamUrgencyStyle => {
  // If user explicitly picked a manual custom color (not "automatic"), provide that customized theme:
  if (cardColor && cardColor !== "automatic") {
    switch (cardColor) {
      case "lavender":
        return {
          tierId: "lavender",
          tierName: "Lavender",
          badgeLabel: countdown.isPast ? "Completed" : `${countdown.days}d left`,
          badgeClasses: isLight 
            ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC]" 
            : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/40 shadow-[0_0_10px_rgba(139,92,246,0.25)]",
          cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
          borderColor: isLight ? "border-[#F0D5CC] ring-1 ring-[#C25E42]/20" : "border-[#8B5CF6]/45 ring-1 ring-[#8B5CF6]/25",
          glowShadow: isLight ? "shadow-[0_8px_25px_rgba(194,94,66,0.08)]" : "shadow-[0_8px_30px_rgba(139,92,246,0.22)]",
          titleColor: isLight ? "text-[#1A1614]" : "text-white",
          subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
          pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
          pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
          digitColor: isLight ? "text-[#1A1614]" : "text-white",
          unitColor: isLight ? "text-[#7A6E65]" : "text-[#C4B5FD]",
          dotColor: isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"
        };
      case "sky":
        return {
          tierId: "sky",
          tierName: "Sky",
          badgeLabel: countdown.isPast ? "Completed" : `${countdown.days}d left`,
          badgeClasses: isLight ? "bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]" : "bg-[#38BDF8]/20 text-[#BAE6FD] border border-[#38BDF8]/40 shadow-[0_0_10px_rgba(56,189,248,0.25)]",
          cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
          borderColor: isLight ? "border-[#BAE6FD] ring-1 ring-[#0284C7]/20" : "border-[#38BDF8]/40 ring-1 ring-[#0284C7]/25",
          glowShadow: isLight ? "shadow-[0_8px_25px_rgba(2,132,199,0.08)]" : "shadow-[0_8px_30px_rgba(56,189,248,0.22)]",
          titleColor: isLight ? "text-[#1A1614]" : "text-white",
          subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
          pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
          pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
          digitColor: isLight ? "text-[#1A1614]" : "text-white",
          unitColor: isLight ? "text-[#7A6E65]" : "text-[#7DD3FC]",
          dotColor: "bg-[#38BDF8]"
        };
      case "mint":
        return {
          tierId: "mint",
          tierName: "Mint",
          badgeLabel: countdown.isPast ? "Completed" : `${countdown.days}d left`,
          badgeClasses: isLight ? "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]" : "bg-emerald-500/20 text-[#A7F3D0] border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]",
          cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
          borderColor: isLight ? "border-[#A7F3D0] ring-1 ring-[#10B981]/20" : "border-emerald-500/40 ring-1 ring-[#10B981]/25",
          glowShadow: isLight ? "shadow-[0_8px_25px_rgba(16,185,129,0.08)]" : "shadow-[0_8px_30px_rgba(16,185,129,0.22)]",
          titleColor: isLight ? "text-[#1A1614]" : "text-white",
          subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
          pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
          pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
          digitColor: isLight ? "text-[#1A1614]" : "text-white",
          unitColor: isLight ? "text-[#7A6E65]" : "text-[#6EE7B7]",
          dotColor: "bg-[#34D399]"
        };
      case "sunset":
        return {
          tierId: "sunset",
          tierName: "Sunset",
          badgeLabel: countdown.isPast ? "Completed" : `${countdown.days}d left`,
          badgeClasses: isLight ? "bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]" : "bg-orange-500/20 text-[#FED7AA] border border-orange-400/40 shadow-[0_0_10px_rgba(251,146,60,0.25)]",
          cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
          borderColor: isLight ? "border-[#FED7AA] ring-1 ring-[#FB923C]/20" : "border-[#FB923C]/40 ring-1 ring-[#FB923C]/25",
          glowShadow: isLight ? "shadow-[0_8px_25px_rgba(251,146,60,0.08)]" : "shadow-[0_8px_30px_rgba(251,146,60,0.22)]",
          titleColor: isLight ? "text-[#1A1614]" : "text-white",
          subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
          pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
          pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
          digitColor: isLight ? "text-[#1A1614]" : "text-white",
          unitColor: isLight ? "text-[#7A6E65]" : "text-[#FDBA74]",
          dotColor: "bg-[#FB923C]"
        };
      case "golden":
        return {
          tierId: "golden",
          tierName: "Golden",
          badgeLabel: countdown.isPast ? "Completed" : `${countdown.days}d left`,
          badgeClasses: isLight ? "bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A]" : "bg-yellow-500/20 text-[#FEF08A] border border-yellow-400/40 shadow-[0_0_10px_rgba(250,204,21,0.25)]",
          cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
          borderColor: isLight ? "border-[#FEF08A] ring-1 ring-[#FACC15]/20" : "border-[#FACC15]/40 ring-1 ring-[#FACC15]/25",
          glowShadow: isLight ? "shadow-[0_8px_25px_rgba(250,204,21,0.08)]" : "shadow-[0_8px_30px_rgba(250,204,21,0.22)]",
          titleColor: isLight ? "text-[#1A1614]" : "text-white",
          subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
          pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
          pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
          digitColor: isLight ? "text-[#1A1614]" : "text-white",
          unitColor: isLight ? "text-[#7A6E65]" : "text-[#FDE047]",
          dotColor: "bg-[#FACC15]"
        };
      case "coral":
        return {
          tierId: "coral",
          tierName: "Coral",
          badgeLabel: countdown.isPast ? "Completed" : `${countdown.days}d left`,
          badgeClasses: isLight ? "bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3]" : "bg-rose-500/20 text-[#FECDD3] border border-rose-400/40 shadow-[0_0_10px_rgba(251,113,133,0.25)]",
          cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
          borderColor: isLight ? "border-[#FECDD3] ring-1 ring-[#FB7185]/20" : "border-[#FB7185]/40 ring-1 ring-[#FB7185]/25",
          glowShadow: isLight ? "shadow-[0_8px_25px_rgba(251,113,133,0.08)]" : "shadow-[0_8px_30px_rgba(251,113,133,0.22)]",
          titleColor: isLight ? "text-[#1A1614]" : "text-white",
          subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
          pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
          pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
          digitColor: isLight ? "text-[#1A1614]" : "text-white",
          unitColor: isLight ? "text-[#7A6E65]" : "text-[#FDA4AF]",
          dotColor: "bg-[#FB7185]"
        };
      case "slate":
        return {
          tierId: "slate",
          tierName: "Slate",
          badgeLabel: countdown.isPast ? "Completed" : `${countdown.days}d left`,
          badgeClasses: isLight ? "bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1]" : "bg-slate-500/20 text-[#E2E8F0] border border-slate-400/40",
          cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
          borderColor: isLight ? "border-[#CBD5E1] ring-1 ring-[#94A3B8]/20" : "border-[#94A3B8]/30 ring-1 ring-[#94A3B8]/15",
          glowShadow: isLight ? "shadow-[0_8px_25px_rgba(148,163,184,0.08)]" : "shadow-[0_8px_20px_rgba(148,163,184,0.15)]",
          titleColor: isLight ? "text-[#1A1614]" : "text-white",
          subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
          pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
          pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
          digitColor: isLight ? "text-[#1A1614]" : "text-white",
          unitColor: isLight ? "text-[#7A6E65]" : "text-[#CBD5E1]",
          dotColor: "bg-[#94A3B8]"
        };
    }
  }

  // Completed / Past exams:
  if (countdown.isPast) {
    return {
      tierId: "completed",
      tierName: "Completed",
      badgeLabel: "Exam Completed",
      badgeClasses: isLight 
        ? "bg-[#EAE5DC] text-[#66615B] border border-[#DDD6CB]" 
        : "bg-white/5 text-[#94A3B8] border border-white/10",
      cardBg: isLight ? "bg-white/80 opacity-80" : "bg-[#101322]/60 opacity-60 hover:opacity-90 transition-opacity",
      borderColor: isLight ? "border-[#E7E2D9]" : "border-white/[0.08]",
      glowShadow: "shadow-none",
      titleColor: isLight ? "text-[#66615B]" : "text-slate-300",
      subtitleColor: isLight ? "text-[#8A847C]" : "text-slate-500",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]/60",
      pillBorder: isLight ? "border-[#E2DCD3]" : "border-white/5",
      digitColor: isLight ? "text-[#66615B]" : "text-slate-400",
      unitColor: isLight ? "text-[#9E988F]" : "text-slate-500",
      dotColor: isLight ? "bg-[#9E988F]" : "bg-[#475569]"
    };
  }

  const { days, hours, minutes } = countdown;

  // 1. TIER: Critical (< 24 Hours / Today)
  if (days === 0) {
    const timeLabel = hours > 0 ? `${hours}h ${minutes}m left` : "Happening Today";
    return {
      tierId: "critical",
      tierName: "< 24 Hours",
      badgeLabel: `Critical • ${timeLabel}`,
      badgeClasses: isLight
        ? "bg-[#FFF1F2] text-[#BE123C] border border-[#FDA4AF] shadow-xs animate-pulse"
        : "bg-[#F43F5E]/20 text-[#FDA4AF] border border-[#F43F5E]/40 shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-pulse",
      cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
      borderColor: isLight 
        ? "border-[#FDA4AF] ring-1 ring-[#F43F5E]/30" 
        : "border-[#F43F5E]/50 ring-1 ring-[#F43F5E]/30",
      glowShadow: isLight 
        ? "shadow-[0_8px_25px_rgba(244,63,94,0.10)]" 
        : "shadow-[0_8px_30px_rgba(244,63,94,0.22)]",
      titleColor: isLight ? "text-[#1A1614]" : "text-white",
      subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
      pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
      digitColor: isLight ? "text-[#1A1614]" : "text-white",
      unitColor: isLight ? "text-[#7A6E65]" : "text-[#FDA4AF]",
      dotColor: "bg-[#F43F5E]"
    };
  }

  // 2. TIER: Very Urgent (1 to 2 Days)
  if (days < 3) {
    return {
      tierId: "very-urgent",
      tierName: "1–2 Days",
      badgeLabel: `Urgent • ${days} ${days === 1 ? "day" : "days"} left`,
      badgeClasses: isLight
        ? "bg-[#FFF5F5] text-[#B91C1C] border border-[#FCA5A5] shadow-xs"
        : "bg-[#FB7185]/20 text-[#FECDD3] border border-[#FB7185]/40 shadow-[0_0_10px_rgba(251,113,133,0.25)]",
      cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
      borderColor: isLight 
        ? "border-[#FCA5A5] ring-1 ring-[#FB7185]/25" 
        : "border-[#FB7185]/40 ring-1 ring-[#FB7185]/20",
      glowShadow: isLight 
        ? "shadow-[0_8px_25px_rgba(251,113,133,0.08)]" 
        : "shadow-[0_8px_25px_rgba(251,113,133,0.18)]",
      titleColor: isLight ? "text-[#1A1614]" : "text-white",
      subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
      pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
      digitColor: isLight ? "text-[#1A1614]" : "text-white",
      unitColor: isLight ? "text-[#7A6E65]" : "text-[#FECDD3]",
      dotColor: "bg-[#FB7185]"
    };
  }

  // 3. TIER: High Urgency (3 to 4 Days)
  if (days < 5) {
    return {
      tierId: "high-urgency",
      tierName: "3–4 Days",
      badgeLabel: `Approaching • ${days} days left`,
      badgeClasses: isLight
        ? "bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] shadow-xs"
        : "bg-[#F97316]/20 text-[#FED7AA] border border-[#F97316]/40 shadow-[0_0_10px_rgba(249,115,22,0.25)]",
      cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
      borderColor: isLight 
        ? "border-[#FDBA74] ring-1 ring-[#F97316]/25" 
        : "border-[#F97316]/40 ring-1 ring-[#F97316]/20",
      glowShadow: isLight 
        ? "shadow-[0_8px_25px_rgba(249,115,22,0.08)]" 
        : "shadow-[0_8px_25px_rgba(249,115,22,0.16)]",
      titleColor: isLight ? "text-[#1A1614]" : "text-white",
      subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
      pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
      digitColor: isLight ? "text-[#1A1614]" : "text-white",
      unitColor: isLight ? "text-[#7A6E65]" : "text-[#FED7AA]",
      dotColor: "bg-[#F97316]"
    };
  }

  // 4. TIER: Approaching / This Week (5 to 7 Days)
  if (days < 8) {
    return {
      tierId: "this-week",
      tierName: "5–7 Days",
      badgeLabel: `This Week • ${days} days left`,
      badgeClasses: isLight
        ? "bg-[#FFFBEB] text-[#B45309] border border-[#FCD34D] shadow-xs"
        : "bg-[#FBBF24]/20 text-[#FDE68A] border border-[#FBBF24]/40 shadow-[0_0_10px_rgba(251,191,36,0.2)]",
      cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
      borderColor: isLight 
        ? "border-[#FCD34D] ring-1 ring-[#FBBF24]/25" 
        : "border-[#FBBF24]/40 ring-1 ring-[#FBBF24]/20",
      glowShadow: isLight 
        ? "shadow-[0_8px_25px_rgba(251,191,36,0.08)]" 
        : "shadow-[0_8px_25px_rgba(251,191,36,0.15)]",
      titleColor: isLight ? "text-[#1A1614]" : "text-white",
      subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
      pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
      digitColor: isLight ? "text-[#1A1614]" : "text-white",
      unitColor: isLight ? "text-[#7A6E65]" : "text-[#FDE68A]",
      dotColor: "bg-[#FBBF24]"
    };
  }

  // 5. TIER: Upcoming / Next Week (8 to 14 Days) - Orange in Light Mode, Purple in Dark Mode
  if (days < 15) {
    return {
      tierId: "next-week",
      tierName: "8–14 Days",
      badgeLabel: `Next Week • ${days} days left`,
      badgeClasses: isLight
        ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC] shadow-xs"
        : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(139,92,246,0.25)]",
      cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
      borderColor: isLight 
        ? "border-[#F0D5CC] ring-1 ring-[#C25E42]/25" 
        : "border-[#8B5CF6]/45 ring-1 ring-[#8B5CF6]/25",
      glowShadow: isLight 
        ? "shadow-[0_8px_25px_rgba(194,94,66,0.08)]" 
        : "shadow-[0_8px_30px_rgba(139,92,246,0.22)]",
      titleColor: isLight ? "text-[#1A1614]" : "text-white",
      subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
      pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
      digitColor: isLight ? "text-[#1A1614]" : "text-white",
      unitColor: isLight ? "text-[#7A6E65]" : "text-[#C084FC]",
      dotColor: isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"
    };
  }

  // 6. TIER: On Track / 2–3 Weeks (15 to 21 Days) - Fresh Emerald Green in Light Mode
  if (days < 22) {
    return {
      tierId: "on-track",
      tierName: "15–21 Days",
      badgeLabel: `On Track • ${days} days left`,
      badgeClasses: isLight
        ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shadow-xs"
        : "bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]",
      cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
      borderColor: isLight 
        ? "border-[#A7F3D0] ring-1 ring-[#10B981]/25" 
        : "border-[#6366F1]/40 ring-1 ring-[#6366F1]/20",
      glowShadow: isLight 
        ? "shadow-[0_8px_25px_rgba(16,185,129,0.08)]" 
        : "shadow-[0_8px_25px_rgba(99,102,241,0.18)]",
      titleColor: isLight ? "text-[#1A1614]" : "text-white",
      subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
      pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
      digitColor: isLight ? "text-[#1A1614]" : "text-white",
      unitColor: isLight ? "text-[#7A6E65]" : "text-[#A5B4FC]",
      dotColor: isLight ? "bg-[#10B981]" : "bg-[#6366F1]"
    };
  }

  // 7. TIER: Planned Horizon / 3–5 Weeks (22 to 35 Days) - Forest Green in Light Mode
  if (days < 36) {
    return {
      tierId: "horizon",
      tierName: "22–35 Days",
      badgeLabel: `Horizon • ${days} days left`,
      badgeClasses: isLight
        ? "bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] shadow-xs"
        : "bg-[#06B6D4]/20 text-[#67E8F9] border border-[#06B6D4]/40 shadow-[0_0_10px_rgba(6,182,212,0.18)]",
      cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
      borderColor: isLight 
        ? "border-[#BBF7D0] ring-1 ring-[#16A34A]/20" 
        : "border-[#06B6D4]/35 ring-1 ring-[#06B6D4]/15",
      glowShadow: isLight 
        ? "shadow-[0_8px_25px_rgba(22,163,74,0.08)]" 
        : "shadow-[0_8px_25px_rgba(6,182,212,0.15)]",
      titleColor: isLight ? "text-[#1A1614]" : "text-white",
      subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
      pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
      pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
      digitColor: isLight ? "text-[#1A1614]" : "text-white",
      unitColor: isLight ? "text-[#7A6E65]" : "text-[#67E8F9]",
      dotColor: isLight ? "bg-[#16A34A]" : "bg-[#06B6D4]"
    };
  }

  // 8. TIER: Distant (> 35 Days) - Calm Warm Stone in Light Mode
  return {
    tierId: "distant",
    tierName: "> 35 Days",
    badgeLabel: `Distant • ${days} days left`,
    badgeClasses: isLight
      ? "bg-[#F5F4F0] text-[#57534E] border border-[#E2DFD8] shadow-xs"
      : "bg-[#38BDF8]/15 text-[#BAE6FD] border border-[#38BDF8]/30",
    cardBg: isLight ? "bg-white/95" : "bg-[#101322]/95",
    borderColor: isLight 
      ? "border-[#E5E0D8] ring-1 ring-[#78716C]/20" 
      : "border-[#38BDF8]/30 ring-1 ring-[#38BDF8]/15",
    glowShadow: isLight 
      ? "shadow-[0_8px_25px_rgba(120,113,108,0.06)]" 
      : "shadow-[0_8px_20px_rgba(56,189,248,0.12)]",
    titleColor: isLight ? "text-[#1A1614]" : "text-white",
    subtitleColor: isLight ? "text-[#7A6E65]" : "text-slate-400",
    pillBg: isLight ? "bg-[#FAF7F3]" : "bg-[#161A2B]",
    pillBorder: isLight ? "border-[#EBE4DC]" : "border-white/[0.08]",
    digitColor: isLight ? "text-[#1A1614]" : "text-white",
    unitColor: isLight ? "text-[#7A6E65]" : "text-[#BAE6FD]",
    dotColor: isLight ? "bg-[#78716C]" : "bg-[#38BDF8]"
  };
};

export const ExamCountdownTab: React.FC<ExamCountdownTabProps> = ({
  currentUser,
  exams,
  setExams,
  friends,
  setFriends,
  friendRequests = [],
  setFriendRequests,
  friendUsername,
  setFriendUsername,
  inviteCode,
  setInviteCode,
  totalFocusMinutes = 120,
  userStreak = 5,
  themeMode = "dark"
}) => {
  const isLight = themeMode === "light";

  // Navigation mode: "exams" or "friends"
  const [activeSubView, setActiveSubView] = useState<"exams" | "friends">("exams");
  const [examFilter, setExamFilter] = useState<"all" | "upcoming" | "pinned" | "completed">("all");
  const [selectedUrgencyTier, setSelectedUrgencyTier] = useState<string | null>(null);

  // Live timer tick for accurate countdowns
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modal states
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [showFriendBanner, setShowFriendBanner] = useState(true);
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(friendUsername || "");
  const [addFriendInput, setAddFriendInput] = useState("");
  const [friendFeedback, setFriendFeedback] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Exam Form State matching Screenshot 1
  const [examForm, setExamForm] = useState({
    title: "",
    subject: "",
    paperCode: "",
    examDate: "",
    examTime: "09:00",
    examHours: "09",
    examMinutes: "00",
    colorTheme: "amber" as ExamItem["colorTheme"],
    cardColor: "automatic" as NonNullable<ExamItem["cardColor"]>,
    description: "",
    isPinned: false,
    notes: "",
    roomNumber: "",
    targetGrade: ""
  });

  // Ensure user has default username & invite code if blank
  useEffect(() => {
    if (!friendUsername) {
      const generated = currentUser?.displayName
        ? `@${currentUser.displayName.toLowerCase().replace(/[^a-z0-9]/g, "")}`
        : currentUser?.email
        ? `@${currentUser.email.split("@")[0].replace(/[^a-z0-9]/g, "")}`
        : `@student_${Math.floor(1000 + Math.random() * 9000)}`;
      setFriendUsername(generated);
      setUsernameInput(generated);
    }
    if (!inviteCode) {
      const newCode = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 10);
      setInviteCode(newCode);
    }
  }, [currentUser, friendUsername, inviteCode]);

  // Calculate live countdown for an exam
  const calculateCountdown = (examDateStr: string, examTimeStr?: string): TimeRemaining => {
    try {
      const timePart = examTimeStr || "09:00";
      const target = new Date(`${examDateStr}T${timePart}:00`);
      if (isNaN(target.getTime())) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
      }
      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: diffMs, isPast: true };
      }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      return { days, hours, minutes, seconds, totalMs: diffMs, isPast: false };
    } catch {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
    }
  };

  // Format date readable: e.g. "Wednesday, 7 October 2026 at 15:00"
  const formatExamDateTime = (examDateStr: string, examTimeStr?: string): string => {
    try {
      const timePart = examTimeStr || "09:00";
      const date = new Date(`${examDateStr}T${timePart}:00`);
      if (isNaN(date.getTime())) return examDateStr;
      const options: Intl.DateTimeFormatOptions = { 
        weekday: "long", 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      };
      const dateFormatted = date.toLocaleDateString(undefined, options);
      return `${dateFormatted} at ${timePart}`;
    } catch {
      return `${examDateStr} at ${examTimeStr || "09:00"}`;
    }
  };

  // Save changes to user exams
  const persistExams = (newExams: ExamItem[]) => {
    setExams(newExams);
    if (currentUser?.uid) {
      saveUserExams(currentUser.uid, newExams);
    }
  };

  // Save changes to user friends
  const persistFriends = (
    newFriends: FriendItem[], 
    newUsername?: string, 
    newCode?: string,
    newRequests?: FriendRequestItem[]
  ) => {
    setFriends(newFriends);
    const un = newUsername !== undefined ? newUsername : friendUsername;
    const cd = newCode !== undefined ? newCode : inviteCode;
    const rq = newRequests !== undefined ? newRequests : (friendRequests || []);
    if (setFriendRequests && newRequests !== undefined) {
      setFriendRequests(newRequests);
    }
    if (currentUser?.uid) {
      saveUserFriendsData(currentUser.uid, newFriends, un, cd, rq);
    }
  };

  // Toggle Pin on an exam
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = exams.map(ex => ex.id === id ? { ...ex, isPinned: !ex.isPinned } : ex);
    persistExams(updated);
  };

  // Delete an exam
  const handleDeleteExam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Remove this exam countdown?")) {
      const updated = exams.filter(ex => ex.id !== id);
      persistExams(updated);
    }
  };

  // Open Edit Exam
  const handleEditExam = (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExamId(exam.id);
    const [h, m] = (exam.examTime || "09:00").split(":");
    setExamForm({
      title: exam.title,
      subject: exam.subject || exam.title,
      paperCode: exam.paperCode || "",
      examDate: exam.examDate,
      examTime: exam.examTime || "09:00",
      examHours: h ? h.padStart(2, "0") : "09",
      examMinutes: m ? m.padStart(2, "0") : "00",
      colorTheme: (exam.colorTheme as any) || "amber",
      cardColor: (exam.cardColor as any) || "automatic",
      description: exam.description || exam.notes || "",
      isPinned: exam.isPinned || false,
      notes: exam.notes || exam.description || "",
      roomNumber: exam.roomNumber || "",
      targetGrade: exam.targetGrade || ""
    });
    setIsAddExamOpen(true);
  };

  // Submit Add / Edit Exam Form
  const handleSubmitExamForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title.trim() || !examForm.examDate) {
      alert("Please provide an exam name and date.");
      return;
    }

    const hours = (examForm.examHours || "09").trim().padStart(2, "0");
    const minutes = (examForm.examMinutes || "00").trim().padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    if (editingExamId) {
      const updated = exams.map(ex => ex.id === editingExamId ? {
        ...ex,
        title: examForm.title.trim(),
        subject: examForm.subject.trim() || examForm.title.trim(),
        paperCode: examForm.paperCode.trim(),
        examDate: examForm.examDate,
        examTime: formattedTime,
        colorTheme: examForm.cardColor === "automatic" ? "amber" : (examForm.cardColor as any),
        cardColor: examForm.cardColor,
        description: examForm.description.trim(),
        notes: examForm.description.trim(),
        isPinned: examForm.isPinned,
        roomNumber: examForm.roomNumber.trim(),
        targetGrade: examForm.targetGrade.trim()
      } : ex);
      persistExams(updated);
    } else {
      const newExam: ExamItem = {
        id: "exam_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        title: examForm.title.trim(),
        subject: examForm.subject.trim() || examForm.title.trim(),
        paperCode: examForm.paperCode.trim(),
        examDate: examForm.examDate,
        examTime: formattedTime,
        colorTheme: examForm.cardColor === "automatic" ? "amber" : (examForm.cardColor as any),
        cardColor: examForm.cardColor,
        description: examForm.description.trim(),
        notes: examForm.description.trim(),
        isPinned: examForm.isPinned,
        roomNumber: examForm.roomNumber.trim(),
        targetGrade: examForm.targetGrade.trim(),
        createdAt: new Date().toISOString()
      };
      persistExams([newExam, ...exams]);
    }

    setIsAddExamOpen(false);
    setEditingExamId(null);
    setExamForm({
      title: "",
      subject: "",
      paperCode: "",
      examDate: "",
      examTime: "09:00",
      examHours: "09",
      examMinutes: "00",
      colorTheme: "amber",
      cardColor: "automatic",
      description: "",
      isPinned: false,
      notes: "",
      roomNumber: "",
      targetGrade: ""
    });
  };

  // Save new username
  const handleSaveUsername = () => {
    let clean = usernameInput.trim();
    if (!clean.startsWith("@")) clean = "@" + clean;
    if (clean.length < 2) return;
    setFriendUsername(clean);
    setIsChangingUsername(false);
    persistFriends(friends, clean, inviteCode);
  };

  // Copy personal invite link
  const inviteUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/friends/join/${inviteCode}` 
    : `https://www.engeznafsak.com/friends/join/${inviteCode}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Add friend by username
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    let query = addFriendInput.trim();
    if (!query) return;
    if (!query.startsWith("@")) query = "@" + query;

    if (query.toLowerCase() === friendUsername.toLowerCase()) {
      setFriendFeedback("That is your own username! Share your link with friends.");
      return;
    }

    const alreadyExists = friends.some(f => f.username.toLowerCase() === query.toLowerCase());
    if (alreadyExists) {
      setFriendFeedback(`${query} is already in your study circle!`);
      return;
    }

    // Add new friend
    const newFriend: FriendItem = {
      id: "friend_" + Date.now(),
      username: query,
      displayName: query.replace("@", ""),
      focusMinutesThisWeek: Math.floor(60 + Math.random() * 240),
      streak: Math.floor(1 + Math.random() * 8),
      upcomingExamsCount: Math.floor(1 + Math.random() * 5),
      status: Math.random() > 0.5 ? "studying" : "online",
      addedAt: new Date().toISOString()
    };

    const updated = [newFriend, ...friends];
    persistFriends(updated);
    setAddFriendInput("");
    setFriendFeedback(`Success! Added ${query} to your study friends leaderboard.`);
    setTimeout(() => setFriendFeedback(null), 4000);
  };

  // Remove a friend
  const handleRemoveFriend = (id: string) => {
    const updated = friends.filter(f => f.id !== id);
    persistFriends(updated);
  };

  // Pending incoming friend requests
  const pendingRequests = useMemo(() => {
    return (friendRequests || []).filter(r => r.status === "pending" || !r.status);
  }, [friendRequests]);

  // Accept incoming friend request (Option to accept friend requests requested by user)
  const handleAcceptRequest = (requestId: string) => {
    const currentRequests = friendRequests || [];
    const targetReq = currentRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    // Convert request into new FriendItem
    const newFriend: FriendItem = {
      id: "friend_" + Date.now(),
      username: targetReq.senderUsername,
      displayName: targetReq.senderDisplayName || targetReq.senderUsername.replace("@", ""),
      avatarUrl: targetReq.senderAvatarUrl,
      focusMinutesThisWeek: targetReq.senderFocusMinutes ?? Math.floor(90 + Math.random() * 180),
      streak: targetReq.senderStreak ?? Math.floor(2 + Math.random() * 5),
      upcomingExamsCount: targetReq.upcomingExamsCount ?? Math.floor(1 + Math.random() * 4),
      status: "online",
      addedAt: new Date().toISOString()
    };

    const updatedFriends = [
      newFriend,
      ...friends.filter(f => f.username.toLowerCase() !== targetReq.senderUsername.toLowerCase())
    ];
    const updatedRequests = currentRequests.filter(r => r.id !== requestId);

    persistFriends(updatedFriends, undefined, undefined, updatedRequests);
    setFriendFeedback(`Accepted friend request from ${targetReq.senderDisplayName || targetReq.senderUsername}! They are now in your Study Circle.`);
    setTimeout(() => setFriendFeedback(null), 5000);
  };

  // Decline incoming friend request
  const handleDeclineRequest = (requestId: string) => {
    const currentRequests = friendRequests || [];
    const targetReq = currentRequests.find(r => r.id === requestId);
    const updatedRequests = currentRequests.filter(r => r.id !== requestId);
    persistFriends(friends, undefined, undefined, updatedRequests);
    if (targetReq) {
      setFriendFeedback(`Declined friend request from ${targetReq.senderDisplayName || targetReq.senderUsername}.`);
      setTimeout(() => setFriendFeedback(null), 4000);
    }
  };

  // Helper to simulate a new incoming friend request for testing
  const handleSimulateIncomingRequest = () => {
    const samplePeers = [
      { name: "Omar Farooq", username: "@omar_farooq", mins: 245, streak: 7, exams: 2 },
      { name: "Layla Hassan", username: "@layla_hassan", mins: 180, streak: 4, exams: 4 },
      { name: "Zaid Nabil", username: "@zaid_nabil", mins: 310, streak: 9, exams: 3 },
      { name: "Mariam Taha", username: "@mariam_taha", mins: 140, streak: 3, exams: 1 }
    ];
    // Pick one not already a friend or in requests
    const available = samplePeers.filter(p => 
      !friends.some(f => f.username.toLowerCase() === p.username.toLowerCase()) &&
      !(friendRequests || []).some(r => r.senderUsername.toLowerCase() === p.username.toLowerCase())
    );
    const pick = available.length > 0 ? available[0] : samplePeers[Math.floor(Math.random() * samplePeers.length)];
    
    const newReq: FriendRequestItem = {
      id: "req_" + Date.now(),
      senderUsername: pick.username,
      senderDisplayName: pick.name,
      senderFocusMinutes: pick.mins,
      senderStreak: pick.streak,
      upcomingExamsCount: pick.exams,
      sentAt: new Date().toISOString(),
      status: "pending",
      direction: "incoming"
    };

    const currentRequests = friendRequests || [];
    const updatedRequests = [newReq, ...currentRequests.filter(r => r.senderUsername.toLowerCase() !== pick.username.toLowerCase())];
    persistFriends(friends, undefined, undefined, updatedRequests);
    setFriendFeedback(`New friend request received from ${pick.name}!`);
    setTimeout(() => setFriendFeedback(null), 4000);
  };

  // Sorted and filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const countdown = calculateCountdown(exam.examDate, exam.examTime);
      if (examFilter === "pinned") return exam.isPinned;
      if (examFilter === "completed") return countdown.isPast;
      if (examFilter === "upcoming") return !countdown.isPast;
      if (selectedUrgencyTier) {
        const urgency = getExamUrgencyTheme(countdown, isLight, exam.cardColor);
        if (urgency.tierId !== selectedUrgencyTier) return false;
      }
      return true;
    }).sort((a, b) => {
      // Pinned items first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by date ascending
      const dateA = new Date(`${a.examDate}T${a.examTime || "09:00"}`).getTime();
      const dateB = new Date(`${b.examDate}T${b.examTime || "09:00"}`).getTime();
      return dateA - dateB;
    });
  }, [exams, examFilter, selectedUrgencyTier, now, isLight]);

  // Overall Season Progress calculation (from Screenshot 1)
  const seasonStats = useMemo(() => {
    if (exams.length === 0) {
      return { percentage: 0, rangeLabel: "No exams scheduled", dots: [] };
    }
    const dates = exams.map(e => new Date(`${e.examDate}T${e.examTime || "09:00"}`).getTime()).filter(t => !isNaN(t));
    if (dates.length === 0) return { percentage: 0, rangeLabel: "No exams scheduled", dots: [] };

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const nowTime = now.getTime();

    // Overall progress
    let pct = 0;
    if (maxDate > minDate) {
      const elapsed = nowTime - minDate;
      const totalSpan = maxDate - minDate;
      pct = Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100)));
    } else if (nowTime >= minDate) {
      pct = 100;
    }

    // Format range label: e.g. "30 Sep – 13 Nov"
    const minD = new Date(minDate);
    const maxD = new Date(maxDate);
    const rangeLabel = `${minD.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${maxD.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

    // Dot positions along the timeline (0% to 100%)
    const span = maxDate - minDate || 1;
    const dots = exams.map(e => {
      const t = new Date(`${e.examDate}T${e.examTime || "09:00"}`).getTime();
      const pos = Math.min(100, Math.max(0, ((t - minDate) / span) * 100));
      const countdown = calculateCountdown(e.examDate, e.examTime);
      const urgency = getExamUrgencyTheme(countdown, isLight, e.cardColor);
      return { 
        id: e.id, 
        title: e.title, 
        pos, 
        isPast: countdown.isPast,
        dotColor: urgency.dotColor
      };
    });

    return { percentage: pct, rangeLabel, dots };
  }, [exams, now, isLight]);

  // Weekly Leaderboard with Current User + Friends
  const leaderboardEntries: FriendLeaderboardEntry[] = useMemo(() => {
    const list: FriendLeaderboardEntry[] = [
      {
        id: "current_user",
        rank: 1,
        username: friendUsername || "@you",
        displayName: currentUser?.displayName || "You",
        focusMinutes: totalFocusMinutes,
        streak: userStreak,
        isCurrentUser: true,
        badge: "Rising Scholar"
      },
      ...friends.map(f => ({
        id: f.id,
        rank: 1,
        username: f.username,
        displayName: f.displayName,
        focusMinutes: f.focusMinutesThisWeek,
        streak: f.streak,
        isCurrentUser: false,
        badge: f.focusMinutesThisWeek > 200 ? "Coffee Champ" : undefined
      }))
    ];

    // Sort descending by focus minutes
    list.sort((a, b) => b.focusMinutes - a.focusMinutes);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [friends, friendUsername, currentUser, totalFocusMinutes, userStreak]);

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 ${
      isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"
    }`}>
      
      {/* =========================================================================
          TOP ACTION BAR & HEADER (MATCHING SCREENSHOT 1 & SCREENSHOT 2)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        {/* Title / Student Humor Tagline */}
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-black font-sans tracking-tight">
              {activeSubView === "exams" ? "Definitely not stressing. Definitely." : "Friends & Study Circle"}
            </h2>
          </div>
          <p className={`text-xs sm:text-sm font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#B8AFA6]"}`}>
            {activeSubView === "exams"
              ? "Live countdown clocks, urgency color-mapping & exam season timeline"
              : "Study together, log weekly focus minutes, and compare friendly leaderboards"}
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Subview Switcher: My Exams vs Friends */}
          <div className={`p-1 rounded-2xl border flex items-center shadow-2xs ${
            isLight ? "bg-[#FFFFFF] border-[#E8D7C9]" : "bg-[#140E26] border-[#2C1F4A]"
          }`}>
            <button
              onClick={() => setActiveSubView("exams")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "exams"
                  ? isLight
                    ? "bg-[#C25E42] text-white shadow-2xs"
                    : "bg-[#8B5CF6] text-white shadow-xs"
                  : isLight
                    ? "text-[#77736B] hover:text-[#1D1D1B]"
                    : "text-[#C4B5FD] hover:text-[#FAF8F5]"
              }`}
            >
              <CalendarClock size={14} />
              <span>My Exams</span>
              {exams.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubView === "exams" ? "bg-white/20 text-white" : "bg-black/10 dark:bg-white/10"
                }`}>
                  {exams.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubView("friends")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "friends"
                  ? isLight
                    ? "bg-[#C25E42] text-white shadow-2xs"
                    : "bg-[#8B5CF6] text-white shadow-xs"
                  : isLight
                    ? "text-[#77736B] hover:text-[#1D1D1B]"
                    : "text-[#C4B5FD] hover:text-[#FAF8F5]"
              }`}
            >
              <Users size={14} />
              <span>Friends</span>
              {friends.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubView === "friends" ? "bg-white/20 text-white" : "bg-black/10 dark:bg-white/10"
                }`}>
                  {friends.length}
                </span>
              )}
              {pendingRequests.length > 0 && (
                <span 
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse"
                  title={`${pendingRequests.length} pending friend request${pendingRequests.length > 1 ? "s" : ""}`}
                >
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* If on Exams view: Add Exam & Add Friend buttons */}
          {activeSubView === "exams" && (
            <>
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer appearance-none pr-7 shadow-2xs ${
                    isLight 
                      ? "bg-white border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F7F5F0]" 
                      : "bg-[#140E26] border-[#2C1F4A] text-[#FAF8F5] hover:bg-[#1E1735]"
                  }`}
                >
                  <option value="all">All Exams</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="pinned">Pinned Only</option>
                  <option value="completed">Past / Completed</option>
                </select>
                <ChevronDown size={12} className={`absolute right-2.5 top-3 pointer-events-none ${isLight ? "text-[#C25E42]" : "opacity-60"}`} />
              </div>

              {/* Add a Friend Shortcut Button (Requested by User!) */}
              <button
                onClick={() => setActiveSubView("friends")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isLight 
                    ? "bg-white border-[#E8D7C9] hover:bg-[#F7F5F0] text-[#1D1D1B]" 
                    : "bg-[#140E26] border-[#2C1F4A] hover:bg-[#1E1735] text-[#FAF8F5]"
                }`}
                title="Add a study buddy and compare focus scores"
              >
                <UserPlus size={14} className={isLight ? "text-[#C25E42]" : "text-[#8B5CF6] dark:text-[#C084FC]"} />
                <span>+ Add a Friend</span>
              </button>

              {/* + Add Exam Primary Action */}
              <button
                onClick={() => {
                  setEditingExamId(null);
                  setExamForm({
                    title: "",
                    subject: "",
                    paperCode: "",
                    examDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
                    examTime: "09:00",
                    examHours: "09",
                    examMinutes: "00",
                    colorTheme: "amber",
                    cardColor: "automatic",
                    description: "",
                    isPinned: false,
                    notes: "",
                    roomNumber: "",
                    targetGrade: ""
                  });
                  setIsAddExamOpen(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] ${
                  isLight 
                    ? "bg-[#C25E42] hover:bg-[#B25136] text-white" 
                    : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                }`}
              >
                <Plus size={15} />
                <span>+ Add Exam</span>
              </button>
            </>
          )}

          {/* If on Friends view: Quick + Add Friend prompt */}
          {activeSubView === "friends" && (
            <button
              onClick={() => {
                const el = document.getElementById("add-friend-input-box");
                if (el) el.focus();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] ${
                isLight 
                  ? "bg-[#C25E42] hover:bg-[#B25136] text-white" 
                  : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(139,92,246,0.35)]"
              }`}
            >
              <UserPlus size={15} />
              <span>+ Add Friend</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: EXAM COUNTDOWN GRID & TIMELINE (SCREENSHOT 1)
      ========================================================================= */}
      {activeSubView === "exams" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* URGENCY SPECTRUM LEGEND & FILTER BAR */}
          <div className={`p-3 sm:p-4 rounded-3xl border transition-all ${
            isLight ? "bg-white/90 border-[#E8D7C9] shadow-xs" : "bg-[#101322]/95 border-white/10 shadow-xs"
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? "text-[#555047]" : "text-[#C084FC]"}`}>
                  Urgency Spectrum:
                </span>
                {selectedUrgencyTier && (
                  <button
                    onClick={() => setSelectedUrgencyTier(null)}
                    className={`text-[11px] font-mono font-bold ${
                      isLight ? "text-[#C25E42] hover:text-[#B25136]" : "text-[#C084FC] hover:text-white"
                    } underline cursor-pointer ml-1`}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {URGENCY_TIERS_LEGEND.map((tier) => {
                  const isSelected = selectedUrgencyTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedUrgencyTier(isSelected ? null : tier.id)}
                      className={`px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? isLight 
                            ? "ring-2 ring-[#C25E42] shadow-xs scale-105" 
                            : "ring-2 ring-[#8B5CF6] shadow-xs scale-105"
                          : "hover:scale-102"
                      } ${isLight ? tier.lightBadge : tier.darkBadge}`}
                      title={`Filter by ${tier.name} (${tier.label})`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${isLight ? tier.lightDot : tier.darkDot} shrink-0 shadow-xs`} />
                      <span>{tier.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* EXAM CARDS GRID */}
          {filteredExams.length === 0 ? (
            /* Empty State */
            <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 ${
              isLight ? "bg-white border-[#E8D7C9]" : "bg-[#101322]/95 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
            }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                isLight 
                  ? "bg-[#FFF2ED] border border-[#F0D5CC] text-[#C25E42]" 
                  : "bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C084FC]"
              }`}>
                <CalendarClock size={28} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-extrabold font-sans">
                  {selectedUrgencyTier 
                    ? "No exams in this urgency tier" 
                    : examFilter === "all" 
                    ? "No Exam Countdowns Yet" 
                    : `No ${examFilter} exams found`}
                </h3>
                <p className={`text-xs sm:text-sm font-sans mt-1 ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  {selectedUrgencyTier 
                    ? "Try selecting another urgency range or show all exams." 
                    : "Stay ahead of your academic season. Track every paper with customized urgency timers, alerts, and target grades."}
                </p>
              </div>
              {selectedUrgencyTier ? (
                <button
                  onClick={() => setSelectedUrgencyTier(null)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                  } text-white transition inline-flex items-center gap-2 cursor-pointer shadow-xs`}
                >
                  <span>Show All Urgency Tiers</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingExamId(null);
                    setExamForm({
                      title: "",
                      subject: "",
                      paperCode: "",
                      examDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
                      examTime: "09:00",
                      examHours: "09",
                      examMinutes: "00",
                      colorTheme: "amber",
                      cardColor: "automatic",
                      description: "",
                      isPinned: false,
                      notes: "",
                      roomNumber: "",
                      targetGrade: ""
                    });
                    setIsAddExamOpen(true);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold ${
                    isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/30"
                  } text-white transition inline-flex items-center gap-2 cursor-pointer shadow-xs`}
                >
                  <Plus size={16} />
                  <span>Create Your First Exam</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredExams.map((exam) => {
                const countdown = calculateCountdown(exam.examDate, exam.examTime);
                const urgency = getExamUrgencyTheme(countdown, isLight, exam.cardColor);

                return (
                  <div
                    key={exam.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 ${urgency.glowShadow} hover:shadow-lg flex flex-col justify-between gap-5 relative group ${urgency.cardBg} ${urgency.borderColor}`}
                  >
                    {/* Top Row: Title, Paper Code, Urgency Badge, Date & Actions */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`font-black text-lg sm:text-xl font-sans tracking-tight truncate ${urgency.titleColor}`}>
                              {exam.title}
                            </h3>
                            {exam.paperCode && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/10 dark:bg-white/10 uppercase">
                                {exam.paperCode}
                              </span>
                            )}
                            {/* Distinctive Urgency Badge Pill */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase shrink-0 ${urgency.badgeClasses}`}>
                              {urgency.badgeLabel}
                            </span>
                          </div>
                          <p className={`text-xs font-sans mt-1.5 ${urgency.subtitleColor}`}>
                            {formatExamDateTime(exam.examDate, exam.examTime)}
                          </p>
                          {(exam.description || exam.notes) && (
                            <p className={`text-xs font-sans mt-2 line-clamp-2 leading-relaxed ${isLight ? "text-[#55524D]" : "text-slate-300"}`}>
                              {exam.description || exam.notes}
                            </p>
                          )}
                        </div>

                        {/* Top Action Icons: Pin & Options */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleTogglePin(exam.id, e)}
                            title={exam.isPinned ? "Unpin exam" : "Pin exam to top"}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              exam.isPinned
                                ? isLight ? "text-[#C25E42] bg-[#C25E42]/15" : "text-[#C084FC] bg-[#8B5CF6]/20"
                                : "text-[#77736B] dark:text-[#ADA59B] hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            <Pin size={14} className={exam.isPinned ? "fill-current" : ""} />
                          </button>
                          <button
                            onClick={(e) => handleEditExam(exam, e)}
                            title="Edit exam details"
                            className="p-1.5 rounded-lg text-[#77736B] dark:text-[#ADA59B] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteExam(exam.id, e)}
                            title="Delete exam countdown"
                            className="p-1.5 rounded-lg text-[#77736B] dark:text-[#ADA59B] hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Optional metadata: target grade & room */}
                      {(exam.targetGrade || exam.roomNumber) && (
                        <div className="flex items-center gap-2 mt-2.5">
                          {exam.targetGrade && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isLight 
                                ? "bg-[#C25E42]/15 text-[#C25E42] border border-[#C25E42]/20" 
                                : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/30"
                            }`}>
                              Target: {exam.targetGrade}
                            </span>
                          )}
                          {exam.roomNumber && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-[#77736B] dark:text-[#ADA59B] border border-black/10 dark:border-white/10">
                              Room: {exam.roomNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* COUNTDOWN DIGITS BLOCKS (DYNAMIC ACCORDING TO URGENCY THEME) */}
                    <div>
                      {countdown.isPast ? (
                        <div className={`p-3 rounded-2xl text-center border font-mono text-xs font-bold ${urgency.pillBg} ${urgency.pillBorder} ${urgency.titleColor} flex items-center justify-center gap-2`}>
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <span>Exam Completed</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {/* DAYS BLOCK */}
                          <div className={`p-3 rounded-2xl border ${urgency.pillBg} ${urgency.pillBorder} transition-colors`}>
                            <span className={`text-xl sm:text-2xl font-black font-mono block leading-none ${urgency.digitColor}`}>
                              {countdown.days}
                            </span>
                            <span className={`text-[10px] font-mono uppercase tracking-wider block mt-1 font-bold ${urgency.unitColor}`}>
                              days
                            </span>
                          </div>

                          {/* HOURS BLOCK */}
                          <div className={`p-3 rounded-2xl border ${urgency.pillBg} ${urgency.pillBorder} transition-colors`}>
                            <span className={`text-xl sm:text-2xl font-black font-mono block leading-none ${urgency.digitColor}`}>
                              {countdown.hours}
                            </span>
                            <span className={`text-[10px] font-mono uppercase tracking-wider block mt-1 font-bold ${urgency.unitColor}`}>
                              hours
                            </span>
                          </div>

                          {/* MINUTES BLOCK */}
                          <div className={`p-3 rounded-2xl border ${urgency.pillBg} ${urgency.pillBorder} transition-colors`}>
                            <span className={`text-xl sm:text-2xl font-black font-mono block leading-none ${urgency.digitColor}`}>
                              {countdown.minutes}
                            </span>
                            <span className={`text-[10px] font-mono uppercase tracking-wider block mt-1 font-bold ${urgency.unitColor}`}>
                              minutes
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              SEASON TIMELINE PROGRESS BAR (MATCHING SCREENSHOT 1 BOTTOM BAR)
          ========================================================================= */}
          {exams.length > 0 && (
            <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row items-center gap-4 ${
              isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            }`}>
              {/* Progress Percentage & Dots Track */}
              <div className="flex-1 w-full flex items-center gap-3">
                <div className="relative flex-1 h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-visible flex items-center">
                  {/* Elapsed Fill */}
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLight 
                        ? "bg-gradient-to-r from-[#C25E42] to-[#EA580C]" 
                        : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
                    }`}
                    style={{ width: `${seasonStats.percentage}%` }}
                  />

                  {/* Current progress badge pill */}
                  <div 
                    className={`absolute -top-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xs transform -translate-x-1/2 ${
                      isLight ? "bg-[#C25E42]" : "bg-[#6366F1]"
                    }`}
                    style={{ left: `${Math.max(8, Math.min(92, seasonStats.percentage))}%` }}
                  >
                    {seasonStats.percentage}%
                  </div>

                  {/* Exam marker dots along timeline */}
                  {seasonStats.dots.map((dot) => (
                    <div
                      key={dot.id}
                      title={dot.title}
                      className={`absolute w-3.5 h-3.5 rounded-full border-2 transform -translate-x-1/2 transition-transform hover:scale-125 cursor-pointer ${dot.dotColor} border-white dark:border-[#090A10] shadow-xs`}
                      style={{ left: `${dot.pos}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Date Range Badge */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                isLight 
                  ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B]" 
                  : "bg-[#120E22] border-white/10 text-white"
              }`}>
                <Calendar size={13} className={isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"} />
                <span>{seasonStats.rangeLabel}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: FRIENDS & STUDY CIRCLE (SCREENSHOT 2)
      ========================================================================= */}
      {activeSubView === "friends" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 1. THINK YOU'D WIN? BANNER CARD (MATCHING SCREENSHOT 2) */}
          {showFriendBanner && (
            <div className={`p-4 sm:p-5 rounded-3xl border relative transition-all shadow-xs ${
              isLight 
                ? "bg-gradient-to-r from-[#FFF5F0] to-[#FAF8F5] border-[#E8D7C9]" 
                : "bg-gradient-to-r from-[#1A0E2E] via-[#120A24] to-[#0A0714] border-[#8B5CF6]/35 shadow-[0_10px_35px_rgba(139,92,246,0.15)]"
            }`}>
              <button
                onClick={() => setShowFriendBanner(false)}
                className={`absolute top-3.5 right-3.5 p-1.5 rounded-lg transition cursor-pointer ${
                  isLight ? "text-[#77736B] hover:bg-black/5" : "text-[#C4B5FD] hover:bg-white/10"
                }`}
                title="Dismiss"
              >
                <X size={15} />
              </button>

              <div className="flex items-start gap-3.5 pr-8">
                <div className={`w-10 h-10 rounded-2xl ${
                  isLight ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                } border flex items-center justify-center shrink-0 mt-0.5`}>
                  <Coffee size={20} />
                </div>
                <div>
                  <h4 className={`font-extrabold text-sm sm:text-base font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                    Think you'd win?
                  </h4>
                  <p className={`text-xs sm:text-sm font-sans mt-0.5 leading-relaxed ${
                    isLight ? "text-[#7A6E65]" : "text-[#C4B5FD]/85"
                  }`}>
                    Add a friend with your invite link and find out. Focused minutes stack up on a weekly leaderboard — loser owes coffee.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PENDING FRIEND REQUESTS SECTION (OPTION TO ACCEPT FRIEND REQUESTS)
          ========================================================================= */}
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl ${
                  isLight ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                } border flex items-center justify-center shrink-0`}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                      Friend Requests
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      pendingRequests.length > 0 
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30" 
                        : isLight ? "bg-[#FAF8F5] text-[#77736B] border border-[#E8D7C9]" : "bg-white/5 text-white/50 border border-white/10"
                    }`}>
                      {pendingRequests.length} pending
                    </span>
                  </div>
                  <p className={`text-xs font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                    Accept incoming invites to battle focus minutes on the leaderboard
                  </p>
                </div>
              </div>

              {/* Quick simulation helper for testing acceptance flow */}
              <button
                type="button"
                onClick={handleSimulateIncomingRequest}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  isLight 
                    ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#77736B] hover:text-[#C25E42] hover:border-[#C25E42]" 
                    : "bg-[#140E26] border-white/10 text-[#C4B5FD] hover:text-white hover:border-[#8B5CF6]/50"
                }`}
                title="Simulate receiving an incoming friend request to test the Accept flow"
              >
                <Sparkles size={12} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                <span>Simulate Request</span>
              </button>
            </div>

            {/* LIST OF PENDING REQUESTS */}
            {pendingRequests.length > 0 ? (
              <div className="space-y-3 pt-1">
                {pendingRequests.map((req) => {
                  const initials = (req.senderDisplayName || req.senderUsername || "F")
                    .replace("@", "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLight 
                          ? "bg-[#FAF8F5] border-[#E8D7C9] hover:border-[#C25E42]/40" 
                          : "bg-[#120E22] border-white/10 hover:border-[#8B5CF6]/30"
                      }`}
                    >
                      {/* Sender Details */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isLight 
                            ? "bg-[#FFF2ED] border-[#F0D5CC] text-[#C25E42]" 
                            : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                        }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm truncate ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                              {req.senderDisplayName || req.senderUsername}
                            </span>
                            <span className={`font-mono text-xs ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                              {req.senderUsername}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] font-sans">
                            <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                              <Clock size={11} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                              {req.senderFocusMinutes ?? 0}m focus
                            </span>
                            <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                              <Flame size={11} className="text-amber-500" />
                              {req.senderStreak ?? 1}d streak
                            </span>
                            {req.upcomingExamsCount !== undefined && req.upcomingExamsCount > 0 && (
                              <span className={`flex items-center gap-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                                <BookOpen size={11} className="text-emerald-500" />
                                {req.upcomingExamsCount} exam{req.upcomingExamsCount > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: ACCEPT and DECLINE */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          title="Accept friend request and add to your Study Circle"
                        >
                          <Check size={14} className="stroke-[2.5]" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineRequest(req.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            isLight 
                              ? "border-[#E8D7C9] text-[#77736B] hover:text-red-600 hover:border-red-300 hover:bg-red-50" 
                              : "border-white/10 text-[#C4B5FD]/80 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                          }`}
                          title="Decline request"
                        >
                          <X size={14} />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22]/60 border-white/5"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <Inbox size={15} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                  <span className={`text-xs font-bold ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                    No pending friend requests
                  </span>
                </div>
                <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/70"}`}>
                  When study buddies send you a request or join via your invite link, they will appear here for you to accept.
                </p>
              </div>
            )}
          </div>

          {/* 2. PROFILE & INVITE CONTROLS CARD (MATCHING SCREENSHOT 2) */}
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          }`}>
            
            {/* YOUR USERNAME ROW */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
              }`}>
                Your username
              </label>
              
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
              }`}>
                {isChangingUsername ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="@yourhandle"
                      className={`flex-1 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold outline-none ${
                        isLight 
                          ? "bg-white border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42]" 
                          : "bg-[#0A0714] border-white/20 text-white focus:border-[#8B5CF6]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleSaveUsername}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                        isLight ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"
                      } text-white transition cursor-pointer`}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameInput(friendUsername);
                        setIsChangingUsername(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`font-mono font-bold text-sm sm:text-base ${isLight ? "text-[#C25E42]" : "text-[#C084FC]"}`}>
                      {friendUsername || "@student"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChangingUsername(true)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isLight 
                          ? "bg-white border-[#E8D7C9] hover:bg-[#F0EEE8] text-[#1D1D1B]" 
                          : "bg-[#1A1432] border-white/10 hover:bg-[#231A44] text-white"
                      }`}
                    >
                      <Edit3 size={13} />
                      <span>Change</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* INVITE A FRIEND LINK */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
              }`}>
                Invite a friend
              </label>

              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isLight ? "bg-[#FAF8F5] border-[#E8D7C9]" : "bg-[#120E22] border-white/10"
              }`}>
                <span className={`font-mono text-xs sm:text-sm ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/90"} truncate select-all`}>
                  {inviteUrl}
                </span>

                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    copiedInvite
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isLight 
                      ? "bg-white border-[#E8D7C9] hover:bg-[#F0EEE8] text-[#1D1D1B]" 
                      : "bg-[#1A1432] border-white/10 hover:bg-[#231A44] text-white"
                  }`}
                >
                  {copiedInvite ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedInvite ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* ADD BY USERNAME INPUT */}
            <form onSubmit={handleAddFriend} className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
              }`}>
                Add by username
              </label>

              <div className="flex items-center gap-2">
                <input
                  id="add-friend-input-box"
                  type="text"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="@username"
                  className={`flex-1 px-4 py-2.5 rounded-2xl border text-sm font-mono font-medium outline-none transition ${
                    isLight 
                      ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42] focus:bg-white" 
                      : "bg-[#120E22] border-white/10 text-white focus:border-[#8B5CF6] focus:bg-[#1A1432]"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!addFriendInput.trim()}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold ${
                    isLight ? "bg-[#6366F1] hover:bg-[#4F46E5]" : "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/30"
                  } disabled:opacity-50 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]`}
                >
                  <span>Send</span>
                  <ArrowRight size={13} className={isLight ? "text-[#C25E42]" : ""} />
                </button>
              </div>

              {friendFeedback && (
                <p className="text-xs font-sans text-emerald-400 font-bold mt-1 animate-in fade-in">
                  {friendFeedback}
                </p>
              )}
            </form>
          </div>

          {/* 3. LEADERBOARD CARD (MATCHING SCREENSHOT 2) */}
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${
            isLight ? "bg-white border-[#E8D7C9]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-[#F59E0B]" />
                  <h3 className={`font-extrabold text-base sm:text-lg font-sans tracking-tight ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                    Leaderboard
                  </h3>
                </div>
                <p className={`text-xs font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                  This week · resets Monday
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                isLight ? "bg-[#FFF2ED] text-[#C25E42] border-[#F0D5CC]" : "bg-[#8B5CF6]/15 text-[#C084FC] border-[#8B5CF6]/35"
              } border`}>
                Weekly Battle
              </span>
            </div>

            {/* Leaderboard entries */}
            <div className="space-y-2.5 pt-1">
              {leaderboardEntries.map((entry) => {
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;

                return (
                  <div
                    key={entry.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      entry.isCurrentUser
                        ? isLight
                          ? "bg-[#FFF4F0] border-[#E8D7C9]"
                          : "bg-[#181030] border-[#8B5CF6]/40 shadow-[0_4px_20px_rgba(139,92,246,0.15)]"
                        : isLight
                        ? "bg-[#FAF8F5] border-[#E8D7C9]"
                        : "bg-[#120E22]/90 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Medal / Badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0 ${
                        isFirst 
                          ? "bg-amber-400 text-amber-950 shadow-xs" 
                          : isSecond 
                          ? "bg-slate-300 text-slate-800" 
                          : isThird 
                          ? "bg-amber-700/30 text-amber-500" 
                          : "bg-black/5 dark:bg-white/5 text-[#77736B] dark:text-[#C4B5FD]/70"
                      }`}>
                        #{entry.rank}
                      </div>

                      {/* Username & details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm truncate ${
                            entry.isCurrentUser 
                              ? (isLight ? "text-[#C25E42]" : "text-[#C084FC]") 
                              : (isLight ? "text-[#1A1614]" : "text-white")
                          }`}>
                            {entry.username}
                          </span>
                          {entry.isCurrentUser && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                              isLight ? "bg-[#FFF2ED] text-[#C25E42] border border-[#F0D5CC]" : "bg-[#8B5CF6]/25 text-[#E9D5FF]"
                            }`}>
                              You
                            </span>
                          )}
                          {entry.badge && (
                            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-500">
                              {entry.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 mt-0.5 text-xs">
                          <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                            <Clock size={11} />
                            {entry.focusMinutes} focused mins
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[#F59E0B]">
                            <Flame size={11} />
                            {entry.streak}d streak
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action or Coffee Status */}
                    {!entry.isCurrentUser && (
                      <button
                        onClick={() => handleRemoveFriend(entry.id)}
                        title="Remove friend from circle"
                        className="p-1.5 rounded-lg text-[#77736B] dark:text-[#C4B5FD]/60 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT EXAM
      ========================================================================= */}
      {/* =========================================================================
          MODAL: ADD / EDIT EXAM (EXACTLY MATCHING SCREENSHOT 1)
      ========================================================================= */}
      {isAddExamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className={`w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-3xl sm:rounded-[32px] border shadow-2xl my-auto p-5 sm:p-8 space-y-5 transition-all ${
            isLight 
              ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B]" 
              : "bg-[#0D0A1C] border-white/10 text-white shadow-[0_20px_70px_rgba(0,0,0,0.9)]"
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl sm:text-2xl font-sans tracking-tight">
                  {editingExamId ? "Edit Exam" : "Add New Exam"}
                </h3>
                <p className={`text-xs sm:text-sm mt-1 font-medium ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Enter the details of your new exam below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExamOpen(false)}
                className="p-2 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitExamForm} className="space-y-4">
              {/* Field 1: Exam name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold block">
                  Exam name
                </label>
                <input
                  type="text"
                  required
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="e.g. Mathematics Paper 1"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium transition outline-none ${
                    isLight 
                      ? "bg-[#ECEAE4]/60 border-[#D5D2CA] text-[#1D1D1B] placeholder-[#9E9A91] focus:border-[#C25E42] focus:ring-2 focus:ring-[#C25E42]/15" 
                      : "bg-[#161228] border-white/10 text-white placeholder-slate-500 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/25"
                  }`}
                />
              </div>

              {/* Field 2: Exam Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold block">
                  Exam Date
                </label>
                <div className="relative flex items-center">
                  <Calendar size={18} className="absolute left-4 text-[#77736B] dark:text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium transition outline-none cursor-pointer ${
                      isLight 
                        ? "bg-[#ECEAE4]/60 border-[#D5D2CA] text-[#1D1D1B] focus:border-[#C25E42] focus:ring-2 focus:ring-[#C25E42]/15" 
                        : "bg-[#161228] border-white/10 text-white focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/25"
                    }`}
                  />
                </div>
              </div>

              {/* Field 3: Exam Time */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold block">
                  Exam Time
                </label>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-[#77736B] dark:text-slate-400 shrink-0 mr-1" />
                  <input
                    type="text"
                    maxLength={2}
                    value={examForm.examHours}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (val.length <= 2) {
                        setExamForm({ ...examForm, examHours: val });
                      }
                    }}
                    onBlur={() => {
                      const num = parseInt(examForm.examHours || "0", 10);
                      const clamped = Math.max(0, Math.min(23, isNaN(num) ? 9 : num));
                      setExamForm({ ...examForm, examHours: clamped.toString().padStart(2, "0") });
                    }}
                    placeholder="09"
                    className={`w-14 text-center py-2.5 px-2 rounded-2xl border font-mono text-sm font-bold transition outline-none ${
                      isLight 
                        ? "bg-[#ECEAE4]/80 border-[#D5D2CA] text-[#1D1D1B] focus:border-[#C25E42] focus:ring-2 focus:ring-[#C25E42]/15" 
                        : "bg-[#161228] border-white/10 text-white focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/25"
                    }`}
                  />
                  <span className="font-bold text-base text-[#77736B] dark:text-slate-400">:</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={examForm.examMinutes}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (val.length <= 2) {
                        setExamForm({ ...examForm, examMinutes: val });
                      }
                    }}
                    onBlur={() => {
                      const num = parseInt(examForm.examMinutes || "0", 10);
                      const clamped = Math.max(0, Math.min(59, isNaN(num) ? 0 : num));
                      setExamForm({ ...examForm, examMinutes: clamped.toString().padStart(2, "0") });
                    }}
                    placeholder="00"
                    className={`w-14 text-center py-2.5 px-2 rounded-2xl border font-mono text-sm font-bold transition outline-none ${
                      isLight 
                        ? "bg-[#ECEAE4]/80 border-[#D5D2CA] text-[#1D1D1B] focus:border-[#C25E42] focus:ring-2 focus:ring-[#C25E42]/15" 
                        : "bg-[#161228] border-white/10 text-white focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/25"
                    }`}
                  />
                </div>
              </div>

              {/* Field 4: Description (Optional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold block">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  placeholder="Add any additional details about the exam. You can add line breaks."
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium transition outline-none resize-y ${
                    isLight 
                      ? "bg-[#ECEAE4]/60 border-[#D5D2CA] text-[#1D1D1B] placeholder-[#9E9A91] focus:border-[#C25E42] focus:ring-2 focus:ring-[#C25E42]/15" 
                      : "bg-[#161228] border-white/10 text-white placeholder-slate-500 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/25"
                  }`}
                />
              </div>

              {/* Field 5: Card color */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">
                  Card color
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {[
                    { id: "automatic", label: "Automatic (Urgency)", isRainbow: true },
                    { id: "lavender", label: "Lavender", dotColor: "#C4B5FD" },
                    { id: "sky", label: "Sky", dotColor: "#93C5FD" },
                    { id: "mint", label: "Mint", dotColor: "#86EFAC" },
                    { id: "sunset", label: "Sunset", dotColor: "#FDBA74" },
                    { id: "golden", label: "Golden", dotColor: "#FDE047" },
                    { id: "coral", label: "Coral", dotColor: "#FCA5A5" },
                    { id: "slate", label: "Slate", dotColor: "#CBD5E1" }
                  ].map((colorOpt) => {
                    const isSelected = (examForm.cardColor || "automatic") === colorOpt.id;
                    return (
                      <button
                        key={colorOpt.id}
                        type="button"
                        onClick={() => setExamForm({ ...examForm, cardColor: colorOpt.id as any })}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
                          isSelected
                            ? isLight
                              ? "bg-[#C25E42] text-white shadow-md shadow-[#C25E42]/25 border border-transparent font-semibold"
                              : "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/25 border border-transparent font-semibold"
                            : isLight
                            ? "bg-white border border-[#D5D2CA] text-[#1D1D1B] hover:bg-[#F3EFEA]"
                            : "bg-[#161228] border border-white/10 text-slate-200 hover:bg-[#20173A]"
                        }`}
                      >
                        {colorOpt.isRainbow ? (
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-xs" />
                        ) : (
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: colorOpt.dotColor }}
                          />
                        )}
                        <span>{colorOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons (Cancel & Save) */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddExamOpen(false)}
                  className={`px-5 py-2.5 rounded-2xl border text-sm font-semibold transition cursor-pointer ${
                    isLight 
                      ? "border-black/10 bg-white/70 hover:bg-black/5 text-[#1D1D1B]" 
                      : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-2xl ${
                    isLight
                      ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[#C25E42]/30"
                      : "bg-[#4F46E5] hover:bg-[#4338CA] shadow-[#4F46E5]/30"
                  } text-white text-sm font-semibold shadow-md active:scale-95 transition cursor-pointer`}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

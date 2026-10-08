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
  ArrowRight
} from "lucide-react";
import { User } from "firebase/auth";
import { ExamItem, FriendItem, FriendLeaderboardEntry } from "../types";
import { saveUserExams, saveUserFriendsData } from "../lib/classroom";

interface ExamCountdownTabProps {
  currentUser: User | null;
  exams: ExamItem[];
  setExams: React.Dispatch<React.SetStateAction<ExamItem[]>>;
  friends: FriendItem[];
  setFriends: React.Dispatch<React.SetStateAction<FriendItem[]>>;
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

export const ExamCountdownTab: React.FC<ExamCountdownTabProps> = ({
  currentUser,
  exams,
  setExams,
  friends,
  setFriends,
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
  const persistFriends = (newFriends: FriendItem[], newUsername?: string, newCode?: string) => {
    setFriends(newFriends);
    const un = newUsername !== undefined ? newUsername : friendUsername;
    const cd = newCode !== undefined ? newCode : inviteCode;
    if (currentUser?.uid) {
      saveUserFriendsData(currentUser.uid, newFriends, un, cd);
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

  // Sorted and filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const countdown = calculateCountdown(exam.examDate, exam.examTime);
      if (examFilter === "pinned") return exam.isPinned;
      if (examFilter === "completed") return countdown.isPast;
      if (examFilter === "upcoming") return !countdown.isPast;
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
  }, [exams, examFilter, now]);

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
      return { id: e.id, title: e.title, pos, isPast: t < nowTime };
    });

    return { percentage: pct, rangeLabel, dots };
  }, [exams, now]);

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
            isLight ? "bg-[#FFFFFF] border-[#E3E0D8]" : "bg-[#140E26] border-[#2C1F4A]"
          }`}>
            <button
              onClick={() => setActiveSubView("exams")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "exams"
                  ? isLight
                    ? "bg-[#C96F55] text-white shadow-2xs"
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
                    ? "bg-[#C96F55] text-white shadow-2xs"
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
                      ? "bg-white border-[#E3E0D8] text-[#1D1D1B] hover:bg-[#F7F5F0]" 
                      : "bg-[#140E26] border-[#2C1F4A] text-[#FAF8F5] hover:bg-[#1E1735]"
                  }`}
                >
                  <option value="all">All Exams</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="pinned">Pinned Only</option>
                  <option value="completed">Past / Completed</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-3 pointer-events-none opacity-60" />
              </div>

              {/* Add a Friend Shortcut Button (Requested by User!) */}
              <button
                onClick={() => setActiveSubView("friends")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isLight 
                    ? "bg-white border-[#E3E0D8] hover:bg-[#F7F5F0] text-[#1D1D1B]" 
                    : "bg-[#140E26] border-[#2C1F4A] hover:bg-[#1E1735] text-[#FAF8F5]"
                }`}
                title="Add a study buddy and compare focus scores"
              >
                <UserPlus size={14} className={isLight ? "text-[#C96F55]" : "text-[#8B5CF6] dark:text-[#C084FC]"} />
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
                    ? "bg-[#C96F55] hover:bg-[#B85F48] text-white" 
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
                  ? "bg-[#C96F55] hover:bg-[#B85F48] text-white" 
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
          
          {/* EXAM CARDS GRID */}
          {filteredExams.length === 0 ? (
            /* Empty State */
            <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 ${
              isLight ? "bg-white border-[#E3E0D8]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C084FC] flex items-center justify-center mx-auto">
                <CalendarClock size={28} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-extrabold font-sans">
                  {examFilter === "all" ? "No Exam Countdowns Yet" : `No ${examFilter} exams found`}
                </h3>
                <p className={`text-xs sm:text-sm font-sans mt-1 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                  Stay ahead of your academic season. Track every paper with customized urgency timers, alerts, and target grades.
                </p>
              </div>
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
                  isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/30"
                } text-white transition inline-flex items-center gap-2 cursor-pointer shadow-xs`}
              >
                <Plus size={16} />
                <span>Create Your First Exam</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredExams.map((exam) => {
                const countdown = calculateCountdown(exam.examDate, exam.examTime);
                const isUrgent = !countdown.isPast && countdown.days < 2;
                const isApproaching = !countdown.isPast && countdown.days >= 2 && countdown.days <= 14;
                const isDistant = !countdown.isPast && countdown.days > 14;

                // Color palette according to urgency & card theme
                const chosenColor = exam.cardColor || "automatic";
                let cardBg = isLight ? "bg-white" : "bg-[#0A0714]/90 backdrop-blur-xl";
                let borderColor = isLight ? "border-[#E3E0D8]" : "border-white/10";
                let titleColor = isLight ? "text-[#1D1D1B]" : "text-white";
                let pillBg = isLight ? "bg-[#F7F5F0]" : "bg-white/5";

                if (countdown.isPast) {
                  cardBg = isLight ? "bg-[#F7F5F0]/60 opacity-70" : "bg-[#06040C]/70 border-white/5 opacity-65";
                  borderColor = isLight ? "border-[#E3E0D8]" : "border-white/5";
                } else if (chosenColor === "lavender") {
                  cardBg = isLight ? "bg-[#FAF8FF]" : "bg-[#140E28]/90 border-[#A78BFA]/35 shadow-[0_8px_30px_rgba(139,92,246,0.18)]";
                  borderColor = isLight ? "border-[#DDD6FE]" : "border-[#A78BFA]/40";
                  titleColor = isLight ? "text-[#5B21B6]" : "text-[#E9D5FF]";
                  pillBg = isLight ? "bg-[#EDE9FE]" : "bg-[#8B5CF6]/20";
                } else if (chosenColor === "sky") {
                  cardBg = isLight ? "bg-[#F0F9FF]" : "bg-[#081528]/90 border-[#38BDF8]/35 shadow-[0_8px_30px_rgba(56,189,248,0.18)]";
                  borderColor = isLight ? "border-[#BAE6FD]" : "border-[#38BDF8]/40";
                  titleColor = isLight ? "text-[#0369A1]" : "text-[#BAE6FD]";
                  pillBg = isLight ? "bg-[#E0F2FE]" : "bg-sky-500/20";
                } else if (chosenColor === "mint") {
                  cardBg = isLight ? "bg-[#F0FDF4]" : "bg-[#081F15]/90 border-[#34D399]/35 shadow-[0_8px_30px_rgba(52,211,153,0.18)]";
                  borderColor = isLight ? "border-[#A7F3D0]" : "border-[#34D399]/40";
                  titleColor = isLight ? "text-[#15803D]" : "text-[#A7F3D0]";
                  pillBg = isLight ? "bg-[#DCFCE7]" : "bg-emerald-500/20";
                } else if (chosenColor === "sunset") {
                  cardBg = isLight ? "bg-[#FFF7ED]" : "bg-[#261208]/90 border-[#FB923C]/35 shadow-[0_8px_30px_rgba(251,146,60,0.18)]";
                  borderColor = isLight ? "border-[#FED7AA]" : "border-[#FB923C]/40";
                  titleColor = isLight ? "text-[#C2410C]" : "text-[#FED7AA]";
                  pillBg = isLight ? "bg-[#FFEDD5]" : "bg-orange-500/20";
                } else if (chosenColor === "golden") {
                  cardBg = isLight ? "bg-[#FEFCE8]" : "bg-[#241C06]/90 border-[#FACC15]/35 shadow-[0_8px_30px_rgba(250,204,21,0.18)]";
                  borderColor = isLight ? "border-[#FEF08A]" : "border-[#FACC15]/40";
                  titleColor = isLight ? "text-[#A16207]" : "text-[#FEF08A]";
                  pillBg = isLight ? "bg-[#FEF9C3]" : "bg-yellow-500/20";
                } else if (chosenColor === "coral") {
                  cardBg = isLight ? "bg-[#FFF1F2]" : "bg-[#280A14]/90 border-[#FB7185]/35 shadow-[0_8px_30px_rgba(251,113,133,0.18)]";
                  borderColor = isLight ? "border-[#FECDD3]" : "border-[#FB7185]/40";
                  titleColor = isLight ? "text-[#BE123C]" : "text-[#FECDD3]";
                  pillBg = isLight ? "bg-[#FFE4E6]" : "bg-rose-500/20";
                } else if (chosenColor === "slate") {
                  cardBg = isLight ? "bg-[#F8FAFC]" : "bg-[#0F1420]/90 border-[#94A3B8]/35 shadow-[0_8px_30px_rgba(148,163,184,0.18)]";
                  borderColor = isLight ? "border-[#CBD5E1]" : "border-[#94A3B8]/40";
                  titleColor = isLight ? "text-[#334155]" : "text-[#E2E8F0]";
                  pillBg = isLight ? "bg-[#F1F5F9]" : "bg-slate-500/20";
                } else if (exam.colorTheme === "burgundy" || isUrgent) {
                  // Red / Burgundy urgency tone
                  cardBg = isLight ? "bg-[#FFF4F4]" : "bg-[#18090C]/90 border-red-500/30";
                  borderColor = isLight ? "border-[#FCA5A5]" : "border-red-500/30";
                  titleColor = isLight ? "text-[#991B1B]" : "text-red-300";
                  pillBg = isLight ? "bg-[#FEE2E2]" : "bg-red-500/15";
                } else {
                  // Warm Amber / Terracotta default
                  cardBg = isLight ? "bg-[#FFF9F5]" : "bg-[#140E26]/85 border-white/10";
                  borderColor = isLight ? "border-[#FCD34D]" : "border-white/10";
                  titleColor = isLight ? "text-[#B45309]" : "text-amber-200";
                  pillBg = isLight ? "bg-[#FEF3C7]" : "bg-amber-500/15";
                }

                return (
                  <div
                    key={exam.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between gap-5 relative group ${cardBg} ${borderColor}`}
                  >
                    {/* Top Row: Title, Date, Action Buttons */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-black text-lg sm:text-xl font-sans tracking-tight truncate ${titleColor}`}>
                              {exam.title}
                            </h3>
                            {exam.paperCode && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/10 dark:bg-white/10 uppercase">
                                {exam.paperCode}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-sans mt-1 ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"}`}>
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
                                ? "text-[#C96F55] bg-[#C96F55]/15"
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
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#C96F55]/15 text-[#C96F55] border border-[#C96F55]/20">
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

                    {/* COUNTDOWN DIGITS BLOCKS (MATCHING SCREENSHOT 1) */}
                    <div>
                      {countdown.isPast ? (
                        <div className={`p-3 rounded-2xl text-center border font-mono text-xs font-bold ${pillBg} border-black/5 dark:border-white/5 text-[#77736B] dark:text-[#ADA59B] flex items-center justify-center gap-2`}>
                          <CheckCircle2 size={15} className="text-emerald-500" />
                          <span>Exam Completed</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {/* DAYS BLOCK */}
                          <div className={`p-3 rounded-2xl border ${pillBg} border-black/5 dark:border-white/5`}>
                            <span className="text-xl sm:text-2xl font-black font-mono block leading-none">
                              {countdown.days}
                            </span>
                            <span className={`text-[10px] font-mono uppercase tracking-wider block mt-1 ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"}`}>
                              days
                            </span>
                          </div>

                          {/* HOURS BLOCK */}
                          <div className={`p-3 rounded-2xl border ${pillBg} border-black/5 dark:border-white/5`}>
                            <span className="text-xl sm:text-2xl font-black font-mono block leading-none">
                              {countdown.hours}
                            </span>
                            <span className={`text-[10px] font-mono uppercase tracking-wider block mt-1 ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"}`}>
                              hours
                            </span>
                          </div>

                          {/* MINUTES BLOCK */}
                          <div className={`p-3 rounded-2xl border ${pillBg} border-black/5 dark:border-white/5`}>
                            <span className="text-xl sm:text-2xl font-black font-mono block leading-none">
                              {countdown.minutes}
                            </span>
                            <span className={`text-[10px] font-mono uppercase tracking-wider block mt-1 ${isLight ? "text-[#77736B]" : "text-[#ADA59B]"}`}>
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
              isLight ? "bg-white border-[#E3E0D8]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            }`}>
              {/* Progress Percentage & Dots Track */}
              <div className="flex-1 w-full flex items-center gap-3">
                <div className="relative flex-1 h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-visible flex items-center">
                  {/* Elapsed Fill */}
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all duration-500"
                    style={{ width: `${seasonStats.percentage}%` }}
                  />

                  {/* Current progress badge pill */}
                  <div 
                    className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6366F1] text-white shadow-xs transform -translate-x-1/2"
                    style={{ left: `${Math.max(8, Math.min(92, seasonStats.percentage))}%` }}
                  >
                    {seasonStats.percentage}%
                  </div>

                  {/* Exam marker dots along timeline */}
                  {seasonStats.dots.map((dot) => (
                    <div
                      key={dot.id}
                      title={dot.title}
                      className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 transition-transform hover:scale-125 cursor-pointer ${
                        dot.isPast 
                          ? "bg-emerald-500 border-white dark:border-[#0A0714]" 
                          : "bg-[#F87171] border-white dark:border-[#0A0714]"
                      }`}
                      style={{ left: `${dot.pos}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Date Range Badge */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                isLight 
                  ? "bg-[#FAF8F5] border-[#E3E0D8] text-[#1D1D1B]" 
                  : "bg-[#120E22] border-white/10 text-white"
              }`}>
                <Calendar size={13} className={isLight ? "text-[#C96F55]" : "text-[#8B5CF6]"} />
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
                  isLight ? "bg-[#C96F55]/15 border-[#C96F55]/30 text-[#C96F55]" : "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#C084FC]"
                } border flex items-center justify-center shrink-0 mt-0.5`}>
                  <Coffee size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base font-sans tracking-tight text-white">
                    Think you'd win?
                  </h4>
                  <p className={`text-xs sm:text-sm font-sans mt-0.5 leading-relaxed ${
                    isLight ? "text-[#555047]" : "text-[#C4B5FD]/85"
                  }`}>
                    Add a friend with your invite link and find out. Focused minutes stack up on a weekly leaderboard — loser owes coffee.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROFILE & INVITE CONTROLS CARD (MATCHING SCREENSHOT 2) */}
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-5 ${
            isLight ? "bg-white border-[#E3E0D8]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          }`}>
            
            {/* YOUR USERNAME ROW */}
            <div className="space-y-1.5">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
              }`}>
                Your username
              </label>
              
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isLight ? "bg-[#FAF8F5] border-[#E3E0D8]" : "bg-[#120E22] border-white/10"
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
                          ? "bg-white border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55]" 
                          : "bg-[#0A0714] border-white/20 text-white focus:border-[#8B5CF6]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleSaveUsername}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                        isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-[#7C3AED] hover:bg-[#6D28D9]"
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
                    <span className={`font-mono font-bold text-sm sm:text-base ${isLight ? "text-[#C96F55]" : "text-[#C084FC]"}`}>
                      {friendUsername || "@student"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChangingUsername(true)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isLight 
                          ? "bg-white border-[#E3E0D8] hover:bg-[#F0EEE8] text-[#1D1D1B]" 
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
                isLight ? "bg-[#FAF8F5] border-[#E3E0D8]" : "bg-[#120E22] border-white/10"
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
                      ? "bg-white border-[#E3E0D8] hover:bg-[#F0EEE8] text-[#1D1D1B]" 
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
                      ? "bg-[#FAF8F5] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55] focus:bg-white" 
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
                  <ArrowRight size={13} />
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
            isLight ? "bg-white border-[#E3E0D8]" : "bg-[#0A0714]/85 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-[#F59E0B]" />
                  <h3 className="font-extrabold text-base sm:text-lg font-sans tracking-tight text-white">
                    Leaderboard
                  </h3>
                </div>
                <p className={`text-xs font-sans mt-0.5 ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                  This week · resets Monday
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                isLight ? "bg-[#C96F55]/15 text-[#C96F55] border-[#C96F55]/30" : "bg-[#8B5CF6]/15 text-[#C084FC] border-[#8B5CF6]/35"
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
                        ? "bg-[#FAF8F5] border-[#E3E0D8]"
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
                            entry.isCurrentUser ? (isLight ? "text-[#C96F55]" : "text-[#C084FC]") : "text-white"
                          }`}>
                            {entry.username}
                          </span>
                          {entry.isCurrentUser && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                              isLight ? "bg-[#C96F55]/20 text-[#C96F55]" : "bg-[#8B5CF6]/25 text-[#E9D5FF]"
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
          <div className={`w-full max-w-lg rounded-3xl sm:rounded-[32px] border shadow-2xl overflow-hidden my-auto p-6 sm:p-8 space-y-5 transition-all ${
            isLight 
              ? "bg-[#FAF8F5] border-[#E3E0D8] text-[#1D1D1B]" 
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
                      ? "bg-[#ECEAE4]/60 border-[#D5D2CA] text-[#1D1D1B] placeholder-[#9E9A91] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15" 
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
                        ? "bg-[#ECEAE4]/60 border-[#D5D2CA] text-[#1D1D1B] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15" 
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
                        ? "bg-[#ECEAE4]/80 border-[#D5D2CA] text-[#1D1D1B] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15" 
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
                        ? "bg-[#ECEAE4]/80 border-[#D5D2CA] text-[#1D1D1B] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15" 
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
                      ? "bg-[#ECEAE4]/60 border-[#D5D2CA] text-[#1D1D1B] placeholder-[#9E9A91] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15" 
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
                    { id: "automatic", label: "Automatic", isRainbow: true },
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
                            ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/25 border border-transparent font-semibold"
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
                  className="px-6 py-2.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-md shadow-[#4F46E5]/30 active:scale-95 transition cursor-pointer"
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

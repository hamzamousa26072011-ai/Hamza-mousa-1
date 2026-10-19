import React, { useState, useEffect, useMemo } from "react";
import { 
  CalendarClock, 
  Plus, 
  Trash2, 
  Edit3, 
  Pin, 
  Users, 
  Clock, 
  Copy, 
  Check, 
  X, 
  Flame, 
  Trophy, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ArrowRight,
  RotateCcw,
  Info
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
  totalFocusMinutes = 0,
  userStreak = 0,
  themeMode = "dark"
}) => {
  const isLight = themeMode === "light";

  // Subview: "exams" or "friends"
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

  // Local timezone label
  const localTimezoneLabel = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
    } catch {
      return "Local time";
    }
  }, []);

  // Modal & confirmation states
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examFormError, setExamFormError] = useState<string | null>(null);
  const [examSuccessBanner, setExamSuccessBanner] = useState<string | null>(null);

  // Destructive delete confirmation & Undo state
  const [examPendingDelete, setExamPendingDelete] = useState<ExamItem | null>(null);
  const [recentlyDeletedExam, setRecentlyDeletedExam] = useState<ExamItem | null>(null);

  // Friends states
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(friendUsername || "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [friendFeedback, setFriendFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [friendPendingRemove, setFriendPendingRemove] = useState<FriendItem | null>(null);

  // Exam Form State
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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAddExamOpen) setIsAddExamOpen(false);
        if (examPendingDelete) setExamPendingDelete(null);
        if (friendPendingRemove) setFriendPendingRemove(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddExamOpen, examPendingDelete, friendPendingRemove]);

  // Ensure user has default username & invite code if blank
  useEffect(() => {
    if (!friendUsername) {
      const generated = currentUser?.displayName
        ? `@${currentUser.displayName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`
        : currentUser?.email
        ? `@${currentUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")}`
        : `@student_${Math.floor(1000 + Math.random() * 9000)}`;
      setFriendUsername(generated);
      setUsernameInput(generated);
    }
    if (!inviteCode) {
      const newCode = Math.random().toString(36).substring(2, 10);
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

  // Format date readable: e.g. "Wednesday, 7 October 2026 at 09:00"
  const formatExamDateTime = (examDateStr: string, examTimeStr?: string): string => {
    try {
      const timePart = examTimeStr || "09:00";
      const date = new Date(`${examDateStr}T${timePart}:00`);
      if (isNaN(date.getTime())) return examDateStr;
      const options: Intl.DateTimeFormatOptions = { 
        weekday: "short", 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      };
      const dateFormatted = date.toLocaleDateString(undefined, options);
      return `${dateFormatted} · ${timePart}`;
    } catch {
      return `${examDateStr} · ${examTimeStr || "09:00"}`;
    }
  };

  const persistExams = (newExams: ExamItem[]) => {
    setExams(newExams);
    if (currentUser?.uid) {
      saveUserExams(currentUser.uid, newExams);
    }
  };

  const persistFriends = (newFriends: FriendItem[], newUsername?: string, newCode?: string) => {
    setFriends(newFriends);
    const un = newUsername !== undefined ? newUsername : friendUsername;
    const cd = newCode !== undefined ? newCode : inviteCode;
    if (currentUser?.uid) {
      saveUserFriendsData(currentUser.uid, newFriends, un, cd);
    }
  };

  const showTempBanner = (msg: string) => {
    setExamSuccessBanner(msg);
    setTimeout(() => setExamSuccessBanner(null), 4000);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = exams.map((ex) => (ex.id === id ? { ...ex, isPinned: !ex.isPinned } : ex));
    persistExams(updated);
  };

  const handleConfirmDeleteExam = () => {
    if (!examPendingDelete) return;
    const target = examPendingDelete;
    const updated = exams.filter((ex) => ex.id !== target.id);
    persistExams(updated);
    setRecentlyDeletedExam(target);
    setExamPendingDelete(null);
  };

  const handleUndoDeleteExam = () => {
    if (!recentlyDeletedExam) return;
    persistExams([recentlyDeletedExam, ...exams]);
    setRecentlyDeletedExam(null);
    showTempBanner(`Restored "${recentlyDeletedExam.title}".`);
  };

  const openNewExamModal = () => {
    setEditingExamId(null);
    setExamFormError(null);
    setExamForm({
      title: "",
      subject: "",
      paperCode: "",
      examDate: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
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
  };

  const handleEditExam = (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExamId(exam.id);
    setExamFormError(null);
    const [h, m] = (exam.examTime || "09:00").split(":");
    setExamForm({
      title: exam.title,
      subject: exam.subject || "",
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

  const handleSubmitExamForm = (e: React.FormEvent) => {
    e.preventDefault();
    setExamFormError(null);

    if (!examForm.title.trim()) {
      setExamFormError("Please enter an exam name (for example, Mathematics Paper 2).");
      return;
    }
    if (!examForm.examDate) {
      setExamFormError("Please select the exam date.");
      return;
    }

    const parsedHours = parseInt(examForm.examHours || "9", 10);
    const parsedMinutes = parseInt(examForm.examMinutes || "0", 10);
    if (isNaN(parsedHours) || parsedHours < 0 || parsedHours > 23 || isNaN(parsedMinutes) || parsedMinutes < 0 || parsedMinutes > 59) {
      setExamFormError("Please enter a valid 24-hour time between 00:00 and 23:59.");
      return;
    }

    const hours = String(parsedHours).padStart(2, "0");
    const minutes = String(parsedMinutes).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    if (editingExamId) {
      const updated = exams.map((ex) =>
        ex.id === editingExamId
          ? {
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
            }
          : ex
      );
      persistExams(updated);
      showTempBanner(`Updated "${examForm.title.trim()}".`);
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
      showTempBanner(`Added "${examForm.title.trim()}" to your countdowns.`);
    }

    setIsAddExamOpen(false);
    setEditingExamId(null);
  };

  // Save new username
  const handleSaveUsername = () => {
    setUsernameError(null);
    let clean = usernameInput.trim();
    if (!clean) {
      setUsernameError("Username cannot be empty.");
      return;
    }
    if (!clean.startsWith("@")) clean = "@" + clean;
    const rawHandle = clean.slice(1);
    if (!/^[a-zA-Z0-9_]{2,24}$/.test(rawHandle)) {
      setUsernameError("Use 2–24 letters, numbers, or underscores.");
      return;
    }
    setFriendUsername(clean);
    setIsChangingUsername(false);
    persistFriends(friends, clean, inviteCode);
  };

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?invite=${inviteCode}`
      : `https://engeznafsak.com/?invite=${inviteCode}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Add friend by username
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    setFriendFeedback(null);
    let query = addFriendInput.trim();
    if (!query) {
      setFriendFeedback({ type: "error", message: "Enter a friend's @username to add them." });
      return;
    }
    if (!query.startsWith("@")) query = "@" + query;
    const handlePart = query.slice(1);
    if (!/^[a-zA-Z0-9_]{2,24}$/.test(handlePart)) {
      setFriendFeedback({
        type: "error",
        message: "Invalid username format. Usernames contain 2–24 letters, numbers, or underscores."
      });
      return;
    }

    if (query.toLowerCase() === friendUsername.toLowerCase()) {
      setFriendFeedback({
        type: "error",
        message: "That is your own username. Enter a study partner's username instead."
      });
      return;
    }

    const alreadyExists = friends.some((f) => f.username.toLowerCase() === query.toLowerCase());
    if (alreadyExists) {
      setFriendFeedback({
        type: "error",
        message: `${query} is already in your study circle.`
      });
      return;
    }

    const newFriend: FriendItem = {
      id: "friend_" + Date.now(),
      username: query,
      displayName: query.replace("@", ""),
      focusMinutesThisWeek: 0,
      streak: 1,
      upcomingExamsCount: 0,
      status: "offline",
      addedAt: new Date().toISOString()
    };

    const updated = [newFriend, ...friends];
    persistFriends(updated);
    setAddFriendInput("");
    setFriendFeedback({
      type: "success",
      message: `Added ${query} to your study circle.`
    });
  };

  const handleConfirmRemoveFriend = () => {
    if (!friendPendingRemove) return;
    const updated = friends.filter((f) => f.id !== friendPendingRemove.id);
    persistFriends(updated);
    setFriendPendingRemove(null);
  };

  // Sorted and filtered exams
  const filteredExams = useMemo(() => {
    return exams
      .filter((exam) => {
        const countdown = calculateCountdown(exam.examDate, exam.examTime);
        if (examFilter === "pinned") return exam.isPinned;
        if (examFilter === "completed") return countdown.isPast;
        if (examFilter === "upcoming") return !countdown.isPast;
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const dateA = new Date(`${a.examDate}T${a.examTime || "09:00"}`).getTime();
        const dateB = new Date(`${b.examDate}T${b.examTime || "09:00"}`).getTime();
        return dateA - dateB;
      });
  }, [exams, examFilter, now]);

  // Filter counts for segmented controls
  const filterCounts = useMemo(() => {
    let upcoming = 0;
    let pinned = 0;
    let completed = 0;
    exams.forEach((ex) => {
      const c = calculateCountdown(ex.examDate, ex.examTime);
      if (c.isPast) completed++;
      else upcoming++;
      if (ex.isPinned) pinned++;
    });
    return { all: exams.length, upcoming, pinned, completed };
  }, [exams, now]);

  // Overall Season Timeline
  const seasonStats = useMemo(() => {
    if (exams.length === 0) {
      return { percentage: 0, rangeLabel: "No exams scheduled", dots: [] };
    }
    const dates = exams
      .map((e) => new Date(`${e.examDate}T${e.examTime || "09:00"}`).getTime())
      .filter((t) => !isNaN(t));
    if (dates.length === 0) return { percentage: 0, rangeLabel: "No exams scheduled", dots: [] };

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const nowTime = now.getTime();

    let pct = 0;
    if (maxDate > minDate) {
      const elapsed = nowTime - minDate;
      const totalSpan = maxDate - minDate;
      pct = Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100)));
    } else if (nowTime >= minDate) {
      pct = 100;
    }

    const minD = new Date(minDate);
    const maxD = new Date(maxDate);
    const rangeLabel = `${minD.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${maxD.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

    const span = maxDate - minDate || 1;
    const dots = exams.map((e) => {
      const t = new Date(`${e.examDate}T${e.examTime || "09:00"}`).getTime();
      const pos = Math.min(100, Math.max(0, ((t - minDate) / span) * 100));
      const countdown = calculateCountdown(e.examDate, e.examTime);
      const isMoreThan10Days =
        !countdown.isPast &&
        (countdown.days > 10 || (countdown.days === 10 && (countdown.hours > 0 || countdown.minutes > 0)));
      const isUrgent = !countdown.isPast && countdown.days < 2;
      return {
        id: e.id,
        title: e.title,
        pos,
        isPast: countdown.isPast,
        isMoreThan10Days,
        isUrgent
      };
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
        isCurrentUser: true
      },
      ...friends.map((f) => ({
        id: f.id,
        rank: 1,
        username: f.username,
        displayName: f.displayName,
        focusMinutes: f.focusMinutesThisWeek,
        streak: f.streak,
        isCurrentUser: false
      }))
    ];

    list.sort((a, b) => b.focusMinutes - a.focusMinutes);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [friends, friendUsername, currentUser, totalFocusMinutes, userStreak]);

  return (
    <div className={`space-y-6 ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
      {/* Top Header & Subview Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {activeSubView === "exams" ? "Exam Countdowns" : "Study Circle & Friends"}
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            {activeSubView === "exams"
              ? `Track upcoming papers, target grades, and remaining preparation time (${localTimezoneLabel}).`
              : "Share your study username and compare weekly focus minutes with classmates."}
          </p>
        </div>

        {/* Controls: Segmented Subview Switcher + Primary Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Exam Countdown or Study Circle"
            className={`p-1 rounded-xl border flex items-center ${
              isLight ? "bg-[#F0F2F7] border-[#E2E6EF]" : "bg-[#222938] border-[#283040]"
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeSubView === "exams"}
              onClick={() => setActiveSubView("exams")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "exams"
                  ? isLight
                    ? "bg-[#FFFFFF] text-[#18202B] shadow-2xs"
                    : "bg-[#191E28] text-[#F1F3F8] shadow-2xs"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#B7C0CF] hover:text-[#F1F3F8]"
              }`}
            >
              <CalendarClock size={14} />
              <span>My Exams ({exams.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeSubView === "friends"}
              onClick={() => setActiveSubView("friends")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "friends"
                  ? isLight
                    ? "bg-[#FFFFFF] text-[#18202B] shadow-2xs"
                    : "bg-[#191E28] text-[#F1F3F8] shadow-2xs"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#B7C0CF] hover:text-[#F1F3F8]"
              }`}
            >
              <Users size={14} />
              <span>Study Circle ({friends.length})</span>
            </button>
          </div>

          {activeSubView === "exams" ? (
            <button
              type="button"
              onClick={openNewExamModal}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? "bg-[#5F55C8] hover:bg-[#4E45B0]"
                  : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
              }`}
            >
              <Plus size={15} />
              <span>Add Exam</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("add-friend-input-box");
                if (el) el.focus();
              }}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? "bg-[#5F55C8] hover:bg-[#4E45B0]"
                  : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
              }`}
            >
              <UserPlus size={15} />
              <span>Add Friend</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback & Undo Banners */}
      {examSuccessBanner && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            isLight
              ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#15803D]"
              : "bg-[#10B981]/15 border-[#34D399]/30 text-[#34D399]"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{examSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setExamSuccessBanner(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded hover:bg-black/5 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {recentlyDeletedExam && (
        <div
          role="region"
          aria-label="Undo exam deletion"
          className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight
              ? "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]"
              : "bg-[#F59E0B]/15 border-[#FBBF24]/30 text-[#FBBF24]"
          }`}
        >
          <span>
            Removed <strong>{recentlyDeletedExam.title}</strong> from your exam countdowns.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndoDeleteExam}
              className="px-3 py-1 rounded-lg font-semibold border border-current hover:bg-black/5 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={() => setRecentlyDeletedExam(null)}
              aria-label="Dismiss undo notice"
              className="p-1 rounded hover:bg-black/5 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: EXAM COUNTDOWN LIST & FILTERS
      ========================================================================= */}
      {activeSubView === "exams" && (
        <div className="space-y-5">
          {/* Accessible Segmented Filter Bar + Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filter exams"
              className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-xl border w-fit ${
                isLight ? "bg-[#F0F2F7] border-[#E2E6EF]" : "bg-[#222938] border-[#283040]"
              }`}
            >
              {(
                [
                  { id: "all", label: `All (${filterCounts.all})` },
                  { id: "upcoming", label: `Upcoming (${filterCounts.upcoming})` },
                  { id: "pinned", label: `Pinned (${filterCounts.pinned})` },
                  { id: "completed", label: `Past (${filterCounts.completed})` }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExamFilter(tab.id)}
                  aria-pressed={examFilter === tab.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    examFilter === tab.id
                      ? isLight
                        ? "bg-[#FFFFFF] text-[#18202B] font-semibold shadow-2xs"
                        : "bg-[#191E28] text-[#F1F3F8] font-semibold shadow-2xs"
                      : isLight
                      ? "text-[#596474] hover:text-[#18202B]"
                      : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Urgency Legend (Color + Text paired) */}
            <div className={`flex flex-wrap items-center gap-3 text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>10+ days (Green)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>2–10 days (Amber)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>&lt;48h (Urgent)</span>
              </span>
            </div>
          </div>

          {/* Exam Cards Grid or Empty State */}
          {filteredExams.length === 0 ? (
            <div
              className={`p-8 sm:p-12 rounded-2xl border text-center space-y-4 ${
                isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                  isLight ? "bg-[#F0EEFF] text-[#5F55C8]" : "bg-[#6D5DF6]/20 text-[#A99BFF]"
                }`}
              >
                <CalendarClock size={24} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="text-base font-bold">
                  {examFilter === "all"
                    ? "No exams added yet"
                    : `No ${examFilter === "completed" ? "past" : examFilter} exams`}
                </h2>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  {examFilter === "all"
                    ? "Add your upcoming exam dates, paper codes, and target grades to keep a clear countdown for every subject."
                    : "Switch the filter above to view all exams or add a new exam date."}
                </p>
              </div>
              <button
                type="button"
                onClick={openNewExamModal}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer ${
                  isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                }`}
              >
                <Plus size={15} />
                <span>Add Your First Exam</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredExams.map((exam) => {
                const countdown = calculateCountdown(exam.examDate, exam.examTime);
                const isUrgent = !countdown.isPast && countdown.days < 2;
                const isMoreThan10Days =
                  !countdown.isPast &&
                  (countdown.days > 10 ||
                    (countdown.days === 10 && (countdown.hours > 0 || countdown.minutes > 0)));

                // Determine card theme & explicit textual status (never color alone)
                const chosenColor = exam.cardColor || "automatic";
                let cardBg = isLight ? "bg-[#FFFFFF]" : "bg-[#191E28]";
                let borderColor = isLight ? "border-[#E2E6EF]" : "border-[#283040]";
                let titleColor = isLight ? "text-[#18202B]" : "text-[#F1F3F8]";
                let cellBg = isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]";
                let statusText = "Approaching · 2–10 days";
                let statusColor = isLight ? "text-[#B45309]" : "text-[#FBBF24]";

                if (countdown.isPast) {
                  cardBg = isLight ? "bg-[#F6F7FA]" : "bg-[#141821]";
                  borderColor = isLight ? "border-[#E2E6EF]" : "border-[#222938]";
                  statusText = "Completed";
                  statusColor = isLight ? "text-[#596474]" : "text-[#8592A6]";
                } else if (
                  chosenColor === "mint" ||
                  exam.colorTheme === "green" ||
                  exam.colorTheme === "mint" ||
                  (chosenColor === "automatic" && isMoreThan10Days)
                ) {
                  // GREEN THEME for exams with more than 10 days remaining!
                  cardBg = isLight ? "bg-[#F0FDF4]" : "bg-[#0D2118]";
                  borderColor = isLight ? "border-[#86EFAC]" : "border-emerald-500/40";
                  titleColor = isLight ? "text-[#14532D]" : "text-[#6EE7B7]";
                  cellBg = isLight
                    ? "bg-[#DCFCE7]/80 border-[#86EFAC]"
                    : "bg-emerald-950/60 border-emerald-500/30";
                  statusText = "On track · 10+ days left";
                  statusColor = isLight ? "text-[#15803D]" : "text-[#34D399]";
                } else if (
                  chosenColor === "coral" ||
                  exam.colorTheme === "burgundy" ||
                  (chosenColor === "automatic" && isUrgent)
                ) {
                  cardBg = isLight ? "bg-[#FFF1F2]" : "bg-[#251017]";
                  borderColor = isLight ? "border-[#FECDD3]" : "border-rose-500/40";
                  titleColor = isLight ? "text-[#881337]" : "text-[#FDA4AF]";
                  cellBg = isLight
                    ? "bg-[#FFE4E6]/80 border-[#FECDD3]"
                    : "bg-rose-950/50 border-rose-500/30";
                  statusText = isUrgent ? "Urgent · Within 48 hours" : "Priority Exam";
                  statusColor = isLight ? "text-[#BE123C]" : "text-[#FB7185]";
                } else if (chosenColor === "lavender") {
                  cardBg = isLight ? "bg-[#F5F3FF]" : "bg-[#1B1730]";
                  borderColor = isLight ? "border-[#DDD6FE]" : "border-[#8B5CF6]/40";
                  titleColor = isLight ? "text-[#4C1D95]" : "text-[#DDD6FE]";
                  cellBg = isLight
                    ? "bg-[#EDE9FE]/80 border-[#DDD6FE]"
                    : "bg-[#262042] border-[#8B5CF6]/30";
                  statusText = isMoreThan10Days ? "On track · 10+ days left" : "Approaching";
                  statusColor = isLight ? "text-[#5F55C8]" : "text-[#A99BFF]";
                } else if (chosenColor === "sky") {
                  cardBg = isLight ? "bg-[#F0F9FF]" : "bg-[#102030]";
                  borderColor = isLight ? "border-[#BAE6FD]" : "border-sky-500/40";
                  titleColor = isLight ? "text-[#0C4A6E]" : "text-[#BAE6FD]";
                  cellBg = isLight
                    ? "bg-[#E0F2FE]/80 border-[#BAE6FD]"
                    : "bg-sky-950/50 border-sky-500/30";
                  statusText = isMoreThan10Days ? "On track · 10+ days left" : "Approaching";
                  statusColor = isLight ? "text-[#0369A1]" : "text-[#38BDF8]";
                } else {
                  // Approaching (2–10 days) default amber tone
                  cardBg = isLight ? "bg-[#FFFBEB]" : "bg-[#231B0E]";
                  borderColor = isLight ? "border-[#FDE68A]" : "border-amber-500/40";
                  titleColor = isLight ? "text-[#78350F]" : "text-[#FDE68A]";
                  cellBg = isLight
                    ? "bg-[#FEF3C7]/80 border-[#FDE68A]"
                    : "bg-amber-950/50 border-amber-500/30";
                  statusText = "Approaching · 2–10 days";
                  statusColor = isLight ? "text-[#B45309]" : "text-[#FBBF24]";
                }

                return (
                  <article
                    key={exam.id}
                    aria-label={`${exam.title} countdown`}
                    className={`p-5 rounded-2xl border transition-shadow flex flex-col justify-between gap-4 ${cardBg} ${borderColor}`}
                  >
                    <div className="space-y-2">
                      {/* Top Status & Action Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold flex items-center gap-1.5 ${statusColor}`}>
                          {countdown.isPast ? (
                            <CheckCircle2 size={13} />
                          ) : isUrgent ? (
                            <AlertCircle size={13} />
                          ) : (
                            <Clock size={13} />
                          )}
                          <span>{statusText}</span>
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(exam.id, e)}
                            aria-label={exam.isPinned ? `Unpin ${exam.title}` : `Pin ${exam.title}`}
                            aria-pressed={!!exam.isPinned}
                            title={exam.isPinned ? "Unpin exam" : "Pin to top"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              exam.isPinned
                                ? isLight
                                  ? "bg-[#5F55C8] text-white"
                                  : "bg-[#6D5DF6] text-white"
                                : isLight
                                ? "text-[#596474] hover:bg-black/5"
                                : "text-[#B7C0CF] hover:bg-white/10"
                            }`}
                          >
                            <Pin size={14} className={exam.isPinned ? "fill-current" : ""} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleEditExam(exam, e)}
                            aria-label={`Edit ${exam.title}`}
                            title="Edit exam"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              isLight
                                ? "text-[#596474] hover:bg-black/5"
                                : "text-[#B7C0CF] hover:bg-white/10"
                            }`}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExamPendingDelete(exam)}
                            aria-label={`Delete ${exam.title}`}
                            title="Delete exam"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              isLight
                                ? "text-[#596474] hover:text-[#BE123C] hover:bg-rose-500/10"
                                : "text-[#B7C0CF] hover:text-[#FB7185] hover:bg-rose-500/15"
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Title & Subject Metadata */}
                      <div>
                        <h3 className={`text-lg font-bold tracking-tight leading-snug ${titleColor}`}>
                          {exam.title}
                        </h3>
                        <div
                          className={`flex flex-wrap items-center gap-1.5 text-xs mt-1 ${
                            isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                          }`}
                        >
                          {exam.subject && exam.subject !== exam.title && (
                            <>
                              <span>{exam.subject}</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          {exam.paperCode && (
                            <>
                              <span className="font-mono font-semibold">{exam.paperCode}</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span>{formatExamDateTime(exam.examDate, exam.examTime)}</span>
                        </div>
                      </div>

                      {/* Target grade, room, and notes */}
                      {(exam.targetGrade || exam.roomNumber) && (
                        <div
                          className={`flex flex-wrap items-center gap-2 text-xs pt-0.5 ${
                            isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
                          }`}
                        >
                          {exam.targetGrade && (
                            <span className="font-medium">
                              Target grade: <strong className="font-mono">{exam.targetGrade}</strong>
                            </span>
                          )}
                          {exam.targetGrade && exam.roomNumber && <span aria-hidden="true">·</span>}
                          {exam.roomNumber && (
                            <span>
                              Room: <strong className="font-mono">{exam.roomNumber}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {(exam.description || exam.notes) && (
                        <p
                          className={`text-xs line-clamp-2 leading-relaxed ${
                            isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                          }`}
                        >
                          {exam.description || exam.notes}
                        </p>
                      )}
                    </div>

                    {/* Countdown Readout */}
                    <div>
                      {countdown.isPast ? (
                        <div
                          className={`p-3 rounded-xl border text-center text-xs font-semibold flex items-center justify-center gap-2 ${cellBg}`}
                        >
                          <CheckCircle2 size={15} className="text-emerald-500" />
                          <span>Exam completed</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
                          <div className={`p-2.5 rounded-xl border ${cellBg}`}>
                            <span className="text-xl sm:text-2xl font-bold block leading-none">
                              {countdown.days}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider block mt-1 ${
                                isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                              }`}
                            >
                              days
                            </span>
                          </div>
                          <div className={`p-2.5 rounded-xl border ${cellBg}`}>
                            <span className="text-xl sm:text-2xl font-bold block leading-none">
                              {countdown.hours}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider block mt-1 ${
                                isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                              }`}
                            >
                              hours
                            </span>
                          </div>
                          <div className={`p-2.5 rounded-xl border ${cellBg}`}>
                            <span className="text-xl sm:text-2xl font-bold block leading-none">
                              {countdown.minutes}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider block mt-1 ${
                                isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                              }`}
                            >
                              mins
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Exam Season Timeline Bar */}
          {exams.length > 0 && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 ${
                isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
              }`}
            >
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Exam Season Timeline</span>
                  <span className="font-mono">{seasonStats.percentage}% elapsed</span>
                </div>
                <div className="relative h-2.5 rounded-full bg-black/10 dark:bg-white/10 flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isLight ? "bg-[#5F55C8]" : "bg-[#6D5DF6]"
                    }`}
                    style={{ width: `${seasonStats.percentage}%` }}
                  />
                  {seasonStats.dots.map((dot) => {
                    let dotColor = "bg-amber-500";
                    if (dot.isPast) dotColor = "bg-slate-400";
                    else if (dot.isUrgent) dotColor = "bg-rose-500";
                    else if (dot.isMoreThan10Days) dotColor = "bg-emerald-500";

                    return (
                      <div
                        key={dot.id}
                        title={dot.title}
                        className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 ${dotColor} border-white dark:border-[#191E28]`}
                        style={{ left: `${dot.pos}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 shrink-0 ${
                  isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#283040]"
                }`}
              >
                <Calendar size={13} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
                <span>{seasonStats.rangeLabel}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: FRIENDS & STUDY CIRCLE
      ========================================================================= */}
      {activeSubView === "friends" && (
        <div className="space-y-6">
          {/* Clear Explanation Card */}
          <div
            className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
              isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isLight ? "bg-[#F0EEFF] text-[#5F55C8]" : "bg-[#6D5DF6]/20 text-[#A99BFF]"
              }`}
            >
              <Info size={18} />
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <h2 className="font-bold text-sm sm:text-base">How Study Circle &amp; Leaderboards Work</h2>
              <p className={`leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Set your unique <span className="font-mono">@username</span> or copy your invite link to share with classmates. Completed focus timer sessions automatically add to your weekly focus minutes on the leaderboard.{" "}
                {currentUser
                  ? "Your study circle is synced to your signed-in account."
                  : "You are currently in Guest mode — your study circle is saved on this device until you sign in."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Profile, Invite Link & Add Friend Form (5 cols) */}
            <div
              className={`lg:col-span-5 p-5 sm:p-6 rounded-2xl border space-y-5 ${
                isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
              }`}
            >
              {/* Your Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold block">Your Study Username</label>
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
                  }`}
                >
                  {isChangingUsername ? (
                    <div className="space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder="@yourhandle"
                          aria-label="New study username"
                          className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                            isLight
                              ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#18202B]"
                              : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleSaveUsername}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer ${
                            isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                          }`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUsernameInput(friendUsername);
                            setUsernameError(null);
                            setIsChangingUsername(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-inherit cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      {usernameError && (
                        <p className="text-xs text-rose-500 font-medium">{usernameError}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <span
                        className={`font-mono font-bold text-sm ${
                          isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"
                        }`}
                      >
                        {friendUsername || "@student"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsChangingUsername(true)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                          isLight
                            ? "bg-[#FFFFFF] border-[#CBD2E0] hover:bg-[#F0F2F7] text-[#18202B]"
                            : "bg-[#191E28] border-[#364054] hover:bg-[#2A3244] text-[#F1F3F8]"
                        }`}
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Personal Invite Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold block">Personal Invitation Link</label>
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
                  }`}
                >
                  <span
                    className={`font-mono text-xs truncate select-all ${
                      isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                    }`}
                  >
                    {inviteUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                      copiedInvite
                        ? isLight
                          ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#15803D]"
                          : "bg-[#10B981]/15 border-[#34D399]/30 text-[#34D399]"
                        : isLight
                        ? "bg-[#FFFFFF] border-[#CBD2E0] hover:bg-[#F0F2F7] text-[#18202B]"
                        : "bg-[#191E28] border-[#364054] hover:bg-[#2A3244] text-[#F1F3F8]"
                    }`}
                  >
                    {copiedInvite ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedInvite ? "Copied link" : "Copy link"}</span>
                  </button>
                </div>
              </div>

              {/* Add Friend by Username */}
              <form onSubmit={handleAddFriend} className="space-y-2 pt-2 border-t border-inherit">
                <label htmlFor="add-friend-input-box" className="text-xs font-semibold block">
                  Add Classmate by Username
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="add-friend-input-box"
                    type="text"
                    value={addFriendInput}
                    onChange={(e) => setAddFriendInput(e.target.value)}
                    placeholder="@classmate_username"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                        : "bg-[#222938] border-[#364054] text-[#F1F3F8] focus:bg-[#10131A] focus:border-[#A99BFF]"
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer ${
                      isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                    }`}
                  >
                    <span>Add</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {friendFeedback && (
                  <p
                    role="status"
                    className={`text-xs font-medium flex items-center gap-1.5 pt-1 ${
                      friendFeedback.type === "error"
                        ? isLight
                          ? "text-[#BE123C]"
                          : "text-[#FB7185]"
                        : isLight
                        ? "text-[#15803D]"
                        : "text-[#34D399]"
                    }`}
                  >
                    {friendFeedback.type === "error" ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                    <span>{friendFeedback.message}</span>
                  </p>
                )}
              </form>
            </div>

            {/* Weekly Focus Leaderboard (7 cols) */}
            <div
              className={`lg:col-span-7 p-5 sm:p-6 rounded-2xl border space-y-4 ${
                isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <div>
                    <h3 className="text-base font-bold">Weekly Focus Leaderboard</h3>
                    <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                      Ranked by total focus minutes logged this week
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-mono ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  {leaderboardEntries.length} {leaderboardEntries.length === 1 ? "member" : "members"}
                </span>
              </div>

              <div className="space-y-2.5">
                {leaderboardEntries.map((entry) => {
                  const friendObj = friends.find((f) => f.id === entry.id);
                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        entry.isCurrentUser
                          ? isLight
                            ? "bg-[#F0EEFF]/60 border-[#D8D3F8]"
                            : "bg-[#6D5DF6]/15 border-[#6D5DF6]/40"
                          : isLight
                          ? "bg-[#F6F7FA] border-[#E2E6EF]"
                          : "bg-[#222938] border-[#364054]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            entry.rank === 1
                              ? "bg-amber-400 text-amber-950"
                              : isLight
                              ? "bg-[#FFFFFF] border border-[#E2E6EF] text-[#596474]"
                              : "bg-[#191E28] border border-[#364054] text-[#B7C0CF]"
                          }`}
                        >
                          #{entry.rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm truncate">
                              {entry.username}
                            </span>
                            {entry.isCurrentUser && (
                              <span
                                className={`text-[11px] font-semibold ${
                                  isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"
                                }`}
                              >
                                (You)
                              </span>
                            )}
                          </div>
                          <div
                            className={`flex items-center gap-2 text-xs mt-0.5 font-mono tabular-nums ${
                              isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                            }`}
                          >
                            <span>{entry.focusMinutes} mins focused</span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.streak}d streak</span>
                          </div>
                        </div>
                      </div>

                      {!entry.isCurrentUser && friendObj && (
                        <button
                          type="button"
                          onClick={() => setFriendPendingRemove(friendObj)}
                          aria-label={`Remove ${entry.username} from study circle`}
                          title="Remove from study circle"
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isLight
                              ? "text-[#596474] hover:text-[#BE123C] hover:bg-[#FFF1F2]"
                              : "text-[#B7C0CF] hover:text-[#FB7185] hover:bg-[#FB7185]/15"
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT EXAM
      ========================================================================= */}
      {isAddExamOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 sm:p-7 space-y-5 my-auto shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="exam-modal-title" className="text-xl font-bold tracking-tight">
                  {editingExamId ? "Edit Exam Countdown" : "Add Exam Countdown"}
                </h2>
                <p className={`text-xs mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  Fields marked with * are required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExamOpen(false)}
                aria-label="Close modal"
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isLight
                    ? "border-[#E2E6EF] text-[#596474] hover:text-[#18202B] hover:bg-[#F6F7FA]"
                    : "border-[#364054] text-[#B7C0CF] hover:text-[#F1F3F8] hover:bg-[#222938]"
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {examFormError && (
              <div
                role="alert"
                className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  isLight
                    ? "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
                    : "bg-[#F43F5E]/15 border-[#FB7185]/30 text-[#FB7185]"
                }`}
              >
                <AlertCircle size={15} className="shrink-0" />
                <span>{examFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExamForm} className="space-y-4">
              {/* Exam Name */}
              <div>
                <label htmlFor="exam-name-input" className="text-xs font-semibold block mb-1.5">
                  Exam Name *
                </label>
                <input
                  id="exam-name-input"
                  type="text"
                  required
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="e.g., Mathematics Paper 2 (Extended)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                      : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                  }`}
                />
              </div>

              {/* Subject/Board & Paper Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exam-subject-input" className="text-xs font-semibold block mb-1.5">
                    Subject / Exam Board
                  </label>
                  <input
                    id="exam-subject-input"
                    type="text"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    placeholder="e.g., Cambridge IGCSE"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="exam-code-input" className="text-xs font-semibold block mb-1.5">
                    Paper / Syllabus Code
                  </label>
                  <input
                    id="exam-code-input"
                    type="text"
                    value={examForm.paperCode}
                    onChange={(e) => setExamForm({ ...examForm, paperCode: e.target.value })}
                    placeholder="e.g., 0580/22"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono outline-none ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                    }`}
                  />
                </div>
              </div>

              {/* Exam Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exam-date-input" className="text-xs font-semibold block mb-1.5">
                    Exam Date *
                  </label>
                  <input
                    id="exam-date-input"
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5">
                    Start Time (24h)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={2}
                      aria-label="Exam hour (00 to 23)"
                      value={examForm.examHours}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        if (val.length <= 2) setExamForm({ ...examForm, examHours: val });
                      }}
                      onBlur={() => {
                        const num = parseInt(examForm.examHours || "9", 10);
                        const clamped = Math.max(0, Math.min(23, isNaN(num) ? 9 : num));
                        setExamForm({ ...examForm, examHours: String(clamped).padStart(2, "0") });
                      }}
                      className={`w-16 text-center py-2.5 px-2 rounded-xl border font-mono text-sm font-bold outline-none ${
                        isLight
                          ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B]"
                          : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                      }`}
                    />
                    <span className="font-bold">:</span>
                    <input
                      type="text"
                      maxLength={2}
                      aria-label="Exam minute (00 to 59)"
                      value={examForm.examMinutes}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        if (val.length <= 2) setExamForm({ ...examForm, examMinutes: val });
                      }}
                      onBlur={() => {
                        const num = parseInt(examForm.examMinutes || "0", 10);
                        const clamped = Math.max(0, Math.min(59, isNaN(num) ? 0 : num));
                        setExamForm({ ...examForm, examMinutes: String(clamped).padStart(2, "0") });
                      }}
                      className={`w-16 text-center py-2.5 px-2 rounded-xl border font-mono text-sm font-bold outline-none ${
                        isLight
                          ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B]"
                          : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Target Grade & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exam-grade-input" className="text-xs font-semibold block mb-1.5">
                    Target Grade (Optional)
                  </label>
                  <input
                    id="exam-grade-input"
                    type="text"
                    value={examForm.targetGrade}
                    onChange={(e) => setExamForm({ ...examForm, targetGrade: e.target.value })}
                    placeholder="e.g., A* / 9 / 1550"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="exam-room-input" className="text-xs font-semibold block mb-1.5">
                    Room / Hall (Optional)
                  </label>
                  <input
                    id="exam-room-input"
                    type="text"
                    value={examForm.roomNumber}
                    onChange={(e) => setExamForm({ ...examForm, roomNumber: e.target.value })}
                    placeholder="e.g., Hall B"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="exam-notes-input" className="text-xs font-semibold block mb-1.5">
                  Revision Notes / Topics (Optional)
                </label>
                <textarea
                  id="exam-notes-input"
                  rows={2}
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  placeholder="Key topics, allowed calculator model, or reminders..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-y ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                      : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                  }`}
                />
              </div>

              {/* Card Color Theme */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold block">
                  Color Theme (Automatic uses Green for 10+ days, Amber for 2–10 days, Red for &lt;48h)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "automatic", label: "Automatic (By Urgency)", dotColor: "#10B981" },
                    { id: "mint", label: "Green", dotColor: "#10B981" },
                    { id: "lavender", label: "Violet", dotColor: "#8B5CF6" },
                    { id: "sky", label: "Sky", dotColor: "#0EA5E9" },
                    { id: "golden", label: "Amber", dotColor: "#F59E0B" },
                    { id: "coral", label: "Rose", dotColor: "#F43F5E" }
                  ].map((colorOpt) => {
                    const isSelected = (examForm.cardColor || "automatic") === colorOpt.id;
                    return (
                      <button
                        key={colorOpt.id}
                        type="button"
                        onClick={() => setExamForm({ ...examForm, cardColor: colorOpt.id as any })}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? isLight
                              ? "bg-[#5F55C8] text-white border-[#5F55C8]"
                              : "bg-[#6D5DF6] text-white border-[#6D5DF6]"
                            : isLight
                            ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] hover:bg-[#E8ECF4]"
                            : "bg-[#222938] border-[#364054] text-[#F1F3F8] hover:bg-[#2A3244]"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: colorOpt.dotColor }}
                        />
                        <span>{colorOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsAddExamOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isLight
                      ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#596474] hover:text-[#18202B]"
                      : "bg-[#222938] border-[#364054] text-[#B7C0CF] hover:text-[#F1F3F8]"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                    isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                  }`}
                >
                  {editingExamId ? "Save Changes" : "Add Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE EXAM
      ========================================================================= */}
      {examPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-exam-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <h3 id="delete-exam-modal-title" className="text-base font-bold">
              Remove &ldquo;{examPendingDelete.title}&rdquo;?
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              This exam countdown ({examPendingDelete.examDate}) will be removed from your schedule. You can undo this action immediately after deleting.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExamPendingDelete(null)}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  isLight
                    ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#596474] hover:text-[#18202B]"
                    : "bg-[#222938] border-[#364054] text-[#B7C0CF] hover:text-[#F1F3F8]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExam}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM REMOVE FRIEND
      ========================================================================= */}
      {friendPendingRemove && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-friend-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <h3 id="remove-friend-modal-title" className="text-base font-bold">
              Remove {friendPendingRemove.username} from Study Circle?
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              They will no longer appear on your weekly focus leaderboard.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFriendPendingRemove(null)}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  isLight
                    ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#596474] hover:text-[#18202B]"
                    : "bg-[#222938] border-[#364054] text-[#B7C0CF] hover:text-[#F1F3F8]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveFriend}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

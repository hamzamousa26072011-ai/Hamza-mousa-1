import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Check, 
  RotateCcw, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  Moon, 
  Smile, 
  X, 
  BarChart3,
  Target,
  LayoutList,
  Table2,
  Cloud,
  HardDrive
} from "lucide-react";
import { HabitItem, HabitDayLog } from "../types";
import HabitCompletionChart from "./HabitCompletionChart";

interface HabitTrackerTabProps {
  habits: HabitItem[];
  habitLogs: Record<string, HabitDayLog>;
  startDate: string;
  themeMode?: "light" | "dark";
  currentUser?: any;
  onUpdateHabits: (habits: HabitItem[]) => void;
  onUpdateLogs: (logs: Record<string, HabitDayLog>) => void;
  onUpdateStartDate: (startDate: string) => void;
  onSaveNotice?: (msg: string) => void;
}

export default function HabitTrackerTab({
  habits,
  habitLogs,
  startDate,
  themeMode = "dark",
  currentUser,
  onUpdateHabits,
  onUpdateLogs,
  onUpdateStartDate,
  onSaveNotice
}: HabitTrackerTabProps) {
  const isLight = themeMode === "light";

  // Duration range preset: 7, 14, 21, or 30 days
  const [rangeDays, setRangeDays] = useState<7 | 14 | 21 | 30>(14);
  // Presentation mode: "auto" uses compact on mobile & matrix on desktop, or user can explicitly pick
  const [viewMode, setViewMode] = useState<"matrix" | "daily">("matrix");
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [habitPendingDelete, setHabitPendingDelete] = useState<HabitItem | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    label: string;
    habits: HabitItem[];
    logs: Record<string, HabitDayLog>;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // New Habit form state
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("📖");
  const [newHabitColor, setNewHabitColor] = useState("#5F55C8");

  // Accessible Rating Modal state for Mood & Sleep
  const [ratingModal, setRatingModal] = useState<{
    type: "mood" | "sleep";
    dateStr: string;
    dayLabel: string;
  } | null>(null);

  const emojiOptions = ["📖", "✍️", "🧠", "🎯", "📐", "🧪", "💧", "🧘", "🏃", "⚡"];
  const colorOptions = [
    { name: "Violet", hex: "#5F55C8" },
    { name: "Emerald", hex: "#10B981" },
    { name: "Sky", hex: "#0EA5E9" },
    { name: "Amber", hex: "#F59E0B" },
    { name: "Rose", hex: "#F43F5E" },
    { name: "Slate", hex: "#64748B" }
  ];

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (ratingModal) setRatingModal(null);
        if (showAddModal) setShowAddModal(false);
        if (showClearConfirm) setShowClearConfirm(false);
        if (habitPendingDelete) setHabitPendingDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ratingModal, showAddModal, showClearConfirm, habitPendingDelete]);

  const formatYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayStr = useMemo(() => formatYMD(new Date()), []);

  // Compute the array of dates for the selected period
  const daysList = useMemo(() => {
    const list: {
      date: Date;
      dateStr: string;
      dayIndex: number;
      dayOfWeek: string;
      dayNum: number;
      monthShort: string;
      isToday: boolean;
      weekNum: number;
    }[] = [];

    const anchor = startDate ? new Date(startDate + "T00:00:00") : new Date();
    if (isNaN(anchor.getTime())) {
      anchor.setTime(Date.now());
    }

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      const dStr = formatYMD(d);
      const isToday = dStr === todayStr;
      const weekNum = Math.floor(i / 7) + 1;

      list.push({
        date: d,
        dateStr: dStr,
        dayIndex: i + 1,
        dayOfWeek: weekDays[d.getDay()],
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString("en-US", { month: "short" }),
        isToday,
        weekNum
      });
    }

    return list;
  }, [startDate, rangeDays, todayStr]);

  // Ensure selectedDayStr is within daysList when switching to daily view
  useEffect(() => {
    if (daysList.length > 0 && !daysList.some((d) => d.dateStr === selectedDayStr)) {
      const todayEntry = daysList.find((d) => d.isToday) || daysList[0];
      setSelectedDayStr(todayEntry.dateStr);
    }
  }, [daysList, selectedDayStr]);

  // Weeks breakdown for header grouping
  const weeksGrouped = useMemo(() => {
    const groups: { weekNum: number; count: number; startIdx: number }[] = [];
    let currentWeek = -1;
    let count = 0;
    let startIdx = 0;

    daysList.forEach((item, index) => {
      if (item.weekNum !== currentWeek) {
        if (currentWeek !== -1) {
          groups.push({ weekNum: currentWeek, count, startIdx });
        }
        currentWeek = item.weekNum;
        count = 1;
        startIdx = index;
      } else {
        count++;
      }
    });

    if (currentWeek !== -1) {
      groups.push({ weekNum: currentWeek, count, startIdx });
    }

    return groups;
  }, [daysList]);

  // Mathematically consistent period metrics
  const stats = useMemo(() => {
    const totalPossible = habits.length * daysList.length;
    let completedCount = 0;
    let todayCompleted = 0;
    const todayTotal = habits.length;
    let loggedWellnessDays = 0;

    const dailyCompletions: {
      dateStr: string;
      dayIndex: number;
      count: number;
      percentage: number;
      isToday: boolean;
      mood?: number;
      sleep?: number;
    }[] = [];

    daysList.forEach((d) => {
      const log = habitLogs[d.dateStr];
      let dayCompleted = 0;
      if (log && log.completedHabits) {
        habits.forEach((h) => {
          if (log.completedHabits[h.id]) {
            dayCompleted++;
          }
        });
      }

      if (log?.mood !== undefined || log?.sleep !== undefined) {
        loggedWellnessDays++;
      }

      completedCount += dayCompleted;
      if (d.isToday) {
        todayCompleted = dayCompleted;
      }

      dailyCompletions.push({
        dateStr: d.dateStr,
        dayIndex: d.dayIndex,
        count: dayCompleted,
        percentage: habits.length > 0 ? Math.round((dayCompleted / habits.length) * 100) : 0,
        isToday: d.isToday,
        mood: log?.mood,
        sleep: log?.sleep
      });
    });

    const completionRate = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;
    const remaining = Math.max(0, totalPossible - completedCount);

    return {
      totalPossible,
      completedCount,
      remaining,
      completionRate,
      todayCompleted,
      todayTotal,
      loggedWellnessDays,
      dailyCompletions
    };
  }, [habits, habitLogs, daysList]);

  const notifySaved = (msg?: string) => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      if (onSaveNotice && msg) onSaveNotice(msg);
    }, 250);
  };

  // Toggle habit checkbox for a specific date
  const handleToggleHabit = (habitId: string, dateStr: string) => {
    const currentLog = habitLogs[dateStr] || { completedHabits: {} };
    const currentlyChecked = !!currentLog.completedHabits?.[habitId];

    const updatedLog: HabitDayLog = {
      ...currentLog,
      completedHabits: {
        ...(currentLog.completedHabits || {}),
        [habitId]: !currentlyChecked
      }
    };

    onUpdateLogs({
      ...habitLogs,
      [dateStr]: updatedLog
    });
    notifySaved();
  };

  // Mark all habits completed for today
  const handleCheckToday = () => {
    if (habits.length === 0) return;
    setUndoSnapshot({
      label: "Marked all of today's habits complete",
      habits: [...habits],
      logs: JSON.parse(JSON.stringify(habitLogs))
    });

    const currentLog = habitLogs[todayStr] || { completedHabits: {} };
    const allChecked: Record<string, boolean> = { ...(currentLog.completedHabits || {}) };
    habits.forEach((h) => {
      allChecked[h.id] = true;
    });

    onUpdateLogs({
      ...habitLogs,
      [todayStr]: {
        ...currentLog,
        completedHabits: allChecked
      }
    });
    notifySaved("All habits for today marked complete.");
  };

  // Set anchor start date to today
  const handleStartFromToday = () => {
    onUpdateStartDate(todayStr);
    notifySaved("Tracking period anchored to today.");
  };

  // Clear all checks for the active duration (with Undo snapshot)
  const handleClearData = () => {
    setUndoSnapshot({
      label: `Cleared checkmarks for the ${rangeDays}-day period`,
      habits: [...habits],
      logs: JSON.parse(JSON.stringify(habitLogs))
    });

    const newLogs = { ...habitLogs };
    daysList.forEach((d) => {
      delete newLogs[d.dateStr];
    });
    onUpdateLogs(newLogs);
    setShowClearConfirm(false);
    notifySaved();
  };

  // Add a new custom habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: HabitItem = {
      id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newHabitName.trim(),
      emoji: newHabitEmoji || "📖",
      color: newHabitColor || "#5F55C8",
      createdAt: new Date().toISOString()
    };

    onUpdateHabits([...habits, newHabit]);
    setNewHabitName("");
    setShowAddModal(false);
    notifySaved(`Added habit "${newHabit.name}".`);
  };

  // Confirm delete habit (with Undo snapshot)
  const handleConfirmDeleteHabit = () => {
    if (!habitPendingDelete) return;
    setUndoSnapshot({
      label: `Deleted habit "${habitPendingDelete.name}"`,
      habits: [...habits],
      logs: JSON.parse(JSON.stringify(habitLogs))
    });
    onUpdateHabits(habits.filter((h) => h.id !== habitPendingDelete.id));
    setHabitPendingDelete(null);
    notifySaved();
  };

  const handleUndoLastAction = () => {
    if (!undoSnapshot) return;
    onUpdateHabits(undoSnapshot.habits);
    onUpdateLogs(undoSnapshot.logs);
    setUndoSnapshot(null);
    notifySaved("Restored previous habit state.");
  };

  // Update Mood or Sleep rating (1–10)
  const handleSetRating = (type: "mood" | "sleep", dateStr: string, val: number | undefined) => {
    const currentLog = habitLogs[dateStr] || { completedHabits: {} };
    const updatedLog: HabitDayLog = {
      ...currentLog,
      [type]: val
    };
    onUpdateLogs({
      ...habitLogs,
      [dateStr]: updatedLog
    });
    setRatingModal(null);
    notifySaved();
  };

  const handlePrevDay = () => {
    const cur = startDate ? new Date(startDate + "T00:00:00") : new Date();
    cur.setDate(cur.getDate() - 1);
    onUpdateStartDate(formatYMD(cur));
  };

  const handleNextDay = () => {
    const cur = startDate ? new Date(startDate + "T00:00:00") : new Date();
    cur.setDate(cur.getDate() + 1);
    onUpdateStartDate(formatYMD(cur));
  };

  const formattedAnchorDate = useMemo(() => {
    const d = startDate ? new Date(startDate + "T00:00:00") : new Date();
    if (isNaN(d.getTime())) return "Starts Today";
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return `Day 1: ${month} ${d.getDate()}`;
  }, [startDate]);



  const activeDayItem = useMemo(() => {
    return daysList.find((d) => d.dateStr === selectedDayStr) || daysList.find((d) => d.isToday) || daysList[0];
  }, [daysList, selectedDayStr]);

  return (
    <div className={`space-y-6 pb-12 ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
      {/* Header & Storage Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Habit Tracker</h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            Build consistent daily revision routines, track completion rates, and log daily mood and sleep quality.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
              isLight
                ? "bg-[#F6F7FA] border-[#E2E6EF] text-[#596474]"
                : "bg-[#222938] border-[#283040] text-[#B7C0CF]"
            }`}
          >
            {currentUser?.uid ? (
              <>
                <Cloud size={13} className="text-emerald-500" />
                <span>{saveStatus === "saving" ? "Saving..." : "Synced to account"}</span>
              </>
            ) : (
              <>
                <HardDrive size={13} />
                <span>{saveStatus === "saving" ? "Saving..." : "Saved on this device"}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 ${
              isLight ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[#C25E42]/25" : "bg-[#6D5DF6] hover:bg-[#5B4BE8] shadow-purple-500/25"
            }`}
          >
            <Plus size={15} />
            <span>Add Habit</span>
          </button>
        </div>
      </div>

      {/* Undo Banner */}
      {undoSnapshot && (
        <div
          role="region"
          aria-label="Undo habit action"
          className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight
              ? "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]"
              : "bg-[#F59E0B]/15 border-[#FBBF24]/30 text-[#FBBF24]"
          }`}
        >
          <span>{undoSnapshot.label}.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndoLastAction}
              className="px-3 py-1 rounded-lg font-semibold border border-current hover:bg-black/5 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={() => setUndoSnapshot(null)}
              aria-label="Dismiss undo notice"
              className="p-1 rounded hover:bg-black/5 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 1. HABIT COMPLETION SUMMARY CHART (RECHARTS - LAST 7 DAYS TREND) */}
      <HabitCompletionChart
        habits={habits}
        habitLogs={habitLogs}
        themeMode={themeMode}
      />

      {/* PERIOD SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`rounded-2xl border p-4 flex flex-col justify-between ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          <span className={`text-xs font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            Period Goal
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums">{stats.totalPossible}</span>
            <span className={`text-[11px] ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              {habits.length} × {rangeDays}d
            </span>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 flex flex-col justify-between ${
            isLight ? "bg-[#FFF7ED] border-[#FED7AA]" : "bg-[#6D5DF6]/15 border-[#6D5DF6]/35"
          }`}
        >
          <span className={`text-xs font-semibold ${isLight ? "text-[#C25E42]" : "text-[#A99BFF]"}`}>
            Completed
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono tabular-nums ${isLight ? "text-[#C25E42]" : "text-[#A99BFF]"}`}>
              {stats.completedCount}
            </span>
            <span className="text-xs font-mono font-semibold">{stats.completionRate}%</span>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 flex flex-col justify-between ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          <span className={`text-xs font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            Remaining
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums">{stats.remaining}</span>
            <span className={`text-[11px] ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>checks left</span>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 flex flex-col justify-between ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          <span className={`text-xs font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            Today&apos;s Progress
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums">
              {stats.todayCompleted}/{stats.todayTotal}
            </span>
            <span className={`text-[11px] ${isLight ? "text-[#15803D]" : "text-[#34D399]"}`}>
              today
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR: Period Controls, Date Navigation, View Switcher, Quick Actions */}
      <div
        className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${
          isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
        }`}
      >
        {/* Left Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day 1 Anchor Stepper */}
          <div
            className={`flex items-center border rounded-xl overflow-hidden ${
              isLight ? "border-[#E2E6EF] bg-[#F6F7FA]" : "border-[#364054] bg-[#222938]"
            }`}
          >
            <button
              type="button"
              onClick={handlePrevDay}
              aria-label="Move start date back one day"
              title="Previous start day"
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
              <Calendar size={13} className={isLight ? "text-[#C25E42]" : "text-[#A99BFF]"} />
              <span>{formattedAnchorDate}</span>
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              aria-label="Move start date forward one day"
              title="Next start day"
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Period Presets (7D, 14D, 21D, 30D) */}
          <div
            role="group"
            aria-label="Tracking period length"
            className={`flex items-center border rounded-xl p-1 ${
              isLight ? "bg-[#F0F2F7] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
            }`}
          >
            {([7, 14, 21, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRangeDays(r)}
                aria-pressed={rangeDays === r}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  rangeDays === r
                    ? isLight
                      ? "bg-[#FFFFFF] text-[#18202B] shadow-2xs"
                      : "bg-[#191E28] text-[#F1F3F8] shadow-2xs"
                    : isLight
                    ? "text-[#596474] hover:text-[#18202B]"
                    : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                }`}
              >
                {r} days
              </button>
            ))}
          </div>

          {/* Layout View Switcher: Full Matrix vs Daily Focus View */}
          <div
            role="group"
            aria-label="Habit layout view"
            className={`flex items-center border rounded-xl p-1 ${
              isLight ? "bg-[#F0F2F7] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              aria-pressed={viewMode === "matrix"}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === "matrix"
                  ? isLight
                    ? "bg-[#FFFFFF] text-[#18202B] shadow-2xs"
                    : "bg-[#191E28] text-[#F1F3F8] shadow-2xs"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#B7C0CF] hover:text-[#F1F3F8]"
              }`}
            >
              <Table2 size={13} />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              aria-pressed={viewMode === "daily"}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === "daily"
                  ? isLight
                    ? "bg-[#FFFFFF] text-[#18202B] shadow-2xs"
                    : "bg-[#191E28] text-[#F1F3F8] shadow-2xs"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#B7C0CF] hover:text-[#F1F3F8]"
              }`}
            >
              <LayoutList size={13} />
              <span>Daily Checklist</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Check Today, Start from Today, Clear */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCheckToday}
            disabled={habits.length === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isLight
                ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#222938] hover:bg-[#2A3244] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <Check size={13} className="text-emerald-500" />
            <span>Check Today</span>
          </button>

          <button
            type="button"
            onClick={handleStartFromToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              startDate === todayStr
                ? isLight
                  ? "bg-[#FFF7ED] border-[#FED7AA] text-[#C25E42]"
                  : "bg-[#6D5DF6]/20 border-[#6D5DF6]/40 text-[#A99BFF]"
                : isLight
                ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#222938] hover:bg-[#2A3244] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <RotateCcw size={13} />
            <span>Start from Today</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isLight
                ? "border-[#E2E6EF] text-[#596474] hover:text-[#BE123C] hover:border-[#FECDD3] hover:bg-[#FFF1F2]"
                : "border-[#364054] text-[#B7C0CF] hover:text-[#FB7185] hover:border-rose-500/40 hover:bg-rose-500/10"
            }`}
          >
            Clear Period
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: DAILY CHECKLIST VIEW (Mobile-friendly & focused day view)
      ========================================================================= */}
      {viewMode === "daily" && activeDayItem && (
        <div
          className={`rounded-2xl border p-5 space-y-5 ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          {/* Day Selector Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Day {activeDayItem.dayIndex}: {activeDayItem.dayOfWeek}, {activeDayItem.monthShort} {activeDayItem.dayNum}
                {activeDayItem.isToday ? " (Today)" : ""}
              </h3>
              <span className={`text-xs font-mono ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Select any day below
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {daysList.map((d) => {
                const isSelected = d.dateStr === activeDayItem.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDayStr(d.dateStr)}
                    aria-pressed={isSelected}
                    className={`min-w-[52px] py-2 px-2 rounded-xl border text-center transition-colors shrink-0 cursor-pointer ${
                      isSelected
                        ? isLight
                          ? "bg-[#C25E42] border-[#C25E42] text-white"
                          : "bg-[#6D5DF6] border-[#6D5DF6] text-white"
                        : d.isToday
                        ? isLight
                          ? "bg-[#FFF7ED] border-[#FED7AA] text-[#C25E42]"
                          : "bg-[#6D5DF6]/15 border-[#6D5DF6]/40 text-[#A99BFF]"
                        : isLight
                        ? "bg-[#F6F7FA] border-[#E2E6EF] text-[#18202B]"
                        : "bg-[#222938] border-[#364054] text-[#F1F3F8]"
                    }`}
                  >
                    <span className="block text-[10px] opacity-80">{d.dayOfWeek}</span>
                    <span className="block text-xs font-bold font-mono">{d.dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habits Checklist for Selected Day */}
          <div className="space-y-2">
            {habits.map((habit) => {
              const isChecked = !!habitLogs[activeDayItem.dateStr]?.completedHabits?.[habit.id];
              return (
                <div
                  key={habit.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleHabit(habit.id, activeDayItem.dateStr)}
                    aria-pressed={isChecked}
                    aria-label={`${habit.name} on ${activeDayItem.dateStr}: ${isChecked ? "Completed" : "Not completed"}`}
                    className="flex items-center gap-3 flex-1 text-left cursor-pointer min-h-[40px]"
                  >
                    <span
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? "text-white border-transparent"
                          : isLight
                          ? "bg-[#FFFFFF] border-[#CBD2E0]"
                          : "bg-[#10131A] border-[#364054]"
                      }`}
                      style={{ backgroundColor: isChecked ? habit.color || "#5F55C8" : undefined }}
                    >
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="text-base shrink-0">{habit.emoji}</span>
                    <span className={`text-sm font-semibold ${isChecked ? "line-through opacity-75" : ""}`}>
                      {habit.name}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHabitPendingDelete(habit)}
                    aria-label={`Delete habit ${habit.name}`}
                    className={`p-2 rounded-lg cursor-pointer ${
                      isLight
                        ? "text-[#596474] hover:text-[#BE123C] hover:bg-[#FFF1F2]"
                        : "text-[#B7C0CF] hover:text-[#FB7185] hover:bg-rose-500/15"
                    }`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Mood & Sleep Controls for Selected Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-inherit">
            <button
              type="button"
              onClick={() =>
                setRatingModal({
                  type: "mood",
                  dateStr: activeDayItem.dateStr,
                  dayLabel: `${activeDayItem.dayOfWeek}, ${activeDayItem.monthShort} ${activeDayItem.dayNum}`
                })
              }
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Smile size={16} className="text-amber-500" />
                <span>Mood Rating (1–10)</span>
              </span>
              <span className="font-mono text-xs font-bold">
                {habitLogs[activeDayItem.dateStr]?.mood !== undefined
                  ? `${habitLogs[activeDayItem.dateStr]?.mood} / 10`
                  : "Set rating"}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setRatingModal({
                  type: "sleep",
                  dateStr: activeDayItem.dateStr,
                  dayLabel: `${activeDayItem.dayOfWeek}, ${activeDayItem.monthShort} ${activeDayItem.dayNum}`
                })
              }
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Moon size={16} className={isLight ? "text-[#C25E42]" : "text-[#A99BFF]"} />
                <span>Sleep Quality (1–10)</span>
              </span>
              <span className="font-mono text-xs font-bold">
                {habitLogs[activeDayItem.dateStr]?.sleep !== undefined
                  ? `${habitLogs[activeDayItem.dateStr]?.sleep} / 10`
                  : "Set rating"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: FULL HABIT MATRIX TABLE (Confined Horizontal Scroll + Sticky Column)
      ========================================================================= */}
      {viewMode === "matrix" && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
          }`}
        >
          {/* Mobile Hint / Scroll Affordance Bar */}
          <div
            className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-2 ${
              isLight
                ? "bg-[#F6F7FA] border-[#E2E6EF] text-[#596474]"
                : "bg-[#222938] border-[#283040] text-[#B7C0CF]"
            }`}
          >
            <span>Tip: Click any cell to toggle completion for that date, or click Mood/Sleep to rate 1–10.</span>
            <span className="font-mono text-[11px] shrink-0">Scroll table horizontally →</span>
          </div>

          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse text-left min-w-[680px]">
              <thead>
                {/* Week Header */}
                <tr
                  className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isLight
                      ? "bg-[#F0F2F7] text-[#18202B] border-[#E2E6EF]"
                      : "bg-[#10131A] text-[#F1F3F8] border-[#283040]"
                  }`}
                >
                  <th
                    scope="col"
                    className={`sticky left-0 z-20 px-4 py-2.5 min-w-[200px] md:min-w-[230px] border-r ${
                      isLight ? "bg-[#F0F2F7] border-[#E2E6EF]" : "bg-[#10131A] border-[#283040]"
                    }`}
                  >
                    Habit
                  </th>
                  {weeksGrouped.map((w) => (
                    <th
                      key={w.weekNum}
                      colSpan={w.count}
                      scope="colgroup"
                      className={`px-2 py-2.5 text-center border-r ${
                        isLight ? "border-[#E2E6EF]" : "border-[#283040]"
                      }`}
                    >
                      Week {w.weekNum}
                    </th>
                  ))}
                </tr>

                {/* Day & Date Header */}
                <tr
                  className={`border-b text-xs ${
                    isLight
                      ? "bg-[#FFFFFF] text-[#18202B] border-[#E2E6EF]"
                      : "bg-[#191E28] text-[#F1F3F8] border-[#283040]"
                  }`}
                >
                  <th
                    scope="col"
                    className={`sticky left-0 z-20 px-4 py-2 border-r text-[11px] font-semibold ${
                      isLight
                        ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#596474]"
                        : "bg-[#191E28] border-[#283040] text-[#B7C0CF]"
                    }`}
                  >
                    Day &amp; Date
                  </th>
                  {daysList.map((d) => (
                    <th
                      key={d.dateStr}
                      scope="col"
                      className={`px-1 py-2 text-center border-r min-w-[42px] ${
                        d.isToday
                          ? isLight
                            ? "bg-[#F0EEFF] border-[#D8D3F8]"
                            : "bg-[#6D5DF6]/20 border-[#6D5DF6]/40"
                          : isLight
                          ? "border-[#E2E6EF]"
                          : "border-[#283040]"
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className={`text-[10px] font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                          {d.dayOfWeek}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono mt-0.5 ${
                            d.isToday ? (isLight ? "text-[#C25E42]" : "text-[#A99BFF]") : ""
                          }`}
                        >
                          {d.dayNum}
                        </span>
                        {d.isToday && (
                          <span
                            className={`mt-0.5 text-[9px] font-bold ${
                              isLight ? "text-[#C25E42]" : "text-[#A99BFF]"
                            }`}
                          >
                            Today
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {habits.length === 0 ? (
                  <tr>
                    <td colSpan={daysList.length + 1} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <p className="text-sm font-semibold">No habits configured yet</p>
                        <button
                          type="button"
                          onClick={() => setShowAddModal(true)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md transition-all ${
                            isLight ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[#C25E42]/25" : "bg-[#6D5DF6] hover:bg-[#5B4BE8] shadow-purple-500/25"
                          }`}
                        >
                          Add Your First Habit
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  habits.map((habit) => (
                    <tr
                      key={habit.id}
                      className={`border-b transition-colors group ${
                        isLight
                          ? "hover:bg-[#F6F7FA]/70 border-[#E2E6EF]"
                          : "hover:bg-[#222938]/50 border-[#283040]"
                      }`}
                    >
                      {/* Sticky Habit Name Column */}
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 px-4 py-2.5 border-r font-medium ${
                          isLight ? "bg-[#FFFFFF] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0" aria-hidden="true">
                              {habit.emoji}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold truncate">{habit.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHabitPendingDelete(habit)}
                            aria-label={`Delete habit ${habit.name}`}
                            title="Delete habit"
                            className={`p-1.5 rounded-lg opacity-70 group-hover:opacity-100 transition-colors cursor-pointer shrink-0 ${
                              isLight
                                ? "text-[#596474] hover:text-[#BE123C] hover:bg-[#FFF1F2]"
                                : "text-[#B7C0CF] hover:text-[#FB7185] hover:bg-rose-500/15"
                            }`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </th>

                      {/* Daily Completion Cells */}
                      {daysList.map((d) => {
                        const isChecked = !!habitLogs[d.dateStr]?.completedHabits?.[habit.id];
                        return (
                          <td
                            key={d.dateStr}
                            className={`p-1 text-center border-r ${
                              d.isToday
                                ? isLight
                                  ? "bg-[#F0EEFF]/40 border-[#D8D3F8]"
                                  : "bg-[#6D5DF6]/10 border-[#6D5DF6]/30"
                                : isLight
                                ? "border-[#E2E6EF]"
                                : "border-[#283040]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleHabit(habit.id, d.dateStr)}
                              aria-label={`${habit.name} on ${d.monthShort} ${d.dayNum} (${d.dateStr}): ${
                                isChecked ? "Completed" : "Not completed"
                              }`}
                              aria-pressed={isChecked}
                              className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all cursor-pointer border ${
                                isChecked
                                  ? "text-white border-transparent shadow-2xs"
                                  : isLight
                                  ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] border-[#CBD2E0]"
                                  : "bg-[#222938] hover:bg-[#2A3244] border-[#364054]"
                              }`}
                              style={{
                                backgroundColor: isChecked ? habit.color || "#5F55C8" : undefined
                              }}
                            >
                              {isChecked && <Check size={15} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}

                {/* MOOD RATING ROW (1-10) */}
                <tr
                  className={`border-b text-xs ${
                    isLight ? "bg-[#F6F7FA]/60 border-[#E2E6EF]" : "bg-[#10131A]/40 border-[#283040]"
                  }`}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 px-4 py-2.5 border-r font-semibold ${
                      isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Smile size={14} className="text-amber-500" />
                        <span>Mood (1–10)</span>
                      </span>
                      <span className={`text-[10px] font-normal ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                        Click cell
                      </span>
                    </div>
                  </th>
                  {daysList.map((d) => {
                    const moodVal = habitLogs[d.dateStr]?.mood;
                    return (
                      <td
                        key={d.dateStr}
                        className={`p-1 text-center border-r ${
                          isLight ? "border-[#E2E6EF]" : "border-[#283040]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setRatingModal({
                              type: "mood",
                              dateStr: d.dateStr,
                              dayLabel: `${d.dayOfWeek}, ${d.monthShort} ${d.dayNum}`
                            })
                          }
                          aria-label={`Mood rating for ${d.monthShort} ${d.dayNum}: ${
                            moodVal !== undefined ? `${moodVal} out of 10` : "Not rated"
                          }`}
                          className={`w-8 h-7 rounded-md mx-auto font-mono text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                            moodVal !== undefined
                              ? isLight
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : isLight
                              ? "text-[#768295] hover:bg-[#E8ECF4]"
                              : "text-[#8592A6] hover:bg-[#222938]"
                          }`}
                        >
                          {moodVal !== undefined ? moodVal : "–"}
                        </button>
                      </td>
                    );
                  })}
                </tr>

                {/* SLEEP QUALITY ROW (1-10) */}
                <tr
                  className={`text-xs ${
                    isLight ? "bg-[#F6F7FA]/60 border-[#E2E6EF]" : "bg-[#10131A]/40 border-[#283040]"
                  }`}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 px-4 py-2.5 border-r font-semibold ${
                      isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#191E28] border-[#283040]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Moon size={14} className={isLight ? "text-[#C25E42]" : "text-[#A99BFF]"} />
                        <span>Sleep (1–10)</span>
                      </span>
                      <span className={`text-[10px] font-normal ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                        Click cell
                      </span>
                    </div>
                  </th>
                  {daysList.map((d) => {
                    const sleepVal = habitLogs[d.dateStr]?.sleep;
                    return (
                      <td
                        key={d.dateStr}
                        className={`p-1 text-center border-r ${
                          isLight ? "border-[#E2E6EF]" : "border-[#283040]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setRatingModal({
                              type: "sleep",
                              dateStr: d.dateStr,
                              dayLabel: `${d.dayOfWeek}, ${d.monthShort} ${d.dayNum}`
                            })
                          }
                          aria-label={`Sleep rating for ${d.monthShort} ${d.dayNum}: ${
                            sleepVal !== undefined ? `${sleepVal} out of 10` : "Not rated"
                          }`}
                          className={`w-8 h-7 rounded-md mx-auto font-mono text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                            sleepVal !== undefined
                              ? isLight
                                ? "bg-[#FFF7ED] text-[#C25E42] border border-[#FED7AA]"
                                : "bg-[#6D5DF6]/25 text-[#A99BFF] border border-[#6D5DF6]/40"
                              : isLight
                              ? "text-[#768295] hover:bg-[#E8ECF4]"
                              : "text-[#8592A6] hover:bg-[#222938]"
                          }`}
                        >
                          {sleepVal !== undefined ? sleepVal : "–"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ACCESSIBLE MOOD & SLEEP RATING SELECTOR (1–10 Scale Explained)
      ========================================================================= */}
      {ratingModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rating-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="rating-modal-title" className="text-base font-bold">
                  {ratingModal.type === "mood" ? "Rate Daily Mood" : "Rate Sleep Quality"} — {ratingModal.dayLabel}
                </h3>
                <p className={`text-xs mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  {ratingModal.type === "mood"
                    ? "Scale: 1 = Very low energy/stressed · 10 = Focused & positive"
                    : "Scale: 1 = Very poor rest · 10 = Fully rested (8+ hours)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRatingModal(null)}
                aria-label="Close rating dialog"
                className="p-1.5 rounded-lg border border-inherit cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                const currentVal = habitLogs[ratingModal.dateStr]?.[ratingModal.type];
                const isSelected = currentVal === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSetRating(ratingModal.type, ratingModal.dateStr, val)}
                    aria-pressed={isSelected}
                    className={`py-2.5 rounded-xl font-mono text-sm font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? isLight
                          ? "bg-[#5F55C8] border-[#5F55C8] text-white"
                          : "bg-[#6D5DF6] border-[#6D5DF6] text-white"
                        : isLight
                        ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] border-[#CBD2E0] text-[#18202B]"
                        : "bg-[#222938] hover:bg-[#2A3244] border-[#364054] text-[#F1F3F8]"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-inherit">
              <button
                type="button"
                onClick={() => handleSetRating(ratingModal.type, ratingModal.dateStr, undefined)}
                className={`text-xs font-medium cursor-pointer ${
                  isLight ? "text-[#BE123C] hover:underline" : "text-[#FB7185] hover:underline"
                }`}
              >
                Clear rating
              </button>
              <button
                type="button"
                onClick={() => setRatingModal(null)}
                className={`px-4 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                  isLight ? "border-[#CBD2E0] text-[#596474]" : "border-[#364054] text-[#B7C0CF]"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW HABIT
      ========================================================================= */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-habit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 id="add-habit-modal-title" className="text-lg font-bold">
                Add Daily Habit
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg border border-inherit cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label htmlFor="new-habit-name" className="text-xs font-semibold block mb-1.5">
                  Habit Name *
                </label>
                <input
                  id="new-habit-name"
                  type="text"
                  required
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Solve 1 Past Paper"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#CBD2E0] text-[#18202B] focus:bg-[#FFFFFF] focus:border-[#5F55C8]"
                      : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {emojiOptions.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewHabitEmoji(em)}
                      aria-pressed={newHabitEmoji === em}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base cursor-pointer ${
                        newHabitEmoji === em
                          ? isLight
                            ? "bg-[#F0EEFF] border-[#5F55C8]"
                            : "bg-[#6D5DF6]/25 border-[#A99BFF]"
                          : isLight
                          ? "bg-[#F6F7FA] border-[#E2E6EF]"
                          : "bg-[#222938] border-[#364054]"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Checkmark Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewHabitColor(c.hex)}
                      aria-pressed={newHabitColor === c.hex}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                        newHabitColor === c.hex
                          ? isLight
                            ? "bg-[#18202B] text-white border-[#18202B]"
                            : "bg-[#F1F3F8] text-[#10131A] border-[#F1F3F8]"
                          : isLight
                          ? "bg-[#F6F7FA] border-[#CBD2E0]"
                          : "bg-[#222938] border-[#364054]"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-inherit text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                    isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                  }`}
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE HABIT
      ========================================================================= */}
      {habitPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-habit-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <h3 id="delete-habit-title" className="text-base font-bold">
              Delete &ldquo;{habitPendingDelete.name}&rdquo;?
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              This habit row will be removed from your tracker. You can click Undo right after deleting if you change your mind.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHabitPendingDelete(null)}
                className="px-4 py-2 rounded-xl border border-inherit text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteHabit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM CLEAR PERIOD CHECKS
      ========================================================================= */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-period-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-xl ${
              isLight
                ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
                : "bg-[#191E28] border-[#364054] text-[#F1F3F8]"
            }`}
          >
            <h3 id="clear-period-title" className="text-base font-bold">
              Clear checkmarks for this {rangeDays}-day period?
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              Your habit list will stay intact, and all checkmarks in the visible {rangeDays}-day window will be reset. You can undo this immediately after clearing.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-inherit text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearData}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Clear Checkmarks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Plus, 
  Check, 
  RotateCcw, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Cloud, 
  CloudCheck,
  TrendingUp, 
  Moon, 
  Smile, 
  X, 
  AlertCircle,
  HelpCircle,
  BarChart3,
  CalendarDays,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HabitItem, HabitDayLog } from "../types";

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
  themeMode = "light",
  currentUser,
  onUpdateHabits,
  onUpdateLogs,
  onUpdateStartDate,
  onSaveNotice
}: HabitTrackerTabProps) {
  const isLight = themeMode === "light";

  // Duration range preset: 7, 14, 21, or 30 days
  const [rangeDays, setRangeDays] = useState<7 | 14 | 21 | 30>(30);
  const [activeDateIndex, setActiveDateIndex] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // New Habit form state
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("⚡");
  const [newHabitColor, setNewHabitColor] = useState("#C96F55");

  // Rating popover state for Mood & Sleep
  const [ratingPopover, setRatingPopover] = useState<{
    type: "mood" | "sleep";
    dateStr: string;
    dayNum: number;
    x: number;
    y: number;
  } | null>(null);

  // Quick emoji options
  const emojiOptions = ["💪", "📖", "🗓️", "🎯", "⚡", "🧠", "💧", "🧘", "🏃", "☕", "📝", "🚀"];
  const colorOptions = [
    { name: "Terracotta", hex: "#C96F55" },
    { name: "Sage", hex: "#66856D" },
    { name: "Ocean", hex: "#587B8C" },
    { name: "Amber", hex: "#D97706" },
    { name: "Indigo", hex: "#4F46E5" },
    { name: "Crimson", hex: "#EF4444" },
  ];

  // Helper to format date strings YYYY-MM-DD
  const formatYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Compute today's date string
  const todayStr = useMemo(() => formatYMD(new Date()), []);

  // Compute the array of dates for the selected view
  const daysList = useMemo(() => {
    const list: {
      date: Date;
      dateStr: string;
      dayIndex: number;
      dayOfWeek: string;
      dayNum: number;
      isToday: boolean;
      weekNum: number;
    }[] = [];

    // Parse anchor start date or fallback to today
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
        isToday,
        weekNum
      });
    }

    return list;
  }, [startDate, rangeDays, todayStr]);

  // Weeks breakdown for the header grouping
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

  // Calculate high-impact metrics
  const stats = useMemo(() => {
    const totalPossible = habits.length * daysList.length;
    let completedCount = 0;
    let todayCompleted = 0;
    let todayTotal = habits.length;

    const dailyCompletions: { dateStr: string; dayIndex: number; count: number; percentage: number; mood?: number; sleep?: number }[] = [];

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

      completedCount += dayCompleted;

      if (d.isToday) {
        todayCompleted = dayCompleted;
      }

      dailyCompletions.push({
        dateStr: d.dateStr,
        dayIndex: d.dayIndex,
        count: dayCompleted,
        percentage: habits.length > 0 ? Math.round((dayCompleted / habits.length) * 100) : 0,
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
      dailyCompletions
    };
  }, [habits, habitLogs, daysList]);

  // Helper to trigger save confirmation notice
  const notifySaved = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      if (onSaveNotice) onSaveNotice("Habit data synchronized securely.");
    }, 300);
  };

  // Toggle habit checkbox for a given day
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

    const newLogs = {
      ...habitLogs,
      [dateStr]: updatedLog
    };

    onUpdateLogs(newLogs);
    notifySaved();
  };

  // Batch mark all habits done for today
  const handleCheckToday = () => {
    const currentLog = habitLogs[todayStr] || { completedHabits: {} };
    const allChecked: Record<string, boolean> = { ...(currentLog.completedHabits || {}) };

    habits.forEach((h) => {
      allChecked[h.id] = true;
    });

    const updatedLog: HabitDayLog = {
      ...currentLog,
      completedHabits: allChecked
    };

    onUpdateLogs({
      ...habitLogs,
      [todayStr]: updatedLog
    });

    notifySaved();
  };

  // Set anchor start date to today
  const handleStartFromToday = () => {
    onUpdateStartDate(todayStr);
    notifySaved();
  };

  // Clear all checks for the active duration
  const handleClearData = () => {
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
      emoji: newHabitEmoji || "⚡",
      color: newHabitColor || "#C96F55",
      createdAt: new Date().toISOString()
    };

    onUpdateHabits([...habits, newHabit]);
    setNewHabitName("");
    setShowAddModal(false);
    notifySaved();
  };

  // Delete a habit
  const handleDeleteHabit = (habitId: string) => {
    onUpdateHabits(habits.filter((h) => h.id !== habitId));
    notifySaved();
  };

  // Update Mood or Sleep rating
  const handleSetRating = (type: "mood" | "sleep", dateStr: string, val: number) => {
    const currentLog = habitLogs[dateStr] || { completedHabits: {} };
    const updatedLog: HabitDayLog = {
      ...currentLog,
      [type]: val
    };

    onUpdateLogs({
      ...habitLogs,
      [dateStr]: updatedLog
    });

    setRatingPopover(null);
    notifySaved();
  };

  // Date jump helpers
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

  // Format anchor date for display e.g. "Day 1: Sep 12"
  const formattedAnchorDate = useMemo(() => {
    const d = startDate ? new Date(startDate + "T00:00:00") : new Date();
    if (isNaN(d.getTime())) return "Day 1: Today";
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return `Day 1: ${month} ${d.getDate()}`;
  }, [startDate]);

  // Today Day Index in the grid
  const todayDayIndex = useMemo(() => {
    const found = daysList.find((d) => d.isToday);
    return found ? found.dayIndex : null;
  }, [daysList]);

  // Calculate SVG line/area path for DAILY PROGRESS chart
  const progressPath = useMemo(() => {
    const points = stats.dailyCompletions;
    if (points.length === 0) return { area: "", line: "" };

    const width = 600;
    const height = 90;
    const paddingX = 15;
    const paddingY = 10;
    const step = (width - paddingX * 2) / (points.length - 1 || 1);

    const coords = points.map((p, idx) => {
      const x = paddingX + idx * step;
      const y = height - paddingY - (p.percentage / 100) * (height - paddingY * 2);
      return { x, y, ...p };
    });

    const linePath = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");

    const areaPath = `${linePath} L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`;

    return { area: areaPath, line: linePath, coords, width, height };
  }, [stats.dailyCompletions]);

  // Calculate dual trend line for Mood & Sleep
  const trendLineData = useMemo(() => {
    const points = stats.dailyCompletions;
    const width = 600;
    const height = 40;
    const step = width / (points.length - 1 || 1);

    const moodCoords = points.map((p, idx) => {
      const val = p.mood !== undefined ? p.mood : 0;
      const x = idx * step;
      const y = height - (val / 10) * (height - 8) - 4;
      return { x, y, val };
    });

    const sleepCoords = points.map((p, idx) => {
      const val = p.sleep !== undefined ? p.sleep : 0;
      const x = idx * step;
      const y = height - (val / 10) * (height - 8) - 4;
      return { x, y, val };
    });

    const moodLine = moodCoords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");

    const sleepLine = sleepCoords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");

    return { moodLine, sleepLine, width, height };
  }, [stats.dailyCompletions]);

  // Overall Stats Donut ring calculation
  const donutStroke = useMemo(() => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (stats.completionRate / 100) * circumference;
    return { radius, circumference, offset };
  }, [stats.completionRate]);

  return (
    <div className={`space-y-6 pb-20 select-none ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
      
      {/* ========================================================================= */}
      {/* 1. TOP STATS ROW (DAILY PROGRESS, GOAL / COMPLETED / LEFT, OVERALL STATS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left: DAILY PROGRESS Area Chart */}
        <div className={`lg:col-span-6 rounded-2xl border p-5 flex flex-col justify-between ${
          isLight 
            ? "bg-[#FFFFFF] border-[#E3E0D8] shadow-2xs" 
            : "bg-[#0E1322] border-white/10 shadow-sm"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#C96F55]" />
              <span className={`text-xs font-black tracking-widest uppercase ${
                isLight ? "text-[#1D1D1B]" : "text-white"
              }`}>
                Daily Progress
              </span>
            </div>
            <span className={`text-xs font-medium ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
              {daysList.length} Days Tracking Period
            </span>
          </div>

          {/* SVG Progress Graph */}
          <div className="relative w-full h-24 my-1 overflow-hidden">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className={`border-b border-dashed ${isLight ? "border-slate-300" : "border-slate-600"}`} />
              <div className={`border-b border-dashed ${isLight ? "border-slate-300" : "border-slate-600"}`} />
              <div className={`border-b border-dashed ${isLight ? "border-slate-300" : "border-slate-600"}`} />
            </div>

            <svg viewBox={`0 0 ${progressPath.width} ${progressPath.height}`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="habitProgressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C96F55" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C96F55" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {progressPath.area && (
                <path d={progressPath.area} fill="url(#habitProgressGradient)" />
              )}
              {progressPath.line && (
                <path d={progressPath.line} fill="none" stroke="#C96F55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {/* Point circles */}
              {progressPath.coords?.map((pt, i) => (
                <circle 
                  key={i} 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={pt.isToday ? 4 : (pt.count > 0 ? 2.5 : 1.5)} 
                  fill={pt.isToday ? "#C96F55" : (isLight ? "#1D1D1B" : "#FFFFFF")}
                  stroke={pt.isToday ? "#FFFFFF" : "none"}
                  strokeWidth={pt.isToday ? "1.5" : "0"}
                />
              ))}
            </svg>
          </div>

          {/* Week Label Markers along Bottom Axis */}
          <div className={`pt-2 border-t flex items-center justify-between text-[11px] font-bold tracking-wider uppercase ${
            isLight ? "border-[#E3E0D8] text-[#77736B]" : "border-white/10 text-slate-400"
          }`}>
            <span>WEEK 1</span>
            {rangeDays >= 14 && <span>WEEK 2</span>}
            {rangeDays >= 21 && <span>WEEK 3</span>}
            {rangeDays >= 28 && <span>WEEK 4</span>}
            {rangeDays >= 30 && <span>WEEK 5</span>}
          </div>
        </div>

        {/* Center: GOAL / COMPLETED / LEFT High-Impact Cards */}
        <div className="lg:col-span-3 flex flex-col gap-2.5 justify-between">
          
          {/* GOAL CARD */}
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
            isLight ? "bg-[#FFFFFF] border-[#E3E0D8]" : "bg-[#0E1322] border-white/10"
          }`}>
            <div>
              <div className={`text-[10px] font-extrabold tracking-widest uppercase ${
                isLight ? "text-[#77736B]" : "text-slate-400"
              }`}>
                Goal
              </div>
              <div className={`text-2xl font-black tracking-tight leading-tight ${
                isLight ? "text-[#1D1D1B]" : "text-white"
              }`}>
                {stats.totalPossible}
              </div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isLight ? "bg-[#F7F6F2] text-[#77736B]" : "bg-white/5 text-slate-300"
            }`}>
              <Target size={18} />
            </div>
          </div>

          {/* COMPLETED CARD */}
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
            isLight ? "bg-[#FFF1EC] border-[#E8D7C9]" : "bg-[#C96F55]/10 border-[#C96F55]/30"
          }`}>
            <div>
              <div className="text-[10px] font-extrabold tracking-widest uppercase text-[#C96F55]">
                Completed
              </div>
              <div className="text-2xl font-black tracking-tight leading-tight text-[#C96F55]">
                {stats.completedCount}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#C96F55] text-white flex items-center justify-center shadow-xs">
              <Check size={18} strokeWidth={3} />
            </div>
          </div>

          {/* LEFT CARD */}
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
            isLight ? "bg-[#FFFFFF] border-[#E3E0D8]" : "bg-[#0E1322] border-white/10"
          }`}>
            <div>
              <div className={`text-[10px] font-extrabold tracking-widest uppercase ${
                isLight ? "text-[#77736B]" : "text-slate-400"
              }`}>
                Left
              </div>
              <div className={`text-2xl font-black tracking-tight leading-tight ${
                isLight ? "text-[#1D1D1B]" : "text-white"
              }`}>
                {stats.remaining}
              </div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isLight ? "bg-[#F7F6F2] text-[#77736B]" : "bg-white/5 text-slate-300"
            }`}>
              <Flame size={18} className="text-amber-500" />
            </div>
          </div>

        </div>

        {/* Right: OVERALL STATS Circular Gauge */}
        <div className={`lg:col-span-3 rounded-2xl border p-5 flex flex-col items-center justify-between text-center ${
          isLight 
            ? "bg-[#FFFFFF] border-[#E3E0D8] shadow-2xs" 
            : "bg-[#0E1322] border-white/10 shadow-sm"
        }`}>
          <div className={`text-xs font-black tracking-widest uppercase ${
            isLight ? "text-[#1D1D1B]" : "text-white"
          }`}>
            Overall Stats
          </div>

          {/* Donut Ring */}
          <div className="relative my-2 flex items-center justify-center">
            <svg width="104" height="104" className="transform -rotate-90">
              <circle
                cx="52"
                cy="52"
                r={donutStroke.radius}
                className={isLight ? "stroke-[#E3E0D8]" : "stroke-white/10"}
                strokeWidth="9"
                fill="transparent"
              />
              <circle
                cx="52"
                cy="52"
                r={donutStroke.radius}
                stroke="#C96F55"
                strokeWidth="9"
                strokeDasharray={donutStroke.circumference}
                strokeDashoffset={donutStroke.offset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: "stroke-dashoffset 0.6s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black tracking-tight leading-none ${
                isLight ? "text-[#1D1D1B]" : "text-white"
              }`}>
                {stats.completionRate}%
              </span>
              <span className={`text-[10px] font-semibold mt-0.5 ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                Rate
              </span>
            </div>
          </div>

          {/* Today summary pill */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isLight ? "bg-[#F7F6F2] text-[#77736B]" : "bg-white/5 text-slate-300"
          }`}>
            Today: <span className="font-bold text-[#C96F55]">{stats.todayCompleted}</span> / {stats.todayTotal} done
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. CONTROL BAR / TOOLBAR                                                  */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl border p-3 flex flex-wrap items-center justify-between gap-3 ${
        isLight 
          ? "bg-[#FFFFFF] border-[#E3E0D8] shadow-2xs" 
          : "bg-[#0E1322] border-white/10 shadow-sm"
      }`}>
        
        {/* Left: Day Steppers & Date Badge & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Day prev/next stepper */}
          <div className="flex items-center border rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={handlePrevDay}
              title="Previous starting day"
              className={`p-2 transition cursor-pointer ${
                isLight 
                  ? "bg-[#F7F6F2] hover:bg-[#E8D7C9] text-[#1D1D1B]" 
                  : "bg-white/5 hover:bg-white/10 text-white"
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className={`px-3 py-1.5 text-xs font-bold tracking-tight flex items-center gap-1.5 ${
              isLight ? "bg-white text-[#1D1D1B]" : "bg-[#0E1322] text-white"
            }`}>
              <Calendar size={13} className="text-[#C96F55]" />
              <span>{formattedAnchorDate}</span>
            </div>
            <button
              onClick={handleNextDay}
              title="Next starting day"
              className={`p-2 transition cursor-pointer ${
                isLight 
                  ? "bg-[#F7F6F2] hover:bg-[#E8D7C9] text-[#1D1D1B]" 
                  : "bg-white/5 hover:bg-white/10 text-white"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* TODAY = DAY 1 Indicator / Trigger */}
          <button
            onClick={handleStartFromToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase transition cursor-pointer border ${
              startDate === todayStr
                ? "bg-[#C96F55] text-white border-[#C96F55] shadow-xs"
                : isLight
                  ? "bg-[#1D1D1B] text-white hover:bg-black border-transparent"
                  : "bg-white text-black hover:bg-slate-200 border-transparent"
            }`}
          >
            {todayDayIndex ? `Today = Day ${todayDayIndex}` : "Set Today = Day 1"}
          </button>

          {/* Range Pills (7D, 14D, 21D, 30D) */}
          <div className={`flex items-center border rounded-xl p-0.5 ${
            isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-white/5 border-white/10"
          }`}>
            {([7, 14, 21, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRangeDays(r)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  rangeDays === r
                    ? isLight
                      ? "bg-[#1D1D1B] text-white shadow-2xs"
                      : "bg-[#C96F55] text-white shadow-xs"
                    : isLight
                      ? "text-[#77736B] hover:text-[#1D1D1B]"
                      : "text-slate-400 hover:text-white"
                }`}
              >
                {r}D
              </button>
            ))}
          </div>

          {/* + ADD HABIT Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C96F55] text-white hover:bg-[#B85F48] transition cursor-pointer shadow-xs"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Habit</span>
          </button>

        </div>

        {/* Right: Persistence Badge & Quick Actions */}
        <div className="flex items-center gap-2">
          
          {/* Data Saved Indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isLight 
              ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#66856D]" 
              : "bg-white/5 border-white/10 text-emerald-400"
          }`}>
            <CheckCircle2 size={13} className="text-[#66856D]" />
            <span>{saveStatus === "saving" ? "Saving..." : "All Data Saved"}</span>
          </div>

          {/* Check Today Button */}
          <button
            onClick={handleCheckToday}
            title="Mark all habits completed for today"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isLight 
                ? "bg-[#FFFFFF] hover:bg-[#F7F6F2] text-[#1D1D1B] border-[#E3E0D8]" 
                : "bg-white/5 hover:bg-white/10 text-white border-white/10"
            }`}
          >
            <Check size={14} className="text-[#C96F55]" />
            <span>Check Today</span>
          </button>

          {/* Start from Today */}
          <button
            onClick={handleStartFromToday}
            title="Reset starting anchor to today's date"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isLight 
                ? "bg-[#FFFFFF] hover:bg-[#F7F6F2] text-[#1D1D1B] border-[#E3E0D8]" 
                : "bg-white/5 hover:bg-white/10 text-white border-white/10"
            }`}
          >
            <RotateCcw size={13} />
            <span>Start from Today</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={() => setShowClearConfirm(true)}
            title="Reset habit checks"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              isLight 
                ? "text-[#77736B] hover:text-red-600 hover:border-red-200 border-[#E3E0D8]" 
                : "text-slate-400 hover:text-red-400 hover:border-red-500/30 border-white/10"
            }`}
          >
            Clear
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN HABITS SPREADSHEET MATRIX / TABLE                                 */}
      {/* ========================================================================= */}
      <div className={`rounded-2xl border overflow-hidden shadow-2xs ${
        isLight 
          ? "bg-[#FFFFFF] border-[#E3E0D8]" 
          : "bg-[#0E1322] border-white/10"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[700px]">
            
            {/* Header: Week Groupings */}
            <thead>
              <tr className={`border-b text-xs font-black tracking-widest uppercase ${
                isLight ? "bg-[#1D1D1B] text-white border-[#1D1D1B]" : "bg-black text-white border-white/10"
              }`}>
                {/* Sticky Left Column Header */}
                <th className="sticky left-0 z-20 px-4 py-3 min-w-[190px] md:min-w-[220px] bg-inherit border-r border-white/10">
                  MY HABITS
                </th>

                {/* Week column spans */}
                {weeksGrouped.map((w) => (
                  <th
                    key={w.weekNum}
                    colSpan={w.count}
                    className="px-2 py-3 text-center border-r border-white/10"
                  >
                    WEEK {w.weekNum}
                  </th>
                ))}
              </tr>

              {/* Sub-header 1: Day of Week (Sa, Su, Mo, Tu, We, Th, Fr) */}
              <tr className={`border-b text-[11px] font-bold ${
                isLight 
                  ? "bg-[#F7F6F2] text-[#77736B] border-[#E3E0D8]" 
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}>
                <th className={`sticky left-0 z-20 px-4 py-2 border-r uppercase tracking-wider text-[10px] font-extrabold ${
                  isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#77736B]" : "bg-[#0A0E1C] border-white/10 text-slate-400"
                }`}>
                  DAY OF WEEK
                </th>
                {daysList.map((d) => (
                  <th 
                    key={d.dateStr} 
                    className={`px-1.5 py-1.5 text-center border-r min-w-[38px] ${
                      d.isToday 
                        ? (isLight ? "bg-[#FFF1EC] text-[#C96F55] font-black border-[#E8D7C9]" : "bg-[#C96F55]/20 text-white font-black border-[#C96F55]/40")
                        : (isLight ? "border-[#E3E0D8]" : "border-white/10")
                    }`}
                  >
                    {d.dayOfWeek}
                  </th>
                ))}
              </tr>

              {/* Sub-header 2: Day & Date Number (D1 12, D2 13...) */}
              <tr className={`border-b text-xs font-semibold ${
                isLight 
                  ? "bg-[#FFFFFF] text-[#1D1D1B] border-[#E3E0D8]" 
                  : "bg-[#0E1322] text-white border-white/10"
              }`}>
                <th className={`sticky left-0 z-20 px-4 py-2 border-r text-[10px] font-extrabold tracking-wider uppercase ${
                  isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#77736B]" : "bg-[#0E1322] border-white/10 text-slate-400"
                }`}>
                  DAY & DATE
                </th>
                {daysList.map((d) => (
                  <th 
                    key={d.dateStr} 
                    className={`px-1 py-1.5 text-center border-r ${
                      d.isToday 
                        ? (isLight ? "bg-[#FFF1EC] border-[#E8D7C9]" : "bg-[#C96F55]/15 border-[#C96F55]/40")
                        : (isLight ? "border-[#E3E0D8]" : "border-white/10")
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[#77736B] leading-none">D{d.dayIndex}</span>
                      <span className={`text-xs font-extrabold leading-tight ${d.isToday ? "text-[#C96F55]" : ""}`}>
                        {d.dayNum}
                      </span>
                      {d.isToday && (
                        <span className="mt-0.5 px-1 rounded text-[8px] font-black tracking-tighter bg-[#C96F55] text-white uppercase">
                          TODAY
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Habit Rows Body */}
            <tbody>
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={daysList.length + 1} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Sparkles size={28} className="text-[#C96F55]" />
                      <p className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>
                        No habits configured yet
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C96F55] text-white shadow-xs hover:bg-[#B85F48]"
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
                    className={`border-b transition group ${
                      isLight 
                        ? "hover:bg-[#FAF9F5] border-[#E3E0D8]" 
                        : "hover:bg-white/[0.02] border-white/10"
                    }`}
                  >
                    {/* Sticky Habit Info Column */}
                    <td className={`sticky left-0 z-10 px-4 py-2.5 border-r ${
                      isLight ? "bg-[#FFFFFF] border-[#E3E0D8]" : "bg-[#0E1322] border-white/10"
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base select-none shrink-0">{habit.emoji}</span>
                          <span className={`text-xs font-bold truncate max-w-[120px] md:max-w-[150px] ${
                            isLight ? "text-[#1D1D1B]" : "text-white"
                          }`}>
                            {habit.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          title="Delete habit"
                          className="p-1 rounded-md opacity-40 hover:opacity-100 hover:text-red-500 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Checkbox columns for each day */}
                    {daysList.map((d) => {
                      const isChecked = !!habitLogs[d.dateStr]?.completedHabits?.[habit.id];

                      return (
                        <td
                          key={d.dateStr}
                          className={`p-1 text-center border-r ${
                            d.isToday 
                              ? (isLight ? "bg-[#FFF1EC]/50 border-[#E8D7C9]" : "bg-[#C96F55]/5 border-[#C96F55]/30")
                              : (isLight ? "border-[#E3E0D8]" : "border-white/10")
                          }`}
                        >
                          <button
                            onClick={() => handleToggleHabit(habit.id, d.dateStr)}
                            title={`${habit.name} on ${d.dateStr}`}
                            className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer border ${
                              isChecked
                                ? "bg-[#C96F55] border-[#C96F55] text-white shadow-2xs transform scale-105"
                                : isLight
                                  ? "bg-white border-[#D6D3CB] hover:border-[#C96F55]"
                                  : "bg-white/5 border-white/15 hover:border-white/40"
                            }`}
                          >
                            {isChecked && <Check size={14} strokeWidth={3} className="animate-in zoom-in-75 duration-150" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}

              {/* ================================================================= */}
              {/* SPECIAL TRACKER ROWS: MOOD & SLEEP (from user image)               */}
              {/* ================================================================= */}
              
              {/* MOOD (1-10) ROW */}
              <tr className={`border-b ${
                isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/30 border-white/10"
              }`}>
                <td className={`sticky left-0 z-10 px-4 py-2.5 border-r ${
                  isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-[#0A0E1C] border-white/10"
                }`}>
                  <div className="flex items-center gap-2">
                    <Smile size={16} className="text-amber-500" />
                    <span className="text-[11px] font-black tracking-wider uppercase">
                      Mood (1–10)
                    </span>
                  </div>
                </td>

                {daysList.map((d) => {
                  const moodVal = habitLogs[d.dateStr]?.mood;

                  return (
                    <td 
                      key={d.dateStr} 
                      className={`p-1 text-center border-r ${
                        d.isToday 
                          ? (isLight ? "bg-[#FFF1EC]/50 border-[#E8D7C9]" : "bg-[#C96F55]/5 border-[#C96F55]/30")
                          : (isLight ? "border-[#E3E0D8]" : "border-white/10")
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setRatingPopover({
                            type: "mood",
                            dateStr: d.dateStr,
                            dayNum: d.dayIndex,
                            x: rect.left,
                            y: rect.bottom + 4
                          });
                        }}
                        className={`w-7 h-7 mx-auto rounded-md text-[11px] font-bold flex items-center justify-center transition cursor-pointer border ${
                          moodVal !== undefined
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40"
                            : isLight
                              ? "bg-white/60 text-slate-400 hover:text-slate-700 border-dashed border-slate-300"
                              : "bg-white/5 text-slate-500 hover:text-slate-300 border-dashed border-white/10"
                        }`}
                        title={`Mood for D${d.dayIndex}: ${moodVal || "Not set"}`}
                      >
                        {moodVal !== undefined ? moodVal : "–"}
                      </button>
                    </td>
                  );
                })}
              </tr>

              {/* SLEEP (1-10) ROW */}
              <tr className={`border-b ${
                isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/30 border-white/10"
              }`}>
                <td className={`sticky left-0 z-10 px-4 py-2.5 border-r ${
                  isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-[#0A0E1C] border-white/10"
                }`}>
                  <div className="flex items-center gap-2">
                    <Moon size={16} className="text-indigo-400" />
                    <span className="text-[11px] font-black tracking-wider uppercase">
                      Sleep (1–10)
                    </span>
                  </div>
                </td>

                {daysList.map((d) => {
                  const sleepVal = habitLogs[d.dateStr]?.sleep;

                  return (
                    <td 
                      key={d.dateStr} 
                      className={`p-1 text-center border-r ${
                        d.isToday 
                          ? (isLight ? "bg-[#FFF1EC]/50 border-[#E8D7C9]" : "bg-[#C96F55]/5 border-[#C96F55]/30")
                          : (isLight ? "border-[#E3E0D8]" : "border-white/10")
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setRatingPopover({
                            type: "sleep",
                            dateStr: d.dateStr,
                            dayNum: d.dayIndex,
                            x: rect.left,
                            y: rect.bottom + 4
                          });
                        }}
                        className={`w-7 h-7 mx-auto rounded-md text-[11px] font-bold flex items-center justify-center transition cursor-pointer border ${
                          sleepVal !== undefined
                            ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40"
                            : isLight
                              ? "bg-white/60 text-slate-400 hover:text-slate-700 border-dashed border-slate-300"
                              : "bg-white/5 text-slate-500 hover:text-slate-300 border-dashed border-white/10"
                        }`}
                        title={`Sleep for D${d.dayIndex}: ${sleepVal || "Not set"}`}
                      >
                        {sleepVal !== undefined ? sleepVal : "–"}
                      </button>
                    </td>
                  );
                })}
              </tr>

              {/* TREND LINE FOOTER ROW (from user image) */}
              <tr className={isLight ? "bg-[#FFFFFF]" : "bg-[#0E1322]"}>
                <td className={`sticky left-0 z-10 px-4 py-2 border-r ${
                  isLight ? "bg-[#FFFFFF] border-[#E3E0D8]" : "bg-[#0E1322] border-white/10"
                }`}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black tracking-wider uppercase text-[#77736B]">
                      TREND LINE
                    </span>
                    <div className="flex items-center gap-3 text-[10px] font-semibold">
                      <span className="flex items-center gap-1 text-amber-500">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Mood
                      </span>
                      <span className="flex items-center gap-1 text-indigo-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Sleep
                      </span>
                    </div>
                  </div>
                </td>

                <td colSpan={daysList.length} className="px-2 py-1">
                  <div className="h-10 w-full">
                    <svg viewBox={`0 0 ${trendLineData.width} ${trendLineData.height}`} className="w-full h-full" preserveAspectRatio="none">
                      {trendLineData.moodLine && (
                        <path d={trendLineData.moodLine} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                      )}
                      {trendLineData.sleepLine && (
                        <path d={trendLineData.sleepLine} fill="none" stroke="#818CF8" strokeWidth="2" />
                      )}
                    </svg>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS & POPOVERS                                                      */}
      {/* ========================================================================= */}

      {/* RATING POPOVER (For Mood / Sleep quick 1-10 selector) */}
      <AnimatePresence>
        {ratingPopover && (
          <div 
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setRatingPopover(null)}
          >
            <div 
              className={`absolute p-2.5 rounded-xl border shadow-xl ${
                isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#141A2D] border-white/20 text-white"
              }`}
              style={{
                left: Math.min(Math.max(16, ratingPopover.x - 60), window.innerWidth - 180),
                top: Math.min(ratingPopover.y, window.innerHeight - 130)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5 flex items-center justify-between">
                <span>Select {ratingPopover.type} (D{ratingPopover.dayNum})</span>
                <button onClick={() => setRatingPopover(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSetRating(ratingPopover.type, ratingPopover.dateStr, num)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      num >= 8 
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white"
                        : num >= 5
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 hover:bg-amber-500 hover:text-white"
                          : "bg-red-500/20 text-red-600 dark:text-red-300 hover:bg-red-500 hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD HABIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0E1322] border-white/15 text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C96F55]/15 text-[#C96F55] flex items-center justify-center font-bold">
                    +
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Add New Habit</h3>
                    <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                      Track your daily academic and personal routines
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddHabit} className="space-y-4">
                {/* Habit Name */}
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-[#77736B]">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g. Read 20 mins, Solve Physics, Review Flashcards"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition ${
                      isLight 
                        ? "bg-[#F7F6F2] border-[#E3E0D8] focus:border-[#C96F55]" 
                        : "bg-white/5 border-white/10 focus:border-[#C96F55]"
                    }`}
                  />
                </div>

                {/* Emoji Selection */}
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-[#77736B]">
                    Choose Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((em) => (
                      <button
                        type="button"
                        key={em}
                        onClick={() => setNewHabitEmoji(em)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition cursor-pointer border ${
                          newHabitEmoji === em
                            ? "bg-[#C96F55]/20 border-[#C96F55] scale-110 shadow-xs"
                            : isLight
                              ? "bg-[#F7F6F2] border-[#E3E0D8] hover:border-slate-400"
                              : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isLight ? "text-[#77736B] hover:bg-[#F0EEE8]" : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C96F55] text-white hover:bg-[#B85F48] transition cursor-pointer shadow-xs"
                  >
                    Create Habit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLEAR DATA CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${
                isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0E1322] border-white/15 text-white"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center mb-3">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-base font-bold mb-1">Clear Current Progress?</h3>
              <p className={`text-xs mb-4 ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                This will reset all completed checks for the visible {rangeDays}-day challenge period. Your configured habits will be kept.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isLight ? "text-[#77736B] hover:bg-[#F0EEE8]" : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  Keep Data
                </button>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer shadow-xs"
                >
                  Yes, Clear Checks
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

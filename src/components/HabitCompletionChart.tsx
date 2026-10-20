import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";
import { TrendingUp, BarChart2, Flame, Award, Calendar, CheckCircle2 } from "lucide-react";
import { HabitItem, HabitDayLog } from "../types";

interface HabitCompletionChartProps {
  habits: HabitItem[];
  habitLogs: Record<string, HabitDayLog>;
  themeMode?: "light" | "dark";
}

interface DayTrendData {
  dateStr: string;
  displayLabel: string;
  fullDateLabel: string;
  dayOfWeek: string;
  dayNum: number;
  completed: number;
  total: number;
  rate: number;
  isToday: boolean;
  completedHabitNames: { name: string; emoji: string; color?: string }[];
  mood?: number;
  sleep?: number;
}

export default function HabitCompletionChart({
  habits,
  habitLogs,
  themeMode = "dark"
}: HabitCompletionChartProps) {
  const isLight = themeMode === "light";
  const [metricMode, setMetricMode] = useState<"count" | "rate">("count");
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  const formatYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Compute the rolling last 7 days (ending today)
  const chartData: DayTrendData[] = useMemo(() => {
    const list: DayTrendData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatYMD(d);
      const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const isToday = i === 0;

      const log = habitLogs[dateStr];
      let completedCount = 0;
      const completedHabitNames: { name: string; emoji: string; color?: string }[] = [];

      if (log && log.completedHabits) {
        habits.forEach((h) => {
          if (log.completedHabits[h.id]) {
            completedCount++;
            completedHabitNames.push({ name: h.name, emoji: h.emoji, color: h.color });
          }
        });
      }

      const total = habits.length;
      const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      list.push({
        dateStr,
        displayLabel: isToday ? "Today" : `${dayOfWeek} ${dayNum}`,
        fullDateLabel: `${dayOfWeek}, ${monthShort} ${dayNum}`,
        dayOfWeek,
        dayNum,
        completed: completedCount,
        total,
        rate,
        isToday,
        completedHabitNames,
        mood: log?.mood,
        sleep: log?.sleep
      });
    }

    return list;
  }, [habits, habitLogs]);

  // Derived 7-day summary metrics
  const summaryMetrics = useMemo(() => {
    const totalPossible7d = habits.length * 7;
    const totalCompleted7d = chartData.reduce((acc, d) => acc + d.completed, 0);
    const avgRate = totalPossible7d > 0 ? Math.round((totalCompleted7d / totalPossible7d) * 100) : 0;

    // Best day
    let bestDay = chartData[0];
    chartData.forEach((d) => {
      if (d.completed > (bestDay?.completed ?? 0)) {
        bestDay = d;
      }
    });

    // Consecutive streak ending today or yesterday with at least 1 completed habit
    let streak = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].completed > 0) {
        streak++;
      } else {
        // If today is empty yet, allow streak from yesterday
        if (i === chartData.length - 1) {
          continue;
        }
        break;
      }
    }

    return {
      totalPossible7d,
      totalCompleted7d,
      avgRate,
      bestDay,
      streak
    };
  }, [chartData, habits.length]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: DayTrendData = payload[0].payload;

    return (
      <div
        className={`p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs z-50 min-w-[200px] max-w-[280px] transition-all ${
          isLight
            ? "bg-white/95 border-[#E2E6EF] text-[#18202B] shadow-[#C25E42]/10"
            : "bg-[#181D28]/95 border-[#2E374A] text-[#F1F3F8] shadow-black/40"
        }`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit">
          <div className="flex items-center gap-1.5 font-semibold">
            <Calendar size={13} className={isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"} />
            <span>{data.fullDateLabel}</span>
          </div>
          {data.isToday && (
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md border ${
              isLight
                ? "bg-[#FFF2ED] text-[#B25136] border-[#F0D5CC]"
                : "bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/30"
            }`}>
              Today
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={isLight ? "text-[#596474]" : "text-[#94A3B8]"}>Completed:</span>
            <span className={`font-mono font-bold text-sm ${isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"}`}>
              {data.completed} / {data.total}
              <span className="text-[11px] font-normal ml-1 opacity-80">({data.rate}%)</span>
            </span>
          </div>

          {/* Progress bar inside tooltip */}
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isLight
                  ? "bg-gradient-to-r from-[#C25E42] to-[#FB923C]"
                  : "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"
              }`}
              style={{ width: `${Math.min(100, data.rate)}%` }}
            />
          </div>

          {/* Completed habits list chips */}
          {data.completedHabitNames.length > 0 ? (
            <div className="pt-1">
              <span className={`text-[10px] block mb-1 font-medium ${isLight ? "text-[#596474]" : "text-[#94A3B8]"}`}>
                Completed habits:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {data.completedHabitNames.map((h, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isLight ? "bg-[#FFF2ED] text-[#B25136] border border-[#F0D5CC]/60" : "bg-[#8B5CF6]/20 text-[#DDD6FE]"
                    }`}
                  >
                    <span>{h.emoji}</span>
                    <span className="truncate max-w-[120px]">{h.name}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className={`text-[11px] italic pt-0.5 ${isLight ? "text-[#94A3B8]" : "text-[#64748B]"}`}>
              No habits completed on this day
            </p>
          )}

          {/* Mood / Sleep info if logged */}
          {(data.mood !== undefined || data.sleep !== undefined) && (
            <div className={`pt-1 border-t border-inherit flex items-center justify-between text-[10px] ${
              isLight ? "text-[#596474]" : "text-[#94A3B8]"
            }`}>
              {data.mood !== undefined && <span>Mood: {data.mood}/10</span>}
              {data.sleep !== undefined && <span>Sleep: {data.sleep}h</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const maxY = metricMode === "count" ? Math.max(1, habits.length) : 100;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 ${
        isLight
          ? "bg-[#FFFFFF] border-[#E2E6EF] shadow-sm"
          : "bg-[#191E28] border-[#283040] shadow-md shadow-black/20"
      }`}
    >
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#A78BFA]"
            }`}
          >
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                7-Day Habit Completion Summary
              </h2>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
                }`}
              >
                Recharts
              </span>
            </div>
            <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#94A3B8]"}`}>
              Trend of habits checked off over the last 7 days
            </p>
          </div>
        </div>

        {/* View toggles: Metric & Chart Type */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Count vs Rate toggle */}
          <div
            className={`flex items-center p-0.5 rounded-lg border text-xs font-medium ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#12161F] border-[#2E374A]"
            }`}
          >
            <button
              type="button"
              onClick={() => setMetricMode("count")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                metricMode === "count"
                  ? isLight
                    ? "bg-[#C25E42] text-white shadow-xs font-semibold"
                    : "bg-[#8B5CF6] text-white font-semibold"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Habits Count
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("rate")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                metricMode === "rate"
                  ? isLight
                    ? "bg-[#C25E42] text-white shadow-xs font-semibold"
                    : "bg-[#8B5CF6] text-white font-semibold"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Success Rate %
            </button>
          </div>

          {/* Area vs Bar toggle */}
          <div
            className={`flex items-center p-0.5 rounded-lg border text-xs font-medium ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#12161F] border-[#2E374A]"
            }`}
          >
            <button
              type="button"
              onClick={() => setChartType("area")}
              title="Smooth Area Curve"
              className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                chartType === "area"
                  ? isLight
                    ? "bg-[#C25E42] text-white shadow-xs font-semibold"
                    : "bg-[#8B5CF6] text-white font-semibold"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <TrendingUp size={13} />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              title="Bar Chart"
              className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                chartType === "bar"
                  ? isLight
                    ? "bg-[#C25E42] text-white shadow-xs font-semibold"
                    : "bg-[#8B5CF6] text-white font-semibold"
                  : isLight
                  ? "text-[#596474] hover:text-[#18202B]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <BarChart2 size={13} />
              <span className="hidden sm:inline">Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Metric Highlight Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            isLight ? "bg-[#FFF2ED]/70 border-[#F0D5CC]" : "bg-[#8B5CF6]/10 border-[#8B5CF6]/25"
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#8B5CF6]"
          }`}>
            <CheckCircle2 size={15} />
          </div>
          <div>
            <span className={`text-[10px] uppercase font-semibold tracking-wider block ${
              isLight ? "text-[#B25136]" : "text-[#C084FC]"
            }`}>
              7d Avg Rate
            </span>
            <span className={`text-base font-bold font-mono ${isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"}`}>
              {summaryMetrics.avgRate}%
            </span>
          </div>
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            isLight ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#12161F] border-[#283040]"
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Award size={15} />
          </div>
          <div>
            <span className={`text-[10px] uppercase font-semibold tracking-wider block ${
              isLight ? "text-[#64748B]" : "text-[#94A3B8]"
            }`}>
              Completions
            </span>
            <span className="text-base font-bold font-mono">
              {summaryMetrics.totalCompleted7d}
              <span className="text-xs font-normal opacity-60 ml-1">/ {summaryMetrics.totalPossible7d}</span>
            </span>
          </div>
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            isLight ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#12161F] border-[#283040]"
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Flame size={15} />
          </div>
          <div>
            <span className={`text-[10px] uppercase font-semibold tracking-wider block ${
              isLight ? "text-[#64748B]" : "text-[#94A3B8]"
            }`}>
              Active Streak
            </span>
            <span className="text-base font-bold font-mono">
              {summaryMetrics.streak} {summaryMetrics.streak === 1 ? "day" : "days"}
            </span>
          </div>
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
            isLight ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#12161F] border-[#283040]"
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
            <Calendar size={15} />
          </div>
          <div>
            <span className={`text-[10px] uppercase font-semibold tracking-wider block ${
              isLight ? "text-[#64748B]" : "text-[#94A3B8]"
            }`}>
              Best 7d Day
            </span>
            <span className="text-sm font-bold font-mono truncate block max-w-[100px]">
              {summaryMetrics.bestDay?.displayLabel || "N/A"} ({summaryMetrics.bestDay?.completed || 0})
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      {habits.length === 0 ? (
        <div
          className={`h-56 rounded-xl border border-dashed flex flex-col items-center justify-center p-6 text-center ${
            isLight ? "bg-[#F6F7FA] border-[#CBD2E0]" : "bg-[#10131A]/60 border-[#364054]"
          }`}
        >
          <TrendingUp size={28} className={`${isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"} mb-2 opacity-60`} />
          <p className="text-sm font-semibold">No habits tracked yet</p>
          <p className={`text-xs mt-1 max-w-sm ${isLight ? "text-[#596474]" : "text-[#94A3B8]"}`}>
            Add your daily habits using the button above to visualize your 7-day completion trend here.
          </p>
        </div>
      ) : (
        <div className="w-full h-56 pt-2 select-none">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="rechartsHabitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isLight ? "#C25E42" : "#8B5CF6"} stopOpacity={0.45} />
                    <stop offset="60%" stopColor={isLight ? "#C25E42" : "#8B5CF6"} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={isLight ? "#C25E42" : "#8B5CF6"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isLight ? "#E2E8F0" : "#283040"}
                  opacity={0.7}
                />
                <XAxis
                  dataKey="displayLabel"
                  axisLine={{ stroke: isLight ? "#CBD5E1" : "#334155" }}
                  tickLine={false}
                  tick={{
                    fill: isLight ? "#64748B" : "#94A3B8",
                    fontSize: 11,
                    fontFamily: "monospace"
                  }}
                  dy={6}
                />
                <YAxis
                  domain={[0, maxY]}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: isLight ? "#64748B" : "#94A3B8",
                    fontSize: 10,
                    fontFamily: "monospace"
                  }}
                  unit={metricMode === "rate" ? "%" : ""}
                />
                <Tooltip content={<CustomTooltip />} />
                {metricMode === "rate" && (
                  <ReferenceLine
                    y={100}
                    stroke="#10B981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    label={{
                      value: "100%",
                      fill: "#10B981",
                      fontSize: 10,
                      position: "insideTopRight"
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey={metricMode === "count" ? "completed" : "rate"}
                  stroke={isLight ? "#C25E42" : "#8B5CF6"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#rechartsHabitGradient)"
                  activeDot={{
                    r: 6,
                    fill: isLight ? "#C25E42" : "#8B5CF6",
                    stroke: isLight ? "#FFFFFF" : "#191E28",
                    strokeWidth: 2
                  }}
                  dot={{
                    r: 3.5,
                    fill: isLight ? "#B25136" : "#A78BFA",
                    strokeWidth: 1.5,
                    stroke: isLight ? "#FFFFFF" : "#191E28"
                  }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isLight ? "#E2E8F0" : "#283040"}
                  opacity={0.7}
                />
                <XAxis
                  dataKey="displayLabel"
                  axisLine={{ stroke: isLight ? "#CBD5E1" : "#334155" }}
                  tickLine={false}
                  tick={{
                    fill: isLight ? "#64748B" : "#94A3B8",
                    fontSize: 11,
                    fontFamily: "monospace"
                  }}
                  dy={6}
                />
                <YAxis
                  domain={[0, maxY]}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: isLight ? "#64748B" : "#94A3B8",
                    fontSize: 10,
                    fontFamily: "monospace"
                  }}
                  unit={metricMode === "rate" ? "%" : ""}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? "#F1F5F9" : "#1E293B", opacity: 0.5 }} />
                <Bar
                  dataKey={metricMode === "count" ? "completed" : "rate"}
                  fill={isLight ? "#C25E42" : "#8B5CF6"}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Footer Indicator */}
      <div
        className={`mt-2.5 pt-2.5 border-t flex flex-wrap items-center justify-between text-[11px] font-mono ${
          isLight ? "border-[#E2E6EF] text-[#64748B]" : "border-[#283040] text-[#94A3B8]"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full inline-block ${isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"}`} />
          7-day window: {chartData[0]?.displayLabel} → {chartData[6]?.displayLabel}
        </span>
        <span className={`font-semibold ${isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"}`}>
          {summaryMetrics.totalCompleted7d} total habits completed this week
        </span>
      </div>
    </div>
  );
}

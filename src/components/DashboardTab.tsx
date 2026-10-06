import React from "react";
import { 
  Flame, 
  ArrowRight, 
  Play, 
  Pause,
  RotateCcw,
  Clock, 
  BookOpen, 
  Target,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Award,
  Brain,
  Coffee,
  Trees,
  GraduationCap,
  Compass,
  Zap,
  CheckSquare,
  TrendingUp,
  CalendarClock
} from "lucide-react";
import { Task } from "../types";
import { FlipClockTimer } from "./FlipClockTimer";

interface DashboardTabProps {
  tasks: Task[];
  focusModeActive: boolean;
  focusTimeRemaining: string;
  focusMinutesSelected: number;
  onStartFocus: () => void;
  onPauseFocus?: () => void;
  onResetFocus?: () => void;
  onStopFocus: () => void;
  onNavigateTab: (tab: string) => void;
  streak: number;
  pomodoroMode?: "work" | "break" | "long";
  isPaused?: boolean;
  pomodoroCount?: number;
  themeMode?: "light" | "dark";
}

export default function DashboardTab({
  tasks,
  focusModeActive,
  focusTimeRemaining,
  focusMinutesSelected,
  onStartFocus,
  onPauseFocus,
  onResetFocus,
  onStopFocus,
  onNavigateTab,
  streak,
  pomodoroMode = "work",
  isPaused = false,
  pomodoroCount = 0,
  themeMode = "light"
}: DashboardTabProps) {

  const isLight = themeMode === "light";

  // Calculations for progress indicators
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = tasks.filter(t => !t.completed);

  // Render priority bullet styles
  const getPriorityStyle = (priority: string) => {
    if (isLight) {
      switch (priority) {
        case "Urgent/High":
          return "bg-[#F5E2E2] text-[#B85C5C] border border-[#F5E2E2]";
        case "Scheduled":
          return "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]";
        default:
          return "bg-[#E3EEE5] text-[#66856D] border border-[#C5DAC9]";
      }
    }
    switch (priority) {
      case "Urgent/High":
        return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
      case "Scheduled":
        return "bg-[#C96F55]/20 text-[#E0C6B5] border border-[#C96F55]/30";
      default:
        return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* 1. SEAMLESS TOP GREETING BANNER WITH DYNAMIC METRICS */}
      <div className={`relative overflow-hidden ${
        isLight 
          ? "bg-[#FFFFFF] border border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" 
          : "bg-[#0A0714]/85 border border-white/10 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
      } p-6 md:p-8 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
        
        {/* Ambient background glow inside cards in dark mode */}
        {!isLight && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#8B5CF6]/20 via-[#A855F7]/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute -left-10 -bottom-10 w-52 h-52 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none -z-10" />
          </>
        )}
        
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-1.5 ${
              isLight 
                ? "text-[#C96F55] bg-[#FFF1EC] border border-[#E8D7C9]" 
                : "text-[#C084FC] bg-[#8B5CF6]/15 border border-[#8B5CF6]/35"
            } px-2.5 py-1 rounded-lg`}>
              <Sparkles size={13} className={isLight ? "text-[#C96F55]" : "text-[#A855F7]"} />
              <span>ENGEZ NAFSAK ACADEMY</span>
            </span>
            <span className={`${
              isLight 
                ? "text-[#66856D] bg-[#E3EEE5] border border-[#C5DAC9]" 
                : "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
            } px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wider font-bold flex items-center gap-1.5`}>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span>STUDY ACTIVE</span>
            </span>
          </div>

          <h1 className={`text-3xl md:text-4xl font-extrabold ${isLight ? "text-[#1D1D1B]" : "text-white"} mt-3 tracking-tight`}>
            Yalla, <span className="bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#DDD6FE] text-transparent bg-clip-text font-black inline-block">engez nafsak</span> today! ⚡
          </h1>
          <p className={`text-sm md:text-base mt-2 tracking-tight flex flex-wrap items-center gap-3 font-semibold ${
            isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"
          }`}>
            <span className={isLight ? "text-[#77736B] font-medium" : "text-[#B8AFA6] font-medium"}>
              A road to a better life without procrastination 🚀
            </span>
          </p>
        </div>

        {/* Global Streak / Focus Counter Block */}
        <div className={`flex items-center gap-4 ${
          isLight 
            ? "bg-[#F7F6F2] border border-[#E3E0D8]" 
            : "bg-[#0A0714]/85 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        } px-5 py-3.5 rounded-2xl self-stretch lg:self-auto justify-around lg:justify-start`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-500 text-white shadow-xs flex items-center justify-center">
              <Flame size={22} className="fill-current animate-bounce" />
            </div>
            <div>
              <p className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase tracking-tight font-bold`}>Streak</p>
              <h3 className={`text-lg font-black ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>{streak} Days</h3>
            </div>
          </div>
          
          <div className={`w-px h-10 ${isLight ? "bg-[#E3E0D8]" : "bg-white/10"}`} />

          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${isLight ? "bg-[#C96F55]" : "bg-[#7C3AED] shadow-lg shadow-[#7C3AED]/30"} text-white shadow-xs flex items-center justify-center`}>
              <Award size={22} className="animate-pulse" />
            </div>
            <div>
              <p className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase tracking-tight font-bold`}>Focus Blocks</p>
              <h3 className={`text-lg font-black ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>{pomodoroCount} Done</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE ULTIMATE BENTO GRID WORKSPACE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* TIER A: AI PRIORITIZER TASK MATRIX (Spans 4 Columns) */}
        <div className={`md:col-span-4 ${
          isLight 
            ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs" 
            : "bg-[#0A0714]/85 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        } rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden h-fit md:min-h-[300px]`}>
          {!isLight && <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-2xl pointer-events-none" />}
          
          <div>
            <div className={`flex justify-between items-center mb-5 border-b ${isLight ? "border-[#E3E0D8]" : "border-white/10"} pb-3`}>
              <div>
                <h2 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} tracking-wide font-sans`}>Your Tasks</h2>
                <p className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-[#C084FC]"} uppercase tracking-wider font-semibold`}>Priority Action Queue</p>
              </div>
              <button 
                onClick={() => onNavigateTab("matrix")}
                id="dashboard-go-matrix-btn"
                className={`p-1.5 rounded-lg ${
                  isLight 
                    ? "hover:bg-[#F0EEE8] text-[#77736B] hover:text-[#1D1D1B]" 
                    : "hover:bg-[#1A1432] text-[#C4B5FD] hover:text-white"
                } transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold`}
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Micro Task Queue */}
            <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className={`p-8 text-center ${
                  isLight ? "text-[#77736B] border border-dashed border-[#E3E0D8] bg-[#F7F6F2]" : "text-[#C4B5FD]/75 border border-dashed border-white/10 bg-[#120E22]"
                } rounded-2xl`}>
                  <p className="text-xs font-mono">No assignments today.</p>
                  <p className={`text-[10px] mt-1 ${isLight ? "text-[#9B9890]" : "text-[#8B82A8]"}`}>You're all caught up!</p>
                </div>
              ) : (
                tasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id}
                    className={`p-3 rounded-2xl border transition duration-300 relative group flex gap-3 items-start ${
                      isLight 
                        ? "border-[#E3E0D8] bg-[#F7F6F2]" 
                        : "border-white/10 bg-[#120E22]"
                    } ${task.completed ? "opacity-60" : ""}`}
                  >
                    <div className="pt-0.5 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        task.completed ? "bg-slate-400" : (isLight ? "bg-[#C96F55]" : "bg-[#8B5CF6]")
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-semibold ${isLight ? "text-[#1D1D1B]" : "text-white"} block truncate ${task.completed ? "line-through text-[#857C74]" : ""}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-mono ${
                          isLight 
                            ? "text-[#77736B] bg-[#FFFFFF] border border-[#E3E0D8]" 
                            : "text-[#C4B5FD] bg-[#0A0714] border border-white/10"
                        } px-2 py-0.5 rounded max-w-[120px] truncate`}>
                          {task.subject}
                        </span>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded ${getPriorityStyle(task.priority)}`}>
                          {task.priority.replace("/High", "")}
                        </span>
                        {task.dueDate && (
                          <span className={`text-[8px] font-mono ${isLight ? "text-[#C96F55]" : "text-[#C084FC]"} font-extrabold flex items-center gap-1 max-w-[110px] truncate`}>
                            <span className="shrink-0 text-[10px]">⏱️</span>
                            <span className="truncate">{task.dueDate.split("-").slice(1).join("/")} {task.dueTime}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("matrix")}
            id="dashboard-create-task-matrix-btn"
            className={`w-full py-2.5 mt-4 ${
              isLight 
                ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] text-[#1D1D1B] border border-[#E3E0D8]" 
                : "bg-[#120E22] hover:bg-[#1A1432] text-white border border-white/10"
            } rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2`}
          >
            <span>Open Task Matrix</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* TIER B: SCHOLAR WORKSPACE PROGRESS CIRCLE (Spans 8 Columns for wide balance) */}
        <div className={`md:col-span-8 ${
          isLight 
            ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs" 
            : "bg-[#0A0714]/85 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        } rounded-3xl p-6 flex flex-col justify-between relative min-h-[300px] overflow-hidden`}>
          {!isLight && (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#8B5CF6]/15 via-[#A855F7]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-10 w-44 h-44 bg-[#8B5CF6]/10 rounded-full blur-2xl pointer-events-none" />
            </>
          )}
          
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"} tracking-wide font-sans`}>Daily Target Progress</h2>
              <p className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#B8AFA6]"} uppercase tracking-widest font-semibold`}>Scholarship KPIs & Milestone Sync</p>
            </div>
            <div className={`px-3 py-1 ${
              isLight 
                ? "bg-[#E3EEE5] border border-[#C5DAC9] text-[#66856D]" 
                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
            } text-[10px] font-mono rounded-lg font-bold`}>
              {completedTasks}/{totalTasks} COMPLETED
            </div>
          </div>

          {/* Central Progress Core */}
          <div className="flex flex-col sm:flex-row items-center gap-8 my-4 self-center md:self-auto w-full justify-around">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-28 h-28 transform -rotate-90">
                <defs>
                  <linearGradient id="dashboardCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C96F55" />
                    <stop offset="100%" stopColor="#DE7A5E" />
                  </linearGradient>
                </defs>
                {/* Background path */}
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  className={isLight ? "stroke-[#E3E0D8] fill-transparent" : "stroke-[#38312B] fill-transparent"}
                  strokeWidth="8"
                />
                {/* Dynamic progress track */}
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  stroke="url(#dashboardCircleGrad)"
                  className="fill-transparent transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"}`}>{progressPercent}%</span>
                <span className={`text-[8px] font-mono tracking-widest ${isLight ? "text-[#77736B]" : "text-[#B8AFA6]"} uppercase`}>DONE</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left max-w-sm">
              <h4 className={`text-base font-extrabold text-[#C96F55]`}>
                {progressPercent >= 100 ? "Goal Accomplished! 🎉" : progressPercent >= 50 ? "Superb Progress! 👍" : "Let's complete your remaining goals! 🔥"}
              </h4>
              <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#B8AFA6]"} leading-relaxed font-sans`}>
                Consistent daily sessions build unstoppable academic momentum. Complete your tasks, solve past papers, and keep your daily streak alive.
              </p>
            </div>
          </div>

          <div className={`${
            isLight 
              ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#77736B]" 
              : "bg-[#28231F] border border-[#38312B] text-[#B8AFA6]"
          } p-2.5 rounded-xl text-[9px] font-mono text-center uppercase tracking-wider font-semibold flex items-center justify-center gap-2`}>
            <TrendingUp size={12} className={isLight ? "text-[#66856D]" : "text-emerald-400"} />
            <span>ESTIMATED GRADE BOUNDARIES: TARGET GRADE A* / 9.0 READY</span>
          </div>
        </div>

        {/* TIER D: THE FOCUS TIMER BLOCK (Spans 4 Columns) */}
        <div className={`md:col-span-4 rounded-3xl p-6 flex flex-col justify-between shadow-2xs relative overflow-hidden min-h-[260px] transition-all duration-300 ${
          isLight
            ? "bg-[#FFFFFF] border border-[#E3E0D8]"
            : "bg-[#0A0714]/85 border border-white/10 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85)]"
        }`}>
          {!isLight && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-[#8B5CF6]/20 via-[#A855F7]/15 to-transparent rounded-full pointer-events-none -z-10 blur-2xl" />
          )}
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-mono uppercase tracking-widest font-black leading-none ${
                  isLight 
                    ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]" 
                    : "text-[#C084FC] bg-[#8B5CF6]/15 border border-[#8B5CF6]/35"
                } px-2 py-0.5 rounded-md flex items-center gap-1`}>
                  {pomodoroMode === "work" ? <Brain size={10} /> : pomodoroMode === "break" ? <Coffee size={10} /> : <Trees size={10} />}
                  <span>{pomodoroMode === "work" ? "Study Mode" : pomodoroMode === "break" ? "Short Break" : "Long Break"}</span>
                </span>
                {pomodoroCount > 0 && (
                  <span className={`text-[8px] font-mono ${
                    isLight ? "bg-[#F0EEE8] text-[#1D1D1B] border border-[#E3E0D8]" : "text-white bg-white/10 border border-white/15"
                  } px-1.5 py-0.5 rounded font-bold`}>
                    🍅 {pomodoroCount}
                  </span>
                )}
              </div>
              <h2 className={`text-md font-extrabold ${isLight ? "text-[#1D1D1B]" : "text-white"} tracking-wide mt-2 font-sans`}>Pomodoro Study</h2>
            </div>
            
            <div className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full border text-[8px] font-mono tracking-widest uppercase font-bold ${
              isLight
                ? focusModeActive
                  ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]"
                  : isPaused
                  ? "bg-[#F4E9D0] border-[#B98A4A]/30 text-[#B98A4A]"
                  : "bg-[#F0EEE8] border-[#E3E0D8] text-[#77736B]"
                : focusModeActive
                ? "bg-[#8B5CF6]/25 border-[#8B5CF6]/45 text-[#C084FC]"
                : isPaused
                ? "bg-amber-900/40 border-amber-500/40 text-amber-200 animate-pulse"
                : "bg-white/5 border-white/10 text-[#C4B5FD]/75"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                focusModeActive 
                  ? "bg-[#8B5CF6] animate-ping" 
                  : isPaused 
                  ? "bg-amber-400" 
                  : isLight ? "bg-[#77736B]" : "bg-slate-400"
              }`} />
              <span>{focusModeActive ? "STUDYING" : isPaused ? "PAUSED" : "READY"}</span>
            </div>
          </div>

          {/* Centered digits show with Flip Number Timer */}
          <div className="my-3 text-center">
            <FlipClockTimer 
              timeRemaining={focusTimeRemaining} 
              size="md" 
              themeMode={themeMode} 
              isPaused={isPaused} 
            />
            <p className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase tracking-widest font-bold mt-2`}>
              {focusModeActive 
                ? (pomodoroMode === "work" ? "Deep focus interval active" : "Recovery interval active") 
                : isPaused 
                ? "Paused — click Resume when ready" 
                : `Block duration: ${focusMinutesSelected}m`}
            </p>
          </div>

          <div className="flex gap-2">
            {focusModeActive ? (
              <button
                onClick={onPauseFocus || onStopFocus}
                id="dashboard-timer-pause-btn"
                className={`flex-1 py-2.5 ${
                  isLight 
                    ? "bg-[#FFF1EC] hover:bg-[#F0D4C8] text-[#C96F55] border border-[#E8D7C9]" 
                    : "bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C084FC] border border-[#8B5CF6]/40"
                } rounded-xl text-xs font-mono font-bold uppercase transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                <Pause size={13} fill="currentColor" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onStartFocus}
                id="dashboard-timer-start-btn"
                className={`flex-1 py-2.5 ${
                  isLight 
                    ? "bg-[#C96F55] hover:bg-[#B85F48] shadow-md shadow-[#C96F55]/20 text-white" 
                    : "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/35 text-white"
                } rounded-xl text-xs font-mono font-extrabold uppercase transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                <Play size={13} fill="currentColor" />
                <span>{isPaused ? "Resume" : "Start"}</span>
              </button>
            )}

            {isPaused && onResetFocus && (
              <button
                onClick={onResetFocus}
                id="dashboard-timer-reset-btn"
                className={`px-3 rounded-xl ${
                  isLight 
                    ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] text-[#1D1D1B] border border-[#E3E0D8]" 
                    : "bg-[#120E22] hover:bg-[#1A1432] text-white border border-white/10"
                } transition font-mono text-xs cursor-pointer flex items-center justify-center`}
                title="Reset timer"
              >
                <RotateCcw size={14} />
              </button>
            )}
            
            <button
              onClick={() => onNavigateTab("focus")}
              id="dashboard-timer-navigate-btn"
              className={`px-3 rounded-xl ${
                isLight 
                  ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] text-[#1D1D1B] border border-[#E3E0D8]" 
                  : "bg-[#120E22] hover:bg-[#1A1432] text-white border border-white/10"
              } transition font-mono text-xs cursor-pointer flex items-center justify-center`}
              title="Open full Pomodoro settings & cycles"
            >
              <Clock size={15} />
            </button>
          </div>
        </div>

        {/* TIER E: EXAM READINESS & REVISION HUB (Spans 8 Columns) */}
        <div className={`md:col-span-8 ${
          isLight 
            ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs" 
            : "bg-[#0A0714]/85 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        } rounded-3xl p-6 flex flex-col justify-between min-h-[260px] relative overflow-hidden`}>
          {!isLight && <div className="absolute top-0 right-0 w-48 h-48 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />}
          
          <div>
            <div className={`flex justify-between items-center mb-4 pb-2 border-b ${isLight ? "border-[#E3E0D8]" : "border-white/10"}`}>
              <div>
                <h2 className={`text-md font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} tracking-wide flex items-center gap-2 font-sans`}>
                  <span>Exam Readiness & Quick Launch</span>
                  <Sparkles size={14} className={isLight ? "text-[#C96F55]" : "text-[#A855F7]"} />
                </h2>
                <p className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase tracking-widest font-semibold`}>High-Yield Revision Pathways</p>
              </div>
              <span className={`text-[10px] font-mono ${
                isLight 
                  ? "text-[#66856D] bg-[#E3EEE5] border border-[#C5DAC9]" 
                  : "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
              } font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5`}>
                <GraduationCap size={13} />
                <span>Cambridge • Edexcel • SAT</span>
              </span>
            </div>

            {/* Grid of study accelerators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigateTab("countdown")}
                className={`p-4 ${
                  isLight 
                    ? "bg-[#F7F6F2] hover:bg-[#F0EEE8] border border-[#E3E0D8] hover:border-[#C96F55]/30" 
                    : "bg-[#120E22] hover:bg-[#1A1432] border border-white/10 hover:border-[#8B5CF6]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                } rounded-2xl text-left transition group cursor-pointer flex items-start gap-3.5`}
              >
                <div className={`w-10 h-10 rounded-xl ${isLight ? "bg-[#C96F55]/20 border border-[#C96F55]/30 text-[#C96F55]" : "bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C084FC]"} flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
                  <CalendarClock size={18} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    isLight ? "text-[#1D1D1B] group-hover:text-[#C96F55]" : "text-white group-hover:text-[#C084FC]"
                  } transition`}>Exam Countdown</h4>
                  <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} mt-1 leading-snug`}>
                    Live countdowns, season timeline, study buddies & leaderboard.
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab("scholar")}
                className={`p-4 ${
                  isLight 
                    ? "bg-[#F7F6F2] hover:bg-[#F0EEE8] border border-[#E3E0D8] hover:border-[#C96F55]/30" 
                    : "bg-[#120E22] hover:bg-[#1A1432] border border-white/10 hover:border-[#8B5CF6]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                } rounded-2xl text-left transition group cursor-pointer flex items-start gap-3.5`}
              >
                <div className={`w-10 h-10 rounded-xl ${isLight ? "bg-[#C96F55]/20 border border-[#C96F55]/30 text-[#C96F55]" : "bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C084FC]"} flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
                  <Brain size={18} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    isLight ? "text-[#1D1D1B] group-hover:text-[#C96F55]" : "text-white group-hover:text-[#C084FC]"
                  } transition`}>AI Tutor</h4>
                  <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} mt-1 leading-snug`}>
                    Instant step-by-step tutoring powered by Google Gemini, syllabus mastery & model answers.
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigateTab("matrix")}
                className={`p-4 ${
                  isLight 
                    ? "bg-[#F7F6F2] hover:bg-[#F0EEE8] border border-[#E3E0D8] hover:border-[#C96F55]/30" 
                    : "bg-[#120E22] hover:bg-[#1A1432] border border-white/10 hover:border-[#8B5CF6]/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                } rounded-2xl text-left transition group cursor-pointer flex items-start gap-3.5`}
              >
                <div className={`w-10 h-10 rounded-xl ${isLight ? "bg-[#C96F55]/20 border border-[#C96F55]/30 text-[#C96F55]" : "bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C084FC]"} flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    isLight ? "text-[#1D1D1B] group-hover:text-[#C96F55]" : "text-white group-hover:text-[#C084FC]"
                  } transition`}>Syllabus Breakdown</h4>
                  <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} mt-1 leading-snug`}>
                    Add exam targets, calculate study time with AI & track assignment deadlines.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
            isLight ? "border-[#E3E0D8] text-[#77736B]" : "border-white/10 text-[#C4B5FD]/75"
          } text-[10px] font-mono`}>
            <span className="flex items-center gap-1.5">
              <Zap size={11} className={isLight ? "text-[#C96F55]" : "text-[#8B5CF6]"} />
              <span>Target: 2 hours of deliberate revision daily</span>
            </span>
            <button 
              onClick={() => onNavigateTab("scholar")}
              className={`${isLight ? "text-[#C96F55] hover:text-[#D98A73]" : "text-[#C084FC] hover:text-white"} font-bold transition cursor-pointer flex items-center gap-1`}
            >
              <span>Open AI Tutor</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

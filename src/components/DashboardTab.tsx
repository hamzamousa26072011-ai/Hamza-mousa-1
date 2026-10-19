import React, { useState, useMemo } from "react";
import { 
  Flame, 
  ArrowRight, 
  Play, 
  Pause,
  RotateCcw,
  Clock, 
  BookOpen, 
  CheckCircle2,
  Plus,
  Trash2,
  CalendarClock,
  CalendarCheck,
  Timer,
  Compass,
  Check,
  X
} from "lucide-react";
import { Task, ExamItem, HabitItem, HabitDayLog } from "../types";
import { FlipClockTimer } from "./FlipClockTimer";

interface DashboardTabProps {
  tasks: Task[];
  onAddTask?: (newTask: Omit<Task, "id" | "completed">) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  subjects?: string[];
  exams?: ExamItem[];
  habits?: HabitItem[];
  habitLogs?: Record<string, HabitDayLog>;
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
  currentUser?: any;
}

export default function DashboardTab({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  subjects = ["Mathematics", "Physics", "Chemistry", "English"],
  exams = [],
  habits = [],
  habitLogs = {},
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
  themeMode = "dark"
}: DashboardTabProps) {
  const isLight = themeMode === "light";

  // Quick Task Creation State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState(subjects[0] || "General Study");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("Scheduled");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Formatted Today Date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }, []);

  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Task progress calculations (never show 0/0 = 0% as a measured score)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

  // Next upcoming exam from real user exam list
  const nextUpcomingExam = useMemo(() => {
    const nowMs = Date.now();
    const upcoming = exams
      .map((ex) => {
        const target = new Date(`${ex.examDate}T${ex.examTime || "09:00"}:00`).getTime();
        const diffMs = target - nowMs;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { exam: ex, target, diffMs, days, hours };
      })
      .filter((item) => !isNaN(item.target) && item.diffMs > 0)
      .sort((a, b) => {
        if (a.exam.isPinned && !b.exam.isPinned) return -1;
        if (!a.exam.isPinned && b.exam.isPinned) return 1;
        return a.target - b.target;
      });
    return upcoming[0] || null;
  }, [exams]);

  // Today's habit completion count from real user habit logs
  const todayHabitsSummary = useMemo(() => {
    const total = habits.length;
    if (total === 0) return { completed: 0, total: 0 };
    const log = habitLogs[todayYMD];
    let completed = 0;
    if (log?.completedHabits) {
      habits.forEach((h) => {
        if (log.completedHabits[h.id]) completed++;
      });
    }
    return { completed, total };
  }, [habits, habitLogs, todayYMD]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !onAddTask) return;
    onAddTask({
      title: taskTitle.trim(),
      subject: taskSubject || "General Study",
      examDate: taskDueDate || todayYMD,
      dueDate: taskDueDate || undefined,
      priority: taskPriority,
      details: ""
    });
    setTaskTitle("");
    setTaskDueDate("");
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. TODAY HEADER: Concise greeting, date, and truthful summary metrics */}
      <section
        aria-label="Today summary"
        className={`rounded-2xl border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
          isLight
            ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
            : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
        }`}
      >
        <div className="space-y-1">
          <p className={`text-xs font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            {todayFormatted}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Today&apos;s Workspace
          </h1>
          <p className={`text-sm ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
            {pendingTasks.length > 0
              ? `You have ${pendingTasks.length} pending ${pendingTasks.length === 1 ? "task" : "tasks"} to focus on today.`
              : nextUpcomingExam
              ? `Next exam: ${nextUpcomingExam.exam.title} in ${nextUpcomingExam.days}d ${nextUpcomingExam.hours}h.`
              : "Plan your study tasks, track upcoming exams, or start a timed focus session."}
          </p>
        </div>

        {/* Truthful Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#283040]"
            }`}
          >
            <Flame size={18} className="text-amber-500 shrink-0" />
            <div>
              <span className={`block text-[11px] font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Study Streak
              </span>
              <span className="text-sm font-bold font-mono tabular-nums">
                {streak} {streak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>

          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#283040]"
            }`}
          >
            <Clock size={18} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
            <div>
              <span className={`block text-[11px] font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Focus Sessions
              </span>
              <span className="text-sm font-bold font-mono tabular-nums">
                {pomodoroCount} completed
              </span>
            </div>
          </div>

          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#283040]"
            }`}
          >
            <CalendarCheck size={18} className={isLight ? "text-[#15803D]" : "text-[#34D399]"} />
            <div>
              <span className={`block text-[11px] font-medium ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Today&apos;s Habits
              </span>
              <span className="text-sm font-bold font-mono tabular-nums">
                {todayHabitsSummary.total > 0
                  ? `${todayHabitsSummary.completed} / ${todayHabitsSummary.total}`
                  : "None set"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRIMARY WORKSPACE GRID: Today's Tasks (7 cols) + Focus Session Timer (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (7 cols): TODAY'S TASKS */}
        <section
          aria-label="Today's study tasks"
          className={`lg:col-span-7 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-5 ${
            isLight
              ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
              : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
          }`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Today&apos;s Tasks</h2>
                <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  {totalTasks > 0
                    ? `${completedTasks} of ${totalTasks} completed (${completionPct}%)`
                    : "Break your study plan into clear, manageable tasks"}
                </p>
              </div>

              {onAddTask && !isAddingTask && (
                <button
                  type="button"
                  onClick={() => setIsAddingTask(true)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] ${
                    isLight
                      ? "bg-[#5F55C8] hover:bg-[#4E45B0] text-white"
                      : "bg-[#6D5DF6] hover:bg-[#5B4BE8] text-white"
                  }`}
                >
                  <Plus size={15} />
                  <span>Add Task</span>
                </button>
              )}
            </div>

            {/* Progress Bar (Only rendered when there is at least 1 task) */}
            {totalTasks > 0 && completionPct !== null && (
              <div className="space-y-1.5">
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isLight ? "bg-[#F0F2F7]" : "bg-[#222938]"
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      completionPct === 100
                        ? "bg-[#15803D] dark:bg-[#34D399]"
                        : isLight
                        ? "bg-[#5F55C8]"
                        : "bg-[#6D5DF6]"
                    }`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Inline Add Task Form */}
            {isAddingTask && onAddTask && (
              <form
                onSubmit={handleCreateTask}
                className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#222938] border-[#364054]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">New Study Task</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    aria-label="Cancel adding task"
                    className={`p-1 rounded-lg cursor-pointer ${
                      isLight ? "text-[#596474] hover:text-[#18202B]" : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                    }`}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div>
                  <label htmlFor="dashboard-task-title" className="sr-only">
                    Task title
                  </label>
                  <input
                    id="dashboard-task-title"
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g., Solve Past Paper 4 Variant 2 (Questions 1–5)"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition ${
                      isLight
                        ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#18202B] focus:border-[#5F55C8]"
                        : "bg-[#10131A] border-[#364054] text-[#F1F3F8] focus:border-[#A99BFF]"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                      Subject
                    </label>
                    <select
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                        isLight
                          ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#18202B]"
                          : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                      }`}
                    >
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="General Study">General Study</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                        isLight
                          ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#18202B]"
                          : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                      }`}
                    >
                      <option value="Urgent/High">High priority</option>
                      <option value="Scheduled">Standard</option>
                      <option value="Low">Low priority</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                      Target Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                        isLight
                          ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#18202B]"
                          : "bg-[#10131A] border-[#364054] text-[#F1F3F8]"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                      isLight
                        ? "bg-[#FFFFFF] border-[#CBD2E0] text-[#596474] hover:text-[#18202B]"
                        : "bg-[#191E28] border-[#364054] text-[#B7C0CF] hover:text-[#F1F3F8]"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer ${
                      isLight ? "bg-[#5F55C8] hover:bg-[#4E45B0]" : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                    }`}
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {/* Task List or Useful First-Run Empty State */}
            {tasks.length === 0 ? (
              <div
                className={`p-6 rounded-xl border border-dashed text-center space-y-3 ${
                  isLight
                    ? "bg-[#F6F7FA] border-[#CBD2E0]"
                    : "bg-[#10131A]/60 border-[#364054]"
                }`}
              >
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-sm font-semibold">No study tasks scheduled yet</h3>
                  <p className={`text-xs leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                    Add the specific chapters, past papers, or problem sets you plan to complete today.
                  </p>
                </div>
                {onAddTask && !isAddingTask && (
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      isLight
                        ? "bg-[#5F55C8] hover:bg-[#4E45B0] text-white"
                        : "bg-[#6D5DF6] hover:bg-[#5B4BE8] text-white"
                    }`}
                  >
                    <Plus size={14} />
                    <span>Create your first task</span>
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-inherit max-h-[320px] overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const priorityLabel =
                    task.priority === "Urgent/High"
                      ? "High priority"
                      : task.priority === "Low"
                      ? "Low priority"
                      : "Standard";

                  return (
                    <li
                      key={task.id}
                      className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleTask?.(task.id)}
                          aria-label={
                            task.completed
                              ? `Mark "${task.title}" as incomplete`
                              : `Mark "${task.title}" as completed`
                          }
                          aria-pressed={task.completed}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            task.completed
                              ? isLight
                                ? "bg-[#5F55C8] border-[#5F55C8] text-white"
                                : "bg-[#6D5DF6] border-[#6D5DF6] text-white"
                              : isLight
                              ? "border-[#CBD2E0] hover:border-[#5F55C8] bg-white"
                              : "border-[#364054] hover:border-[#A99BFF] bg-[#10131A]"
                          }`}
                        >
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium leading-snug break-words ${
                              task.completed
                                ? isLight
                                  ? "line-through text-[#768295]"
                                  : "line-through text-[#8592A6]"
                                : isLight
                                ? "text-[#18202B]"
                                : "text-[#F1F3F8]"
                            }`}
                          >
                            {task.title}
                          </p>
                          {/* Unboxed clean metadata with typographic separators */}
                          <div
                            className={`flex flex-wrap items-center gap-1.5 mt-1 text-xs ${
                              isLight ? "text-[#596474]" : "text-[#B7C0CF]"
                            }`}
                          >
                            <span>{task.subject}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                task.priority === "Urgent/High"
                                  ? isLight
                                    ? "text-[#BE123C] font-medium"
                                    : "text-[#FB7185] font-medium"
                                  : ""
                              }
                            >
                              {priorityLabel}
                            </span>
                            {task.dueDate && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono">Due {task.dueDate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {onDeleteTask && (
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete task "${task.title}"`}
                          title="Delete task"
                          className={`p-1.5 rounded-lg opacity-70 group-hover:opacity-100 transition-colors cursor-pointer shrink-0 ${
                            isLight
                              ? "text-[#596474] hover:text-[#BE123C] hover:bg-[#FFF1F2]"
                              : "text-[#B7C0CF] hover:text-[#FB7185] hover:bg-[#FB7185]/10"
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer link to Habit Tracker */}
          <div className="pt-3 border-t border-inherit flex items-center justify-between text-xs">
            <span className={isLight ? "text-[#596474]" : "text-[#B7C0CF]"}>
              {todayHabitsSummary.total > 0
                ? `${todayHabitsSummary.completed} of ${todayHabitsSummary.total} daily habits checked today`
                : "Track recurring daily revision habits"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("habits")}
              id="dashboard-open-habits-btn"
              className={`font-semibold inline-flex items-center gap-1 cursor-pointer ${
                isLight ? "text-[#5F55C8] hover:text-[#4E45B0]" : "text-[#A99BFF] hover:text-white"
              }`}
            >
              <span>Open Habit Tracker</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN (5 cols): COMPACT FOCUS TIMER CARD */}
        <section
          aria-label="Focus session timer"
          className={`lg:col-span-5 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-5 ${
            isLight
              ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
              : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Focus Timer</h2>
              <p className={`text-xs mt-0.5 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                {focusModeActive
                  ? pomodoroMode === "work"
                    ? "Active focus session in progress"
                    : "Break interval in progress"
                  : isPaused
                  ? "Session paused — resume when ready"
                  : `${focusMinutesSelected}-minute study block`}
              </p>
            </div>

            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                focusModeActive
                  ? isLight
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#15803D]"
                    : "bg-[#10B981]/15 border-[#34D399]/30 text-[#34D399]"
                  : isPaused
                  ? isLight
                    ? "bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]"
                    : "bg-[#F59E0B]/15 border-[#FBBF24]/30 text-[#FBBF24]"
                  : isLight
                  ? "bg-[#F6F7FA] border-[#E2E6EF] text-[#596474]"
                  : "bg-[#222938] border-[#283040] text-[#B7C0CF]"
              }`}
            >
              {focusModeActive ? "Running" : isPaused ? "Paused" : "Ready"}
            </span>
          </div>

          {/* Compact, overflow-safe time display */}
          <div
            className={`py-5 px-3 rounded-xl border flex flex-col items-center justify-center overflow-hidden ${
              isLight ? "bg-[#F6F7FA] border-[#E2E6EF]" : "bg-[#10131A] border-[#283040]"
            }`}
          >
            <FlipClockTimer
              timeRemaining={focusTimeRemaining}
              size="sm"
              themeMode={themeMode}
              isPaused={isPaused}
            />
          </div>

          {/* Primary Timer Controls */}
          <div className="flex items-center gap-2.5">
            {focusModeActive ? (
              <button
                type="button"
                onClick={onPauseFocus || onStopFocus}
                id="dashboard-timer-pause-btn"
                className={`flex-1 min-h-[42px] py-2.5 px-4 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  isLight
                    ? "bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                    : "bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 text-[#FBBF24] border-[#FBBF24]/30"
                }`}
              >
                <Pause size={14} fill="currentColor" />
                <span>Pause Session</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartFocus}
                id="dashboard-timer-start-btn"
                className={`flex-1 min-h-[42px] py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  isLight
                    ? "bg-[#5F55C8] hover:bg-[#4E45B0]"
                    : "bg-[#6D5DF6] hover:bg-[#5B4BE8]"
                }`}
              >
                <Play size={14} fill="currentColor" />
                <span>{isPaused ? "Resume Session" : "Start Focus Session"}</span>
              </button>
            )}

            {(isPaused || focusModeActive) && onResetFocus && (
              <button
                type="button"
                onClick={onResetFocus}
                id="dashboard-timer-reset-btn"
                aria-label="Reset timer"
                title="Reset timer"
                className={`min-h-[42px] px-3.5 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                  isLight
                    ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] text-[#596474] hover:text-[#18202B] border-[#E2E6EF]"
                    : "bg-[#222938] hover:bg-[#2A3244] text-[#B7C0CF] hover:text-[#F1F3F8] border-[#283040]"
                }`}
              >
                <RotateCcw size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab("focus")}
              id="dashboard-timer-navigate-btn"
              aria-label="Open full timer settings"
              title="Open full timer view"
              className={`min-h-[42px] px-3.5 rounded-xl border transition-colors flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer ${
                isLight
                  ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] text-[#596474] hover:text-[#18202B] border-[#E2E6EF]"
                  : "bg-[#222938] hover:bg-[#2A3244] text-[#B7C0CF] hover:text-[#F1F3F8] border-[#283040]"
              }`}
            >
              <Timer size={15} />
              <span className="hidden sm:inline">Full Timer</span>
            </button>
          </div>
        </section>
      </div>

      {/* 3. SECONDARY ROW: NEXT UPCOMING EXAM (7 cols) + STUDY TOOLS DIRECTORY (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* NEXT UPCOMING EXAM CARD */}
        <section
          aria-label="Upcoming exam countdown"
          className={`lg:col-span-7 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-4 ${
            isLight
              ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
              : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Upcoming Exam</h2>
              <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                {exams.length > 0
                  ? `${exams.length} ${exams.length === 1 ? "exam" : "exams"} tracked in your schedule`
                  : "Add your exam dates to track remaining preparation time"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("countdown")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? "bg-[#F6F7FA] hover:bg-[#E8ECF4] border-[#E2E6EF] text-[#18202B]"
                  : "bg-[#222938] hover:bg-[#2A3244] border-[#283040] text-[#F1F3F8]"
              }`}
            >
              <CalendarClock size={14} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
              <span>{exams.length > 0 ? "Manage Exams" : "Add Exam"}</span>
            </button>
          </div>

          {nextUpcomingExam ? (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                nextUpcomingExam.days > 10
                  ? isLight
                    ? "bg-[#ECFDF5]/70 border-[#A7F3D0]"
                    : "bg-[#10B981]/10 border-[#34D399]/30"
                  : nextUpcomingExam.days < 2
                  ? isLight
                    ? "bg-[#FFF1F2] border-[#FECDD3]"
                    : "bg-[#F43F5E]/10 border-[#FB7185]/30"
                  : isLight
                  ? "bg-[#FFFBEB] border-[#FDE68A]"
                  : "bg-[#F59E0B]/10 border-[#FBBF24]/30"
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-semibold ${
                      nextUpcomingExam.days > 10
                        ? isLight
                          ? "text-[#15803D]"
                          : "text-[#34D399]"
                        : nextUpcomingExam.days < 2
                        ? isLight
                          ? "text-[#BE123C]"
                          : "text-[#FB7185]"
                        : isLight
                        ? "text-[#B45309]"
                        : "text-[#FBBF24]"
                    }`}
                  >
                    {nextUpcomingExam.days > 10
                      ? "On track (10+ days)"
                      : nextUpcomingExam.days < 2
                      ? "Urgent (Within 48h)"
                      : "Approaching (2–10 days)"}
                  </span>
                  {nextUpcomingExam.exam.paperCode && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{nextUpcomingExam.exam.paperCode}</span>
                    </>
                  )}
                  {nextUpcomingExam.exam.targetGrade && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Target: {nextUpcomingExam.exam.targetGrade}</span>
                    </>
                  )}
                </div>

                <h3 className="text-base font-bold truncate">{nextUpcomingExam.exam.title}</h3>
                <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  {nextUpcomingExam.exam.examDate} at {nextUpcomingExam.exam.examTime || "09:00"}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                <div className="text-right">
                  <span className="text-2xl font-bold block leading-none">
                    {nextUpcomingExam.days}d {nextUpcomingExam.hours}h
                  </span>
                  <span className={`text-[11px] ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                    remaining
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-5 rounded-xl border border-dashed text-center space-y-2 ${
                isLight ? "bg-[#F6F7FA] border-[#CBD2E0]" : "bg-[#10131A]/60 border-[#364054]"
              }`}
            >
              <p className="text-sm font-medium">No upcoming exams configured</p>
              <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                Add your paper dates to see live countdowns and organize your revision schedule.
              </p>
            </div>
          )}
        </section>

        {/* STUDY WORKSPACE SHORTCUTS */}
        <section
          aria-label="Study tools"
          className={`lg:col-span-5 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-4 ${
            isLight
              ? "bg-[#FFFFFF] border-[#E2E6EF] text-[#18202B]"
              : "bg-[#191E28] border-[#283040] text-[#F1F3F8]"
          }`}
        >
          <div>
            <h2 className="text-lg font-bold tracking-tight">Study Tools</h2>
            <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              Direct access to your revision resources
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab("scholar")}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                isLight
                  ? "bg-[#F6F7FA] hover:bg-[#F0EEFF] border-[#E2E6EF] hover:border-[#D8D3F8]"
                  : "bg-[#222938] hover:bg-[#2A3244] border-[#283040] hover:border-[#6D5DF6]/40"
              }`}
            >
              <BookOpen size={18} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
              <div>
                <h3 className="text-xs font-bold">AI Tutor</h3>
                <p className={`text-[11px] mt-0.5 leading-snug ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  Upload past papers or ask step-by-step subject questions
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("apps")}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                isLight
                  ? "bg-[#F6F7FA] hover:bg-[#F0EEFF] border-[#E2E6EF] hover:border-[#D8D3F8]"
                  : "bg-[#222938] hover:bg-[#2A3244] border-[#283040] hover:border-[#6D5DF6]/40"
              }`}
            >
              <Compass size={18} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
              <div>
                <h3 className="text-xs font-bold">Study Apps</h3>
                <p className={`text-[11px] mt-0.5 leading-snug ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                  Launch Desmos, Khan Academy, Quizlet & custom links
                </p>
              </div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

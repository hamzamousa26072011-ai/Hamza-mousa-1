import React, { useState } from "react";
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  Calendar, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Lightbulb, 
  X, 
  Gauge, 
  GraduationCap, 
  ExternalLink, 
  LogOut, 
  Check, 
  Loader2, 
  LogIn,
  CheckCircle2,
  ListTodo,
  CheckSquare
} from "lucide-react";
import { Task } from "../types";
import { User } from "firebase/auth";

const formatTimeBySettings = (timeStr: string | undefined, timeSystem: "12" | "24") => {
  if (!timeStr) return "";
  if (timeSystem === "24") return timeStr;
  
  try {
    const [hoursStr, minutesStr] = timeStr.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || "00";
    if (isNaN(hours)) return timeStr;
    
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

interface TaskMatrixTabProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "completed">) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteAllTasks: () => void;
  onRefreshTaskAi: (id: string) => void;
  subjects: string[];
  onAddSubject: (subject: string) => void;
  onDeleteSubject: (subject: string) => void;
  timeSystem: "12" | "24";
  currentUser?: any;
  onLogin?: () => void;
  themeMode?: "light" | "dark";
}

export default function TaskMatrixTab({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onDeleteAllTasks,
  onRefreshTaskAi,
  subjects,
  onAddSubject,
  onDeleteSubject,
  timeSystem,
  currentUser,
  onLogin,
  themeMode = "light"
}: TaskMatrixTabProps) {
  
  const isLight = themeMode === "light";
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isTaskOverdue = (task: Task) => {
    if (task.completed) return false;
    const todayStr = new Date().toISOString().split("T")[0];
    if (task.dueDate && task.dueDate !== "") {
      return task.dueDate < todayStr;
    }
    if (task.examDate && task.examDate !== "") {
      const match = task.examDate.match(/^\d{4}-\d{2}-\d{2}/);
      if (match) {
        return match[0] < todayStr;
      }
    }
    return false;
  };

  // Form states
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(subjects[0] || "General");
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [dueTime, setDueTime] = useState("18:00");
  const [details, setDetails] = useState("");
  const [useAutoPriority, setUseAutoPriority] = useState(true);
  const [priority, setPriority] = useState("Urgent/High");
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>("All");

  const calculateAutoPriority = (selectedDueDate: string, selectedDueTime?: string): string => {
    if (!selectedDueDate) return "Scheduled";
    try {
      const now = new Date();
      let dueDateTime: Date;
      if (selectedDueTime) {
        dueDateTime = new Date(`${selectedDueDate}T${selectedDueTime}`);
      } else {
        dueDateTime = new Date(`${selectedDueDate}T23:59:59`);
      }
      
      const diffMs = dueDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours <= 24) {
        return "Urgent/High";
      } else if (diffHours <= 72) {
        return "Scheduled";
      } else {
        return "Casual";
      }
    } catch (e) {
      return "Scheduled";
    }
  };

  React.useEffect(() => {
    if (useAutoPriority) {
      const autoP = calculateAutoPriority(dueDate, dueTime);
      setPriority(autoP);
    }
  }, [dueDate, dueTime, useAutoPriority]);

  const getAutoPriorityExplanation = (): string => {
    if (!dueDate) return "Select a date to preview calculated priority level.";
    try {
      const now = new Date();
      let dueDateTime: Date;
      if (dueTime) {
        dueDateTime = new Date(`${dueDate}T${dueTime}`);
      } else {
        dueDateTime = new Date(`${dueDate}T23:59:59`);
      }
      const diffHours = Math.round((dueDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 0) {
        return `⚠️ Overdue by ${Math.abs(diffHours)} hours — automatically set to Urgent/High.`;
      } else if (diffHours <= 24) {
        return `⚡ Due in ${diffHours} hour(s) (under 24h) — automatically set to Urgent/High.`;
      } else if (diffHours <= 72) {
        return `📅 Due in ${diffHours} hour(s) (1 to 3 days) — automatically set to Scheduled.`;
      } else {
        const days = Math.round(diffHours / 24);
        return `🌿 Due in ${days} days (over 3 days away) — automatically set to Casual.`;
      }
    } catch (e) {
      return "Calculated based on deadline delta.";
    }
  };

  const allSubjects = Array.from(new Set([
    ...subjects,
    ...tasks.map(t => t.subject).filter(Boolean)
  ]));
  const dynamicTabs = Array.from(new Set([
    "All",
    ...allSubjects.filter(sub => sub && sub !== "General" && sub !== "General Revision")
  ]));

  const filteredTasks = tasks.filter((t) => {
    if (selectedSubjectTab === "All") return true;
    return t.subject === selectedSubjectTab;
  });

  // Metrics calculations for top stats bar
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const todoCount = tasks.filter(t => !t.completed).length;
  const overdueCount = tasks.filter(t => isTaskOverdue(t)).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      subject: selectedSubjectTab !== "All" ? selectedSubjectTab : "General",
      examDate: dueDate ? `${dueDate} ${dueTime}` : "",
      priority,
      details: details.trim() || "No specific subtopics logged.",
      dueDate,
      dueTime
    });

    setTitle("");
    setDetails("");
    setDueDate(() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    });
    setDueTime("18:00");
    setUseAutoPriority(true);
    setShowAddForm(false);
  };

  const getDifficultyBadge = (diff?: string) => {
    if (!diff) return null;
    if (isLight) {
      switch (diff) {
        case "Hard":
          return "bg-[#F5E2E2] text-[#B85C5C] border border-[#F5E2E2]";
        case "Medium":
          return "bg-[#F4E9D0] text-[#B98A4A] border border-[#F4E9D0]";
        default:
          return "bg-[#E3EEE5] text-[#66856D] border border-[#C5DAC9]";
      }
    }
    switch (diff) {
      case "Hard":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  const getPriorityBadge = (p: string) => {
    if (isLight) {
      switch (p) {
        case "Urgent/High":
          return "bg-[#F5E2E2] text-[#B85C5C] border border-[#F5E2E2]";
        case "Scheduled":
          return "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]";
        default:
          return "bg-[#E3EEE5] text-[#66856D] border border-[#C5DAC9]";
      }
    }
    switch (p) {
      case "Urgent/High":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
      case "Scheduled":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/10";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header matching Screenshot 2 */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${
        isLight ? "border-[#E3E0D8]" : "border-white/5"
      } pb-5`}>
        <div>
          <span className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-indigo-400"} font-bold uppercase tracking-widest`}>
            your tasks
          </span>
          <h1 className={`text-2xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"} mt-1 font-sans`}>
            Your Tasks & Assignments Planner
          </h1>
          <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} max-w-xl`}>
            Stay organized. Prioritize smart. Get things done. 🎯
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto items-center">
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 font-mono">
              {showClearConfirm ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAllTasks();
                      setShowClearConfirm(false);
                    }}
                    className={`py-1.5 px-3 ${
                      isLight ? "bg-[#B85C5C] text-white" : "bg-rose-600 text-white"
                    } rounded-xl text-[10px] font-bold uppercase transition cursor-pointer`}
                  >
                    Confirm Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className={`py-1.5 px-3 ${
                      isLight ? "bg-[#F0EEE8] text-[#1D1D1B] border border-[#E3E0D8]" : "bg-white/5 text-slate-300 border border-white/5"
                    } rounded-xl text-[10px] font-bold uppercase transition cursor-pointer`}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className={`py-2 px-3 ${
                    isLight ? "bg-[#F5E2E2] hover:bg-[#EAC8C8] text-[#B85C5C] border border-[#F5E2E2]" : "bg-rose-950/20 hover:bg-rose-900/35 text-rose-400 border border-rose-500/15"
                  } rounded-xl text-xs font-bold uppercase transition cursor-pointer flex items-center justify-center gap-1.5`}
                  title="Delete all tasks in your workspace"
                >
                  <Trash2 size={13} />
                  <span>Clear All Tasks</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            id="task-toggle-form-btn"
            className={`py-2 px-4 ${
              isLight 
                ? "bg-[#C96F55] hover:bg-[#B85F48] text-white shadow-xs" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white glow-indigo"
            } rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2`}
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}
            <span>{showAddForm ? "Close Form" : "Create Task"}</span>
          </button>
        </div>
      </div>

      {/* Top Banner Row: Academic Overview & 4 Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Academic Tasks Overview Card */}
        <div className={`lg:col-span-6 p-4 ${
          isLight 
            ? "bg-[#FFFFFF] border border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" 
            : "bg-[#140E26] border border-[#2C1F4A] text-[#FAF8F5] shadow-lg"
        } rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${
              isLight ? "bg-[#FFF1EC] border border-[#E8D7C9] text-[#C96F55]" : "bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C084FC]"
            } flex items-center justify-center shrink-0`}>
              <CheckSquare size={20} />
            </div>
            <div>
              <h3 className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"} flex items-center gap-2`}>
                <span>Academic Task Planner</span>
                <span className={`text-[9px] font-mono ${
                  isLight ? "text-[#C96F55] bg-[#FFF1EC] border border-[#E8D7C9]" : "text-[#C084FC] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30"
                } px-2 py-0.5 rounded-full uppercase font-black tracking-widest`}>
                  {completedCount}/{totalCount} Completed
                </span>
              </h3>
              <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>
                Auto-calculated study deadlines, syllabus weighting & smart priority recommendations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className={`py-1.5 px-3.5 ${
                isLight
                  ? "bg-[#C96F55] hover:bg-[#B85F48] text-white"
                  : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              } rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 transition`}
            >
              <Plus size={12} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className={`lg:col-span-6 p-4 ${
          isLight 
            ? "bg-[#FFFFFF] border border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" 
            : "bg-[#140E26] border border-[#2C1F4A] text-[#FAF8F5] shadow-lg"
        } rounded-2xl grid grid-cols-4 gap-2 text-center`}>
          <div className="flex flex-col items-center justify-center p-1">
            <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"}`}>Total</span>
            <span className={`text-base font-black ${isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"}`}>{totalCount}</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-1 border-l ${isLight ? "border-[#E3E0D8]" : "border-[#2C1F4A]"}`}>
            <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-[#66856D]" : "text-emerald-400"}`}>Done</span>
            <span className={`text-base font-black ${isLight ? "text-[#66856D]" : "text-emerald-400"}`}>{completedCount}</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-1 border-l ${isLight ? "border-[#E3E0D8]" : "border-[#2C1F4A]"}`}>
            <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-[#C96F55]" : "text-[#C084FC]"}`}>To Do</span>
            <span className={`text-base font-black ${isLight ? "text-[#C96F55]" : "text-[#C084FC]"}`}>{todoCount}</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-1 border-l ${isLight ? "border-[#E3E0D8]" : "border-[#2C1F4A]"}`}>
            <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-[#B85C5C]" : "text-rose-400"}`}>Overdue</span>
            <span className={`text-base font-black ${isLight ? "text-[#B85C5C]" : "text-rose-400"}`}>{overdueCount}</span>
          </div>
        </div>

      </div>

      {/* Master Horizontal Subject/Sync Tabs */}
      <div className={`flex items-center gap-1.5 overflow-x-auto pb-2 border-b ${
        isLight ? "border-[#E3E0D8]" : "border-white/5"
      } scrollbar-thin`}>
        {dynamicTabs.map((tab) => {
          const isActive = selectedSubjectTab === tab;
          const taskCount = tasks.filter(t => !t.completed && (
            tab === "All" ? true : t.subject === tab
          )).length;

          let IconComp = GraduationCap;
          let activeStyleClass = isLight 
            ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" 
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
          let inactiveStyleClass = isLight
            ? "border-[#E3E0D8] bg-[#FFFFFF] text-[#77736B] hover:text-[#1D1D1B] hover:bg-[#F0EEE8]"
            : "border-transparent text-slate-400 hover:text-white hover:bg-white/5";

          if (tab === "All") {
            IconComp = Calendar;
            activeStyleClass = isLight 
              ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" 
              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
          }

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedSubjectTab(tab)}
              className={`py-2 px-3.5 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                isActive ? activeStyleClass : inactiveStyleClass
              }`}
            >
              <IconComp size={13} />
              <span>{tab}</span>
              {taskCount > 0 && (
                <span className={`text-[9px] rounded-md px-1.5 py-0.2 font-black font-sans ${
                  isActive 
                    ? isLight ? "bg-[#C96F55]/20 text-[#C96F55]" : "bg-indigo-400/20 text-indigo-400"
                    : isLight ? "bg-[#F0EEE8] text-[#77736B]" : "bg-white/5 text-slate-400"
                }`}>
                  {taskCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task Creation Form Frame */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className={`p-6 ${
          isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] text-[#1D1D1B] shadow-sm" : "bg-[#0A0714]/85 border border-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        } rounded-2xl relative space-y-4`}>
          {!isLight && <div className="absolute top-0 right-0 w-48 h-48 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />}
          
          <h3 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} font-mono tracking-wider uppercase flex items-center gap-2`}>
            <Sparkles size={16} className={isLight ? "text-[#C96F55]" : "text-[#A855F7]"} />
            <span>New Academic Action</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Title */}
            <div className="md:col-span-2">
              <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase tracking-widest block font-bold`}>
                Task / Assignment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Review Paper 42 Electromagnetic force question..."
                className={`w-full mt-1.5 px-4 py-2 ${
                  isLight 
                    ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#1D1D1B] placeholder-[#9B9890] focus:border-[#C96F55]" 
                    : "bg-[#120E22] border border-white/10 text-white placeholder-[#8B82A8] focus:border-[#8B5CF6]"
                } rounded-xl text-xs transition shadow-inner focus:outline-none`}
                required
              />
            </div>

            {/* Due Date */}
            <div>
              <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase tracking-widest block font-bold`}>
                Due Date of Task
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full mt-1.5 px-4 py-2 ${
                  isLight 
                    ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55]" 
                    : "bg-[#120E22] border border-white/10 text-white focus:border-[#8B5CF6]"
                } rounded-xl text-xs transition cursor-pointer focus:outline-none`}
                required
              />
            </div>

            {/* Due Time */}
            <div>
              <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} uppercase tracking-widest block font-bold`}>
                Due Time of Task ({timeSystem === "12" ? "12h Format" : "24h Format"})
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={`w-full mt-1.5 px-4 py-2 ${
                  isLight 
                    ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55]" 
                    : "bg-[#120E22] border border-white/10 text-white focus:border-[#8B5CF6]"
                } rounded-xl text-xs transition cursor-pointer focus:outline-none`}
                required
              />
            </div>

            {/* Priority Indicator */}
            <div className={`md:col-span-2 ${
              isLight ? "bg-[#F7F6F2] border border-[#E3E0D8]" : "bg-[#120E22] border border-white/10"
            } p-4 rounded-xl space-y-3.5`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className={`text-[10px] font-mono ${isLight ? "text-[#1D1D1B]" : "text-[#FAF8F5]"} uppercase tracking-widest font-black`}>
                    Priority Assignment Mode
                  </h4>
                  <p className={`text-[9px] ${isLight ? "text-[#77736B]" : "text-[#B8AFA6]"} leading-relaxed max-w-lg`}>
                    Automatically determine priority based on your selected due date/time, or choose manual override.
                  </p>
                </div>

                <div className={`flex border ${isLight ? "border-[#E3E0D8] bg-[#FFFFFF]" : "border-white/10 bg-[#0A0714]"} p-1 rounded-xl shrink-0`}>
                  <button
                    type="button"
                    onClick={() => setUseAutoPriority(true)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition ${
                      useAutoPriority 
                        ? (isLight ? "bg-[#C96F55] font-extrabold text-white" : "bg-[#7C3AED] font-extrabold text-white shadow-xs")
                        : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-[#C4B5FD]/75 hover:text-white"
                    }`}
                  >
                    ⚡ Auto Due-Based
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseAutoPriority(false)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition ${
                      !useAutoPriority 
                        ? (isLight ? "bg-[#C96F55] font-extrabold text-white" : "bg-[#7C3AED] font-extrabold text-white shadow-xs")
                        : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-[#C4B5FD]/75 hover:text-white"
                    }`}
                  >
                    Custom Override
                  </button>
                </div>
              </div>

              {useAutoPriority ? (
                <div className={`p-2.5 ${
                  isLight ? "bg-[#FFF1EC] border border-[#E8D7C9] text-[#C96F55]" : "bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C084FC]"
                } rounded-lg text-xs font-mono flex items-center gap-2`}>
                  <span className={`w-2 h-2 rounded-full ${isLight ? "bg-[#C96F55]" : "bg-[#8B5CF6]"} animate-ping shrink-0`} />
                  <span className="font-semibold">{getAutoPriorityExplanation()}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  {["Urgent/High", "Scheduled", "Casual"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition ${
                        priority === lvl 
                          ? isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" : "bg-[#8B5CF6]/25 border-[#8B5CF6]/50 text-[#E9D5FF]"
                          : isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#77736B]" : "bg-[#120E22] border-white/10 text-[#C4B5FD]/75"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-[#B8AFA6]"} uppercase tracking-widest block font-bold`}>
              Syllabus Details (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Focus on electromagnetic direction rules and formula substitution..."
              className={`w-full mt-1.5 px-4 py-3 ${
                isLight 
                  ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#1D1D1B] placeholder-[#9B9890] focus:border-[#C96F55]" 
                  : "bg-[#120E22] border border-white/10 text-white placeholder-[#8B82A8] focus:border-[#8B5CF6]"
              } rounded-xl text-xs transition h-20 focus:outline-none`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              id="task-form-submit-btn"
              className={`py-2.5 px-6 ${isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/25"} text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs`}
            >
              <Sparkles size={14} />
              <span>Prioritize with AI</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Task List Space */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className={`p-14 text-center border-2 border-dashed ${
            isLight ? "border-[#E3E0D8] bg-[#FFFFFF]" : "border-white/10 bg-[#0A0714]/70"
          } rounded-3xl`}>
            <Sparkles size={36} className={`mx-auto ${isLight ? "text-[#C96F55]" : "text-[#A855F7]"}`} />
            <h3 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} mt-4 font-mono uppercase`}>
              Your Matrix is Spotless
            </h3>
            <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#C4B5FD]/75"} mt-1 max-w-xs mx-auto leading-relaxed`}>
              Unlock outstanding productivity scores by adding assignments.
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className={`p-12 text-center border border-dashed ${
            isLight ? "border-[#E3E0D8] bg-[#FFFFFF]" : "border-white/10 bg-[#0A0714]/50"
          } rounded-3xl space-y-3`}>
            <Sparkles size={24} className={`mx-auto ${isLight ? "text-[#9B9890]" : "text-[#8B82A8]"}`} />
            <h3 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} font-mono uppercase`}>
              No tasks for this subject
            </h3>
            <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-[#8B82A8]"} max-w-xs mx-auto`}>
              You do not have any assignments logged under "{selectedSubjectTab}" yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => {
              const isOverdue = isTaskOverdue(task);
              return (
                <div 
                  key={task.id}
                  className={`p-5 rounded-2xl border transition duration-200 relative group flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    task.completed 
                      ? isLight
                        ? "bg-[#FFFFFF] border-[#C5DAC9] opacity-75"
                        : "bg-[#0A0714]/80 border-emerald-500/25 opacity-80" 
                      : isOverdue
                        ? isLight
                          ? "bg-[#FFFFFF] border-[#F5E2E2] shadow-2xs"
                          : "bg-[#0A0714]/90 border-rose-500/35 shadow-lg shadow-rose-950/20"
                        : isLight
                          ? "bg-[#FFFFFF] border-[#E3E0D8] shadow-2xs hover:border-[#C96F55]/40"
                          : "bg-[#0A0714]/85 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#8B5CF6]/50 backdrop-blur-md"
                  }`}
                >
                  {/* Active left neon line */}
                  <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-md ${
                    task.completed 
                      ? isLight ? "bg-[#66856D]" : "bg-emerald-500" 
                      : isOverdue
                        ? isLight ? "bg-[#B85C5C]" : "bg-rose-500" 
                        : "bg-[#C96F55]"
                  }`} />

                  {/* Left block information */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        id={`task-toggle-btn-${task.id}`}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 ${
                          task.completed 
                            ? isLight ? "bg-[#E3EEE5] border-[#C5DAC9] text-[#66856D]" : "bg-emerald-500/20 border-emerald-400 text-emerald-400" 
                            : isOverdue
                              ? isLight ? "border-[#B85C5C] hover:border-[#B85C5C] text-transparent" : "border-rose-550 hover:border-rose-400 text-transparent"
                              : isLight ? "border-[#E3E0D8] hover:border-[#C96F55] text-transparent" : "border-white/20 hover:border-indigo-400 text-transparent"
                        }`}
                      >
                        <CheckCircle size={12} fill="currentColor" />
                      </button>

                      <h3 className={`text-sm md:text-md font-bold ${
                        isLight ? "text-[#1D1D1B]" : "text-slate-100"
                      } flex flex-wrap items-center gap-2 ${
                        task.completed ? isLight ? "line-through text-[#9B9890]" : "line-through text-emerald-300/60" : ""
                      }`}>
                        <span>{task.title}</span>
                        {isOverdue && (
                          <span className={`text-[9px] font-mono ${
                            isLight ? "text-[#B85C5C] bg-[#F5E2E2] border border-[#F5E2E2]" : "text-rose-450 bg-rose-550/10 border border-rose-500/15"
                          } px-2 py-0.5 rounded-full uppercase font-black tracking-wider`}>
                            Overdue
                          </span>
                        )}
                        {task.completed && (
                          <span className={`text-[9px] font-mono ${
                            isLight ? "text-[#66856D] bg-[#E3EEE5] border border-[#C5DAC9]" : "text-emerald-400 bg-emerald-550/15 border border-emerald-555/15"
                          } px-2 py-0.5 rounded-full uppercase font-black tracking-wider`}>
                            Completed
                          </span>
                        )}
                      </h3>
                    </div>

                    <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} leading-normal font-medium max-w-2xl pl-8`}>
                      {task.details}
                    </p>

                    {/* Badges Line */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 pl-8">
                      <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded-lg ${getPriorityBadge(task.priority)}`}>
                        {task.priority.replace("/High", "")}
                      </span>
                      
                      {task.estimatedMinutes && (
                        <span className={`text-[9px] font-mono ${
                          isLight ? "text-[#77736B] bg-[#F0EEE8] border border-[#E3E0D8]" : "text-indigo-400 bg-indigo-950/40 border border-indigo-900/40"
                        } px-2.5 py-0.5 rounded-lg flex items-center gap-1`}>
                          <Clock size={10} />
                          <span>Estimate: {task.estimatedMinutes} mins</span>
                        </span>
                      )}

                      {task.difficulty && (
                        <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${getDifficultyBadge(task.difficulty)}`}>
                          <Gauge size={10} />
                          <span>Difficulty: {task.difficulty}</span>
                        </span>
                      )}

                      {task.dueDate && task.dueDate !== "" ? (
                        <span className={`text-[9px] font-mono ${
                          isLight ? "text-[#C96F55] bg-[#FFF1EC] border border-[#E8D7C9]" : "text-[#818CF8] bg-indigo-500/10 border border-indigo-500/20"
                        } px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold`}>
                          <Clock size={10} className={isLight ? "text-[#C96F55]" : "text-[#818CF8]"} />
                          <span>Due: {task.dueDate} {task.dueTime && `@ ${formatTimeBySettings(task.dueTime, timeSystem)}`}</span>
                        </span>
                      ) : task.examDate && task.examDate !== "" ? (
                        <span className={`text-[9px] font-mono ${
                          isLight ? "text-[#77736B] bg-[#F0EEE8]" : "text-slate-400 bg-white/5"
                        } px-2.5 py-0.5 rounded-lg flex items-center gap-1`}>
                          <Calendar size={10} />
                          <span>Due: {task.examDate}</span>
                        </span>
                      ) : null}
                    </div>

                    {/* AI INSIGHT CARD BLOCK */}
                    {!task.completed && (task.aiTip || task.isPrioritizing) && (
                      <div className={`mt-4 p-3.5 ${
                        isLight ? "bg-[#FFF1EC] border border-[#E8D7C9]" : "bg-indigo-950/20 border border-indigo-900/30"
                      } rounded-2xl flex items-start gap-2.5 relative overflow-hidden pl-8`}>
                        <div className={`w-6 h-6 rounded-lg ${
                          isLight ? "bg-[#C96F55]/15 border border-[#C96F55]/25 text-[#C96F55]" : "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
                        } flex items-center justify-center shrink-0`}>
                          <Lightbulb size={12} />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <h5 className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-indigo-400"} uppercase tracking-widest font-black`}>
                            Engez AI Scholar Tip:
                          </h5>
                          {task.isPrioritizing ? (
                            <p className={`text-[10px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} animate-pulse uppercase tracking-wide`}>
                              Computing high-yield guidelines... Hang tight...
                            </p>
                          ) : (
                            <>
                              <p className={`text-xs ${isLight ? "text-[#1D1D1B]" : "text-slate-300"} font-medium leading-relaxed italic pr-4`}>
                                {task.aiTip}
                              </p>
                              {task.aiBreakdown && (
                                <p className={`text-[10px] ${isLight ? "text-[#C96F55]" : "text-indigo-400/80"} font-mono mt-1 font-semibold leading-relaxed`}>
                                  Syllabus Weight: {task.aiBreakdown}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right controls */}
                  <div className="flex md:flex-col items-center gap-2 self-end md:self-auto pl-8 md:pl-0 shrink-0">
                    <button
                      onClick={() => onRefreshTaskAi(task.id)}
                      id={`task-refresh-ai-btn-${task.id}`}
                      className={`p-2 ${
                        isLight ? "bg-[#F0EEE8] hover:bg-[#E8D7C9] text-[#77736B] hover:text-[#1D1D1B]" : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                      } rounded-xl transition cursor-pointer`}
                      title="Refresh AI estimation"
                      disabled={task.isPrioritizing}
                    >
                      <RefreshCw size={14} className={task.isPrioritizing ? "animate-spin" : ""} />
                    </button>
                    
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      id={`task-delete-btn-${task.id}`}
                      className={`p-2 ${
                        isLight ? "bg-[#F5E2E2] hover:bg-[#EAC8C8] text-[#B85C5C] border border-[#F5E2E2]" : "bg-rose-900/10 hover:bg-rose-900/30 text-rose-400 border border-rose-500/15"
                      } rounded-xl transition cursor-pointer`}
                      title="Delete assigned task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

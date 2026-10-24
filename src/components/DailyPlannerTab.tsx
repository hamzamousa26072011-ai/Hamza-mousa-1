import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckSquare, 
  Mic, 
  MicOff, 
  Sparkles, 
  Play, 
  Check, 
  Trash2, 
  Plus, 
  Clock, 
  AlertCircle, 
  Flame, 
  Send, 
  Bot, 
  User as UserIcon, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  ListFilter, 
  CheckCircle2, 
  Sun, 
  Sunset, 
  Moon, 
  Loader2,
  Volume2
} from "lucide-react";
import { PlannerTask, PlannerChatMessage } from "../types";

interface DailyPlannerTabProps {
  themeMode?: "light" | "dark";
  onStartInTimer?: (minutes: number, taskTitle: string) => void;
  currentUser?: any;
}

export default function DailyPlannerTab({
  themeMode = "dark",
  onStartInTimer,
  currentUser
}: DailyPlannerTabProps) {
  const isLight = themeMode === "light";

  // Persistent tasks state
  const [tasks, setTasks] = useState<PlannerTask[]>(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_DAILY_PLANNER_TASKS_V1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (t: PlannerTask) =>
              t.id !== "default_task_1" &&
              t.id !== "default_task_2" &&
              !t.title?.toLowerCase().includes("cambridge math past paper 4") &&
              !t.title?.toLowerCase().includes("biology chapter 5 cell division")
          );
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Task Input State
  const [taskInput, setTaskInput] = useState("");
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [filterSlot, setFilterSlot] = useState<"all" | "Morning" | "Afternoon" | "Evening">("all");

  // Audio Recording State for gemini-3.5-transcribe
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Multi-turn Copilot Chat State
  const [chatMessages, setChatMessages] = useState<PlannerChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_DAILY_PLANNER_CHAT_V1");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: "init_copilot_1",
        role: "assistant",
        content: "Salam! I'm your Engez Daily Planner Copilot. You can speak your tasks into the mic, and I'll transcribe them, prioritize them, and schedule realistic time blocks. How can I help you conquer today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Save tasks to local storage
  useEffect(() => {
    try {
      localStorage.setItem("ENGEZ_DAILY_PLANNER_TASKS_V1", JSON.stringify(tasks));
    } catch (err) {
      console.warn("Could not save daily planner tasks to localStorage:", err);
    }
  }, [tasks]);

  // Save chat to local storage
  useEffect(() => {
    try {
      localStorage.setItem("ENGEZ_DAILY_PLANNER_CHAT_V1", JSON.stringify(chatMessages));
    } catch (err) {
      console.warn("Could not save daily planner chat to localStorage:", err);
    }
  }, [chatMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Audio Recording Functions
  const startRecording = async () => {
    setErrorNotice(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Mic access error:", err);
      setErrorNotice(
        "Microphone access blocked or unavailable. Please enable microphone permissions in your browser or type your tasks directly."
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    clearInterval(recordTimerRef.current);
    setIsRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      // Stop all tracks to release mic hardware
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());

      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size === 0) {
        setErrorNotice("No audio was recorded. Please speak clearly into your microphone.");
        return;
      }

      setIsTranscribing(true);
      setErrorNotice(null);

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(",")[1];
          const response = await fetch("/api/ai/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType
            })
          });

          if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
          }

          const data = await response.json();
          if (data.transcript && data.transcript.trim()) {
            setTaskInput((prev) => {
              const current = prev.trim();
              return current ? `${current}\n${data.transcript.trim()}` : data.transcript.trim();
            });
          } else {
            setErrorNotice("Could not clearly detect speech in the audio. Please try again or type directly.");
          }
          setIsTranscribing(false);
        };
        reader.readAsDataURL(audioBlob);
      } catch (err: any) {
        console.error("Transcription error:", err);
        setErrorNotice("Transcription service encountered a temporary issue. You can type tasks directly.");
        setIsTranscribing(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  // Generate Daily Plan using AI
  const handleGeneratePlan = async () => {
    if (!taskInput.trim()) {
      setErrorNotice("Please enter or speak at least one task to generate your plan.");
      return;
    }

    setIsPlanningLoading(true);
    setErrorNotice(null);

    try {
      const response = await fetch("/api/ai/plan-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: taskInput.trim(),
          currentTasks: tasks
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        setTasks((prev) => [...prev, ...data.tasks]);
        setTaskInput("");

        // Also add assistant message to copilot
        const totalMins = data.tasks.reduce((acc: number, t: any) => acc + (t.estimatedMinutes || 0), 0);
        setChatMessages((prev) => [
          ...prev,
          {
            id: `plan_msg_${Date.now()}`,
            role: "assistant",
            content: `I've added ${data.tasks.length} prioritized tasks to your Daily Planner (total ~${totalMins} minutes). I scheduled your heavy subjects in the morning and prioritized high-impact topics. Click 'Start in Timer' whenever you're ready to lock in!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        setErrorNotice("Failed to parse tasks. Please try rephrasing your input.");
      }
    } catch (err: any) {
      console.error("Plan generator error:", err);
      setErrorNotice("Could not reach AI planner engine. Added task as standard entry.");
      // Fallback add as manual task
      const fallbackTask: PlannerTask = {
        id: `task_${Date.now()}`,
        title: taskInput.trim(),
        priority: "medium",
        estimatedMinutes: 45,
        timeSlot: "Afternoon",
        completed: false,
        notes: "Manually added task.",
        actionSteps: ["Start focused study session", "Review key notes", "Complete target questions"],
        createdAt: new Date().toISOString()
      };
      setTasks((prev) => [...prev, fallbackTask]);
      setTaskInput("");
    } finally {
      setIsPlanningLoading(false);
    }
  };

  // Add a single manual task
  const handleAddManual = () => {
    if (!taskInput.trim()) return;
    const newTask: PlannerTask = {
      id: `task_${Date.now()}`,
      title: taskInput.trim(),
      priority: "medium",
      estimatedMinutes: 30,
      timeSlot: "Morning",
      completed: false,
      notes: "Quick added daily task.",
      actionSteps: ["Focus without distractions", "Complete main objectives"],
      createdAt: new Date().toISOString()
    };
    setTasks((prev) => [...prev, newTask]);
    setTaskInput("");
  };

  // Toggle completion
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Clear completed tasks
  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  // Reset all tasks
  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to clear all tasks for today?")) {
      setTasks([]);
    }
  };

  // Send message to Copilot Chatbot
  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: PlannerChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    if (!presetText) setChatInput("");
    setIsChatLoading(true);

    try {
      const tasksSummary = tasks.length > 0
        ? tasks.map((t) => `• [${t.priority.toUpperCase()}] ${t.title} (${t.estimatedMinutes}m, Slot: ${t.timeSlot}, Status: ${t.completed ? "Done" : "Pending"})`).join("\n")
        : "No tasks scheduled yet.";

      const response = await fetch("/api/ai/planner-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.slice(-8), // Send recent context
          tasksSummary
        })
      });

      if (!response.ok) throw new Error("Failed to chat with planner copilot");

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: data.reply || "I'm here to help you optimize your schedule!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: "I'm having a brief connection hitch. Try prioritizing your highest-impact task first with a 45-minute focus session!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Statistics
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const remainingMinutes = tasks.filter((t) => !t.completed).reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filtered tasks
  const displayedTasks = tasks.filter((t) => {
    if (filterSlot === "all") return true;
    return t.timeSlot === filterSlot;
  });

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isLight
          ? "bg-white border-[#EBE4DC] shadow-sm text-[#1A1614]"
          : "bg-[#101322] border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)] text-white"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${
                isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
              }`}>
                <CheckSquare size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight flex items-center gap-2">
                  <span>Daily Planner</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
                  }`}>
                    مخطط اليوم
                  </span>
                </h1>
                <p className={`text-xs ${isLight ? "text-[#736B63]" : "text-slate-400"} font-sans`}>
                  Speak your tasks, let Gemini prioritize &amp; estimate durations, and conquer your schedule.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={`px-3 py-2 rounded-2xl border text-xs font-sans ${
              isLight ? "bg-[#FAF8F5] border-[#EBE4DC]" : "bg-black/30 border-white/10"
            }`}>
              <span className={`text-[10px] uppercase font-mono block ${isLight ? "text-[#736B63]" : "text-slate-400"}`}>
                Progress
              </span>
              <span className="font-bold font-mono">
                {completedCount} / {tasks.length} Done ({progressPercent}%)
              </span>
            </div>

            <div className={`px-3 py-2 rounded-2xl border text-xs font-sans ${
              isLight ? "bg-[#FAF8F5] border-[#EBE4DC]" : "bg-black/30 border-white/10"
            }`}>
              <span className={`text-[10px] uppercase font-mono block ${isLight ? "text-[#736B63]" : "text-slate-400"}`}>
                Study Time
              </span>
              <span className="font-bold font-mono">
                {formatMins(remainingMinutes)} left of {formatMins(totalMinutes)}
              </span>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className={`px-3 py-2 text-xs font-mono font-bold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? "bg-[#FAF8F5] hover:bg-[#F5EFE9] text-[#736B63] hover:text-[#1A1614] border-[#EBE4DC]"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10"
                }`}
                title="Remove completed items"
              >
                <Check size={13} />
                <span>Clear Done</span>
              </button>
            )}

            {tasks.length > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className={`p-2 text-xs rounded-xl border transition cursor-pointer ${
                  isLight
                    ? "hover:bg-rose-50 text-rose-600 border-rose-200"
                    : "hover:bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
                title="Reset all tasks for today"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="mt-4 w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full ${
                progressPercent === 100 
                  ? "bg-emerald-500" 
                  : isLight ? "bg-[#C25E42]" : "bg-[#8B5CF6]"
              }`}
            />
          </div>
        )}
      </div>

      {/* Main Grid: Left is Input & Tasks, Right is Copilot Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input + Tasks (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">

          {/* AI Task Input Card */}
          <div className={`p-5 rounded-3xl border transition-all ${
            isLight
              ? "bg-white border-[#EBE4DC] shadow-sm"
              : "bg-[#101322] border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isLight ? "text-[#736B63]" : "text-slate-400"
              } flex items-center gap-1.5`}>
                <Sparkles size={14} className={isLight ? "text-[#C25E42]" : "text-[#C084FC]"} />
                <span>Add Tasks with Voice or Text</span>
              </label>

              {/* Live Mic Indicator */}
              {isRecording && (
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-500 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Recording {recordingSeconds}s</span>
                </div>
              )}
            </div>

            {/* Textarea Input */}
            <div className="relative">
              <textarea
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Speak or type your tasks here...&#10;e.g. 'Solve Physics paper 4, review Math chapter 3, 20 mins English vocab'"
                rows={3}
                className={`w-full p-3.5 pr-12 rounded-2xl border text-sm font-sans focus:outline-none transition resize-none ${
                  isLight
                    ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#1A1614] focus:border-[#C25E42] placeholder:text-[#9B9890]"
                    : "bg-[#0C0E18] border-white/10 text-white focus:border-[#8B5CF6] placeholder:text-slate-500"
                }`}
              />

              {/* In-Textarea Mic Button */}
              <div className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isTranscribing || isPlanningLoading}
                    className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                      isLight
                        ? "bg-[#FFF2ED] hover:bg-[#FFE6DC] text-[#C25E42] border border-[#F2D5CA]"
                        : "bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C084FC] border border-[#8B5CF6]/30"
                    } disabled:opacity-50`}
                    title="Speak tasks into mic (AI Audio Transcription)"
                  >
                    <Mic size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md animate-pulse transition cursor-pointer flex items-center justify-center"
                    title="Stop recording and transcribe with Gemini"
                  >
                    <MicOff size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Error / Status notices */}
            {errorNotice && (
              <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-sans flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{errorNotice}</span>
              </div>
            )}

            {isTranscribing && (
              <div className={`mt-2.5 p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                isLight ? "bg-[#FFF2ED] border-[#F2D5CA] text-[#C25E42]" : "bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#C084FC]"
              }`}>
                <Loader2 size={14} className="animate-spin shrink-0" />
                <span>Transcribing your audio with Gemini 3.5...</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
              {/* Preset Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  "Math Revision 45m",
                  "Physics Past Paper 60m",
                  "Biology Flashcards 25m",
                  "Chemistry Quiz 30m"
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setTaskInput((prev) => (prev.trim() ? `${prev.trim()}\n${chip}` : chip));
                    }}
                    className={`text-[11px] font-sans px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      isLight
                        ? "bg-[#FAF8F5] hover:bg-[#F5EFE9] text-[#736B63] hover:text-[#1A1614] border-[#EBE4DC]"
                        : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10"
                    }`}
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddManual}
                  disabled={!taskInput.trim() || isPlanningLoading}
                  className={`px-3 py-2 rounded-xl text-xs font-sans font-semibold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isLight
                      ? "bg-[#FAF8F5] hover:bg-[#F5EFE9] text-[#1A1614] border-[#EBE4DC]"
                      : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                  }`}
                >
                  <Plus size={14} className="inline mr-1" />
                  Quick Add
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={!taskInput.trim() || isPlanningLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-sans font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                    isLight
                      ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[#C25E42]/20"
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-[#8B5CF6]/30"
                  }`}
                >
                  {isPlanningLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Planning with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>AI Prioritize &amp; Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Time Slot Filter Tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
              isLight ? "bg-white border-[#EBE4DC]" : "bg-[#101322] border-white/10"
            }`}>
              {[
                { id: "all", label: "All Tasks", icon: ListFilter },
                { id: "Morning", label: "Morning", icon: Sun },
                { id: "Afternoon", label: "Afternoon", icon: Sunset },
                { id: "Evening", label: "Evening", icon: Moon }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = filterSlot === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterSlot(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? isLight
                          ? "bg-[#C25E42] text-white shadow-xs"
                          : "bg-[#8B5CF6] text-white shadow-xs"
                        : isLight
                        ? "text-[#736B63] hover:text-[#1A1614]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <span className={`text-xs font-mono ${isLight ? "text-[#736B63]" : "text-slate-400"}`}>
              {displayedTasks.length} {displayedTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            <AnimatePresence>
              {displayedTasks.length === 0 ? (
                <div className={`p-8 rounded-3xl border text-center space-y-2 ${
                  isLight ? "bg-white border-[#EBE4DC] text-[#736B63]" : "bg-[#101322] border-white/10 text-slate-400"
                }`}>
                  <CheckCircle2 size={32} className={`mx-auto ${isLight ? "text-[#C25E42]" : "text-[#8B5CF6]"}`} />
                  <h3 className={`text-sm font-bold ${isLight ? "text-[#1A1614]" : "text-white"}`}>
                    No tasks in this section
                  </h3>
                  <p className="text-xs max-w-sm mx-auto font-sans">
                    Use the microphone or input field above to list what you'd like to accomplish today!
                  </p>
                </div>
              ) : (
                displayedTasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id;
                  const priorityColors = {
                    high: isLight 
                      ? "bg-rose-100 text-rose-700 border-rose-200" 
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30",
                    medium: isLight 
                      ? "bg-amber-100 text-amber-800 border-amber-200" 
                      : "bg-amber-500/15 text-amber-300 border-amber-500/30",
                    low: isLight 
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  };

                  const slotIcons = {
                    Morning: Sun,
                    Afternoon: Sunset,
                    Evening: Moon
                  };
                  const SlotIcon = slotIcons[task.timeSlot] || Sun;

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 rounded-2xl border transition-all ${
                        task.completed
                          ? isLight
                            ? "bg-[#FAF8F5]/80 border-[#EBE4DC] opacity-70"
                            : "bg-[#0C0E18]/80 border-white/5 opacity-60"
                          : isLight
                          ? "bg-white border-[#EBE4DC] shadow-xs hover:border-[#D9CFC4]"
                          : "bg-[#101322] border-white/10 hover:border-white/20 shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox + Title */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(task.id)}
                            className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                              task.completed
                                ? isLight
                                  ? "bg-[#C25E42] border-[#C25E42] text-white"
                                  : "bg-[#8B5CF6] border-[#8B5CF6] text-white"
                                : isLight
                                ? "border-[#C5BCB2] hover:border-[#C25E42] bg-[#FAF8F5]"
                                : "border-white/20 hover:border-[#8B5CF6] bg-black/30"
                            }`}
                            title={task.completed ? "Mark incomplete" : "Mark completed"}
                          >
                            {task.completed && <Check size={13} strokeWidth={3} />}
                          </button>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className={`text-sm font-sans font-bold block truncate leading-snug ${
                              task.completed
                                ? "line-through text-[#9B9890] dark:text-slate-500"
                                : isLight ? "text-[#1A1614]" : "text-white"
                            }`}>
                              {task.title}
                            </span>

                            {/* Badges Row */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {/* Priority badge */}
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider ${
                                priorityColors[task.priority]
                              }`}>
                                {task.priority} Priority
                              </span>

                              {/* Duration badge */}
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold flex items-center gap-1 ${
                                isLight
                                  ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#736B63]"
                                  : "bg-white/5 border-white/10 text-slate-300"
                              }`}>
                                <Clock size={11} />
                                <span>{task.estimatedMinutes}m</span>
                              </span>

                              {/* Slot badge */}
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold flex items-center gap-1 ${
                                isLight
                                  ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#736B63]"
                                  : "bg-white/5 border-white/10 text-slate-300"
                              }`}>
                                <SlotIcon size={11} />
                                <span>{task.timeSlot}</span>
                              </span>
                            </div>

                            {/* Short Note */}
                            {task.notes && (
                              <p className={`text-xs ${isLight ? "text-[#736B63]" : "text-slate-400"} font-sans pt-0.5`}>
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions: Start in Timer & Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onStartInTimer && !task.completed && (
                            <button
                              type="button"
                              onClick={() => onStartInTimer(task.estimatedMinutes, task.title)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                                isLight
                                  ? "bg-[#FFF2ED] hover:bg-[#FFE6DC] text-[#C25E42] border border-[#F2D5CA]"
                                  : "bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#C084FC] border border-[#8B5CF6]/40"
                              }`}
                              title="Start this task directly in the Timer tab"
                            >
                              <Play size={11} fill="currentColor" />
                              <span className="hidden sm:inline">Timer</span>
                            </button>
                          )}

                          {task.actionSteps && task.actionSteps.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                isLight
                                  ? "bg-[#FAF8F5] text-[#736B63] hover:text-[#1A1614] border-[#EBE4DC]"
                                  : "bg-white/5 text-slate-400 hover:text-white border-white/10"
                              }`}
                              title={isExpanded ? "Hide action steps" : "View action steps"}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isLight
                                ? "hover:bg-rose-50 text-[#9B9890] hover:text-rose-600 border-transparent hover:border-rose-200"
                                : "hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border-transparent hover:border-rose-500/20"
                            }`}
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Action Steps */}
                      {isExpanded && task.actionSteps && task.actionSteps.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`mt-3 pt-3 border-t text-xs font-sans space-y-1.5 ${
                            isLight ? "border-[#EBE4DC] text-[#554E47]" : "border-white/10 text-slate-300"
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-mono font-bold block ${
                            isLight ? "text-[#736B63]" : "text-slate-400"
                          }`}>
                            AI Execution Steps:
                          </span>
                          <ul className="space-y-1 pl-1">
                            {task.actionSteps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className={`text-[10px] font-mono font-bold mt-0.5 ${
                                  isLight ? "text-[#C25E42]" : "text-[#C084FC]"
                                }`}>
                                  {idx + 1}.
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Multi-turn Gemini Copilot (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
          <div className={`p-5 rounded-3xl border flex-1 flex flex-col transition-all ${
            isLight
              ? "bg-white border-[#EBE4DC] shadow-sm text-[#1A1614]"
              : "bg-[#101322] border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)] text-white"
          }`}>
            {/* Copilot Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC]"
                }`}>
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-sans">
                    Planner Copilot
                  </h3>
                  <span className={`text-[10px] font-mono ${isLight ? "text-[#736B63]" : "text-slate-400"}`}>
                    Powered by Gemini 3.8 Flash
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setChatMessages([
                    {
                      id: `reset_${Date.now()}`,
                      role: "assistant",
                      content: "Chat cleared! How should we plan your next study block?",
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  ]);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLight
                    ? "bg-[#FAF8F5] text-[#736B63] hover:text-[#1A1614] border-[#EBE4DC]"
                    : "bg-white/5 text-slate-400 hover:text-white border-white/10"
                }`}
                title="Clear chat thread"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Scrollable Message Thread */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 max-h-[420px]"
            >
              {chatMessages.map((msg) => {
                const isBot = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}
                  >
                    {isBot && (
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isLight ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/25 text-[#C084FC]"
                      }`}>
                        <Bot size={14} />
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-sans leading-relaxed ${
                      isBot
                        ? isLight
                          ? "bg-[#FAF8F5] border border-[#EBE4DC] text-[#1A1614]"
                          : "bg-white/5 border border-white/10 text-slate-200"
                        : isLight
                        ? "bg-[#C25E42] text-white"
                        : "bg-[#8B5CF6] text-white"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className={`text-[9px] font-mono block mt-1 ${
                        isBot
                          ? isLight ? "text-[#9B9890]" : "text-slate-400"
                          : "text-white/70 text-right"
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {!isBot && (
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isLight ? "bg-[#FAF8F5] text-[#1A1614] border border-[#EBE4DC]" : "bg-white/10 text-white"
                      }`}>
                        <UserIcon size={14} />
                      </div>
                    )}
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pl-2">
                  <Loader2 size={13} className="animate-spin" />
                  <span>Copilot is formulating advice...</span>
                </div>
              )}
            </div>

            {/* Quick Copilot Prompt Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-t border-black/5 dark:border-white/5 pt-2">
              {[
                "How should I structure today?",
                "Feeling tired, what's next?",
                "Give me a 5m break routine"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSendChat(suggestion)}
                  disabled={isChatLoading}
                  className={`text-[10px] font-sans px-2 py-0.5 rounded-lg border transition cursor-pointer truncate max-w-[190px] ${
                    isLight
                      ? "bg-[#FAF8F5] hover:bg-[#F5EFE9] text-[#736B63] hover:text-[#1A1614] border-[#EBE4DC]"
                      : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your planner copilot..."
                className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-sans focus:outline-none transition ${
                  isLight
                    ? "bg-[#FAF8F5] border-[#EBE4DC] text-[#1A1614] focus:border-[#C25E42] placeholder:text-[#9B9890]"
                    : "bg-[#0C0E18] border-white/10 text-white focus:border-[#8B5CF6] placeholder:text-slate-500"
                }`}
              />

              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className={`p-2.5 rounded-xl text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLight
                    ? "bg-[#C25E42] hover:bg-[#B25136]"
                    : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                }`}
                title="Send message"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

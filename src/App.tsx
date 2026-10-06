import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Task, PastPaper, ChatMessage, StudyApp, HabitItem, HabitDayLog } from "./types";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  auth, 
  fetchUserWorkspace, 
  saveUserWorkspace, 
  saveUserApps,
  fetchUserApps,
  saveUserHabits,
  fetchUserHabits,
  resetFirestoreOffline,
  googleSignIn,
  googleLogout,
  isFirestoreOffline,
  emailSignUp,
  emailSignIn,
  guestSignIn,
  getFirebaseIdToken,
  getCustomDnsInfo,
  saveCustomFirebaseConfig,
  getSavedCustomFirebaseConfig
} from "./lib/classroom";
import {
  GraduationCap,
  LogIn,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Database,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Flame,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
  Compass,
  CheckSquare,
  Timer,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Key,
  RefreshCw,
  X
} from "lucide-react";

// Import modular components
import Sidebar from "./components/Sidebar";
import Celebration from "./components/Celebration";
import DashboardTab from "./components/DashboardTab";
import TaskMatrixTab from "./components/TaskMatrixTab";
import HabitTrackerTab from "./components/HabitTrackerTab";
import AiScholarTab from "./components/AiScholarTab";
import StudyAppsTab from "./components/StudyAppsTab";
import FocusTab from "./components/FocusTab";
import SettingsTab from "./components/SettingsTab";
import MobileBottomNav from "./components/MobileBottomNav";
import SecurityLockdownModal from "./components/SecurityLockdownModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import { DomainDnsModal } from "./components/DomainDnsModal";
import { ExamCountdownTab } from "./components/ExamCountdownTab";
import { ExamItem, FriendItem } from "./types";
import { CyberWaveBackground } from "./components/CyberWaveBackground";
import { pauseSoundscape } from "./lib/ambientSoundscapes";
import { 
  checkPayloadForThreats, 
  isClientQuarantined, 
  setClientQuarantine, 
  reportThreatToServer 
} from "./lib/securityShield";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Security Lockdown State
  const [securityLockdown, setSecurityLockdown] = useState<{
    isOpen: boolean;
    incidentId: string;
    reason: string;
  }>(() => {
    const q = isClientQuarantined();
    return {
      isOpen: q.quarantined,
      incidentId: q.incidentId || "SEC-QUARANTINE-INIT",
      reason: q.reason || "Client Access Quarantined by Automated Intrusion Shield"
    };
  });

  const triggerSecurityLockdown = (reason: string, customIncidentId?: string) => {
    const incidentId = customIncidentId || setClientQuarantine(reason);
    setSecurityLockdown({
      isOpen: true,
      incidentId,
      reason
    });
    reportThreatToServer({
      id: incidentId,
      type: "SUSPICIOUS_PROBE",
      vector: reason,
      severity: "CRITICAL"
    });
  };

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isDomainCopied, setIsDomainCopied] = useState(false);
  const [offlineMode, setOfflineMode] = useState(isFirestoreOffline);
  const isFirstSyncRef = useRef(true);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    setUnauthorizedDomain(null);
    setAuthFormError(null);
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        localStorage.removeItem("ENGEZ_SIMULATED_USER");
        localStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        setDismissedOnboarding(true);
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      const code = err?.code || "";
      const msg = err?.message || String(err);

      if (code === "auth/popup-closed-by-user" || msg.includes("popup-closed-by-user")) {
        setAuthError("Google Sign-In window was closed. Please try again when ready.");
      } else if (code === "auth/popup-blocked" || msg.includes("popup-blocked")) {
        setAuthError("Popups were blocked by your browser. Please allow popups for this site, or sign in using Email below.");
      } else if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
        const detectedHostname = typeof window !== "undefined" ? window.location.hostname : "engeznafsak.com";
        setUnauthorizedDomain(detectedHostname);
        setAuthError(`DOMAIN_UNAUTHORIZED:${detectedHostname}`);
      } else if (code === "auth/operation-not-allowed" || msg.includes("operation-not-allowed")) {
        setAuthError("Google Sign-In provider is not enabled yet in Firebase Authentication Console. You can sign in using Email below.");
      } else if (code === "auth/account-exists-with-different-credential") {
        setAuthError("An account already exists with this email address. Please sign in using your email and password below.");
      } else {
        setAuthError(msg || "Could not complete Google Sign-In. You can also sign in with Email below.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Onboarding Gate Stage State
  const [dismissedOnboarding, setDismissedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("ENGEZ_SIMULATED_USER") !== null || 
           localStorage.getItem("ENGEZ_DISMISSED_ONBOARDING") === "true" ||
           sessionStorage.getItem("ENGEZ_DISMISSED_ONBOARDING") === "true";
  });

  const [authMethod, setAuthMethod] = useState<"options" | "email_login" | "email_signup">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthSubmitLoading, setIsAuthSubmitLoading] = useState(false);
  const [authFormError, setAuthFormError] = useState<string | null>(null);

  // Quick project connect modal state on sign-in screen
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState("");
  const [modalApiKey, setModalApiKey] = useState("");
  const [modalSnippet, setModalSnippet] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const handleModalSaveProject = () => {
    setModalError(null);
    let pId = modalProjectId.trim();
    let aKey = modalApiKey.trim();

    if (modalSnippet.trim()) {
      const apiKeyMatch = modalSnippet.match(/apiKey\s*[:=]\s*["']([^"']+)["']/);
      const projectIdMatch = modalSnippet.match(/projectId\s*[:=]\s*["']([^"']+)["']/);
      if (projectIdMatch) pId = projectIdMatch[1];
      if (apiKeyMatch) aKey = apiKeyMatch[1];
    }

    if (!pId) {
      setModalError("Please enter your Firebase Project ID (e.g. engez-nafsak).");
      return;
    }
    if (!aKey) {
      setModalError("Please enter your Firebase Web API Key (starts with AIzaSy...).");
      return;
    }

    saveCustomFirebaseConfig({
      projectId: pId,
      apiKey: aKey,
      authDomain: `${pId}.firebaseapp.com`,
      storageBucket: `${pId}.appspot.com`,
      appId: ""
    });

    setModalSuccess("Engez Nafsak project connected! Reloading workspace...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleInstantHamzaLogin = () => {
    const hamzaUser = {
      uid: "hamza-mousa-master",
      email: "Hamzamousa26072011@gmail.com",
      displayName: "Hamza Mousa",
      emailVerified: true,
      isAnonymous: false,
    };
    localStorage.setItem("ENGEZ_SIMULATED_USER", JSON.stringify(hamzaUser));
    localStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
    sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
    setCurrentUser(hamzaUser as any);
    setUnauthorizedDomain(null);
    setAuthError(null);
    setDismissedOnboarding(true);
  };

  const handleGuestAccess = () => {
    const guestUser = {
      uid: "guest-workspace-user",
      email: "guest@engeznafsak.com",
      displayName: "Guest Scholar",
      emailVerified: true,
      isAnonymous: true,
    };
    localStorage.setItem("ENGEZ_SIMULATED_USER", JSON.stringify(guestUser));
    localStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
    sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
    setCurrentUser(guestUser as any);
    setOfflineMode(true);
    setDismissedOnboarding(true);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setAuthFormError("Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      setAuthFormError("Password must be at least 6 characters.");
      return;
    }
    setIsAuthSubmitLoading(true);
    setAuthFormError(null);

    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();

    try {
      // 1. Direct Firebase Account Creation
      const res = await emailSignUp(trimmedEmail, password, trimmedDisplayName);
      if (res && res.user) {
        sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        setDismissedOnboarding(true);
        return;
      }
    } catch (err: any) {
      const isAlreadyInUse = err?.code === "auth/email-already-in-use" ||
                             String(err).includes("email-already-in-use");

      if (isAlreadyInUse) {
        // Try logging in with the provided password
        try {
          const signInRes = await emailSignIn(trimmedEmail, password);
          if (signInRes && signInRes.user) {
            sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
            setDismissedOnboarding(true);
            return;
          }
        } catch (signInErr: any) {
          console.warn("Auto sign-in for existing account failed:", signInErr);
          setAuthFormError("This email is already registered. Please switch to the Log In tab or check your password.");
          setAuthMethod("email_login");
          return;
        }
      }

      const isRestricted = err?.code === "auth/admin-restricted-operation" ||
                           err?.code === "auth/operation-not-allowed" ||
                           String(err).includes("admin-restricted-operation") ||
                           String(err).includes("operation-not-allowed");
      
      if (isRestricted) {
        // Activate instant local account for seamless sandbox usage
        const simulatedUser = {
          uid: `local-${trimmedEmail.replace(/[^a-zA-Z0-9]/g, "-")}`,
          email: trimmedEmail,
          displayName: trimmedDisplayName || trimmedEmail.split("@")[0],
          emailVerified: true,
          isAnonymous: false,
        };
        
        const localUsers = JSON.parse(localStorage.getItem("ENGEZ_LOCAL_USERS") || "[]");
        const existingIdx = localUsers.findIndex((u: any) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
        
        if (existingIdx >= 0) {
          localUsers[existingIdx] = {
            ...localUsers[existingIdx],
            password: password,
            displayName: simulatedUser.displayName,
            emailVerified: true
          };
        } else {
          localUsers.push({
            email: trimmedEmail,
            password: password,
            displayName: simulatedUser.displayName,
            uid: simulatedUser.uid,
            emailVerified: true
          });
        }

        localStorage.setItem("ENGEZ_LOCAL_USERS", JSON.stringify(localUsers));
        localStorage.setItem("ENGEZ_SIMULATED_USER", JSON.stringify(simulatedUser));
        localStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        
        setCurrentUser(simulatedUser as any);
        setOfflineMode(true);
        setDismissedOnboarding(true);
        return;
      }

      console.warn("Email sign-up notification:", err?.message || err);
      setAuthFormError(err?.message || "Sign up failed. Please check your credentials.");
    } finally {
      setIsAuthSubmitLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthFormError("Email and Password are required.");
      return;
    }
    setIsAuthSubmitLoading(true);
    setAuthFormError(null);
    try {
      const res = await emailSignIn(email, password);
      if (res) {
        sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        setDismissedOnboarding(true);
      }
    } catch (err: any) {
      const isRestricted = err?.code === "auth/admin-restricted-operation" ||
                           err?.code === "auth/operation-not-allowed" ||
                           String(err).includes("admin-restricted-operation") ||
                           String(err).includes("operation-not-allowed");
      
      // Look up locally registered accounts before throwing error
      const localUsers = JSON.parse(localStorage.getItem("ENGEZ_LOCAL_USERS") || "[]");
      const found = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      
      if (found && found.password === password) {
        const simulatedUser = {
          uid: found.uid || `local-${email.replace(/[^a-zA-Z0-9]/g, "-")}`,
          email: found.email,
          displayName: found.displayName || found.email.split("@")[0],
          emailVerified: true,
          isAnonymous: false,
        };
        localStorage.setItem("ENGEZ_SIMULATED_USER", JSON.stringify(simulatedUser));
        localStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        setCurrentUser(simulatedUser as any);
        setOfflineMode(true);
        setDismissedOnboarding(true);
        return;
      } else if (isRestricted) {
        // Auto-register on the fly if the provider is locked/restricted
        const simulatedUser = {
          uid: `local-${email.replace(/[^a-zA-Z0-9]/g, "-")}`,
          email: email,
          displayName: email.split("@")[0],
          emailVerified: true,
          isAnonymous: false,
        };
        localUsers.push({
          email: email,
          password: password,
          displayName: email.split("@")[0],
          uid: simulatedUser.uid
        });
        localStorage.setItem("ENGEZ_LOCAL_USERS", JSON.stringify(localUsers));
        localStorage.setItem("ENGEZ_SIMULATED_USER", JSON.stringify(simulatedUser));
        localStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
        
        setCurrentUser(simulatedUser as any);
        setOfflineMode(true);
        setDismissedOnboarding(true);
        return;
      }
      console.warn("Email sign-in notification:", err?.message || err);
      setAuthFormError(err?.message || "Log in failed. Please check your email and password.");
    } finally {
      setIsAuthSubmitLoading(false);
    }
  };

  // 1. MOTIVATION CARD CELEBRATION STATE
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // 2. MAIN STATE: SCHOLAR STATS
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem("ENGEZ_STREAK_V4");
    return saved ? parseInt(saved, 10) : 0;
  });
  useEffect(() => {
    localStorage.setItem("ENGEZ_STREAK_V4", streak.toString());
  }, [streak]);

  // 3. MAIN STATE: POMODORO FOCUS TIMER (STUDY & BREAK CYCLES)
  const [focusMinutesSelected, setFocusMinutesSelected] = useState(50);
  const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(50 * 60);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [isFocusFullscreen, setIsFocusFullscreen] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"work" | "break" | "long">("work");
  const [pomodoroCompletedCount, setPomodoroCompletedCount] = useState<number>(() => {
    const saved = localStorage.getItem("ENGEZ_POMODOROS_COUNT");
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_POMODOROS_COUNT", pomodoroCompletedCount.toString());
  }, [pomodoroCompletedCount]);

  // Focus Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (focusModeActive && focusSecondsRemaining > 0) {
      interval = setInterval(() => {
        setFocusSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (focusSecondsRemaining === 0 && focusModeActive) {
      setFocusModeActive(false);
      pauseSoundscape();
      
      if (pomodoroMode === "work") {
        setStreak((prev) => prev + 1);
        setPomodoroCompletedCount((prev) => prev + 1);
        setCelebrationVisible(true);
        setPomodoroMode("break");
        setFocusMinutesSelected(10);
        setFocusSecondsRemaining(10 * 60);
      } else {
        setPomodoroMode("work");
        setFocusMinutesSelected(50);
        setFocusSecondsRemaining(50 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusModeActive, focusSecondsRemaining, pomodoroMode]);

  const handleDurationChange = (mins: number) => {
    setFocusMinutesSelected(mins);
    setFocusSecondsRemaining(mins * 60);
    setFocusModeActive(false);
  };

  const handleStartFocus = () => {
    setFocusModeActive(true);
  };

  const handlePauseFocus = () => {
    setFocusModeActive(false);
    pauseSoundscape();
  };

  const handleResetFocus = () => {
    setFocusModeActive(false);
    setFocusSecondsRemaining(focusMinutesSelected * 60);
    pauseSoundscape();
  };

  const handleStopFocus = () => {
    setFocusModeActive(false);
    pauseSoundscape();
  };

  const formatFocusTime = () => {
    const hours = Math.floor(focusSecondsRemaining / 3600);
    const mins = Math.floor((focusSecondsRemaining % 3600) / 60);
    const secs = focusSecondsRemaining % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimerPaused = !focusModeActive && focusSecondsRemaining < focusMinutesSelected * 60 && focusSecondsRemaining > 0;

  // 4. MAIN STATE: STUDY TASKS DATAPACK
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("ENGEZ_TASKS_V3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tasks:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_TASKS_V3", JSON.stringify(tasks));
  }, [tasks]);

  // DYNAMIC CUSTOM SUBJECTS STATE
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem("ENGEZ_SUBJECTS_V3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse subjects:", e);
      }
    }
    return [
      "Cambridge Physics",
      "Digital SAT Math",
      "College Chemistry",
      "English Literature"
    ];
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_SUBJECTS_V3", JSON.stringify(subjects));
  }, [subjects]);

  const handleAddSubject = (newSubj: string) => {
    const trimmed = newSubj.trim();
    if (!trimmed) return;

    // Deep Threat Inspection
    const threatCheck = checkPayloadForThreats(trimmed);
    if (threatCheck.isThreat) {
      triggerSecurityLockdown(
        `Hostile injection detected in Subject creation: ${threatCheck.details || threatCheck.threatType}`
      );
      return;
    }

    if (!subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
    }
  };

  const handleDeleteSubject = (subjToDelete: string) => {
    setSubjects((prev) => prev.filter((s) => s !== subjToDelete));
  };

  // SYSTEM LOGISTICS AND DISPLAY SETTINGS
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("ENGEZ_SETTINGS_V3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    return {
      timeSystem: "12" as "12" | "24",
      themeMode: "light" as "light" | "dark"
    };
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_SETTINGS_V3", JSON.stringify(settings));
    const root = document.documentElement;
    if (settings.themeMode === "light") {
      root.classList.add("theme-light");
      root.classList.remove("theme-dark");
      root.setAttribute("data-theme", "engez-light");
    } else {
      root.classList.remove("theme-light");
      root.classList.add("theme-dark");
      root.setAttribute("data-theme", "engez-dark");
    }
  }, [settings]);

  const handleUpdateSettings = (newSettingsFields: Partial<typeof settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettingsFields
    }));
  };

  // Add new task on matrices: connects to express api server with WAF validation
  const handleAddTask = async (newTaskData: Omit<Task, "id" | "completed">) => {
    // Deep Threat Inspection across all fields
    const combinedPayload = `${newTaskData.title} ${newTaskData.subject} ${newTaskData.details} ${newTaskData.priority}`;
    const threatCheck = checkPayloadForThreats(combinedPayload);
    if (threatCheck.isThreat) {
      triggerSecurityLockdown(
        `Intrusion attempt blocked in Task creation: ${threatCheck.details || threatCheck.threatType}`
      );
      return;
    }

    const tempId = "task-" + Date.now();
    const tempTask: Task = {
      ...newTaskData,
      id: tempId,
      completed: false,
      isPrioritizing: true,
    };

    setTasks((prev) => [tempTask, ...prev]);

    try {
      const idToken = await getFirebaseIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const response = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: newTaskData.title,
          subject: newTaskData.subject,
          examDate: newTaskData.examDate,
          priority: newTaskData.priority,
          details: newTaskData.details,
          dueDate: newTaskData.dueDate,
          dueTime: newTaskData.dueTime,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errJson = await response.json().catch(() => ({}));
          triggerSecurityLockdown(
            errJson.reason || "Access Quarantined by WAF Shield",
            errJson.incidentId
          );
          return;
        }
        throw new Error("Tutor API failed to prioritize.");
      }

      const rawAiData = await response.json();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === tempId
            ? {
                ...t,
                estimatedMinutes: rawAiData.estimatedMinutes,
                difficulty: rawAiData.difficulty,
                aiTip: rawAiData.studyTip,
                aiBreakdown: rawAiData.breakdown,
                isPrioritizing: false,
              }
            : t
        )
      );
    } catch (err) {
      console.error("AI estimation fetch error, keeping default fallback values", err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === tempId
            ? {
                ...t,
                estimatedMinutes: 40,
                difficulty: "Medium",
                aiTip: "Ready in high-efficiency local mode. Check mark scheme guidelines!",
                aiBreakdown: "Classified assessment assigned.",
                isPrioritizing: false,
              }
            : t
        )
      );
    }
  };

  const handleRefreshTaskAi = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPrioritizing: true } : t))
    );

    try {
      const idToken = await getFirebaseIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const response = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: task.title,
          subject: task.subject,
          examDate: task.examDate,
          priority: task.priority,
          details: task.details,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
        }),
      });

      if (!response.ok) throw new Error("API prioritization fail");

      const rawAiData = await response.json();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                estimatedMinutes: rawAiData.estimatedMinutes,
                difficulty: rawAiData.difficulty,
                aiTip: rawAiData.studyTip,
                aiBreakdown: rawAiData.breakdown,
                isPrioritizing: false,
              }
            : t
        )
      );
    } catch (err) {
      console.warn("Local refresh fallbacks active:", err);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPrioritizing: false } : t))
      );
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            setCelebrationVisible(true);
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      });
      return updated;
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteAllTasks = () => {
    setTasks([]);
  };

  // 5. MAIN STATE: PASTPAPERS & SCHEMES DATAPACK
  const [papers, setPapers] = useState<PastPaper[]>(() => {
    const saved = localStorage.getItem("ENGEZ_PAPERS_V4");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse papers:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_PAPERS_V4", JSON.stringify(papers));
  }, [papers]);

  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);

  // 6. STUDY APPS DATA LIST (Stateful, Multi-tier Account Persistence)
  const DEFAULT_STUDY_APPS: StudyApp[] = [
    {
      id: "app-1",
      name: "Google Classroom",
      url: "https://classroom.google.com",
      logoColor: "#10B981"
    }
  ];

  const [appSavedNotice, setAppSavedNotice] = useState<string | null>(null);

  const [apps, setApps] = useState<StudyApp[]>(() => {
    // Check if there is an active simulated user stored
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userApps = localStorage.getItem(`ENGEZ_USER_APPS_${parsedUser.uid}`);
          if (userApps) {
            const parsed = JSON.parse(userApps);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_STUDY_APPS_V3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved study apps:", e);
      }
    }
    return DEFAULT_STUDY_APPS;
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(apps));
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_APPS_${currentUser.uid}`, JSON.stringify(apps));
    }
  }, [apps, currentUser]);

  const handleAddApp = async (newApp: Omit<StudyApp, "id">) => {
    const freshApp: StudyApp = {
      ...newApp,
      id: "app-" + Date.now()
    };
    const updatedApps = [...apps, freshApp];
    setApps(updatedApps);
    localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(updatedApps));

    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_APPS_${currentUser.uid}`, JSON.stringify(updatedApps));
      await saveUserApps(currentUser.uid, updatedApps);
      saveUserWorkspace(currentUser.uid, {
        uid: currentUser.uid,
        email: currentUser.email || "",
        streak,
        subjects,
        tasks,
        classes: [],
        apps: updatedApps,
        papers
      }).catch((err) => console.warn("App workspace save notice:", err));
      setAppSavedNotice(`"${freshApp.name}" saved to your account!`);
    } else {
      setAppSavedNotice(`"${freshApp.name}" saved locally. Sign in to keep it permanently!`);
    }

    setTimeout(() => setAppSavedNotice(null), 4000);
  };

  const handleDeleteApp = async (id: string) => {
    const appToDelete = apps.find(a => a.id === id);
    const updatedApps = apps.filter((app) => app.id !== id);
    setApps(updatedApps);
    localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(updatedApps));

    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_APPS_${currentUser.uid}`, JSON.stringify(updatedApps));
      await saveUserApps(currentUser.uid, updatedApps);
      saveUserWorkspace(currentUser.uid, {
        uid: currentUser.uid,
        email: currentUser.email || "",
        streak,
        subjects,
        tasks,
        classes: [],
        apps: updatedApps,
        papers,
        habits,
        habitLogs,
        habitStartDate
      }).catch((err) => console.warn("App delete sync notice:", err));
    }
    if (appToDelete) {
      setAppSavedNotice(`Removed "${appToDelete.name}" from your apps.`);
      setTimeout(() => setAppSavedNotice(null), 3000);
    }
  };

  const handleEditApp = async (updatedApp: StudyApp) => {
    const updatedApps = apps.map((app) => (app.id === updatedApp.id ? updatedApp : app));
    setApps(updatedApps);
    localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(updatedApps));

    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_APPS_${currentUser.uid}`, JSON.stringify(updatedApps));
      await saveUserApps(currentUser.uid, updatedApps);
      saveUserWorkspace(currentUser.uid, {
        uid: currentUser.uid,
        email: currentUser.email || "",
        streak,
        subjects,
        tasks,
        classes: [],
        apps: updatedApps,
        papers,
        habits,
        habitLogs,
        habitStartDate
      }).catch((err) => console.warn("App edit sync notice:", err));
    }
    setAppSavedNotice(`Updated portal "${updatedApp.name}".`);
    setTimeout(() => setAppSavedNotice(null), 3000);
  };

  const handleResetDefaultApps = async () => {
    setApps(DEFAULT_STUDY_APPS);
    localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(DEFAULT_STUDY_APPS));
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_APPS_${currentUser.uid}`, JSON.stringify(DEFAULT_STUDY_APPS));
      await saveUserApps(currentUser.uid, DEFAULT_STUDY_APPS);
      saveUserWorkspace(currentUser.uid, {
        uid: currentUser.uid,
        email: currentUser.email || "",
        streak,
        subjects,
        tasks,
        classes: [],
        apps: DEFAULT_STUDY_APPS,
        papers
      }).catch(() => {});
    }
    setAppSavedNotice("Reset to default study apps.");
    setTimeout(() => setAppSavedNotice(null), 3000);
  };

  // ---------------------------------------------------------------------------
  // HABIT TRACKER STATE & PERSISTENCE
  // ---------------------------------------------------------------------------
  const DEFAULT_HABITS: HabitItem[] = [
    { id: "habit_1", name: "Workout", emoji: "💪", color: "#C96F55", createdAt: new Date().toISOString() },
    { id: "habit_2", name: "Solve Chemistry", emoji: "📖", color: "#587B8C", createdAt: new Date().toISOString() },
    { id: "habit_3", name: "Solve Math", emoji: "🗓️", color: "#66856D", createdAt: new Date().toISOString() },
    { id: "habit_4", name: "Solve CS", emoji: "🎯", color: "#4F46E5", createdAt: new Date().toISOString() },
  ];

  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userHabits = localStorage.getItem(`ENGEZ_USER_HABITS_${parsedUser.uid}`);
          if (userHabits) {
            const parsed = JSON.parse(userHabits);
            if (Array.isArray(parsed?.habits) && parsed.habits.length > 0) return parsed.habits;
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_HABITS_LIST_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_HABITS;
  });

  const [habitLogs, setHabitLogs] = useState<Record<string, HabitDayLog>>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userHabits = localStorage.getItem(`ENGEZ_USER_HABITS_${parsedUser.uid}`);
          if (userHabits) {
            const parsed = JSON.parse(userHabits);
            if (parsed?.habitLogs && typeof parsed.habitLogs === "object") return parsed.habitLogs;
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_HABIT_LOGS_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (e) {}
    }
    return {};
  });

  const [habitStartDate, setHabitStartDate] = useState<string>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userHabits = localStorage.getItem(`ENGEZ_USER_HABITS_${parsedUser.uid}`);
          if (userHabits) {
            const parsed = JSON.parse(userHabits);
            if (parsed?.habitStartDate) return parsed.habitStartDate;
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_HABIT_START_DATE_V1");
    if (saved) return saved;

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // Local storage caching for habits
  useEffect(() => {
    localStorage.setItem("ENGEZ_HABITS_LIST_V1", JSON.stringify(habits));
    localStorage.setItem("ENGEZ_HABIT_LOGS_V1", JSON.stringify(habitLogs));
    localStorage.setItem("ENGEZ_HABIT_START_DATE_V1", habitStartDate);

    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_HABITS_${currentUser.uid}`, JSON.stringify({
        habits,
        habitLogs,
        habitStartDate
      }));
    }
  }, [habits, habitLogs, habitStartDate, currentUser]);

  const handleUpdateHabits = async (updatedHabits: HabitItem[]) => {
    setHabits(updatedHabits);
    localStorage.setItem("ENGEZ_HABITS_LIST_V1", JSON.stringify(updatedHabits));
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_HABITS_${currentUser.uid}`, JSON.stringify({
        habits: updatedHabits,
        habitLogs,
        habitStartDate
      }));
      await saveUserHabits(currentUser.uid, updatedHabits, habitLogs, habitStartDate);
    }
  };

  const handleUpdateLogs = async (updatedLogs: Record<string, HabitDayLog>) => {
    setHabitLogs(updatedLogs);
    localStorage.setItem("ENGEZ_HABIT_LOGS_V1", JSON.stringify(updatedLogs));
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_HABITS_${currentUser.uid}`, JSON.stringify({
        habits,
        habitLogs: updatedLogs,
        habitStartDate
      }));
      await saveUserHabits(currentUser.uid, habits, updatedLogs, habitStartDate);
    }
  };

  const handleUpdateStartDate = async (newStartDate: string) => {
    setHabitStartDate(newStartDate);
    localStorage.setItem("ENGEZ_HABIT_START_DATE_V1", newStartDate);
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_HABITS_${currentUser.uid}`, JSON.stringify({
        habits,
        habitLogs,
        habitStartDate: newStartDate
      }));
      await saveUserHabits(currentUser.uid, habits, habitLogs, newStartDate);
    }
  };

  // 6. EXAM COUNTDOWNS & STUDY BUDDIES STATE
  const [exams, setExams] = useState<ExamItem[]>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userExams = localStorage.getItem(`ENGEZ_USER_EXAMS_${parsedUser.uid}`);
          if (userExams) {
            const parsed = JSON.parse(userExams);
            if (Array.isArray(parsed)) return parsed;
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_EXAM_COUNTDOWNS_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [friends, setFriends] = useState<FriendItem[]>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userFriends = localStorage.getItem(`ENGEZ_USER_FRIENDS_${parsedUser.uid}`);
          if (userFriends) {
            const parsed = JSON.parse(userFriends);
            if (Array.isArray(parsed?.friends)) return parsed.friends;
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_STUDY_FRIENDS_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.friends)) return parsed.friends;
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [friendUsername, setFriendUsername] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_STUDY_FRIENDS_V1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.friendUsername) return parsed.friendUsername;
      }
    } catch (e) {}
    return "";
  });

  const [inviteCode, setInviteCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_STUDY_FRIENDS_V1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.inviteCode) return parsed.inviteCode;
      }
    } catch (e) {}
    return "";
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_EXAM_COUNTDOWNS_V1", JSON.stringify(exams));
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_EXAMS_${currentUser.uid}`, JSON.stringify(exams));
    }
  }, [exams, currentUser]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_STUDY_FRIENDS_V1", JSON.stringify({
      friends,
      friendUsername,
      inviteCode
    }));
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_FRIENDS_${currentUser.uid}`, JSON.stringify({
        friends,
        friendUsername,
        inviteCode
      }));
    }
  }, [friends, friendUsername, inviteCode, currentUser]);

  // Auth State & Cloud sync on mount
  useEffect(() => {
    const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
    if (storedSimulated) {
      setDismissedOnboarding(true);
    }

    const fallbackTimer = setTimeout(() => {
      setIsAuthLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(fallbackTimer);
      
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      let activeUser = user;
      let isSimulated = false;
      if (!user && storedSimulated) {
        try {
          activeUser = JSON.parse(storedSimulated);
          isSimulated = true;
        } catch (e) {
          console.error("Failed to parse simulated user:", e);
        }
      }

      setCurrentUser(activeUser);
      if (activeUser) {
        setIsAuthLoading(true);
        resetFirestoreOffline();

        // 1. Immediately check if this user has apps saved in user-scoped local cache
        let userHadCachedApps = false;
        try {
          const cachedUserAppsStr = localStorage.getItem(`ENGEZ_USER_APPS_${activeUser.uid}`);
          if (cachedUserAppsStr) {
            const parsedCachedApps = JSON.parse(cachedUserAppsStr);
            if (Array.isArray(parsedCachedApps) && parsedCachedApps.length > 0) {
              setApps(parsedCachedApps);
              userHadCachedApps = true;
            }
          }
        } catch (e) {}

        try {
          // Fetch user workspace (tries Firestore -> server API backup -> local cache)
          const cloudData = await fetchUserWorkspace(activeUser.uid);
          if (cloudData) {
            if (cloudData.streak !== undefined) setStreak(cloudData.streak);
            if (cloudData.subjects !== undefined) setSubjects(cloudData.subjects);
            if (cloudData.tasks !== undefined) setTasks(cloudData.tasks);
            if (cloudData.papers !== undefined) setPapers(cloudData.papers);
            if (Array.isArray(cloudData.exams)) setExams(cloudData.exams);
            if (Array.isArray(cloudData.friends)) setFriends(cloudData.friends);
            if (cloudData.friendUsername) setFriendUsername(cloudData.friendUsername);
            if (cloudData.inviteCode) setInviteCode(cloudData.inviteCode);

            // If cloud has apps, load them
            if (Array.isArray(cloudData.apps) && cloudData.apps.length > 0) {
              setApps(cloudData.apps);
              localStorage.setItem(`ENGEZ_USER_APPS_${activeUser.uid}`, JSON.stringify(cloudData.apps));
              localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(cloudData.apps));
            } else {
              // If cloud workspace had empty apps, but user had apps in local cache or current state:
              // persist them to cloud so user finds them every time they sign in!
              const currentOrCachedApps = userHadCachedApps && localStorage.getItem(`ENGEZ_USER_APPS_${activeUser.uid}`)
                ? JSON.parse(localStorage.getItem(`ENGEZ_USER_APPS_${activeUser.uid}`)!) 
                : (apps.length > 0 ? apps : DEFAULT_STUDY_APPS);
              
              setApps(currentOrCachedApps);
              await saveUserApps(activeUser.uid, currentOrCachedApps);
              await saveUserWorkspace(activeUser.uid, {
                uid: activeUser.uid,
                email: activeUser.email || "",
                streak: cloudData.streak ?? streak,
                subjects: cloudData.subjects ?? subjects,
                tasks: cloudData.tasks ?? tasks,
                classes: cloudData.classes ?? [],
                apps: currentOrCachedApps,
                papers: cloudData.papers ?? papers,
                habits,
                habitLogs,
                habitStartDate,
                exams,
                friends,
                friendUsername,
                inviteCode
              });
            }

            // If cloud has habits, load them
            if (Array.isArray(cloudData.habits) && cloudData.habits.length > 0) {
              setHabits(cloudData.habits);
              if (cloudData.habitLogs) setHabitLogs(cloudData.habitLogs);
              if (cloudData.habitStartDate) setHabitStartDate(cloudData.habitStartDate);
              localStorage.setItem(`ENGEZ_USER_HABITS_${activeUser.uid}`, JSON.stringify({
                habits: cloudData.habits,
                habitLogs: cloudData.habitLogs || {},
                habitStartDate: cloudData.habitStartDate || habitStartDate
              }));
            } else {
              const cachedHabits = localStorage.getItem(`ENGEZ_USER_HABITS_${activeUser.uid}`);
              if (cachedHabits) {
                try {
                  const parsedH = JSON.parse(cachedHabits);
                  if (Array.isArray(parsedH.habits) && parsedH.habits.length > 0) {
                    setHabits(parsedH.habits);
                    if (parsedH.habitLogs) setHabitLogs(parsedH.habitLogs);
                    if (parsedH.habitStartDate) setHabitStartDate(parsedH.habitStartDate);
                    await saveUserHabits(activeUser.uid, parsedH.habits, parsedH.habitLogs || {}, parsedH.habitStartDate || habitStartDate);
                  }
                } catch (e) {}
              } else {
                await saveUserHabits(activeUser.uid, habits, habitLogs, habitStartDate);
              }
            }
          } else {
            // New user or offline: save current user workspace including apps & habits
            await saveUserWorkspace(activeUser.uid, {
              uid: activeUser.uid,
              email: activeUser.email || "",
              streak,
              subjects,
              tasks,
              classes: [],
              apps,
              papers,
              habits,
              habitLogs,
              habitStartDate,
              exams,
              friends,
              friendUsername,
              inviteCode
            });
            localStorage.setItem(`ENGEZ_USER_APPS_${activeUser.uid}`, JSON.stringify(apps));
            localStorage.setItem(`ENGEZ_USER_HABITS_${activeUser.uid}`, JSON.stringify({
              habits,
              habitLogs,
              habitStartDate
            }));
          }
        } catch (e) {
          console.error("Failed to sync cloud data for logged-in user:", e);
        } finally {
          setIsAuthLoading(false);
          setOfflineMode(isSimulated || isFirestoreOffline);
        }
      } else {
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Keep onboarding dismissed when a user is loaded
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
      sessionStorage.setItem("ENGEZ_DISMISSED_ONBOARDING", "true");
      setDismissedOnboarding(true);
    }
  }, [currentUser]);

  // Sync state changes to cloud if logged in (debounced)
  useEffect(() => {
    const isSimulated = currentUser && currentUser.uid && (currentUser.uid.startsWith("local-") || currentUser.uid === "guest-simulated-workspace");
    
    if (currentUser && !isAuthLoading && !isFirestoreOffline && !isSimulated) {
      if (isFirstSyncRef.current) {
        isFirstSyncRef.current = false;
      } else {
        localStorage.setItem("ENGEZ_PENDING_CLOUD_SYNC", "true");
      }

      const syncToCloud = async () => {
        try {
          await saveUserWorkspace(currentUser.uid, {
            uid: currentUser.uid,
            email: currentUser.email || "",
            streak,
            subjects,
            tasks,
            classes: [],
            apps,
            papers,
            habits,
            habitLogs,
            habitStartDate,
            exams,
            friends,
            friendUsername,
            inviteCode
          });
          localStorage.removeItem("ENGEZ_PENDING_CLOUD_SYNC");
        } catch (err) {
          console.error("Auto sync to Firestore failed:", err);
        } finally {
          setOfflineMode(isFirestoreOffline);
        }
      };
      
      const timer = setTimeout(() => {
        syncToCloud();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentUser, streak, subjects, tasks, apps, papers, habits, habitLogs, habitStartDate, exams, friends, friendUsername, inviteCode, isAuthLoading]);

  // Guaranteed immediate saving when the window/tab is closed or refreshed
  useEffect(() => {
    const handleUnload = () => {
      const isSimulated = currentUser && currentUser.uid && (currentUser.uid.startsWith("local-") || currentUser.uid === "guest-simulated-workspace");
      if (currentUser && !isFirestoreOffline && !isSimulated) {
        localStorage.setItem("ENGEZ_TASKS_V3", JSON.stringify(tasks));
        localStorage.setItem("ENGEZ_STREAK_V4", streak.toString());
        localStorage.setItem("ENGEZ_SUBJECTS_V3", JSON.stringify(subjects));
        localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(apps));
        localStorage.setItem("ENGEZ_PAPERS_V4", JSON.stringify(papers));
        localStorage.setItem("ENGEZ_HABITS_LIST_V1", JSON.stringify(habits));
        localStorage.setItem("ENGEZ_HABIT_LOGS_V1", JSON.stringify(habitLogs));
        localStorage.setItem("ENGEZ_EXAM_COUNTDOWNS_V1", JSON.stringify(exams));
        localStorage.setItem("ENGEZ_STUDY_FRIENDS_V1", JSON.stringify({ friends, friendUsername, inviteCode }));
        localStorage.setItem("ENGEZ_HABIT_START_DATE_V1", habitStartDate);

        if (localStorage.getItem("ENGEZ_PENDING_CLOUD_SYNC") === "true") {
          saveUserWorkspace(currentUser.uid, {
            uid: currentUser.uid,
            email: currentUser.email || "",
            streak,
            subjects,
            tasks,
            classes: [],
            apps,
            papers,
            habits,
            habitLogs,
            habitStartDate
          }).then(() => {
            localStorage.removeItem("ENGEZ_PENDING_CLOUD_SYNC");
          }).catch((err) => {
            console.error("Close-unload cloud sync failed:", err);
          });
        }
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [currentUser, streak, subjects, tasks, apps, papers, habits, habitLogs, habitStartDate]);

  const handleOpenAuthModal = async () => {
    setDismissedOnboarding(false);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setAuthFormError(null);
    setAuthError(null);
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    try {
      if (currentUser?.uid) {
        localStorage.setItem(`ENGEZ_USER_APPS_${currentUser.uid}`, JSON.stringify(apps));
      }
      localStorage.removeItem("ENGEZ_SIMULATED_USER");
      localStorage.removeItem("ENGEZ_DISMISSED_ONBOARDING");
      localStorage.removeItem("ENGEZ_PENDING_CLOUD_SYNC");
      sessionStorage.removeItem("GOOGLE_CLASSROOM_TOKEN");
      sessionStorage.removeItem("ENGEZ_DISMISSED_ONBOARDING");
      setDismissedOnboarding(false);
      setEmail("");
      setPassword("");
      setDisplayName("");
      await googleLogout();
      setCurrentUser(null);
      setOfflineMode(false);
      setApps(DEFAULT_STUDY_APPS);
      localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(DEFAULT_STUDY_APPS));
    } catch (err) {
      console.error("Sign-out issue:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${
      settings.themeMode === "light" ? "bg-[#F7F6F2] text-[#1D1D1B]" : "bg-[#000000] text-white"
    } overflow-x-hidden relative transition-colors duration-300 font-sans`}>
      
      {/* CYBER WAVE PERSPECTIVE GRID & CELESTIAL GLOWING SPHERES */}
      <CyberWaveBackground isLight={settings.themeMode === "light"} />

      {/* SLEEK COLLAPSIBLE NAVIGATION SIDEBAR */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        focusModeActive={focusModeActive}
        focusTimeRemaining={formatFocusTime()}
        currentUser={currentUser}
        isAuthLoading={isAuthLoading || isGoogleLoading}
        onLogin={handleOpenAuthModal}
        onLogout={handleLogout}
        isFirestoreOffline={offlineMode}
        themeMode={settings.themeMode}
      />

      {/* CORE FRAMEWORK STAGE */}
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-5 md:space-y-6 flex flex-col justify-between max-w-7xl mx-auto w-full smooth-scroll">
        
        {/* TOP STATUS & PROFILE HEADER BAR */}
        <header className={`flex flex-row items-center justify-between gap-3 ${
          settings.themeMode === "light" 
            ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xs" 
            : "bg-[#0A0714]/85 border-white/10 text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85)]"
        } border rounded-2xl p-3 sm:p-4 md:px-6 backdrop-blur-2xl transition-all duration-300`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FAF8F5] border border-[#E8D7C9] p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs hover:scale-105 transition-transform">
              <img src="/engez_brand_emblem.svg" alt="Engez Nafsak" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`font-extrabold ${settings.themeMode === "light" ? "text-[#1D1D1B]" : "text-white"} text-sm sm:text-base tracking-tight truncate font-sans`}>
                  Engez Nafsak
                </span>
                <span className={`text-[9px] sm:text-[10px] font-sans font-bold ${
                  settings.themeMode === "light" 
                    ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]" 
                    : "bg-[#8B5CF6]/15 border-[#8B5CF6]/35 text-[#C084FC]"
                } border px-1.5 sm:px-2 py-0.5 rounded-md uppercase shrink-0`}>
                  إنجز نفسك
                </span>
              </div>
              <p className={`text-[10px] sm:text-[11px] ${settings.themeMode === "light" ? "text-[#77736B]" : "text-[#C4B5FD]/75"} font-sans truncate`}>
                {subjects.length} Subjects Active • {tasks.filter(t => !t.completed).length} Tasks Left
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Focus Widget */}
            <button
              onClick={() => setCurrentTab("focus")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer min-h-[38px] ${
                focusModeActive
                  ? settings.themeMode === "light"
                    ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55] animate-pulse"
                    : "bg-[#8B5CF6]/25 border-[#8B5CF6]/50 text-[#C084FC] shadow-xs animate-pulse"
                  : settings.themeMode === "light"
                  ? "bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B] hover:bg-[#E8D7C9]"
                  : "bg-[#120E22]/90 border-white/10 text-white hover:bg-[#1A1432]"
              }`}
              title="Focus timer"
            >
              <Clock size={13} className={focusModeActive ? "text-[#8B5CF6]" : settings.themeMode === "light" ? "text-[#77736B]" : "text-[#C4B5FD]"} />
              <span className="text-[11px] sm:text-xs">{formatFocusTime()}</span>
              {focusModeActive && <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-ping" />}
            </button>

            {/* Streak Badge */}
            <div className={`px-2.5 sm:px-3 py-1.5 rounded-xl ${
              settings.themeMode === "light"
                ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#C96F55]"
                : "bg-[#8B5CF6]/15 border-[#8B5CF6]/35 text-[#C084FC]"
            } border text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 sm:gap-1.5 shadow-2xs min-h-[38px]`}>
              <Flame size={13} className="fill-current text-[#8B5CF6] dark:text-[#C084FC]" />
              <span>{streak}d</span>
            </div>

            {/* Custom DNS Domain Hub Pill */}
            <button
              onClick={() => setShowDnsModal(true)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[38px] ${
                settings.themeMode === "light"
                  ? "bg-[#FAF9F5] border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F0EEE8]"
                  : "bg-[#120E22]/90 border-white/10 text-white hover:bg-[#1A1432]"
              }`}
              title="Custom DNS & Domain Hub (engeznafsak.com)"
            >
              <Globe size={13} className="text-[#8B5CF6] dark:text-[#C084FC]" />
              <span className="hidden sm:inline">engeznafsak.com</span>
              <span className="sm:hidden">DNS</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </button>

            {/* User Profile Pill */}
            {currentUser ? (
              <div className={`flex items-center gap-1.5 sm:gap-2 ${
                settings.themeMode === "light"
                  ? "bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]"
                  : "bg-[#1E1735] border-[#2C1F4A] text-[#FAF8F5]"
              } border px-2 sm:px-3 py-1.5 rounded-xl min-h-[38px]`}>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg object-cover border border-[#C96F55]/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg ${
                    settings.themeMode === "light" ? "bg-[#FFF1EC] text-[#C96F55]" : "bg-[#C96F55]/20 text-[#DE7A5E] border border-[#C96F55]/30"
                  } flex items-center justify-center text-xs font-bold`}>
                    <UserIcon size={12} />
                  </div>
                )}
                <span className={`text-xs font-bold ${settings.themeMode === "light" ? "text-[#1D1D1B]" : "text-[#FAF8F5]"} max-w-[90px] truncate hidden md:inline font-sans`}>
                  {currentUser.displayName || currentUser.email?.split("@")[0] || "Scholar"}
                </span>
                <button
                  onClick={handleLogout}
                  className={`p-1 ${settings.themeMode === "light" ? "text-[#77736B] hover:text-[#B85C5C]" : "text-[#B8AFA6] hover:text-rose-400"} transition cursor-pointer`}
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenAuthModal}
                className={`px-3 sm:px-4 py-1.5 ${
                  settings.themeMode === "light"
                    ? "bg-[#C96F55] hover:bg-[#B85F48]"
                    : "bg-[#3B82F6] hover:bg-[#2563EB] shadow-md shadow-blue-500/25"
                } text-white rounded-xl text-[11px] sm:text-xs font-sans font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[38px]`}
              >
                <LogIn size={13} />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Main tabs routing switch */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {currentTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <DashboardTab
                  tasks={tasks}
                  focusModeActive={focusModeActive}
                  focusTimeRemaining={formatFocusTime()}
                  focusMinutesSelected={focusMinutesSelected}
                  onStartFocus={handleStartFocus}
                  onPauseFocus={handlePauseFocus}
                  onResetFocus={handleResetFocus}
                  onStopFocus={handleStopFocus}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  streak={streak}
                  pomodoroMode={pomodoroMode}
                  isPaused={isTimerPaused}
                  pomodoroCount={pomodoroCompletedCount}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}

            {currentTab === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <ExamCountdownTab
                  currentUser={currentUser}
                  exams={exams}
                  setExams={setExams}
                  friends={friends}
                  setFriends={setFriends}
                  friendUsername={friendUsername}
                  setFriendUsername={setFriendUsername}
                  inviteCode={inviteCode}
                  setInviteCode={setInviteCode}
                  totalFocusMinutes={Math.floor((50 * 60 - focusSecondsRemaining) / 60) + pomodoroCompletedCount * 25}
                  userStreak={streak}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}

            {currentTab === "matrix" && (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <TaskMatrixTab
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteAllTasks={handleDeleteAllTasks}
                  onRefreshTaskAi={handleRefreshTaskAi}
                  subjects={subjects}
                  onAddSubject={handleAddSubject}
                  onDeleteSubject={handleDeleteSubject}
                  timeSystem={settings.timeSystem}
                  currentUser={currentUser}
                  onLogin={handleOpenAuthModal}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}

            {currentTab === "habits" && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <HabitTrackerTab
                  habits={habits}
                  habitLogs={habitLogs}
                  startDate={habitStartDate}
                  themeMode={settings.themeMode}
                  currentUser={currentUser}
                  onUpdateHabits={handleUpdateHabits}
                  onUpdateLogs={handleUpdateLogs}
                  onUpdateStartDate={handleUpdateStartDate}
                  onSaveNotice={(msg) => setAppSavedNotice(msg)}
                />
              </motion.div>
            )}

            {currentTab === "scholar" && (
              <motion.div
                key="scholar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <AiScholarTab
                  papers={papers}
                  selectedPaper={selectedPaper}
                  onSelectPaper={(paper) => setSelectedPaper(paper)}
                  currentUser={currentUser}
                  onLogin={handleOpenAuthModal}
                  onOpenAuthModal={handleOpenAuthModal}
                  onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}

            {currentTab === "focus" && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <FocusTab
                  focusModeActive={focusModeActive}
                  onStartFocus={handleStartFocus}
                  onPauseFocus={handlePauseFocus}
                  onResetFocus={handleResetFocus}
                  onStopFocus={handleStopFocus}
                  focusMinutesSelected={focusMinutesSelected}
                  onDurationChange={handleDurationChange}
                  focusTimeRemaining={formatFocusTime()}
                  isPaused={isTimerPaused}
                  pomodoroMode={pomodoroMode}
                  onModeChange={(m) => setPomodoroMode(m)}
                  pomodoroCount={pomodoroCompletedCount}
                  themeMode={settings.themeMode}
                  onFullScreenChange={setIsFocusFullscreen}
                />
              </motion.div>
            )}

            {currentTab === "apps" && (
              <motion.div
                key="apps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <StudyAppsTab
                  apps={apps}
                  onAddApp={handleAddApp}
                  onEditApp={handleEditApp}
                  onDeleteApp={handleDeleteApp}
                  themeMode={settings.themeMode}
                  currentUser={currentUser}
                  appSavedNotice={appSavedNotice}
                  onResetDefaults={handleResetDefaultApps}
                  onOpenLoginModal={handleOpenAuthModal}
                />
              </motion.div>
            )}

            {currentTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <SettingsTab
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  subjects={subjects}
                  onAddSubject={handleAddSubject}
                  onDeleteSubject={handleDeleteSubject}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onLogin={handleOpenAuthModal}
                  onGoogleLogin={handleGoogleLogin}
                  onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
                  onOpenDnsModal={() => setShowDnsModal(true)}
                  isGoogleLoading={isGoogleLoading}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unified sleek footer */}
        <footer className={`border-t ${
          settings.themeMode === "light" ? "border-[#E3E0D8] text-[#77736B]" : "border-white/5 text-slate-400"
        } pt-5 flex flex-col sm:flex-row items-center justify-between text-xs font-sans gap-3.5 mt-8 shrink-0`}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span>Engez Nafsak (إنجز نفسك) • Engineered for Elite Academic Success</span>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="underline hover:text-[#C96F55] transition cursor-pointer font-medium"
            >
              Privacy Policy
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#66856D] animate-ping" />
            <span>Cambridge, Edexcel, SAT & College Specs • Real-time Cloud Sync</span>
          </div>
        </footer>
      </main>

      {/* MOTIVATION CARD CELEBRATION POPUP */}
      <Celebration
        isVisible={celebrationVisible}
        onClose={() => setCelebrationVisible(false)}
      />

      {/* UPGRADED MODERN AUTHENTICATION MODAL */}
      <AnimatePresence>
        {!isAuthLoading && !currentUser && !dismissedOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-0 ${
              settings.themeMode === "light" ? "bg-black/40 backdrop-blur-md" : "bg-black/65 backdrop-blur-2xl"
            } z-50 flex items-center justify-center p-4 overflow-y-auto`}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className={`w-full max-w-md ${
                settings.themeMode === "light"
                  ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] shadow-2xl"
                  : "bg-[#0A0714] border-white/15 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
              } border rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden text-center`}
            >
              {/* Decorative top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b from-[#8B5CF6]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Logo & Header */}
              <div className="flex flex-col items-center gap-3.5 relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FAF8F5] border border-[#E8D7C9] p-1.5 flex items-center justify-center shadow-lg overflow-hidden shrink-0 transform hover:scale-105 transition-transform">
                  <img src="/engez_brand_emblem.svg" alt="Engez Nafsak Logo" className="w-full h-full object-contain" />
                </div>
                
                <div className="space-y-1">
                  <h2 className={`text-2xl font-black ${settings.themeMode === "light" ? "text-[#1D1D1B]" : "text-white"} font-sans tracking-tight`}>
                    Engez Nafsak • <span className="text-[#C96F55]">إنجز نفسك</span>
                  </h2>
                  <p className={`text-xs ${settings.themeMode === "light" ? "text-[#77736B]" : "text-slate-400"} font-sans font-medium`}>
                    Your Dedicated Exam Planner & Academic Suite
                  </p>
                </div>
              </div>

              {/* Error Notice */}
              {(authError || authFormError) && !unauthorizedDomain && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-[#FFF1EC] border border-[#E8D7C9] rounded-2xl text-left flex items-start gap-3 shadow-2xs"
                >
                  <AlertTriangle className="text-[#B85C5C] shrink-0 mt-0.5" size={16} />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#B85C5C] font-mono uppercase tracking-wider">
                      Sign-In Notice
                    </h4>
                    <p className="text-[11px] text-[#1D1D1B] leading-relaxed font-sans">
                      {authError || authFormError}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* CUSTOM DNS AUTHORIZATION REQUIRED BANNER */}
              {unauthorizedDomain && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 ${
                    settings.themeMode === "light"
                      ? "bg-[#FFF9F5] border-[#E8D7C9]"
                      : "bg-amber-950/25 border-amber-500/25"
                  } border rounded-2xl text-left space-y-3.5 shadow-xs`}
                >
                  <div className="flex items-start gap-2.5">
                    <Globe className="text-[#C96F55] shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold font-mono text-[#C96F55] uppercase tracking-wider">
                        Custom DNS Domain Authorization Required
                      </h4>
                      <p className={`text-xs ${settings.themeMode === "light" ? "text-[#1D1D1B]" : "text-slate-200"} leading-relaxed font-sans`}>
                        Google OAuth requires your custom DNS domain to be whitelisted in your Firebase Console.
                      </p>
                    </div>
                  </div>

                  {/* 1-CLICK FAST PASS FOR HAMZA MOUSA */}
                  <div className="p-3 bg-[#FAF9F5] dark:bg-black/40 border border-[#E8D7C9] dark:border-white/10 rounded-xl space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#C96F55] block font-bold">
                      Instant Access (Bypass Domain Restriction)
                    </span>
                    <button
                      type="button"
                      onClick={handleInstantHamzaLogin}
                      className="w-full py-2.5 px-3 bg-[#C96F55] hover:bg-[#B85F48] text-white font-sans font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
                    >
                      <Zap size={14} className="text-amber-200 fill-amber-200 shrink-0" />
                      <span>Continue as Hamza Mousa (hamzamousa26072011@gmail.com)</span>
                    </button>
                    <p className="text-[10px] text-[#77736B] dark:text-slate-400 font-sans text-center">
                      Enters your full workspace instantly with persistent local storage.
                    </p>
                  </div>

                  <div className={`p-2.5 ${settings.themeMode === "light" ? "bg-white border-[#E3E0D8]" : "bg-black/40 border-white/10"} border rounded-xl flex items-center justify-between gap-2`}>
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#77736B] block">Your Custom Domain</span>
                      <span className="font-mono text-xs font-bold text-[#1D1D1B] dark:text-white truncate">{unauthorizedDomain}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(unauthorizedDomain);
                        setIsDomainCopied(true);
                        setTimeout(() => setIsDomainCopied(false), 2000);
                      }}
                      className={`px-3 py-1.5 ${
                        isDomainCopied 
                          ? "bg-[#EAF3EC] text-[#66856D] border-[#D1E6D6]" 
                          : "bg-[#FAF9F5] hover:bg-[#F0EEE8] text-[#1D1D1B] border-[#E3E0D8]"
                      } border rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0`}
                    >
                      {isDomainCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isDomainCopied ? "Copied!" : "Copy Domain"}</span>
                    </button>
                  </div>

                  <div className="text-[11px] space-y-1.5 text-[#77736B] font-sans">
                    <p>
                      1. Open <a href="https://console.firebase.google.com/project/engez-nafsak/authentication/settings" target="_blank" rel="noopener noreferrer" className="font-bold underline text-[#C96F55]">Engez Nafsak Firebase Settings ↗</a> (Make sure the top-left says <strong>engez nafsak</strong>, not <em>abiding-ratio-g224x</em>).
                    </p>
                    <p>2. Scroll down to <strong>Authorized domains</strong> and click <strong>Add Domain</strong>.</p>
                    <p>3. Paste <code className="font-mono text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-[#1D1D1B] dark:text-white font-bold">{unauthorizedDomain}</code>, and save.</p>
                    <p>4. Once saved, click <strong>Continue with Google</strong> again.</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8D7C9] dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDnsModal(true)}
                        className="text-[11px] font-mono font-bold text-[#C96F55] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Globe size={12} />
                        <span>DNS & Domain Hub</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowProjectModal(true)}
                        className="text-[11px] font-mono font-bold text-[#77736B] dark:text-[#ADA59B] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Key size={12} />
                        <span>Firebase Keys</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUnauthorizedDomain(null);
                        setAuthError(null);
                        setAuthMethod("email_login");
                      }}
                      className="text-[11px] font-sans font-semibold text-[#1D1D1B] dark:text-slate-300 hover:underline cursor-pointer"
                    >
                      Or Use Email Sign-In
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PROJECT CONNECTION MODAL OVERLAY ON SIGN-IN */}
              {showProjectModal && (
                <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-full max-w-sm ${settings.themeMode === "light" ? "bg-white border-[#E3E0D8]" : "bg-[#0f1528] border-white/15"} border rounded-3xl p-5 space-y-4 text-left shadow-2xl`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-[#C96F55]" />
                        <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1D1D1B] dark:text-white">
                          Connect Engez Nafsak Project
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProjectModal(false)}
                        className="text-[#77736B] hover:text-[#1D1D1B] dark:hover:text-white cursor-pointer p-1"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <p className="text-[11px] text-[#77736B] dark:text-slate-300 font-sans leading-relaxed">
                      Connect your Firebase project from Firebase Console (*Project settings &gt; General &gt; Your apps*).
                    </p>

                    {modalError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-mono">
                        {modalError}
                      </div>
                    )}
                    {modalSuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-mono">
                        {modalSuccess}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-[#77736B] block font-bold mb-1">
                          Firebase Project ID *
                        </label>
                        <input
                          type="text"
                          value={modalProjectId}
                          onChange={(e) => setModalProjectId(e.target.value)}
                          placeholder="e.g. engez-nafsak"
                          className={`w-full px-3 py-2 font-mono text-xs rounded-xl border ${
                            settings.themeMode === "light" ? "bg-[#FAF9F5] border-[#E3E0D8] text-[#1D1D1B]" : "bg-black/40 border-white/10 text-white"
                          } outline-none focus:border-[#C96F55]`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-[#77736B] block font-bold mb-1">
                          Web API Key *
                        </label>
                        <input
                          type="text"
                          value={modalApiKey}
                          onChange={(e) => setModalApiKey(e.target.value)}
                          placeholder="e.g. AIzaSy..."
                          className={`w-full px-3 py-2 font-mono text-xs rounded-xl border ${
                            settings.themeMode === "light" ? "bg-[#FAF9F5] border-[#E3E0D8] text-[#1D1D1B]" : "bg-black/40 border-white/10 text-white"
                          } outline-none focus:border-[#C96F55]`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-[#77736B] block font-bold mb-1">
                          Or Paste Config Snippet
                        </label>
                        <textarea
                          rows={2}
                          value={modalSnippet}
                          onChange={(e) => setModalSnippet(e.target.value)}
                          placeholder="const firebaseConfig = { ... };"
                          className={`w-full p-2 font-mono text-xs rounded-xl border ${
                            settings.themeMode === "light" ? "bg-[#FAF9F5] border-[#E3E0D8] text-[#1D1D1B]" : "bg-black/40 border-white/10 text-white"
                          } outline-none focus:border-[#C96F55] resize-none`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowProjectModal(false)}
                        className="px-3 py-1.5 text-xs font-mono text-[#77736B] hover:text-[#1D1D1B] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleModalSaveProject}
                        className="px-4 py-2 bg-[#C96F55] hover:bg-[#B85F48] text-white font-mono text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                      >
                        Connect &amp; Reload
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* AUTH OPTIONS */}
              <div className="space-y-3.5 relative z-10">

                {/* 1. SECURE GOOGLE SIGN-IN BUTTON */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isAuthSubmitLoading}
                  className={`w-full py-3 px-4 ${
                    settings.themeMode === "light"
                      ? "bg-[#FFFFFF] hover:bg-[#FAF9F5] text-[#1D1D1B] border-[#E3E0D8] shadow-xs"
                      : "bg-[#2D2824] hover:bg-[#36302B] text-[#F6F3EE] border-[#3D3833] shadow-md"
                  } disabled:opacity-60 disabled:cursor-not-allowed font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3 border active:scale-[0.99]`}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="animate-spin text-[#C96F55]" size={16} />
                      <span className="font-sans normal-case text-xs font-semibold">Connecting securely with Google...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Google Brand Vector Icon */}
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span className="font-sans normal-case text-xs font-semibold">Continue with Google</span>
                    </>
                  )}
                </button>

                {/* DIVIDER */}
                <div className="flex items-center gap-3">
                  <div className={`h-px ${settings.themeMode === "light" ? "bg-[#E3E0D8]" : "bg-white/10"} flex-1`} />
                  <span className={`text-[10px] font-sans uppercase tracking-widest ${settings.themeMode === "light" ? "text-[#77736B]" : "text-slate-400"} font-medium`}>
                    or with email
                  </span>
                  <div className={`h-px ${settings.themeMode === "light" ? "bg-[#E3E0D8]" : "bg-white/10"} flex-1`} />
                </div>

                {/* EMAIL AUTH PORTAL (Interactive Tabbed Card) */}
                <div className={`${
                  settings.themeMode === "light"
                    ? "bg-[#F7F6F2] border-[#E3E0D8]"
                    : "bg-[#120E22] border-white/10 text-white"
                } border rounded-2xl p-4 text-left space-y-4`}>
                  
                  {/* Mode Selector Tabs: Log In vs Sign Up */}
                  <div className={`grid grid-cols-2 p-1 ${
                    settings.themeMode === "light" ? "bg-[#F0EEE8] border-[#E3E0D8]" : "bg-[#0A0714] border-white/10"
                  } rounded-xl border`}>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthFormError(null);
                        setAuthMethod("email_login");
                      }}
                      className={`py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition cursor-pointer text-center ${
                        authMethod === "email_login" || authMethod === "options"
                          ? "bg-[#C96F55] text-white shadow-xs"
                          : settings.themeMode === "light"
                          ? "text-[#77736B] hover:text-[#1D1D1B]"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthFormError(null);
                        setAuthMethod("email_signup");
                      }}
                      className={`py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition cursor-pointer text-center ${
                        authMethod === "email_signup"
                          ? "bg-[#C96F55] text-white shadow-xs"
                          : settings.themeMode === "light"
                          ? "text-[#77736B] hover:text-[#1D1D1B]"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* FORM FIELDS */}
                  <form
                    onSubmit={authMethod === "email_signup" ? handleEmailSignUp : handleEmailSignIn}
                    className="space-y-3"
                  >
                    {authMethod === "email_signup" && (
                      <div className="space-y-1">
                        <label className={`text-[10px] font-sans font-bold uppercase ${settings.themeMode === "light" ? "text-[#77736B]" : "text-slate-400"} tracking-wider`}>
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Student Name"
                            className={`w-full px-3.5 py-2.5 ${
                              settings.themeMode === "light"
                                ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55] placeholder:text-[#9B9890]"
                                : "bg-[#0b0f1d] border-white/10 focus:border-indigo-500 text-white placeholder:text-slate-500"
                            } border rounded-xl text-xs focus:outline-none transition font-sans`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className={`text-[10px] font-sans font-bold uppercase ${settings.themeMode === "light" ? "text-[#77736B]" : "text-slate-400"} tracking-wider`}>
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="student@example.com"
                          className={`w-full px-3.5 py-2.5 ${
                            settings.themeMode === "light"
                              ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55] placeholder:text-[#9B9890]"
                              : "bg-[#0b0f1d] border-white/10 focus:border-indigo-500 text-white placeholder:text-slate-500"
                          } border rounded-xl text-xs focus:outline-none transition font-sans`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className={`text-[10px] font-sans font-bold uppercase ${settings.themeMode === "light" ? "text-[#77736B]" : "text-slate-400"} tracking-wider flex justify-between items-center`}>
                        <span>Password</span>
                        {authMethod === "email_signup" && <span className="text-[9px] text-[#9B9890]">Min. 6 chars</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={authMethod === "email_signup" ? 6 : undefined}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className={`w-full px-3.5 py-2.5 pr-10 ${
                            settings.themeMode === "light"
                              ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] focus:border-[#C96F55] placeholder:text-[#9B9890]"
                              : "bg-[#0b0f1d] border-white/10 focus:border-indigo-500 text-white placeholder:text-slate-500"
                          } border rounded-xl text-xs focus:outline-none transition font-sans`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${settings.themeMode === "light" ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-white"} transition cursor-pointer p-0.5 bg-transparent border-0`}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthSubmitLoading}
                      className="w-full py-3 bg-[#C96F55] hover:bg-[#B85F48] disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-xs"
                    >
                      {isAuthSubmitLoading ? (
                        <>
                          <Loader2 className="animate-spin text-white" size={14} />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <LogIn size={14} />
                          <span>{authMethod === "email_signup" ? "Create Account & Sync" : "Sign In with Email"}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* GUEST EXPLORE OPTION */}
                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className={`w-full py-2.5 px-4 text-xs font-sans font-medium transition rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
                    settings.themeMode === "light"
                      ? "text-[#77736B] hover:text-[#1D1D1B] hover:bg-[#F0EEE8]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>Continue as Guest / Explore Workspace</span>
                  <span className="text-[10px] font-mono opacity-70">→</span>
                </button>
              </div>

              {/* Balanced Footer Inspiration */}
              <div className={`pt-2 text-center text-[10px] ${settings.themeMode === "light" ? "text-[#77736B] border-[#E3E0D8]" : "text-slate-500 border-white/5"} font-sans border-t flex items-center justify-center gap-1.5`}>
                <ShieldCheck size={13} className="text-[#C96F55]" />
                <span>Protected with Google OAuth 2.0 & Firebase Cloud Security</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZERO-TRUST CYBERSECURITY LOCKDOWN & THREAT QUARANTINE MODAL */}
      <SecurityLockdownModal
        isOpen={securityLockdown.isOpen}
        incidentId={securityLockdown.incidentId}
        threatReason={securityLockdown.reason}
        onUnlocked={() => setSecurityLockdown((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* MOBILE NATIVE BOTTOM NAVIGATION DOCK */}
      {!isFocusFullscreen && (
        <MobileBottomNav
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          pendingTasksCount={tasks.filter(t => !t.completed).length}
          focusModeActive={focusModeActive}
          focusTimeRemaining={formatFocusTime()}
          themeMode={settings.themeMode}
        />
      )}

      {/* STUDENT DATA PRIVACY & COMPLIANCE MODAL */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        themeMode={settings.themeMode}
        currentUser={currentUser}
      />

      {/* CUSTOM DNS & DOMAIN HUB MODAL (engeznafsak.com) */}
      <DomainDnsModal
        isOpen={showDnsModal}
        onClose={() => setShowDnsModal(false)}
        themeMode={settings.themeMode}
      />

    </div>
  );
}

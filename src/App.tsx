import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Task, PastPaper, ChatMessage, StudyApp, HabitItem, HabitDayLog } from "./types";
import { useScreenWakeLock } from "./hooks/useScreenWakeLock";
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
  X,
  HelpCircle
} from "lucide-react";
import UserGuideModal from "./components/UserGuideModal";

// Import modular components
import Sidebar from "./components/Sidebar";
import Celebration from "./components/Celebration";
import DashboardTab from "./components/DashboardTab";
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
import { EngezBrandLogo } from "./components/EngezBrandLogo";
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

  // Ensure vertical mouse wheel scrolling is never locked when switching tabs
  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [currentTab]);



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

  // User Guide Modal: opens automatically ONLY on 1st time visit for users who ARE NOT signed in
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // Wait until auth state check has settled
    if (isAuthLoading) return;

    // Never show or keep open guide for signed-in users
    if (currentUser) {
      setIsGuideOpen(false);
      return;
    }

    // Only for visitors who aren't signed in and haven't seen/skipped the guide yet
    const hasSeenGuide = localStorage.getItem("ENGEZ_USER_GUIDE_SEEN_V1");
    if (!hasSeenGuide) {
      const timer = setTimeout(() => {
        setIsGuideOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading, currentUser]);

  const handleCloseGuide = () => {
    setIsGuideOpen(false);
    localStorage.setItem("ENGEZ_USER_GUIDE_SEEN_V1", "true");
  };

  const handleSkipGuide = () => {
    setIsGuideOpen(false);
    localStorage.setItem("ENGEZ_USER_GUIDE_SEEN_V1", "true");
  };

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
      const code = err?.code || "";
      const msg = err?.message || String(err);

      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        msg.includes("popup-closed-by-user")
      ) {
        setAuthError("Google Sign-In window was closed before completing sign-in. Please try again when ready.");
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
  // Keep the device screen awake whenever the study timer is active
  useScreenWakeLock(focusModeActive);
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
      
      setStreak((prev) => prev + 1);
      setPomodoroCompletedCount((prev) => prev + 1);
      setCelebrationVisible(true);
      setFocusSecondsRemaining(focusMinutesSelected * 60);
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
    const hasExplicitThemeChoice = localStorage.getItem("ENGEZ_THEME_USER_OVERRIDE");
    const saved = localStorage.getItem("ENGEZ_SETTINGS_V3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!hasExplicitThemeChoice) {
          return {
            ...parsed,
            themeMode: "dark" as "light" | "dark"
          };
        }
        return {
          ...parsed,
          themeMode: parsed.themeMode || "dark"
        };
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    return {
      timeSystem: "12" as "12" | "24",
      themeMode: "dark" as "light" | "dark"
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

    // Dynamically update favicon and touch icons to match the active theme
    const favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    const appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    const iconPath = settings.themeMode === "light" 
      ? "/engez_brand_emblem.svg?v=4" 
      : "/engez_brand_emblem_dark.svg?v=4";
    if (favicon) {
      favicon.href = iconPath;
    }
    if (appleIcon) {
      appleIcon.href = iconPath;
    }
  }, [settings]);

  const handleUpdateSettings = (newSettingsFields: Partial<typeof settings>) => {
    if (newSettingsFields.themeMode) {
      localStorage.setItem("ENGEZ_THEME_USER_OVERRIDE", "true");
    }
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
  // Empty default habits list - no test subjects or placeholder habits
  const DEFAULT_HABITS: HabitItem[] = [];

  // Helper to filter out any test subjects or placeholder habits
  const isTestSubjectHabit = (h: HabitItem) => {
    if (!h) return false;
    const testIds = ["habit_1", "habit_2", "habit_3", "habit_4"];
    const testNames = ["Workout", "Solve Chemistry", "Solve Math", "Solve CS"];
    return testIds.includes(h.id) || testNames.includes(h.name);
  };

  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userHabits = localStorage.getItem(`ENGEZ_USER_HABITS_${parsedUser.uid}`);
          if (userHabits) {
            const parsed = JSON.parse(userHabits);
            if (Array.isArray(parsed?.habits)) {
              return parsed.habits.filter((h: HabitItem) => !isTestSubjectHabit(h));
            }
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_HABITS_LIST_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((h: HabitItem) => !isTestSubjectHabit(h));
        }
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

            // If cloud has habits, load them (filtering out any test subjects)
            if (Array.isArray(cloudData.habits)) {
              const cleanedHabits = cloudData.habits.filter((h: HabitItem) => !isTestSubjectHabit(h));
              setHabits(cleanedHabits);
              if (cloudData.habitLogs) setHabitLogs(cloudData.habitLogs);
              if (cloudData.habitStartDate) setHabitStartDate(cloudData.habitStartDate);
              localStorage.setItem(`ENGEZ_USER_HABITS_${activeUser.uid}`, JSON.stringify({
                habits: cleanedHabits,
                habitLogs: cloudData.habitLogs || {},
                habitStartDate: cloudData.habitStartDate || habitStartDate
              }));
              if (cleanedHabits.length !== cloudData.habits.length) {
                await saveUserHabits(activeUser.uid, cleanedHabits, cloudData.habitLogs || {}, cloudData.habitStartDate || habitStartDate);
              }
            } else {
              const cachedHabits = localStorage.getItem(`ENGEZ_USER_HABITS_${activeUser.uid}`);
              if (cachedHabits) {
                try {
                  const parsedH = JSON.parse(cachedHabits);
                  if (Array.isArray(parsedH.habits)) {
                    const cleanedH = parsedH.habits.filter((h: HabitItem) => !isTestSubjectHabit(h));
                    setHabits(cleanedH);
                    if (parsedH.habitLogs) setHabitLogs(parsedH.habitLogs);
                    if (parsedH.habitStartDate) setHabitStartDate(parsedH.habitStartDate);
                    await saveUserHabits(activeUser.uid, cleanedH, parsedH.habitLogs || {}, parsedH.habitStartDate || habitStartDate);
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
    <div
      className={`flex min-h-screen w-full ${
        settings.themeMode === "light"
          ? "bg-[#F6F7FA] text-[#18202B]"
          : "bg-[#10131A] text-[#F1F3F8]"
      } relative transition-colors duration-200 font-sans`}
    >
      {/* Calm Academic Backdrop */}
      <CyberWaveBackground isLight={settings.themeMode === "light"} />

      {/* Desktop Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        focusModeActive={focusModeActive}
        focusTimeRemaining={formatFocusTime()}
        currentUser={currentUser}
        isAuthLoading={isAuthLoading || isGoogleLoading}
        onLogin={handleOpenAuthModal}
        onLogout={handleLogout}
        isFirestoreOffline={offlineMode}
        themeMode={settings.themeMode}
      />

      {/* Primary Content Area */}
      <main className="flex-1 min-w-0 p-3 sm:p-5 md:p-6 lg:p-8 pb-28 md:pb-10 space-y-5 md:space-y-6 flex flex-col justify-between max-w-7xl mx-auto w-full relative z-10">
        {/* Top Workspace Bar */}
        <header
          className={`flex flex-row items-center justify-between gap-3 border rounded-2xl p-3 sm:p-4 md:px-5 transition-colors ${
            settings.themeMode === "light"
              ? "bg-[#FFFFFF] border-[#E2E6EE] text-[#18202B] shadow-[0_1px_2px_rgba(24,32,43,0.04)]"
              : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8]"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border p-1 flex items-center justify-center shrink-0 overflow-hidden ${
                settings.themeMode === "light"
                  ? "bg-[#F6F7FA] border-[#E2E6EE]"
                  : "bg-[#222938] border-[#2B3344]"
              }`}
            >
              <EngezBrandLogo
                themeMode={settings.themeMode}
                withContainer={false}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-sm sm:text-base tracking-tight truncate ${
                    settings.themeMode === "light" ? "text-[#18202B]" : "text-[#F1F3F8]"
                  }`}
                >
                  Engez Nafsak
                </span>
                <span
                  lang="ar"
                  dir="rtl"
                  className={`text-xs font-arabic font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                    settings.themeMode === "light"
                      ? "bg-[#EFEEFA] border-[#D6D2F6] text-[#5F55C8]"
                      : "bg-[#5F55C8]/15 border-[#A99BFF]/30 text-[#A99BFF]"
                  }`}
                >
                  إنجز نفسك
                </span>
              </div>
              <p
                className={`text-xs truncate mt-0.5 ${
                  settings.themeMode === "light" ? "text-[#596474]" : "text-[#B7C0CF]"
                }`}
              >
                {tasks.filter((t) => !t.completed).length} open{" "}
                {tasks.filter((t) => !t.completed).length === 1 ? "task" : "tasks"} •{" "}
                {exams.length} {exams.length === 1 ? "exam" : "exams"} scheduled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Live Focus Timer Pill */}
            <button
              type="button"
              onClick={() => setCurrentTab("focus")}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[38px] ${
                focusModeActive
                  ? settings.themeMode === "light"
                    ? "bg-[#EFEEFA] border-[#5F55C8] text-[#5F55C8]"
                    : "bg-[#5F55C8]/25 border-[#A99BFF] text-[#A99BFF]"
                  : settings.themeMode === "light"
                  ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#18202B] hover:bg-[#ECEFF5]"
                  : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:bg-[#2B3344]"
              }`}
              title="Open Focus Timer"
            >
              <Clock
                size={13}
                className={
                  focusModeActive
                    ? settings.themeMode === "light"
                      ? "text-[#5F55C8]"
                      : "text-[#A99BFF]"
                    : settings.themeMode === "light"
                    ? "text-[#596474]"
                    : "text-[#B7C0CF]"
                }
              />
              <span className="tabular-nums">{formatFocusTime()}</span>
              {focusModeActive && (
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    settings.themeMode === "light" ? "bg-[#5F55C8]" : "bg-[#A99BFF]"
                  }`}
                />
              )}
            </button>

            {/* User Guide Button */}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[38px] ${
                settings.themeMode === "light"
                  ? "bg-[#F6F7FA] hover:bg-[#ECEFF5] border-[#E2E6EE] text-[#18202B]"
                  : "bg-[#222938] hover:bg-[#2B3344] border-[#2B3344] text-[#F1F3F8]"
              }`}
              title="Open Workspace Guide"
            >
              <HelpCircle
                size={14}
                className={settings.themeMode === "light" ? "text-[#5F55C8]" : "text-[#A99BFF]"}
              />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Streak Indicator */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 min-h-[38px] ${
                settings.themeMode === "light"
                  ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#18202B]"
                  : "bg-[#222938] border-[#2B3344] text-[#F1F3F8]"
              }`}
              title={`Current study streak: ${streak} ${streak === 1 ? "day" : "days"}`}
            >
              <Flame
                size={13}
                className={
                  streak > 0
                    ? "text-[#B86E00] fill-[#B86E00]"
                    : settings.themeMode === "light"
                    ? "text-[#7A8699]"
                    : "text-[#8590A2]"
                }
              />
              <span>{streak}d</span>
            </div>

            {/* User Account Pill */}
            {currentUser ? (
              <div
                className={`flex items-center gap-2 border px-2.5 sm:px-3 py-1.5 rounded-xl min-h-[38px] ${
                  settings.themeMode === "light"
                    ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#18202B]"
                    : "bg-[#222938] border-[#2B3344] text-[#F1F3F8]"
                }`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "Student"}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      settings.themeMode === "light"
                        ? "bg-[#EFEEFA] text-[#5F55C8]"
                        : "bg-[#5F55C8]/25 text-[#A99BFF]"
                    }`}
                  >
                    <UserIcon size={12} />
                  </div>
                )}
                <span className="text-xs font-semibold max-w-[96px] truncate hidden md:inline">
                  {currentUser.displayName || currentUser.email?.split("@")[0] || "Student"}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className={`p-1 rounded transition cursor-pointer ${
                    settings.themeMode === "light"
                      ? "text-[#596474] hover:text-[#C93B3B]"
                      : "text-[#B7C0CF] hover:text-[#F87171]"
                  }`}
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenAuthModal}
                className="px-3.5 py-1.5 bg-[#5F55C8] hover:bg-[#4E45B0] text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 min-h-[38px]"
              >
                <LogIn size={13} />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Main View Router */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {currentTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <DashboardTab
                  tasks={tasks}
                  exams={exams}
                  habits={habits}
                  habitLogs={habitLogs}
                  subjects={subjects}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  focusModeActive={focusModeActive}
                  focusTimeRemaining={formatFocusTime()}
                  focusMinutesSelected={focusMinutesSelected}
                  onStartFocus={handleStartFocus}
                  onPauseFocus={handlePauseFocus}
                  onResetFocus={handleResetFocus}
                  onStopFocus={handleStopFocus}
                  onNavigateTab={(tab) => {
                    setCurrentTab(tab);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  streak={streak}
                  pomodoroMode={pomodoroMode}
                  isPaused={isTimerPaused}
                  pomodoroCount={pomodoroCompletedCount}
                  themeMode={settings.themeMode}
                  currentUser={currentUser}
                />
              </motion.div>
            )}

            {currentTab === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
                  totalFocusMinutes={
                    Math.floor((focusMinutesSelected * 60 - focusSecondsRemaining) / 60) +
                    pomodoroCompletedCount * 25
                  }
                  userStreak={streak}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}

            {currentTab === "habits" && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
                  offlineMode={offlineMode}
                  focusMinutesSelected={focusMinutesSelected}
                  onDurationChange={handleDurationChange}
                  tasksCount={tasks.length}
                  onClearWorkspace={() => {
                    setTasks([]);
                    setStreak(0);
                    localStorage.setItem("ENGEZ_TASKS_V3", "[]");
                    localStorage.setItem("ENGEZ_STREAK_V4", "0");
                  }}
                  onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
                  onOpenDnsModal={() => setShowDnsModal(true)}
                  onOpenUserGuide={() => setIsGuideOpen(true)}
                  isGoogleLoading={isGoogleLoading}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Truthful Workspace Footer */}
        <footer
          className={`border-t pt-5 flex flex-col sm:flex-row items-center justify-between text-xs gap-3 mt-8 shrink-0 ${
            settings.themeMode === "light"
              ? "border-[#E2E6EE] text-[#596474]"
              : "border-[#2B3344] text-[#B7C0CF]"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-medium">
              Engez Nafsak (<span lang="ar" dir="rtl" className="font-arabic">إنجز نفسك</span>) • Academic Study Workspace
            </span>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className={`underline transition cursor-pointer font-medium ${
                settings.themeMode === "light" ? "hover:text-[#5F55C8]" : "hover:text-[#A99BFF]"
              }`}
            >
              Privacy & Data Policy
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                currentUser && !currentUser.isAnonymous && !offlineMode && !currentUser.uid?.startsWith("local-")
                  ? "bg-[#1F7A4C]"
                  : "bg-[#B86E00]"
              }`}
            />
            <span>
              {currentUser && !currentUser.isAnonymous && !offlineMode && !currentUser.uid?.startsWith("local-")
                ? "Signed in • Cloud & local persistence active"
                : "Local browser storage active"}
            </span>
          </div>
        </footer>
      </main>

      {/* Focus Session Celebration Modal */}
      <Celebration
        isVisible={celebrationVisible}
        onClose={() => setCelebrationVisible(false)}
      />

      {/* Authentication & Guest Access Modal */}
      <AnimatePresence>
        {!isAuthLoading && !currentUser && !dismissedOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-heading"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-md border rounded-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden text-center my-auto ${
                settings.themeMode === "light"
                  ? "bg-[#FFFFFF] border-[#E2E6EE] text-[#18202B] shadow-2xl"
                  : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8] shadow-2xl"
              }`}
            >
              {/* Brand Emblem & Heading */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl border p-1.5 flex items-center justify-center overflow-hidden shrink-0 ${
                    settings.themeMode === "light"
                      ? "bg-[#F6F7FA] border-[#E2E6EE]"
                      : "bg-[#222938] border-[#2B3344]"
                  }`}
                >
                  <EngezBrandLogo
                    themeMode={settings.themeMode}
                    withContainer={false}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <h2
                    id="auth-modal-heading"
                    className={`text-xl sm:text-2xl font-bold tracking-tight ${
                      settings.themeMode === "light" ? "text-[#18202B]" : "text-[#F1F3F8]"
                    }`}
                  >
                    Engez Nafsak •{" "}
                    <span
                      lang="ar"
                      dir="rtl"
                      className={`font-arabic ${
                        settings.themeMode === "light" ? "text-[#5F55C8]" : "text-[#A99BFF]"
                      }`}
                    >
                      إنجز نفسك
                    </span>
                  </h2>
                  <p
                    className={`text-xs ${
                      settings.themeMode === "light" ? "text-[#596474]" : "text-[#B7C0CF]"
                    }`}
                  >
                    Sign in to link your study workspace, or continue with local browser storage.
                  </p>
                </div>
              </div>

              {/* Error Notice */}
              {(authError || authFormError) && !unauthorizedDomain && (
                <div
                  role="alert"
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 ${
                    settings.themeMode === "light"
                      ? "bg-[#FDECEC] border-[#F7C6C6] text-[#C93B3B]"
                      : "bg-[#3A1D24] border-[#C93B3B]/40 text-[#FCA5A5]"
                  }`}
                >
                  <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold">Sign-In Notice</div>
                    <p className="leading-relaxed">{authError || authFormError}</p>
                  </div>
                </div>
              )}

              {/* Unauthorized Domain Notice */}
              {unauthorizedDomain && (
                <div
                  role="alert"
                  className={`p-4 rounded-xl border text-left space-y-2.5 text-xs ${
                    settings.themeMode === "light"
                      ? "bg-[#FEF5E7] border-[#F8D9A0] text-[#18202B]"
                      : "bg-[#332714] border-[#B86E00]/40 text-[#F1F3F8]"
                  }`}
                >
                  <div className="font-bold text-[#B86E00] flex items-center gap-1.5">
                    <Globe size={14} />
                    <span>Google Sign-In Domain Not Authorized</span>
                  </div>
                  <p className={settings.themeMode === "light" ? "text-[#596474]" : "text-[#B7C0CF]"}>
                    The current domain (<code className="font-mono font-semibold">{unauthorizedDomain}</code>) is not yet listed in Firebase Authorized Domains. You can sign in with Email below or continue as a Guest.
                  </p>
                </div>
              )}

              {/* Auth Options */}
              <div className="space-y-3.5">
                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isAuthSubmitLoading}
                  className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60 ${
                    settings.themeMode === "light"
                      ? "bg-[#FFFFFF] hover:bg-[#F6F7FA] text-[#18202B] border-[#D0D7E2]"
                      : "bg-[#222938] hover:bg-[#2B3344] text-[#F1F3F8] border-[#2B3344]"
                  }`}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="animate-spin text-[#5F55C8]" size={16} />
                      <span>Connecting with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div
                    className={`h-px flex-1 ${
                      settings.themeMode === "light" ? "bg-[#E2E6EE]" : "bg-[#2B3344]"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      settings.themeMode === "light" ? "text-[#596474]" : "text-[#B7C0CF]"
                    }`}
                  >
                    or with email
                  </span>
                  <div
                    className={`h-px flex-1 ${
                      settings.themeMode === "light" ? "bg-[#E2E6EE]" : "bg-[#2B3344]"
                    }`}
                  />
                </div>

                {/* Email Sign-In / Sign-Up Card */}
                <div
                  className={`border rounded-xl p-4 text-left space-y-3.5 ${
                    settings.themeMode === "light"
                      ? "bg-[#F6F7FA] border-[#E2E6EE]"
                      : "bg-[#10131A] border-[#2B3344]"
                  }`}
                >
                  <div
                    className={`grid grid-cols-2 p-1 rounded-lg border ${
                      settings.themeMode === "light"
                        ? "bg-white border-[#E2E6EE]"
                        : "bg-[#191E28] border-[#2B3344]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAuthFormError(null);
                        setAuthMethod("email_login");
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer text-center ${
                        authMethod === "email_login" || authMethod === "options"
                          ? "bg-[#5F55C8] text-white"
                          : settings.themeMode === "light"
                          ? "text-[#596474] hover:text-[#18202B]"
                          : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthFormError(null);
                        setAuthMethod("email_signup");
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer text-center ${
                        authMethod === "email_signup"
                          ? "bg-[#5F55C8] text-white"
                          : settings.themeMode === "light"
                          ? "text-[#596474] hover:text-[#18202B]"
                          : "text-[#B7C0CF] hover:text-[#F1F3F8]"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  <form
                    onSubmit={authMethod === "email_signup" ? handleEmailSignUp : handleEmailSignIn}
                    className="space-y-3"
                  >
                    {authMethod === "email_signup" && (
                      <div>
                        <label
                          htmlFor="auth-full-name"
                          className={`block text-xs font-semibold mb-1 ${
                            settings.themeMode === "light" ? "text-[#18202B]" : "text-[#F1F3F8]"
                          }`}
                        >
                          Full Name
                        </label>
                        <input
                          id="auth-full-name"
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className={`w-full min-h-[40px] px-3.5 py-2 border rounded-xl text-xs focus:outline-none ${
                            settings.themeMode === "light"
                              ? "bg-white border-[#D0D7E2] text-[#18202B] focus:border-[#5F55C8]"
                              : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                          }`}
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="auth-email"
                        className={`block text-xs font-semibold mb-1 ${
                          settings.themeMode === "light" ? "text-[#18202B]" : "text-[#F1F3F8]"
                        }`}
                      >
                        Email Address
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className={`w-full min-h-[40px] px-3.5 py-2 border rounded-xl text-xs focus:outline-none ${
                          settings.themeMode === "light"
                            ? "bg-white border-[#D0D7E2] text-[#18202B] focus:border-[#5F55C8]"
                            : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="auth-password"
                        className={`flex justify-between items-center text-xs font-semibold mb-1 ${
                          settings.themeMode === "light" ? "text-[#18202B]" : "text-[#F1F3F8]"
                        }`}
                      >
                        <span>Password</span>
                        {authMethod === "email_signup" && (
                          <span className="font-normal opacity-75">At least 6 characters</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={authMethod === "email_signup" ? 6 : undefined}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className={`w-full min-h-[40px] px-3.5 py-2 pr-10 border rounded-xl text-xs focus:outline-none ${
                            settings.themeMode === "light"
                              ? "bg-white border-[#D0D7E2] text-[#18202B] focus:border-[#5F55C8]"
                              : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer ${
                            settings.themeMode === "light" ? "text-[#596474]" : "text-[#B7C0CF]"
                          }`}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthSubmitLoading}
                      className="w-full min-h-[42px] py-2.5 bg-[#5F55C8] hover:bg-[#4E45B0] disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      {isAuthSubmitLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <LogIn size={14} />
                          <span>
                            {authMethod === "email_signup" ? "Create Account" : "Sign In with Email"}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Guest Access Option */}
                <button
                  type="button"
                  onClick={handleGuestAccess}
                  className={`w-full min-h-[42px] py-2.5 px-4 text-xs font-semibold transition rounded-xl border cursor-pointer flex items-center justify-center gap-2 ${
                    settings.themeMode === "light"
                      ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] hover:bg-[#ECEFF5]"
                      : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:bg-[#2B3344]"
                  }`}
                >
                  <span>Continue as Guest (Saved on This Device)</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Lockdown Modal */}
      <SecurityLockdownModal
        isOpen={securityLockdown.isOpen}
        incidentId={securityLockdown.incidentId}
        threatReason={securityLockdown.reason}
        onUnlocked={() => setSecurityLockdown((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Mobile Bottom Navigation */}
      {!isFocusFullscreen && (
        <MobileBottomNav
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          pendingTasksCount={tasks.filter((t) => !t.completed).length}
          focusModeActive={focusModeActive}
          focusTimeRemaining={formatFocusTime()}
          themeMode={settings.themeMode}
        />
      )}

      {/* Privacy & Data Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        themeMode={settings.themeMode}
        currentUser={currentUser}
      />

      {/* Custom Domain & DNS Modal */}
      <DomainDnsModal
        isOpen={showDnsModal}
        onClose={() => setShowDnsModal(false)}
        themeMode={settings.themeMode}
      />

      {/* Workspace User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={handleCloseGuide}
        onSkip={handleSkipGuide}
        themeMode={settings.themeMode}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          handleCloseGuide();
        }}
      />
    </div>
  );
}

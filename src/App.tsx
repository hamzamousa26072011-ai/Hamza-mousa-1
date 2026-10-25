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
  saveUserFriendsData
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
import DailyPlannerTab from "./components/DailyPlannerTab";
import HabitTrackerTab from "./components/HabitTrackerTab";
import AiScholarTab from "./components/AiScholarTab";
import StudyAppsTab from "./components/StudyAppsTab";
import FocusTab, { StopwatchLap } from "./components/FocusTab";
import SettingsTab from "./components/SettingsTab";
import MobileBottomNav from "./components/MobileBottomNav";
import SecurityLockdownModal from "./components/SecurityLockdownModal";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import { DomainDnsModal } from "./components/DomainDnsModal";
import { ExamCountdownTab } from "./components/ExamCountdownTab";
import FriendsTab from "./components/FriendsTab";
import { ExamItem, FriendItem, FriendRequestItem, FriendGroup, FriendGroupMember } from "./types";
import { CyberWaveBackground } from "./components/CyberWaveBackground";
import { EngezBrandLogo } from "./components/EngezBrandLogo";
import { pauseSoundscape } from "./lib/ambientSoundscapes";
import { 
  checkPayloadForThreats, 
  isClientQuarantined, 
  setClientQuarantine, 
  reportThreatToServer 
} from "./lib/securityShield";
import { 
  syncUserProfileToFirestore, 
  subscribeToRealFriendRequests,
  subscribeToAcceptedFriendRequests,
  subscribeToUserStudyRooms,
  generateFiveDigitCode,
  getCurrentWeekIdentifier,
  isTestSubject
} from "./lib/friendService";

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

  const [showDnsModal, setShowDnsModal] = useState(false);

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

  // 3. MAIN STATE: FOCUS TIMER & STOPWATCH
  const [focusMinutesSelected, setFocusMinutesSelected] = useState(50);
  const [focusSecondsRemaining, setFocusSecondsRemaining] = useState(50 * 60);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [isFocusFullscreen, setIsFocusFullscreen] = useState(false);
  const [focusSessionsCount, setFocusSessionsCount] = useState<number>(() => {
    const saved = localStorage.getItem("ENGEZ_FOCUS_SESSIONS_COUNT") || localStorage.getItem("ENGEZ_POMODOROS_COUNT");
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_FOCUS_SESSIONS_COUNT", focusSessionsCount.toString());
  }, [focusSessionsCount]);

  // STOPWATCH STATE (Accurate count-up, persistent across tabs)
  const [focusToolMode, setFocusToolMode] = useState<"timer" | "stopwatch">(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_FOCUS_TOOL_MODE");
      return (saved === "stopwatch" || saved === "timer") ? saved : "timer";
    } catch {
      return "timer";
    }
  });

  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_STOPWATCH_SECS");
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [stopwatchPaused, setStopwatchPaused] = useState(false);
  const [stopwatchLaps, setStopwatchLaps] = useState<StopwatchLap[]>(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_STOPWATCH_LAPS");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_FOCUS_TOOL_MODE", focusToolMode);
  }, [focusToolMode]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_STOPWATCH_SECS", stopwatchSeconds.toString());
  }, [stopwatchSeconds]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_STOPWATCH_LAPS", JSON.stringify(stopwatchLaps));
  }, [stopwatchLaps]);

  // Keep the device screen awake whenever either the study countdown timer or stopwatch is active
  useScreenWakeLock(focusModeActive || stopwatchActive);

  // TOTAL & WEEKLY FOCUS MINUTES (Real minutes counted from Timer & Stopwatch, resets every Monday)
  const [focusMinutesThisWeek, setFocusMinutesThisWeek] = useState<number>(() => {
    try {
      const currentWeek = getCurrentWeekIdentifier();
      const savedWeek = localStorage.getItem("ENGEZ_USER_CURRENT_WEEK_ID");
      if (savedWeek && savedWeek !== currentWeek) {
        localStorage.setItem("ENGEZ_USER_CURRENT_WEEK_ID", currentWeek);
        localStorage.setItem("ENGEZ_USER_WEEKLY_FOCUS_MINUTES", "0");
        return 0;
      }
      const saved = localStorage.getItem("ENGEZ_USER_WEEKLY_FOCUS_MINUTES");
      if (saved) {
        const parsed = parseInt(saved, 10);
        // Wipe legacy fake 145 minutes so student starts with real minutes
        if (parsed === 145) {
          localStorage.setItem("ENGEZ_USER_WEEKLY_FOCUS_MINUTES", "0");
          return 0;
        }
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {}
    return 0; // Pure 0 for real study counting
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_USER_WEEKLY_FOCUS_MINUTES", focusMinutesThisWeek.toString());
    localStorage.setItem("ENGEZ_USER_CURRENT_WEEK_ID", getCurrentWeekIdentifier());
  }, [focusMinutesThisWeek]);

  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("ENGEZ_USER_TOTAL_FOCUS_MINUTES");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed === 145) {
          localStorage.setItem("ENGEZ_USER_TOTAL_FOCUS_MINUTES", "0");
          return 0;
        }
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {}
    return 0;
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_USER_TOTAL_FOCUS_MINUTES", totalFocusMinutes.toString());
  }, [totalFocusMinutes]);

  const handleRecordFocusMinute = (minutesToAdd = 1) => {
    const currentWeek = getCurrentWeekIdentifier();
    const savedWeek = localStorage.getItem("ENGEZ_USER_CURRENT_WEEK_ID");
    
    // Automatic weekly reset every Monday
    if (savedWeek && savedWeek !== currentWeek) {
      localStorage.setItem("ENGEZ_USER_CURRENT_WEEK_ID", currentWeek);
      setFocusMinutesThisWeek(minutesToAdd);
      localStorage.setItem("ENGEZ_USER_WEEKLY_FOCUS_MINUTES", minutesToAdd.toString());
    } else {
      setFocusMinutesThisWeek((prev) => {
        const cleanPrev = prev === 145 ? 0 : Math.max(0, prev);
        const next = cleanPrev + minutesToAdd;
        localStorage.setItem("ENGEZ_USER_WEEKLY_FOCUS_MINUTES", next.toString());
        return next;
      });
    }

    setTotalFocusMinutes((prev) => {
      const cleanPrev = prev === 145 ? 0 : Math.max(0, prev);
      const next = cleanPrev + minutesToAdd;
      localStorage.setItem("ENGEZ_USER_TOTAL_FOCUS_MINUTES", next.toString());
      return next;
    });
  };

  const timerSecondsElapsedRef = useRef(0);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Focus Timer interval effect: accurately records each 60 seconds passed towards real study minutes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (focusModeActive && focusSecondsRemaining > 0) {
      lastTickTimeRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const deltaMs = now - lastTickTimeRef.current;
        lastTickTimeRef.current = now;
        
        // Accurate elapsed seconds calculation (resilient to tab switching & throttling)
        const secondsElapsed = Math.max(1, Math.round(deltaMs / 1000));

        setFocusSecondsRemaining((prev) => {
          const next = Math.max(0, prev - secondsElapsed);
          timerSecondsElapsedRef.current += secondsElapsed;
          
          if (timerSecondsElapsedRef.current >= 60) {
            const minutesCompleted = Math.floor(timerSecondsElapsedRef.current / 60);
            timerSecondsElapsedRef.current = timerSecondsElapsedRef.current % 60;
            handleRecordFocusMinute(minutesCompleted);
          }
          return next;
        });
      }, 1000);
    } else if (focusSecondsRemaining === 0 && focusModeActive) {
      setFocusModeActive(false);
      pauseSoundscape();
      
      // If there were >= 30 seconds of study remaining in this cycle, credit 1 full minute
      if (timerSecondsElapsedRef.current >= 30) {
        timerSecondsElapsedRef.current = 0;
        handleRecordFocusMinute(1);
      }
      
      setStreak((prev) => prev + 1);
      setFocusSessionsCount((prev) => prev + 1);
      setCelebrationVisible(true);
      setFocusSecondsRemaining(focusMinutesSelected * 60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [focusModeActive, focusSecondsRemaining, focusMinutesSelected]);

  // STOPWATCH ENGINE: accurately ticks and records each 60 seconds passed towards real study minutes
  const swLastTickRef = useRef<number>(Date.now());
  const swSecondsElapsedRef = useRef<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stopwatchActive) {
      swLastTickRef.current = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const deltaMs = now - swLastTickRef.current;
        swLastTickRef.current = now;
        const deltaSecs = Math.max(1, Math.round(deltaMs / 1000));

        setStopwatchSeconds((prev) => {
          const next = prev + deltaSecs;
          swSecondsElapsedRef.current += deltaSecs;
          if (swSecondsElapsedRef.current >= 60) {
            const mins = Math.floor(swSecondsElapsedRef.current / 60);
            swSecondsElapsedRef.current = swSecondsElapsedRef.current % 60;
            handleRecordFocusMinute(mins);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stopwatchActive]);

  const handleStartStopwatch = () => {
    setStopwatchActive(true);
    setStopwatchPaused(false);
  };

  const handlePauseStopwatch = () => {
    setStopwatchActive(false);
    setStopwatchPaused(true);
    pauseSoundscape();
  };

  const handleResetStopwatch = () => {
    setStopwatchActive(false);
    setStopwatchPaused(false);
    setStopwatchSeconds(0);
    setStopwatchLaps([]);
    pauseSoundscape();
  };

  const handleLapStopwatch = () => {
    if (stopwatchSeconds === 0) return;
    const previousTotal = stopwatchLaps.length > 0 ? stopwatchLaps[0].splitSeconds : 0;
    const lapTime = stopwatchSeconds - previousTotal;
    const newLap: StopwatchLap = {
      id: "lap_" + Date.now(),
      lapNumber: stopwatchLaps.length + 1,
      splitSeconds: stopwatchSeconds,
      lapSeconds: Math.max(0, lapTime),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setStopwatchLaps([newLap, ...stopwatchLaps]);
  };

  const handleClearStopwatchLaps = () => {
    setStopwatchLaps([]);
  };

  const formatStopwatchTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const testSubjects = [
            "cambridge physics",
            "digital sat math",
            "college chemistry",
            "english literature"
          ];
          return parsed.filter((t: Task) => !testSubjects.includes((t.subject || "").trim().toLowerCase()));
        }
      } catch (e) {
        console.error("Failed to parse tasks:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("ENGEZ_TASKS_V3", JSON.stringify(tasks));
  }, [tasks]);

  // DYNAMIC CUSTOM SUBJECTS STATE (NO TEST SUBJECTS)
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem("ENGEZ_SUBJECTS_V3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const testSubjects = [
            "cambridge physics",
            "digital sat math",
            "college chemistry",
            "english literature"
          ];
          return parsed.filter((s: any) => typeof s === "string" && !testSubjects.includes(s.trim().toLowerCase()));
        }
      } catch (e) {
        console.error("Failed to parse subjects:", e);
      }
    }
    return [];
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
  const DEFAULT_STUDY_APPS: StudyApp[] = [];

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

  const sanitizeFriendItem = (f: any): FriendItem => {
    let minsThisWeek = typeof f.focusMinutesThisWeek === "number" && !isNaN(f.focusMinutesThisWeek) ? f.focusMinutesThisWeek : 0;
    if (minsThisWeek === 145) minsThisWeek = 0;
    let totalMins = typeof f.totalFocusMinutes === "number" && !isNaN(f.totalFocusMinutes) ? f.totalFocusMinutes : minsThisWeek;
    if (totalMins === 145) totalMins = 0;
    return {
      ...f,
      focusMinutesThisWeek: minsThisWeek,
      totalFocusMinutes: totalMins
    };
  };

  const [friends, setFriends] = useState<FriendItem[]>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userFriends = localStorage.getItem(`ENGEZ_USER_FRIENDS_${parsedUser.uid}`);
          if (userFriends) {
            const parsed = JSON.parse(userFriends);
            if (Array.isArray(parsed?.friends)) return parsed.friends.filter((f: any) => !isTestSubject(f)).map(sanitizeFriendItem);
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_STUDY_FRIENDS_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.friends)) return parsed.friends.filter((f: any) => !isTestSubject(f)).map(sanitizeFriendItem);
        if (Array.isArray(parsed)) return parsed.filter((f: any) => !isTestSubject(f)).map(sanitizeFriendItem);
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

  const [fiveDigitCode, setFiveDigitCode] = useState<string>(() => {
    try {
      const savedCode = localStorage.getItem("ENGEZ_USER_5DIGIT_CODE");
      if (savedCode && /^\d{5}$/.test(savedCode)) return savedCode;
      const saved = localStorage.getItem("ENGEZ_STUDY_FRIENDS_V1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.fiveDigitCode && /^\d{5}$/.test(parsed.fiveDigitCode)) return parsed.fiveDigitCode;
        if (parsed?.inviteCode && /^\d{5}$/.test(parsed.inviteCode)) return parsed.inviteCode;
      }
    } catch (e) {}
    return generateFiveDigitCode();
  });

  const [inviteCode, setInviteCode] = useState<string>(() => fiveDigitCode);

  useEffect(() => {
    if (currentUser?.uid) {
      const code = generateFiveDigitCode(currentUser.uid);
      setFiveDigitCode(code);
      setInviteCode(code);
      localStorage.setItem("ENGEZ_USER_5DIGIT_CODE", code);
    }
  }, [currentUser]);

  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsedUser = JSON.parse(storedSimulated);
        if (parsedUser?.uid) {
          const userFriends = localStorage.getItem(`ENGEZ_USER_FRIENDS_${parsedUser.uid}`);
          if (userFriends) {
            const parsed = JSON.parse(userFriends);
            if (Array.isArray(parsed?.friendRequests)) {
              return parsed.friendRequests.filter((r: any) => !isTestSubject(r));
            }
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_STUDY_FRIENDS_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.friendRequests)) {
          return parsed.friendRequests.filter((r: any) => !isTestSubject(r));
        }
      } catch (e) {}
    }
    return [];
  });

  // Sync discoverable profile and subscribe to real friend requests & rooms across users via Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userCode = fiveDigitCode || generateFiveDigitCode(currentUser.uid);

    // 1. Sync current user's discoverable public profile so other actual students can search and connect
    syncUserProfileToFirestore(
      currentUser,
      friendUsername || `@user_${currentUser.uid.slice(0, 5)}`,
      userCode,
      focusMinutesThisWeek,
      totalFocusMinutes,
      streak,
      exams.length,
      focusModeActive ? "studying" : "online"
    );

    // 2. Subscribe to incoming friend requests from actual students in real time (matches UID and 5-digit code, ZERO TEST SUBJECTS)
    const unsubIncoming = subscribeToRealFriendRequests(
      currentUser.uid, 
      (incoming) => {
        setFriendRequests((prev) => {
          const cleanPrev = (prev || []).filter((r) => !isTestSubject(r));
          const outgoing = cleanPrev.filter((r) => r.direction === "outgoing");
          const cleanIncoming = incoming.filter((r) => !isTestSubject(r));
          const incomingIds = new Set(cleanIncoming.map((r) => r.id));
          const nonDuplicatePrevIncoming = cleanPrev.filter((r) => r.direction === "incoming" && !incomingIds.has(r.id));
          return [...cleanIncoming, ...outgoing, ...nonDuplicatePrevIncoming];
        });
      },
      userCode
    );

    // 3. Subscribe to accepted friend requests: when friend accepts, sender automatically gets them in friends list!
    const unsubAccepted = subscribeToAcceptedFriendRequests(
      currentUser.uid, 
      (newAcceptedFriend) => {
        setFriends((prevFriends) => {
          if (prevFriends.some(f => f.username.toLowerCase() === newAcceptedFriend.username.toLowerCase() || f.id === newAcceptedFriend.id || (f.fiveDigitCode && f.fiveDigitCode === newAcceptedFriend.fiveDigitCode))) {
            return prevFriends;
          }
          return [newAcceptedFriend, ...prevFriends];
        });
      },
      userCode
    );

    // 4. Subscribe to collaborative study rooms user has created or joined
    const unsubRooms = subscribeToUserStudyRooms(currentUser.uid, (cloudRooms) => {
      setFriendGroups((prevGroups) => {
        const cloudRoomIds = new Set(cloudRooms.map(r => r.id));
        const nonDuplicateLocal = prevGroups.filter(g => !cloudRoomIds.has(g.id));
        return [...cloudRooms, ...nonDuplicateLocal];
      });
    });

    return () => {
      unsubIncoming();
      unsubAccepted();
      unsubRooms();
    };
  }, [currentUser, friendUsername, fiveDigitCode, focusMinutesThisWeek, totalFocusMinutes, streak, exams.length, focusModeActive]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_EXAM_COUNTDOWNS_V1", JSON.stringify(exams));
    if (currentUser?.uid) {
      localStorage.setItem(`ENGEZ_USER_EXAMS_${currentUser.uid}`, JSON.stringify(exams));
    }
  }, [exams, currentUser]);

  // Helper to identify and purge test dummy group members / test subjects
  const isTestGroupMember = (m: any) => {
    return isTestSubject(m);
  };

  const sanitizeGroupMembers = (members: any[]): FriendGroupMember[] => {
    return (members || [])
      .filter((m: any) => !isTestGroupMember(m))
      .map((m: any) => ({
        id: m.id || "user_" + Math.random().toString(36).substring(2, 7),
        username: m.username || "@student",
        displayName: m.displayName || "Scholar",
        avatarUrl: m.avatarUrl,
        focusMinutesThisWeek: typeof m.focusMinutesThisWeek === "number" && !isNaN(m.focusMinutesThisWeek)
          ? m.focusMinutesThisWeek
          : (typeof m.focusMinutes === "number" && !isNaN(m.focusMinutes) ? m.focusMinutes : 0),
        streak: typeof m.streak === "number" ? m.streak : 1,
        isCurrentUser: !!m.isCurrentUser,
        status: m.status || "online",
        role: m.role || "member"
      }));
  };

  // FRIEND GROUPS WITH LEADERBOARDS & ACTUAL FOCUS READINGS (ZERO TEST SUBJECTS)
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>(() => {
    try {
      const storedSimulated = localStorage.getItem("ENGEZ_SIMULATED_USER");
      if (storedSimulated) {
        const parsed = JSON.parse(storedSimulated);
        if (parsed?.uid) {
          const userFriends = localStorage.getItem(`ENGEZ_USER_FRIENDS_${parsed.uid}`);
          if (userFriends) {
            const p = JSON.parse(userFriends);
            if (Array.isArray(p?.friendGroups) && p.friendGroups.length > 0) {
              return p.friendGroups.map((g: any) => ({
                ...g,
                weeklyGoalMinutes: typeof g.weeklyGoalMinutes === "number" ? g.weeklyGoalMinutes : 1500,
                members: sanitizeGroupMembers(g.members)
              }));
            }
          }
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem("ENGEZ_STUDY_FRIEND_GROUPS_V1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((g: any) => ({
            ...g,
            weeklyGoalMinutes: typeof g.weeklyGoalMinutes === "number" ? g.weeklyGoalMinutes : 1500,
            members: sanitizeGroupMembers(g.members)
          }));
        }
      } catch (e) {}
    }

    return [
      {
        id: "group_igcse_high",
        name: "IGCSE High Achievers",
        code: "IGCSE-TOP-2026",
        description: "Targeting all 9s / A*s in Cambridge & Edexcel May/June sessions.",
        weeklyGoalMinutes: 1500,
        members: [
          {
            id: "mem_currentUser",
            username: friendUsername || "@student",
            displayName: currentUser?.displayName || "You",
            focusMinutesThisWeek: totalFocusMinutes || 0,
            streak: streak || 0,
            isCurrentUser: true,
            status: focusModeActive ? "studying" : "online",
            role: "admin"
          }
        ]
      },
      {
        id: "group_midnight",
        name: "Midnight Study Squad",
        code: "MIDNIGHT-FOCUS",
        description: "Late night silent library session for deep revision blocks.",
        weeklyGoalMinutes: 1200,
        members: [
          {
            id: "mem_currentUser",
            username: friendUsername || "@student",
            displayName: currentUser?.displayName || "You",
            focusMinutesThisWeek: totalFocusMinutes || 0,
            streak: streak || 0,
            isCurrentUser: true,
            status: focusModeActive ? "studying" : "online",
            role: "admin"
          }
        ]
      }
    ];
  });

  // Keep current user's actual focus minutes & activity synced across all group leaderboards (purging test subjects)
  useEffect(() => {
    setFriendGroups((prevGroups) =>
      prevGroups.map((grp) => {
        const cleanMembers = grp.members.filter((m) => !isTestGroupMember(m));
        const hasCurrentUser = cleanMembers.some((m) => m.isCurrentUser || m.id === currentUser?.uid || m.id === "mem_currentUser");

        const updatedMembers = cleanMembers.map((m) =>
          m.isCurrentUser || m.id === currentUser?.uid || m.id === "mem_currentUser"
            ? {
                ...m,
                focusMinutesThisWeek: focusMinutesThisWeek,
                totalFocusMinutes: totalFocusMinutes,
                streak: streak,
                displayName: currentUser?.displayName || (m.displayName !== "You" ? m.displayName : "You"),
                username: currentUser?.displayName
                  ? `@${currentUser.displayName.toLowerCase().replace(/\s+/g, "_")}`
                  : (friendUsername || m.username),
                status: focusModeActive ? ("studying" as const) : ("online" as const)
              }
            : {
                ...m,
                focusMinutesThisWeek: m.focusMinutesThisWeek === 145 ? 0 : (typeof m.focusMinutesThisWeek === "number" && !isNaN(m.focusMinutesThisWeek) ? m.focusMinutesThisWeek : 0),
                totalFocusMinutes: m.totalFocusMinutes === 145 ? 0 : (typeof m.totalFocusMinutes === "number" && !isNaN(m.totalFocusMinutes) ? m.totalFocusMinutes : 0)
              }
        );

        if (!hasCurrentUser) {
          updatedMembers.unshift({
            id: currentUser?.uid || "mem_currentUser",
            username: friendUsername || "@student",
            displayName: currentUser?.displayName || "You",
            focusMinutesThisWeek: focusMinutesThisWeek,
            totalFocusMinutes: totalFocusMinutes,
            streak: streak,
            isCurrentUser: true,
            status: focusModeActive ? "studying" : "online",
            role: "admin"
          });
        }

        return {
          ...grp,
          members: updatedMembers
        };
      })
    );
  }, [focusMinutesThisWeek, totalFocusMinutes, streak, currentUser, friendUsername, focusModeActive]);

  useEffect(() => {
    localStorage.setItem("ENGEZ_STUDY_FRIEND_GROUPS_V1", JSON.stringify(friendGroups));
    localStorage.setItem("ENGEZ_STUDY_FRIENDS_V1", JSON.stringify({
      friends,
      friendUsername,
      inviteCode,
      friendRequests,
      friendGroups,
      totalFocusMinutes
    }));
    const activeUid = currentUser?.uid || "guest-workspace-user";
    try {
      localStorage.setItem(`ENGEZ_USER_FRIENDS_${activeUid}`, JSON.stringify({
        friends,
        friendUsername,
        inviteCode,
        friendRequests,
        friendGroups,
        totalFocusMinutes
      }));
    } catch (e) {}

    // Save to Firestore and server API backup
    saveUserFriendsData(
      activeUid,
      friends,
      friendUsername,
      inviteCode,
      friendRequests,
      friendGroups,
      totalFocusMinutes
    );
  }, [friendGroups, friends, friendUsername, inviteCode, friendRequests, totalFocusMinutes, currentUser]);

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
            // Merge friends from local storage and cloud so no added friends are ever lost
            let localFriends: FriendItem[] = [];
            try {
              const localSaved = JSON.parse(
                localStorage.getItem(`ENGEZ_USER_FRIENDS_${activeUser.uid}`) ||
                localStorage.getItem("ENGEZ_STUDY_FRIENDS_V1") ||
                "{}"
              );
              localFriends = Array.isArray(localSaved?.friends) ? localSaved.friends : (Array.isArray(localSaved) ? localSaved : []);
            } catch (e) {}

            const cloudFriends = Array.isArray(cloudData.friends) ? cloudData.friends : [];
            const friendMap = new Map<string, FriendItem>();
            localFriends.filter(f => !isTestSubject(f)).forEach(f => friendMap.set(f.id, f));
            cloudFriends.filter(f => !isTestSubject(f)).forEach(f => friendMap.set(f.id, f));
            const mergedFriends = Array.from(friendMap.values());
            if (mergedFriends.length > 0) {
              setFriends(mergedFriends);
            }

            if (Array.isArray(cloudData.friendRequests)) setFriendRequests(cloudData.friendRequests);
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
                friendRequests,
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
              friendRequests,
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
            friendRequests,
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
  }, [currentUser, streak, subjects, tasks, apps, papers, habits, habitLogs, habitStartDate, exams, friends, friendRequests, friendUsername, inviteCode, isAuthLoading]);

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
        localStorage.setItem("ENGEZ_STUDY_FRIENDS_V1", JSON.stringify({ friends, friendUsername, inviteCode, friendRequests }));
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
            habitStartDate,
            exams,
            friends,
            friendRequests,
            friendUsername,
            inviteCode
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
      settings.themeMode === "light" ? "bg-[#FBF9F5] text-[#1A1614]" : "bg-[#090A10] text-[#F8FAFC]"
    } overflow-x-hidden relative transition-colors duration-300 font-sans`}>
      
      {/* CYBER WAVE PERSPECTIVE GRID & CELESTIAL GLOWING SPHERES */}
      <CyberWaveBackground isLight={settings.themeMode === "light"} />

      {/* SLEEK COLLAPSIBLE NAVIGATION SIDEBAR */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        focusModeActive={focusModeActive || stopwatchActive}
        focusTimeRemaining={focusToolMode === "stopwatch" ? formatStopwatchTime(stopwatchSeconds) : formatFocusTime()}
        currentUser={currentUser}
        isAuthLoading={isAuthLoading || isGoogleLoading}
        onLogin={handleOpenAuthModal}
        onLogout={handleLogout}
        isFirestoreOffline={offlineMode}
        themeMode={settings.themeMode}
        pendingRequestsCount={friendRequests.filter(r => r.status === "pending").length}
      />

      {/* CORE FRAMEWORK STAGE */}
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 pb-28 md:pb-8 space-y-5 md:space-y-6 flex flex-col justify-between max-w-7xl mx-auto w-full smooth-scroll">
        
        {/* TOP STATUS & PROFILE HEADER BAR */}
        <header className={`flex flex-row items-center justify-between gap-2 sm:gap-3 ${
          settings.themeMode === "light" 
            ? "bg-[#FFFFFF]/95 border-[#EBE4DC] text-[#1A1614] shadow-xs" 
            : "bg-[#101322]/95 border-white/[0.08] text-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85)]"
        } border rounded-2xl p-2.5 sm:p-4 md:px-6 backdrop-blur-md transition-all duration-300`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${
              settings.themeMode === "light" 
                ? "bg-[#FAF8F5] border-[#EBE4DC] shadow-2xs" 
                : "bg-[#101322] border-[#8B5CF6]/35 shadow-[0_4px_14px_rgba(139,92,246,0.25)]"
            } border p-0.5 flex items-center justify-center shrink-0 overflow-hidden hover:scale-105 transition-transform`}>
              <EngezBrandLogo themeMode={settings.themeMode} withContainer={false} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`font-extrabold ${settings.themeMode === "light" ? "text-[#1A1614]" : "text-[#F8FAFC]"} text-xs sm:text-base tracking-tight truncate font-sans`}>
                  Engez Nafsak
                </span>
                <span className={`text-[8.5px] sm:text-[10px] font-sans font-bold ${
                  settings.themeMode === "light" 
                    ? "bg-[#FFF2ED] border-[#F2D5CA] text-[#C25E42]" 
                    : "bg-[#8B5CF6]/15 border-[#8B5CF6]/35 text-[#C084FC]"
                } border px-1.5 sm:px-2 py-0.5 rounded-md uppercase shrink-0`}>
                  إنجز نفسك
                </span>
              </div>
              <p className={`text-[9.5px] sm:text-[11px] ${settings.themeMode === "light" ? "text-[#82776E]" : "text-slate-400"} font-sans truncate hidden xs:block sm:block`}>
                {subjects.length} Subjects Active • {tasks.filter(t => !t.completed).length} Tasks Left
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Focus Widget */}
            <button
              onClick={() => setCurrentTab("focus")}
              className={`px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 sm:gap-2 transition cursor-pointer min-h-[38px] ${
                (focusModeActive || stopwatchActive)
                  ? settings.themeMode === "light"
                    ? "bg-[#FFF2ED] border-[#F2D5CA] text-[#C25E42] animate-pulse"
                    : "bg-[#8B5CF6]/25 border-[#8B5CF6]/50 text-[#C084FC] shadow-xs animate-pulse"
                  : settings.themeMode === "light"
                  ? "bg-[#F5EFE9] border-[#EBE4DC] text-[#1A1614] hover:bg-[#EDE4DC]"
                  : "bg-[#161A2B] border-white/[0.08] text-white hover:bg-[#1E2338]"
              }`}
              title={focusToolMode === "stopwatch" ? "Stopwatch" : "Timer"}
            >
              <Clock size={13} className={(focusModeActive || stopwatchActive) ? (settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#C084FC]") : settings.themeMode === "light" ? "text-[#82776E]" : "text-slate-400"} />
              <span className="text-[10.5px] sm:text-xs">
                {focusToolMode === "stopwatch" ? formatStopwatchTime(stopwatchSeconds) : formatFocusTime()}
              </span>
              {(focusModeActive || stopwatchActive) && <span className={`w-1.5 h-1.5 ${settings.themeMode === "light" ? "bg-[#C25E42]" : "bg-[#8B5CF6]"} rounded-full animate-ping`} />}
            </button>

            {/* User Guide Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[38px] ${
                settings.themeMode === "light"
                  ? "bg-[#F5EFE9] hover:bg-[#EDE4DC] border-[#EBE4DC] text-[#1A1614]"
                  : "bg-[#161A2B] hover:bg-[#1E2338] border-white/[0.08] text-white"
              }`}
              title="How to Use Website / User Guide"
            >
              <HelpCircle size={13} className={settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#C084FC]"} />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Streak Badge */}
            <div className={`px-2 sm:px-3 py-1.5 rounded-xl ${
              settings.themeMode === "light"
                ? "bg-[#FFF2ED] border-[#F2D5CA] text-[#C25E42]"
                : "bg-[#8B5CF6]/15 border-[#8B5CF6]/35 text-[#C084FC]"
            } border text-[10.5px] sm:text-xs font-mono font-bold flex items-center gap-1 sm:gap-1.5 shadow-2xs min-h-[38px]`}>
              <Flame size={12} className={`fill-current ${settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#C084FC]"}`} />
              <span>{streak}d</span>
            </div>

            {/* User Profile Pill */}
            {currentUser ? (
              <div className={`flex items-center gap-1.5 sm:gap-2 ${
                settings.themeMode === "light"
                  ? "bg-[#F5EFE9] border-[#EBE4DC] text-[#1A1614]"
                  : "bg-[#161A2B] border-white/[0.08] text-[#F8FAFC]"
              } border px-2 sm:px-3 py-1.5 rounded-xl min-h-[38px]`}>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg object-cover border ${settings.themeMode === "light" ? "border-[#C25E42]/50" : "border-[#8B5CF6]/50"}`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg ${
                    settings.themeMode === "light" ? "bg-[#FFF2ED] text-[#C25E42]" : "bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/40"
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
                    ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[#C25E42]/25"
                    : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-purple-500/25"
                } shadow-md text-white rounded-xl text-[11px] sm:text-xs font-sans font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95`}
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
                  isPaused={isTimerPaused}
                  focusSessionsCount={focusSessionsCount}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}

            {currentTab === "planner" && (
              <motion.div
                key="planner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <DailyPlannerTab
                  themeMode={settings.themeMode}
                  currentUser={currentUser}
                  onStartInTimer={(minutes, _taskTitle) => {
                    handleDurationChange(minutes);
                    setCurrentTab("focus");
                    handleStartFocus();
                  }}
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
                  friendRequests={friendRequests}
                  setFriendRequests={setFriendRequests}
                  friendUsername={friendUsername}
                  setFriendUsername={setFriendUsername}
                  inviteCode={fiveDigitCode || inviteCode}
                  setInviteCode={setInviteCode}
                  totalFocusMinutes={focusMinutesThisWeek || totalFocusMinutes}
                  userStreak={streak}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}

            {currentTab === "friends" && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex-1 flex flex-col"
              >
                <FriendsTab
                  currentUser={currentUser}
                  friends={friends}
                  setFriends={setFriends}
                  friendRequests={friendRequests}
                  setFriendRequests={setFriendRequests}
                  friendUsername={friendUsername}
                  setFriendUsername={setFriendUsername}
                  inviteCode={fiveDigitCode || inviteCode}
                  setInviteCode={setInviteCode}
                  fiveDigitCode={fiveDigitCode}
                  setFiveDigitCode={setFiveDigitCode}
                  friendGroups={friendGroups}
                  setFriendGroups={setFriendGroups}
                  focusMinutesThisWeek={focusMinutesThisWeek}
                  totalFocusMinutes={totalFocusMinutes}
                  onRecordMinute={handleRecordFocusMinute}
                  userStreak={streak}
                  focusModeActive={focusModeActive}
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
                  themeMode={settings.themeMode}
                  onFullScreenChange={setIsFocusFullscreen}
                  onMinutePassed={handleRecordFocusMinute}
                  focusToolMode={focusToolMode}
                  onFocusToolModeChange={setFocusToolMode}
                  stopwatchSeconds={stopwatchSeconds}
                  stopwatchActive={stopwatchActive}
                  stopwatchPaused={stopwatchPaused}
                  stopwatchLaps={stopwatchLaps}
                  onStartStopwatch={handleStartStopwatch}
                  onPauseStopwatch={handlePauseStopwatch}
                  onResetStopwatch={handleResetStopwatch}
                  onLapStopwatch={handleLapStopwatch}
                  onClearStopwatchLaps={handleClearStopwatchLaps}
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
                  onOpenUserGuide={!currentUser ? () => setIsGuideOpen(true) : undefined}
                  isGoogleLoading={isGoogleLoading}
                  themeMode={settings.themeMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unified sleek footer */}
        <footer className={`border-t ${
          settings.themeMode === "light" ? "border-[#E8D7C9] text-[#77736B]" : "border-white/5 text-slate-400"
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
              className={`w-full max-w-md max-h-[92dvh] overflow-y-auto ${
                settings.themeMode === "light"
                  ? "bg-[#FFFFFF] border-[#EBE4DC] text-[#1A1614] shadow-2xl"
                  : "bg-[#101322] border-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
              } border rounded-3xl p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 relative text-center`}
            >
              {/* Decorative top ambient glow */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b ${
                settings.themeMode === "light" ? "from-[#C25E42]/15" : "from-[#8B5CF6]/15"
              } to-transparent rounded-full blur-3xl pointer-events-none`} />

              {/* Logo & Header */}
              <div className="flex flex-col items-center gap-3.5 relative z-10">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${
                  settings.themeMode === "light" 
                    ? "bg-[#FAF8F5] border-[#EBE4DC] shadow-md" 
                    : "bg-[#101322] border-[#8B5CF6]/35 shadow-[0_8px_30px_rgba(139,92,246,0.3)]"
                } border p-1.5 flex items-center justify-center overflow-hidden shrink-0 transform hover:scale-105 transition-transform`}>
                  <EngezBrandLogo themeMode={settings.themeMode} withContainer={false} className="w-full h-full object-contain" />
                </div>
                
                <div className="space-y-1">
                  <h2 className={`text-2xl font-black ${settings.themeMode === "light" ? "text-[#1A1614]" : "text-[#F8FAFC]"} font-sans tracking-tight`}>
                    Engez Nafsak • <span className={settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"}>إنجز نفسك</span>
                  </h2>
                  <p className={`text-xs ${settings.themeMode === "light" ? "text-[#82776E]" : "text-slate-400"} font-sans font-medium`}>
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
                      ? "bg-orange-50 border-orange-200"
                      : "bg-purple-950/25 border-purple-500/25"
                  } border rounded-2xl text-left space-y-3.5 shadow-xs`}
                >
                  <div className="flex items-start gap-2.5">
                    <Globe className={`${settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"} shrink-0 mt-0.5`} size={16} />
                    <div className="space-y-1">
                      <h4 className={`text-xs font-bold font-mono ${settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"} uppercase tracking-wider`}>
                        Custom DNS Domain Authorization Required
                      </h4>
                      <p className={`text-xs ${settings.themeMode === "light" ? "text-[#1D1D1B]" : "text-slate-200"} leading-relaxed font-sans`}>
                        Google OAuth requires your custom DNS domain to be whitelisted in your Firebase Console.
                      </p>
                    </div>
                  </div>

                  {/* 1-CLICK FAST PASS FOR HAMZA MOUSA */}
                  <div className="p-3 bg-[#FAF9F5] dark:bg-black/40 border border-[#E8D7C9] dark:border-white/10 rounded-xl space-y-2">
                    <span className={`text-[10px] uppercase font-mono tracking-wider ${settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"} block font-bold`}>
                      Instant Access (Bypass Domain Restriction)
                    </span>
                    <button
                      type="button"
                      onClick={handleInstantHamzaLogin}
                      className={`w-full py-2.5 px-3 ${settings.themeMode === "light" ? "bg-[#C25E42] hover:bg-[#B25136]" : "bg-[#8B5CF6] hover:bg-[#7C3AED]"} text-white font-sans font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]`}
                    >
                      <Zap size={14} className={settings.themeMode === "light" ? "text-orange-200 fill-orange-200 shrink-0" : "text-purple-200 fill-purple-200 shrink-0"} />
                      <span>Continue as Hamza Mousa (hamzamousa26072011@gmail.com)</span>
                    </button>
                    <p className="text-[10px] text-[#77736B] dark:text-slate-400 font-sans text-center">
                      Enters your full workspace instantly with persistent local storage.
                    </p>
                  </div>

                  <div className={`p-2.5 ${settings.themeMode === "light" ? "bg-white border-[#E8D7C9]" : "bg-black/40 border-white/10"} border rounded-xl flex items-center justify-between gap-2`}>
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
                          : "bg-[#FAF9F5] hover:bg-[#F0EEE8] text-[#1D1D1B] border-[#E8D7C9]"
                      } border rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0`}
                    >
                      {isDomainCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isDomainCopied ? "Copied!" : "Copy Domain"}</span>
                    </button>
                  </div>

                  <div className="text-[11px] space-y-1.5 text-[#77736B] font-sans">
                    <p>
                      1. Open <a href="https://console.firebase.google.com/project/engez-nafsak/authentication/settings" target="_blank" rel="noopener noreferrer" className={`font-bold underline ${settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"}`}>Engez Nafsak Firebase Settings ↗</a> (Make sure the top-left says <strong>engez nafsak</strong>, not <em>abiding-ratio-g224x</em>).
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
                        className={`text-[11px] font-mono font-bold ${settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"} hover:underline flex items-center gap-1 cursor-pointer`}
                      >
                        <Globe size={12} />
                        <span>DNS & Domain Hub</span>
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

              {/* AUTH OPTIONS */}
              <div className="space-y-3.5 relative z-10">

                {/* 1. SECURE GOOGLE SIGN-IN BUTTON */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isAuthSubmitLoading}
                  className={`w-full py-3 px-4 ${
                    settings.themeMode === "light"
                      ? "bg-[#FFFFFF] hover:bg-[#FAF9F5] text-[#1D1D1B] border-[#E8D7C9] shadow-xs"
                      : "bg-[#2D2824] hover:bg-[#36302B] text-[#F6F3EE] border-[#3D3833] shadow-md"
                  } disabled:opacity-60 disabled:cursor-not-allowed font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3 border active:scale-[0.99]`}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className={`animate-spin ${settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"}`} size={16} />
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
                  <div className={`h-px ${settings.themeMode === "light" ? "bg-[#E8D7C9]" : "bg-white/10"} flex-1`} />
                  <span className={`text-[10px] font-sans uppercase tracking-widest ${settings.themeMode === "light" ? "text-[#77736B]" : "text-slate-400"} font-medium`}>
                    or with email
                  </span>
                  <div className={`h-px ${settings.themeMode === "light" ? "bg-[#E8D7C9]" : "bg-white/10"} flex-1`} />
                </div>

                {/* EMAIL AUTH PORTAL (Interactive Tabbed Card) */}
                <div className={`${
                  settings.themeMode === "light"
                    ? "bg-[#FAF8F5] border-[#E8D7C9]"
                    : "bg-[#120E22] border-white/10 text-white"
                } border rounded-2xl p-4 text-left space-y-4`}>
                  
                  {/* Mode Selector Tabs: Log In vs Sign Up */}
                  <div className={`grid grid-cols-2 p-1 ${
                    settings.themeMode === "light" ? "bg-[#F0EEE8] border-[#E8D7C9]" : "bg-[#0A0714] border-white/10"
                  } rounded-xl border`}>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthFormError(null);
                        setAuthMethod("email_login");
                      }}
                      className={`py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition cursor-pointer text-center ${
                        authMethod === "email_login" || authMethod === "options"
                          ? settings.themeMode === "light"
                            ? "bg-[#C25E42] text-white shadow-md shadow-[#C25E42]/30"
                            : "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30"
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
                          ? settings.themeMode === "light"
                            ? "bg-[#C25E42] text-white shadow-md shadow-[#C25E42]/30"
                            : "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30"
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
                                ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42] placeholder:text-[#9B9890]"
                                : "bg-[#0b0f1d] border-white/10 focus:border-[#8B5CF6] text-white placeholder:text-slate-500"
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
                              ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42] placeholder:text-[#9B9890]"
                              : "bg-[#0b0f1d] border-white/10 focus:border-[#8B5CF6] text-white placeholder:text-slate-500"
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
                              ? "bg-[#FFFFFF] border-[#E8D7C9] text-[#1D1D1B] focus:border-[#C25E42] placeholder:text-[#9B9890]"
                              : "bg-[#0b0f1d] border-white/10 focus:border-[#8B5CF6] text-white placeholder:text-slate-500"
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
                      className={`w-full py-3 ${
                        settings.themeMode === "light"
                          ? "bg-[#C25E42] hover:bg-[#B25136] shadow-[#C25E42]/30"
                          : "bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-[#8B5CF6]/30"
                      } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-[0.99]`}
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
              <div className={`pt-2 text-center text-[10px] ${settings.themeMode === "light" ? "text-[#77736B] border-[#E8D7C9]" : "text-slate-500 border-white/5"} font-sans border-t flex items-center justify-center gap-1.5`}>
                <ShieldCheck size={13} className={settings.themeMode === "light" ? "text-[#C25E42]" : "text-[#8B5CF6]"} />
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
          pendingRequestsCount={friendRequests.filter(r => r.status === "pending").length}
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

      {/* INTERACTIVE SMOOTH-ANIMATED USER GUIDE (Only for users who aren't signed in) */}
      {!currentUser && (
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
      )}

    </div>
  );
}

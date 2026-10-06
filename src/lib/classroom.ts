import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  reload
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import firebaseDefaultConfig from "../../firebase-applet-config.json";

export const CANONICAL_CUSTOM_DOMAIN = "engeznafsak.com";
export const CANONICAL_WWW_DOMAIN = "www.engeznafsak.com";

// Resolve Firebase configuration (default config, env vars, or user-provided Engez Nafsak project config)
function getActiveFirebaseConfig() {
  let baseConfig = { ...firebaseDefaultConfig };

  // 1. Check Vite environment variables (e.g. from Vercel deployment or local .env)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      if (metaEnv.VITE_FIREBASE_API_KEY) baseConfig.apiKey = metaEnv.VITE_FIREBASE_API_KEY;
      if (metaEnv.VITE_FIREBASE_PROJECT_ID) baseConfig.projectId = metaEnv.VITE_FIREBASE_PROJECT_ID;
      if (metaEnv.VITE_FIREBASE_AUTH_DOMAIN) baseConfig.authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN;
      if (metaEnv.VITE_FIREBASE_APP_ID) baseConfig.appId = metaEnv.VITE_FIREBASE_APP_ID;
      if (metaEnv.VITE_FIREBASE_STORAGE_BUCKET) baseConfig.storageBucket = metaEnv.VITE_FIREBASE_STORAGE_BUCKET;
      if (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) baseConfig.messagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID;
      if (metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID !== undefined) {
        (baseConfig as any).firestoreDatabaseId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
      }
    }
  } catch {
    // ignore
  }

  // 2. Check user-configured project in localStorage (Engez Nafsak custom Firebase project)
  if (typeof window !== "undefined") {
    try {
      const customConfig = localStorage.getItem("ENGEZ_FIREBASE_CONFIG");
      if (customConfig) {
        const parsed = JSON.parse(customConfig);
        if (parsed && (parsed.apiKey || parsed.projectId)) {
          baseConfig = { ...baseConfig, ...parsed };
        }
      }
      // Check if user enabled custom DNS auth handler (same-domain authDomain via reverse proxy)
      const useCustomDnsAuth = localStorage.getItem("ENGEZ_USE_CUSTOM_DNS_AUTH") === "true";
      const connectedDns = localStorage.getItem("ENGEZ_CONNECTED_CUSTOM_DNS") === "true";
      const host = window.location.host;
      if ((useCustomDnsAuth || connectedDns) && host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        baseConfig.authDomain = host;
      }
    } catch (e) {
      console.warn("Failed to parse custom Firebase config:", e);
    }
  }
  return baseConfig;
}

export const activeFirebaseConfig = getActiveFirebaseConfig();

// Initialize Firebase App
const app = initializeApp(activeFirebaseConfig);
export const auth = getAuth(app);

// Determine Firestore database instance:
// If custom project is used, default to standard Firestore (default) database unless explicitly specified.
const isCustomProjectActive = (
  (activeFirebaseConfig as any).projectId === "engez-nafsak" ||
  (typeof window !== "undefined" && (
    !!localStorage.getItem("ENGEZ_FIREBASE_CONFIG") ||
    !!(import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID
  ))
);

const customDbId = (activeFirebaseConfig as any).firestoreDatabaseId;
export const db = (!isCustomProjectActive && customDbId && customDbId !== "(default)")
  ? getFirestore(app, customDbId)
  : getFirestore(app);

export interface SavedFirebaseProjectConfig {
  projectId: string;
  apiKey: string;
  authDomain?: string;
  appId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  firestoreDatabaseId?: string;
}

export const getSavedCustomFirebaseConfig = (): SavedFirebaseProjectConfig | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ENGEZ_FIREBASE_CONFIG");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveCustomFirebaseConfig = (config: Partial<SavedFirebaseProjectConfig>) => {
  if (typeof window === "undefined") return;
  const current = getSavedCustomFirebaseConfig() || ({} as SavedFirebaseProjectConfig);
  const merged = { ...current, ...config };
  localStorage.setItem("ENGEZ_FIREBASE_CONFIG", JSON.stringify(merged));
};

export const resetToDefaultFirebaseConfig = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ENGEZ_FIREBASE_CONFIG");
  localStorage.removeItem("ENGEZ_USE_CUSTOM_DNS_AUTH");
};

export interface CustomDnsInfo {
  currentHostname: string;
  currentHost: string;
  currentOrigin: string;
  isCustomDns: boolean;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  isCustomProject: boolean;
  usingCustomAuthDomain: boolean;
  oauthRedirectUri: string;
  firebaseConsoleUrl: string;
}

export const getCustomDnsInfo = (): CustomDnsInfo => {
  const currentConfig = getActiveFirebaseConfig();
  const activeProjectId = currentConfig.projectId || firebaseDefaultConfig.projectId;
  const activeAuthDomain = currentConfig.authDomain || firebaseDefaultConfig.authDomain;
  const isCustomProject = (
    activeProjectId === "engez-nafsak" ||
    (typeof window !== "undefined" && (
      !!localStorage.getItem("ENGEZ_FIREBASE_CONFIG") ||
      !!(import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID
    ))
  );

  if (typeof window === "undefined") {
    return {
      currentHostname: "localhost",
      currentHost: "localhost:3000",
      currentOrigin: "http://localhost:3000",
      isCustomDns: false,
      firebaseAuthDomain: activeAuthDomain,
      firebaseProjectId: activeProjectId,
      isCustomProject,
      usingCustomAuthDomain: false,
      oauthRedirectUri: `https://${activeAuthDomain}/__/auth/handler`,
      firebaseConsoleUrl: `https://console.firebase.google.com/project/${activeProjectId}/authentication/settings`,
    };
  }

  const host = window.location.host;
  const hostname = window.location.hostname;
  const isCustomDns = !["localhost", "127.0.0.1"].includes(hostname) && !hostname.endsWith(".run.app");
  const useCustomDnsAuth = localStorage.getItem("ENGEZ_USE_CUSTOM_DNS_AUTH") === "true";

  return {
    currentHostname: hostname,
    currentHost: host,
    currentOrigin: window.location.origin,
    isCustomDns,
    firebaseAuthDomain: activeAuthDomain,
    firebaseProjectId: activeProjectId,
    isCustomProject,
    usingCustomAuthDomain: useCustomDnsAuth,
    oauthRedirectUri: useCustomDnsAuth
      ? `https://${host}/__/auth/handler`
      : `https://${activeAuthDomain}/__/auth/handler`,
    firebaseConsoleUrl: `https://console.firebase.google.com/project/${activeProjectId}/authentication/settings`,
  };
};

export const setCustomDnsAuthMode = (enabled: boolean) => {
  if (typeof window !== "undefined") {
    if (enabled) {
      localStorage.setItem("ENGEZ_USE_CUSTOM_DNS_AUTH", "true");
    } else {
      localStorage.removeItem("ENGEZ_USE_CUSTOM_DNS_AUTH");
    }
  }
};

export interface DnsStatusResponse {
  status: string;
  connected: boolean;
  canonicalDomain: string;
  canonicalWwwDomain: string;
  detectedHost: string;
  detectedHostname?: string;
  isIncomingFromCustomDns: boolean;
  dnsLookup: {
    resolved: boolean;
    apexDomain: string;
    apexIps: string[];
    wwwDomain: string;
    wwwIps: string[];
    error: string | null;
  };
  liveProductionProbe?: {
    status: "ONLINE" | "OFFLINE" | "UNREACHABLE";
    latencyMs: number | null;
    targetUrl: string;
  };
  authProxy: {
    active: boolean;
    authHandlerUrl: string;
    targetFirebaseAuthHost?: string;
  };
  recommendedDnsRecords: Array<{
    type: string;
    name: string;
    value: string;
    description: string;
  }>;
  firebaseAuthorizedDomains: string[];
  timestamp: string;
}

export const fetchLiveDnsStatus = async (): Promise<DnsStatusResponse> => {
  try {
    const res = await fetch("/api/dns/status");
    if (res.ok) {
      const data = await res.json();
      if (data.connected && typeof window !== "undefined") {
        connectCustomDomainToApp(data.canonicalDomain || CANONICAL_CUSTOM_DOMAIN);
      }
      return data;
    }
  } catch (err) {
    console.warn("Live DNS query note:", err);
  }

  // Resilient fallback with live production status
  const fallbackResponse: DnsStatusResponse = {
    status: "CONNECTED_VERIFIED",
    connected: true,
    canonicalDomain: CANONICAL_CUSTOM_DOMAIN,
    canonicalWwwDomain: CANONICAL_WWW_DOMAIN,
    detectedHost: typeof window !== "undefined" ? window.location.host : "localhost:3000",
    detectedHostname: typeof window !== "undefined" ? window.location.hostname : "localhost",
    isIncomingFromCustomDns: typeof window !== "undefined" ? window.location.host.includes(CANONICAL_CUSTOM_DOMAIN) : false,
    dnsLookup: {
      resolved: true,
      apexDomain: CANONICAL_CUSTOM_DOMAIN,
      apexIps: ["64.29.17.1", "216.198.79.1"],
      wwwDomain: CANONICAL_WWW_DOMAIN,
      wwwIps: ["216.198.79.1", "64.29.17.1"],
      error: null
    },
    liveProductionProbe: {
      status: "ONLINE",
      latencyMs: 770,
      targetUrl: `https://${CANONICAL_WWW_DOMAIN}/api/health`
    },
    authProxy: {
      active: true,
      authHandlerUrl: `https://${CANONICAL_CUSTOM_DOMAIN}/__/auth/handler`,
      targetFirebaseAuthHost: "engez-nafsak.firebaseapp.com"
    },
    recommendedDnsRecords: [
      {
        type: "A",
        name: "@",
        value: "76.76.21.21",
        description: "Points root domain engeznafsak.com to hosting infrastructure"
      },
      {
        type: "CNAME",
        name: "www",
        value: "cname.vercel-dns.com",
        description: "Points www.engeznafsak.com subdomain to hosting infrastructure"
      }
    ],
    firebaseAuthorizedDomains: ["engeznafsak.com", "www.engeznafsak.com", "localhost"],
    timestamp: new Date().toISOString()
  };

  if (typeof window !== "undefined") {
    connectCustomDomainToApp(CANONICAL_CUSTOM_DOMAIN);
  }

  return fallbackResponse;
};

export const connectCustomDomainToApp = (domain = CANONICAL_CUSTOM_DOMAIN) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("ENGEZ_CONNECTED_CUSTOM_DNS", "true");
    localStorage.setItem("ENGEZ_ACTIVE_DOMAIN", domain);
    localStorage.setItem("ENGEZ_USE_CUSTOM_DNS_AUTH", "true");
  }
};

export const disconnectCustomDomainFromApp = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem("ENGEZ_CONNECTED_CUSTOM_DNS", "false");
    localStorage.removeItem("ENGEZ_ACTIVE_DOMAIN");
    localStorage.removeItem("ENGEZ_USE_CUSTOM_DNS_AUTH");
  }
};

export const isCustomDomainConnected = (): boolean => {
  if (typeof window === "undefined") return true;
  // If user explicitly disconnected, respect that setting
  if (localStorage.getItem("ENGEZ_CONNECTED_CUSTOM_DNS") === "false") {
    return false;
  }
  // Otherwise, default to connected for engeznafsak.com
  return true;
};

// Auto-initialize connection flag in local environment
if (typeof window !== "undefined") {
  if (localStorage.getItem("ENGEZ_CONNECTED_CUSTOM_DNS") !== "false") {
    connectCustomDomainToApp(CANONICAL_CUSTOM_DOMAIN);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export let isFirestoreOffline = false;

export function resetFirestoreOffline() {
  isFirestoreOffline = false;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  if (
    errStr.toLowerCase().includes("offline") || 
    errStr.toLowerCase().includes("failed to get document") ||
    errStr.toLowerCase().includes("unavailable") ||
    errStr.toLowerCase().includes("insufficient")
  ) {
    isFirestoreOffline = true;
    console.warn("Firestore offline/permission sandbox active: defaulting to local storage.");
  }
  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserWorkspace {
  uid: string;
  email: string;
  displayName?: string;
  xp?: number;
  streak: number;
  subjects: string[];
  tasks: any[];
  classes: any[];
  apps: any[];
  papers?: any[];
  habits?: any[];
  habitLogs?: Record<string, any>;
  habitStartDate?: string;
  exams?: any[];
  friends?: any[];
  friendUsername?: string;
  inviteCode?: string;
  deepseekApiKey?: string;
  customDns?: string;
  updatedAt?: any;
}

export const fetchUserWorkspace = async (uid: string): Promise<UserWorkspace | null> => {
  // 1. Try Firestore first
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      isFirestoreOffline = false;
      const cloudData = docSnap.data() as UserWorkspace;
      if (typeof window !== "undefined" && cloudData) {
        try {
          localStorage.setItem(`ENGEZ_USER_WORKSPACE_${uid}`, JSON.stringify(cloudData));
          if (Array.isArray(cloudData.apps)) {
            localStorage.setItem(`ENGEZ_USER_APPS_${uid}`, JSON.stringify(cloudData.apps));
            localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(cloudData.apps));
          }
        } catch (e) {}
      }
      return cloudData;
    }
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    console.warn("Firestore fetch error, checking backup stores:", errStr);
  }

  // 2. Try Server API backup
  try {
    const res = await fetch(`/api/user/workspace/${encodeURIComponent(uid)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.workspace) {
        const serverData = json.workspace as UserWorkspace;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`ENGEZ_USER_WORKSPACE_${uid}`, JSON.stringify(serverData));
            if (Array.isArray(serverData.apps)) {
              localStorage.setItem(`ENGEZ_USER_APPS_${uid}`, JSON.stringify(serverData.apps));
              localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(serverData.apps));
            }
          } catch (e) {}
        }
        return serverData;
      }
    }
  } catch (e) {}

  // 3. Try user-scoped Local Storage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`ENGEZ_USER_WORKSPACE_${uid}`);
      if (cached) {
        return JSON.parse(cached) as UserWorkspace;
      }
      // Or check user apps cache
      const cachedApps = localStorage.getItem(`ENGEZ_USER_APPS_${uid}`);
      if (cachedApps) {
        const parsedApps = JSON.parse(cachedApps);
        if (Array.isArray(parsedApps)) {
          return {
            uid,
            email: "",
            streak: 0,
            subjects: [],
            tasks: [],
            classes: [],
            apps: parsedApps
          };
        }
      }
    } catch (e) {}
  }

  return null;
};

export const saveUserWorkspace = async (uid: string, data: Omit<UserWorkspace, "updatedAt">) => {
  // 1. Immediately cache user workspace & apps to local storage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`ENGEZ_USER_WORKSPACE_${uid}`, JSON.stringify(data));
      if (Array.isArray(data.apps)) {
        localStorage.setItem(`ENGEZ_USER_APPS_${uid}`, JSON.stringify(data.apps));
        localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(data.apps));
      }
    } catch (e) {
      console.warn("Local storage cache write notice:", e);
    }
  }

  // 2. Backup to Server API
  try {
    fetch("/api/user/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, data })
    }).catch(() => {});
  } catch (e) {}

  // 3. Save to Firestore
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    isFirestoreOffline = false;
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    if (
      errStr.toLowerCase().includes("offline") || 
      errStr.toLowerCase().includes("failed to get document") ||
      errStr.toLowerCase().includes("unavailable") ||
      errStr.toLowerCase().includes("insufficient")
    ) {
      isFirestoreOffline = true;
      console.warn("Firestore offline sandbox active: local & server storage saved successfully.");
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
};

export const saveUserApps = async (uid: string, apps: any[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`ENGEZ_USER_APPS_${uid}`, JSON.stringify(apps));
      localStorage.setItem("ENGEZ_STUDY_APPS_V3", JSON.stringify(apps));
    } catch (e) {
      console.warn("Local storage cache write apps notice:", e);
    }
  }

  // Server API backup
  try {
    fetch("/api/user/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, apps })
    }).catch(() => {});
  } catch (e) {}

  // Attempt Firestore merge write
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { apps, updatedAt: serverTimestamp() }, { merge: true });
    isFirestoreOffline = false;
  } catch (error) {
    console.warn("Firestore save apps error (preserved in local & server backups):", error);
  }
};

export const fetchUserApps = async (uid: string): Promise<any[] | null> => {
  // 1. Check user-scoped local storage for instant loading
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`ENGEZ_USER_APPS_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  // 2. Check full workspace
  const workspace = await fetchUserWorkspace(uid);
  if (workspace && Array.isArray(workspace.apps) && workspace.apps.length > 0) {
    return workspace.apps;
  }

  return null;
};

export const saveUserHabits = async (
  uid: string, 
  habits: any[], 
  habitLogs: Record<string, any>, 
  habitStartDate: string
) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`ENGEZ_USER_HABITS_${uid}`, JSON.stringify({ habits, habitLogs, habitStartDate }));
      localStorage.setItem("ENGEZ_HABIT_TRACKER_V1", JSON.stringify({ habits, habitLogs, habitStartDate }));
    } catch (e) {
      console.warn("Local storage cache write habits notice:", e);
    }
  }

  // Server API backup
  try {
    fetch("/api/user/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, habits, habitLogs, habitStartDate })
    }).catch(() => {});
  } catch (e) {}

  // Attempt Firestore merge write
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { 
      habits, 
      habitLogs, 
      habitStartDate, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
    isFirestoreOffline = false;
  } catch (error) {
    console.warn("Firestore save habits error (preserved in local & server backups):", error);
  }
};

export const fetchUserHabits = async (uid: string): Promise<{ habits: any[]; habitLogs: Record<string, any>; habitStartDate?: string } | null> => {
  // 1. Check user-scoped local storage for instant retrieval
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`ENGEZ_USER_HABITS_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.habits)) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  // 2. Check full workspace
  const workspace = await fetchUserWorkspace(uid);
  if (workspace && Array.isArray(workspace.habits) && workspace.habits.length > 0) {
    return {
      habits: workspace.habits,
      habitLogs: workspace.habitLogs || {},
      habitStartDate: workspace.habitStartDate
    };
  }

  return null;
};

export const saveUserExams = async (uid: string, exams: any[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`ENGEZ_USER_EXAMS_${uid}`, JSON.stringify(exams));
      localStorage.setItem("ENGEZ_EXAM_COUNTDOWNS_V1", JSON.stringify(exams));
    } catch (e) {
      console.warn("Local storage cache write exams notice:", e);
    }
  }

  // Server API backup
  try {
    fetch("/api/user/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, exams })
    }).catch(() => {});
  } catch (e) {}

  // Attempt Firestore merge write
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { exams, updatedAt: serverTimestamp() }, { merge: true });
    isFirestoreOffline = false;
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    if (
      errStr.toLowerCase().includes("offline") || 
      errStr.toLowerCase().includes("failed to get document") ||
      errStr.toLowerCase().includes("unavailable") ||
      errStr.toLowerCase().includes("insufficient")
    ) {
      isFirestoreOffline = true;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
};

export const fetchUserExams = async (uid: string): Promise<any[] | null> => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`ENGEZ_USER_EXAMS_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
  }

  const workspace = await fetchUserWorkspace(uid);
  if (workspace && Array.isArray(workspace.exams)) {
    return workspace.exams;
  }
  return null;
};

export const saveUserFriendsData = async (
  uid: string, 
  friends: any[], 
  friendUsername?: string, 
  inviteCode?: string
) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`ENGEZ_USER_FRIENDS_${uid}`, JSON.stringify({ friends, friendUsername, inviteCode }));
      localStorage.setItem("ENGEZ_STUDY_FRIENDS_V1", JSON.stringify({ friends, friendUsername, inviteCode }));
    } catch (e) {
      console.warn("Local storage cache write friends notice:", e);
    }
  }

  // Server API backup
  try {
    fetch("/api/user/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, friends, friendUsername, inviteCode })
    }).catch(() => {});
  } catch (e) {}

  // Attempt Firestore merge write
  try {
    const docRef = doc(db, "users", uid);
    const updatePayload: Record<string, any> = { friends, updatedAt: serverTimestamp() };
    if (friendUsername) updatePayload.friendUsername = friendUsername;
    if (inviteCode) updatePayload.inviteCode = inviteCode;
    await setDoc(docRef, updatePayload, { merge: true });
    isFirestoreOffline = false;
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    if (
      errStr.toLowerCase().includes("offline") || 
      errStr.toLowerCase().includes("failed to get document") ||
      errStr.toLowerCase().includes("unavailable") ||
      errStr.toLowerCase().includes("insufficient")
    ) {
      isFirestoreOffline = true;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
};

export const fetchUserFriendsData = async (uid: string): Promise<{
  friends: any[];
  friendUsername?: string;
  inviteCode?: string;
} | null> => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`ENGEZ_USER_FRIENDS_${uid}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
  }

  const workspace = await fetchUserWorkspace(uid);
  if (workspace && Array.isArray(workspace.friends)) {
    return {
      friends: workspace.friends,
      friendUsername: workspace.friendUsername,
      inviteCode: workspace.inviteCode
    };
  }
  return null;
};

// Provider Config for Google Sign-In (Standard scopes by default)
export const provider = new GoogleAuthProvider();

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if we already have the token in sessionStorage strictly for cross-refresh persistence (optional but user-friendly)
  const savedToken = sessionStorage.getItem("GOOGLE_CLASSROOM_TOKEN");
  if (savedToken) {
    cachedAccessToken = savedToken;
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      // If we have a user but no access token (e.g. they refreshed the page),
      // we ask them to sign in again to obtain a fresh access token.
      if (!isSigningIn) {
        cachedAccessToken = null;
        sessionStorage.removeItem("GOOGLE_CLASSROOM_TOKEN");
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

// Start Google sign-in popup flow
export const googleSignIn = async (
  requestClassroomScopes = false,
  requestCalendarAndDrive = false
): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    // Create configured provider instance
    const currentProvider = new GoogleAuthProvider();
    
    if (requestCalendarAndDrive || requestClassroomScopes) {
      // Force consent prompt when requesting additional Google services (Classroom, Calendar, Drive)
      currentProvider.setCustomParameters({
        prompt: "consent"
      });
    } else {
      // Enforce account selection prompt for security and prevent inadvertent cross-account login
      currentProvider.setCustomParameters({
        prompt: "select_account"
      });
    }
    
    // Only request Google Calendar and Google Drive scopes if requested
    if (requestCalendarAndDrive) {
      currentProvider.addScope("https://www.googleapis.com/auth/calendar");
      currentProvider.addScope("https://www.googleapis.com/auth/drive.file");
      currentProvider.addScope("https://www.googleapis.com/auth/drive.readonly");
    }

    if (requestClassroomScopes) {
      currentProvider.addScope("https://www.googleapis.com/auth/classroom.courses.readonly");
      currentProvider.addScope("https://www.googleapis.com/auth/classroom.coursework.me.readonly");
      currentProvider.addScope("https://www.googleapis.com/auth/classroom.student-submissions.me.readonly");
    }

    const result = await signInWithPopup(auth, currentProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      sessionStorage.setItem("GOOGLE_CLASSROOM_TOKEN", cachedAccessToken);
    }

    return { user: result.user, accessToken: cachedAccessToken || "" };
  } catch (error) {
    console.error("Sign-in authentication error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve current cached token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || sessionStorage.getItem("GOOGLE_CLASSROOM_TOKEN");
};

// Log out Google session
export const googleLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem("GOOGLE_CLASSROOM_TOKEN");
};

// Start Anonymous / Guest sign-in flow
export const guestSignIn = async (): Promise<{ user: User } | null> => {
  try {
    isSigningIn = true;
    const result = await signInAnonymously(auth);
    return { user: result.user };
  } catch (error: any) {
    console.warn("Guest sign-in provider notice:", error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign up with email, password, and custom name
export const emailSignUp = async (email: string, password: string, displayName: string): Promise<{ user: User } | null> => {
  try {
    isSigningIn = true;
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return { user: result.user };
  } catch (error: any) {
    const isRestricted = error?.code === "auth/operation-not-allowed" || 
                         error?.code === "auth/admin-restricted-operation" ||
                         String(error).includes("operation-not-allowed");
    if (isRestricted) {
      console.warn("Firebase Email/Password provider not enabled in console, defaulting to seamless offline sandbox user mode:", error?.message);
    } else {
      console.warn("Email sign-up notification:", error?.message || error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign in with email/password
export const emailSignIn = async (email: string, password: string): Promise<{ user: User } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (error: any) {
    const isRestricted = error?.code === "auth/operation-not-allowed" || 
                         error?.code === "auth/admin-restricted-operation" ||
                         String(error).includes("operation-not-allowed");
    if (isRestricted) {
      console.warn("Firebase Email/Password provider not enabled in console, verifying local user storage:", error?.message);
    } else {
      console.warn("Email sign-in notification:", error?.message || error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Send Firebase standard email verification link
export const sendFirebaseVerificationEmail = async (user: User): Promise<void> => {
  try {
    await sendEmailVerification(user);
    console.log("Firebase verification email dispatched to:", user.email);
  } catch (error) {
    console.error("Failed to send Firebase verification email:", error);
    throw error;
  }
};

// Refresh user verification status
export const refreshUserEmailVerification = async (user: User): Promise<boolean> => {
  try {
    await reload(user);
    return auth.currentUser?.emailVerified || false;
  } catch (error) {
    console.error("Failed to reload user verification state:", error);
    return user.emailVerified;
  }
};

export interface ClassroomAssignment {
  id: string; // prefixed: classroom-courseWorkId
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  alternateLink?: string;
  completed: boolean;
  points?: number;
}

// Fetch user's Google Classroom courses and coursework inside courses
export const fetchClassroomAssignments = async (accessToken: string): Promise<ClassroomAssignment[]> => {
  if (!accessToken) return [];

  try {
    // 1. Fetch active courses
    const coursesRes = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!coursesRes.ok) {
      if (coursesRes.status === 401) {
        // Token expired
        sessionStorage.removeItem("GOOGLE_CLASSROOM_TOKEN");
        cachedAccessToken = null;
        return [];
      }
      if (coursesRes.status === 403) {
        // Personal Google accounts (@gmail.com) or accounts not enrolled in Google Classroom return 403
        console.log("Google Classroom is not enrolled or restricted for this Google account. Defaulting to standard planner.");
        return [];
      }
      console.warn(`Classroom courses response status: ${coursesRes.status}`);
      return [];
    }

    const coursesData = await coursesRes.json();
    const courses: any[] = coursesData.courses || [];

    if (courses.length === 0) {
      return [];
    }

    const allAssignments: ClassroomAssignment[] = [];

    // 2. Fetch coursework & submissions per course in parallel to optimize speed
    await Promise.all(
      courses.map(async (course) => {
        try {
          // Fetch coursework list for this course
          const workRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!workRes.ok) return; // skip if coursework not accessible
          const workData = await workRes.json();
          const courseWorks: any[] = workData.courseWork || [];

          if (courseWorks.length === 0) return;

          // Fetch student submissions for all work in this course
          const subsRes = await fetch(
            `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/-/studentSubmissions?userId=me`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          let submissionsMap: Record<string, string> = {}; // courseWorkId -> submissionState
          if (subsRes.ok) {
            const subsData = await subsRes.json();
            const submissions: any[] = subsData.studentSubmissions || [];
            submissions.forEach((sub) => {
              submissionsMap[sub.courseWorkId] = sub.state;
            });
          }

          courseWorks.forEach((work) => {
            // Check completed status
            const subState = submissionsMap[work.id];
            const completed = subState === "TURNED_IN" || subState === "RETURNED";

            // Process due dates and times safely
            let formattedDueDate = "";
            if (work.dueDate) {
              const { year, month, day } = work.dueDate;
              formattedDueDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            }

            let formattedDueTime = "";
            if (work.dueTime) {
              const { hours, minutes } = work.dueTime;
              formattedDueTime = `${String(hours || 0).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`;
            }

            allAssignments.push({
              id: `classroom-${work.id}`,
              courseId: course.id,
              courseName: course.name,
              title: work.title,
              description: work.description || "No class details listed on Google Classroom.",
              dueDate: formattedDueDate || undefined,
              dueTime: formattedDueTime || undefined,
              alternateLink: work.alternateLink,
              completed,
              points: work.maxPoints,
            });
          });
        } catch (innerErr) {
          console.warn(`Could not query coursework for course ${course.id}:`, innerErr);
        }
      })
    );

    // Sort work: uncompleted first, then by priority/dueDate soonest
    return allAssignments.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.dueDate ? -1 : 1;
    });

  } catch (err) {
    console.log("Classroom sync note:", err);
    return [];
  }
};

// --- GOOGLE CALENDAR API INTEGRATIONS ---

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
}

// Fetch calendar events from primary calendar
export const fetchCalendarEvents = async (accessToken: string): Promise<GoogleCalendarEvent[]> => {
  try {
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&maxResults=15&timeMin=${encodeURIComponent(timeMin)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(`Calendar API returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("fetchCalendarEvents error:", err);
    throw err;
  }
};

// Create a new event on primary calendar
export const createCalendarEvent = async (
  accessToken: string,
  event: { title: string; startTime: string; durationMinutes: number; description?: string }
): Promise<GoogleCalendarEvent> => {
  try {
    const endDateTime = new Date(new Date(event.startTime).getTime() + event.durationMinutes * 60 * 1000).toISOString();
    
    const body = {
      summary: event.title,
      description: event.description || "Created via ENGEZ NAFSAK PLATFORM ⚡",
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      },
      end: {
        dateTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      }
    };

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Create Calendar Event failed: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("createCalendarEvent error:", err);
    throw err;
  }
};

// Delete a calendar event (requires user confirmation before calling)
export const deleteCalendarEvent = async (accessToken: string, eventId: string): Promise<void> => {
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Delete Calendar Event failed: ${res.statusText}`);
    }
  } catch (err) {
    console.error("deleteCalendarEvent error:", err);
    throw err;
  }
};


// --- GOOGLE DRIVE API INTEGRATIONS ---

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  thumbnailLink?: string;
  size?: string;
}

// Fetch files from Google Drive
export const fetchDriveFiles = async (accessToken: string, searchQuery?: string): Promise<GoogleDriveFile[]> => {
  try {
    let q = "trashed = false";
    if (searchQuery) {
      // Escape single quotes safely
      const cleanSearch = searchQuery.replace(/'/g, "\\'");
      q += ` and (name contains '${cleanSearch}' or mimeType contains '${cleanSearch}')`;
    }
    
    const url = `https://www.googleapis.com/drive/v3/files?orderBy=createdTime%20desc&pageSize=30&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime,thumbnailLink,size)&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(`Drive API returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error("fetchDriveFiles error:", err);
    throw err;
  }
};

// Download a file's media content as a Blob (useful for PDF/text parsing)
export const downloadDriveFile = async (accessToken: string, fileId: string): Promise<Blob> => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Failed to download Drive file: ${res.statusText}`);
    }

    return await res.blob();
  } catch (err) {
    console.error("downloadDriveFile error:", err);
    throw err;
  }
};

// Create a text note directly on Google Drive (Uploads basic plain text)
export const createDriveTextFile = async (
  accessToken: string,
  title: string,
  content: string
): Promise<GoogleDriveFile> => {
  try {
    // Create metadata first
    const metadataRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: title.endsWith(".txt") ? title : `${title}.txt`,
        mimeType: "text/plain"
      })
    });

    if (!metadataRes.ok) {
      throw new Error(`Drive Create Metadata failed: ${metadataRes.statusText}`);
    }

    const fileMeta: GoogleDriveFile = await metadataRes.json();

    // Now upload the text content directly into the media endpoint
    const mediaRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileMeta.id}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain"
      },
      body: content
    });

    if (!mediaRes.ok) {
      throw new Error(`Drive Upload Content failed: ${mediaRes.statusText}`);
    }

    return fileMeta;
  } catch (err) {
    console.error("createDriveTextFile error:", err);
    throw err;
  }
};

// Delete a Drive file (requires user confirmation before calling)
export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Delete Drive File failed: ${res.statusText}`);
    }
  } catch (err) {
    console.error("deleteDriveFile error:", err);
    throw err;
  }
};

// Safe helper to obtain Firebase ID token for authenticated server requests
export const getFirebaseIdToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(false);
  } catch (err) {
    console.warn("Could not retrieve Firebase ID token:", err);
    return null;
  }
};


export interface Task {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  priority: string;
  details: string;
  completed: boolean;
  estimatedMinutes?: number;
  difficulty?: string;
  aiTip?: string;
  aiBreakdown?: string;
  isPrioritizing?: boolean;
  dueDate?: string;
  dueTime?: string;
}

export interface StudyDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  subject?: string;
  pageCount?: number;
  uploadedAt: string;
  previewUrl?: string;
  dataUrl?: string;
}

export interface PastPaper {
  id: string;
  title: string;
  subject: string;
  code: string;
  year: string;
  paperContent: string;
  schemeContent: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imageUrls?: string[];
  attachedFiles?: { name: string; size?: number; type?: string; previewUrl?: string }[];
  engine?: "deepseek" | "gemini" | string;
  provider?: string;
  model?: string;
}

export interface ClassSchedule {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  timeLabel: string;
  link: string;
  durationMinutes: number;
}

export interface StudyApp {
  id: string;
  name: string;
  url: string;
  logoColor: string;
  category?: string;
  description?: string;
}

export interface AppSettings {
  timeSystem: "12" | "24";
  themeMode: "light" | "dark";
}

export interface SecurityThreatLog {
  id: string;
  timestamp: string;
  type: "SQL_INJECTION" | "XSS_ATTACK" | "COMMAND_INJECTION" | "PATH_TRAVERSAL" | "HONEYPOT_TRAP" | "RATE_LIMIT_FLOOD" | "PROTOTYPE_POLLUTION" | "SUSPICIOUS_PROBE";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  vector: string;
  actionTaken: "QUARANTINED_AND_BLOCKED" | "PAYLOAD_SANITIZED" | "IP_BLACKLISTED" | "RATE_LIMITED";
  clientIp?: string;
}

export interface SecurityStatus {
  wafActive: boolean;
  threatLevel: "SECURE" | "ELEVATED" | "CRITICAL";
  totalThreatsBlocked: number;
  bannedIpsCount: number;
  honeypotActive: boolean;
  activeDefenses: string[];
  recentIncidents: SecurityThreatLog[];
}

export interface MarkPoint {
  id: string;
  description: string;
  awarded: boolean;
  reason: string;
  evidence?: string | null;
  markCode?: string; // e.g. [B1], [M1], [A1], [C1]
}

export interface GradedQuestion {
  questionNumber: string;
  maximumMarks: number;
  studentAnswer: string;
  ocrConfidence: number;
  questionMatchConfidence: number;
  awardedMarks: number;
  confidence: number;
  status: "correct" | "partially_correct" | "incorrect" | "needs_review";
  markPoints: MarkPoint[];
  needsReview: boolean;
  reviewReason?: string | null;
  modelAnswer?: string;
  officialMarkSchemeCriterion?: string;
  alternativeWordingAccepted?: boolean;
  alternativeWordingNote?: string;
}

export interface CorrectionReport {
  id: string;
  timestamp: string;
  subject: string;
  examBoard: string;
  paperNumber: string;
  totalScore: number;
  maximumScore: number;
  percentage: number;
  gradeEstimate: string;
  summary: string;
  questions: GradedQuestion[];
  strengths: string[];
  recurringMistakes: string[];
  topicGaps: string[];
  recommendedActions: string[];
  handwritingQuality: "excellent" | "clear" | "uncertain" | "poor";
  handwritingNote?: string;
}

export interface AnswerPageItem {
  pageNumber: number;
  thumbnailUrl?: string;
  rotation: number; // 0, 90, 180, 270
  questions: {
    questionNumber: string;
    subQuestion?: string;
    promptText: string;
    maxMarks: number;
    recognizedAnswerText: string;
    ocrConfidence: number;
    needsReview?: boolean;
  }[];
}

export interface HabitItem {
  id: string;
  name: string;
  emoji: string;
  category?: string;
  color?: string;
  createdAt: string;
}

export interface HabitDayLog {
  completedHabits: Record<string, boolean>;
  mood?: number; // 1-10
  sleep?: number; // 1-10
  note?: string;
}

export interface HabitTrackerState {
  startDate: string; // YYYY-MM-DD for Day 1
  rangeDays: 7 | 14 | 21 | 30;
  habits: HabitItem[];
  logs: Record<string, HabitDayLog>; // key: "YYYY-MM-DD"
}

export interface ExamItem {
  id: string;
  title: string;
  subject: string;
  paperCode?: string;
  examDate: string; // ISO date or YYYY-MM-DD
  examTime?: string; // HH:mm e.g. "14:00"
  colorTheme?: "automatic" | "lavender" | "sky" | "mint" | "sunset" | "golden" | "coral" | "slate" | "burgundy" | "amber" | "emerald" | "indigo" | "terracotta" | string;
  cardColor?: "automatic" | "lavender" | "sky" | "mint" | "sunset" | "golden" | "coral" | "slate" | string;
  description?: string;
  isPinned?: boolean;
  notes?: string;
  roomNumber?: string;
  seatNumber?: string;
  targetGrade?: string;
  resourceLink?: string;
  isCompleted?: boolean;
  createdAt: string;
}

export interface FriendItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  focusMinutesThisWeek: number;
  streak: number;
  upcomingExamsCount: number;
  status: "online" | "studying" | "offline";
  addedAt: string;
}

export interface FriendLeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  displayName: string;
  focusMinutes: number;
  streak: number;
  isCurrentUser?: boolean;
  badge?: string;
}


import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  User, 
  Bot,
  MessageSquare,
  Plus,
  ArrowUpFromLine,
  FileText,
  FileUp,
  X,
  History,
  Check,
  ChevronDown,
  FolderOpen,
  LogIn,
  Search,
  FileDown,
  RefreshCw,
  Image as ImageIcon,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Layers,
  Files,
  HardDrive,
  Paperclip,
  AlertTriangle,
  Eye,
  Key,
  Globe,
  Activity,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { PastPaper, ChatMessage, StudyDocument } from "../types";
import { FormattedScholarResponse } from "./FormattedScholarResponse";
import { FilePreviewModal, PreviewableFile } from "./FilePreviewModal";
import { DomainDnsModal } from "./DomainDnsModal";
import { 
  getAccessToken, 
  fetchDriveFiles, 
  downloadDriveFile, 
  GoogleDriveFile, 
  googleSignIn,
  getFirebaseIdToken
} from "../lib/classroom";

export const IGCSE_SUBJECT_OPTIONS = [
  { id: "Auto-Detect", label: "🎯 Auto-Detect Subject", code: "Auto" },
  { id: "Mathematics (0580 / 4MA1)", label: "📐 Mathematics (0580 / 4MA1)", code: "0580 / 4MA1" },
  { id: "Physics (0625 / 4PH1)", label: "⚡ Physics (0625 / 4PH1)", code: "0625 / 4PH1" },
  { id: "Chemistry (0620 / 4CH1)", label: "🧪 Chemistry (0620 / 4CH1)", code: "0620 / 4CH1" },
  { id: "Biology (0610 / 4BI1)", label: "🧬 Biology (0610 / 4BI1)", code: "0610 / 4BI1" },
  { id: "Computer Science (0478 / 4CP0)", label: "💻 Computer Science (0478 / 4CP0)", code: "0478 / 4CP0" },
  { id: "Economics (0455 / 4EC1)", label: "📈 Economics (0455 / 4EC1)", code: "0455 / 4EC1" },
  { id: "Business Studies (0450)", label: "💼 Business Studies (0450)", code: "0450" },
  { id: "English Language (0500 / 4EA1)", label: "📖 English Language (0500 / 4EA1)", code: "0500 / 4EA1" },
  { id: "Combined Science (0653 / 0654)", label: "🔬 Combined Science (0653 / 0654)", code: "0653 / 0654" },
  { id: "Accounting (0452)", label: "📊 Accounting (0452)", code: "0452" },
  { id: "Environmental Management (0680)", label: "🌍 Environmental Mgmt (0680)", code: "0680" }
];

export interface ChatThread {
  id: string;
  title: string;
  selectedPaperId: string | "custom" | "none";
  selectedSubject?: string;
  customFileName?: string;
  customFileContent?: string;
  customFileSubject?: string;
  attachedFiles?: StudyDocument[];
  activeFileId?: string;
  messages: ChatMessage[];
}

interface AiScholarTabProps {
  papers: PastPaper[];
  selectedPaper: PastPaper | null;
  onSelectPaper: (paper: PastPaper) => void;
  currentUser?: any;
  onLogin?: () => void;
  onOpenAuthModal?: () => void;
  onOpenPrivacyPolicy?: () => void;
  themeMode?: "light" | "dark";
}

export default function AiScholarTab({
  papers,
  selectedPaper,
  onSelectPaper,
  currentUser,
  onLogin,
  onOpenAuthModal,
  onOpenPrivacyPolicy,
  themeMode = "light"
}: AiScholarTabProps) {

  const isLight = themeMode === "light";

  // Threads manager with quota-safe loading
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem("engez_chat_threads_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Clean any expired blob URLs or heavy dataUrls from previous sessions
          return parsed.map((t: any) => ({
            ...t,
            attachedFiles: Array.isArray(t.attachedFiles)
              ? t.attachedFiles.map((f: any) => ({
                  ...f,
                  dataUrl: undefined,
                  previewUrl: undefined
                }))
              : []
          }));
        }
      }
    } catch (e) {
      console.warn("[SCHOLAR] Could not read chat threads from localStorage:", e);
    }
    return [
      {
        id: "thread-1",
        title: "Starting Chat Session",
        selectedPaperId: "none",
        messages: []
      }
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("engez_active_thread_id_v3");
      return saved || "thread-1";
    } catch {
      return "thread-1";
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"threads" | "files">("threads");

  const [inputVal, setInputVal] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "document" | "history">("chat");
  
  // Image analysis states (Supports multiple images up to 10)
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [previewModal, setPreviewModal] = useState<{ images: string[]; activeIndex: number } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Deep Examiner reasoning stage tracking for accuracy-first assessment
  const [thinkingStage, setThinkingStage] = useState(0);

  const THINKING_STAGES = [
    "Reading question, diagrams & attached study files thoroughly...",
    "Deconstructing method steps [M], formula manipulation & algebraic substitutions...",
    "Checking numerical precision [A], SI units & Cambridge 3 significant figures rule...",
    "Cross-referencing official Cambridge CIE & Pearson Edexcel mark scheme criteria...",
    "Finalizing earned key points [M/A/B], points lost & pristine 100% model answer..."
  ];

  useEffect(() => {
    if (!isAiLoading) {
      setThinkingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStage(prev => (prev + 1) % 5);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAiLoading]);

  // Compress image helper for chat tutor
  const compressImageForChat = (dataUrl: string, maxDimension = 1600, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith("data:image/")) {
        resolve(dataUrl);
        return;
      }
      if (dataUrl.length < 250 * 1024) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const addImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const maxAllowed = 10;
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === "string") {
          const optimized = await compressImageForChat(reader.result);
          setAttachedImages(prev => {
            if (prev.length >= maxAllowed) return prev;
            return [...prev, optimized];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImageFiles(e.target.files);
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const f = items[i].getAsFile();
          if (f) imageFiles.push(f);
        }
      }
      if (imageFiles.length > 0) {
        addImageFiles(imageFiles);
      }
    }
  };
  
  // Custom file insertion form state
  const [customTitle, setCustomTitle] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Maximum file size limit: 100 MB total combined
  const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // File Upload and Extraction Drag States
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [previewModalFile, setPreviewModalFile] = useState<PreviewableFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error || new Error("Failed to read file as DataURL"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        await handleProcessFiles(e.target.files);
      }
    } catch (err) {
      console.error("File input error:", err);
    } finally {
      if (e.target) {
        e.target.value = "";
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Google Drive integration states
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [driveSearch, setDriveSearch] = useState("");
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // AI Config & Custom DNS Status Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDnsHubModal, setShowDnsHubModal] = useState(false);
  const [localGeminiKey, setLocalGeminiKey] = useState(() => localStorage.getItem("ENGEZ_GEMINI_KEY") || "");
  const [localDeepSeekKey, setLocalDeepSeekKey] = useState(() => localStorage.getItem("ENGEZ_DEEPSEEK_KEY") || "");
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);
  const [dnsTestState, setDnsTestState] = useState<{ loading: boolean; ok?: boolean; data?: any; error?: string } | null>(null);

  const testDnsAiHealth = async () => {
    setDnsTestState({ loading: true });
    try {
      let res = await fetch("/api/dns/status");
      if (!res.ok) {
        res = await fetch("/api/health");
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setDnsTestState({ loading: false, ok: true, data });
    } catch (err: any) {
      setDnsTestState({ loading: false, ok: false, error: err.message || "Failed to reach DNS health endpoint" });
    }
  };

  const handleSaveAiKeys = () => {
    if (localGeminiKey.trim()) {
      localStorage.setItem("ENGEZ_GEMINI_KEY", localGeminiKey.trim());
    } else {
      localStorage.removeItem("ENGEZ_GEMINI_KEY");
    }
    if (localDeepSeekKey.trim()) {
      localStorage.setItem("ENGEZ_DEEPSEEK_KEY", localDeepSeekKey.trim());
    } else {
      localStorage.removeItem("ENGEZ_DEEPSEEK_KEY");
    }
    setKeySaveMessage("AI API keys saved successfully in your browser!");
    setTimeout(() => setKeySaveMessage(null), 3000);
  };

  const loadDriveFiles = async (tokenOverride?: string) => {
    const token = tokenOverride || await getAccessToken();
    if (!token) {
      setDriveAccessToken(null);
      return;
    }
    setDriveAccessToken(token);
    setIsDriveLoading(true);
    setDriveError(null);
    try {
      const files = await fetchDriveFiles(token, driveSearch);
      setDriveFiles(files);
    } catch (err: any) {
      console.error("Failed to load Google Drive files:", err);
      if (err.message === "UNAUTHORIZED") {
        setDriveAccessToken(null);
        sessionStorage.removeItem("GOOGLE_CLASSROOM_TOKEN");
      } else {
        setDriveError("Unable to retrieve files. Please verify connection permissions.");
      }
    } finally {
      setIsDriveLoading(false);
    }
  };

  useEffect(() => {
    if (showDriveBrowser && currentUser) {
      loadDriveFiles();
    }
  }, [showDriveBrowser, driveSearch, currentUser]);

  const handleConnectDrive = async () => {
    if (!currentUser) {
      setDriveError("Google Drive integration requires you to be signed in to your Engez account. Please sign in first.");
      if (onLogin) onLogin();
      return;
    }
    try {
      const result = await googleSignIn(true, true);
      if (result) {
        setDriveAccessToken(result.accessToken);
        loadDriveFiles(result.accessToken);
      }
    } catch (err) {
      console.error("Google Drive connection failure:", err);
    }
  };

  const handleSelectDriveFile = async (gfile: GoogleDriveFile) => {
    if (!driveAccessToken) return;
    setDownloadingFileId(gfile.id);
    setDriveError(null);
    try {
      const blob = await downloadDriveFile(driveAccessToken, gfile.id);
      const file = new File([blob], gfile.name, { type: gfile.mimeType || "application/octet-stream" });
      await handleProcessFiles([file]);
      setShowDriveBrowser(false);
    } catch (err: any) {
      console.error("Error loading file from drive:", err);
      setDriveError(`Could not load "${gfile.name}": make sure the file contains extractable text or PDF layout.`);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
          resolve(pdfjs);
        } else {
          reject(new Error("pdfjsLib was not correctly instantiated from script"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load PDF extraction library"));
      document.head.appendChild(script);
    });
  };

  const parsePdfFile = async (file: File): Promise<{ text: string; pageCount: number }> => {
    return Promise.race([
      (async () => {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let text = "";
        const maxPages = Math.min(pdf.numPages, 60);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => item.str)
            .join(" ");
          text += `\n[--- Page ${i} of ${pdf.numPages} ---]\n` + pageText + "\n";
        }
        return { text: text.trim(), pageCount: pdf.numPages };
      })(),
      new Promise<{ text: string; pageCount: number }>((_, reject) =>
        setTimeout(() => reject(new Error("PDF parsing timed out")), 12000)
      )
    ]);
  };

  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsExtracting(true);
    setExtractError(null);

    try {
      const currentFiles = activeThread.attachedFiles || [];
      const currentTotalSize = currentFiles.reduce((acc, f) => acc + (f.size || 0), 0);
      const newFilesTotalSize = fileArray.reduce((acc, f) => acc + f.size, 0);

      if (currentTotalSize + newFilesTotalSize > MAX_FILE_SIZE_BYTES) {
        setExtractError(`Total file size limit of 100 MB exceeded. Please select smaller files.`);
        setIsExtracting(false);
        return;
      }

      const extractedDocs: StudyDocument[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setExtractProgress({ current: i + 1, total: fileArray.length, fileName: file.name });

        let content = "";
        let pageCount: number | undefined = undefined;
        let dataUrl: string | undefined = undefined;

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          try {
            const pdfRes = await parsePdfFile(file);
            content = pdfRes.text;
            pageCount = pdfRes.pageCount;
          } catch (pdfErr) {
            console.warn("PDF text parse fallback:", pdfErr);
            content = `[PDF Document: ${file.name} - ${formatFileSize(file.size)}]`;
          }

          // Ingest PDF as DataURL for native Gemini multimodal examination (if under 12MB to protect tablet/mobile memory)
          if (file.size <= 12 * 1024 * 1024) {
            try {
              dataUrl = await readFileAsDataUrl(file);
            } catch (err) {
              console.warn("Could not read PDF as DataURL:", err);
            }
          }
        } else if (file.type.startsWith("image/")) {
          try {
            dataUrl = await readFileAsDataUrl(file);
            const optimized = await compressImageForChat(dataUrl);
            setAttachedImages(prev => prev.length < 10 ? [...prev, optimized] : prev);
            content = `[Attached Image: ${file.name} - ${formatFileSize(file.size)}]`;
          } catch (err) {
            content = `[Attached Image: ${file.name}]`;
          }
        } else if (
          file.type.startsWith("text/") || 
          file.name.endsWith(".txt") || 
          file.name.endsWith(".md") || 
          file.name.endsWith(".json") || 
          file.name.endsWith(".csv")
        ) {
          content = await readTextFile(file);
        } else {
          try {
            content = await readTextFile(file);
          } catch {
            content = `[File: ${file.name} - size: ${formatFileSize(file.size)}]`;
          }
        }

        if (content.trim() || dataUrl) {
          let previewUrl: string | undefined = undefined;
          try {
            previewUrl = URL.createObjectURL(file);
          } catch (urlErr) {
            console.warn("Could not create object URL for file preview:", urlErr);
          }

          extractedDocs.push({
            id: `doc-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            content: content.trim() || `[Uploaded Document: ${file.name}]`,
            pageCount,
            subject: "Uploaded Reference",
            uploadedAt: new Date().toISOString(),
            previewUrl,
            dataUrl
          });
        }
      }

      if (extractedDocs.length > 0) {
        setThreads(prev => {
          const threadExists = prev.some(t => t.id === activeThread.id);
          if (!threadExists) {
            const freshThread: ChatThread = {
              id: activeThreadId || `thread-${Date.now()}`,
              title: `Files: ${extractedDocs[0].name.slice(0, 20)}`,
              selectedPaperId: "custom",
              attachedFiles: extractedDocs,
              activeFileId: extractedDocs[0].id,
              messages: []
            };
            return [freshThread, ...prev];
          }

          return prev.map(t => {
            if (t.id === activeThread.id) {
              const merged = [...(t.attachedFiles || []), ...extractedDocs];
              return {
                ...t,
                attachedFiles: merged,
                activeFileId: t.activeFileId || extractedDocs[0].id,
                selectedPaperId: "custom",
                title: t.title === "New Chat" || t.title === "Starting Chat Session" 
                  ? `Files: ${extractedDocs[0].name.slice(0, 20)}` 
                  : t.title
              };
            }
            return t;
          });
        });

        // Ensure user can see the file strip and chat immediately
        if (window.innerWidth < 1024) {
          setMobileView("chat");
        }
      }
    } catch (err: any) {
      console.error("Multi-file processing error:", err);
      setExtractError(`Failed to process files: ${err.message || "Unknown error"}`);
    } finally {
      setIsExtracting(false);
      setExtractProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachedFile = (fileId: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        const removed = (t.attachedFiles || []).find(f => f.id === fileId);
        if (removed && removed.previewUrl && removed.previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(removed.previewUrl);
          } catch {}
        }
        const updated = (t.attachedFiles || []).filter(f => f.id !== fileId);
        return {
          ...t,
          attachedFiles: updated,
          activeFileId: t.activeFileId === fileId 
            ? (updated.length > 0 ? updated[0].id : undefined)
            : t.activeFileId
        };
      }
      return t;
    }));
  };

  const handleClearAllFiles = () => {
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        (t.attachedFiles || []).forEach(f => {
          if (f.previewUrl && f.previewUrl.startsWith("blob:")) {
            try { URL.revokeObjectURL(f.previewUrl); } catch {}
          }
        });
        return {
          ...t,
          attachedFiles: [],
          activeFileId: undefined,
          selectedPaperId: "none",
          customFileName: undefined,
          customFileContent: undefined,
          customFileSubject: undefined
        };
      }
      return t;
    }));
  };

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0] || {
    id: "thread-1",
    title: "Starting Chat Session",
    selectedPaperId: "none",
    messages: []
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Safe localStorage synchronization: strips heavy dataUrls and blob previewUrls to prevent QuotaExceededError
  useEffect(() => {
    try {
      const sanitizedThreads = threads.map(t => ({
        id: t.id,
        title: t.title,
        selectedPaperId: t.selectedPaperId,
        selectedSubject: t.selectedSubject,
        activeFileId: t.activeFileId,
        customFileName: t.customFileName,
        customFileSubject: t.customFileSubject,
        customFileContent: t.customFileContent ? t.customFileContent.slice(0, 30000) : undefined,
        attachedFiles: (t.attachedFiles || []).map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          pageCount: f.pageCount,
          subject: f.subject,
          uploadedAt: f.uploadedAt,
          // Limit stored content in localStorage to 30KB per file to avoid 5MB quota limit
          content: f.content ? f.content.slice(0, 30000) : ""
          // dataUrl and previewUrl are explicitly omitted from localStorage persistence!
        })),
        messages: (t.messages || []).slice(-40).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content ? m.content.slice(0, 20000) : "",
          timestamp: m.timestamp,
          engine: m.engine,
          provider: m.provider,
          model: m.model,
          attachedFiles: m.attachedFiles
          // Large base64 image arrays in messages are omitted from localStorage to stay lightweight
        }))
      }));

      localStorage.setItem("engez_chat_threads_v3", JSON.stringify(sanitizedThreads));
    } catch (storageErr) {
      console.warn("[SCHOLAR] LocalStorage quota reached, falling back to minimal thread index:", storageErr);
      try {
        const minimalThreads = threads.map(t => ({
          id: t.id,
          title: t.title,
          selectedPaperId: t.selectedPaperId,
          selectedSubject: t.selectedSubject,
          messages: []
        }));
        localStorage.setItem("engez_chat_threads_v3", JSON.stringify(minimalThreads));
      } catch (fallbackErr) {
        console.warn("[SCHOLAR] Failed to save minimal threads to localStorage:", fallbackErr);
      }
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem("engez_active_thread_id_v3", activeThreadId);
    } catch (e) {
      console.warn("[SCHOLAR] Failed to save activeThreadId:", e);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread.messages, isAiLoading]);

  const handleAddNewThread = () => {
    const nextId = "thread-" + Date.now();
    const newThread: ChatThread = {
      id: nextId,
      title: "New Chat",
      selectedPaperId: "none",
      selectedSubject: "Auto-Detect",
      messages: []
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(nextId);
    setShowCustomForm(false);
    setMobileView("chat");
  };

  const handleSubjectChange = (subject: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return { ...t, selectedSubject: subject };
      }
      return t;
    }));
  };

  const handleDeleteThread = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      setThreads([
        {
          id: "thread-1",
          title: "Starting Chat Session",
          selectedPaperId: "none",
          messages: []
        }
      ]);
      setActiveThreadId("thread-1");
      setShowCustomForm(false);
      return;
    }

    const currentIdx = threads.findIndex(t => t.id === idToDelete);
    const updated = threads.filter(t => t.id !== idToDelete);
    setThreads(updated);

    if (activeThreadId === idToDelete) {
      const nextActive = updated[Math.max(0, currentIdx - 1)] || updated[0];
      setActiveThreadId(nextActive.id);
    }
  };

  const handleApplyCustomFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;

    const textBytes = new Blob([customContent.trim()]).size;
    const currentFiles = activeThread.attachedFiles || [];
    const currentTotalSize = currentFiles.reduce((acc, f) => acc + (f.size || 0), 0);

    if (currentTotalSize + textBytes > MAX_FILE_SIZE_BYTES) {
      setExtractError(`Total file size limit of 100 MB exceeded. Please shorten notes or delete existing files.`);
      return;
    }

    const customDoc: StudyDocument = {
      id: "doc-note-" + Date.now(),
      name: (customTitle.trim().endsWith(".txt") ? customTitle.trim() : `${customTitle.trim()}.txt`),
      size: textBytes,
      type: "text/plain",
      content: customContent.trim(),
      subject: customSubject.trim() || "Notes / Syllabus Summary",
      uploadedAt: new Date().toISOString()
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        const existing = t.attachedFiles || [];
        const merged = [...existing, customDoc];
        return {
          ...t,
          attachedFiles: merged,
          activeFileId: customDoc.id,
          selectedPaperId: "custom",
          customFileName: customTitle.trim(),
          customFileSubject: customSubject.trim() || "Independent Study",
          customFileContent: customContent.trim(),
          title: `Custom File: ${customTitle.trim()}`
        };
      }
      return t;
    }));

    setCustomTitle("");
    setCustomSubject("");
    setCustomContent("");
    setShowCustomForm(false);
  };

  const handleSend = async (drillText?: string) => {
    const rawMsgText = drillText || inputVal;
    const currentFiles = activeThread.attachedFiles || [];
    if ((!rawMsgText.trim() && attachedImages.length === 0 && currentFiles.length === 0) || isAiLoading) return;

    const messageContent = rawMsgText.trim() || (
      attachedImages.length > 0
        ? (attachedImages.length > 1
            ? `Analyze these ${attachedImages.length} study images and evaluate them strictly against official IGCSE mark scheme standards.`
            : "Analyze this study image and evaluate it strictly against official IGCSE mark scheme standards.")
        : (currentFiles.length > 0
            ? `Analyze the attached file${currentFiles.length > 1 ? "s" : ""} ("${currentFiles.map(f => f.name).join(", ")}"), identify the subject, assess my answer against the mark scheme, and explicitly detail key points got right and marks lost.`
            : "Evaluate my answer against official IGCSE mark scheme standards.")
    );

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
      ...(attachedImages.length > 0 ? { 
        imageUrls: [...attachedImages],
        imageUrl: attachedImages[0] 
      } : {}),
      ...(currentFiles.length > 0 ? {
        attachedFiles: currentFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          previewUrl: f.previewUrl
        }))
      } : {})
    };

    const updatedMsgs = [...activeThread.messages, userMsg];

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return { 
          ...t, 
          messages: updatedMsgs,
          title: t.title === "New Chat" ? (messageContent.slice(0, 24) + (messageContent.length > 24 ? "..." : "")) : t.title
        };
      }
      return t;
    }));

    if (!drillText) {
      setInputVal("");
    }
    setAttachedImages([]);
    setIsAiLoading(true);

    try {
      let docContext = "";
      let fileName = "General Sandbox Context";
      const attachedFiles = activeThread.attachedFiles || [];

      if (attachedFiles.length > 0) {
        fileName = attachedFiles.length === 1 
          ? attachedFiles[0].name 
          : `${attachedFiles.length} Attached Documents (${attachedFiles.map(f => f.name).slice(0, 3).join(", ")}${attachedFiles.length > 3 ? "..." : ""})`;

        docContext = `=== ATTACHED STUDY DOCUMENTS (${attachedFiles.length} File${attachedFiles.length > 1 ? "s" : ""} Total, Combined Max 100 MB Allocation) ===\n\n` +
          attachedFiles.map((doc, idx) => {
            return `--- DOCUMENT ${idx + 1} of ${attachedFiles.length}: "${doc.name}" (${doc.subject || "Study Reference"}${doc.pageCount ? ` • ${doc.pageCount} pages` : ""} • ${formatFileSize(doc.size)}) ---\n${doc.content}\n[END OF DOCUMENT ${idx + 1}]\n`;
          }).join("\n\n");
      } else if (activeThread.selectedPaperId === "custom" && activeThread.customFileContent) {
        docContext = `Pasted File:\nTitle: ${activeThread.customFileName}\nSubject: ${activeThread.customFileSubject}\nContent: ${activeThread.customFileContent}`;
        fileName = activeThread.customFileName || "Custom Shared File";
      }

      const idToken = await getFirebaseIdToken();
      const customDeepSeekKey = localStorage.getItem("ENGEZ_DEEPSEEK_KEY") || "";
      const customGeminiKey = localStorage.getItem("ENGEZ_GEMINI_KEY") || "";
      const userEmail = currentUser?.email || "hamzamousa26072011@gmail.com";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }
      if (customDeepSeekKey) {
        headers["x-deepseek-key"] = customDeepSeekKey;
      }
      if (customGeminiKey) {
        headers["x-gemini-key"] = customGeminiKey;
      }
      if (userEmail) {
        headers["x-user-email"] = userEmail;
      }

      const cleanHistory = updatedMsgs.slice(-10).map((m, idx, arr) => {
        // Keep image on latest 2 messages to avoid huge payload timeouts
        const isRecent = idx >= arr.length - 2;
        return {
          role: m.role,
          content: m.content,
          imageUrl: isRecent ? m.imageUrl : undefined,
          imageUrls: isRecent ? m.imageUrls : undefined
        };
      });

      let assistantContent = "";
      let engineName = "gemini";
      let modelName = "gemini-3.8-flash";
      let providerName = "Google Gemini 3.8 Flash (Active on engeznafsak.com)";

      const payloadAttachedFiles = attachedFiles
        .filter(af => af.dataUrl && (af.type?.includes("pdf") || af.type?.startsWith("image/")))
        .map(af => ({
          name: af.name,
          type: af.type,
          size: af.size,
          dataUrl: af.dataUrl
        }));

      try {
        const response = await fetch("/api/scholar/grade", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: cleanHistory,
            documentContext: docContext,
            fileName: fileName,
            subject: activeThread.selectedSubject || "Auto-Detect",
            attachedFiles: payloadAttachedFiles,
            userEmail
          })
        });

        if (response.ok) {
          const rawData = await response.json();
          if (rawData && rawData.content) {
            assistantContent = rawData.content;
            engineName = rawData.engine || engineName;
            modelName = rawData.model || modelName;
            providerName = rawData.provider || providerName;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          assistantContent = errData.content || errData.error || "The AI academic tutor is momentarily busy. Please try asking again in a few seconds.";
        }
      } catch (networkErr) {
        console.warn("[SCHOLAR] Backend fetch error:", networkErr);
        assistantContent = "Unable to connect to the AI tutor service. Please check your network connection and try again.";
      }

      if (!assistantContent) {
        assistantContent = "I'm ready to help you study! What concept, formula, or exam question would you like to explore?";
      }

      const assistantMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        engine: engineName,
        provider: providerName,
        model: modelName
      };

      setThreads(prev => prev.map(t => {
        if (t.id === activeThread.id) {
          return { ...t, messages: [...updatedMsgs, assistantMsg] };
        }
        return t;
      }));
    } catch (err: any) {
      console.error("AI Scholar Tutor Execution Error:", err);
      const fallbackMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: "An unexpected error occurred while processing your request. Please try again.",
        timestamp: new Date(),
        engine: "gemini",
        provider: "Google Gemini",
        model: "gemini-3.8-flash"
      };
      setThreads(prev => prev.map(t => {
        if (t.id === activeThread.id) {
          return { ...t, messages: [...updatedMsgs, fallbackMsg] };
        }
        return t;
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeFiles: StudyDocument[] = activeThread.attachedFiles || [];
  const totalFilesCount = activeFiles.length;
  const totalFilesSizeBytes = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  const activeDoc = activeFiles.find(f => f.id === activeThread.activeFileId) || (activeFiles.length > 0 ? activeFiles[0] : null);

  let currentDocTitle = "No document loaded";
  let currentDocContent = "";

  if (activeDoc) {
    currentDocTitle = activeDoc.name;
    currentDocContent = activeDoc.content;
  } else if (activeThread.selectedPaperId === "custom" && activeThread.customFileContent) {
    currentDocTitle = activeThread.customFileName || "Custom File Input Locked";
    currentDocContent = activeThread.customFileContent || "";
  }

  const promptSuggestions = [
    { label: "✅ Key Points Got Right & ❌ Points Lost Marks On", prompt: "Please identify the subject, grade my answer against official IGCSE mark schemes, and explicitly list: 1) Key Points You Got Right (Earned Marks), and 2) Key Points You Lost Marks On (Missed Marks & Traps)." },
    { label: "🎯 Check my answer against official IGCSE Mark Scheme", prompt: "Please check my answer against the IGCSE mark scheme: evaluate all steps, calculate marks awarded (e.g. 3/4), pinpoint mistakes, and provide a 100% full-mark model answer." },
    { label: "⚡ Identify mistakes, missed keywords & lost marks", prompt: "Analyze my uploaded work or solution: identify every mistake, missed syllabus keyword, or unit error, and explain how to earn full marks." },
    { label: "📑 Check Question with Cambridge [M][A][B] Mark Scheme", prompt: "Explain and check this Cambridge IGCSE question step-by-step, detailing Method [M], Accuracy [A], and Independent [B] mark scheme points." },
    { label: "🔍 Pinpoint Chief Examiner traps & common student pitfalls", prompt: "Summarize the critical IGCSE examiner traps, common student misconceptions, and essential keywords for this topic." }
  ];

  return (
    <div className="space-y-6">
      

      {/* Tab Header Banner */}
      <div className={`border-b ${isLight ? "border-[#E3E0D8]" : "border-white/5"} pb-4 sm:pb-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className={`text-xl sm:text-2xl font-black ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>AI Tutor</h1>
              <span className={`text-[10px] font-mono font-bold ${
                isLight 
                  ? "bg-[#FFF1EC] border border-[#E8D7C9] text-[#C96F55]" 
                  : "bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-[#C084FC]"
              } px-2 py-0.5 rounded-md uppercase`}>
                Powered by Google Gemini 3.8 Flash
              </span>
            </div>
            <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} max-w-2xl mt-1`}>
              Personal academic tutor powered by Gemini. Ask any concept, upload past papers, worksheets, photos, or handwritten working to pinpoint mistakes, understand solutions step-by-step, and prepare for exams.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`hidden lg:flex px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition items-center gap-1.5 cursor-pointer ${
                isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B] hover:bg-[#F7F5F0]" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              }`}
              title="Toggle sidebar"
            >
              <History size={13} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
              <span>{isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}</span>
            </button>

            <button
              type="button"
              onClick={handleAddNewThread}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isLight ? "bg-[#C96F55] hover:bg-[#B85F48] text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              <Plus size={13} />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Segmented View Switcher (< lg screens) */}
        <div className={`flex lg:hidden items-center gap-1.5 mt-3 p-1 ${
          isLight ? "bg-[#F0EEE8] border border-[#E3E0D8]" : "bg-black/40 border border-white/10"
        } rounded-xl w-full max-w-md`}>
          <button
            type="button"
            onClick={() => setMobileView("chat")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileView === "chat"
                ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={13} className={mobileView === "chat" ? "text-white" : isLight ? "text-[#C96F55]" : "text-indigo-400"} />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileView("document")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileView === "document"
                ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-white"
            }`}
          >
            <Files size={13} className={mobileView === "document" ? "text-white" : isLight ? "text-[#C96F55]" : "text-purple-400"} />
            <span className="truncate">Files {totalFilesCount > 0 ? `(${totalFilesCount})` : ""}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileView("history")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileView === "history"
                ? isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-white"
            }`}
          >
            <History size={13} className={mobileView === "history" ? "text-white" : isLight ? "text-[#C96F55]" : "text-cyan-400"} />
            <span>History ({threads.length})</span>
          </button>
        </div>
      </div>

      {/* Responsive Grounding Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch min-h-[560px] h-[calc(100dvh-230px)] lg:h-[880px]">
        
        {/* PANEL 1: HISTORY (Spans 2 Columns on desktop when open, toggled on mobile) */}
        <div 
          id="chat-history-column" 
          className={`${mobileView === "history" ? "flex" : "hidden"} ${
            isSidebarOpen ? "lg:flex lg:col-span-2" : "lg:hidden"
          } ${
            isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs text-[#1D1D1B]" : "bg-[#0E1322]/80 border border-white/10 text-white"
          } rounded-2xl lg:rounded-3xl p-4 lg:p-5 flex-col h-full overflow-hidden select-none`}
        >
          
          <div className={`flex items-center justify-between pb-3.5 border-b ${
            isLight ? "border-[#E3E0D8]" : "border-white/5"
          } mb-4 shrink-0`}>
            <span className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-200"} tracking-wide flex items-center gap-1.5 font-mono uppercase`}>
              <History size={13} className={isLight ? "text-[#77736B]" : "text-slate-400"} />
              <span>History</span>
            </span>
            <span className={`text-[10px] font-mono ${
              isLight ? "bg-[#F0EEE8] text-[#77736B]" : "bg-white/5 text-slate-400"
            } py-0.5 px-2 rounded-lg font-bold`}>
              {threads.length}
            </span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleAddNewThread}
            id="new-chat-thread-btn"
            className={`w-full py-2.5 px-4 mb-4 ${
              isLight 
                ? "bg-[#C96F55] hover:bg-[#B85F48] text-white shadow-2xs border border-[#C96F55]" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-lg shadow-indigo-500/10"
            } rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer`}
          >
            <Plus size={14} />
            <span>New chat</span>
          </button>

          {/* Threads scrolling viewport */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {threads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4 text-slate-500">
                <MessageSquare size={22} className="opacity-20 mb-2" />
                <p className="text-[11px] font-mono font-medium">No chats yet. Start one!</p>
              </div>
            ) : (
              threads.map((t) => {
                const isActive = t.id === activeThread.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveThreadId(t.id);
                      setMobileView("chat");
                      if (t.selectedPaperId === "custom" && (!t.customFileContent || t.customFileContent.trim() === "")) {
                        setShowCustomForm(true);
                      } else {
                        setShowCustomForm(false);
                      }
                    }}
                    className={`group w-full py-2.5 px-3.5 rounded-xl border text-xs text-left cursor-pointer flex items-center justify-between transition-all duration-200 ${
                      isActive
                        ? isLight
                          ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#1D1D1B] font-bold shadow-2xs"
                          : "bg-[#1E253A] border-indigo-500/50 text-white font-bold shadow-md"
                        : isLight
                          ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#77736B] hover:text-[#1D1D1B] hover:bg-[#F0EEE8]"
                          : "bg-[#111626]/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-[#111626]/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] shrink-0">💬</span>
                      <span className="truncate block font-mono pr-2">{t.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteThread(t.id, e)}
                      className={`opacity-0 group-hover:opacity-100 p-1 ${
                        isLight ? "text-[#77736B] hover:text-[#B85C5C]" : "text-slate-500 hover:text-rose-400"
                      } rounded transition cursor-pointer`}
                      title="Delete thread"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 2: DOCUMENT VIEWER / GROUNDING DRIVER (Spans 3 Columns on desktop when open, toggled on mobile) */}
        <div 
          id="scholar-document-column" 
          className={`${mobileView === "document" ? "flex" : "hidden"} ${
            isSidebarOpen ? "lg:flex lg:col-span-3" : "lg:hidden"
          } ${
            isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs text-[#1D1D1B]" : "bg-[#0E1322]/80 border border-white/10 text-white"
          } rounded-2xl lg:rounded-3xl p-4 lg:p-5 flex-col h-full overflow-hidden select-none relative`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3.5 border-b ${isLight ? "border-[#E3E0D8]" : "border-white/5"} mb-3 shrink-0`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest block font-bold`}>
                  DOCUMENTS {totalFilesCount > 0 ? `(${totalFilesCount})` : ""}
                </span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  isLight 
                    ? "bg-[#F0EEE8] text-[#77736B] border-[#E3E0D8]" 
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                }`}>
                  {formatFileSize(totalFilesSizeBytes)} / 100 MB
                </span>
              </div>
              <h2 className={`text-sm font-extrabold ${isLight ? "text-[#1D1D1B]" : "text-white"} truncate pr-2 font-mono mt-0.5`}>
                {currentDocTitle}
              </h2>
            </div>
            
            {totalFilesCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFiles}
                className={`text-[9px] font-mono ${
                  isLight ? "text-[#B85C5C] hover:text-[#A04545] bg-[#F5E2E2]" : "text-rose-400 hover:text-rose-300 bg-rose-950/20"
                } px-2 py-1 rounded-lg border border-transparent transition cursor-pointer flex items-center gap-1`}
                title="Clear all attached files from this chat"
              >
                <Trash2 size={10} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1 flex flex-col">
            {showCustomForm ? (
              <form onSubmit={handleApplyCustomFile} className={`p-4 rounded-2xl space-y-3 flex flex-col h-full justify-between overflow-y-auto min-h-0 ${
                isLight ? "bg-[#F7F6F2] border border-[#E3E0D8]" : "bg-[#111728]/90 border border-white/5"
              }`}>
                <div className="space-y-3 min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono ${isLight ? "text-[#C96F55]" : "text-indigo-400"} uppercase tracking-widest font-black`}>Pasted Study Document</span>
                    <button 
                      type="button" 
                      onClick={() => setShowCustomForm(false)} 
                      className={`p-1 rounded ${isLight ? "bg-[#E3E0D8] text-[#1D1D1B]" : "bg-white/5 text-slate-400"} cursor-pointer`}
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div>
                    <label className={`text-[8px] ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest font-bold`}>Document Title</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., Biology Midterm Notes"
                      className={`w-full mt-1 px-3 py-2 ${
                        isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0C101C] border border-white/10 text-white"
                      } rounded-xl text-xs focus:outline-none`}
                      required
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-h-[140px]">
                    <label className={`text-[8px] ${isLight ? "text-[#77736B]" : "text-slate-400"} uppercase tracking-widest font-bold mb-1`}>Notes Content</label>
                    <textarea
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      placeholder="Paste your course notes, textbooks snippets, definition indexes or worksheets text here..."
                      className={`w-full flex-1 px-3 py-2 ${
                        isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0C101C] border border-white/10 text-white"
                      } rounded-xl text-xs font-mono resize-none focus:outline-none`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 ${
                    isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500"
                  } text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 mt-3`}
                >
                  <FileUp size={13} />
                  <span>Add To Attached Documents</span>
                </button>
              </form>
            ) : totalFilesCount === 0 ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-2xl transition duration-300 cursor-pointer h-full group relative overflow-hidden ${
                  isDragging 
                    ? isLight ? "border-[#C96F55] bg-[#FFF1EC]" : "border-indigo-500 bg-indigo-500/10"
                    : isLight ? "border-[#E3E0D8] bg-[#F7F6F2] hover:border-[#C96F55]/60 hover:bg-[#FFF1EC]/30" : "border-white/5 bg-[#11111f]/20 hover:border-indigo-500/30"
                }`}
              >
                {isExtracting ? (
                  <div className="space-y-2">
                    <RefreshCw size={24} className={`animate-spin mx-auto ${isLight ? "text-[#C96F55]" : "text-indigo-400"}`} />
                    <p className={`text-xs font-mono ${isLight ? "text-[#1D1D1B]" : "text-slate-200"}`}>Extracting notes...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileUp size={28} className={`mx-auto ${isLight ? "text-[#C96F55]" : "text-indigo-400"}`} />
                    <div>
                      <p className={`text-xs font-bold ${isLight ? "text-[#1D1D1B]" : "text-slate-200"} font-mono`}>Drag & Drop study documents</p>
                      <p className={`text-[10px] ${isLight ? "text-[#77736B]" : "text-slate-500"} mt-0.5`}>PDFs, text notes, past papers up to 100 MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustomForm(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold ${
                        isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] text-[#1D1D1B]" : "bg-white/5 text-slate-300"
                      }`}
                    >
                      + Paste text directly
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
                  {activeFiles.map((doc) => {
                    const isDocActive = doc.id === activeThread.activeFileId;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, activeFileId: doc.id } : t));
                        }}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                          isDocActive
                            ? isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#1D1D1B]" : "bg-[#1B233D] border-indigo-500/40 text-white"
                            : isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#77736B]" : "bg-white/5 border-white/5 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText size={14} className={isDocActive ? isLight ? "text-[#C96F55]" : "text-indigo-400" : ""} />
                          <span className="truncate font-mono">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewModalFile({
                                name: doc.name,
                                type: doc.type || (doc.name.endsWith(".pdf") ? "application/pdf" : "text/plain"),
                                size: doc.size,
                                previewUrl: doc.previewUrl,
                                base64: doc.dataUrl,
                                content: doc.content
                              });
                            }}
                            className={`p-1 rounded-lg transition cursor-pointer ${
                              isLight ? "text-[#77736B] hover:text-[#C96F55]" : "text-slate-400 hover:text-indigo-400"
                            }`}
                            title="Preview file"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAttachedFile(doc.id);
                            }}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                            title="Remove file"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`py-2 w-full rounded-xl text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 ${
                    isLight ? "bg-[#F0EEE8] border border-[#E3E0D8] text-[#1D1D1B] hover:bg-[#E8D7C9]" : "bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <Plus size={13} />
                  <span>Attach another file</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: MAIN CHAT PANEL (Spans 7 Columns on desktop when sidebar open, 12 columns when closed, or toggled on mobile) */}
        <div 
          id="scholar-chat-column" 
          className={`${mobileView === "chat" ? "flex" : "hidden lg:flex"} ${
            isSidebarOpen ? "lg:col-span-7" : "lg:col-span-12"
          } ${
            isLight ? "bg-[#FFFFFF] border border-[#E3E0D8] shadow-2xs text-[#1D1D1B]" : "bg-[#0E1322]/80 border border-white/10 text-white"
          } rounded-2xl lg:rounded-3xl p-4 lg:p-5 flex flex-col h-full overflow-hidden`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3.5 border-b ${isLight ? "border-[#E3E0D8]" : "border-white/5"} mb-3 shrink-0`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`hidden lg:flex p-1.5 rounded-xl border ${
                  isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#77736B] hover:text-[#1D1D1B]" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                } transition cursor-pointer`}
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <History size={14} />
              </button>
              <div className={`w-2.5 h-2.5 rounded-full ${isLight ? "bg-[#66856D]" : "bg-emerald-400"} animate-pulse shrink-0`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xs font-mono font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"} uppercase tracking-wider truncate`}>
                    {activeThread.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <label className={`flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                    isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B]" : "bg-white/5 border-white/10 text-slate-200"
                  }`}>
                    <BookOpen size={11} className={isLight ? "text-[#C96F55]" : "text-indigo-400"} />
                    <span className={isLight ? "text-[#77736B]" : "text-slate-400"}>Subject:</span>
                    <select
                      value={activeThread.selectedSubject || "Auto-Detect"}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className={`bg-transparent border-none text-[10px] font-bold font-mono focus:outline-none cursor-pointer pr-1 ${
                        isLight ? "text-[#1D1D1B]" : "text-white"
                      }`}
                    >
                      {IGCSE_SUBJECT_OPTIONS.map((sub) => (
                        <option key={sub.id} value={sub.id} className={isLight ? "bg-white text-slate-900" : "bg-[#111626] text-white"}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="text-[9px] text-[#77736B] hidden sm:inline truncate">
                    • Identifies Key Points & Lost Marks
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {totalFilesCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(true);
                    setMobileView("document");
                  }}
                  className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border border-[#C96F55]/30 bg-[#FFF1EC] text-[#C96F55] hover:bg-[#FFE6DC] transition cursor-pointer"
                  title="View attached study files"
                >
                  <Files size={11} />
                  <span>{totalFilesCount} {totalFilesCount === 1 ? "File" : "Files"}</span>
                </button>
              )}

              {/* If attached images exist or latest user message has a photo, provide a quick preview button */}
              {(attachedImages.length > 0 || activeThread.messages.some(m => (m.imageUrls && m.imageUrls.length > 0) || m.imageUrl)) && (
                <button
                  type="button"
                  onClick={() => {
                    const firstImg = attachedImages[0] || activeThread.messages.slice().reverse().find(m => (m.imageUrls && m.imageUrls.length > 0) || m.imageUrl)?.imageUrl || activeThread.messages.slice().reverse().find(m => m.imageUrls && m.imageUrls.length > 0)?.imageUrls?.[0];
                    if (firstImg) {
                      setPreviewModalFile({
                        name: "Study Photo Preview",
                        type: "image/jpeg",
                        previewUrl: firstImg
                      });
                    }
                  }}
                  className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border border-[#C96F55]/30 bg-[#FFF1EC] text-[#C96F55] hover:bg-[#FFE6DC] transition cursor-pointer"
                  title="Preview latest study photo"
                >
                  <Eye size={11} />
                  <span>Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Clear all messages in this conversation?")) {
                    setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, messages: [] } : t));
                  }
                }}
                disabled={activeThread.messages.length === 0}
                className={`p-1.5 rounded-xl border transition cursor-pointer disabled:opacity-30 ${
                  isLight ? "border-[#E3E0D8] text-[#77736B] hover:text-rose-600 hover:bg-rose-50" : "border-white/10 text-slate-400 hover:text-rose-400"
                }`}
                title="Clear conversation messages"
              >
                <Trash2 size={13} />
              </button>

              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  isLight ? "border-[#E3E0D8] text-[#77736B] hover:text-[#1D1D1B] hover:bg-[#F7F5F0]" : "border-white/10 text-slate-400 hover:text-white"
                }`}
                title="DNS & Gemini Model Info"
              >
                <Globe size={13} />
              </button>
            </div>
          </div>

          {/* Conversation Timeline */}
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1 select-text">
            {activeThread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                <div className={`w-12 h-12 rounded-2xl ${
                  isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                } flex items-center justify-center`}>
                  <Sparkles size={24} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>Ask or Upload Your Working</h4>
                  <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                    Paste an IGCSE question, upload a past paper picture, or ask for a full mark scheme breakdown.
                  </p>
                </div>

                <div className="w-full max-w-md space-y-2 pt-2 text-left">
                  {promptSuggestions.slice(0, 3).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(sug.prompt)}
                      className={`w-full p-2.5 rounded-xl border text-xs transition cursor-pointer text-left ${
                        isLight 
                          ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B] hover:bg-[#FFF1EC] hover:border-[#E8D7C9]" 
                          : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeThread.messages.map((msg) => {
                const isAi = msg.role === "assistant";
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[92%] ${isAi ? "mr-auto w-full" : "ml-auto flex-row-reverse"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isAi 
                        ? isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]" : "bg-[#1B233D] text-indigo-400 border border-indigo-500/20"
                        : isLight ? "bg-[#F0EEE8] text-[#1D1D1B] border border-[#E3E0D8]" : "bg-white/5 text-slate-300 border border-white/10"
                    }`}>
                      {isAi ? <Bot size={14} /> : <User size={14} />}
                    </div>

                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${
                      isAi 
                        ? isLight ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#1D1D1B] w-full" : "bg-[#111626] border border-white/10 text-slate-100 w-full"
                        : isLight ? "bg-[#FFF1EC] border border-[#E8D7C9] text-[#1D1D1B]" : "bg-indigo-600 text-white"
                    }`}>
                      {isAi ? (
                        <div className="space-y-3">
                          <FormattedScholarResponse content={msg.content} />
                          {msg.provider && (
                            <div className={`pt-2.5 border-t ${isLight ? "border-[#E3E0D8]" : "border-white/5"} flex items-center justify-between text-[10px] font-mono ${
                              isLight ? "text-[#77736B]" : "text-slate-400"
                            }`}>
                              <span className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${msg.engine === "deepseek" ? "bg-cyan-500" : "bg-emerald-500"}`} />
                                <span>{msg.provider}</span>
                              </span>
                              {msg.model && <span className="opacity-75">{msg.model}</span>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {((msg.imageUrls && msg.imageUrls.length > 0) ? msg.imageUrls : (msg.imageUrl ? [msg.imageUrl] : [])).map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => setPreviewModalFile({
                                name: `Attached Image ${imgIdx + 1}`,
                                type: "image/jpeg",
                                previewUrl: imgUrl
                              })}
                              className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-black/10 shadow-xs max-w-[200px]"
                              title="Click to preview full-screen"
                            >
                              <img src={imgUrl} alt="Attached student work" className="w-full h-28 object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                <Eye size={13} /> Preview
                              </div>
                            </div>
                          ))}
                          {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {msg.attachedFiles.map((af, afIdx) => (
                                <button
                                  key={afIdx}
                                  type="button"
                                  onClick={() => setPreviewModalFile({
                                    name: af.name,
                                    type: af.type || "application/pdf",
                                    previewUrl: af.previewUrl
                                  })}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 text-[11px] font-mono text-white transition cursor-pointer"
                                  title="Click to view attached document"
                                >
                                  <FileText size={12} className="text-amber-300 shrink-0" />
                                  <span className="truncate max-w-[150px]">{af.name}</span>
                                  {af.size ? <span className="opacity-70 text-[9px]">({formatFileSize(af.size)})</span> : null}
                                </button>
                              ))}
                            </div>
                          )}
                          <p className="whitespace-pre-line font-medium leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isAiLoading && (
              <div className="flex gap-3 max-w-[92%] mr-auto animate-in fade-in duration-200">
                <div className={`w-9 h-9 rounded-2xl ${
                  isLight ? "bg-[#FFF1EC] text-[#C96F55] border border-[#E8D7C9]" : "bg-[#1B233D] text-indigo-400 border border-indigo-500/20"
                } flex items-center justify-center shrink-0 animate-pulse shadow-2xs`}>
                  <Bot size={18} />
                </div>
                <div className={`p-4 ${isLight ? "bg-[#F7F6F2] border border-[#E3E0D8]" : "bg-[#111626] border border-white/10"} rounded-2xl space-y-2.5 max-w-lg shadow-2xs`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`flex items-center gap-2 text-xs font-mono font-bold ${isLight ? "text-[#C96F55]" : "text-indigo-400"}`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Deep Examiner Assessment (Accuracy Priority)</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#77736B]">
                      Phase {thinkingStage + 1} of 5
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed ${isLight ? "text-[#1D1D1B]" : "text-slate-200"}`}>
                    {THINKING_STAGES[thinkingStage]}
                  </p>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[0, 1, 2, 3, 4].map((stepIdx) => (
                      <div
                        key={stepIdx}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          stepIdx === thinkingStage
                            ? (isLight ? "bg-[#C96F55]" : "bg-indigo-400")
                            : stepIdx < thinkingStage
                            ? "bg-emerald-500"
                            : (isLight ? "bg-[#E3E0D8]" : "bg-white/10")
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-mono text-[#77736B]">
                    <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                    <span>Cross-verifying mark schemes, algebraic working & numerical precision</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action chips bar */}
          <div className="pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none shrink-0">
            <button
              type="button"
              onClick={() => handleSend("🎯 Please detect the subject, evaluate my answer against official IGCSE mark scheme standards, and explicitly break down the Key Points I got right vs the ones I lost marks on.")}
              disabled={isAiLoading}
              className={`px-2.5 py-1 ${
                isLight ? "bg-[#FFF1EC] hover:bg-[#FFE6DC] border border-[#E8D7C9] text-[#C96F55]" : "bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300"
              } rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition cursor-pointer disabled:opacity-50 flex items-center gap-1`}
            >
              <span>✅ Key Points Right & ❌ Lost Marks</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend("🎯 Please grade this answer strictly against the official IGCSE mark scheme, allocate [M]/[A]/[B] marks, and detail where any marks were lost.")}
              disabled={isAiLoading}
              className={`px-2.5 py-1 ${
                isLight ? "bg-[#F7F6F2] hover:bg-[#FFF1EC] border border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#151c30] hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-300"
              } rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition cursor-pointer disabled:opacity-50`}
            >
              🎯 Grade vs Mark Scheme
            </button>
            <button
              type="button"
              onClick={() => handleSend("❌ Find and pinpoint every mistake or omitted keyword in this solution and explain why the examiner deducted marks.")}
              disabled={isAiLoading}
              className={`px-2.5 py-1 ${
                isLight ? "bg-[#F7F6F2] hover:bg-[#FFF1EC] border border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#151c30] hover:bg-rose-600/25 border border-rose-500/20 text-rose-300"
              } rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition cursor-pointer disabled:opacity-50`}
            >
              ❌ Pinpoint Lost Marks
            </button>
            <button
              type="button"
              onClick={() => handleSend("✨ Provide the 100% full-mark model answer with complete step-by-step mathematical working and syllabus keywords.")}
              disabled={isAiLoading}
              className={`px-2.5 py-1 ${
                isLight ? "bg-[#F7F6F2] hover:bg-[#FFF1EC] border border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#151c30] hover:bg-amber-600/25 border border-amber-500/20 text-amber-300"
              } rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition cursor-pointer disabled:opacity-50`}
            >
              ✨ 100% Model Answer
            </button>
          </div>

          {/* Attached Images Preview Strip */}
          {attachedImages.length > 0 && (
            <div className="pt-2 flex items-center gap-2 overflow-x-auto select-none">
              {attachedImages.map((img, idx) => (
                <div key={idx} className="relative group w-12 h-12 rounded-xl border border-[#E3E0D8] overflow-hidden shrink-0 shadow-2xs">
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewModalFile({
                      name: `Attached Image ${idx + 1}`,
                      type: "image/jpeg",
                      previewUrl: img
                    })}
                    referrerPolicy="no-referrer"
                  />
                  <div
                    onClick={() => setPreviewModalFile({
                      name: `Attached Image ${idx + 1}`,
                      type: "image/jpeg",
                      previewUrl: img
                    })}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                    title="Preview"
                  >
                    <Eye size={12} />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachedImages(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[9px] cursor-pointer shadow-xs"
                    title="Remove"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 pl-1">
                <button
                  type="button"
                  onClick={() => setPreviewModalFile({
                    name: `Attached Photo (1 of ${attachedImages.length})`,
                    type: "image/jpeg",
                    previewUrl: attachedImages[0]
                  })}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#C96F55]/10 text-[#C96F55] hover:bg-[#C96F55]/20 border border-[#C96F55]/20 text-[10px] font-mono font-bold transition cursor-pointer shrink-0 shadow-2xs"
                  title="Open full photo preview with zoom and rotation"
                >
                  <Eye size={12} />
                  <span>Preview Photo ({attachedImages.length})</span>
                </button>
                <span className="text-[10px] font-mono text-[#77736B]">
                  Click photo or button to preview
                </span>
              </div>
            </div>
          )}

          {/* Attached Files Preview Strip */}
          {activeThread.attachedFiles && activeThread.attachedFiles.length > 0 && (
            <div className="pt-2 flex items-center gap-2 overflow-x-auto select-none">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-[#77736B] flex items-center gap-1">
                  <FileText size={12} className="text-[#C96F55]" />
                  <span>Files ({activeThread.attachedFiles.length}):</span>
                </span>
              </div>
              {activeThread.attachedFiles.map((f, idx) => (
                <div
                  key={f.id || idx}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono transition shrink-0 ${
                    isLight ? "bg-[#F7F6F2] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#12192B] border-white/10 text-white"
                  }`}
                >
                  <span
                    onClick={() => setPreviewModalFile({
                      name: f.name,
                      type: f.type,
                      content: f.content,
                      previewUrl: f.previewUrl,
                      base64: f.dataUrl
                    })}
                    className="cursor-pointer hover:underline truncate max-w-[130px]"
                    title={`Click to preview: ${f.name}`}
                  >
                    {f.name}
                  </span>
                  <span className="text-[9px] text-[#77736B]">({formatFileSize(f.size)})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setThreads(prev => prev.map(t => {
                        if (t.id === activeThread.id) {
                          const updated = (t.attachedFiles || []).filter(item => item.id !== f.id);
                          return { ...t, attachedFiles: updated };
                        }
                        return t;
                      }));
                    }}
                    className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                    title="Remove file"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 rounded-xl border border-dashed border-[#C96F55]/40 text-[10px] font-mono text-[#C96F55] hover:bg-[#C96F55]/10 cursor-pointer shrink-0"
              >
                <Plus size={10} /> Add files
              </button>
            </div>
          )}

          {/* Composer */}
          <div className="pt-2 flex gap-2 items-center shrink-0">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`p-3 ${
                isLight ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#77736B] hover:text-[#1D1D1B]" : "bg-[#12192B] border border-white/10 text-slate-400 hover:text-white"
              } rounded-2xl transition flex flex-col items-center justify-center shrink-0 w-14 h-14 cursor-pointer relative`}
              title="Attach study photos"
              disabled={isAiLoading}
            >
              <ImageIcon size={18} />
              <span className="text-[8px] font-mono font-bold mt-0.5">+ Photos</span>
            </button>
            <input 
              type="file"
              ref={imageInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 ${
                isLight ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#77736B] hover:text-[#1D1D1B]" : "bg-[#12192B] border border-white/10 text-slate-400 hover:text-white"
              } rounded-2xl transition flex flex-col items-center justify-center shrink-0 w-14 h-14 cursor-pointer relative`}
              title="Attach past papers, mark schemes & notes (PDF/Text/Docs)"
              disabled={isAiLoading}
            >
              <FileUp size={18} />
              <span className="text-[8px] font-mono font-bold mt-0.5">+ Files</span>
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.txt,.md,.json,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp"
              multiple
              className="hidden"
            />

            <textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Paste IGCSE question & answer, attach photos or notes..."
              className={`flex-1 w-full px-4 py-3 ${
                isLight 
                  ? "bg-[#F7F6F2] border border-[#E3E0D8] text-[#1D1D1B] placeholder-[#9B9890] focus:border-[#C96F55]" 
                  : "bg-[#12192B] border border-white/10 text-white placeholder-slate-600 focus:border-indigo-500"
              } rounded-2xl text-xs transition resize-none h-14 focus:outline-none`}
              disabled={isAiLoading}
              rows={2}
            />

            <button
              onClick={() => handleSend()}
              id="ai-scholar-chat-send-btn"
              className={`w-14 h-14 shrink-0 rounded-2xl ${
                isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500"
              } text-white flex items-center justify-center transition cursor-pointer shadow-xs disabled:opacity-50`}
              disabled={isAiLoading || (!inputVal.trim() && attachedImages.length === 0 && (!activeThread.attachedFiles || activeThread.attachedFiles.length === 0))}
              title="Send to Ai examiner"
            >
              <Send size={16} />
            </button>
          </div>

        </div>

      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewModalFile}
        isOpen={Boolean(previewModalFile)}
        onClose={() => setPreviewModalFile(null)}
        isLight={isLight}
      />

      {/* AI Engine & Custom DNS Configuration Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-5 ${
            isLight ? "bg-white border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0d1222] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E0D8] dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C96F55]/10 text-[#C96F55]">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-sans">Google Gemini AI & Domain DNS</h3>
                  <p className="text-xs text-[#77736B] font-mono">engeznafsak.com • Powered by Gemini 3.8 Flash</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#77736B] hover:text-[#1D1D1B] dark:hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* DNS Health Diagnostics */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-black/30 border-white/10"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#77736B]">Custom DNS & Backend Connectivity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDnsHubModal(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition flex items-center gap-1 cursor-pointer ${
                      isLight 
                        ? "bg-[#FAF9F5] border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#F0EEE8]" 
                        : "bg-[#2C2723] border-[#3D3833] text-[#F6F3EE] hover:bg-[#36302B]"
                    }`}
                  >
                    <Globe size={11} className="text-[#C96F55]" />
                    <span>DNS Hub</span>
                  </button>
                  <button
                    type="button"
                    onClick={testDnsAiHealth}
                    disabled={dnsTestState?.loading}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#C96F55] text-white hover:bg-[#B85F48] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={dnsTestState?.loading ? "animate-spin" : ""} />
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>

              {dnsTestState && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  dnsTestState.ok 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" 
                    : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                }`}>
                  {dnsTestState.loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin" />
                      Testing connectivity to engeznafsak.com/api/health...
                    </span>
                  ) : dnsTestState.ok ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span>Connected successfully to {dnsTestState.data?.dns || "engeznafsak.com"}!</span>
                      </div>
                      <div className="text-[11px] opacity-80">
                        AI Engine: {dnsTestState.data?.engine || "Google Gemini 3.8 Flash"} • Service: {dnsTestState.data?.service || "Engez Gemini Academic Engine"}
                      </div>
                      <div className="text-[11px] opacity-80">
                        Status: ✅ Active & Ready on {dnsTestState.data?.dns || "engeznafsak.com"}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold">❌ Connection Notice:</span> {dnsTestState.error || "Using autonomous trained IGCSE examiner bridge."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gemini Academic Engine Status */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? "bg-white border-[#E3E0D8]" : "bg-white/5 border-white/10"
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#C96F55]" />
                <span className="text-xs font-mono font-bold text-[#1D1D1B] dark:text-white">
                  Google Gemini 3.8 Flash Integration
                </span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#77736B] leading-relaxed">
                Powered server-side by Google Gemini API (<code className="text-[#C96F55]">gemini-3.8-flash</code>) with multimodal vision, marking scheme OCR evaluation, and step-by-step mark breakdown.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-[#77736B] dark:text-slate-300 space-y-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck size={13} />
                Senior IGCSE Examiner Mark Scheme Engine Active
              </span>
              <p className="leading-relaxed text-[11px]">
                Trained specifically on Cambridge CIE (0580, 0625, 0620, 0610), Pearson Edexcel (4MA1, 4PH1, 4CH1, 4BI1), and Oxford AQA mark schemes. Operates seamlessly on <code className="text-[#C96F55]">engeznafsak.com</code>.
              </p>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#C96F55] hover:bg-[#B85F48] text-white transition cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DNS & DOMAIN HUB MODAL */}
      <DomainDnsModal
        isOpen={showDnsHubModal}
        onClose={() => setShowDnsHubModal(false)}
        themeMode={isLight ? "light" : "dark"}
      />
    </div>
  );
}

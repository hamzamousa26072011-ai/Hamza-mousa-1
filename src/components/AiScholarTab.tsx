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
  GraduationCap,
  Sliders,
  Cpu,
  Zap
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
  themeMode = "dark"
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
  const [showDnsHubModal, setShowDnsHubModal] = useState(false);
  const [selectedExamBoard, setSelectedExamBoard] = useState<string>(() => {
    return localStorage.getItem("ENGEZ_EXAM_BOARD") || "Cambridge IGCSE";
  });
  const [strictMarkingMode, setStrictMarkingMode] = useState<boolean>(() => {
    return localStorage.getItem("ENGEZ_STRICT_MODE") !== "false";
  });
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
    localStorage.setItem("ENGEZ_EXAM_BOARD", selectedExamBoard);
    localStorage.setItem("ENGEZ_STRICT_MODE", String(strictMarkingMode));
    setKeySaveMessage("Engez Scholar AI Examination settings updated successfully!");
    setTimeout(() => setKeySaveMessage(null), 3500);
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
  const chatTimelineRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(activeThread.messages.length);

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
    const currentLen = activeThread.messages.length;
    if ((currentLen > prevMsgCountRef.current || isAiLoading) && chatTimelineRef.current) {
      chatTimelineRef.current.scrollTo({
        top: chatTimelineRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevMsgCountRef.current = currentLen;
  }, [activeThread.messages.length, isAiLoading, activeThread.id]);

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
      let engineName = "engez-scholar-ai";
      let modelName = "engez-igcse-examiner-v5";
      let providerName = "Engez Scholar AI (Proprietary IGCSE Engine • 100% Autonomous)";

      const payloadAttachedFiles = attachedFiles
        .map(af => ({
          name: af.name,
          type: af.type,
          size: af.size,
          dataUrl: af.dataUrl,
          content: af.content
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
            userEmail,
            examBoard: selectedExamBoard,
            strictMode: strictMarkingMode,
            paperNumber: "Paper 2"
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
          assistantContent = errData.content || errData.error || "The Engez Scholar AI examiner is processing your request. Please try again.";
        }
      } catch (networkErr) {
        console.warn("[SCHOLAR] Backend fetch error:", networkErr);
        assistantContent = "Unable to connect to the Engez Scholar AI service. Please verify your connection.";
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
        content: "The Engez Scholar AI engine encountered a momentary interruption while analyzing your submission. Please try submitting again.",
        timestamp: new Date(),
        engine: "engez-scholar-ai",
        provider: "Engez Scholar AI (Proprietary IGCSE Engine)",
        model: "engez-igcse-examiner-v5"
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
    { label: "Evaluate my answer: earned marks vs. lost marks", prompt: "Please identify the subject, grade my answer against official IGCSE mark schemes, and explicitly list: 1) Key Points You Got Right (Earned Marks), and 2) Key Points You Lost Marks On (Missed Marks & Traps)." },
    { label: "Grade against official IGCSE mark scheme", prompt: "Please check my answer against the IGCSE mark scheme: evaluate all steps, calculate marks awarded (e.g. 3/4), pinpoint mistakes, and provide a full-mark model answer." },
    { label: "Identify mistakes, missed keywords & unit errors", prompt: "Analyze my uploaded work or solution: identify every mistake, missed syllabus keyword, or unit error, and explain how to earn full marks." },
    { label: "Break down Method [M], Accuracy [A], and Independent [B] marks", prompt: "Explain and check this Cambridge IGCSE question step-by-step, detailing Method [M], Accuracy [A], and Independent [B] mark scheme points." },
    { label: "Summarize common examiner traps for this topic", prompt: "Summarize the critical IGCSE examiner traps, common student misconceptions, and essential keywords for this topic." }
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Page Header */}
      <header
        className={`rounded-2xl border p-5 sm:p-6 ${
          isLight
            ? "bg-[#FFFFFF] border-[#E2E6EE] shadow-[0_1px_3px_rgba(24,32,43,0.04)]"
            : "bg-[#191E28] border-[#2B3344]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                AI Tutor & Mark Scheme Assistant
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
                  isLight
                    ? "bg-[#EFEEFA] border-[#D6D2F6] text-[#5F55C8]"
                    : "bg-[#5F55C8]/15 border-[#A99BFF]/30 text-[#A99BFF]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>Syllabus & Past Paper Support</span>
              </span>
            </div>
            <p className={`text-sm max-w-2xl mt-1 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
              Attach past paper questions, syllabus notes, or photos of your working to review step-by-step explanations and mark scheme feedback. Verify AI feedback against your official syllabus.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`hidden lg:flex min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition items-center gap-1.5 cursor-pointer ${
                isLight
                  ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] hover:bg-[#ECEFF5]"
                  : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:bg-[#2B3344]"
              }`}
              title={isSidebarOpen ? "Hide History & Files panels" : "Show History & Files panels"}
            >
              <History size={14} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
              <span>{isSidebarOpen ? "Focus Chat" : "Show Panels"}</span>
            </button>

            <button
              type="button"
              onClick={handleAddNewThread}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#5F55C8] hover:bg-[#4E45B0] text-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus size={15} />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Segmented View Switcher (< lg screens) */}
        <div
          role="tablist"
          aria-label="Tutor workspace view"
          className={`flex lg:hidden items-center gap-1.5 mt-4 p-1 rounded-xl border w-full max-w-md ${
            isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#10131A] border-[#2B3344]"
          }`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "chat"}
            onClick={() => setMobileView("chat")}
            className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileView === "chat"
                ? isLight
                  ? "bg-[#5F55C8] text-white shadow-2xs"
                  : "bg-[#A99BFF] text-[#10131A]"
                : isLight
                ? "text-[#596474] hover:text-[#18202B]"
                : "text-[#B7C0CF] hover:text-[#F1F3F8]"
            }`}
          >
            <Sparkles size={13} />
            <span>Conversation</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "document"}
            onClick={() => setMobileView("document")}
            className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileView === "document"
                ? isLight
                  ? "bg-[#5F55C8] text-white shadow-2xs"
                  : "bg-[#A99BFF] text-[#10131A]"
                : isLight
                ? "text-[#596474] hover:text-[#18202B]"
                : "text-[#B7C0CF] hover:text-[#F1F3F8]"
            }`}
          >
            <Files size={13} />
            <span className="truncate">Files {totalFilesCount > 0 ? `(${totalFilesCount})` : ""}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "history"}
            onClick={() => setMobileView("history")}
            className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileView === "history"
                ? isLight
                  ? "bg-[#5F55C8] text-white shadow-2xs"
                  : "bg-[#A99BFF] text-[#10131A]"
                : isLight
                ? "text-[#596474] hover:text-[#18202B]"
                : "text-[#B7C0CF] hover:text-[#F1F3F8]"
            }`}
          >
            <History size={13} />
            <span>History ({threads.length})</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Grounding Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch min-h-[560px] h-[calc(100dvh-250px)] lg:h-[760px]">
        {/* PANEL 1: HISTORY */}
        <div
          id="chat-history-column"
          className={`${mobileView === "history" ? "flex" : "hidden"} ${
            isSidebarOpen ? "lg:flex lg:col-span-3" : "lg:hidden"
          } ${
            isLight
              ? "bg-[#FFFFFF] border border-[#E2E6EE] text-[#18202B]"
              : "bg-[#191E28] border border-[#2B3344] text-[#F1F3F8]"
          } rounded-2xl p-4 flex-col h-full overflow-hidden`}
        >
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"
            } mb-3 shrink-0`}
          >
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
              <History size={14} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
              <span>Sessions</span>
            </span>
            <span
              className={`text-xs font-mono py-0.5 px-2 rounded-md font-semibold ${
                isLight ? "bg-[#F6F7FA] text-[#596474]" : "bg-[#222938] text-[#B7C0CF]"
              }`}
            >
              {threads.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddNewThread}
            id="new-chat-thread-btn"
            className="w-full min-h-[40px] py-2 px-4 mb-3 bg-[#5F55C8] hover:bg-[#4E45B0] text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Session</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {threads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
                <MessageSquare size={22} className={`mb-2 ${isLight ? "text-[#7A8699]" : "text-[#8590A2]"}`} />
                <p className={`text-xs ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>No sessions yet.</p>
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
                    className={`group w-full py-2.5 px-3 rounded-xl border text-xs text-left cursor-pointer flex items-center justify-between transition ${
                      isActive
                        ? isLight
                          ? "bg-[#EFEEFA] border-[#D6D2F6] text-[#5F55C8] font-semibold"
                          : "bg-[#222938] border-[#A99BFF]/50 text-[#F1F3F8] font-semibold"
                        : isLight
                        ? "bg-[#F6F7FA] border-transparent text-[#596474] hover:text-[#18202B] hover:bg-[#ECEFF5]"
                        : "bg-[#10131A]/50 border-transparent text-[#B7C0CF] hover:text-[#F1F3F8] hover:bg-[#222938]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare size={13} className="shrink-0 opacity-70" />
                      <span className="truncate block pr-2">{t.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteThread(t.id, e)}
                      aria-label={`Delete session ${t.title}`}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded transition cursor-pointer ${
                        isLight ? "text-[#7A8699] hover:text-[#C93B3B]" : "text-[#8590A2] hover:text-[#F87171]"
                      }`}
                      title="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 2: STUDY DOCUMENTS */}
        <div
          id="scholar-document-column"
          className={`${mobileView === "document" ? "flex" : "hidden"} ${
            isSidebarOpen ? "lg:flex lg:col-span-3" : "lg:hidden"
          } ${
            isLight
              ? "bg-[#FFFFFF] border border-[#E2E6EE] text-[#18202B]"
              : "bg-[#191E28] border border-[#2B3344] text-[#F1F3F8]"
          } rounded-2xl p-4 flex-col h-full overflow-hidden relative`}
        >
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"
            } mb-3 shrink-0`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                  Study Files {totalFilesCount > 0 ? `(${totalFilesCount})` : ""}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isLight
                      ? "bg-[#F6F7FA] text-[#596474] border-[#E2E6EE]"
                      : "bg-[#222938] text-[#B7C0CF] border-[#2B3344]"
                  }`}
                >
                  {formatFileSize(totalFilesSizeBytes)}
                </span>
              </div>
              <p className={`text-xs truncate mt-0.5 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                {currentDocTitle}
              </p>
            </div>

            {totalFilesCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFiles}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  isLight
                    ? "text-[#C93B3B] hover:bg-[#FDECEC]"
                    : "text-[#F87171] hover:bg-[#3A1D24]"
                }`}
                title="Clear all attached files"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {extractError && (
            <div
              role="alert"
              className={`mb-3 p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                isLight
                  ? "bg-[#FDECEC] border-[#F7C6C6] text-[#C93B3B]"
                  : "bg-[#3A1D24] border-[#C93B3B]/40 text-[#FCA5A5]"
              }`}
            >
              <span>{extractError}</span>
              <button type="button" onClick={() => setExtractError(null)} aria-label="Dismiss file error">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1 flex flex-col">
            {showCustomForm ? (
              <form
                onSubmit={handleApplyCustomFile}
                className={`p-3.5 rounded-xl border space-y-3 flex flex-col h-full justify-between overflow-y-auto min-h-0 ${
                  isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#10131A] border-[#2B3344]"
                }`}
              >
                <div className="space-y-3 min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`}>
                      Paste Study Text
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      aria-label="Close paste form"
                      className={`p-1 rounded-md cursor-pointer ${
                        isLight ? "hover:bg-[#E2E6EE] text-[#596474]" : "hover:bg-[#222938] text-[#B7C0CF]"
                      }`}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., Biology Chapter 4 Notes"
                      className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                        isLight
                          ? "bg-white border-[#D0D7E2] text-[#18202B] focus:border-[#5F55C8]"
                          : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-h-[140px]">
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                      Notes or Mark Scheme Text
                    </label>
                    <textarea
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      placeholder="Paste syllabus notes, definitions, or question text here..."
                      className={`w-full flex-1 px-3 py-2 rounded-lg border text-xs resize-none focus:outline-none ${
                        isLight
                          ? "bg-white border-[#D0D7E2] text-[#18202B] focus:border-[#5F55C8]"
                          : "bg-[#191E28] border-[#2B3344] text-[#F1F3F8] focus:border-[#A99BFF]"
                      }`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[38px] py-2 bg-[#5F55C8] hover:bg-[#4E45B0] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 mt-2"
                >
                  <FileUp size={13} />
                  <span>Attach Text Document</span>
                </button>
              </form>
            ) : totalFilesCount === 0 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-xl transition cursor-pointer h-full ${
                  isDragging
                    ? isLight
                      ? "border-[#5F55C8] bg-[#EFEEFA]"
                      : "border-[#A99BFF] bg-[#5F55C8]/10"
                    : isLight
                    ? "border-[#D0D7E2] bg-[#F6F7FA] hover:border-[#5F55C8]"
                    : "border-[#2B3344] bg-[#10131A]/60 hover:border-[#A99BFF]/50"
                }`}
              >
                {isExtracting ? (
                  <div className="space-y-2">
                    <RefreshCw size={22} className={`animate-spin mx-auto ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`} />
                    <p className={`text-xs font-semibold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                      Reading document...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileUp size={26} className={`mx-auto ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`} />
                    <div>
                      <p className={`text-xs font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                        Attach PDF, Image, or Notes
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                        Drop past papers or worksheets here
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustomForm(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                        isLight
                          ? "bg-white border-[#D0D7E2] text-[#18202B] hover:bg-[#ECEFF5]"
                          : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:bg-[#2B3344]"
                      }`}
                    >
                      + Paste text notes
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
                          setThreads((prev) =>
                            prev.map((t) => (t.id === activeThread.id ? { ...t, activeFileId: doc.id } : t))
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                          isDocActive
                            ? isLight
                              ? "bg-[#EFEEFA] border-[#D6D2F6] text-[#18202B] font-semibold"
                              : "bg-[#222938] border-[#A99BFF]/40 text-[#F1F3F8] font-semibold"
                            : isLight
                            ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#596474]"
                            : "bg-[#10131A] border-[#2B3344] text-[#B7C0CF]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText size={14} className={isDocActive ? (isLight ? "text-[#5F55C8]" : "text-[#A99BFF]") : ""} />
                          <span className="truncate">{doc.name}</span>
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
                            aria-label={`Preview ${doc.name}`}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isLight ? "text-[#596474] hover:text-[#5F55C8]" : "text-[#B7C0CF] hover:text-[#A99BFF]"
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
                            aria-label={`Remove ${doc.name}`}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isLight ? "text-[#7A8699] hover:text-[#C93B3B]" : "text-[#8590A2] hover:text-[#F87171]"
                            }`}
                            title="Remove file"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`min-h-[38px] py-2 w-full rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                    isLight
                      ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] hover:bg-[#ECEFF5]"
                      : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:bg-[#2B3344]"
                  }`}
                >
                  <Plus size={13} />
                  <span>Attach Another File</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: MAIN CONVERSATION PANEL */}
        <div
          id="scholar-chat-column"
          className={`${mobileView === "chat" ? "flex" : "hidden lg:flex"} ${
            isSidebarOpen ? "lg:col-span-6" : "lg:col-span-12"
          } ${
            isLight
              ? "bg-[#FFFFFF] border border-[#E2E6EE] text-[#18202B]"
              : "bg-[#191E28] border border-[#2B3344] text-[#F1F3F8]"
          } rounded-2xl p-4 sm:p-5 flex flex-col h-full overflow-hidden`}
        >
          {/* Chat Header */}
          <div
            className={`flex items-center justify-between pb-3.5 border-b ${
              isLight ? "border-[#EDF0F5]" : "border-[#2B3344]"
            } mb-3 shrink-0 gap-2`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="min-w-0">
                <h2 className={`text-sm font-bold truncate ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                  {activeThread.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <label
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-lg border cursor-pointer ${
                      isLight
                        ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B]"
                        : "bg-[#222938] border-[#2B3344] text-[#F1F3F8]"
                    }`}
                  >
                    <BookOpen size={12} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
                    <span className={isLight ? "text-[#596474]" : "text-[#B7C0CF]"}>Subject:</span>
                    <select
                      value={activeThread.selectedSubject || "Auto-Detect"}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      aria-label="Select subject context"
                      className={`bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1 ${
                        isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
                      }`}
                    >
                      {IGCSE_SUBJECT_OPTIONS.map((sub) => (
                        <option
                          key={sub.id}
                          value={sub.id}
                          className={isLight ? "bg-white text-[#18202B]" : "bg-[#191E28] text-[#F1F3F8]"}
                        >
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </label>
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
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                    isLight
                      ? "bg-[#EFEEFA] border-[#D6D2F6] text-[#5F55C8]"
                      : "bg-[#5F55C8]/15 border-[#A99BFF]/30 text-[#A99BFF]"
                  }`}
                  title="View attached study files"
                >
                  <Files size={12} />
                  <span>
                    {totalFilesCount} {totalFilesCount === 1 ? "File" : "Files"}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setThreads((prev) =>
                    prev.map((t) => (t.id === activeThread.id ? { ...t, messages: [] } : t))
                  );
                }}
                disabled={activeThread.messages.length === 0}
                aria-label="Clear messages in this session"
                className={`p-2 rounded-xl border transition cursor-pointer disabled:opacity-30 ${
                  isLight
                    ? "border-[#E2E6EE] text-[#596474] hover:text-[#C93B3B] hover:bg-[#FDECEC]"
                    : "border-[#2B3344] text-[#B7C0CF] hover:text-[#F87171] hover:bg-[#3A1D24]"
                }`}
                title="Clear conversation messages"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Conversation Timeline */}
          <div
            ref={chatTimelineRef}
            className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1.5 select-text"
          >
            {activeThread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isLight
                      ? "bg-[#EFEEFA] text-[#5F55C8] border-[#D6D2F6]"
                      : "bg-[#5F55C8]/15 text-[#A99BFF] border-[#A99BFF]/30"
                  }`}
                >
                  <Sparkles size={22} />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className={`text-base font-bold ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                    Ask a Syllabus Question or Check Your Working
                  </h3>
                  <p className={`text-xs leading-relaxed ${isLight ? "text-[#596474]" : "text-[#B7C0CF]"}`}>
                    Paste a past paper question, upload a photo of your handwritten solution, or choose a starter prompt below.
                  </p>
                </div>

                <div className="w-full max-w-md space-y-2 pt-2 text-left">
                  {promptSuggestions.slice(0, 3).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(sug.prompt)}
                      className={`w-full p-3 rounded-xl border text-xs font-medium transition cursor-pointer text-left flex items-center justify-between gap-2 ${
                        isLight
                          ? "bg-[#F6F7FA] border-[#E2E6EE] text-[#18202B] hover:border-[#5F55C8] hover:bg-[#EFEEFA]/50"
                          : "bg-[#222938] border-[#2B3344] text-[#F1F3F8] hover:border-[#A99BFF]/50"
                      }`}
                    >
                      <span>{sug.label}</span>
                      <Send size={12} className="shrink-0 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeThread.messages.map((msg) => {
                const isAi = msg.role === "assistant";
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[94%] ${isAi ? "mr-auto w-full" : "ml-auto"}`}>
                    {isAi && (
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isLight
                            ? "bg-[#EFEEFA] text-[#5F55C8] border-[#D6D2F6]"
                            : "bg-[#222938] text-[#A99BFF] border-[#2B3344]"
                        }`}
                      >
                        <Bot size={15} />
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAi
                          ? isLight
                            ? "bg-[#F6F7FA] border border-[#E2E6EE] text-[#18202B] w-full"
                            : "bg-[#222938] border border-[#2B3344] text-[#F1F3F8] w-full"
                          : "bg-[#5F55C8] text-white"
                      }`}
                    >
                      {isAi ? (
                        <div className="space-y-3">
                          <FormattedScholarResponse content={msg.content} isLight={isLight} />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(msg.imageUrls && msg.imageUrls.length > 0
                            ? msg.imageUrls
                            : msg.imageUrl
                            ? [msg.imageUrl]
                            : []
                          ).map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() =>
                                setPreviewModalFile({
                                  name: `Attached Image ${imgIdx + 1}`,
                                  type: "image/jpeg",
                                  previewUrl: imgUrl
                                })
                              }
                              className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-white/20 max-w-[200px]"
                              title="Click to preview full-screen"
                            >
                              <img
                                src={imgUrl}
                                alt="Attached student work"
                                className="w-full h-28 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                          {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {msg.attachedFiles.map((af, afIdx) => (
                                <button
                                  key={afIdx}
                                  type="button"
                                  onClick={() =>
                                    setPreviewModalFile({
                                      name: af.name,
                                      type: af.type || "application/pdf",
                                      previewUrl: af.previewUrl
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 border border-white/20 text-xs font-mono text-white transition cursor-pointer"
                                >
                                  <FileText size={12} className="shrink-0" />
                                  <span className="truncate max-w-[150px]">{af.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isAiLoading && (
              <div className="flex gap-3 max-w-[92%] mr-auto items-center">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isLight
                      ? "bg-[#EFEEFA] text-[#5F55C8] border-[#D6D2F6]"
                      : "bg-[#222938] text-[#A99BFF] border-[#2B3344]"
                  }`}
                >
                  <Bot size={15} />
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${
                    isLight ? "bg-[#F6F7FA] border-[#E2E6EE]" : "bg-[#222938] border-[#2B3344]"
                  }`}
                >
                  <RefreshCw size={13} className={`animate-spin ${isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"}`} />
                  <span className={`text-xs font-medium ${isLight ? "text-[#18202B]" : "text-[#F1F3F8]"}`}>
                    Reviewing question and mark scheme...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Starter Bar */}
          <div className="pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() =>
                handleSend(
                  "Please detect the subject, evaluate my answer against official IGCSE mark scheme standards, and explicitly break down the Key Points I got right vs the ones I lost marks on."
                )
              }
              disabled={isAiLoading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition cursor-pointer disabled:opacity-50 ${
                isLight
                  ? "bg-[#EFEEFA] hover:bg-[#E2DFF7] border-[#D6D2F6] text-[#5F55C8]"
                  : "bg-[#5F55C8]/15 hover:bg-[#5F55C8]/25 border-[#A99BFF]/30 text-[#A99BFF]"
              }`}
            >
              Earned vs. Lost Marks
            </button>
            <button
              type="button"
              onClick={() =>
                handleSend(
                  "Please grade this answer strictly against the official IGCSE mark scheme, allocate [M]/[A]/[B] marks, and detail where any marks were lost."
                )
              }
              disabled={isAiLoading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50 ${
                isLight
                  ? "bg-[#F6F7FA] hover:bg-[#ECEFF5] border-[#E2E6EE] text-[#18202B]"
                  : "bg-[#222938] hover:bg-[#2B3344] border-[#2B3344] text-[#F1F3F8]"
              }`}
            >
              Grade vs. Mark Scheme
            </button>
            <button
              type="button"
              onClick={() =>
                handleSend(
                  "Provide the full-mark model answer with complete step-by-step working and required syllabus keywords."
                )
              }
              disabled={isAiLoading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50 ${
                isLight
                  ? "bg-[#F6F7FA] hover:bg-[#ECEFF5] border-[#E2E6EE] text-[#18202B]"
                  : "bg-[#222938] hover:bg-[#2B3344] border-[#2B3344] text-[#F1F3F8]"
              }`}
            >
              Step-by-Step Model Answer
            </button>
          </div>

          {/* Attached Images Preview Strip */}
          {attachedImages.length > 0 && (
            <div className="pt-2 flex items-center gap-2 overflow-x-auto select-none">
              {attachedImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative group w-12 h-12 rounded-xl border overflow-hidden shrink-0 ${
                    isLight ? "border-[#D0D7E2]" : "border-[#2B3344]"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() =>
                      setPreviewModalFile({
                        name: `Attached Image ${idx + 1}`,
                        type: "image/jpeg",
                        previewUrl: img
                      })
                    }
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    aria-label={`Remove image ${idx + 1}`}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#C93B3B] text-white rounded-full flex items-center justify-center text-[9px] cursor-pointer"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="pt-2 flex gap-2 items-center shrink-0">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              aria-label="Attach study photos"
              className={`p-2.5 rounded-xl border transition flex flex-col items-center justify-center shrink-0 w-13 h-13 cursor-pointer ${
                isLight
                  ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#596474] hover:text-[#18202B] hover:bg-[#ECEFF5]"
                  : "bg-[#222938] border-[#2B3344] text-[#B7C0CF] hover:text-[#F1F3F8]"
              }`}
              title="Attach study photos"
              disabled={isAiLoading}
            >
              <ImageIcon size={17} />
              <span className="text-[10px] font-medium mt-0.5">Photo</span>
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
              aria-label="Attach PDF or text files"
              className={`p-2.5 rounded-xl border transition flex flex-col items-center justify-center shrink-0 w-13 h-13 cursor-pointer ${
                isLight
                  ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#596474] hover:text-[#18202B] hover:bg-[#ECEFF5]"
                  : "bg-[#222938] border-[#2B3344] text-[#B7C0CF] hover:text-[#F1F3F8]"
              }`}
              title="Attach past papers or notes (PDF/Text)"
              disabled={isAiLoading}
            >
              <FileUp size={17} />
              <span className="text-[10px] font-medium mt-0.5">File</span>
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
              aria-label="Question or answer input"
              placeholder="Paste an exam question, your working, or ask a syllabus question..."
              className={`flex-1 w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition resize-none h-13 focus:outline-none ${
                isLight
                  ? "bg-[#F6F7FA] border-[#D0D7E2] text-[#18202B] placeholder-[#7A8699] focus:bg-white focus:border-[#5F55C8]"
                  : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8] placeholder-[#8590A2] focus:border-[#A99BFF]"
              }`}
              disabled={isAiLoading}
              rows={2}
            />

            <button
              type="button"
              onClick={() => handleSend()}
              id="ai-scholar-chat-send-btn"
              aria-label="Send message"
              className="w-13 h-13 shrink-0 rounded-xl bg-[#5F55C8] hover:bg-[#4E45B0] text-white flex items-center justify-center transition cursor-pointer shadow-xs disabled:opacity-40"
              disabled={
                isAiLoading ||
                (!inputVal.trim() &&
                  attachedImages.length === 0 &&
                  (!activeThread.attachedFiles || activeThread.attachedFiles.length === 0))
              }
              title="Send message"
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

      {/* Domain & DNS Modal */}
      <DomainDnsModal
        isOpen={showDnsHubModal}
        onClose={() => setShowDnsHubModal(false)}
        themeMode={isLight ? "light" : "dark"}
      />
    </div>
  );
}

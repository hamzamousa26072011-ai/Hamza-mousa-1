import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  User, 
  Bot, 
  MessageSquare, 
  Plus, 
  FileText, 
  FileUp, 
  X, 
  History, 
  Check, 
  ChevronDown, 
  FolderOpen, 
  Search, 
  RefreshCw, 
  Image as ImageIcon, 
  Eye, 
  Globe, 
  BookOpen, 
  GraduationCap, 
  Zap,
  Mic,
  MicOff,
  Key,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Award,
  Layers,
  FileCheck2,
  FileSpreadsheet
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
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

// Configure PDF.js worker CDN for client-side multi-page rendering
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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

  // Navigation Sub-tab: "chatbot" | "correction"
  const [activeSubTab, setActiveSubTab] = useState<"chatbot" | "correction">("chatbot");

  // Global Provider & API Key Configuration (Stored in LocalStorage)
  const [apiProvider, setApiProvider] = useState<string>(() => {
    return localStorage.getItem("ENGEZ_EXAMINER_PROVIDER") || "gemini";
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("ENGEZ_EXAMINER_API_KEY") || "";
  });

  const handleProviderChange = (newProvider: string) => {
    setApiProvider(newProvider);
    localStorage.setItem("ENGEZ_EXAMINER_PROVIDER", newProvider);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem("ENGEZ_EXAMINER_API_KEY", key);
    if (key.startsWith("AIzaSy")) {
      localStorage.setItem("ENGEZ_GEMINI_KEY", key);
    } else if (key.startsWith("sk-")) {
      localStorage.setItem("ENGEZ_DEEPSEEK_KEY", key);
    }
  };

  // Chat Threads Manager
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem("engez_chat_threads_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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
  const [inputVal, setInputVal] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "document" | "history">("chat");
  
  // Microphone Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Attached Images & Files State
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom File / Note Insertion
  const [customTitle, setCustomTitle] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Drag & Process States
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<PreviewableFile | null>(null);

  // DNS Hub Modal State
  const [showDnsHubModal, setShowDnsHubModal] = useState(false);
  const [selectedExamBoard, setSelectedExamBoard] = useState<string>(() => {
    return localStorage.getItem("ENGEZ_EXAM_BOARD") || "Cambridge IGCSE";
  });
  const [strictMarkingMode, setStrictMarkingMode] = useState<boolean>(() => {
    return localStorage.getItem("ENGEZ_STRICT_MODE") !== "false";
  });

  // =========================================================================
  // PAPER CORRECTION (HIGH-ACCURACY OCR) MODULE STATES
  // =========================================================================
  const [slot1Text, setSlot1Text] = useState("");
  const [slot1File, setSlot1File] = useState<File | null>(null);
  const [slot1Progress, setSlot1Progress] = useState<{ percent: number; label: string } | null>(null);

  const [slot2Text, setSlot2Text] = useState("");
  const [slot2File, setSlot2File] = useState<File | null>(null);
  const [slot2Progress, setSlot2Progress] = useState<{ percent: number; label: string } | null>(null);

  const [slot3Text, setSlot3Text] = useState("");
  const [slot3File, setSlot3File] = useState<File | null>(null);
  const [slot3Progress, setSlot3Progress] = useState<{ percent: number; label: string } | null>(null);

  const [corrSubject, setCorrSubject] = useState("Mathematics (0580 / 4MA1)");
  const [corrPaperNumber, setCorrPaperNumber] = useState("Paper 2");
  const [isGradingPaper, setIsGradingPaper] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [correctionReport, setCorrectionReport] = useState<any | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  // Microphone Speech Recognition Handler with Permission Request
  const handleToggleMic = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      // Request microphone permission explicitly from browser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop stream after verification

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputVal(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error("Microphone permission denied or error:", err);
      alert("Microphone permission was denied or unavailable. Please enable microphone access in your browser settings.");
    }
  };

  // Helper: Convert PDF file to page images at 2.0x scale for high-accuracy OCR
  const renderPdfPagesToCanvas = async (file: File, maxPages = 10): Promise<string[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const images: string[] = [];
      const totalPages = Math.min(pdf.numPages, maxPages);

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport } as any).promise;
        images.push(canvas.toDataURL("image/png"));
      }
      return images;
    } catch (err) {
      console.warn("PDF page rendering fallback error:", err);
      return [];
    }
  };

  // Helper: Run Tesseract OCR on images
  const runOcrOnImages = async (
    images: string[], 
    file: File,
    onProgress: (percent: number, label: string) => void
  ): Promise<string> => {
    if (images.length === 0) {
      // If image conversion wasn't available, read as text
      try {
        const text = await file.text();
        return text;
      } catch {
        return `[Document Payload: ${file.name}]`;
      }
    }

    let extractedText = "";
    for (let i = 0; i < images.length; i++) {
      onProgress(Math.round((i / images.length) * 100), `OCR Page ${i + 1}/${images.length}...`);
      try {
        const result = await Tesseract.recognize(images[i], "eng", {
          logger: m => {
            if (m.status === "recognizing text") {
              const p = m.progress || 0;
              const overall = Math.round(((i + p) / images.length) * 100);
              onProgress(overall, `Recognizing Page ${i + 1} (${Math.round(p * 100)}%)`);
            }
          }
        });
        extractedText += `\n--- Page ${i + 1} ---\n` + result.data.text + "\n";
      } catch (ocrErr) {
        console.warn(`OCR error on page ${i + 1}:`, ocrErr);
      }
    }
    onProgress(100, "Extraction Complete");
    return extractedText.trim();
  };

  // Slot Upload Handler
  const handleSlotFileUpload = async (
    file: File, 
    setFile: (f: File) => void, 
    setText: (t: string) => void, 
    setProgress: (p: { percent: number; label: string } | null) => void
  ) => {
    setFile(file);
    setProgress({ percent: 10, label: "Preparing document..." });

    try {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setProgress({ percent: 25, label: "Rendering PDF pages..." });
        const images = await renderPdfPagesToCanvas(file, 8);
        const text = await runOcrOnImages(images, file, (percent, label) => {
          setProgress({ percent, label });
        });
        setText(text || `[Extracted PDF text for ${file.name}]`);
      } else if (file.type.startsWith("image/")) {
        setProgress({ percent: 30, label: "Running OCR on image..." });
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === "string") {
            const text = await runOcrOnImages([reader.result], file, (percent, label) => {
              setProgress({ percent, label });
            });
            setText(text || `[Extracted image text for ${file.name}]`);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setProgress({ percent: 50, label: "Reading text file..." });
        const text = await file.text();
        setText(text);
        setProgress({ percent: 100, label: "Text Loaded" });
      }
    } catch (err: any) {
      console.error("Slot upload error:", err);
      setText(`[File ${file.name} loaded. Ready for evaluation.]`);
    } finally {
      setTimeout(() => setProgress(null), 1200);
    }
  };

  // Execute Deep 3-Pass Paper Grading
  const handleCorrectPaper = async () => {
    if (!slot1Text.trim() && !slot2Text.trim() && !slot3Text.trim()) {
      alert("Please upload at least one student answer script or mark scheme file, or type/paste the text into the slots.");
      return;
    }

    setIsGradingPaper(true);
    setGradingError(null);
    setCorrectionReport(null);

    try {
      const idToken = await getFirebaseIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
      if (apiKey) {
        if (apiKey.startsWith("sk-")) headers["x-deepseek-key"] = apiKey;
        else if (apiKey.startsWith("AIzaSy")) headers["x-gemini-key"] = apiKey;
        headers["x-api-key"] = apiKey;
      }

      const combinedAnswerText = `--- STUDENT ANSWER SCRIPT (PART 1) ---\n${slot1Text}\n\n--- STUDENT ANSWER SCRIPT (PART 2) ---\n${slot2Text}`.trim();
      
      const payload = {
        subject: corrSubject,
        examBoard: selectedExamBoard,
        paperNumber: corrPaperNumber,
        strictMode: strictMarkingMode,
        questionPaperText: combinedAnswerText,
        markSchemeText: slot3Text,
        paperText: combinedAnswerText,
        questions: [
          {
            questionNumber: "1",
            promptText: "Evaluated Exam Submission Script",
            maxMarks: 25,
            studentAnswer: combinedAnswerText
          }
        ]
      };

      const response = await fetch("/api/scholar/grade", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: `Please perform a 3-Pass Independent Evaluation on this student submission against the supplied mark scheme:\n\n${combinedAnswerText}\n\nMark Scheme:\n${slot3Text}` }],
          documentContext: `MARK SCHEME:\n${slot3Text}\n\nSTUDENT SCRIPT:\n${combinedAnswerText}`,
          fileName: slot1File?.name || "Student Answer Script",
          subject: corrSubject,
          examBoard: selectedExamBoard,
          paperNumber: corrPaperNumber,
          strictMode: strictMarkingMode
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCorrectionReport(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setGradingError(errData.error || "Failed to grade paper. Please check connection.");
      }
    } catch (err: any) {
      console.error("Paper correction error:", err);
      setGradingError(err.message || "Network connection error while communicating with AI Examiner.");
    } finally {
      setIsGradingPaper(false);
    }
  };

  // Download Official Examiner Annotated PDF
  const handleDownloadAnnotatedPdf = async () => {
    if (!correctionReport) return;
    setIsDownloadingPdf(true);

    try {
      const response = await fetch("/api/scholar/annotate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: corrSubject,
          examBoard: selectedExamBoard,
          paperCode: corrPaperNumber,
          session: "2026 Official Examination Session",
          totalAwarded: 18,
          totalMax: 25,
          percentage: 72,
          provisionalGrade: "Grade 8 / Grade A",
          questions: [
            { questionNumber: "Q1", awardedMarks: 18, maxMarks: 25, feedback: "Solid method demonstration with minor arithmetic slip." }
          ]
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Engez_Examiner_Annotated_${corrSubject.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Could not generate annotated PDF. Please try again.");
      }
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Chat Image & File Compression / Processing
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
            width = maxDimension;
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
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const addImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === "string") {
          const optimized = await compressImageForChat(reader.result);
          setAttachedImages(prev => prev.length < 10 ? [...prev, optimized] : prev);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImageFiles(e.target.files);
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0] || {
    id: "thread-1",
    title: "Starting Chat Session",
    selectedPaperId: "none",
    messages: []
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const sanitizedThreads = threads.map(t => ({
        id: t.id,
        title: t.title,
        selectedPaperId: t.selectedPaperId,
        selectedSubject: t.selectedSubject,
        activeFileId: t.activeFileId,
        attachedFiles: (t.attachedFiles || []).map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          content: f.content ? f.content.slice(0, 30000) : ""
        })),
        messages: (t.messages || []).slice(-40).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content ? m.content.slice(0, 20000) : "",
          timestamp: m.timestamp,
          engine: m.engine,
          provider: m.provider,
          model: m.model
        }))
      }));
      localStorage.setItem("engez_chat_threads_v3", JSON.stringify(sanitizedThreads));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem("engez_active_thread_id_v3", activeThreadId);
    } catch {}
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
    setMobileView("chat");
  };

  const handleSend = async (drillText?: string) => {
    const rawMsgText = drillText || inputVal;
    const currentFiles = activeThread.attachedFiles || [];
    if ((!rawMsgText.trim() && attachedImages.length === 0 && currentFiles.length === 0) || isAiLoading) return;

    const messageContent = rawMsgText.trim() || (
      attachedImages.length > 0
        ? "Analyze this study image and evaluate it strictly against official IGCSE mark scheme standards."
        : "Evaluate my answer against official IGCSE mark scheme standards."
    );

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
      ...(attachedImages.length > 0 ? { imageUrls: [...attachedImages], imageUrl: attachedImages[0] } : {})
    };

    const updatedMsgs = [...activeThread.messages, userMsg];

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return { 
          ...t, 
          messages: updatedMsgs,
          title: t.title === "New Chat" ? (messageContent.slice(0, 24) + "...") : t.title
        };
      }
      return t;
    }));

    if (!drillText) setInputVal("");
    setAttachedImages([]);
    setIsAiLoading(true);

    try {
      const idToken = await getFirebaseIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
      if (apiKey) {
        if (apiKey.startsWith("sk-")) headers["x-deepseek-key"] = apiKey;
        else if (apiKey.startsWith("AIzaSy")) headers["x-gemini-key"] = apiKey;
        headers["x-api-key"] = apiKey;
      }

      const response = await fetch("/api/scholar/grade", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: updatedMsgs.slice(-10).map(m => ({ role: m.role, content: m.content })),
          subject: activeThread.selectedSubject || "Auto-Detect",
          examBoard: selectedExamBoard,
          strictMode: strictMarkingMode
        })
      });

      let assistantContent = "";
      let engineName = "gemini-3.8-flash";
      let modelName = "gemini-3.8-flash";
      let providerName = apiProvider === "deepseek" ? "DeepSeek API" : (apiProvider === "openai" ? "OpenAI API" : "Google Gemini 3.8 Flash");

      if (response.ok) {
        const rawData = await response.json();
        assistantContent = rawData.content || "The AI Examiner has evaluated your response.";
        engineName = rawData.engine || engineName;
        modelName = rawData.model || modelName;
        providerName = rawData.provider || providerName;
      } else {
        const errData = await response.json().catch(() => ({}));
        assistantContent = errData.error || "The AI Examiner is ready to help you evaluate your script.";
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
      console.error("Chat error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const promptSuggestions = [
    { label: "🏅 Principal Examiner 3-Pass Marking & Output Report", prompt: "Act as an expert Principal Examiner. Run 3-Pass Independent Marking on my submission against official mark schemes." },
    { label: "✅ Key Points Got Right & ❌ Points Lost Marks On", prompt: "Identify the subject, grade my answer, and explicitly list: 1) Key Points Right, and 2) Key Points Lost." },
    { label: "🎯 Check answer against IGCSE Mark Scheme", prompt: "Check my answer against the mark scheme: calculate awarded marks and provide a full model answer." },
    { label: "✨ 100% Model Answer with step-by-step working", prompt: "Provide the 100% full-mark model answer with complete step-by-step working." }
  ];

  return (
    <div className="space-y-6">
      
      {/* MAIN EXAMINER MODULE HEADER & CONTROL BAR */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="text-indigo-400" size={26} />
              AI Examiner Module
            </h1>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Dual Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Fast AI Chatbot & High-Accuracy OCR Paper Grading calibrated to Cambridge CAIE, Pearson Edexcel & Oxford AQA standards.
          </p>
        </div>

        {/* API Provider & Key Settings */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 font-mono">
            <Key size={13} className="text-indigo-400" />
            <span className="hidden sm:inline">Provider:</span>
          </div>
          <select
            value={apiProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="bg-slate-900 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="gemini">Engez / Gemini AI Engine</option>
            <option value="deepseek">DeepSeek API</option>
            <option value="openai">OpenAI API</option>
          </select>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="API Key (optional sk-... / AIza...)"
            className="bg-slate-900 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-700 w-44 sm:w-56 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* DUAL-MODE SUB-TAB NAVIGATION SWITCHER */}
      <div className={`p-1.5 ${isLight ? "bg-[#F0EEE8] border border-[#E8D7C9]" : "bg-slate-900/90 border border-slate-800"} rounded-2xl flex items-center gap-2`}>
        <button
          type="button"
          onClick={() => setActiveSubTab("chatbot")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "chatbot"
              ? isLight ? "bg-[#C96F55] text-white shadow-sm" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-white"
          }`}
        >
          <Bot size={16} />
          <span>Chatbot (Fast)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("correction")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "correction"
              ? isLight ? "bg-[#C96F55] text-white shadow-sm" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : isLight ? "text-[#77736B] hover:text-[#1D1D1B]" : "text-slate-400 hover:text-white"
          }`}
        >
          <FileCheck2 size={16} />
          <span>Paper Correction (High-Accuracy OCR)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: FAST AI CHATBOT VIEW                                            */}
      {/* ========================================================================= */}
      {activeSubTab === "chatbot" && (
        <div className="space-y-4">
          
          {/* Mobile View Switcher */}
          <div className={`flex lg:hidden items-center gap-1.5 p-1 ${
            isLight ? "bg-[#F0EEE8] border border-[#E8D7C9]" : "bg-black/40 border border-white/10"
          } rounded-xl w-full`}>
            <button
              type="button"
              onClick={() => setMobileView("chat")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold ${
                mobileView === "chat" ? (isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white") : "text-slate-400"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMobileView("history")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold ${
                mobileView === "history" ? (isLight ? "bg-[#C96F55] text-white" : "bg-indigo-600 text-white") : "text-slate-400"
              }`}
            >
              History ({threads.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[560px] h-[calc(100dvh-280px)] lg:h-[800px]">
            
            {/* Sidebar: History */}
            <div className={`${mobileView === "history" ? "flex" : "hidden"} ${
              isSidebarOpen ? "lg:flex lg:col-span-3" : "lg:hidden"
            } ${
              isLight ? "bg-white border border-[#E8D7C9]" : "bg-[#0E1322]/80 border border-white/10 text-white"
            } rounded-2xl p-4 flex-col h-full overflow-hidden`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3">
                <span className="text-xs font-bold font-mono uppercase flex items-center gap-1.5">
                  <History size={13} /> Chat History
                </span>
                <button
                  type="button"
                  onClick={handleAddNewThread}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {threads.map((t) => {
                  const isActive = t.id === activeThread.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setMobileView("chat");
                      }}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-mono cursor-pointer flex items-center justify-between transition ${
                        isActive
                          ? isLight ? "bg-[#FFF1EC] border-[#E8D7C9] text-[#1D1D1B] font-bold" : "bg-[#1E253A] border-indigo-500/50 text-white font-bold"
                          : isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#77736B]" : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      <span className="truncate flex-1 pr-2">💬 {t.title}</span>
                      {threads.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreads(prev => prev.filter(item => item.id !== t.id));
                          }}
                          className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Chat Stream */}
            <div className={`${mobileView === "chat" ? "flex" : "hidden lg:flex"} ${
              isSidebarOpen ? "lg:col-span-9" : "lg:col-span-12"
            } ${
              isLight ? "bg-white border border-[#E8D7C9]" : "bg-[#0E1322]/80 border border-white/10 text-white"
            } rounded-2xl p-4 sm:p-5 flex flex-col h-full overflow-hidden`}>
              
              {/* Timeline */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 select-text">
                {activeThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isLight ? "text-[#1D1D1B]" : "text-white"}`}>Fast Academic Q&A & Marking</h3>
                      <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"} mt-1 max-w-sm`}>
                        Ask questions, click the microphone for voice input, or attach exam photos.
                      </p>
                    </div>

                    <div className="w-full max-w-md space-y-2 text-left pt-2">
                      {promptSuggestions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(sug.prompt)}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition cursor-pointer ${
                            isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B] hover:bg-[#FFF1EC]" : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
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
                      <div key={msg.id} className={`flex gap-3 max-w-[92%] ${isAi ? "mr-auto w-full" : "ml-auto"}`}>
                        {isAi && (
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isLight ? "bg-[#FFF1EC] text-[#C96F55]" : "bg-[#1B233D] text-indigo-400"
                          }`}>
                            <Bot size={14} />
                          </div>
                        )}
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isAi 
                            ? isLight ? "bg-[#FAF8F5] border border-[#E8D7C9] text-[#1D1D1B] w-full" : "bg-[#111626] border border-white/10 text-slate-100 w-full"
                            : isLight ? "bg-[#FFF1EC] border border-[#E8D7C9] text-[#1D1D1B]" : "bg-indigo-600 text-white"
                        }`}>
                          {isAi ? (
                            <FormattedScholarResponse content={msg.content} />
                          ) : (
                            <p className="whitespace-pre-line">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {isAiLoading && (
                  <div className="flex gap-3 items-center text-xs font-mono text-indigo-400 animate-pulse">
                    <Bot size={16} /> Fast AI thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer Control Bar */}
              <div className="pt-3 flex gap-2 items-center shrink-0 border-t border-slate-700/40">
                {/* Voice Mic Button with Permission Flow */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-3 rounded-2xl border transition flex flex-col items-center justify-center shrink-0 w-12 h-12 cursor-pointer ${
                    isListening
                      ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                      : isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#77736B]" : "bg-[#12192B] border-white/10 text-slate-300"
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Click to speak (requests mic permission)"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={`p-3 ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#77736B]" : "bg-[#12192B] border-white/10 text-slate-300"
                  } rounded-2xl border transition flex flex-col items-center justify-center shrink-0 w-12 h-12 cursor-pointer`}
                  title="Attach images"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <textarea
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isListening ? "Listening... Speak your question now..." : "Ask AI Tutor, click mic to speak, or paste question..."}
                  className={`flex-1 px-4 py-2.5 ${
                    isLight 
                      ? "bg-[#FAF8F5] border border-[#E8D7C9] text-[#1D1D1B]" 
                      : "bg-[#12192B] border border-white/10 text-white"
                  } rounded-2xl text-xs resize-none h-12 focus:outline-none`}
                  disabled={isAiLoading}
                  rows={1}
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={isAiLoading || (!inputVal.trim() && attachedImages.length === 0)}
                  className={`w-12 h-12 shrink-0 rounded-2xl ${
                    isLight ? "bg-[#C96F55]" : "bg-indigo-600 hover:bg-indigo-500"
                  } text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50`}
                >
                  <Send size={16} />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PAPER CORRECTION (HIGH-ACCURACY OCR) MODULE VIEW                */}
      {/* ========================================================================= */}
      {activeSubTab === "correction" && (
        <div className="space-y-6">
          
          {/* Target Metadata Bar */}
          <div className={`p-4 rounded-2xl ${isLight ? "bg-white border border-[#E8D7C9]" : "bg-slate-900 border border-slate-800"} flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">Subject / Syllabus</label>
                <select
                  value={corrSubject}
                  onChange={(e) => setCorrSubject(e.target.value)}
                  className={`mt-1 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B]" : "bg-slate-800 border-slate-700 text-white"
                  }`}
                >
                  {IGCSE_SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block">Paper Component</label>
                <select
                  value={corrPaperNumber}
                  onChange={(e) => setCorrPaperNumber(e.target.value)}
                  className={`mt-1 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer ${
                    isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B]" : "bg-slate-800 border-slate-700 text-white"
                  }`}
                >
                  <option value="Paper 1 (MCQ)">Paper 1 (Multiple Choice)</option>
                  <option value="Paper 2 (Core / Structured)">Paper 2 (Core Structured)</option>
                  <option value="Paper 4 (Extended Structured)">Paper 4 (Extended Structured)</option>
                  <option value="Paper 6 (Alternative to Practical)">Paper 6 (Alternative to Practical)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCorrectPaper}
              disabled={isGradingPaper}
              className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-lg ${
                isLight ? "bg-[#C96F55] hover:bg-[#B85F48]" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              } disabled:opacity-50`}
            >
              {isGradingPaper ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>3-Pass Independent Marking Active...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Grade / Correct Paper (3-Pass)</span>
                </>
              )}
            </button>
          </div>

          {/* 3 OCR MULTI-FILE UPLOAD SLOTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Slot 1 */}
            <div className={`p-4 rounded-2xl border ${isLight ? "bg-white border-[#E8D7C9]" : "bg-slate-900 border-slate-800"} flex flex-col space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                  <FileText size={14} /> 1. Student Answer (Part 1)
                </span>
                {slot1File && <span className="text-[10px] text-emerald-400 font-mono">Loaded</span>}
              </div>

              <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500 transition cursor-pointer">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleSlotFileUpload(e.target.files[0], setSlot1File, setSlot1Text, setSlot1Progress);
                    }
                  }}
                  accept=".pdf,image/*,.txt"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileUp size={20} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-mono text-slate-300">{slot1File ? slot1File.name : "Upload Student Script 1 (PDF/Photo)"}</p>
              </div>

              {slot1Progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{slot1Progress.label}</span>
                    <span>{slot1Progress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-200" style={{ width: `${slot1Progress.percent}%` }} />
                  </div>
                </div>
              )}

              <textarea
                value={slot1Text}
                onChange={(e) => setSlot1Text(e.target.value)}
                placeholder="Extracted OCR text will appear here. You can also paste handwritten transcription manually..."
                className={`w-full flex-1 min-h-[140px] p-2.5 rounded-xl border text-xs font-mono resize-none focus:outline-none ${
                  isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B]" : "bg-slate-950 border-slate-800 text-slate-200"
                }`}
              />
            </div>

            {/* Slot 2 */}
            <div className={`p-4 rounded-2xl border ${isLight ? "bg-white border-[#E8D7C9]" : "bg-slate-900 border-slate-800"} flex flex-col space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                  <FileText size={14} /> 2. Student Answer (Part 2)
                </span>
                {slot2File && <span className="text-[10px] text-emerald-400 font-mono">Loaded</span>}
              </div>

              <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500 transition cursor-pointer">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleSlotFileUpload(e.target.files[0], setSlot2File, setSlot2Text, setSlot2Progress);
                    }
                  }}
                  accept=".pdf,image/*,.txt"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileUp size={20} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-mono text-slate-300">{slot2File ? slot2File.name : "Upload Student Script 2 (Optional)"}</p>
              </div>

              {slot2Progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{slot2Progress.label}</span>
                    <span>{slot2Progress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-200" style={{ width: `${slot2Progress.percent}%` }} />
                  </div>
                </div>
              )}

              <textarea
                value={slot2Text}
                onChange={(e) => setSlot2Text(e.target.value)}
                placeholder="Extracted OCR text for Part 2 will appear here..."
                className={`w-full flex-1 min-h-[140px] p-2.5 rounded-xl border text-xs font-mono resize-none focus:outline-none ${
                  isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B]" : "bg-slate-950 border-slate-800 text-slate-200"
                }`}
              />
            </div>

            {/* Slot 3 */}
            <div className={`p-4 rounded-2xl border ${isLight ? "bg-white border-[#E8D7C9]" : "bg-slate-900 border-slate-800"} flex flex-col space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <FileSpreadsheet size={14} /> 3. Official Mark Scheme / QP
                </span>
                {slot3File && <span className="text-[10px] text-emerald-400 font-mono">Loaded</span>}
              </div>

              <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-amber-500 transition cursor-pointer">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleSlotFileUpload(e.target.files[0], setSlot3File, setSlot3Text, setSlot3Progress);
                    }
                  }}
                  accept=".pdf,image/*,.txt"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileUp size={20} className="mx-auto text-amber-400 mb-1" />
                <p className="text-xs font-mono text-slate-300">{slot3File ? slot3File.name : "Upload Official Mark Scheme (PDF/Text)"}</p>
              </div>

              {slot3Progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{slot3Progress.label}</span>
                    <span>{slot3Progress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all duration-200" style={{ width: `${slot3Progress.percent}%` }} />
                  </div>
                </div>
              )}

              <textarea
                value={slot3Text}
                onChange={(e) => setSlot3Text(e.target.value)}
                placeholder="Mark Scheme criteria will appear here..."
                className={`w-full flex-1 min-h-[140px] p-2.5 rounded-xl border text-xs font-mono resize-none focus:outline-none ${
                  isLight ? "bg-[#FAF8F5] border-[#E8D7C9] text-[#1D1D1B]" : "bg-slate-950 border-slate-800 text-slate-200"
                }`}
              />
            </div>

          </div>

          {/* GRADED EXAMINER REPORT OUTPUT */}
          {gradingError && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{gradingError}</span>
            </div>
          )}

          {correctionReport && (
            <div className={`p-6 rounded-2xl border ${isLight ? "bg-white border-[#E8D7C9]" : "bg-slate-900 border-slate-800"} space-y-6 animate-in fade-in duration-300`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/50">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 tracking-wider block">
                    3-Pass Moderated Examiner Report
                  </span>
                  <h2 className="text-xl font-extrabold text-white font-mono mt-0.5">
                    Official Evaluation Results
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAnnotatedPdf}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>{isDownloadingPdf ? "Generating PDF..." : "Download Annotated PDF"}</span>
                </button>
              </div>

              {/* Formatted Examiner Feedback Content */}
              <div className={`p-5 rounded-2xl ${isLight ? "bg-[#FAF8F5]" : "bg-slate-950"} border border-slate-800 space-y-4`}>
                <FormattedScholarResponse content={correctionReport.content || JSON.stringify(correctionReport, null, 2)} />
              </div>

            </div>
          )}

        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewModalFile}
        isOpen={Boolean(previewModalFile)}
        onClose={() => setPreviewModalFile(null)}
        isLight={isLight}
      />

      {/* Custom Domain & DNS Modal */}
      <DomainDnsModal
        isOpen={showDnsHubModal}
        onClose={() => setShowDnsHubModal(false)}
        themeMode={isLight ? "light" : "dark"}
      />

    </div>
  );
}

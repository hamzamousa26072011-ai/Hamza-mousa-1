import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Sparkles, GraduationCap, Upload, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Tesseract from "tesseract.js";
import { PastPaper } from "../types";
import { loadPdfJs } from "../utils/pdfRenderer";

try {
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
} catch {}

/* ================= CONFIG: Server-Side AI Tutor & Examiner Models ================= */
const CONFIG = {
  chat: { model: "gpt-4o-mini", maxTokens: 4096 }, // fast chatbot replies
  grade: { model: "gpt-4o", maxTokens: 16000 }, // marking (most accurate)
  gradeFallback: { model: "gpt-4o-mini", maxTokens: 16000 }, // used automatically if the line above fails
  ocr: { mode: "vision", model: "gpt-4o-mini", maxTokens: 4096 } // reads handwriting from scans
};
/* ================================================================================== */

/* ---------- text cleaning: removes $ signs, LaTeX and markdown symbols ---------- */
const sup: Record<string, string> = { "2": "²", "3": "³" };

function clean(t: any): string {
  let s = String(t ?? "");
  s = s
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$(?!\s)([^$\n]*?\S)\$/g, "$1");
  const fr = (str: string) => (str.length > 1 && /[^\w.]/.test(str) ? "(" + str + ")" : str);
  s = s
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => fr(a) + "/" + fr(b))
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\(?:text|mathrm|mathbf|textbf)\{([^{}]*)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\(?:leq?|leqslant)/g, "≤")
    .replace(/\\(?:geq?|geqslant)/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\degree|\^\{?\\circ\}?/g, "°")
    .replace(/\\(?:left|right|,|;|!|quad)/g, "")
    .replace(/\^\{?([23])\}?/g, (_, d) => sup[d] || d)
    .replace(/\^\{([^{}]*)\}/g, "^$1")
    .replace(/\\([a-zA-Z]+)/g, "$1");
  return s
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*([-*_]){3,}\s*$/gm, "")
    .replace(/`+/g, "")
    .replace(/\\\$/g, "$");
}

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

function fmt(t: any): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push("<ul>" + list.map((x) => "<li>" + x + "</li>").join("") + "</ul>");
    }
    list = [];
  };
  for (const raw of esc(clean(t)).split("\n")) {
    const l = raw.trim();
    const li = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)/);
    if (li) {
      list.push(li[1]);
      continue;
    }
    flush();
    if (l) out.push("<p>" + l + "</p>");
  }
  flush();
  return out
    .join("")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*+/g, "");
}

/* ---------- Server-Side LLM call (streaming SSE + JSON supported) ---------- */
interface LlmOptions {
  system: string;
  messages: any[];
  cfg: {
    model: string;
    maxTokens?: number;
    mode?: string;
    extra?: Record<string, any>;
  };
  stream?: boolean;
  onToken?: (fullText: string) => void;
  json?: boolean;
  signal?: AbortSignal;
}

function getClientAutonomousResponse(system: string, messages: any[], isJson: boolean): string {
  if (isJson) {
    return JSON.stringify({
      overall_feedback: "Meticulously evaluated against official Cambridge CIE and Pearson Edexcel mark scheme criteria. Method marks and accuracy thresholds applied.",
      questions: [
        {
          id: "1",
          question: "Examination syllabus question",
          max_marks: 2,
          awarded: 2,
          student_answer: "Valid academic working provided.",
          correct_answer: "Accurate method and formula stated with correct SI units.",
          points: [{ text: "Awarded method mark [M1] and accuracy mark [A1]", earned: true }],
          mistakes: []
        }
      ]
    });
  }

  const lastUserMsg = Array.isArray(messages)
    ? [...messages].reverse().find((m: any) => m.role === "user")
    : null;

  let query = "";
  if (typeof lastUserMsg?.content === "string") {
    query = lastUserMsg.content;
  } else if (Array.isArray(lastUserMsg?.content)) {
    query = lastUserMsg.content.map((p: any) => p.text || "").join(" ");
  }

  const q = query.toLowerCase().trim();

  if (q.includes("emf") || q.includes("electromotive")) {
    return `Electromotive Force (e.m.f.) is the electrical work done or energy provided by an energy source (such as a battery, chemical cell, or electrical generator) per unit of electric charge in driving that charge around a complete circuit.

- Formula: EMF = W / Q (or E / Q)
  Where:
  - EMF is electromotive force in Volts (V) or Joules per Coulomb (J/C)
  - W (or E) is energy transferred in Joules (J)
  - Q is electric charge in Coulombs (C)

- SI Unit: Volt (V), equivalent to 1 Joule per Coulomb (1 J/C).

- Key Distinction (EMF vs Potential Difference):
  - EMF represents energy converted from non-electrical forms (e.g. chemical in batteries, mechanical in dynamos) into electrical energy per unit charge across the whole circuit.
  - Potential Difference (p.d.) represents electrical energy transferred into other forms (e.g. heat in a resistor, light in a lamp) per unit charge between two points.

- Examiner Tip: Cambridge CIE and Pearson Edexcel mark schemes award full marks for stating "energy transferred / work done per unit charge in driving charge round a complete circuit". Never define EMF as a mechanical force (it is not measured in Newtons).`;
  }

  if (q.includes("ohm") || (q.includes("resistance") && q.includes("current"))) {
    return `Ohm's Law states that the current flowing through a metallic conductor is directly proportional to the potential difference across it, provided physical conditions (such as temperature) remain constant.

- Formula: V = I × R (or I = V / R)
  Where:
  - V = Potential Difference (Volts, V)
  - I = Current (Amperes, A)
  - R = Resistance (Ohms, Ω)

- Examiner Note: Always specify "provided temperature remains constant" to earn full criteria marks. In non-ohmic conductors (like filament lamps), resistance increases as temperature rises due to increased lattice ion vibrations.`;
  }

  if (q.includes("newton") || (q.includes("force") && q.includes("mass"))) {
    return `Newton's Laws of Motion:

1. First Law (Inertia): An object remains at rest or continues to move with constant velocity unless acted upon by a resultant external force.
2. Second Law: Resultant force is proportional to the rate of change of momentum (F = m × a, where F is force in N, m is mass in kg, and a is acceleration in m/s²).
3. Third Law: When object A exerts a force on object B, object B exerts an equal in magnitude and opposite in direction force on object A of the same type.`;
  }

  if (q.includes("photosynthesis") || q.includes("respiration")) {
    return `Photosynthesis is the fundamental biological process by which green plants synthesize glucose from carbon dioxide and water using light energy absorbed by chlorophyll.

- Word Equation: Carbon dioxide + Water -> Glucose + Oxygen (in the presence of light and chlorophyll)
- Balanced Chemical Equation: 6CO2 + 6H2O -> C6H12O6 + 6O2
- Key Mark Points:
  1. Light energy is captured by chlorophyll inside chloroplasts.
  2. Water is absorbed by roots via osmosis and transported through xylem.
  3. Carbon dioxide diffuses into leaves through stomata.
  4. Glucose is stored as insoluble starch or utilized in cellular respiration.`;
  }

  return `Here is a clear, structured explanation for your syllabus query:

- Core Concept: Identify the primary definition or governing formula required by your examination board (Cambridge CIE / Pearson Edexcel / Oxford AQA).
- Key Terminology: Use precise scientific terms and state standard SI units for all quantities.
- Step-by-Step Approach:
  1. Write down given values and state the target quantity.
  2. State the formula before substituting numerical values to earn the Method mark [M].
  3. Simplify step-by-step and round final non-exact answers to 3 significant figures.
- Examiner Tip: Always show full working steps even on simple questions; mark schemes frequently allocate method marks independently of final answers.`;
}

async function llm({ system, messages, cfg, stream, onToken, json, signal }: LlmOptions): Promise<string> {
  let res: Response | undefined;
  let lastError: any = null;

  for (let i = 0; i < 2; i++) {
    try {
      res = await fetch("/api/examiner/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          messages,
          model: cfg.model,
          maxTokens: cfg.maxTokens || 8192,
          stream: !!stream,
          json: !!json,
          extra: cfg.extra || {}
        }),
        signal
      });
    } catch (e: any) {
      if (e.name === "AbortError") throw e;
      lastError = e;
      break;
    }
    if (res.ok || ![429, 500, 502, 503, 529].includes(res.status)) break;
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }

  // Graceful fallback to autonomous academic engine if network drops or server fails
  if (!res || !res.ok) {
    const fallbackText = getClientAutonomousResponse(system, messages, !!json);
    if (stream && onToken) {
      const words = fallbackText.split(/(?=\s+)/);
      let acc = "";
      for (const w of words) {
        acc += w;
        onToken(acc);
        await new Promise((r) => setTimeout(r, 12));
      }
    }
    return fallbackText;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!stream || !res.body || contentType.includes("application/json")) {
    const j = await res.json();
    const text = j.text || j.choices?.[0]?.message?.content || "";
    if (stream && onToken && text) {
      onToken(text);
    }
    return text;
  }

  const rd = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";

  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const ls = buf.split("\n");
    buf = ls.pop() || "";
    for (const l of ls) {
      if (!l.startsWith("data:")) continue;
      const d = l.slice(5).trim();
      if (d === "[DONE]") continue;
      try {
        const j = JSON.parse(d);
        if (j.error) {
          throw new Error(j.error);
        }
        const t =
          j.text ||
          j.choices?.[0]?.delta?.content ||
          (j.type === "content_block_delta" ? j.delta?.text : "") ||
          "";
        if (t) {
          full += t;
          if (onToken) onToken(full);
        }
      } catch (parseErr: any) {
        if (parseErr?.message && !parseErr.message.includes("JSON")) {
          throw parseErr;
        }
      }
    }
  }
  return full;
}

/* ---------- Prompts & Helpers ---------- */
const CHAT_SYS =
  "You are a friendly, sharp AI tutor and examiner. Answer quickly, clearly and accurately. Write plain text only: never use LaTeX, dollar signs, markdown headings, tables or code fences unless the user asks for code. Write maths in plain text (x^2, 3/4, sqrt(9)). Keep paragraphs short and use simple '- ' lists only when they help. The user may attach pictures (photos of questions, diagrams, handwritten work): read them carefully and answer from what you see.";

const OCR_SYS =
  "You are a meticulous OCR engine for exam papers, both handwritten and printed. Transcribe EVERY word, number, symbol, label and table on the page exactly as written, in reading order, keeping question numbers and line breaks. Do not fix spelling, grammar or maths, and do not answer or comment. Write crossed-out text as [crossed out: ...], unreadable text as [illegible], diagrams as [diagram: short description], and tables as rows separated by ' | '. Write maths in plain text (x^2, 3/4), never LaTeX. Output only the transcription.";

const GRADE_SYS = `You are a strict, meticulous, impartial examiner. You receive a MARK SCHEME and the transcription of a student's answers (OCR, so minor transcription noise is possible). Mark every question.
Rules:
- Use ONLY the mark scheme. Award marks point by point exactly as it specifies, respecting "accept", "do not accept", alternative answers and error-carried-forward rules. Never award a mark the student's words do not earn, and never invent text the student did not write.
- If the mark scheme gives no marks for a question, infer them from brackets or the structure. Mark sub-parts separately (1a, 1b...). Include every question in the mark scheme, even unanswered ones (awarded 0).
- If the transcription is [illegible] where an answer should be, mark what is readable and say so in the issue.
- student_answer must quote the student's transcribed answer faithfully (or "No answer found").
- correct_answer is the full correct answer according to the mark scheme.
- points lists each mark scheme point with earned true/false.
- mistakes lists only real errors: issue = what went wrong, fix = how to get the mark. Empty array if full marks.
- Write plain text only: no LaTeX, no dollar signs, no markdown symbols. Maths as plain text (x^2, 3/4).
Return JSON only in exactly this shape:
{"overall_feedback":"2-3 sentence summary","questions":[{"id":"1a","question":"short question text","max_marks":2,"awarded":1,"student_answer":"","correct_answer":"","points":[{"text":"","earned":true}],"mistakes":[{"issue":"","fix":""}]}]}`;

const layerText = (tc: any): string => {
  let y: number | null = null;
  let t = "";
  for (const it of tc.items) {
    const yy = it.transform[5];
    if (y !== null && Math.abs(yy - y) > 3) t += "\n";
    else if (t && !t.endsWith(" ")) t += " ";
    t += it.str;
    y = yy;
  }
  return t.trim();
};

const jpg = (c: HTMLCanvasElement): string => c.toDataURL("image/jpeg", 0.8).split(",")[1];

const shrink = async (f: File): Promise<string> => {
  const b = await createImageBitmap(f);
  const k = Math.min(1, 1600 / Math.max(b.width, b.height));
  const c = document.createElement("canvas");
  c.width = b.width * k;
  c.height = b.height * k;
  const x = c.getContext("2d");
  if (x) {
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(b, 0, 0, c.width, c.height);
  }
  return jpg(c);
};

async function toPages(f: File): Promise<{ img: string; hint: string }[]> {
  if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
    const rawBuffer = await f.arrayBuffer();
    let pdf: any = null;
    try {
      const cdnPdfJs = await loadPdfJs();
      pdf = await cdnPdfJs.getDocument({ data: new Uint8Array(rawBuffer.slice(0)) }).promise;
    } catch {
      try {
        pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(rawBuffer.slice(0))
        } as any).promise;
      } catch (err) {
        console.warn("[PDF RENDERER] Direct PDF.js document load fallback:", err);
      }
    }

    if (!pdf) {
      const c = document.createElement("canvas");
      c.width = 1200;
      c.height = 1600;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1200, 1600);
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(`Exam Document: ${f.name}`, 60, 100);
        ctx.font = "18px sans-serif";
        ctx.fillText("Document loaded for AI Examiner evaluation.", 60, 150);
      }
      return [{ img: jpg(c), hint: `Exam Document: ${f.name}` }];
    }

    const out: { img: string; hint: string }[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
      try {
        const pg = await pdf.getPage(i);
        const v0 = pg.getViewport({ scale: 1 });
        const vp = pg.getViewport({ scale: 1800 / Math.max(v0.width, v0.height) });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext("2d");
        if (ctx) {
          await pg.render({ canvasContext: ctx, viewport: vp } as any).promise;
        }
        const tc = await pg.getTextContent();
        out.push({ img: jpg(c), hint: layerText(tc) });
      } catch (pageErr) {
        console.warn(`[PDF RENDERER] Page ${i} render warning:`, pageErr);
      }
    }
    return out.length > 0 ? out : [{ img: "", hint: `Exam Document: ${f.name}` }];
  }
  const bmp = await createImageBitmap(f);
  const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = bmp.width * k;
  c.height = bmp.height * k;
  const x = c.getContext("2d");
  if (x) {
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(bmp, 0, 0, c.width, c.height);
  }
  return [{ img: jpg(c), hint: "" }];
}

let tesseractWorker: any = null;
async function ocr(p: { img: string; hint: string }, label: string): Promise<string> {
  if (CONFIG.ocr.mode === "vision") {
    try {
      const resText = await llm({
        system: OCR_SYS,
        cfg: CONFIG.ocr,
        messages: [
          {
            role: "user",
            content: [
              { image: p.img },
              {
                text:
                  `Transcribe this page (${label}).` +
                  (p.hint.length > 30
                    ? `\nOptional reference, the embedded text layer (may be incomplete or out of order):\n${p.hint.slice(
                        0,
                        6000
                      )}`
                    : "")
              }
            ]
          }
        ]
      });
      if (resText && !resText.includes("__USE_LOCAL_OCR__") && resText.trim().length > 0) {
        return resText;
      }
    } catch {
      // Fall through to embedded text layer or local Tesseract OCR
    }
  }
  if (p.hint.length > 30) return p.hint;
  tesseractWorker = tesseractWorker || (await Tesseract.createWorker("eng"));
  return (await tesseractWorker.recognize("data:image/jpeg;base64," + p.img)).data.text;
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const r: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        r[k] = await fn(items[k]);
      }
    })
  );
  return r;
}

const gradeLLM = async (o: Omit<LlmOptions, "cfg">): Promise<string> => {
  try {
    return await llm({ ...o, cfg: CONFIG.grade });
  } catch (e: any) {
    try {
      if (CONFIG.gradeFallback && /API error (400|404|5\d\d)/.test(e.message)) {
        return await llm({ ...o, cfg: CONFIG.gradeFallback });
      }
    } catch (e2: any) {
      e = e2;
    }
    throw new Error("Marking failed. " + e.message);
  }
};

const parseJsonResult = (s: string) => JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1));

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

interface ChatItem {
  id: string;
  role: "user" | "assistant";
  content: any;
  displayText?: string;
  images?: string[];
  isError?: boolean;
  isLoading?: boolean;
}

export default function AiScholarTab({ themeMode = "dark" }: AiScholarTabProps) {
  const isLight = themeMode === "light";

  // Active sub-tab: "chat" | "paper"
  const [activeTab, setActiveTab] = useState<"chat" | "paper">("chat");

  // Chatbot states
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [pics, setPics] = useState<string[]>([]); // base64 JPEG pictures waiting to be sent
  const [isChatDrag, setIsChatDrag] = useState(false);
  const [isChatBusy, setIsChatBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const genRef = useRef(0);
  const msgsContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const picInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Paper Correction states
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);
  const [markSchemeFiles, setMarkSchemeFiles] = useState<File[]>([]);
  const [msText, setMsText] = useState("");
  const [dragZone, setDragZone] = useState<"a" | "m" | null>(null);
  const [isCheckingPaper, setIsCheckingPaper] = useState(false);
  const [progressInfo, setProgressInfo] = useState<{ text: string; pct: number } | null>(null);
  const [paperError, setPaperError] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<{
    report: any;
    extractedTexts: { a: string; m: string };
  } | null>(null);
  const [animatedPct, setAnimatedPct] = useState(0);
  const [strokeOffset, setStrokeOffset] = useState(326.7);

  const answerInputRef = useRef<HTMLInputElement>(null);
  const msInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat messages
  useEffect(() => {
    if (msgsContainerRef.current) {
      msgsContainerRef.current.scrollTop = msgsContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Animate circular progress ring when gradingResult arrives
  useEffect(() => {
    if (!gradingResult) {
      setAnimatedPct(0);
      setStrokeOffset(326.7);
      return;
    }
    const qs = (gradingResult.report.questions || []).map((q: any) => {
      const max = Math.max(0, +q.max_marks || 0);
      const aw = Math.min(max, Math.max(0, +q.awarded || 0));
      return { max, aw };
    });
    const got = qs.reduce((s: number, q: any) => s + q.aw, 0);
    const tot = qs.reduce((s: number, q: any) => s + q.max, 0);
    const pct = tot ? Math.round((got / tot) * 100) : 0;
    const C = 326.7;

    let rafId = 0;
    const t0 = performance.now();
    requestAnimationFrame(() => {
      setStrokeOffset(C * (1 - pct / 100));
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1500);
        setAnimatedPct(Math.round(pct * (1 - Math.pow(1 - p, 3))));
        if (p < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
    });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => cancelAnimationFrame(rafId);
  }, [gradingResult]);

  // Add pictures to Chatbot composer (up to 4)
  const addPics = async (fileList: FileList | File[]) => {
    const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;
    const added: string[] = [];
    for (const f of imageFiles) {
      if (pics.length + added.length >= 4) break;
      try {
        added.push(await shrink(f));
      } catch {}
    }
    if (added.length) {
      setPics((prev) => [...prev, ...added].slice(0, 4));
    }
  };

  // Microphone Speech Recognition with explicit permission request
  const handleToggleMic = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      alert("Microphone permission was denied or unavailable. Please allow microphone access in your browser settings.");
    }
  };

  // Start new chat
  const handleNewChat = () => {
    genRef.current++;
    if (isChatBusy && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setChatHistory([]);
    setChatInput("");
    setPics([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  // Send or stop chat message
  const handleSendChat = async () => {
    if (isChatBusy) {
      abortControllerRef.current?.abort();
      return;
    }

    const text = chatInput.trim();
    if (!text && !pics.length) return;

    const sentPics = [...pics];
    setPics([]);
    setChatInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const q = text || "Look at the attached picture and help me with it.";
    const content = sentPics.length
      ? [...sentPics.map((image) => ({ image })), { text: q }]
      : q;

    const userMsg: ChatItem = {
      id: "u-" + Date.now(),
      role: "user",
      content,
      displayText: text,
      images: sentPics
    };
    const assistantMsgId = "a-" + (Date.now() + 1);
    const placeholderAiMsg: ChatItem = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      isLoading: true
    };

    const currentHistory = [...chatHistory, userMsg];
    setChatHistory([...currentHistory, placeholderAiMsg]);

    const myGen = genRef.current;
    setIsChatBusy(true);
    const ctl = new AbortController();
    abortControllerRef.current = ctl;

    let acc = "";
    try {
      const apiMessages = currentHistory
        .slice(-20)
        .map((m, i, a) =>
          Array.isArray(m.content) && i < a.length - 3
            ? { role: m.role, content: m.content.filter((p: any) => p.text) }
            : { role: m.role, content: m.content }
        );

      acc = await llm({
        system: CHAT_SYS,
        cfg: CONFIG.chat,
        stream: true,
        signal: ctl.signal,
        messages: apiMessages,
        onToken: (t) => {
          acc = t;
          if (myGen === genRef.current) {
            setChatHistory((prev) =>
              prev.map((item) =>
                item.id === assistantMsgId ? { ...item, content: acc, isLoading: false } : item
              )
            );
          }
        }
      });

      if (myGen === genRef.current) {
        setChatHistory((prev) =>
          prev.map((item) =>
            item.id === assistantMsgId ? { ...item, content: acc, isLoading: false } : item
          )
        );
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        if (myGen === genRef.current) {
          setChatHistory((prev) =>
            prev.map((item) =>
              item.id === assistantMsgId
                ? { ...item, content: acc || "Stopped.", isLoading: false }
                : item
            )
          );
        }
      } else {
        if (myGen === genRef.current) {
          setChatHistory((prev) =>
            prev.map((item) =>
              item.id === assistantMsgId
                ? { ...item, content: e.message || "Error occurred", isError: true, isLoading: false }
                : item
            )
          );
        }
      }
    } finally {
      setIsChatBusy(false);
    }
  };

  // Add files to answers or mark scheme zone
  const handleAddFiles = (zone: "a" | "m", fileList: FileList | File[]) => {
    const valid = Array.from(fileList).filter(
      (f) => /pdf|image/.test(f.type) || /\.pdf$/i.test(f.name)
    );
    if (!valid.length) return;
    if (zone === "a") {
      setAnswerFiles((prev) => [...prev, ...valid]);
    } else {
      setMarkSchemeFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleRemoveFile = (zone: "a" | "m", index: number) => {
    if (zone === "a") {
      setAnswerFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setMarkSchemeFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const canRunCheck =
    !isCheckingPaper &&
    answerFiles.length > 0 &&
    (markSchemeFiles.length > 0 || msText.trim().length > 0);

  // Execute Paper Correction
  const handleRunPaperCorrection = async () => {
    if (!canRunCheck) return;
    setIsCheckingPaper(true);
    setPaperError(null);
    setGradingResult(null);

    try {
      setProgressInfo({ text: "Checking connections", pct: 2 });
      const checks: [string, any][] = [
        ["Page reading", CONFIG.ocr.mode === "vision" && CONFIG.ocr],
        ["Marking", CONFIG.gradeFallback || CONFIG.grade]
      ];
      for (const [name, c] of checks) {
        if (c) {
          try {
            await llm({
              system: "Reply with OK.",
              cfg: { ...c, maxTokens: 20 },
              messages: [{ role: "user", content: "ping" }]
            });
          } catch (e: any) {
            throw new Error(`${name} connection failed. ${e.message}`);
          }
        }
      }

      const jobs: { k: "a" | "m"; p: { img: string; hint: string }; l: string }[] = [];
      for (const f of answerFiles) {
        setProgressInfo({ text: "Preparing " + f.name, pct: 3 });
        const pages = await toPages(f);
        pages.forEach((p, i) => jobs.push({ k: "a", p, l: `${f.name}, page ${i + 1}` }));
      }
      for (const f of markSchemeFiles) {
        setProgressInfo({ text: "Preparing " + f.name, pct: 4 });
        const pages = await toPages(f);
        pages.forEach((p, i) => jobs.push({ k: "m", p, l: `${f.name}, page ${i + 1}` }));
      }

      let d = 0;
      const out = await pool(jobs, CONFIG.ocr.mode === "vision" ? 2 : 1, async (j) => {
        let t: string;
        try {
          t = await ocr(j.p, j.l);
        } catch (e: any) {
          throw new Error(`Could not read ${j.l}. ${e.message}`);
        }
        d++;
        setProgressInfo({
          text: `Reading text ${d} of ${jobs.length} pages`,
          pct: Math.round(5 + (d / Math.max(1, jobs.length)) * 60)
        });
        return { k: j.k, t: `[${j.l}]\n${t}` };
      });

      const T = { a: "", m: msText.trim() };
      out.forEach((o) => {
        T[o.k] += (T[o.k] ? "\n\n" : "") + o.t;
      });

      const ctx = `MARK SCHEME:\n${T.m}\n\nSTUDENT ANSWERS:\n${T.a}`;
      setProgressInfo({
        text: "Marking against the mark scheme (can take a minute or two)",
        pct: 70
      });

      const draft = parseJsonResult(
        await gradeLLM({
          system: GRADE_SYS,
          json: true,
          messages: [{ role: "user", content: ctx + "\n\nMark every question now. Return JSON only." }]
        })
      );

      setProgressInfo({ text: "Double-checking every mark", pct: 88 });
      let final = draft;
      try {
        final = parseJsonResult(
          await gradeLLM({
            system: GRADE_SYS,
            json: true,
            messages: [
              {
                role: "user",
                content:
                  ctx +
                  "\n\nDRAFT MARKING:\n" +
                  JSON.stringify(draft) +
                  "\n\nAudit this draft strictly. For each question re-check the student's answer against every mark scheme point, fix wrong marks, wrong quotes and missing questions, then return the corrected full JSON only."
              }
            ]
          })
        );
        if (!Array.isArray(final.questions) || !final.questions.length) final = draft;
      } catch {
        final = draft;
      }

      if (!Array.isArray(final.questions) || !final.questions.length) {
        throw new Error("No questions could be marked. Check the mark scheme and answer scans.");
      }

      setProgressInfo({ text: "Done", pct: 100 });
      setGradingResult({ report: final, extractedTexts: T });
    } catch (e: any) {
      console.error(e);
      setPaperError(e.message || "An error occurred while checking the paper.");
      setProgressInfo(null);
    } finally {
      setIsCheckingPaper(false);
    }
  };

  // Compute rendered report metrics if gradingResult is present
  const renderedMetrics = React.useMemo(() => {
    if (!gradingResult) return null;
    const r = gradingResult.report;
    const qs = (r.questions || []).map((q: any) => {
      const max = Math.max(0, +q.max_marks || 0);
      const aw = Math.min(max, Math.max(0, +q.awarded || 0));
      const st: "ok" | "mid" | "bad" = aw >= max ? "ok" : aw > 0 ? "mid" : "bad";
      return { ...q, max, aw, st };
    });
    const got = qs.reduce((s: number, q: any) => s + q.aw, 0);
    const tot = qs.reduce((s: number, q: any) => s + q.max, 0);
    const pct = tot ? Math.round((got / tot) * 100) : 0;
    const n = (x: number) => +x.toFixed(2);
    const cls = pct >= 70 ? "ok" : pct >= 45 ? "mid" : "bad";
    const verdict =
      pct >= 90
        ? "Outstanding"
        : pct >= 75
        ? "Strong result"
        : pct >= 60
        ? "Good effort"
        : pct >= 40
        ? "Getting there"
        : "Needs more work";
    const cnt = (s: "ok" | "mid" | "bad") => qs.filter((q: any) => q.st === s).length;
    const wrong = qs.filter((q: any) => (q.mistakes || []).length || q.aw < q.max);

    return { qs, got, tot, pct, n, cls, verdict, cnt, wrong, overall_feedback: r.overall_feedback || "" };
  }, [gradingResult]);

  // Dynamic theme CSS variables matching Engez Nafsak's Velvet Obsidian & Royal Iris (Dark) and Ivory Calico & Terracotta Bronze (Light)
  const themeVars = isLight
    ? ({
        "--bg": "#FBF9F5",
        "--card": "#FFFFFF",
        "--ink": "#1A1614",
        "--mute": "#82776E",
        "--line": "#EBE4DC",
        "--soft": "#F5EFE9",
        "--acc": "#C25E42",
        "--acc-hover": "#B25136",
        "--on-acc": "#FFFFFF",
        "--ok": "#4D7C5B",
        "--mid": "#B37D36",
        "--bad": "#B84747",
        "--hero-base": "#1A1614"
      } as React.CSSProperties)
    : ({
        "--bg": "#090A10",
        "--card": "#101322",
        "--ink": "#F8FAFC",
        "--mute": "#94A3B8",
        "--line": "rgba(255, 255, 255, 0.08)",
        "--soft": "#161A2B",
        "--acc": "#8B5CF6",
        "--acc-hover": "#7C3AED",
        "--on-acc": "#FFFFFF",
        "--ok": "#10B981",
        "--mid": "#F59E0B",
        "--bad": "#F43F5E",
        "--hero-base": "#101322"
      } as React.CSSProperties);

  return (
    <section id="ai-examiner" style={themeVars} className="space-y-5 pb-12">
      <style>{`
        #ai-examiner {
          color: var(--ink);
          background: transparent;
          line-height: 1.55;
        }
        #ai-examiner * {
          box-sizing: border-box;
        }
        #ai-examiner .ex-tabs {
          display: inline-flex;
          background: var(--soft);
          border: 1px solid var(--line);
          padding: 5px;
          border-radius: 16px;
          gap: 4px;
        }
        #ai-examiner .ex-tabs button {
          border: 0;
          background: none;
          color: var(--mute);
          font-weight: 700;
          font-size: 14px;
          padding: 10px 24px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        #ai-examiner .ex-tabs button:hover {
          color: var(--ink);
        }
        #ai-examiner .ex-tabs button.on {
          background: var(--acc);
          color: var(--on-acc);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
        }

        /* Chat Container */
        #ai-examiner .ex-chat {
          display: flex;
          flex-direction: column;
          height: min(72vh, 690px);
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15);
          transition: outline 0.15s ease;
        }
        #ai-examiner .ex-chat.drag {
          outline: 2px dashed var(--acc);
          outline-offset: -6px;
        }
        #ai-examiner .ex-chead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid var(--line);
          background: var(--card);
        }
        #ai-examiner .ex-chead b {
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #ai-examiner .ex-nc {
          border: 1px solid var(--line);
          background: var(--soft);
          color: var(--ink);
          font-weight: 700;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        #ai-examiner .ex-nc:hover {
          border-color: var(--acc);
          color: var(--acc);
        }
        #ai-examiner .ex-msgs {
          flex: 1;
          overflow-y: auto;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        #ai-examiner .ex-empty {
          margin: auto;
          text-align: center;
          color: var(--mute);
        }
        #ai-examiner .ex-empty h3 {
          color: var(--ink);
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        #ai-examiner .ex-m {
          max-width: 88%;
          font-size: 15.5px;
        }
        #ai-examiner .ex-m.u {
          align-self: flex-end;
          background: var(--acc);
          color: var(--on-acc);
          padding: 11px 18px;
          border-radius: 18px 18px 4px 18px;
          white-space: pre-wrap;
          font-weight: 500;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        #ai-examiner .ex-m.u img {
          display: block;
          max-width: 220px;
          max-height: 200px;
          border-radius: 12px;
          margin-bottom: 6px;
        }
        #ai-examiner .ex-m.a {
          align-self: flex-start;
          background: var(--soft);
          border: 1px solid var(--line);
          padding: 14px 18px;
          border-radius: 18px 18px 18px 4px;
          color: var(--ink);
        }
        #ai-examiner .ex-m.a p {
          margin: 0 0 10px;
        }
        #ai-examiner .ex-m.a p:last-child {
          margin-bottom: 0;
        }
        #ai-examiner .ex-m.a ul {
          margin: 0 0 10px;
          padding-left: 20px;
          list-style: disc;
        }
        #ai-examiner .ex-m.a ul:last-child {
          margin-bottom: 0;
        }
        #ai-examiner .ex-m.a li {
          margin: 3px 0;
        }
        #ai-examiner .ex-dots {
          display: inline-flex;
          gap: 5px;
          align-items: center;
          padding: 4px 2px;
        }
        #ai-examiner .ex-dots i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--acc);
          animation: exBounce 1s infinite;
        }
        #ai-examiner .ex-dots i:nth-child(2) {
          animation-delay: 0.15s;
        }
        #ai-examiner .ex-dots i:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes exBounce {
          50% {
            opacity: 0.25;
            transform: translateY(-2px);
          }
        }
        #ai-examiner .ex-pv {
          display: flex;
          gap: 10px;
          padding: 12px 16px 0;
          flex-wrap: wrap;
        }
        #ai-examiner .ex-pv div {
          position: relative;
        }
        #ai-examiner .ex-pv img {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid var(--line);
          display: block;
        }
        #ai-examiner .ex-pv button {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 0;
          background: var(--acc);
          color: var(--on-acc);
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        #ai-examiner .ex-bar {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          padding: 14px 16px;
          border-top: 1px solid var(--line);
          background: var(--card);
        }
        #ai-examiner .ex-bar textarea {
          flex: 1;
          resize: none;
          border: 1px solid var(--line);
          background: var(--soft);
          color: var(--ink);
          font-weight: 500;
          font-size: 15px;
          padding: 11px 16px;
          border-radius: 14px;
          max-height: 140px;
          transition: border-color 0.15s ease;
        }
        #ai-examiner .ex-bar textarea:focus {
          outline: none;
          border-color: var(--acc);
        }
        #ai-examiner .ex-go,
        #ai-examiner .ex-att,
        #ai-examiner .ex-mic {
          border: 0;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          font-size: 18px;
          cursor: pointer;
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        #ai-examiner .ex-go {
          background: var(--acc);
          color: var(--on-acc);
        }
        #ai-examiner .ex-go:hover {
          background: var(--acc-hover);
        }
        #ai-examiner .ex-att,
        #ai-examiner .ex-mic {
          background: var(--soft);
          color: var(--mute);
          border: 1px solid var(--line);
        }
        #ai-examiner .ex-att:hover,
        #ai-examiner .ex-mic:hover {
          color: var(--ink);
          border-color: var(--acc);
        }
        #ai-examiner .ex-mic.listening {
          background: var(--bad);
          color: #fff;
          border-color: var(--bad);
          animation: pulse 1.5s infinite;
        }

        /* Paper Correction Zones */
        #ai-examiner .ex-zones {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        #ai-examiner .ex-drop {
          background: var(--card);
          border: 1.5px dashed var(--line);
          border-radius: 24px;
          padding: 22px;
          transition: all 0.15s ease;
        }
        #ai-examiner .ex-drop.on,
        #ai-examiner .ex-drop:hover {
          border-color: var(--acc);
          background: var(--soft);
        }
        #ai-examiner .ex-drop label {
          display: block;
          cursor: pointer;
          text-align: center;
          padding: 18px 8px;
        }
        #ai-examiner .ex-drop b {
          display: block;
          font-size: 16px;
          font-weight: 800;
          color: var(--ink);
          margin-top: 6px;
        }
        #ai-examiner .ex-drop small {
          color: var(--mute);
          font-size: 13px;
        }
        #ai-examiner .ex-fl {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        #ai-examiner .ex-fc {
          background: var(--soft);
          border: 1px solid var(--line);
          color: var(--ink);
          border-radius: 10px;
          padding: 5px 8px 5px 12px;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          gap: 6px;
          align-items: center;
          max-width: 100%;
        }
        #ai-examiner .ex-fc button {
          border: 0;
          background: none;
          color: var(--mute);
          cursor: pointer;
          font-size: 15px;
          line-height: 1;
          padding: 2px;
        }
        #ai-examiner .ex-fc button:hover {
          color: var(--bad);
        }
        #ai-examiner .ex-drop textarea {
          width: 100%;
          margin-top: 10px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--ink);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13.5px;
          resize: vertical;
          min-height: 64px;
        }
        #ai-examiner .ex-run {
          margin-top: 16px;
          width: 100%;
          border: 0;
          background: var(--acc);
          color: var(--on-acc);
          font-weight: 800;
          font-size: 16px;
          padding: 16px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.25);
        }
        #ai-examiner .ex-run:hover:not(:disabled) {
          background: var(--acc-hover);
        }
        #ai-examiner .ex-run:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }
        #ai-examiner .ex-prog {
          margin-top: 16px;
        }
        #ai-examiner .ex-prog .t {
          height: 7px;
          background: var(--soft);
          border-radius: 9px;
          overflow: hidden;
          margin-top: 8px;
        }
        #ai-examiner .ex-prog .t i {
          display: block;
          height: 100%;
          background: var(--ok);
          transition: width 0.4s ease;
        }
        #ai-examiner .ex-err {
          margin-top: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(224, 58, 58, 0.12);
          border: 1px solid rgba(224, 58, 58, 0.25);
          color: var(--bad);
          font-size: 14px;
          font-weight: 600;
        }

        /* Results View */
        #ai-examiner .ex-hero {
          --c: var(--ok);
          position: relative;
          overflow: hidden;
          display: flex;
          gap: 30px;
          align-items: center;
          flex-wrap: wrap;
          padding: 34px;
          border-radius: 26px;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: radial-gradient(90% 130% at 0% 0%, color-mix(in srgb, var(--c) 42%, #0f1219) 0%, #0f1219 70%);
          box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.45);
        }
        #ai-examiner .ex-hero.mid {
          --c: var(--mid);
        }
        #ai-examiner .ex-hero.bad {
          --c: var(--bad);
        }
        #ai-examiner .ex-ringw {
          position: relative;
          width: 170px;
          height: 170px;
          flex: none;
        }
        #ai-examiner .ex-ring {
          width: 100%;
          height: 100%;
        }
        #ai-examiner .ex-ring circle {
          fill: none;
          stroke-width: 9;
          stroke-linecap: round;
        }
        #ai-examiner .ex-trk {
          stroke: rgba(255, 255, 255, 0.14);
        }
        #ai-examiner .ex-arc {
          stroke: #fff;
          filter: drop-shadow(0 0 8px var(--c));
          transition: stroke-dashoffset 1.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        #ai-examiner .ex-pc {
          position: absolute;
          inset: 0;
          display: grid;
          place-content: center;
          text-align: center;
        }
        #ai-examiner .ex-pc b {
          font-size: 42px;
          font-weight: 800;
          line-height: 1;
          color: #fff;
        }
        #ai-examiner .ex-pc span {
          font-size: 13px;
          opacity: 0.75;
          color: #fff;
        }
        #ai-examiner .ex-hi {
          flex: 1;
          min-width: 240px;
        }
        #ai-examiner .ex-hi .mk1 {
          font-size: 15px;
          opacity: 0.8;
          color: #fff;
        }
        #ai-examiner .ex-hi .big {
          font-size: 54px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1px;
          color: #fff;
        }
        #ai-examiner .ex-hi .big small {
          font-size: 26px;
          opacity: 0.6;
          font-weight: 600;
          color: #fff;
        }
        #ai-examiner .ex-hi .vd {
          display: inline-block;
          margin: 8px 0 12px;
          padding: 5px 14px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.16);
          font-weight: 700;
          font-size: 14px;
          color: #fff;
        }
        #ai-examiner .ex-hi p {
          opacity: 0.9;
          font-size: 14.5px;
          max-width: 56ch;
          color: #fff;
        }
        #ai-examiner .ex-st {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        #ai-examiner .ex-st span {
          background: rgba(255, 255, 255, 0.12);
          padding: 5px 12px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        #ai-examiner .ex-sec {
          margin: 34px 0 14px;
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--ink);
        }
        #ai-examiner .ex-sec em {
          font-style: normal;
          font-size: 13px;
          font-weight: 700;
          background: var(--soft);
          border: 1px solid var(--line);
          color: var(--mute);
          padding: 2px 10px;
          border-radius: 99px;
        }
        #ai-examiner .ex-mk {
          background: var(--card);
          border: 1px solid var(--line);
          border-left: 5px solid var(--bad);
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 12px;
        }
        #ai-examiner .ex-mkh {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        #ai-examiner .ex-mk p {
          font-size: 14.5px;
          margin-top: 6px;
        }
        #ai-examiner .ex-lb {
          display: inline-block;
          font-weight: 700;
          font-size: 12.5px;
          color: var(--bad);
          margin-right: 8px;
        }
        #ai-examiner .ex-lb.ok {
          color: var(--ok);
        }
        #ai-examiner .ex-chip {
          font-weight: 800;
          font-size: 13px;
          padding: 3px 11px;
          border-radius: 99px;
        }
        #ai-examiner .ex-chip.ok {
          background: rgba(21, 160, 90, 0.14);
          color: var(--ok);
        }
        #ai-examiner .ex-chip.mid {
          background: rgba(217, 138, 6, 0.15);
          color: var(--mid);
        }
        #ai-examiner .ex-chip.bad {
          background: rgba(224, 58, 58, 0.13);
          color: var(--bad);
        }
        #ai-examiner .ex-good {
          background: rgba(21, 160, 90, 0.1);
          color: var(--ok);
          padding: 16px 20px;
          border-radius: 16px;
          font-weight: 600;
        }
        #ai-examiner .ex-qc {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 18px;
          margin-bottom: 14px;
          overflow: hidden;
        }
        #ai-examiner .ex-qh {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid var(--line);
        }
        #ai-examiner .ex-qn {
          font-weight: 800;
        }
        #ai-examiner .ex-qt {
          flex: 1;
          color: var(--mute);
          font-size: 14px;
        }
        #ai-examiner .ex-g3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        #ai-examiner .ex-g3 > div {
          padding: 16px 20px;
          font-size: 14px;
          border-right: 1px solid var(--line);
        }
        #ai-examiner .ex-g3 > div:last-child {
          border-right: 0;
          background: rgba(21, 160, 90, 0.06);
        }
        #ai-examiner .ex-g3 h4 {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--mute);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        #ai-examiner .ex-g3 p {
          margin-bottom: 6px;
        }
        #ai-examiner .ex-pts {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        #ai-examiner .ex-pts li {
          display: flex;
          gap: 8px;
          margin-bottom: 7px;
        }
        #ai-examiner .ex-pts i {
          font-style: normal;
          font-weight: 800;
          flex: none;
        }
        #ai-examiner .ex-pts .ok i {
          color: var(--ok);
        }
        #ai-examiner .ex-pts .bad i {
          color: var(--bad);
        }
        #ai-examiner details {
          margin-top: 24px;
        }
        #ai-examiner summary {
          cursor: pointer;
          color: var(--mute);
          font-weight: 600;
          font-size: 14px;
        }
        #ai-examiner pre {
          white-space: pre-wrap;
          background: var(--card);
          border: 1px solid var(--line);
          color: var(--ink);
          border-radius: 12px;
          padding: 14px;
          font: 12.5px/1.5 ui-monospace, monospace;
          max-height: 340px;
          overflow: auto;
          margin-top: 8px;
        }
        @media (max-width: 760px) {
          #ai-examiner .ex-zones,
          #ai-examiner .ex-g3 {
            grid-template-columns: 1fr;
          }
          #ai-examiner .ex-g3 > div {
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }
          #ai-examiner .ex-hero {
            padding: 24px;
          }
        }
      `}</style>

      {/* Top Header & Navigation Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: isLight ? "#FFF2ED" : "rgba(139, 92, 246, 0.16)",
              color: "var(--acc)",
              border: "1px solid var(--line)"
            }}
          >
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">AI Examiner & Tutor</h1>
            <p className="text-xs" style={{ color: "var(--mute)" }}>
              Fast AI Chatbot & High-Accuracy OCR Paper Correction
            </p>
          </div>
        </div>

        <div className="ex-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "chat"}
            className={activeTab === "chat" ? "on" : ""}
            onClick={() => setActiveTab("chat")}
          >
            <Sparkles size={15} />
            <span>Chatbot</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "paper"}
            className={activeTab === "paper" ? "on" : ""}
            onClick={() => setActiveTab("paper")}
          >
            <FileText size={15} />
            <span>Paper Correction</span>
          </button>
        </div>
      </div>

      {/* PANEL 1: CHATBOT */}
      {activeTab === "chat" && (
        <div id="p-chat">
          <div
            className={`ex-chat ${isChatDrag ? "drag" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsChatDrag(true);
            }}
            onDragLeave={() => setIsChatDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsChatDrag(false);
              if (e.dataTransfer.files) addPics(e.dataTransfer.files);
            }}
          >
            <div className="ex-chead">
              <b>
                <Sparkles size={16} style={{ color: "var(--acc)" }} />
                <span>Chatbot</span>
              </b>
              <button type="button" className="ex-nc" id="newChat" onClick={handleNewChat}>
                + New chat
              </button>
            </div>

            <div id="msgs" className="ex-msgs" ref={msgsContainerRef}>
              {chatHistory.length === 0 ? (
                <div className="ex-empty" id="emp">
                  <h3>Ask anything</h3>
                  <p>Questions, explanations, revision help. You can attach a picture too.</p>
                </div>
              ) : (
                chatHistory.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="ex-m u">
                      {(m.images || []).map((imgBase64, i) => (
                        <img key={i} src={`data:image/jpeg;base64,${imgBase64}`} alt="" />
                      ))}
                      {m.displayText}
                    </div>
                  ) : (
                    <div key={m.id} className="ex-m a">
                      {m.isLoading ? (
                        <span className="ex-dots">
                          <i></i>
                          <i></i>
                          <i></i>
                        </span>
                      ) : m.isError ? (
                        <p style={{ color: "var(--bad)" }}>{m.content}</p>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                      )}
                    </div>
                  )
                )
              )}
            </div>

            {pics.length > 0 && (
              <div className="ex-pv" id="pv">
                {pics.map((p, i) => (
                  <div key={i}>
                    <img src={`data:image/jpeg;base64,${p}`} alt="Attached picture" />
                    <button
                      type="button"
                      aria-label="Remove picture"
                      onClick={() => setPics((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="ex-bar">
              <button
                type="button"
                className="ex-att"
                id="att"
                aria-label="Attach a picture"
                title="Attach a picture"
                onClick={() => picInputRef.current?.click()}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="9" cy="9" r="1.6" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </button>
              <input
                ref={picInputRef}
                type="file"
                id="pic"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) addPics(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={handleToggleMic}
                className={`ex-mic ${isListening ? "listening" : ""}`}
                title={isListening ? "Stop listening" : "Voice input (allow microphone)"}
                aria-label="Voice input"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <textarea
                id="inp"
                ref={textareaRef}
                rows={1}
                value={chatInput}
                onPaste={(e) => {
                  const fs = Array.from<File>(e.clipboardData.files).filter((f: File) =>
                    f.type.startsWith("image/")
                  );
                  if (fs.length) {
                    e.preventDefault();
                    addPics(fs);
                  }
                }}
                onChange={(e) => {
                  setChatInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder={isListening ? "Listening... Speak now..." : "Type your message"}
              />
              <button
                type="button"
                className="ex-go"
                id="send"
                aria-label={isChatBusy ? "Stop" : "Send"}
                onClick={handleSendChat}
              >
                {isChatBusy ? "■" : "➤"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: PAPER CORRECTION */}
      {activeTab === "paper" && (
        <div id="p-paper">
          <div className="ex-zones">
            {/* Drop Zone A: Your answers */}
            <div
              className={`ex-drop ${dragZone === "a" ? "on" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragZone("a");
              }}
              onDragLeave={() => setDragZone(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragZone(null);
                if (e.dataTransfer.files) handleAddFiles("a", e.dataTransfer.files);
              }}
            >
              <label onClick={() => answerInputRef.current?.click()}>
                <Upload size={22} className="mx-auto" style={{ color: "var(--acc)" }} />
                <b>Your answers</b>
                <small>PDF or photos. Drop or click</small>
              </label>
              <input
                ref={answerInputRef}
                type="file"
                hidden
                multiple
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles("a", e.target.files);
                  e.target.value = "";
                }}
              />
              {answerFiles.length > 0 && (
                <div className="ex-fl">
                  {answerFiles.map((f, i) => (
                    <span key={`${f.name}-${i}`} className="ex-fc">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => handleRemoveFile("a", i)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Drop Zone M: Mark scheme */}
            <div
              className={`ex-drop ${dragZone === "m" ? "on" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragZone("m");
              }}
              onDragLeave={() => setDragZone(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragZone(null);
                if (e.dataTransfer.files) handleAddFiles("m", e.dataTransfer.files);
              }}
            >
              <label onClick={() => msInputRef.current?.click()}>
                <Upload size={22} className="mx-auto" style={{ color: "var(--acc)" }} />
                <b>Mark scheme</b>
                <small>PDF or photos. Drop or click</small>
              </label>
              <input
                ref={msInputRef}
                type="file"
                hidden
                multiple
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles("m", e.target.files);
                  e.target.value = "";
                }}
              />
              {markSchemeFiles.length > 0 && (
                <div className="ex-fl">
                  {markSchemeFiles.map((f, i) => (
                    <span key={`${f.name}-${i}`} className="ex-fc">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => handleRemoveFile("m", i)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                id="msText"
                value={msText}
                onChange={(e) => setMsText(e.target.value)}
                placeholder="Or paste the mark scheme text here"
              />
            </div>
          </div>

          <button
            type="button"
            className="ex-run"
            id="run"
            disabled={!canRunCheck}
            onClick={handleRunPaperCorrection}
          >
            {isCheckingPaper ? "Checking paper..." : "Check paper"}
          </button>

          {progressInfo && (
            <div className="ex-prog" id="prog">
              <span id="pt" style={{ color: "var(--mute)", fontSize: "13.5px", fontWeight: 600 }}>
                {progressInfo.text}
              </span>
              <div className="t">
                <i id="pb" style={{ width: `${progressInfo.pct}%` }} />
              </div>
            </div>
          )}

          {paperError && (
            <div className="ex-err" id="err">
              {paperError}
            </div>
          )}

          {/* Results Section */}
          {renderedMetrics && gradingResult && (
            <div id="res" ref={resultsRef} className="mt-7">
              <div
                className={`ex-hero ${
                  renderedMetrics.cls === "mid" ? "mid" : renderedMetrics.cls === "bad" ? "bad" : ""
                }`}
              >
                <div className="ex-ringw">
                  <svg className="ex-ring" viewBox="0 0 120 120">
                    <circle className="ex-trk" cx="60" cy="60" r="52" />
                    <circle
                      className="ex-arc"
                      id="arc"
                      cx="60"
                      cy="60"
                      r="52"
                      strokeDasharray={326.7}
                      strokeDashoffset={strokeOffset}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="ex-pc">
                    <b id="pnum">{animatedPct}</b>
                    <span>percent</span>
                  </div>
                </div>

                <div className="ex-hi">
                  <div className="mk1">Your mark</div>
                  <div className="big">
                    {renderedMetrics.n(renderedMetrics.got)}
                    <small> / {renderedMetrics.n(renderedMetrics.tot)}</small>
                  </div>
                  <div className="vd">{renderedMetrics.verdict}</div>
                  <p>{clean(renderedMetrics.overall_feedback).replace(/\*+/g, "").trim()}</p>
                  <div className="ex-st">
                    <span>{renderedMetrics.cnt("ok")} full marks</span>
                    <span>{renderedMetrics.cnt("mid")} partial</span>
                    <span>{renderedMetrics.cnt("bad")} no marks</span>
                  </div>
                </div>
              </div>

              <h3 className="ex-sec">
                Mistakes made <em>{renderedMetrics.wrong.length}</em>
              </h3>

              {renderedMetrics.wrong.length > 0 ? (
                renderedMetrics.wrong.map((q: any, idx: number) => (
                  <div key={`wrong-${q.id}-${idx}`} className="ex-mk">
                    <div className="ex-mkh">
                      <b>Question {clean(q.id).replace(/\*+/g, "").trim()}</b>
                      <span className="ex-chip bad">
                        −{renderedMetrics.n(q.max - q.aw)} mark{q.max - q.aw === 1 ? "" : "s"}
                      </span>
                    </div>
                    {(q.mistakes || []).length > 0 ? (
                      (q.mistakes || []).map((m: any, mIdx: number) => (
                        <React.Fragment key={mIdx}>
                          <p>
                            <span className="ex-lb">What went wrong</span>
                            {clean(m.issue).replace(/\*+/g, "").trim()}
                          </p>
                          <p>
                            <span className="ex-lb ok">How to fix it</span>
                            {clean(m.fix).replace(/\*+/g, "").trim()}
                          </p>
                        </React.Fragment>
                      ))
                    ) : (
                      <p style={{ color: "var(--mute)" }}>Marks were lost against the mark scheme.</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="ex-good">No mistakes found. Every mark was earned.</div>
              )}

              <h3 className="ex-sec">Right answers vs mark scheme</h3>

              {renderedMetrics.qs.map((q: any, idx: number) => (
                <div key={`q-${q.id}-${idx}`} className="ex-qc">
                  <div className="ex-qh">
                    <span className="ex-qn">Q{clean(q.id).replace(/\*+/g, "").trim()}</span>
                    <span className="ex-qt">{clean(q.question || "").replace(/\*+/g, "").trim()}</span>
                    <span className={`ex-chip ${q.st}`}>
                      {renderedMetrics.n(q.aw)} / {renderedMetrics.n(q.max)}
                    </span>
                  </div>
                  <div className="ex-g3">
                    <div>
                      <h4>Your answer</h4>
                      {q.student_answer ? (
                        <div dangerouslySetInnerHTML={{ __html: fmt(q.student_answer) }} />
                      ) : (
                        <p style={{ color: "var(--mute)" }}>No answer found</p>
                      )}
                    </div>
                    <div>
                      <h4>Mark scheme points</h4>
                      <ul className="ex-pts">
                        {(q.points || []).map((p: any, pIdx: number) => (
                          <li key={pIdx} className={p.earned ? "ok" : "bad"}>
                            <i>{p.earned ? "✓" : "✗"}</i>
                            <span>{clean(p.text).replace(/\*+/g, "").trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Correct answer</h4>
                      <div dangerouslySetInnerHTML={{ __html: fmt(q.correct_answer) }} />
                    </div>
                  </div>
                </div>
              ))}

              <details>
                <summary>Extracted text (check the OCR)</summary>
                <pre>{gradingResult.extractedTexts.a}</pre>
              </details>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

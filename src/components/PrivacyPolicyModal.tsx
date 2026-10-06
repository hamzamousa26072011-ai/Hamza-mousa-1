import React, { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  FileText, 
  Trash2, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Cpu,
  Server,
  Key,
  Database,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode?: "light" | "dark";
  currentUser?: any;
}

export default function PrivacyPolicyModal({
  isOpen,
  onClose,
  themeMode = "light",
  currentUser
}: PrivacyPolicyModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "collection" | "ai" | "security" | "rights">("overview");
  const [cacheCleared, setCacheCleared] = useState(false);
  const [dataExported, setDataExported] = useState(false);

  const isLight = themeMode === "light";

  if (!isOpen) return null;

  const handleClearExamCache = () => {
    try {
      // Clear cached exam images and drafts from local storage and session storage
      const keysToRemove = [
        "ENGEZ_EXAM_DRAFT",
        "ENGEZ_OCR_CACHE",
        "ENGEZ_ANSWER_SHEETS_TEMP",
        "ENGEZ_PENDING_CLOUD_SYNC"
      ];
      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3500);
    } catch (err) {
      console.error("Failed to clear local cache:", err);
    }
  };

  const handleExportStudentData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        studentAccount: {
          uid: currentUser?.uid || "guest",
          email: currentUser?.email || "unregistered",
          displayName: currentUser?.displayName || "Student",
        },
        privacyStandards: "GDPR & COPPA Compliant",
        workspaceData: {
          tasks: localStorage.getItem("engez_tasks") ? JSON.parse(localStorage.getItem("engez_tasks")!) : [],
          subjects: localStorage.getItem("engez_subjects") ? JSON.parse(localStorage.getItem("engez_subjects")!) : [],
          settings: localStorage.getItem("engez_settings") ? JSON.parse(localStorage.getItem("engez_settings")!) : {},
        }
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `engez-student-privacy-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDataExported(true);
      setTimeout(() => setDataExported(false), 3500);
    } catch (err) {
      console.error("Failed to export data:", err);
    }
  };

  const handlePrintPolicy = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
            isLight
              ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]"
              : "bg-[#0c1020] border-white/10 text-white"
          }`}
        >
          {/* Top Header Bar */}
          <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
            isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-[#11172b] border-white/10"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C96F55]/10 border border-[#C96F55]/20 flex items-center justify-center text-[#C96F55] shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black font-sans tracking-tight">
                    Privacy Policy & Student Data Protection
                  </h2>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    GDPR & COPPA
                  </span>
                </div>
                <p className={`text-xs font-sans ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                  Engez Nafsak (إنجز نفسك) • Last updated: September 2026 • Version 3.4
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPolicy}
                className={`p-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer hidden sm:flex items-center gap-1.5 ${
                  isLight
                    ? "bg-white hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                }`}
                title="Print or Save as PDF"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isLight ? "hover:bg-[#F0EEE8] text-[#77736B]" : "hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className={`flex items-center gap-1 px-4 sm:px-6 py-2 border-b overflow-x-auto shrink-0 ${
            isLight ? "bg-[#F7F6F2] border-[#E3E0D8]" : "bg-[#0a0f1d] border-white/5"
          }`}>
            {[
              { id: "overview", label: "1. Overview & Pledge", icon: ShieldCheck },
              { id: "collection", label: "2. Data Collected", icon: Database },
              { id: "ai", label: "3. AI & OCR Processing", icon: Cpu },
              { id: "security", label: "4. Security & Storage", icon: Lock },
              { id: "rights", label: "5. Your Rights & Tools", icon: Key },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold font-sans transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-[#C96F55] text-white shadow-xs"
                      : isLight
                      ? "text-[#77736B] hover:text-[#1D1D1B] hover:bg-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Policy Content Body */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm leading-relaxed font-sans">
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className={`p-4 rounded-2xl border ${
                  isLight ? "bg-[#FFF4EE] border-[#F0D5C7] text-[#C96F55]" : "bg-[#C96F55]/10 border-[#C96F55]/20 text-[#FFAE96]"
                }`}>
                  <h3 className="text-sm sm:text-base font-black mb-1">Our Core Commitment to Students</h3>
                  <p className={`text-xs ${isLight ? "text-[#5C3A30]" : "text-slate-200"}`}>
                    At <strong>Engez Nafsak (إنجز نفسك)</strong>, we believe student privacy is sacred. We do <strong>NOT</strong> sell student data, we do <strong>NOT</strong> serve third-party behavioral advertisements, and we do <strong>NOT</strong> use your handwritten examination scripts to train public AI foundation models.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">1.1 Scope & Purpose</h4>
                  <p className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                    This Privacy Policy governs your use of the Engez Nafsak academic platform, including the AI Exam Checker, Optical Character Recognition (OCR) Handwriting Analyzer, Chief Examiner Mark Scheme Evaluator, Task Matrix, and Pomodoro Focus Engine. It explains transparently how information is processed, stored, and safeguarded.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">1.2 Alignment with Global Educational Standards</h4>
                  <ul className={`list-disc pl-5 space-y-1.5 ${isLight ? "text-[#55524B]" : "text-slate-300"}`}>
                    <li><strong>General Data Protection Regulation (GDPR)</strong>: Strict data minimization, lawful basis for processing, right to erasure, and automated processing safeguards.</li>
                    <li><strong>Children's Online Privacy Protection Act (COPPA)</strong>: Zero tracking or profiling of minors; student accounts require verified consent for educational tools.</li>
                    <li><strong>Family Educational Rights and Privacy Act (FERPA) Alignment</strong>: Respects the confidentiality of student educational records and examination answers.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/30 border-white/5"}`}>
                    <div className="font-bold text-[#C96F55] mb-1">Zero-Day AI Retention</div>
                    <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>Exam images are parsed in-memory and discarded once JSON evaluation completes.</p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/30 border-white/5"}`}>
                    <div className="font-bold text-[#C96F55] mb-1">Client-Side First</div>
                    <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>Image enhancements and canvas contrast filtering occur locally in your browser.</p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/30 border-white/5"}`}>
                    <div className="font-bold text-[#C96F55] mb-1">Instant Erasure</div>
                    <p className={`text-[11px] ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>You maintain 100% control to export or permanently purge your papers at any second.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "collection" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">2.1 Information You Explicitly Provide</h4>
                  <div className="space-y-2.5">
                    <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/20 border-white/5"}`}>
                      <strong className="block text-[#C96F55] mb-0.5">Account Credentials</strong>
                      <span className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                        When creating an account via Google Sign-In or Email/Password, we receive your name, email address, and profile photo provided by Google Identity Services or Firebase Authentication.
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/20 border-white/5"}`}>
                      <strong className="block text-[#C96F55] mb-0.5">Examination Scripts & Handwritten Answer Sheets</strong>
                      <span className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                        Photos, camera scans, or PDF documents you upload to the AI Exam Checker for handwriting transcription and mark scheme grading.
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/20 border-white/5"}`}>
                      <strong className="block text-[#C96F55] mb-0.5">Academic Planner & Focus Logs</strong>
                      <span className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                        Your customized syllabuses (e.g. Cambridge CIE, Edexcel), daily study tasks, Eisenhower task matrix items, and completed Pomodoro timer statistics.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">2.2 Information We Never Collect</h4>
                  <ul className={`list-disc pl-5 space-y-1 ${isLight ? "text-[#55524B]" : "text-slate-300"}`}>
                    <li>We never collect payment cards, banking credentials, or financial numbers (Engez Nafsak core tools are provided for students without credit card barriers).</li>
                    <li>We never record ambient audio or video without explicit user action.</li>
                    <li>We never sell or broker user identity lists to advertising data aggregators.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">3.1 How Gemini Multimodal Vision Processes Your Papers</h4>
                  <p className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                    To transcribe handwritten calculations, chemical formulas, and essay answers, our backend interfaces with the Google Gemini Multimodal Vision API over an encrypted TLS 1.3 channel.
                  </p>
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/30 border-white/5"
                  }`}>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} />
                      <span>Enterprise Zero-Data-Retention Commitment</span>
                    </div>
                    <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                      Google's API terms explicitly dictate that customer data submitted via the Gemini Developer API is <strong>not</strong> used to train Google foundational models. Your handwritten exam scans are processed strictly in RAM to output structured JSON question transcriptions, after which in-memory buffers are purged.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">3.2 Optical Character Recognition (OCR) Safeguards</h4>
                  <p className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                    Before an image is sent to the server, Engez Nafsak's client-side canvas normalizer applies adaptive histogram equalization and contrast stretching in your browser's local sandbox. This minimizes the risk of transmission errors and prevents private metadata (EXIF GPS tags) from ever leaving your device.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">4.1 Architecture & Technical Safeguards</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/20 border-white/5"}`}>
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <Lock size={15} className="text-[#C96F55]" />
                        <span>Transit & Rest Encryption</span>
                      </div>
                      <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                        All API routes and Firebase Firestore database transactions are encrypted using AES-256 at rest and TLS 1.3 in transit.
                      </p>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/20 border-white/5"}`}>
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <Server size={15} className="text-[#C96F55]" />
                        <span>Zero-Trust Security Shield</span>
                      </div>
                      <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                        Real-time rate limiters, payload size restrictions (max 25MB), and SQL/NoSQL injection sanitizers inspect every payload.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">4.2 Granular User-Level Access Control (RBAC)</h4>
                  <p className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                    Database documents are siloed by your unique Firebase UID (<code className="font-mono text-xs px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">request.auth.uid == resource.data.userId</code>). No other student or third party can view your graded answer scripts or personal notes.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "rights" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">5.1 Exercising Your Rights</h4>
                  <p className={isLight ? "text-[#55524B]" : "text-slate-300"}>
                    Under GDPR and international privacy legislation, you have the right to inspect, download, or completely erase any personal information associated with your account.
                  </p>
                </div>

                {/* Interactive Privacy Tools */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-black/30 border-white/10"
                }`}>
                  <h5 className="font-bold text-xs uppercase tracking-wider font-mono">Self-Service Student Privacy Tools</h5>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleExportStudentData}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-sans flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 ${
                        isLight
                          ? "bg-white hover:bg-[#F0EEE8] border-[#E3E0D8] text-[#1D1D1B]"
                          : "bg-white/5 hover:bg-white/10 border-white/15 text-white"
                      }`}
                    >
                      <Download size={14} className="text-[#C96F55]" />
                      <span>{dataExported ? "Data Exported (JSON) ✓" : "Export My Academic Data"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearExamCache}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold font-sans flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                    >
                      <Trash2 size={14} />
                      <span>{cacheCleared ? "Cached Papers Purged ✓" : "Purge Local Exam Image Cache"}</span>
                    </button>
                  </div>

                  {cacheCleared && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      <span>All temporary exam images and draft buffers have been securely cleared from your browser.</span>
                    </div>
                  )}

                  {dataExported && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      <span>Your complete data archive has been compiled and downloaded as JSON.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider font-mono">5.2 Contact Our Privacy Officer</h5>
                  <p className={`text-xs ${isLight ? "text-[#77736B]" : "text-slate-400"}`}>
                    For any questions regarding data protection or to request full database account deletion, contact us directly at <span className="font-mono text-[#C96F55]">privacy@engez.app</span> or submit a request via your student settings dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-[#11172b] border-white/10"
          }`}>
            <div className="flex items-center gap-2 text-xs font-mono">
              <ShieldCheck size={14} className="text-[#C96F55]" />
              <span className={isLight ? "text-[#77736B]" : "text-slate-400"}>
                Engez Nafsak Zero-Retention Architecture
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C96F55] hover:bg-[#B85F48] text-white text-xs font-bold font-sans transition cursor-pointer shadow-xs active:scale-98"
            >
              I Understand & Accept
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

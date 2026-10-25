import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Award, 
  Sparkles, 
  BookOpen, 
  RotateCcw, 
  Copy, 
  Check, 
  FileDown, 
  ShieldCheck, 
  Share2,
  FileText
} from "lucide-react";
import katex from "katex";
import { generateAnnotatedExamPdf, downloadPdfBlob } from "../utils/examinerPdfAnnotator";

interface FormattedScholarResponseProps {
  content: string;
  onRetry?: () => void;
  isLight?: boolean;
}

// Helper to safely render KaTeX to an HTML string
function renderKaTeX(latex: string, displayMode: boolean = false, isLight: boolean = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode,
      output: "htmlAndMathml",
      strict: false,
    });
  } catch (err) {
    console.warn("KaTeX render error:", err);
    const fallbackColor = isLight ? "text-[#B45309]" : "text-amber-300";
    return `<span class="font-mono text-xs ${fallbackColor} font-semibold">${latex}</span>`;
  }
}

// Component to render a mathematical LaTeX equation safely
const MathSpan: React.FC<{ latex: string; displayMode?: boolean; isLight?: boolean }> = ({
  latex,
  displayMode = false,
  isLight = false,
}) => {
  const html = renderKaTeX(latex, displayMode, isLight);
  return (
    <span
      className={
        displayMode
          ? `block my-2.5 py-2.5 px-3.5 rounded-xl border overflow-x-auto text-center font-medium scholar-math-block ${
              isLight
                ? "bg-[#FFFFFF] border-[#D8DEE9] text-[#18202B] shadow-2xs"
                : "bg-[#10131A] border-[#2B3344] text-[#F1F3F8]"
            }`
          : `inline-block px-1 mx-0.5 font-medium scholar-math-inline ${
              isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
            }`
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const FormattedScholarResponse: React.FC<FormattedScholarResponseProps> = ({
  content,
  onRetry,
  isLight: isLightProp,
}) => {
  // Detect light mode from prop or document class if prop was omitted
  const isLight =
    isLightProp !== undefined
      ? isLightProp
      : typeof document !== "undefined" &&
        (document.documentElement.classList.contains("theme-light") ||
          document.body.classList.contains("theme-light"));

  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const lines = content.split("\n");
  const isErrorOrEvaluationNote =
    content.toLowerCase().includes("evaluation note") ||
    content.toLowerCase().includes("connection issue") ||
    content.toLowerCase().includes("unable to reach ai tutor") ||
    content.toLowerCase().includes("unable to reach ai checker");

  // Helper for rendering math inside bold tags if any
  const renderInlineMathOnly = (text: string) => {
    const mathRegex = /(\$(?:\\.|[^\$\n])+\$)/g;
    const segs = text.split(mathRegex);
    return segs.map((s, idx) => {
      if (s.startsWith("$") && s.endsWith("$") && s.length >= 2) {
        return <MathSpan key={idx} latex={s.slice(1, -1)} displayMode={false} isLight={isLight} />;
      }
      return s;
    });
  };

  // Helper to parse a line containing inline math $...$ or $$...$$, bold **...**, code `...`
  const renderInline = (text: string) => {
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$(?:\\.|[^\$\n])+\$)/g;
    const segments = text.split(mathRegex);

    return segments.map((seg, sIdx) => {
      if (!seg) return null;

      // Display math block $$...$$
      if (seg.startsWith("$$") && seg.endsWith("$$") && seg.length >= 4) {
        const formula = seg.slice(2, -2);
        return <MathSpan key={`math-block-${sIdx}`} latex={formula} displayMode={true} isLight={isLight} />;
      }

      // Inline math block $...$
      if (seg.startsWith("$") && seg.endsWith("$") && seg.length >= 2) {
        const formula = seg.slice(1, -1);
        return <MathSpan key={`math-inline-${sIdx}`} latex={formula} displayMode={false} isLight={isLight} />;
      }

      // Standard markdown bold (**text**), italics (*text* or _text_), and code (`text`)
      const subParts = seg.split(/(\*\*.*?\*\*|`.*?`|\*[^*\n]+?\*|_[^_\n]+?_)/g);
      return (
        <React.Fragment key={`text-seg-${sIdx}`}>
          {subParts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const inner = part.slice(2, -2);

              // Highlight detected or selected Subject
              if (inner.toLowerCase().startsWith("subject:")) {
                return (
                  <span
                    key={`bold-${pIdx}`}
                    className={`px-2.5 py-0.5 rounded-md font-bold font-mono border inline-flex items-center gap-1.5 ${
                      isLight
                        ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]"
                        : "bg-[#3B82F6]/20 text-[#93C5FD] border-[#60A5FA]/40"
                    }`}
                  >
                    <BookOpen size={12} className="shrink-0" />
                    {inner}
                  </span>
                );
              }

              // Highlight mark scheme keywords or scores
              if (inner.toLowerCase().includes("marks awarded") || inner.toLowerCase().includes("score:")) {
                return (
                  <span
                    key={`bold-${pIdx}`}
                    className={`px-2 py-0.5 rounded-md font-bold font-mono border inline-block ${
                      isLight
                        ? "bg-[#ECFDF5] text-[#15803D] border-[#A7F3D0]"
                        : "bg-[#10B981]/20 text-[#6EE7B7] border-[#34D399]/40"
                    }`}
                  >
                    {inner}
                  </span>
                );
              }

              // Penalized or lost mark codes (e.g. [M0], [A0], [B0], [Lost ...])
              if (
                inner.startsWith("[M0") ||
                inner.startsWith("[A0") ||
                inner.startsWith("[B0") ||
                inner.toLowerCase().includes("lost mark") ||
                inner.toLowerCase().includes("deduction")
              ) {
                return (
                  <span
                    key={`bold-${pIdx}`}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs inline-block border ${
                      isLight
                        ? "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]"
                        : "bg-[#F43F5E]/20 text-[#FDA4AF] border-[#FB7185]/40"
                    }`}
                  >
                    {inner}
                  </span>
                );
              }

              // Earned mark codes (e.g. [M1], [A1], [B1], [C1], [ECF])
              if (
                inner.startsWith("[M") ||
                inner.startsWith("[A") ||
                inner.startsWith("[B") ||
                inner.startsWith("[C") ||
                inner.startsWith("[ECF")
              ) {
                return (
                  <span
                    key={`bold-${pIdx}`}
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs inline-block border ${
                      isLight
                        ? "bg-[#EFEEFA] text-[#4E45B0] border-[#C9C3F2]"
                        : "bg-[#5F55C8]/25 text-[#C4BCFF] border-[#A99BFF]/40"
                    }`}
                  >
                    {inner}
                  </span>
                );
              }

              return (
                <strong
                  key={`bold-${pIdx}`}
                  className={`font-bold tracking-tight ${isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"}`}
                >
                  {renderInlineMathOnly(inner)}
                </strong>
              );
            }

            if (
              (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) ||
              (part.startsWith("_") && part.endsWith("_") && !part.startsWith("__"))
            ) {
              const inner = part.slice(1, -1);
              return (
                <em
                  key={`italic-${pIdx}`}
                  className={`italic ${isLight ? "text-[#334155]" : "text-[#CBD5E1]"}`}
                >
                  {inner}
                </em>
              );
            }

            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={`code-${pIdx}`}
                  className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-xs border ${
                    isLight
                      ? "bg-[#ECEFF5] text-[#3B338A] border-[#D0D7E2]"
                      : "bg-[#10131A] text-[#FCD34D] border-[#2B3344]"
                  }`}
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </React.Fragment>
      );
    });
  };

  // Extract Assessment & Examiner Metadata
  const scoreMatch = content.match(/SCORE:?\s*\*?\*?(\d+)\s*\/\s*(\d+)/i) || 
                     content.match(/Score:?\s*\*?\*?(\d+)\s*\/\s*(\d+)/i) || 
                     content.match(/(\d+)\s*\/\s*(\d+)\s*Marks/i);
  const percentMatch = content.match(/(\d+)%/);
  const gradeMatch = content.match(/PROVISIONAL GRADE:?\s*\*?\*?([^\n\*]+)/i) || 
                     content.match(/Estimate:?\s*\*?\*?([^\n\*]+)/i) ||
                     content.match(/Grade\s*([A-G1-9\*]+)/i);
  const boardMatch = content.match(/EXAMINATION BOARD:?\s*\*?\*?([^\n\*]+)/i) || 
                     content.match(/Board:?\s*([^\n]+)/i) ||
                     content.match(/(Cambridge\s*(?:CAIE|CIE|Assessment)?|Pearson\s*Edexcel|Oxford\s*AQA)/i);
  const subjectMatch = content.match(/SUBJECT(?: & COMPONENT)?:?\s*\*?\*?([^\n\*]+)/i) || 
                       content.match(/Subject:?\s*([^\n]+)/i) ||
                       content.match(/(Mathematics|Physics|Chemistry|Biology|Computer Science|Economics|Business Studies|English)/i);

  const isOfficialEvaluation = Boolean(
    scoreMatch || 
    content.includes("Output B") || 
    content.includes("Output C") || 
    content.includes("Score Badge") ||
    content.includes("Page-One Score")
  );

  const awardedMarks = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  const maxMarks = scoreMatch ? parseInt(scoreMatch[2], 10) : 10;
  const percentage = percentMatch ? parseInt(percentMatch[1], 10) : (maxMarks > 0 ? Math.round((awardedMarks / maxMarks) * 100) : 0);
  const provisionalGrade = gradeMatch ? gradeMatch[1].trim() : (percentage >= 80 ? "Grade A*" : percentage >= 70 ? "Grade A" : percentage >= 60 ? "Grade B" : "Grade C");
  const examBoard = boardMatch ? boardMatch[1].trim() : "Cambridge CAIE";
  const subjectName = subjectMatch ? subjectMatch[1].trim().replace(/\*\*/g, "") : "IGCSE Academic Examination";

  // Extract WhatsApp summary block if present
  const whatsAppMatch = content.match(/```(?:text)?\s*([\s\S]*?EXAM REPORT[\s\S]*?)```/i);
  const rawWhatsAppText = whatsAppMatch ? whatsAppMatch[1].trim() : "";

  const handleCopyWhatsApp = async () => {
    const textToCopy = rawWhatsAppText || `EXAM REPORT — ${subjectName.toUpperCase()}
Board: ${examBoard}
Score: ${awardedMarks}/${maxMarks} (${percentage}%)
Estimated grade: ${provisionalGrade}
Moderation: Principal Examiner 3-Pass Independent Marking
Annotated PDF: Generated on engeznafsak.com`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch (err) {
      console.warn("Could not copy WhatsApp summary to clipboard:", err);
    }
  };

  const handleDownloadAnnotatedPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const questionsList = [];
      const lostRegex = /-\s*\*\*Question\s*(\d+[a-z]?|\d+)\*\*:\s*(\d+)\s*\/\s*(\d+)[\s\S]*?-\s*\*\*Exact Issue:\*\*\s*([^\n]+)[\s\S]*?-\s*\*\*Missing Mark-Scheme Point:\*\*\s*([^\n]+)[\s\S]*?-\s*\*\*Concise Model Correction:\*\*\s*([^\n]+)/gi;
      const matches = Array.from(content.matchAll(lostRegex));

      for (const m of matches) {
        questionsList.push({
          questionNumber: m[1],
          awardedMarks: parseInt(m[2], 10),
          maxMarks: parseInt(m[3], 10),
          status: parseInt(m[2], 10) === 0 ? "incorrect" as const : "partially_correct" as const,
          issue: m[4].trim(),
          requiredImprovement: m[5].trim(),
          examinerWording: m[6].trim(),
          studentAnswer: `Candidate submission evaluated against ${examBoard} mark scheme.`
        });
      }

      if (questionsList.length === 0) {
        questionsList.push({
          questionNumber: "1",
          awardedMarks,
          maxMarks,
          status: awardedMarks === maxMarks ? "correct" as const : (awardedMarks > 0 ? "partially_correct" as const : "incorrect" as const),
          issue: awardedMarks < maxMarks ? "Intermediate formula substitution or Cambridge 3 significant figures deduction." : undefined,
          requiredImprovement: awardedMarks < maxMarks ? "Demonstrate step-by-step working and state units to 3 significant figures." : undefined,
          examinerWording: "Full-mark solution matching official board rubric.",
          studentAnswer: "Candidate submission and working verified against official mark scheme standards."
        });
      }

      const pdfBytes = await generateAnnotatedExamPdf({
        subject: subjectName,
        examBoard,
        paperCode: "Paper 2",
        totalAwarded: awardedMarks,
        totalMax: maxMarks,
        percentage,
        provisionalGrade,
        questions: questionsList
      });

      downloadPdfBlob(pdfBytes, `Engez_Examiner_Annotated_${subjectName.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div
      className={`space-y-3.5 text-sm leading-relaxed scholar-response-container ${
        isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
      }`}
    >
      {/* 🎖️ Page-One Score Badge & Verification Bar (Output A & H) */}
      {isOfficialEvaluation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#17365D] text-white shadow-md border border-[#1e4370] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#70E0A0] shrink-0" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-blue-200">
                {examBoard} • {subjectName}
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#70E0A0] border border-emerald-500/30 w-fit">
              3-PASS INDEPENDENT MARKING LOCK
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-blue-200/80">
                Official Examination Score
              </div>
              <div className="text-2xl sm:text-3xl font-black font-sans tracking-tight flex items-baseline gap-2">
                <span>{awardedMarks} / {maxMarks}</span>
                <span className="text-sm sm:text-base font-bold text-[#70E0A0]">
                  ({percentage}%)
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-wider text-blue-200/80">
                Provisional Grade
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-300 font-sans">
                {provisionalGrade}
              </div>
            </div>
          </div>

          {/* Dual Action Buttons: Output A (Annotated PDF) & Output D (WhatsApp Summary) */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadAnnotatedPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-xl bg-[#70E0A0] hover:bg-[#5cd490] text-[#17365D] text-xs font-bold font-sans transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Download the student script annotated with ticks, crosses, subtotals and feedback boxes"
            >
              <FileDown size={14} />
              <span>{isGeneratingPdf ? "Generating Annotated PDF..." : "Download Annotated PDF (Output A)"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-sans transition cursor-pointer flex items-center gap-1.5 border border-white/20"
              title="Copy the clean formatted WhatsApp summary for parents or teachers"
            >
              {copiedWhatsApp ? <Check size={14} className="text-[#70E0A0]" /> : <Share2 size={14} />}
              <span>{copiedWhatsApp ? "Copied to Clipboard!" : "Copy WhatsApp Summary (Output D)"}</span>
            </button>
          </div>
        </div>
      )}

      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Pure display math line: $$...$$ or \[...\]
        if (
          (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length >= 4) ||
          (trimmed.startsWith("\\[") && trimmed.endsWith("\\]"))
        ) {
          const raw = trimmed.replace(/^(\$\$|\\\[)/, "").replace(/(\$\$|\\\])$/, "");
          return <MathSpan key={idx} latex={raw} displayMode={true} isLight={isLight} />;
        }

        // Standalone mathematical equation on its own line
        if (
          trimmed.startsWith("$") &&
          trimmed.endsWith("$") &&
          trimmed.length > 2 &&
          !trimmed.slice(1, -1).includes("\n")
        ) {
          const inner = trimmed.slice(1, -1);
          if (inner.includes("=") || inner.includes("\\") || inner.length > 8) {
            return <MathSpan key={idx} latex={inner} displayMode={true} isLight={isLight} />;
          }
        }

        // Section Headings
        const isHeaderTag = trimmed.startsWith("### ") || trimmed.startsWith("## ");
        const isBulletHeader = trimmed.match(/^[-*•]\s*(\d+\.\s+[A-Za-z].*)$/);
        const isNumberedHeader = !trimmed.includes(":") && trimmed.match(/^(\d+\.\s+[A-Za-z].*)$/);

        if (isHeaderTag || isBulletHeader || isNumberedHeader) {
          const rawHeader = isHeaderTag
            ? trimmed.replace(/^#{2,3}\s+/, "")
            : isBulletHeader
            ? isBulletHeader[1]
            : isNumberedHeader![1];

          const lower = rawHeader.toLowerCase();

          // Output B — Examiner Report Heading
          if (lower.includes("output b") || lower.includes("examiner report")) {
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border mt-2 ${
                  isLight
                    ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]"
                    : "bg-[#1E3A8A]/25 border-[#3B82F6]/40 text-[#93C5FD]"
                }`}
              >
                <BookOpen size={16} className="shrink-0" />
                <span>{rawHeader}</span>
              </div>
            );
          }

          // Output C — Lost-Marks Breakdown Heading (#FFEBEE theme)
          if (lower.includes("output c") || lower.includes("lost-marks") || lower.includes("lost marks")) {
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border mt-2 ${
                  isLight
                    ? "bg-[#FFEBEE] border-[#FECDD3] text-[#9F1239]"
                    : "bg-[#881337]/25 border-[#F43F5E]/40 text-[#FDA4AF]"
                }`}
              >
                <XCircle size={16} className="shrink-0" />
                <span>{rawHeader}</span>
              </div>
            );
          }

          // Output D — WhatsApp Summary Heading
          if (lower.includes("output d") || lower.includes("whatsapp")) {
            return (
              <div
                key={idx}
                className={`flex items-center justify-between gap-2 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border mt-2 ${
                  isLight
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                    : "bg-[#064E3B]/25 border-[#10B981]/40 text-[#6EE7B7]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="shrink-0" />
                  <span>{rawHeader}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                >
                  {copiedWhatsApp ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedWhatsApp ? "Copied" : "Copy"}</span>
                </button>
              </div>
            );
          }

          // Page-One Score Badge line inside markdown (skip redundant line if card already rendered)
          if (lower.includes("page-one score badge") || lower.includes("score badge")) {
            return null;
          }

          if (
            lower.includes("assessment") ||
            lower.includes("mistake breakdown") ||
            lower.includes("earned marks") ||
            lower.includes("criteria")
          ) {
            let headerIcon = (
              <Sparkles size={16} className={isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"} />
            );
            let headerBadge = isLight
              ? "bg-[#EFEEFA] border-[#D6D2F6] text-[#4E45B0]"
              : "bg-[#5F55C8]/15 border-[#A99BFF]/30 text-[#C4BCFF]";

            if (
              lower.includes("got right") ||
              lower.includes("earned marks") ||
              lower.includes("key points correct")
            ) {
              headerIcon = (
                <CheckCircle2 size={16} className={isLight ? "text-[#15803D]" : "text-[#34D399]"} />
              );
              headerBadge = isLight
                ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#14532D]"
                : "bg-[#10B981]/15 border-[#34D399]/30 text-[#6EE7B7]";
            } else if (
              lower.includes("assessment") ||
              lower.includes("score") ||
              lower.includes("marks awarded")
            ) {
              headerIcon = (
                <Award size={16} className={isLight ? "text-[#B45309]" : "text-[#FBBF24]"} />
              );
              headerBadge = isLight
                ? "bg-[#FFFBEB] border-[#FDE68A] text-[#78350F]"
                : "bg-[#F59E0B]/15 border-[#FBBF24]/30 text-[#FDE68A]";
            }

            return (
              <div
                key={idx}
                className={`flex items-center gap-2 font-mono font-bold text-sm ${headerBadge} px-3 py-2 rounded-xl border mt-2`}
              >
                {headerIcon}
                <span>{rawHeader}</span>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 pt-3 pb-0.5 mt-2">
              <span
                className={`font-black text-lg leading-none shrink-0 mt-0.5 select-none ${
                  isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"
                }`}
              >
                •
              </span>
              <h3
                className={`font-bold text-[15px] sm:text-base tracking-tight leading-snug ${
                  isLight ? "text-[#18202B]" : "text-[#FFFFFF]"
                }`}
              >
                {renderInline(rawHeader)}
              </h3>
            </div>
          );
        }

        // Detect Mistake lines with special callouts
        if (
          trimmed.startsWith("❌") ||
          trimmed.toLowerCase().startsWith("- mistake:") ||
          trimmed.toLowerCase().startsWith("* mistake:")
        ) {
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs my-1.5 ${
                isLight
                  ? "bg-[#FFF1F2] border-[#FECDD3] text-[#881337]"
                  : "bg-[#F43F5E]/12 border-[#FB7185]/30 text-[#FFE4E6]"
              }`}
            >
              <XCircle
                size={15}
                className={`shrink-0 mt-0.5 ${isLight ? "text-[#BE123C]" : "text-[#FB7185]"}`}
              />
              <div className="flex-1 leading-relaxed">
                {renderInline(trimmed.replace(/^[-*❌]\s*(Mistake:)?\s*/i, ""))}
              </div>
            </div>
          );
        }

        // Detect Earned marks / correct points
        if (
          trimmed.startsWith("✅") ||
          trimmed.toLowerCase().startsWith("- correct:") ||
          trimmed.toLowerCase().startsWith("* correct:")
        ) {
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs my-1.5 ${
                isLight
                  ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#14532D]"
                  : "bg-[#10B981]/12 border-[#34D399]/30 text-[#D1FAE5]"
              }`}
            >
              <CheckCircle2
                size={15}
                className={`shrink-0 mt-0.5 ${isLight ? "text-[#15803D]" : "text-[#34D399]"}`}
              />
              <div className="flex-1 leading-relaxed">
                {renderInline(trimmed.replace(/^[-*✅]\s*(Correct:)?\s*/i, ""))}
              </div>
            </div>
          );
        }

        // Detect Examiner Tip / Warning Callout
        if (
          trimmed.toLowerCase().startsWith("📌 examiner tip:") ||
          trimmed.toLowerCase().startsWith("⚠️")
        ) {
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs my-1.5 ${
                isLight
                  ? "bg-[#FFFBEB] border-[#FDE68A] text-[#78350F]"
                  : "bg-[#F59E0B]/12 border-[#FBBF24]/30 text-[#FEF3C7]"
              }`}
            >
              <AlertCircle
                size={15}
                className={`shrink-0 mt-0.5 ${isLight ? "text-[#B45309]" : "text-[#FBBF24]"}`}
              />
              <div className="flex-1 leading-relaxed">
                {renderInline(trimmed.replace(/^[📌⚠️]\s*/, ""))}
              </div>
            </div>
          );
        }

        // Bullet points
        if (
          trimmed.startsWith("* ") ||
          trimmed.startsWith("- ") ||
          trimmed.startsWith("• ") ||
          trimmed.startsWith("•\t")
        ) {
          const contentAfterBullet = trimmed.replace(/^[-*•]\s*/, "");
          const isLostMarkBullet =
            contentAfterBullet.startsWith("**[M0") ||
            contentAfterBullet.startsWith("**[A0") ||
            contentAfterBullet.startsWith("**[B0") ||
            contentAfterBullet.toLowerCase().includes("lost mark");
          const isEarnedMarkBullet =
            contentAfterBullet.startsWith("**[M1") ||
            contentAfterBullet.startsWith("**[M2") ||
            contentAfterBullet.startsWith("**[A1") ||
            contentAfterBullet.startsWith("**[A2") ||
            contentAfterBullet.startsWith("**[B1") ||
            contentAfterBullet.startsWith("**[B2") ||
            contentAfterBullet.startsWith("**[B3");

          if (isLostMarkBullet) {
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs my-1.5 ${
                  isLight
                    ? "bg-[#FFF1F2] border-[#FECDD3] text-[#881337]"
                    : "bg-[#F43F5E]/12 border-[#FB7185]/30 text-[#FFE4E6]"
                }`}
              >
                <XCircle
                  size={15}
                  className={`shrink-0 mt-0.5 ${isLight ? "text-[#BE123C]" : "text-[#FB7185]"}`}
                />
                <div className="flex-1 leading-relaxed">{renderInline(contentAfterBullet)}</div>
              </div>
            );
          }

          if (isEarnedMarkBullet) {
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs my-1.5 ${
                  isLight
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#14532D]"
                    : "bg-[#10B981]/12 border-[#34D399]/30 text-[#D1FAE5]"
                }`}
              >
                <CheckCircle2
                  size={15}
                  className={`shrink-0 mt-0.5 ${isLight ? "text-[#15803D]" : "text-[#34D399]"}`}
                />
                <div className="flex-1 leading-relaxed">{renderInline(contentAfterBullet)}</div>
              </div>
            );
          }

          const colonMatch = contentAfterBullet.match(/^(\*\*.*?\*\*|[^:\n]{2,60}):\s*(.*)/);
          if (colonMatch) {
            let keyTerm = colonMatch[1].trim();
            if (keyTerm.startsWith("**") && keyTerm.endsWith("**")) {
              keyTerm = keyTerm.slice(2, -2).trim();
            }
            const restOfContent = colonMatch[2];

            return (
              <div key={idx} className="flex items-start gap-2.5 py-1 pl-0.5 leading-relaxed">
                <span
                  className={`font-bold text-base leading-none shrink-0 mt-1 select-none ${
                    isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"
                  }`}
                >
                  •
                </span>
                <div
                  className={`flex-1 text-sm sm:text-[14px] ${
                    isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
                  }`}
                >
                  <span className={`font-bold ${isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"}`}>
                    {renderInline(keyTerm)}:
                  </span>{" "}
                  <span>{renderInline(restOfContent)}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2.5 py-1 pl-0.5 leading-relaxed">
              <span
                className={`font-bold text-base leading-none shrink-0 mt-1 select-none ${
                  isLight ? "text-[#5F55C8]" : "text-[#A99BFF]"
                }`}
              >
                •
              </span>
              <div
                className={`flex-1 text-sm sm:text-[14px] ${
                  isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
                }`}
              >
                {renderInline(contentAfterBullet)}
              </div>
            </div>
          );
        }

        // Numbered list or step list
        const numMatch = trimmed.match(/^(\d+|\(\d+\))\.\s*(.*)|^(\d+|\(\d+\))\s*[-–:]\s*(.*)/);
        if (numMatch) {
          const stepNumber = (numMatch[1] || numMatch[3] || "").replace(/[()]/g, "");
          const stepText = numMatch[2] || numMatch[4] || "";
          return (
            <div key={idx} className="flex items-start gap-3 pl-1 my-2">
              <span
                className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isLight
                    ? "text-[#5F55C8] bg-[#EFEEFA] border-[#D6D2F6]"
                    : "text-[#A99BFF] bg-[#5F55C8]/20 border-[#A99BFF]/35"
                }`}
              >
                {stepNumber}
              </span>
              <div
                className={`flex-1 leading-relaxed font-medium ${
                  isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
                }`}
              >
                {renderInline(stepText)}
              </div>
            </div>
          );
        }

        // Standard text paragraph
        return (
          <p
            key={idx}
            className={`leading-relaxed text-sm sm:text-[14.5px] my-1.5 ${
              isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
            }`}
          >
            {renderInline(line)}
          </p>
        );
      })}

      {isErrorOrEvaluationNote && onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#5F55C8] hover:bg-[#4E45B0] text-white text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Retry Question</span>
          </button>
        </div>
      )}
    </div>
  );
};

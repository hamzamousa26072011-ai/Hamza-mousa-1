import React from "react";
import { CheckCircle2, XCircle, AlertCircle, Award, Lightbulb, Sparkles, BookOpen, RotateCcw } from "lucide-react";
import katex from "katex";

interface FormattedScholarResponseProps {
  content: string;
  onRetry?: () => void;
}

// Helper to safely render KaTeX to an HTML string
function renderKaTeX(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode,
      output: "htmlAndMathml",
      strict: false,
    });
  } catch (err) {
    console.warn("KaTeX render error:", err);
    return `<span class="font-mono text-xs text-amber-400 font-semibold">${latex}</span>`;
  }
}

// Component to render a mathematical LaTeX equation safely
const MathSpan: React.FC<{ latex: string; displayMode?: boolean }> = ({ latex, displayMode = false }) => {
  const html = renderKaTeX(latex, displayMode);
  return (
    <span
      className={displayMode ? "block my-2.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 overflow-x-auto text-center font-medium scholar-math-block" : "inline-block px-1 mx-0.5 font-medium scholar-math-inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const FormattedScholarResponse: React.FC<FormattedScholarResponseProps> = ({ content, onRetry }) => {
  const lines = content.split("\n");
  const isErrorOrEvaluationNote = content.toLowerCase().includes("evaluation note") || content.toLowerCase().includes("connection issue") || content.toLowerCase().includes("unable to reach ai tutor") || content.toLowerCase().includes("unable to reach ai checker");

  // Helper to parse a line containing inline math $...$ or \(...\), bold **...**, code `...`
  const renderInline = (text: string) => {
    // 1. Split by math delimiters first: $...$ or $$...$$
    // Regex matches $$...$$ or $...$ (non-greedy)
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$(?:\\.|[^\$\n])+\$)/g;
    const segments = text.split(mathRegex);

    return segments.map((seg, sIdx) => {
      if (!seg) return null;

      // Check if this segment is a display math block $$...$$
      if (seg.startsWith("$$") && seg.endsWith("$$") && seg.length >= 4) {
        const formula = seg.slice(2, -2);
        return <MathSpan key={`math-block-${sIdx}`} latex={formula} displayMode={true} />;
      }

      // Check if this segment is an inline math block $...$
      if (seg.startsWith("$") && seg.endsWith("$") && seg.length >= 2) {
        const formula = seg.slice(1, -1);
        return <MathSpan key={`math-inline-${sIdx}`} latex={formula} displayMode={false} />;
      }

      // Process standard markdown bold (**text**), italics (*text* or _text_), and code (`text`) inside regular text
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
                    className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold font-mono border border-blue-500/30 inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <BookOpen size={12} className="text-blue-400 shrink-0" />
                    {inner}
                  </span>
                );
              }

              // Highlight mark scheme keywords or scores
              if (inner.toLowerCase().includes("marks awarded") || inner.toLowerCase().includes("score:")) {
                return (
                  <span
                    key={`bold-${pIdx}`}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono border border-emerald-500/30 inline-block"
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
                    className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-xs inline-block border border-rose-500/30"
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
                    className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs inline-block border border-indigo-500/30"
                  >
                    {inner}
                  </span>
                );
              }
              return (
                <strong key={`bold-${pIdx}`} className="font-bold text-white tracking-tight">
                  {renderInlineMathOnly(inner)}
                </strong>
              );
            }
            if ((part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) || 
                (part.startsWith("_") && part.endsWith("_") && !part.startsWith("__"))) {
              const inner = part.slice(1, -1);
              return (
                <em key={`italic-${pIdx}`} className="italic text-purple-200/90 font-serif">
                  {inner}
                </em>
              );
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={`code-${pIdx}`}
                  className="px-1.5 py-0.5 mx-0.5 rounded bg-black/40 text-amber-300 font-mono text-xs border border-white/10"
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

  // Helper for rendering math inside bold tags if any
  const renderInlineMathOnly = (text: string) => {
    const mathRegex = /(\$(?:\\.|[^\$\n])+\$)/g;
    const segs = text.split(mathRegex);
    return segs.map((s, idx) => {
      if (s.startsWith("$") && s.endsWith("$") && s.length >= 2) {
        return <MathSpan key={idx} latex={s.slice(1, -1)} displayMode={false} />;
      }
      return s;
    });
  };

  return (
    <div className="space-y-3.5 text-slate-200 text-sm leading-relaxed scholar-response-container">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Pure display math line: $$...$$ or single $...$ starting with $ and ending with $ containing \frac or = or math
        if (
          (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length >= 4) ||
          (trimmed.startsWith("\\[") && trimmed.endsWith("\\]"))
        ) {
          const raw = trimmed.replace(/^(\$\$|\\\[)/, "").replace(/(\$\$|\\\])$/, "");
          return <MathSpan key={idx} latex={raw} displayMode={true} />;
        }

        // Standalone mathematical equation on its own line: e.g. "$T(1-e) = n(1+e)$" or "$e = \frac{T-n}{T+n}$"
        if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2 && !trimmed.slice(1, -1).includes("\n")) {
          const inner = trimmed.slice(1, -1);
          // If it contains math expressions like =, \frac, +, -, ^, _, \sqrt, render as clean prominent math block
          if (inner.includes("=") || inner.includes("\\") || inner.length > 8) {
            return <MathSpan key={idx} latex={inner} displayMode={true} />;
          }
        }

        // Section Headings matching Screenshot 2 (e.g. "• 1. Converging (Convex) Lenses" or "### 1. Converging...")
        const isHeaderTag = trimmed.startsWith("### ") || trimmed.startsWith("## ");
        const isBulletHeader = trimmed.match(/^[-*•]\s*(\d+\.\s+[A-Za-z].*)$/);
        const isNumberedHeader = !trimmed.includes(":") && trimmed.match(/^(\d+\.\s+[A-Za-z].*)$/);

        if (isHeaderTag || isBulletHeader || isNumberedHeader) {
          const rawHeader = isHeaderTag 
            ? trimmed.replace(/^#{2,3}\s+/, "") 
            : isBulletHeader 
            ? isBulletHeader[1] 
            : isNumberedHeader![1];

          // Check if it's a known assessment/mistake badge header
          const lower = rawHeader.toLowerCase();
          if (lower.includes("assessment") || lower.includes("mistake breakdown") || lower.includes("earned marks") || lower.includes("lost marks")) {
            let headerIcon = <Sparkles size={16} className="text-indigo-400" />;
            let headerBadge = "bg-indigo-500/10 border-indigo-500/20 text-indigo-300";

            if (lower.includes("got right") || lower.includes("earned marks") || lower.includes("key points correct")) {
              headerIcon = <CheckCircle2 size={16} className="text-emerald-400" />;
              headerBadge = "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm";
            } else if (lower.includes("lost marks") || lower.includes("missed") || lower.includes("mistake") || lower.includes("error") || lower.includes("gap")) {
              headerIcon = <XCircle size={16} className="text-rose-400" />;
              headerBadge = "bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-sm";
            } else if (lower.includes("assessment") || lower.includes("score") || lower.includes("marks awarded")) {
              headerIcon = <Award size={16} className="text-amber-400" />;
              headerBadge = "bg-amber-500/10 border-amber-500/20 text-amber-300";
            }

            return (
              <div
                key={idx}
                className={`pt-2.5 pb-1 border-b border-white/5 flex items-center gap-2 font-mono font-bold text-sm ${headerBadge} px-3 py-1.5 rounded-xl border`}
              >
                {headerIcon}
                <span>{rawHeader}</span>
              </div>
            );
          }

          // Sleek clean topic/section heading exactly like Screenshot 2: "• 1. Converging (Convex) Lenses"
          return (
            <div key={idx} className="flex items-start gap-2 pt-3 pb-0.5 mt-2">
              <span className="text-[#C084FC] font-black text-lg leading-none shrink-0 mt-0.5 select-none">•</span>
              <h3 className="font-bold text-[#E9D5FF] text-[15px] sm:text-base tracking-tight leading-snug">
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
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs my-1"
            >
              <XCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
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
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs my-1"
            >
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {renderInline(trimmed.replace(/^[-*✅]\s*(Correct:)?\s*/i, ""))}
              </div>
            </div>
          );
        }

        // Detect Examiner Tip / Warning Callout
        if (trimmed.toLowerCase().startsWith("📌 examiner tip:") || trimmed.toLowerCase().startsWith("⚠️")) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs my-1"
            >
              <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {renderInline(trimmed.replace(/^[📌⚠️]\s*/, ""))}
              </div>
            </div>
          );
        }

        // Bullet points (matching Screenshot 2 with purple bullets & lavender key phrases)
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("•\t")) {
          const contentAfterBullet = trimmed.replace(/^[-*•]\s*/, "");
          const isLostMarkBullet = contentAfterBullet.startsWith("**[M0") || contentAfterBullet.startsWith("**[A0") || contentAfterBullet.startsWith("**[B0") || contentAfterBullet.toLowerCase().includes("lost mark");
          const isEarnedMarkBullet = contentAfterBullet.startsWith("**[M1") || contentAfterBullet.startsWith("**[M2") || contentAfterBullet.startsWith("**[A1") || contentAfterBullet.startsWith("**[A2") || contentAfterBullet.startsWith("**[B1") || contentAfterBullet.startsWith("**[B2") || contentAfterBullet.startsWith("**[B3");

          if (isLostMarkBullet) {
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs my-1"
              >
                <XCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {renderInline(contentAfterBullet)}
                </div>
              </div>
            );
          }

          if (isEarnedMarkBullet) {
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs my-1"
              >
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {renderInline(contentAfterBullet)}
                </div>
              </div>
            );
          }

          // Matches key terms before a colon: e.g. "Magnifying Glass: ...", "**Camera:** ...", "Correcting Long-Sightedness (Hyperopia): ..."
          const colonMatch = contentAfterBullet.match(/^(\*\*.*?\*\*|[^:\n]{2,60}):\s*(.*)/);
          if (colonMatch) {
            let keyTerm = colonMatch[1].trim();
            if (keyTerm.startsWith("**") && keyTerm.endsWith("**")) {
              keyTerm = keyTerm.slice(2, -2).trim();
            }
            const restOfContent = colonMatch[2];

            return (
              <div key={idx} className="flex items-start gap-2.5 py-1 pl-0.5 leading-relaxed">
                <span className="text-[#A855F7] font-bold text-base leading-none shrink-0 mt-1 select-none">•</span>
                <div className="flex-1 text-slate-200 text-sm sm:text-[14px]">
                  <span className="font-bold text-[#E9D5FF]">
                    {renderInline(keyTerm)}:
                  </span>{" "}
                  <span>
                    {renderInline(restOfContent)}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2.5 py-1 pl-0.5 leading-relaxed">
              <span className="text-[#A855F7] font-bold text-base leading-none shrink-0 mt-1 select-none">•</span>
              <div className="flex-1 text-slate-200 text-sm sm:text-[14px]">
                {renderInline(contentAfterBullet)}
              </div>
            </div>
          );
        }

        // Numbered list or step list: "1. Multiply both sides by $(1-e)$:" or "(1) Step title"
        const numMatch = trimmed.match(/^(\d+|\(\d+\))\.\s*(.*)|^(\d+|\(\d+\))\s*[-–:]\s*(.*)/);
        if (numMatch) {
          const stepNumber = (numMatch[1] || numMatch[3] || "").replace(/[()]/g, "");
          const stepText = numMatch[2] || numMatch[4] || "";
          return (
            <div key={idx} className="flex items-start gap-3 pl-1 my-2">
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                {stepNumber}
              </span>
              <div className="flex-1 leading-relaxed font-medium">{renderInline(stepText)}</div>
            </div>
          );
        }

        // Standard text paragraph
        return (
          <p key={idx} className="leading-relaxed text-slate-200 text-sm sm:text-[14.5px] my-2">
            {renderInline(line)}
          </p>
        );
      })}

      {isErrorOrEvaluationNote && onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold shadow-md hover:shadow-indigo-500/25 transition cursor-pointer active:scale-95"
          >
            <RotateCcw size={13} className="animate-spin-slow" />
            <span>Click to Retry Question</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { CheckCircle2, XCircle, AlertCircle, Award, Sparkles, BookOpen, RotateCcw } from "lucide-react";
import katex from "katex";

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

  return (
    <div
      className={`space-y-3 text-sm leading-relaxed scholar-response-container ${
        isLight ? "text-[#18202B]" : "text-[#F1F3F8]"
      }`}
    >
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
          if (
            lower.includes("assessment") ||
            lower.includes("mistake breakdown") ||
            lower.includes("earned marks") ||
            lower.includes("lost marks")
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
              lower.includes("lost marks") ||
              lower.includes("missed") ||
              lower.includes("mistake") ||
              lower.includes("error") ||
              lower.includes("gap")
            ) {
              headerIcon = (
                <XCircle size={16} className={isLight ? "text-[#BE123C]" : "text-[#FB7185]"} />
              );
              headerBadge = isLight
                ? "bg-[#FFF1F2] border-[#FECDD3] text-[#881337]"
                : "bg-[#F43F5E]/15 border-[#FB7185]/30 text-[#FDA4AF]";
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
                className={`flex items-center gap-2 font-mono font-bold text-sm ${headerBadge} px-3 py-2 rounded-xl border`}
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

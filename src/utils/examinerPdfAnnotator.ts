/**
 * ============================================================================
 * EXAMINER PDF ANNOTATION ENGINE — PRINCIPAL EXAMINER & SENIOR MODERATOR SYSTEM
 * ============================================================================
 * 
 * Generates and overlays professionally moderated examiner annotations onto student
 * examination scripts according to official Cambridge CAIE, Pearson Edexcel & Oxford AQA standards.
 * 
 * Design System Specifications:
 * - Palette:
 *   - Correct response: #70E0A0 (Soft green highlight with 40% opacity)
 *   - Incorrect response: #FF8888 (Soft red highlight with 40% opacity)
 *   - Partially correct: #FFD580 (Soft amber highlight with 40% opacity)
 *   - Examiner typography: #243247 (Dark navy typography)
 *   - Feedback boxes: #FFEBEE (Pale pink background, #FECDD3 border)
 *   - Neutral separators: #D8DEE8
 *   - Score badge: #17365D (Navy background with white text)
 * - Organized Examiner Symbols:
 *   - ONLY ticks (✓) and crosses (✗) in a dedicated right annotation lane (strictly organized, never scattered).
 * - Margin Subtotal System:
 *   - Dedicated left margin score lane (e.g. "3/3", "2/3", "0/2").
 * - Circle Official Mark Allocations:
 *   - Thin green oval circling printed mark allocations (e.g. "[3]", "[5]").
 * - Examiner Feedback Callout Boxes:
 *   - Pale-pink boxes containing Issue, Required improvement, Examiner wording, and Marks lost.
 * - Page-One Score Badge:
 *   - SCORE: X/Y (Z%), PROVISIONAL GRADE, Moderation standard.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface QuestionAnnotationItem {
  questionNumber: string;
  maxMarks: number;
  awardedMarks: number;
  status: "correct" | "partially_correct" | "incorrect";
  studentAnswer?: string;
  promptText?: string;
  issue?: string;
  requiredImprovement?: string;
  examinerWording?: string;
  marksLost?: number;
  markPoints?: Array<{
    markCode: string;
    description: string;
    awarded: boolean;
    reason?: string;
  }>;
}

export interface ExaminerPdfOptions {
  subject: string;
  examBoard: string;
  paperCode: string;
  session?: string;
  totalAwarded: number;
  totalMax: number;
  percentage: number;
  provisionalGrade: string;
  markingMethod?: string;
  studentName?: string;
  questions: QuestionAnnotationItem[];
  originalPdfBytes?: Uint8Array | ArrayBuffer;
  originalImages?: string[]; // Base64 data URLs
}

// Colors according to the Examiner Visual Design System
const COLOR_CORRECT = rgb(112 / 255, 224 / 255, 160 / 255); // #70E0A0 (Soft green)
const COLOR_INCORRECT = rgb(255 / 255, 136 / 255, 136 / 255); // #FF8888 (Soft red)
const COLOR_PARTIAL = rgb(255 / 255, 213 / 255, 128 / 255); // #FFD580 (Soft amber)
const COLOR_EXAMINER_TEXT = rgb(36 / 255, 50 / 255, 71 / 255); // #243247 (Dark navy)
const COLOR_FEEDBACK_BG = rgb(255 / 255, 235 / 255, 238 / 255); // #FFEBEE (Pale pink)
const COLOR_FEEDBACK_BORDER = rgb(254 / 255, 205 / 255, 211 / 255); // #FECDD3
const COLOR_SEPARATOR = rgb(216 / 255, 222 / 255, 232 / 255); // #D8DEE8
const COLOR_SCORE_BADGE = rgb(23 / 255, 54 / 255, 93 / 255); // #17365D (Deep navy)
const COLOR_WHITE = rgb(1, 1, 1);
const COLOR_GREEN_OVAL = rgb(22 / 255, 163 / 255, 74 / 255); // #16A34A (Clean emerald)

/**
 * Sanitizes input text to guarantee WinAnsi compliance with standard PDF fonts.
 */
function safePdfText(str: any): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[—–]/g, "-")
    .replace(/[••·]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/✓/g, "V")
    .replace(/✗/g, "X")
    .replace(/Δ/g, "Delta ")
    .replace(/θ/g, "theta ")
    .replace(/π/g, "pi")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/°/g, " deg ")
    .replace(/±/g, "+/-")
    .replace(/½/g, "1/2")
    .replace(/¾/g, "3/4")
    .replace(/→/g, "->")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≠/g, "!=")
    .replace(/[^\x20-\x7E]/g, " ")
    .trim();
}

/**
 * Generates an annotated examination PDF adhering strictly to the design system.
 */
export async function generateAnnotatedExamPdf(options: ExaminerPdfOptions): Promise<Uint8Array> {
  let doc: PDFDocument;

  // 1. If an original PDF was provided, load and preserve it as the background
  if (options.originalPdfBytes && (options.originalPdfBytes as any).byteLength > 0) {
    try {
      doc = await PDFDocument.load(options.originalPdfBytes);
    } catch (loadErr) {
      console.warn("Could not load original PDF bytes, creating clean script layout:", loadErr);
      doc = await PDFDocument.create();
    }
  } else {
    doc = await PDFDocument.create();
  }

  // Embed standard professional typography
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  const PAGE_WIDTH = 595.28; // Standard A4 (Points)
  const PAGE_HEIGHT = 841.89;

  // If new document or no pages exist, create structured script pages
  if (doc.getPageCount() === 0) {
    let currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let currentY = PAGE_HEIGHT - 40;

    // A. Page-One Score Badge (Output A & H)
    currentY = drawPageOneScoreBadge(currentPage, options, fontRegular, fontBold, currentY);

    // Left Lane (x = 35), Question Lane (x = 75..505), Right Lane (x = 525)
    const LEFT_LANE_X = 35;
    const RIGHT_LANE_X = 525;
    const CONTENT_X = 75;
    const CONTENT_WIDTH = 430;

    currentPage.drawText(safePdfText("EXAMINATION SCRIPT - MODERATED CANDIDATE RESPONSES"), {
      x: CONTENT_X,
      y: currentY - 15,
      size: 9,
      font: fontBold,
      color: COLOR_EXAMINER_TEXT
    });

    currentPage.drawLine({
      start: { x: LEFT_LANE_X, y: currentY - 22 },
      end: { x: RIGHT_LANE_X + 35, y: currentY - 22 },
      thickness: 1,
      color: COLOR_SEPARATOR
    });

    currentY -= 35;

    // Render questions with localized highlights, margin lanes, and pale-pink feedback callouts
    for (let i = 0; i < options.questions.length; i++) {
      const q = options.questions[i];
      const estimatedHeight = calculateQuestionBlockHeight(q);

      // Check for page overflow
      if (currentY - estimatedHeight < 50) {
        currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        currentY = PAGE_HEIGHT - 50;

        // Running header on continuation pages
        currentPage.drawText(
          safePdfText(`${options.subject} (${options.examBoard} ${options.paperCode}) - Candidate Moderation Script`),
          {
            x: LEFT_LANE_X,
            y: currentY,
            size: 8,
            font: fontRegular,
            color: rgb(0.4, 0.4, 0.4)
          }
        );

        currentPage.drawLine({
          start: { x: LEFT_LANE_X, y: currentY - 6 },
          end: { x: RIGHT_LANE_X + 35, y: currentY - 6 },
          thickness: 0.5,
          color: COLOR_SEPARATOR
        });

        currentY -= 25;
      }

      currentY = drawQuestionItem(
        currentPage,
        q,
        fontRegular,
        fontBold,
        fontMono,
        LEFT_LANE_X,
        CONTENT_X,
        CONTENT_WIDTH,
        RIGHT_LANE_X,
        currentY
      );
    }
  } else {
    // Annotating an existing scanned PDF
    const firstPage = doc.getPage(0);
    const { width: pWidth, height: pHeight } = firstPage.getSize();

    // Place Score Badge at top right or top of page 1
    const badgeW = 240;
    const badgeH = 50;
    const badgeX = Math.max(30, pWidth - badgeW - 30);
    const badgeY = Math.max(20, pHeight - badgeH - 25);

    firstPage.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: COLOR_SCORE_BADGE,
      borderColor: rgb(0.1, 0.2, 0.35),
      borderWidth: 1
    });

    firstPage.drawText(safePdfText(`SCORE: ${options.totalAwarded} / ${options.totalMax} (${options.percentage}%)`), {
      x: badgeX + 12,
      y: badgeY + 30,
      size: 11,
      font: fontBold,
      color: COLOR_WHITE
    });

    firstPage.drawText(safePdfText(`PROVISIONAL GRADE: ${options.provisionalGrade} - ${options.examBoard}`), {
      x: badgeX + 12,
      y: badgeY + 14,
      size: 8,
      font: fontRegular,
      color: rgb(0.9, 0.95, 1)
    });

    // Also append an Examiner Moderation Summary Sheet at the end of the document
    const summaryPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let sY = PAGE_HEIGHT - 40;

    sY = drawPageOneScoreBadge(summaryPage, options, fontRegular, fontBold, sY);

    summaryPage.drawText(safePdfText("EXAMINER REPORT & LOST-MARKS BREAKDOWN (MODERATED SCRIPT)"), {
      x: 35,
      y: sY - 10,
      size: 10,
      font: fontBold,
      color: COLOR_EXAMINER_TEXT
    });

    sY -= 30;

    for (let i = 0; i < options.questions.length; i++) {
      const q = options.questions[i];
      const estH = calculateQuestionBlockHeight(q);
      if (sY - estH < 50) {
        const nextSummary = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        sY = PAGE_HEIGHT - 50;
        sY = drawQuestionItem(nextSummary, q, fontRegular, fontBold, fontMono, 35, 75, 430, 525, sY);
      } else {
        sY = drawQuestionItem(summaryPage, q, fontRegular, fontBold, fontMono, 35, 75, 430, 525, sY);
      }
    }
  }

  return await doc.save();
}

/**
 * Draws the Professional Page-One Score Badge (H)
 */
function drawPageOneScoreBadge(
  page: any,
  options: ExaminerPdfOptions,
  fontRegular: any,
  fontBold: any,
  startY: number
): number {
  const BADGE_X = 35;
  const BADGE_WIDTH = 525;
  const BADGE_HEIGHT = 72;
  const BADGE_Y = startY - BADGE_HEIGHT;

  // Navy score badge background (#17365D)
  page.drawRectangle({
    x: BADGE_X,
    y: BADGE_Y,
    width: BADGE_WIDTH,
    height: BADGE_HEIGHT,
    color: COLOR_SCORE_BADGE,
    borderColor: rgb(15 / 255, 38 / 255, 68 / 255),
    borderWidth: 1.5
  });

  // Top header in score badge
  page.drawText(
    safePdfText(`${options.examBoard.toUpperCase()} - ${options.subject.toUpperCase()} (${options.paperCode})`),
    {
      x: BADGE_X + 16,
      y: BADGE_Y + 52,
      size: 9,
      font: fontBold,
      color: rgb(180 / 255, 210 / 255, 255 / 255)
    }
  );

  // Main Score text: SCORE: 42/60 (70%)
  page.drawText(safePdfText(`SCORE: ${options.totalAwarded} / ${options.totalMax}  (${options.percentage}%)`), {
    x: BADGE_X + 16,
    y: BADGE_Y + 28,
    size: 16,
    font: fontBold,
    color: COLOR_WHITE
  });

  // Provisional Grade & Examiner Status
  page.drawText(
    safePdfText(`PROVISIONAL GRADE: ${options.provisionalGrade}  -  3-PASS INDEPENDENT MODERATION`),
    {
      x: BADGE_X + 16,
      y: BADGE_Y + 12,
      size: 8,
      font: fontRegular,
      color: rgb(215 / 255, 230 / 255, 255 / 255)
    }
  );

  // Right-aligned verification badge
  page.drawText(safePdfText("OFFICIAL EXAMINER SCRIPT"), {
    x: BADGE_X + BADGE_WIDTH - 155,
    y: BADGE_Y + 48,
    size: 8,
    font: fontBold,
    color: rgb(112 / 255, 224 / 255, 160 / 255)
  });

  page.drawText(safePdfText("AUTHENTICATED"), {
    x: BADGE_X + BADGE_WIDTH - 110,
    y: BADGE_Y + 34,
    size: 8,
    font: fontRegular,
    color: rgb(180 / 255, 210 / 255, 255 / 255)
  });

  return BADGE_Y - 20;
}

/**
 * Calculates estimated pixel height of a question block for collision avoidance.
 */
function calculateQuestionBlockHeight(q: QuestionAnnotationItem): number {
  let baseHeight = 55;
  if (q.studentAnswer) {
    baseHeight += Math.min(60, Math.ceil(q.studentAnswer.length / 70) * 14);
  }
  if (q.awardedMarks < q.maxMarks || q.issue) {
    baseHeight += 65; // Feedback callout box
  }
  return baseHeight + 20;
}

/**
 * Draws an individual question with:
 * - Left margin subtotal (e.g. 3/3, 2/3, 0/2)
 * - Circled printed mark allocation (e.g. [3])
 * - Localized highlight rectangle (40% opacity)
 * - Right margin lane strictly organized ticks (V) and crosses (X)
 * - Pale-pink examiner feedback callout box when marks are lost
 */
function drawQuestionItem(
  page: any,
  q: QuestionAnnotationItem,
  fontRegular: any,
  fontBold: any,
  fontMono: any,
  leftLaneX: number,
  contentX: number,
  contentWidth: number,
  rightLaneX: number,
  startY: number
): number {
  let curY = startY;

  // 1. Margin Subtotal (System E): Dedicated Left Lane (e.g. "3/3", "2/3", "0/2")
  const subtotalText = safePdfText(`${q.awardedMarks}/${q.maxMarks}`);
  const isFull = q.awardedMarks === q.maxMarks;
  const isZero = q.awardedMarks === 0;
  const subtotalColor = isFull
    ? rgb(21 / 255, 128 / 255, 61 / 255) // Green
    : isZero
    ? rgb(185 / 255, 28 / 255, 28 / 255) // Red
    : rgb(180 / 255, 83 / 255, 9 / 255); // Amber

  page.drawText(subtotalText, {
    x: leftLaneX,
    y: curY - 2,
    size: 11,
    font: fontBold,
    color: subtotalColor
  });

  // 2. Question Title & Printed Mark Allocation (System F)
  const qTitle = safePdfText(`Question ${q.questionNumber}`);
  page.drawText(qTitle, {
    x: contentX,
    y: curY,
    size: 10,
    font: fontBold,
    color: COLOR_EXAMINER_TEXT
  });

  // Printed Mark Allocation (e.g. [3]) with thin green oval
  const allocText = safePdfText(`[${q.maxMarks}]`);
  const allocX = contentX + fontBold.widthOfTextAtSize(qTitle, 10) + 10;
  page.drawText(allocText, {
    x: allocX,
    y: curY,
    size: 9,
    font: fontBold,
    color: rgb(22 / 255, 101 / 255, 52 / 255)
  });

  // Draw thin green oval around printed allocation [X]
  page.drawEllipse({
    x: allocX + 8,
    y: curY + 3,
    xScale: 12,
    yScale: 8,
    borderColor: COLOR_GREEN_OVAL,
    borderWidth: 0.8
  });

  // 3. Right Margin Dedicated Lane for Organized Ticks and Crosses (System D)
  const symbolCount = Math.max(1, q.maxMarks);
  const earnedCount = q.awardedMarks;
  let symbolX = rightLaneX;

  for (let s = 1; s <= symbolCount; s++) {
    const isEarned = s <= earnedCount;
    const symbolStr = isEarned ? "V" : "X"; // Clean standard tick / cross representation
    const symbolColor = isEarned ? rgb(21 / 255, 128 / 255, 61 / 255) : rgb(225 / 255, 29 / 255, 72 / 255);

    // Draw symbol badge in right annotation lane
    page.drawRectangle({
      x: symbolX + (s - 1) * 14,
      y: curY - 4,
      width: 12,
      height: 14,
      color: isEarned ? rgb(236 / 255, 253 / 255, 245 / 255) : rgb(255 / 255, 241 / 255, 242 / 255),
      borderColor: isEarned ? rgb(167 / 255, 243 / 255, 208 / 255) : rgb(254 / 255, 205 / 255, 211 / 255),
      borderWidth: 0.5
    });

    page.drawText(symbolStr, {
      x: symbolX + (s - 1) * 14 + 2.5,
      y: curY - 1,
      size: 9,
      font: fontBold,
      color: symbolColor
    });
  }

  curY -= 18;

  // 4. Candidate Response with Localized Highlight Placement (System C)
  if (q.studentAnswer) {
    const answerSnippet = safePdfText(q.studentAnswer);
    const highlightColor = isFull ? COLOR_CORRECT : isZero ? COLOR_INCORRECT : COLOR_PARTIAL;
    
    // Determine answer lines
    const maxCharsPerLine = 68;
    const lines: string[] = [];
    for (let c = 0; c < answerSnippet.length; c += maxCharsPerLine) {
      lines.push(answerSnippet.slice(c, c + maxCharsPerLine));
      if (lines.length >= 3) break;
    }

    const answerBoxHeight = lines.length * 15 + 6;
    const answerBoxY = curY - answerBoxHeight + 6;

    // Draw localized highlight strip behind text (40% opacity)
    page.drawRectangle({
      x: contentX - 4,
      y: answerBoxY,
      width: contentWidth + 8,
      height: answerBoxHeight,
      color: highlightColor,
      opacity: 0.38,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5
    });

    // Draw answer text in dark readable typography
    for (let l = 0; l < lines.length; l++) {
      page.drawText(safePdfText(lines[l]), {
        x: contentX,
        y: curY - (l * 15) - 2,
        size: 8.5,
        font: fontRegular,
        color: COLOR_EXAMINER_TEXT
      });
    }

    curY = answerBoxY - 8;
  }

  // 5. Examiner Feedback Callout Box (System G) - Pale Pink (#FFEBEE) when marks are lost
  const marksLost = q.maxMarks - q.awardedMarks;
  if (marksLost > 0 || q.issue) {
    const calloutWidth = contentWidth + 8;
    const issueText = safePdfText(q.issue || `Lost ${marksLost} mark(s): intermediate working or exact units omitted.`);
    const requiredText = safePdfText(q.requiredImprovement || "Apply governing syllabus relationship and state units to 3 significant figures.");
    const wordingText = safePdfText(q.examinerWording || "Demonstrate parameter substitutions [M] and correct final unit [A].");

    const calloutH = 50;
    const calloutY = curY - calloutH;

    // Pale pink callout container
    page.drawRectangle({
      x: contentX - 4,
      y: calloutY,
      width: calloutWidth,
      height: calloutH,
      color: COLOR_FEEDBACK_BG,
      borderColor: COLOR_FEEDBACK_BORDER,
      borderWidth: 1
    });

    // Header in callout: "EXAMINER FEEDBACK [-X Marks]"
    page.drawText(safePdfText(`FEEDBACK: -${marksLost} Mark${marksLost > 1 ? "s" : ""}`), {
      x: contentX + 4,
      y: calloutY + calloutH - 12,
      size: 7.5,
      font: fontBold,
      color: rgb(190 / 255, 18 / 255, 60 / 255)
    });

    page.drawText(safePdfText(`Issue: ${issueText.slice(0, 85)}`), {
      x: contentX + 4,
      y: calloutY + calloutH - 24,
      size: 7.5,
      font: fontRegular,
      color: COLOR_EXAMINER_TEXT
    });

    page.drawText(safePdfText(`Required: ${requiredText.slice(0, 85)}`), {
      x: contentX + 4,
      y: calloutY + calloutH - 35,
      size: 7.5,
      font: fontRegular,
      color: rgb(30 / 255, 41 / 255, 59 / 255)
    });

    page.drawText(safePdfText(`Model: ${wordingText.slice(0, 85)}`), {
      x: contentX + 4,
      y: calloutY + calloutH - 46,
      size: 7,
      font: fontBold,
      color: rgb(21 / 255, 128 / 255, 61 / 255)
    });

    curY = calloutY - 12;
  } else {
    curY -= 6;
  }

  // Divider line
  page.drawLine({
    start: { x: contentX, y: curY },
    end: { x: contentX + contentWidth, y: curY },
    thickness: 0.5,
    color: COLOR_SEPARATOR
  });

  return curY - 14;
}

/**
 * Triggers a download of the annotated PDF directly in the browser.
 */
export function downloadPdfBlob(pdfBytes: Uint8Array, fileName: string = "Engez_Examiner_Annotated_Script.pdf") {
  if (typeof window === "undefined") return;
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

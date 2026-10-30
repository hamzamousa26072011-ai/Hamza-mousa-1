# Implementation Plan: AI Examiner Module & Dual-Mode AI Tutor Integration

Upgrade the AI Tutor tab (`AiScholarTab.tsx`) with the user's provided **AI Examiner Module** structure, featuring a top Provider/API Key bar, a **Fast Chatbot** tab for instant Q&A, and a **Paper Correction (High-Accuracy OCR)** tab with 3 multi-file OCR upload slots (Student Answer 1, Student Answer 2, Official Mark Scheme) and deep mark scheme evaluation.

## Proposed Changes

### 1. Dependency Installation
- Install `tesseract.js` and `pdfjs-dist` for client-side PDF rendering (scale 3.0 DPI) and image-to-text OCR extraction.

### 2. AI Tutor Header & Dual Sub-Tabs
- **Header Bar**:
  - Provider Selector (`DeepSeek API`, `OpenAI API`, `Engez Managed AI Engine`)
  - Optional API Key input (`sk-...` or `sk-ant-...`) with local storage state persistence.
- **Sub-Tab Switching**:
  - `Chatbot (Fast)`: Instant Q&A and syllabus clarification.
  - `Paper Correction (High-Accuracy OCR)`: Multi-slot OCR grading suite.

### 3. Paper Correction Module (`AiScholarTab.tsx`)
- **3 OCR Input Slots**:
  1. Student Answer (Part 1) — File input (.pdf, images) + Live status indicator + Editable extracted text area.
  2. Student Answer (Part 2) — File input (.pdf, images) + Live status indicator + Editable extracted text area.
  3. Official Mark Scheme — File input (.pdf, images) + Live status indicator + Editable extracted mark scheme text area.
- **Client-Side OCR Processing**:
  - Render PDF pages via PDF.js worker at 3.0x high resolution for maximum clarity.
  - Run Tesseract.js OCR for automatic transcript extraction into textareas for review & editing.
- **4-Section Detailed Examiner Output**:
  - Section 1: Cleaned Transcription Summary
  - Section 2: Question-by-Question Breakdown with Marks Awarded vs Maximum
  - Section 3: Missed Points & Specific Corrections
  - Section 4: Final Total Score and Percentage

### 4. Server API Endpoint Enhancements (`server.ts`)
- Add `/api/scholar/grade-paper` proxy route handling DeepSeek (`deepseek-reasoner`), Gemini (`gemini-3.8-flash`), or custom OpenAI endpoints for high-accuracy exam grading.

## Verification Plan

### Automated Build & Compilation
- Run `compile_applet` and `lint_applet` to verify zero TypeScript errors.

### Manual Testing Flow
- Switch between **Chatbot (Fast)** and **Paper Correction (High-Accuracy OCR)** tabs.
- Upload PDF / Image files into Answer Part 1, Answer Part 2, and Mark Scheme slots.
- Verify OCR text extraction populates textareas.
- Click "Analyze Transcription & Grade Against Mark Scheme" and verify the structured 4-part Examiner Report.

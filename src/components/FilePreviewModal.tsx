import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Eye
} from "lucide-react";
import { loadPdfDocument, renderPdfPageToCanvas, dataUrlToBlobUrl } from "../utils/pdfRenderer";

export interface PreviewableFile {
  id?: string;
  name: string;
  size?: number;
  type?: string;
  previewUrl?: string;
  base64?: string;
  content?: string;
}

interface FilePreviewModalProps {
  file: PreviewableFile | null;
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  isLight = true
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [imageFilter, setImageFilter] = useState<"none" | "faint_boost" | "high_contrast" | "inverted">("none");
  const [pdfDocInstance, setPdfDocInstance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Determine file type
  const isPdf = Boolean(
    file &&
    (file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf") ||
      (file.previewUrl && file.previewUrl.startsWith("data:application/pdf")))
  );

  const isImage = Boolean(
    file &&
    (file.type?.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name) ||
      (file.previewUrl && file.previewUrl.startsWith("data:image/")))
  );

  const isText = Boolean(!isPdf && !isImage && (file?.content || file?.name.match(/\.(txt|md|json|csv)$/i)));

  // Reset view state whenever file changes
  useEffect(() => {
    if (!isOpen || !file) {
      setPdfDocInstance(null);
      setCurrentPage(1);
      setTotalPages(1);
      setZoomLevel(1.0);
      setRotation(0);
      setImageFilter("none");
      setPdfRenderError(null);
      return;
    }

    setCurrentPage(1);
    setZoomLevel(1.0);
    setRotation(0);
    setImageFilter("none");
    setPdfRenderError(null);

    if (isPdf) {
      const source = file.base64 || file.previewUrl;
      if (source) {
        setIsLoading(true);
        loadPdfDocument(source)
          .then((info) => {
            setPdfDocInstance(info.pdfDocument);
            setTotalPages(info.numPages);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error("Failed to load PDF in preview modal:", err);
            setPdfRenderError("Could not render PDF via canvas engine. Fallback viewer active.");
            setIsLoading(false);
          });
      }
    }
  }, [file, isOpen, isPdf]);

  // Render PDF page onto canvas when currentPage, rotation, or zoom changes
  useEffect(() => {
    if (!isPdf || !pdfDocInstance || !canvasRef.current) return;

    let isMounted = true;
    setIsLoading(true);

    renderPdfPageToCanvas(pdfDocInstance, currentPage, canvasRef.current, zoomLevel * 1.5, rotation)
      .then(() => {
        if (isMounted) {
          setIsLoading(false);
          setPdfRenderError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Canvas render error for page", currentPage, err);
          setIsLoading(false);
          setPdfRenderError(err.message || "Failed to render PDF page.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isPdf, pdfDocInstance, currentPage, zoomLevel, rotation]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        setCurrentPage((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentPage, totalPages, onClose]);

  if (!isOpen || !file) return null;

  const handleCopyText = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleDownload = () => {
    const url = file.previewUrl ? dataUrlToBlobUrl(file.previewUrl) : null;
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (file.content) {
      const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = file.name || "document.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
    }
  };

  const formattedSize = file.size
    ? file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`
    : null;

  return (
    <div
      id="file-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalContainerRef}
        id="file-preview-modal-container"
        className={`w-full max-w-5xl flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullScreen ? "fixed inset-2 max-w-none h-[calc(100vh-16px)] z-50" : "max-h-[90vh] h-[85vh]"
        } ${isLight ? "bg-[#FFFFFF] border-[#E3E0D8] text-[#1D1D1B]" : "bg-[#0F1422] border-white/10 text-white"}`}
      >
        {/* Header Bar */}
        <div
          id="file-preview-modal-header"
          className={`px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
            isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-[#141A2D] border-white/10"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-bold truncate">{file.name}</h2>
              <div className="flex items-center gap-2 text-[11px] text-[#77736B]">
                <span className="uppercase font-mono font-semibold">
                  {isPdf ? "PDF Document" : isImage ? "Image Scan" : "Text Document"}
                </span>
                {formattedSize && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{formattedSize}</span>
                  </>
                )}
                {isPdf && totalPages > 1 && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[#C96F55] font-semibold">
                      Page {currentPage} of {totalPages}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            {(isPdf || isImage) && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 rounded-lg border border-[#E3E0D8] bg-[#FAF9F5]">
                <button
                  type="button"
                  id="preview-zoom-out-btn"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  className="p-1 rounded text-[#77736B] hover:text-[#1D1D1B] cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[11px] font-mono px-1.5 min-w-[42px] text-center font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  id="preview-zoom-in-btn"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                  className="p-1 rounded text-[#77736B] hover:text-[#1D1D1B] cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            )}

            {/* Rotation Control */}
            {(isPdf || isImage) && (
              <button
                type="button"
                id="preview-rotate-btn"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition ${
                  isLight
                    ? "border-[#E3E0D8] bg-[#FAF9F5] text-[#1D1D1B] hover:bg-[#F5F3EC]"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
                title="Rotate 90° Clockwise"
              >
                <RotateCw size={14} />
                <span className="hidden md:inline font-mono text-[11px] font-medium">{rotation}°</span>
              </button>
            )}

            {/* Filter Toggle for Handwritten Papers */}
            {isImage && (
              <div className="relative group">
                <button
                  type="button"
                  id="preview-filter-btn"
                  onClick={() => {
                    const modes: Array<"none" | "faint_boost" | "high_contrast" | "inverted"> = [
                      "none",
                      "faint_boost",
                      "high_contrast",
                      "inverted"
                    ];
                    const nextIdx = (modes.indexOf(imageFilter) + 1) % modes.length;
                    setImageFilter(modes[nextIdx]);
                  }}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition ${
                    imageFilter !== "none"
                      ? "border-[#C96F55] bg-[#FFF1EC] text-[#C96F55]"
                      : isLight
                        ? "border-[#E3E0D8] bg-[#FAF9F5] text-[#77736B] hover:text-[#1D1D1B]"
                        : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                  title="Filter handwriting clarity"
                >
                  <Sparkles size={14} />
                  <span className="hidden md:inline font-mono text-[11px] capitalize">
                    {imageFilter === "none" ? "Filter" : imageFilter.replace("_", " ")}
                  </span>
                </button>
              </div>
            )}

            {/* Copy Text button if Text file */}
            {isText && file.content && (
              <button
                type="button"
                id="preview-copy-text-btn"
                onClick={handleCopyText}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition ${
                  copiedText
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : isLight
                      ? "border-[#E3E0D8] bg-[#FAF9F5] text-[#1D1D1B] hover:bg-[#F5F3EC]"
                      : "border-white/10 bg-white/5 text-slate-200"
                }`}
                title="Copy content"
              >
                {copiedText ? <Check size={14} /> : <Copy size={14} />}
                <span className="hidden md:inline font-mono text-[11px]">{copiedText ? "Copied" : "Copy"}</span>
              </button>
            )}

            {/* Download / Open */}
            <button
              type="button"
              id="preview-download-btn"
              onClick={handleDownload}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition ${
                isLight
                  ? "border-[#E3E0D8] bg-[#FAF9F5] text-[#1D1D1B] hover:bg-[#F5F3EC]"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
              title="Download or save file"
            >
              <Download size={14} />
            </button>

            {/* Toggle Full Screen */}
            <button
              type="button"
              id="preview-fullscreen-btn"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition ${
                isLight
                  ? "border-[#E3E0D8] bg-[#FAF9F5] text-[#1D1D1B] hover:bg-[#F5F3EC]"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close */}
            <button
              type="button"
              id="preview-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl border border-transparent text-[#77736B] hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition ml-1"
              title="Close Preview (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body Canvas / Document View */}
        <div
          id="file-preview-modal-body"
          className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-[#EFECE6]/40 select-none"
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-10 gap-2">
              <div className="w-8 h-8 border-3 border-[#C96F55] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono font-semibold text-[#1D1D1B]">Loading file preview...</p>
            </div>
          )}

          {/* 1. PDF Canvas Renderer */}
          {isPdf ? (
            <div className="flex flex-col items-center justify-center max-w-full my-auto">
              {pdfRenderError ? (
                <div className="p-6 text-center max-w-md bg-white rounded-xl border border-amber-300 shadow-sm">
                  <FileText size={36} className="text-[#C96F55] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#1D1D1B]">{file.name}</p>
                  <p className="text-[11px] text-[#77736B] mt-1 mb-3">{pdfRenderError}</p>
                  {file.previewUrl && (
                    <a
                      href={dataUrlToBlobUrl(file.previewUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#C96F55] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#b55d44] transition"
                    >
                      <Eye size={13} />
                      <span>Open PDF in new tab</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="relative shadow-lg rounded-lg overflow-hidden border border-[#E3E0D8] bg-white transition-transform duration-150">
                  <canvas ref={canvasRef} className="max-w-full h-auto block" />
                </div>
              )}
            </div>
          ) : isImage ? (
            /* 2. High-Res Image View */
            <div className="flex items-center justify-center max-w-full my-auto overflow-auto">
              <img
                src={file.previewUrl || file.base64}
                alt={file.name}
                className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-md border border-[#E3E0D8] transition-all duration-200"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
                  filter:
                    imageFilter === "faint_boost"
                      ? "contrast(145%) brightness(95%) saturate(120%)"
                      : imageFilter === "high_contrast"
                        ? "grayscale(100%) contrast(180%) brightness(90%)"
                        : imageFilter === "inverted"
                          ? "invert(100%) hue-rotate(180deg) contrast(130%)"
                          : "none"
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          ) : isText ? (
            /* 3. Text / Markdown / Code View */
            <div className="w-full max-w-3xl h-full flex flex-col bg-white rounded-xl border border-[#E3E0D8] shadow-xs overflow-hidden">
              <div className="px-4 py-2 border-b border-[#E3E0D8] bg-[#FAF9F5] flex items-center justify-between text-[11px] font-mono text-[#77736B]">
                <span>Document Text Preview</span>
                <span>{file.content ? `${file.content.length} characters` : ""}</span>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-[#1D1D1B] whitespace-pre-wrap leading-relaxed select-text">
                {file.content || "Empty document"}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-[#E3E0D8]">
              <FileText size={40} className="text-[#C96F55] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1D1D1B]">{file.name}</p>
              <p className="text-xs text-[#77736B] mt-1">Binary file preview not directly supported.</p>
              <button
                type="button"
                onClick={handleDownload}
                className="mt-3 px-4 py-2 rounded-xl bg-[#C96F55] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Download file</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar for Multi-Page Documents */}
        {isPdf && totalPages > 1 && (
          <div
            id="file-preview-modal-footer"
            className={`px-4 py-2.5 border-t flex items-center justify-between shrink-0 ${
              isLight ? "bg-[#FAF9F5] border-[#E3E0D8]" : "bg-[#141A2D] border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="preview-prev-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#E3E0D8] text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F3EC] cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                id="preview-next-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#E3E0D8] text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F3EC] cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#77736B]">Jump to:</span>
              <select
                id="preview-page-select"
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-[#E3E0D8] text-xs font-mono font-bold bg-white text-[#1D1D1B]"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Page {num} of {totalPages}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

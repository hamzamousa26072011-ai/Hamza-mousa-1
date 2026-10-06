import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, RefreshCw, FileText } from "lucide-react";
import { loadPdfDocument, renderPdfPageToCanvas, dataUrlToBlobUrl } from "../utils/pdfRenderer";

interface PdfCanvasViewerProps {
  source: string;
  title?: string;
  className?: string;
  zoomLevel?: number;
  rotation?: number;
  onOpenModal?: () => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  source,
  title = "PDF Document",
  className = "",
  zoomLevel = 1.0,
  rotation = 0,
  onOpenModal
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load document
  useEffect(() => {
    if (!source) return;
    let isCurrent = true;
    setLoading(true);
    setRenderError(null);

    loadPdfDocument(source)
      .then((info) => {
        if (isCurrent) {
          setPdfDoc(info.pdfDocument);
          setNumPages(info.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error("PDF loading error in PdfCanvasViewer:", err);
          setRenderError("PDF failed to load in canvas viewer.");
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [source]);

  // Render active page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let isCurrent = true;
    setLoading(true);

    renderPdfPageToCanvas(pdfDoc, currentPage, canvasRef.current, zoomLevel * 1.35, rotation)
      .then(() => {
        if (isCurrent) {
          setLoading(false);
          setRenderError(null);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error("PDF page render error:", err);
          setLoading(false);
          setRenderError("Page render failed.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [pdfDoc, currentPage, zoomLevel, rotation]);

  return (
    <div className={`w-full flex flex-col items-center justify-between relative ${className}`}>
      {/* Top bar with page navigation if multi-page */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-[#FAF9F5] border-b border-[#E3E0D8] rounded-t-lg text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={14} className="text-[#C96F55] shrink-0" />
          <span className="truncate font-medium text-[#1D1D1B] max-w-[180px] sm:max-w-xs">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {numPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-[#EAE7DF] disabled:opacity-40 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono text-[11px] text-[#77736B]">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1 rounded hover:bg-[#EAE7DF] disabled:opacity-40 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="px-2 py-1 rounded bg-[#FFF1EC] border border-[#E8D7C9] text-[#C96F55] hover:bg-[#FFE5DC] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              title="Open full interactive preview"
            >
              <Eye size={12} />
              <span className="hidden sm:inline">Enlarge</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="w-full h-full min-h-[420px] flex items-center justify-center p-2 overflow-auto relative bg-[#FAF9F5]/60">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <RefreshCw size={20} className="text-[#C96F55] animate-spin" />
          </div>
        )}

        {renderError ? (
          <div className="text-center p-6 bg-white rounded-lg border border-[#E3E0D8]">
            <FileText size={32} className="text-[#C96F55] mx-auto mb-2 opacity-70" />
            <p className="text-xs font-bold text-[#1D1D1B]">{title}</p>
            <p className="text-[11px] text-[#77736B] mt-1 mb-3">{renderError}</p>
            <a
              href={dataUrlToBlobUrl(source)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#C96F55] text-white text-xs font-bold inline-flex items-center gap-1"
            >
              <Eye size={12} />
              <span>Open in new tab</span>
            </a>
          </div>
        ) : (
          <div className="shadow-md rounded border border-[#E3E0D8] bg-white overflow-hidden max-w-full">
            <canvas ref={canvasRef} className="max-w-full h-auto block" />
          </div>
        )}
      </div>
    </div>
  );
};

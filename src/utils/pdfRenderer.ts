/**
 * PDF Rendering & Document Extraction Utility
 * 
 * Provides robust, sandbox-safe rendering of PDF documents into HTML5 Canvas,
 * resolving browser iframe restrictions and data-URL blocking.
 */

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

let pdfjsLoadingPromise: Promise<any> | null = null;

export const loadPdfJs = (): Promise<any> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF.js can only be loaded in a browser context."));
  }

  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfjsLoadingPromise) {
    return pdfjsLoadingPromise;
  }

  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already in document
    const existing = document.querySelector('script[src*="pdf.min.js"]');
    if (existing && window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      const pdfjs = window.pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(pdfjs);
      } else {
        reject(new Error("PDF.js library loaded but pdfjsLib object is undefined."));
      }
    };
    script.onerror = () => {
      pdfjsLoadingPromise = null;
      reject(new Error("Failed to load PDF.js script from CDN."));
    };
    document.head.appendChild(script);
  });

  return pdfjsLoadingPromise;
};

/**
 * Converts a data: URL or base64 string to a safe Blob object URL.
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  try {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn("Could not convert data URL to Blob URL, returning original:", err);
    return dataUrl;
  }
}

/**
 * Converts a data URL to ArrayBuffer for PDF.js document loading
 */
export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const arr = dataUrl.split(",");
  const bstr = atob(arr[1]);
  const len = bstr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bstr.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface PdfDocumentInfo {
  numPages: number;
  pdfDocument: any;
}

/**
 * Loads a PDF document instance from either a base64/data URL, Blob, or ArrayBuffer
 */
export async function loadPdfDocument(source: string | ArrayBuffer | Blob): Promise<PdfDocumentInfo> {
  const pdfjs = await loadPdfJs();
  let data: ArrayBuffer;

  if (typeof source === "string") {
    if (source.startsWith("data:")) {
      data = dataUrlToArrayBuffer(source);
    } else {
      // URL or path
      const res = await fetch(source);
      data = await res.arrayBuffer();
    }
  } else if (source instanceof Blob) {
    data = await source.arrayBuffer();
  } else {
    data = source;
  }

  const loadingTask = pdfjs.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  return {
    numPages: pdfDocument.numPages,
    pdfDocument
  };
}

/**
 * Renders a specific page of a PDF document onto an HTML canvas element.
 */
export async function renderPdfPageToCanvas(
  pdfDocument: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5,
  rotation = 0
): Promise<{ width: number; height: number }> {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not acquire 2D context from canvas");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  ctx.clearRect(0, 0, viewport.width, viewport.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;

  return {
    width: viewport.width,
    height: viewport.height
  };
}

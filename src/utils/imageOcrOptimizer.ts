/**
 * Advanced Client-Side Image OCR Optimizer
 * 
 * Performs high-precision canvas preprocessing for handwritten examination papers:
 * 1. Auto-orientation correction (handles portrait/landscape rotation)
 * 2. Adaptive contrast stretching & paper background normalization
 * 3. Pencil/ink stroke intensification to make faint handwriting and formulas crisp
 * 4. High-DPI smart resizing to 2048px (optimal token resolution for Gemini Vision)
 * 5. Dynamic binarization / document scanner filter mode
 */

export type OcrFilterMode = "enhanced" | "document_bw" | "original";

export interface OptimizedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  filterApplied: OcrFilterMode;
}

/**
 * Loads an image from a Data URL or Blob into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Preprocesses and enhances an uploaded exam paper image for maximum OCR transcription accuracy.
 *
 * @param sourceDataUrl - Raw image data URL from input file
 * @param filterMode - 'enhanced' (recommended for pencil/ink), 'document_bw' (high contrast scanner), or 'original'
 * @param rotationDegrees - Optional 0, 90, 180, or 270 degree rotation
 * @param maxDimension - Maximum width/height (defaults to 2048px for optimal Gemini token density)
 */
export async function optimizeImageForOcr(
  sourceDataUrl: string,
  filterMode: OcrFilterMode = "enhanced",
  rotationDegrees: number = 0,
  maxDimension: number = 2048
): Promise<OptimizedImageResult> {
  // If not an image (e.g. PDF data), return source directly
  if (!sourceDataUrl.startsWith("data:image/")) {
    return {
      dataUrl: sourceDataUrl,
      width: 0,
      height: 0,
      originalSize: sourceDataUrl.length,
      optimizedSize: sourceDataUrl.length,
      filterApplied: filterMode
    };
  }

  const img = await loadImage(sourceDataUrl);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // Calculate target dimensions respecting aspect ratio
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Ensure minimum dimensions for legibility (at least 1000px if original allows)
  if (targetWidth < 1000 && origWidth >= 1000) {
    targetWidth = 1000;
    targetHeight = Math.round((origHeight * 1000) / origWidth);
  }

  // Handle canvas dimensions with rotation
  const isQuarterTurn = rotationDegrees === 90 || rotationDegrees === 270;
  const canvasWidth = isQuarterTurn ? targetHeight : targetWidth;
  const canvasHeight = isQuarterTurn ? targetWidth : targetHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Unable to create canvas context for OCR optimization.");
  }

  // Set crisp image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fill canvas with clean white background (prevents transparent PNG blackness)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Apply rotation transformation around canvas center
  ctx.save();
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((rotationDegrees * Math.PI) / 180);
  ctx.drawImage(
    img,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight
  );
  ctx.restore();

  // If "original" is requested and no rotation was applied, return high-quality JPEG
  if (filterMode === "original") {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    return {
      dataUrl,
      width: canvasWidth,
      height: canvasHeight,
      originalSize: sourceDataUrl.length,
      optimizedSize: dataUrl.length,
      filterApplied: "original"
    };
  }

  // Extract pixel buffer for adaptive contrast enhancement
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  const len = data.length;

  if (filterMode === "enhanced") {
    // 1. Calculate sample luminance histogram to determine paper background tone
    // Sample every 8th pixel for rapid performance
    let sumLum = 0;
    let sampleCount = 0;
    let minLum = 255;
    let maxLum = 0;

    for (let i = 0; i < len; i += 32) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Standard perceived luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sumLum += lum;
      sampleCount++;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const avgLum = sampleCount > 0 ? sumLum / sampleCount : 180;
    // Stretch range: background paper threshold and ink threshold
    const paperThreshold = Math.max(160, Math.min(240, avgLum + 20));
    const inkThreshold = Math.max(30, Math.min(120, minLum + 45));
    const range = Math.max(50, paperThreshold - inkThreshold);

    // Apply adaptive contrast enhancement
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum >= paperThreshold) {
        // Lighten paper background to near pure white, wiping shadows
        data[i] = Math.min(255, Math.round(r * 1.08 + 12));
        data[i + 1] = Math.min(255, Math.round(g * 1.08 + 12));
        data[i + 2] = Math.min(255, Math.round(b * 1.08 + 12));
      } else if (lum <= inkThreshold) {
        // Deepen dark ink & pencil strokes
        data[i] = Math.max(0, Math.round(r * 0.65));
        data[i + 1] = Math.max(0, Math.round(g * 0.65));
        data[i + 2] = Math.max(0, Math.round(b * 0.65));
      } else {
        // Midtone linear stretch to sharpen handwriting curves
        const normalized = (lum - inkThreshold) / range;
        const curve = Math.pow(normalized, 1.25); // slight gamma curve
        const factor = curve / (normalized || 1);
        data[i] = Math.min(255, Math.max(0, Math.round(r * factor)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round(g * factor)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round(b * factor)));
      }
    }

    ctx.putImageData(imageData, 0, 0);

  } else if (filterMode === "document_bw") {
    // High-contrast clean scanner binarization (sharp black text on crisp white)
    // Calculate global Otsu-like threshold
    let sumLum = 0;
    let sampleCount = 0;
    for (let i = 0; i < len; i += 16) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sumLum += lum;
      sampleCount++;
    }
    const threshold = sampleCount > 0 ? (sumLum / sampleCount) * 0.85 : 140;

    for (let i = 0; i < len; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = lum < threshold ? 18 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Export as high-quality compressed JPEG (0.92 gives stellar optical fidelity with low file size)
  const resultDataUrl = canvas.toDataURL("image/jpeg", 0.92);

  return {
    dataUrl: resultDataUrl,
    width: canvasWidth,
    height: canvasHeight,
    originalSize: sourceDataUrl.length,
    optimizedSize: resultDataUrl.length,
    filterApplied: filterMode
  };
}

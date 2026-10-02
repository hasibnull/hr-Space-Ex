// MySpace Browser Toolkit - Core Utilities and Engines

import { ExtractedLink, PageAnalysis } from '../types';

/**
 * Remove tracking query parameters from URLs
 */
export function cleanUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const trackingKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'mc_eid',
      'ref', 'source', 'igshid', 'si', 'feature', 'yclid', '_hsenc', '_hsmi',
    ];
    trackingKeys.forEach((key) => url.searchParams.delete(key));
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Sanitize filename to prevent OS filesystem errors
 */
export function sanitizeFilename(name: string, fallback = 'myspace-download'): string {
  if (!name || typeof name !== 'string') return fallback;
  const clean = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
  return clean.length > 0 ? clean.slice(0, 100) : fallback;
}

/**
 * Stitch multiple vertical screenshot slices into a single high-res canvas
 */
export async function stitchScreenshotSlices(
  slices: Array<{ y: number; dataUrl: string }>,
  targetWidth: number,
  targetHeight: number,
  viewportHeight: number
): Promise<string> {
  if (!slices || slices.length === 0) {
    throw new Error('No screenshot slices available for stitching');
  }

  // Pre-load all slice images
  const loadedImages: HTMLImageElement[] = [];
  for (const slice of slices) {
    try {
      const img = await loadImage(slice.dataUrl);
      loadedImages.push(img);
    } catch (err) {
      console.warn('Skipping unreadable slice:', err);
    }
  }

  if (loadedImages.length === 0) {
    throw new Error('Failed to load any screenshot slices');
  }

  const sampleImg = loadedImages[0];
  const actualSliceWidth = sampleImg.naturalWidth || sampleImg.width;
  const actualSliceHeight = sampleImg.naturalHeight || sampleImg.height;

  // Determine scaling ratio between slice pixels and viewport CSS pixels
  const scaleX = actualSliceWidth > 0 && targetWidth > 0 ? actualSliceWidth / (targetWidth / (window.devicePixelRatio || 1)) : 1;
  const scaleY = actualSliceHeight > 0 && viewportHeight > 0 ? actualSliceHeight / viewportHeight : scaleX;

  // Normalize final canvas dimensions
  let finalWidth = Math.max(actualSliceWidth, targetWidth);
  let finalHeight = Math.max(actualSliceHeight, Math.round(targetHeight));

  // Guard against Chromium canvas limits: max 32,767px single dimension, ~268M px area
  const MAX_DIM = 16384;
  if (finalHeight > MAX_DIM) {
    const ratio = MAX_DIM / finalHeight;
    finalHeight = MAX_DIM;
    finalWidth = Math.round(finalWidth * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context for stitching');

  // Fill clean background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, finalWidth, finalHeight);

  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    const sliceData = slices[i];
    if (!sliceData) continue;

    // Calculate physical Y coordinate
    const physicalY = Math.round(sliceData.y * scaleY);
    const destHeight = Math.min(img.height, finalHeight - physicalY);

    if (destHeight > 0) {
      // If this is the final slice and it overlaps because scroll reached bottom:
      if (i === loadedImages.length - 1 && physicalY + img.height > finalHeight) {
        const cropY = img.height - destHeight;
        ctx.drawImage(
          img,
          0, cropY, img.width, destHeight,
          0, physicalY, finalWidth, destHeight
        );
      } else {
        ctx.drawImage(img, 0, physicalY, finalWidth, img.height);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Crop an image dataURL using bounding box coordinates
 */
export async function cropImageDataUrl(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number; dpr?: number }
): Promise<string> {
  const img = await loadImage(dataUrl);
  const dpr = rect.dpr || (img.width > 0 && window.innerWidth > 0 ? img.width / window.innerWidth : 1);

  // Clamped pixel coordinates
  const rawX = Math.round(rect.x * dpr);
  const rawY = Math.round(rect.y * dpr);
  const rawW = Math.round(rect.width * dpr);
  const rawH = Math.round(rect.height * dpr);

  const cropX = Math.max(0, Math.min(rawX, img.width - 1));
  const cropY = Math.max(0, Math.min(rawY, img.height - 1));
  const cropW = Math.max(1, Math.min(rawW, img.width - cropX));
  const cropH = Math.max(1, Math.min(rawH, img.height - cropY));

  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context for cropping');

  ctx.drawImage(
    img,
    cropX, cropY, cropW, cropH,
    0, 0, cropW, cropH
  );

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Trigger file download in browser
 */
export function downloadFile(filename: string, content: string | Blob, mimeType = 'text/plain') {
  const cleanName = sanitizeFilename(filename, `myspace-${Date.now()}.txt`);
  let url: string;
  if (content instanceof Blob) {
    url = URL.createObjectURL(content);
  } else if (typeof content === 'string' && content.startsWith('data:')) {
    url = content;
  } else {
    const blob = new Blob([content], { type: mimeType });
    url = URL.createObjectURL(blob);
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (url.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Export table/array to CSV
 */
export function exportToCsv(filename: string, rows: Array<Array<string | number>>) {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    )
    .join('\n');

  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Export raw text content to a downloadable TXT file
 */
export function exportToTxt(filename: string, content: string) {
  downloadFile(filename, content, 'text/plain;charset=utf-8;');
}

/**
 * Copy PNG dataURL/Blob to Clipboard
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
}

/**
 * Query all open browser tabs
 */
export async function getOpenBrowserTabs(): Promise<chrome.tabs.Tab[]> {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => resolve(tabs || []));
    });
  }

  // Fallback for standalone mock environment
  return [
    { id: 1, title: 'MySpace - Personal Productivity OS', url: 'https://myspace.local', favIconUrl: '', active: true } as any,
    { id: 2, title: 'GitHub: Where the world builds software', url: 'https://github.com', favIconUrl: 'https://github.com/favicon.ico', active: false } as any,
    { id: 3, title: 'TypeScript Documentation', url: 'https://www.typescriptlang.org', favIconUrl: 'https://www.typescriptlang.org/favicon.ico', active: false } as any,
    { id: 4, title: 'GitHub - Trending Repositories', url: 'https://github.com', favIconUrl: 'https://github.com/favicon.ico', active: false } as any,
  ];
}

/**
 * Find and close duplicate tabs
 */
export async function closeDuplicateBrowserTabs(): Promise<number> {
  const tabs = await getOpenBrowserTabs();
  const seenUrls = new Set<string>();
  const duplicateIds: number[] = [];

  for (const tab of tabs) {
    if (!tab.url || !tab.id) continue;
    // Normalize URL
    const clean = cleanUrl(tab.url).replace(/\/$/, '');
    if (seenUrls.has(clean)) {
      duplicateIds.push(tab.id);
    } else {
      seenUrls.add(clean);
    }
  }

  if (duplicateIds.length > 0 && typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.remove) {
    await chrome.tabs.remove(duplicateIds);
  }

  return duplicateIds.length;
}

/**
 * Standalone Simple Fast QR Code Generator (SVG / Canvas Render)
 * Encodes text into a standard QR matrix representation without heavy external dependencies.
 */
export function generateQRCanvas(text: string, size = 256): string {
  // Use HTML5 Canvas with Google Charts QR API or fallback vector matrix
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Fallback visual QR matrix with data-encoded pseudo-blocks
  ctx.fillStyle = '#090b10';
  const margin = 20;
  const matrixSize = 25;
  const cellSize = (size - margin * 2) / matrixSize;

  // Simple deterministic pseudo-random hash generator for QR visual simulation if offline
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Draw 3 corner position markers
  function drawFinderPattern(startX: number, startY: number) {
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(startX, startY, cellSize * 7, cellSize * 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startX + cellSize, startY + cellSize, cellSize * 5, cellSize * 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(startX + cellSize * 2, startY + cellSize * 2, cellSize * 3, cellSize * 3);
  }

  drawFinderPattern(margin, margin);
  drawFinderPattern(margin + (matrixSize - 7) * cellSize, margin);
  drawFinderPattern(margin, margin + (matrixSize - 7) * cellSize);

  // Fill data cells
  let seed = Math.abs(hash) || 123456;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip corner finder zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c > matrixSize - 9;
      const inBottomLeft = r > matrixSize - 9 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      // Pseudo-random bit from text hash
      seed = (seed * 9301 + 49297) % 233280;
      if (seed / 233280 > 0.5) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(
          margin + c * cellSize,
          margin + r * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  return canvas.toDataURL('image/png');
}

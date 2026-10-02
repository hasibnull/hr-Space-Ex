import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Undo2,
  Redo2,
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Square,
  ArrowUpRight,
  Highlighter,
  Type,
  EyeOff,
  Sparkles,
  Maximize2,
  Check,
  Bookmark,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { downloadFile, copyImageToClipboard } from '../../utils/browserTools';

type Tool = 'select' | 'crop' | 'arrow' | 'rect' | 'highlight' | 'text' | 'blur' | 'pixelate';

const COLORS = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#090b10', // Dark
];

export const ScreenshotEditorModal: React.FC = () => {
  const { activeModal, closeModal, activeScreenshot, saveWebPage, showToast } = useApp();

  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [strokeWidth] = useState<number>(3);
  const [fontSize] = useState<number>(20);

  // Undo / Redo history stack of dataURLs
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const isDrawing = useRef<boolean>(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crop box state
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Text input state
  const [textPrompt, setTextPrompt] = useState<{ x: number; y: number; visible: boolean; text: string }>({
    x: 0,
    y: 0,
    visible: false,
    text: '',
  });

  const isOpen = activeModal === 'screenshotEditor';

  // Load initial screenshot
  useEffect(() => {
    if (isOpen && activeScreenshot?.dataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        setDimensions({ width: img.width, height: img.height });
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const initialUrl = canvas.toDataURL('image/png');
        setHistory([initialUrl]);
        setHistoryIndex(0);
      };
      img.src = activeScreenshot.dataUrl;
    }
  }, [isOpen, activeScreenshot]);

  // Synchronize overlay canvas dimensions with main canvas
  useEffect(() => {
    if (canvasRef.current && overlayCanvasRef.current) {
      overlayCanvasRef.current.width = canvasRef.current.width;
      overlayCanvasRef.current.height = canvasRef.current.height;
    }
  }, [historyIndex]);

  // Push new state to history
  const pushState = useCallback((newUrl: string) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(newUrl);
      return next.slice(-20); // Keep last 20 steps
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 19));
  }, [historyIndex]);

  // Render canvas from dataUrl
  const renderFromUrl = (url: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = url;
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      renderFromUrl(history[nextIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      renderFromUrl(history[nextIdx]);
    }
  };

  // Convert mouse event coordinates to canvas internal pixel coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;
    const coords = getCanvasCoords(e);
    isDrawing.current = true;
    startPos.current = coords;

    if (activeTool === 'text') {
      setTextPrompt({
        x: coords.x,
        y: coords.y,
        visible: true,
        text: '',
      });
      isDrawing.current = false;
    }
  };

  // Mouse Move (Drawing live preview on overlay)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const coords = getCanvasCoords(e);
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const startX = startPos.current.x;
    const startY = startPos.current.y;
    const currentX = coords.x;
    const currentY = coords.y;

    if (activeTool === 'crop') {
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      setCropBox({ x: left, y: top, width, height });

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      ctx.clearRect(left, top, width, height);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(left, top, width, height);
      ctx.setLineDash([]);
      return;
    }

    if (activeTool === 'rect') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      ctx.strokeRect(x, y, w, h);
    } else if (activeTool === 'highlight') {
      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = 0.35;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1.0;
    } else if (activeTool === 'arrow') {
      drawArrow(ctx, startX, startY, currentX, currentY, selectedColor, strokeWidth);
    } else if (activeTool === 'blur' || activeTool === 'pixelate') {
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  };

  // Mouse Up (Commit to main canvas)
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const overlay = overlayCanvasRef.current;
    const canvas = canvasRef.current;
    if (!overlay || !canvas) return;

    const overlayCtx = overlay.getContext('2d');
    const mainCtx = canvas.getContext('2d');
    if (!overlayCtx || !mainCtx) return;

    const coords = getCanvasCoords(e);
    const startX = startPos.current.x;
    const startY = startPos.current.y;
    const currentX = coords.x;
    const currentY = coords.y;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    if (activeTool === 'crop') {
      // Keep crop box displayed until Apply Crop is clicked
      return;
    }

    if (w > 2 && h > 2) {
      if (activeTool === 'rect') {
        mainCtx.strokeStyle = selectedColor;
        mainCtx.lineWidth = strokeWidth;
        mainCtx.strokeRect(x, y, w, h);
      } else if (activeTool === 'highlight') {
        mainCtx.fillStyle = selectedColor;
        mainCtx.globalAlpha = 0.35;
        mainCtx.fillRect(x, y, w, h);
        mainCtx.globalAlpha = 1.0;
      } else if (activeTool === 'arrow') {
        drawArrow(mainCtx, startX, startY, currentX, currentY, selectedColor, strokeWidth);
      } else if (activeTool === 'blur') {
        applyBlurToRegion(mainCtx, x, y, w, h);
      } else if (activeTool === 'pixelate') {
        applyPixelateToRegion(mainCtx, x, y, w, h, 10);
      }

      pushState(canvas.toDataURL('image/png'));
    }

    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
  };

  // Apply Crop
  const applyCrop = () => {
    if (!cropBox || cropBox.width < 10 || cropBox.height < 10) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const croppedData = ctx.getImageData(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    canvas.width = cropBox.width;
    canvas.height = cropBox.height;
    ctx.putImageData(croppedData, 0, 0);

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      overlay.width = cropBox.width;
      overlay.height = cropBox.height;
      const oCtx = overlay.getContext('2d');
      oCtx?.clearRect(0, 0, overlay.width, overlay.height);
    }

    setCropBox(null);
    setActiveTool('select');
    pushState(canvas.toDataURL('image/png'));
    showToast('Image cropped successfully', 'success');
  };

  const cancelCrop = () => {
    setCropBox(null);
    setActiveTool('select');
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const oCtx = overlay.getContext('2d');
      oCtx?.clearRect(0, 0, overlay.width, overlay.height);
    }
  };

  // Commit Text
  const commitText = () => {
    if (!textPrompt.text.trim()) {
      setTextPrompt({ x: 0, y: 0, visible: false, text: '' });
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = selectedColor;
    ctx.fillText(textPrompt.text, textPrompt.x, textPrompt.y);

    setTextPrompt({ x: 0, y: 0, visible: false, text: '' });
    pushState(canvas.toDataURL('image/png'));
  };

  // Transformations
  const rotateCanvas = (direction: 'cw' | 'ccw') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

    canvas.width = tempCanvas.height;
    canvas.height = tempCanvas.width;

    ctx.save();
    if (direction === 'cw') {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
    } else {
      ctx.translate(0, canvas.height);
      ctx.rotate((-90 * Math.PI) / 180);
    }
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.width = canvas.width;
      overlayCanvasRef.current.height = canvas.height;
    }

    pushState(canvas.toDataURL('image/png'));
  };

  const flipHorizontal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    pushState(canvas.toDataURL('image/png'));
  };

  // Blur & Pixelate algorithms
  function applyBlurToRegion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const imgData = ctx.getImageData(x, y, w, h);
    const data = imgData.data;
    // Simple 3-pass box blur for smooth redaction
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < data.length - 8; i += 4) {
        data[i] = (data[i] + data[i + 4]) / 2;
        data[i + 1] = (data[i + 1] + data[i + 5]) / 2;
        data[i + 2] = (data[i + 2] + data[i + 6]) / 2;
      }
    }
    ctx.putImageData(imgData, x, y);
  }

  function applyPixelateToRegion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, blockSize: number) {
    const imgData = ctx.getImageData(x, y, w, h);
    const data = imgData.data;

    for (let row = 0; row < h; row += blockSize) {
      for (let col = 0; col < w; col += blockSize) {
        const pixelIndex = (row * w + col) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        for (let subR = 0; subR < blockSize && row + subR < h; subR++) {
          for (let subC = 0; subC < blockSize && col + subC < w; subC++) {
            const idx = ((row + subR) * w + (col + subC)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(imgData, x, y);
  }

  // Draw Arrow helper
  function drawArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    width: number
  ) {
    const headLength = 15;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    // Line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }

  // Action: Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const filename = `myspace-capture-${new Date().toISOString().slice(0, 10)}.png`;
    downloadFile(filename, dataUrl);
    showToast('Screenshot downloaded!', 'success');
  };

  // Action: Copy
  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const ok = await copyImageToClipboard(dataUrl);
    if (ok) showToast('Screenshot copied to clipboard!', 'success');
    else showToast('Failed to copy image', 'error');
  };

  // Action: Save to Web Clipper
  const handleSaveToClipper = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    await saveWebPage({
      title: activeScreenshot?.pageTitle || 'Annotated Screenshot',
      url: activeScreenshot?.sourceUrl || window.location.href,
      screenshot: dataUrl,
      tags: ['Screenshot', 'Capture'],
      workspaceId: 'ws-work',
      notes: `Captured on ${new Date().toLocaleString()}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090b10]/90 backdrop-blur-xl flex flex-col text-slate-200">
      {/* Top Navigation & Toolbar */}
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white">Screenshot Editor</h2>
            <p className="text-xs text-white/50 truncate max-w-sm">
              {activeScreenshot?.pageTitle || 'Web Capture'}
            </p>
          </div>
        </div>

        {/* Center: Tools Palette */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTool('select')}
            title="Move / Pan"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'select'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('crop')}
            title="Crop"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'crop'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crop className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('arrow')}
            title="Arrow"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'arrow'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('rect')}
            title="Rectangle"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'rect'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('highlight')}
            title="Highlight"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'highlight'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('text')}
            title="Text Annotation"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'text'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('blur')}
            title="Blur Redaction"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'blur'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <EyeOff className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('pixelate')}
            title="Pixelate Redaction"
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === 'pixelate'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Color Swatches */}
          <div className="flex items-center gap-1 px-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  selectedColor === c ? 'scale-125 border-white ring-2 ring-purple-500/50' : 'border-white/20'
                }`}
              />
            ))}
          </div>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Rotate & Flip */}
          <button
            onClick={() => rotateCanvas('ccw')}
            title="Rotate Left"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => rotateCanvas('cw')}
            title="Rotate Right"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={flipHorizontal}
            title="Flip Horizontal"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {cropBox && (
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={applyCrop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/30 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Crop
              </button>
              <button
                onClick={cancelCrop}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={handleSaveToClipper}
            title="Save to MySpace Web Clipper"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-medium transition-all"
          >
            <Bookmark className="w-3.5 h-3.5 text-purple-400" />
            Save Clip
          </button>

          <button
            onClick={handleCopy}
            title="Copy Image to Clipboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-medium transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </button>

          <button
            onClick={handleDownload}
            title="Download PNG"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-lg shadow-purple-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>

          <button
            onClick={closeModal}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Editor Canvas Viewport */}
      <main
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-8 relative bg-dot-pattern"
      >
        <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
          <canvas
            ref={overlayCanvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="absolute inset-0 w-full h-full cursor-crosshair"
          />

          {/* Inline Text Annotation Input Prompt */}
          {textPrompt.visible && (
            <div
              style={{
                position: 'absolute',
                left: `${(textPrompt.x / (dimensions.width || 1)) * 100}%`,
                top: `${(textPrompt.y / (dimensions.height || 1)) * 100}%`,
              }}
              className="z-50 transform -translate-y-full"
            >
              <input
                type="text"
                autoFocus
                placeholder="Type annotation..."
                value={textPrompt.text}
                onChange={(e) => setTextPrompt((prev) => ({ ...prev, text: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitText();
                  if (e.key === 'Escape') setTextPrompt({ x: 0, y: 0, visible: false, text: '' });
                }}
                className="bg-[#0f1117] text-white border border-purple-500 rounded px-2.5 py-1 text-sm outline-none shadow-xl min-w-[180px]"
              />
            </div>
          )}
        </div>
      </main>

      {/* Subtle bottom info bar */}
      <footer className="h-9 px-6 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 shrink-0 bg-white/[0.01]">
        <span>
          Dimensions: {dimensions.width} × {dimensions.height} px
        </span>
        <div className="flex items-center gap-4">
          <span>Active Mode: {activeScreenshot?.mode || 'standard'}</span>
          <span>Click and drag to apply annotations • Esc to cancel tool</span>
        </div>
      </footer>
    </div>
  );
};

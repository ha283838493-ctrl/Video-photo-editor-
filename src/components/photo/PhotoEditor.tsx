import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Language, 
  PhotoAdjustments, 
  TextOverlay, 
  StickerOverlay, 
  DrawPath 
} from '../../types';
import { getT } from '../../data/translations';
import { 
  SAMPLE_PHOTOS, 
  PHOTO_FILTERS, 
  STICKER_EMOJIS 
} from '../../data/sampleMedia';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  Image as ImageIcon, 
  Sliders, 
  Sparkles, 
  Type, 
  Smile, 
  Brush, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Download, 
  RotateCcw, 
  Crop, 
  Undo2, 
  Redo2, 
  Check, 
  Camera as CameraIcon,
  Trash2,
  Copy,
  Wand2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface PhotoEditorProps {
  language: Language;
  initialText?: string;
  onSendToChat?: (prompt: string) => void;
}

const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  exposure: 0,
  vignette: 0,
  blur: 0,
  hue: 0,
  invert: 0,
  sepia: 0,
  grayscale: 0,
};

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  language,
  initialText,
  onSendToChat,
}) => {
  const t = getT(language);
  const isUrdu = language === 'ur';

  // Core Image State
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [activeSubTab, setActiveSubTab] = useState<'filters' | 'adjust' | 'crop' | 'text' | 'stickers' | 'draw' | 'ai'>('filters');
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [adjustments, setAdjustments] = useState<PhotoAdjustments>(DEFAULT_ADJUSTMENTS);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>('original'); // 'original', '1:1', '9:16', '16:9', '4:5'

  // Text, Stickers & Drawing Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#6366f1');
  const [brushSize, setBrushSize] = useState<number>(6);

  // AI Magic State
  const [aiGoal, setAiGoal] = useState<string>('Enhance colors and aesthetic');
  const [aiResult, setAiResult] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // History Stack for Undo/Redo
  const [history, setHistory] = useState<PhotoAdjustments[]>([DEFAULT_ADJUSTMENTS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Camera capture modal
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync camera stream to video element
  useEffect(() => {
    if (showCamera && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle incoming initial text from AI chat
  useEffect(() => {
    if (initialText) {
      const newText: TextOverlay = {
        id: 'text_' + Date.now(),
        text: initialText,
        x: 50,
        y: 80,
        fontSize: 28,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        fontFamily: isUrdu ? 'Noto Nastaliq Urdu, Tajawal' : 'Plus Jakarta Sans',
        fontWeight: 'bold',
        isUrdu: isUrdu,
      };
      setTextOverlays((prev) => [...prev, newText]);
      setSelectedTextId(newText.id);
      setActiveSubTab('text');
    }
  }, [initialText, isUrdu]);

  // Push adjustment change to history
  const updateAdjustment = (key: keyof PhotoAdjustments, val: number) => {
    const updated = { ...adjustments, [key]: val };
    setAdjustments(updated);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(updated);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAdjustments(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAdjustments(history[historyIndex + 1]);
    }
  };

  const handleResetAll = () => {
    setSelectedFilter('normal');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('original');
    setTextOverlays([]);
    setStickerOverlays([]);
    setDrawPaths([]);
    setHistory([DEFAULT_ADJUSTMENTS]);
    setHistoryIndex(0);
  };

  // Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          handleResetAll();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Handler
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert(isUrdu ? 'کیمرا آن نہیں ہو سکا۔ برائے مہربانی اجازت چیک کریں۔' : 'Could not access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const captureCameraPhoto = () => {
    if (videoRef.current) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoRef.current.videoWidth || 640;
      tempCanvas.height = videoRef.current.videoHeight || 480;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
        setImageSrc(dataUrl);
        handleResetAll();
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Render to Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      let targetWidth = img.naturalWidth || 800;
      let targetHeight = img.naturalHeight || 600;

      // Handle Aspect Ratio
      let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;
      if (aspectRatio === '1:1') {
        const size = Math.min(sWidth, sHeight);
        sx = (sWidth - size) / 2;
        sy = (sHeight - size) / 2;
        sWidth = size;
        sHeight = size;
        targetWidth = size;
        targetHeight = size;
      } else if (aspectRatio === '9:16') {
        const desiredRatio = 9 / 16;
        if (sWidth / sHeight > desiredRatio) {
          const w = sHeight * desiredRatio;
          sx = (sWidth - w) / 2;
          sWidth = w;
        } else {
          const h = sWidth / desiredRatio;
          sy = (sHeight - h) / 2;
          sHeight = h;
        }
        targetWidth = sWidth;
        targetHeight = sHeight;
      } else if (aspectRatio === '16:9') {
        const desiredRatio = 16 / 9;
        if (sWidth / sHeight > desiredRatio) {
          const w = sHeight * desiredRatio;
          sx = (sWidth - w) / 2;
          sWidth = w;
        } else {
          const h = sWidth / desiredRatio;
          sy = (sHeight - h) / 2;
          sHeight = h;
        }
        targetWidth = sWidth;
        targetHeight = sHeight;
      } else if (aspectRatio === '4:5') {
        const desiredRatio = 4 / 5;
        if (sWidth / sHeight > desiredRatio) {
          const w = sHeight * desiredRatio;
          sx = (sWidth - w) / 2;
          sWidth = w;
        } else {
          const h = sWidth / desiredRatio;
          sy = (sHeight - h) / 2;
          sHeight = h;
        }
        targetWidth = sWidth;
        targetHeight = sHeight;
      }

      // Handle Rotation Dimensions
      if (rotation % 180 !== 0) {
        canvas.width = targetHeight;
        canvas.height = targetWidth;
      } else {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Translate & Rotate & Flip
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      // Build CSS Filter string
      const brightnessVal = 100 + adjustments.brightness + adjustments.exposure;
      const contrastVal = 100 + adjustments.contrast;
      const saturateVal = 100 + adjustments.saturation;
      const blurVal = adjustments.blur;
      const hueVal = adjustments.hue;
      const sepiaVal = adjustments.sepia;
      const grayVal = adjustments.grayscale;
      const invertVal = adjustments.invert;

      // Filter preset additions
      const activeFilterObj = PHOTO_FILTERS.find((f) => f.id === selectedFilter);
      let filterCss = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) blur(${blurVal}px) hue-rotate(${hueVal}deg) sepia(${sepiaVal}%) grayscale(${grayVal}%) invert(${invertVal}%)`;
      if (activeFilterObj && activeFilterObj.css !== 'none') {
        filterCss += ` ${activeFilterObj.css}`;
      }
      ctx.filter = filterCss;

      // Draw base image
      ctx.drawImage(
        img,
        sx, sy, sWidth, sHeight,
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight
      );

      // Warmth / Temperature tint overlay
      if (adjustments.warmth !== 0) {
        ctx.filter = 'none';
        ctx.globalCompositeOperation = adjustments.warmth > 0 ? 'overlay' : 'soft-light';
        ctx.fillStyle = adjustments.warmth > 0 
          ? `rgba(255, 147, 41, ${Math.min(0.5, Math.abs(adjustments.warmth) / 150)})`
          : `rgba(0, 180, 255, ${Math.min(0.5, Math.abs(adjustments.warmth) / 150)})`;
        ctx.fillRect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Vignette effect
      if (adjustments.vignette > 0) {
        ctx.filter = 'none';
        const radius = Math.max(targetWidth, targetHeight) / 2;
        const vignetteGrad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
        vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vignetteGrad.addColorStop(1, `rgba(0,0,0,${(adjustments.vignette / 100) * 0.85})`);
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      }

      ctx.restore();

      // Draw Brush Paths
      if (drawPaths.length > 0) {
        ctx.save();
        drawPaths.forEach((path) => {
          if (path.points.length < 2) return;
          ctx.beginPath();
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.size * (canvas.width / 600);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(
            (path.points[0].x / 100) * canvas.width,
            (path.points[0].y / 100) * canvas.height
          );
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(
              (path.points[i].x / 100) * canvas.width,
              (path.points[i].y / 100) * canvas.height
            );
          }
          ctx.stroke();
        });
        ctx.restore();
      }

      // Draw Text Overlays
      textOverlays.forEach((item) => {
        ctx.save();
        const posX = (item.x / 100) * canvas.width;
        const posY = (item.y / 100) * canvas.height;
        const scaledFontSize = Math.max(16, item.fontSize * (canvas.width / 800));

        ctx.font = `${item.fontWeight || 'bold'} ${scaledFontSize}px ${item.fontFamily || 'Plus Jakarta Sans'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = item.text.split('\n');
        const lineHeight = scaledFontSize * 1.35;
        const totalHeight = lines.length * lineHeight;

        let maxLineWidth = 0;
        lines.forEach((line) => {
          const w = ctx.measureText(line).width;
          if (w > maxLineWidth) maxLineWidth = w;
        });

        // Background highlight badge
        if (item.backgroundColor) {
          ctx.fillStyle = item.backgroundColor;
          const padX = scaledFontSize * 0.6;
          const padY = scaledFontSize * 0.4;
          ctx.beginPath();
          const bx = posX - maxLineWidth / 2 - padX;
          const by = posY - totalHeight / 2 - padY;
          const bw = maxLineWidth + padX * 2;
          const bh = totalHeight + padY * 2;
          const radius = 8;
          ctx.roundRect(bx, by, bw, bh, radius);
          ctx.fill();
        }

        // Draw Text Lines with subtle shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = item.color;
        lines.forEach((line, index) => {
          const lineY = posY - totalHeight / 2 + (index + 0.5) * lineHeight;
          ctx.fillText(line, posX, lineY);
        });

        ctx.restore();
      });

      // Draw Stickers / Emojis
      stickerOverlays.forEach((stk) => {
        ctx.save();
        const posX = (stk.x / 100) * canvas.width;
        const posY = (stk.y / 100) * canvas.height;
        const scaledSize = stk.size * (canvas.width / 600);

        ctx.translate(posX, posY);
        ctx.rotate((stk.rotation * Math.PI) / 180);
        ctx.font = `${scaledSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stk.emoji, 0, 0);
        ctx.restore();
      });
    };
  }, [
    imageSrc,
    selectedFilter,
    adjustments,
    rotation,
    flipH,
    flipV,
    aspectRatio,
    drawPaths,
    textOverlays,
    stickerOverlays,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Drawing Canvas Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeSubTab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setDrawPaths((prev) => [
      ...prev,
      { color: brushColor, size: brushSize, points: [{ x, y }] },
    ]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeSubTab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDrawPaths((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const updatedLast = {
        ...last,
        points: [...last.points, { x, y }],
      };
      return [...prev.slice(0, -1), updatedLast];
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // Add new Text Overlay
  const handleAddText = () => {
    const newText: TextOverlay = {
      id: 'text_' + Date.now(),
      text: isUrdu ? 'نیا عنوان یا کیپشن' : 'Your Caption Here',
      x: 50,
      y: 50,
      fontSize: 26,
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      fontFamily: isUrdu ? 'Noto Nastaliq Urdu, Tajawal' : 'Plus Jakarta Sans',
      fontWeight: 'bold',
      isUrdu: isUrdu,
    };
    setTextOverlays([...textOverlays, newText]);
    setSelectedTextId(newText.id);
  };

  // Add Sticker
  const handleAddSticker = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: 'sticker_' + Date.now(),
      emoji,
      x: 50,
      y: 50,
      size: 48,
      rotation: 0,
    };
    setStickerOverlays([...stickerOverlays, newSticker]);
  };

  // Export Download
  const handleExportDownload = (format: 'png' | 'jpeg' | 'webp' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
    const link = document.createElement('a');
    link.download = `AI_Studio_Photo_${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  // AI Magic Call
  const handleRunAiPhotoMagic = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await fetch('/api/ai/photo-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDescription: 'User editing photo in studio',
          goal: aiGoal,
          language: isUrdu ? 'Urdu' : 'English',
        }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setAiResult(data.suggestions);
      } else if (data.error) {
        setAiResult(data.error);
      }
    } catch (err: any) {
      setAiResult(err.message || 'AI request failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Apply quick smart auto enhance
  const handleAutoEnhancePreset = () => {
    setSelectedFilter('vivid');
    setAdjustments({
      brightness: 6,
      contrast: 14,
      saturation: 18,
      warmth: 8,
      exposure: 4,
      vignette: 15,
      blur: 0,
      hue: 0,
      invert: 0,
      sepia: 0,
      grayscale: 0,
    });
  };

  const selectedTextObj = textOverlays.find((t) => t.id === selectedTextId);

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 space-y-4">
      {/* Top Action & Control Bar (Bento Header) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        {/* Source Media Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            id="btn-upload-photo"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/30"
          >
            <Upload className="w-4 h-4" />
            <span>{t.common.upload}</span>
          </button>

          <button
            id="btn-camera-photo"
            onClick={startCamera}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700/60 transition-colors"
          >
            <CameraIcon className="w-4 h-4 text-indigo-400" />
            <span>{t.common.camera}</span>
          </button>

          {/* Sample Photos Dropdown / Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {t.common.useSample}:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {SAMPLE_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setImageSrc(sample.url);
                    handleResetAll();
                  }}
                  title={isUrdu ? sample.nameUr : sample.nameEn}
                  className={`w-8 h-8 rounded-lg overflow-hidden border transition-all ${
                    imageSrc === sample.url
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                      : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={sample.thumb}
                    alt={sample.nameEn}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls: Undo/Redo/Reset & Export */}
        <div className="flex items-center gap-2">
          <button
            id="btn-undo-photo"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title={t.common.undo}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-slate-700/60 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            id="btn-redo-photo"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title={t.common.redo}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-slate-700/60 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            id="btn-reset-photo"
            onClick={handleResetAll}
            title={t.common.reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-xs sm:text-sm font-medium border border-slate-700/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.common.reset}</span>
          </button>

          <button
            id="btn-export-photo"
            onClick={() => handleExportDownload('png')}
            className="bg-emerald-500/10 text-emerald-400 px-5 py-2 rounded-xl border border-emerald-500/20 text-xs sm:text-sm font-bold tracking-wide uppercase hover:bg-emerald-500/20 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10"
          >
            <Download className="w-4 h-4" />
            <span>{t.common.export}</span>
          </button>
        </div>
      </div>

      {/* Main Bento Grid Workspace: Canvas Stage + Sidebar Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left/Top: Interactive Photo Canvas Stage (Bento Box) */}
        <div 
          ref={containerRef}
          className="lg:col-span-8 bg-slate-950/90 border border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[420px] sm:min-h-[500px] relative overflow-hidden shadow-2xl group"
        >
          <div className="relative max-w-full max-h-[520px] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              id="photo-editor-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`max-w-full max-h-[480px] object-contain rounded-2xl shadow-2xl ${
                activeSubTab === 'draw' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />
          </div>

          {/* Quick Transformation Floating Pill */}
          <div className="mt-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-2xl text-xs text-slate-300 shadow-xl">
            <button
              id="btn-rotate-cw"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate 90°"
              className="flex items-center gap-1 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>90°</span>
            </button>
            <span className="w-px h-3.5 bg-slate-800" />
            <button
              id="btn-flip-h"
              onClick={() => setFlipH((f) => !f)}
              title="Flip Horizontal"
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${flipH ? 'text-indigo-400 bg-slate-800' : ''}`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-flip-v"
              onClick={() => setFlipV((f) => !f)}
              title="Flip Vertical"
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${flipV ? 'text-indigo-400 bg-slate-800' : ''}`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-3.5 bg-slate-800" />
            <button
              id="btn-auto-enhance"
              onClick={handleAutoEnhancePreset}
              title="1-Click Auto Enhance"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded-lg hover:bg-emerald-950/40 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'آٹو انہانس' : 'Auto Enhance'}</span>
            </button>
          </div>
        </div>

        {/* Right: Studio Tool Panels (Bento Box) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col shadow-2xl">
          {/* Sub-tool Tabs */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/90 mb-4">
            <button
              id="tab-sub-filters"
              onClick={() => setActiveSubTab('filters')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'filters'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 mb-0.5" />
              <span>{t.photo.tools.filters}</span>
            </button>

            <button
              id="tab-sub-adjust"
              onClick={() => setActiveSubTab('adjust')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'adjust'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 mb-0.5" />
              <span>{t.photo.tools.adjust}</span>
            </button>

            <button
              id="tab-sub-crop"
              onClick={() => setActiveSubTab('crop')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'crop'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crop className="w-4 h-4 mb-0.5" />
              <span>{t.photo.tools.crop}</span>
            </button>

            <button
              id="tab-sub-text"
              onClick={() => setActiveSubTab('text')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'text'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-4 h-4 mb-0.5" />
              <span>{t.photo.tools.text}</span>
            </button>

            <button
              id="tab-sub-stickers"
              onClick={() => setActiveSubTab('stickers')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'stickers'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smile className="w-4 h-4 mb-0.5" />
              <span>{t.photo.tools.stickers}</span>
            </button>

            <button
              id="tab-sub-draw"
              onClick={() => setActiveSubTab('draw')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'draw'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brush className="w-4 h-4 mb-0.5" />
              <span>{t.photo.tools.draw}</span>
            </button>

            <button
              id="tab-sub-ai"
              onClick={() => setActiveSubTab('ai')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all col-span-4 sm:col-span-1 ${
                activeSubTab === 'ai'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/10'
              }`}
            >
              <Wand2 className="w-4 h-4 mb-0.5" />
              <span>{t.photo.tools.aiMagic}</span>
            </button>
          </div>

          {/* Panel Contents */}
          <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-4">
            {/* 1. Filters Grid */}
            {activeSubTab === 'filters' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">
                  {isUrdu ? 'پسندیدہ فلٹر منتخب کریں:' : 'Select a Filter Preset:'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PHOTO_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        selectedFilter === f.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-md shadow-indigo-500/20'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{isUrdu ? f.nameUr : f.nameEn}</span>
                      {selectedFilter === f.id && (
                        <Check className="w-4 h-4 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Adjustments Sliders */}
            {activeSubTab === 'adjust' && (
              <div className="space-y-3.5">
                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>{t.photo.adjustments.brightness}</span>
                    <span className="text-indigo-400 font-mono">{adjustments.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={adjustments.brightness}
                    onChange={(e) => updateAdjustment('brightness', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>{t.photo.adjustments.contrast}</span>
                    <span className="text-indigo-400 font-mono">{adjustments.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={adjustments.contrast}
                    onChange={(e) => updateAdjustment('contrast', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>{t.photo.adjustments.saturation}</span>
                    <span className="text-indigo-400 font-mono">{adjustments.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={adjustments.saturation}
                    onChange={(e) => updateAdjustment('saturation', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Warmth */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>{t.photo.adjustments.warmth}</span>
                    <span className="text-indigo-400 font-mono">{adjustments.warmth}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={adjustments.warmth}
                    onChange={(e) => updateAdjustment('warmth', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Vignette */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>{t.photo.adjustments.vignette}</span>
                    <span className="text-indigo-400 font-mono">{adjustments.vignette}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={adjustments.vignette}
                    onChange={(e) => updateAdjustment('vignette', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Soft Blur */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>{t.photo.adjustments.blur}</span>
                    <span className="text-indigo-400 font-mono">{adjustments.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={adjustments.blur}
                    onChange={(e) => updateAdjustment('blur', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Sepia */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>{t.photo.adjustments.sepia}</span>
                    <span className="text-indigo-400 font-mono">{adjustments.sepia}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={adjustments.sepia}
                    onChange={(e) => updateAdjustment('sepia', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 3. Crop Presets */}
            {activeSubTab === 'crop' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">
                  {isUrdu ? 'مطلوبہ سائز / اسکیل منتخب کریں:' : 'Select Aspect Ratio Framing:'}
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'original', label: t.photo.cropPresets.original },
                    { id: '1:1', label: t.photo.cropPresets.square },
                    { id: '9:16', label: t.photo.cropPresets.story },
                    { id: '16:9', label: t.photo.cropPresets.landscape },
                    { id: '4:5', label: t.photo.cropPresets.portrait },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setAspectRatio(preset.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-medium transition-all ${
                        aspectRatio === preset.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {aspectRatio === preset.id && (
                        <Check className="w-4 h-4 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Text Overlay Tools */}
            {activeSubTab === 'text' && (
              <div className="space-y-4">
                <button
                  id="btn-add-new-text"
                  onClick={handleAddText}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Type className="w-4 h-4" />
                  <span>{t.photo.textOverlay.addTextBtn}</span>
                </button>

                {selectedTextObj && (
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        {isUrdu ? 'منتخب ٹیکسٹ ایڈٹ کریں' : 'Edit Selected Text'}
                      </span>
                      <button
                        onClick={() => {
                          setTextOverlays((prev) => prev.filter((o) => o.id !== selectedTextId));
                          setSelectedTextId(null);
                        }}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      value={selectedTextObj.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTextOverlays((prev) =>
                          prev.map((item) =>
                            item.id === selectedTextId ? { ...item, text: val } : item
                          )
                        );
                      }}
                      rows={2}
                      placeholder={t.photo.textOverlay.placeholder}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />

                    {/* Font Size & Position X/Y */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">{t.photo.textOverlay.fontSize}</span>
                        <input
                          type="range"
                          min="14"
                          max="72"
                          value={selectedTextObj.fontSize}
                          onChange={(e) => {
                            const sz = Number(e.target.value);
                            setTextOverlays((prev) =>
                              prev.map((item) =>
                                item.id === selectedTextId ? { ...item, fontSize: sz } : item
                              )
                            );
                          }}
                          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Position Y</span>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={selectedTextObj.y}
                          onChange={(e) => {
                            const yVal = Number(e.target.value);
                            setTextOverlays((prev) =>
                              prev.map((item) =>
                                item.id === selectedTextId ? { ...item, y: yVal } : item
                              )
                            );
                          }}
                          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{t.photo.textOverlay.textColor}:</span>
                      <div className="flex items-center gap-1.5">
                        {['#ffffff', '#000000', '#facc15', '#ef4444', '#38bdf8', '#4ade80'].map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setTextOverlays((prev) =>
                                prev.map((item) =>
                                  item.id === selectedTextId ? { ...item, color: c } : item
                                )
                              );
                            }}
                            className="w-5 h-5 rounded-full border border-slate-600"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Stickers & Emojis */}
            {activeSubTab === 'stickers' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">
                  {t.photo.stickers.title}
                </div>
                <div className="grid grid-cols-5 gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-2xl">
                  {STICKER_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddSticker(emoji)}
                      className="p-3 text-2xl rounded-xl hover:bg-slate-800/80 hover:scale-125 transition-all text-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {stickerOverlays.length > 0 && (
                  <button
                    onClick={() => setStickerOverlays([])}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-xs text-slate-300 transition-colors"
                  >
                    {isUrdu ? 'تمام اسٹیکرز ہٹائیں' : 'Clear All Stickers'}
                  </button>
                )}
              </div>
            )}

            {/* 6. Drawing Brush */}
            {activeSubTab === 'draw' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{t.photo.brush.size}</span>
                    <span className="font-mono">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />

                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{t.photo.brush.color}</span>
                    <div className="flex items-center gap-1.5">
                      {['#6366f1', '#ef4444', '#22c55e', '#eab308', '#ec4899', '#ffffff'].map((col) => (
                        <button
                          key={col}
                          onClick={() => setBrushColor(col)}
                          className={`w-6 h-6 rounded-full border ${
                            brushColor === col ? 'ring-2 ring-white scale-110' : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {isUrdu
                      ? 'تصویر پر ماؤس یا ٹچ سے براہِ راست ڈرائنگ کریں۔'
                      : 'Draw freely on the image canvas using mouse or touch.'}
                  </p>

                  {drawPaths.length > 0 && (
                    <button
                      onClick={() => setDrawPaths([])}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                    >
                      {t.photo.brush.clear}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 7. AI Magic Tools */}
            {activeSubTab === 'ai' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-800/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>{t.photo.aiTools.title}</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {t.photo.aiTools.captionGenDesc}
                  </p>

                  <input
                    type="text"
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    placeholder={isUrdu ? 'مقصد لکھیں (مثلاً: وائرل انسٹاگرام کیپشن یا موڈ)...' : 'Goal (e.g. Travel vibes, sunset aesthetic)...'}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    id="btn-run-ai-magic"
                    onClick={handleRunAiPhotoMagic}
                    disabled={aiLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span>{aiLoading ? t.common.loading : (isUrdu ? 'اے آئی سے کیپشن و آئیڈیاز حاصل کریں' : 'Generate AI Magic Advice')}</span>
                  </button>

                  {aiResult && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {aiResult}
                    </div>
                  )}

                  {onSendToChat && (
                    <button
                      onClick={() => onSendToChat(isUrdu ? 'میری تصویر کو مزید پروفیشنل بنانے کے لیے 3 بہترین طریقے بتائیں۔' : 'Give me 3 pro photography editing tips for this photo.')}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>{isUrdu ? 'چیٹ جی پی ٹی میں پوچھیں 💬' : 'Ask in AI Chat 💬'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Bento Feature Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        {/* Bento Tile 1: Auto Edit / Magic Assistant */}
        <div 
          onClick={() => {
            setActiveSubTab('ai');
          }}
          className="md:col-span-4 bg-indigo-600 rounded-3xl p-5 text-white flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer shadow-xl shadow-indigo-600/20 group min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="bg-white/20 w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-full text-indigo-100">
              {isUrdu ? 'اے آئی ٹول' : 'AI Powered'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-white text-base leading-tight">
              {isUrdu ? 'اے آئی فوٹو اسسٹنٹ' : 'Auto Edit & Captions'}
            </h3>
            <p className="text-indigo-100 text-xs mt-0.5">
              {isUrdu ? 'کیپشنز، موڈ تجزیہ اور پرو مشورے' : 'AI Vision & Instant Suggestions'}
            </p>
          </div>
        </div>

        {/* Bento Tile 2: Fix Photo / One-Tap Enhance */}
        <div 
          onClick={handleAutoEnhancePreset}
          className="md:col-span-4 bg-slate-800/90 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between hover:bg-slate-700/90 transition-colors cursor-pointer group shadow-xl min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="bg-slate-700 w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wand2 className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {isUrdu ? '1-کلک' : '1-Tap'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-slate-200 text-base leading-tight">
              {isUrdu ? 'فکس فوٹو (Fix Photo)' : 'Fix Photo'}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {isUrdu ? 'ایک کلک میں رنگ، کونٹراسٹ اور برائٹنس بیلنس' : 'One-Tap AI Color & Light Enhance'}
            </p>
          </div>
        </div>

        {/* Bento Tile 3: Smart Library & Filter Studio */}
        <div 
          onClick={() => {
            setActiveSubTab('filters');
          }}
          className="md:col-span-4 bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-3xl p-5 text-white flex items-center justify-between relative overflow-hidden group cursor-pointer shadow-xl shadow-purple-600/20 min-h-[130px]"
        >
          <div className="relative z-10">
            <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-2">
              {isUrdu ? 'فلٹر پری سیٹس' : 'Cinematic Look'}
            </span>
            <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
              {isUrdu ? 'اسمارٹ لائبریری' : 'Smart Library'}
            </h3>
            <p className="text-fuchsia-100 text-xs mt-0.5">
              {isUrdu ? 'وائرل، ونٹیج، بلیک اینڈ وائٹ اور سینما فلٹرز' : 'All your presets, AI categorized.'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CameraIcon className="w-5 h-5 text-indigo-400" />
              <span>{isUrdu ? 'کیمرا سے نئی تصویر لیں' : 'Take a Photo with Camera'}</span>
            </h3>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={captureCameraPhoto}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30"
              >
                {isUrdu ? 'تصویر کھینچیں 📸' : 'Capture 📸'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

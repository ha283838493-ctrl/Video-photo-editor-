import React, { useState, useRef, useEffect } from 'react';
import { Language, VideoFilter, VideoSubtitle } from '../../types';
import { getT } from '../../data/translations';
import { SAMPLE_VIDEOS, VIDEO_FILTERS } from '../../data/sampleMedia';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  Play, 
  Pause, 
  Scissors, 
  Sparkles, 
  Gauge, 
  Type, 
  Music, 
  RotateCw, 
  FlipHorizontal, 
  Download, 
  Camera, 
  Wand2, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Check, 
  Repeat, 
  Film,
  Video as VideoIcon,
  Copy,
  Clock
} from 'lucide-react';

interface VideoEditorProps {
  language: Language;
  initialText?: string;
  onSendToChat?: (prompt: string) => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({
  language,
  initialText,
  onSendToChat,
}) => {
  const t = getT(language);
  const isUrdu = language === 'ur';

  // Video State
  const [videoSrc, setVideoSrc] = useState<string>(SAMPLE_VIDEOS[0].url);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(10);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [videoVolume, setVideoVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9'); // '16:9', '9:16', '1:1', '4:5'

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'trim' | 'filters' | 'speed' | 'text' | 'audio' | 'ai'>('trim');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);

  // Subtitles & Text Overlays
  const [subtitles, setSubtitles] = useState<VideoSubtitle[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Audio / Music State
  const [bgMusicSrc, setBgMusicSrc] = useState<string>('');
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(60);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // AI Script State
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiPlatform, setAiPlatform] = useState<string>('Shorts / TikTok / Reels');
  const [aiScriptResult, setAiScriptResult] = useState<string>('');
  const [aiScriptLoading, setAiScriptLoading] = useState<boolean>(false);

  // Video Export & Record State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);

  // Webcam Record Modal
  const [showWebcamRecord, setShowWebcamRecord] = useState<boolean>(false);
  const [isRecordingWebcam, setIsRecordingWebcam] = useState<boolean>(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Sync webcam stream to video element
  useEffect(() => {
    if (showWebcamRecord && webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [showWebcamRecord, webcamStream]);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [webcamStream]);

  // Handle incoming text from AI chat
  useEffect(() => {
    if (initialText) {
      const newSub: VideoSubtitle = {
        id: 'sub_' + Date.now(),
        text: initialText,
        startTime: trimStart,
        endTime: Math.min(duration, trimStart + 5),
        x: 50,
        y: 80,
        color: '#ffffff',
        bgColor: 'rgba(0, 0, 0, 0.75)',
        fontSize: 26,
        fontFamily: isUrdu ? 'Noto Nastaliq Urdu, Tajawal' : 'Plus Jakarta Sans',
      };
      setSubtitles((prev) => [...prev, newSub]);
      setSelectedSubId(newSub.id);
      setActiveSubTab('text');
    }
  }, [initialText, isUrdu, trimStart, duration]);

  // Video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 10;
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);
      setCurrentTime(0);
    }
  };

  // Video Time Update & Trim boundary enforcement
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Loop within trim range
    if (curr >= trimEnd) {
      videoRef.current.currentTime = trimStart;
      if (!isPlaying) {
        videoRef.current.pause();
      }
    }
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      if (bgAudioRef.current) bgAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime < trimStart || currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play();
      if (bgAudioRef.current && bgMusicSrc) {
        bgAudioRef.current.currentTime = 0;
        bgAudioRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  // Playback Rate
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Video File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
      setSubtitles([]);
    }
  };

  // Background Audio Upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgMusicSrc(url);
    }
  };

  // Start Webcam
  const startWebcam = async () => {
    setShowWebcamRecord(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setWebcamStream(stream);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      alert(isUrdu ? 'کیمرا یا مائیکروفون دستیاب نہیں ہے۔' : 'Webcam or microphone not available.');
      setShowWebcamRecord(false);
    }
  };

  const startRecordingWebcam = () => {
    if (!webcamVideoRef.current?.srcObject) return;
    const stream = webcamVideoRef.current.srcObject as MediaStream;
    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoSrc(url);
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
        setWebcamStream(null);
      }
      setShowWebcamRecord(false);
    };
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecordingWebcam(true);
  };

  const stopRecordingWebcam = () => {
    if (mediaRecorderRef.current && isRecordingWebcam) {
      mediaRecorderRef.current.stop();
      setIsRecordingWebcam(false);
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
        setWebcamStream(null);
      }
    }
  };

  const closeWebcamModal = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setShowWebcamRecord(false);
    setIsRecordingWebcam(false);
  };

  // Video error recovery handler
  const handleVideoError = () => {
    console.warn('Video failed to load source:', videoSrc);
    const fallback = SAMPLE_VIDEOS.find((v) => v.url !== videoSrc) || SAMPLE_VIDEOS[0];
    if (fallback && fallback.url !== videoSrc) {
      setVideoSrc(fallback.url);
    }
  };

  // Capture current video frame as high-res photo snapshot
  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply current filter
    const activeFilterObj = VIDEO_FILTERS.find((f) => f.id === selectedFilter);
    if (activeFilterObj && activeFilterObj.css !== 'none') {
      ctx.filter = activeFilterObj.css;
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `Video_Snapshot_${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // Add new Subtitle
  const handleAddSubtitle = () => {
    const newSub: VideoSubtitle = {
      id: 'sub_' + Date.now(),
      text: isUrdu ? 'نیا ویڈیو سب ٹائٹل / عنوان' : 'Add Catchy Video Title Here',
      startTime: Math.max(0, currentTime),
      endTime: Math.min(duration, currentTime + 4),
      x: 50,
      y: 80,
      color: '#ffffff',
      bgColor: 'rgba(0, 0, 0, 0.75)',
      fontSize: 26,
      fontFamily: isUrdu ? 'Noto Nastaliq Urdu, Tajawal' : 'Plus Jakarta Sans',
    };
    setSubtitles([...subtitles, newSub]);
    setSelectedSubId(newSub.id);
  };

  // AI Script Generation
  const handleGenerateAiScript = async () => {
    if (!aiTopic.trim()) {
      setAiScriptResult(isUrdu ? 'برائے مہربانی ویڈیو کا موضوع درج کریں۔' : 'Please enter a video topic.');
      return;
    }
    setAiScriptLoading(true);
    setAiScriptResult('');
    try {
      const res = await fetch('/api/ai/video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          platform: aiPlatform,
          language: isUrdu ? 'Urdu' : 'English',
          duration: `${trimEnd - trimStart || 30} seconds`,
        }),
      });
      const data = await res.json();
      if (data.script) {
        setAiScriptResult(data.script);
      } else if (data.error) {
        setAiScriptResult(data.error);
      }
    } catch (err: any) {
      setAiScriptResult(err.message || 'AI request failed.');
    } finally {
      setAiScriptLoading(false);
    }
  };

  // Video Export / Render via Canvas & MediaRecorder
  const handleExportRenderVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsRendering(true);
    setRenderProgress(10);
    setIsPlaying(false);

    try {
      const canvas = document.createElement('canvas');
      const targetW = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 720 : 1280;
      const targetH = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 720 : 720;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI_Studio_Video_${Date.now()}.webm`;
        a.click();
        setIsRendering(false);
        setRenderProgress(100);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      };

      recorder.start();

      // Seek to trim start and start playing
      video.currentTime = trimStart;
      await video.play();

      const filterObj = VIDEO_FILTERS.find((f) => f.id === selectedFilter);

      const renderInterval = setInterval(() => {
        if (!ctx || !video) return;

        // Draw video frame with active filter
        ctx.save();
        if (filterObj && filterObj.css !== 'none') {
          ctx.filter = filterObj.css;
        }

        // Draw scaled video
        ctx.drawImage(video, 0, 0, targetW, targetH);
        ctx.restore();

        // Draw active subtitles
        const cur = video.currentTime;
        subtitles.forEach((sub) => {
          if (cur >= sub.startTime && cur <= sub.endTime) {
            ctx.save();
            const posX = (sub.x / 100) * targetW;
            const posY = (sub.y / 100) * targetH;
            const fontSize = sub.fontSize * (targetW / 800);
            ctx.font = `bold ${fontSize}px ${sub.fontFamily || 'Plus Jakarta Sans'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textWidth = ctx.measureText(sub.text).width;
            ctx.fillStyle = sub.bgColor || 'rgba(0,0,0,0.7)';
            ctx.fillRect(
              posX - textWidth / 2 - 16,
              posY - fontSize * 0.8,
              textWidth + 32,
              fontSize * 1.6
            );

            ctx.fillStyle = sub.color || '#ffffff';
            ctx.fillText(sub.text, posX, posY);
            ctx.restore();
          }
        });

        // Track progress
        const totalTrimTime = trimEnd - trimStart;
        const elapsed = video.currentTime - trimStart;
        const pct = Math.min(95, Math.max(10, Math.round((elapsed / totalTrimTime) * 100)));
        setRenderProgress(pct);

        if (video.currentTime >= trimEnd || video.ended) {
          clearInterval(renderInterval);
          video.pause();
          recorder.stop();
        }
      }, 1000 / 30);
    } catch (err: any) {
      console.error(err);
      alert(isUrdu ? 'ایکسپورٹ میں خرابی واقع ہوئی ہے۔' : 'Error rendering video: ' + err.message);
      setIsRendering(false);
    }
  };

  const activeFilterObj = VIDEO_FILTERS.find((f) => f.id === selectedFilter);
  const selectedSubObj = subtitles.find((s) => s.id === selectedSubId);

  // Active subtitles visible at current time
  const visibleSubtitles = subtitles.filter(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

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
            accept="video/*"
            className="hidden"
          />
          <button
            id="btn-upload-video"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/30"
          >
            <Upload className="w-4 h-4" />
            <span>{t.common.upload}</span>
          </button>

          <button
            id="btn-webcam-video"
            onClick={startWebcam}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700/60 transition-colors"
          >
            <VideoIcon className="w-4 h-4 text-indigo-400" />
            <span>{isUrdu ? 'ویڈیو ریکارڈ کریں' : 'Record Video'}</span>
          </button>

          {/* Sample Videos Dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {t.common.useSample}:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {SAMPLE_VIDEOS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setVideoSrc(sample.url);
                    setIsPlaying(false);
                    setSubtitles([]);
                  }}
                  title={isUrdu ? sample.nameUr : sample.nameEn}
                  className={`w-8 h-8 rounded-lg overflow-hidden border transition-all ${
                    videoSrc === sample.url
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                      : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={sample.poster}
                    alt={sample.nameEn}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Snapshot & Export */}
        <div className="flex items-center gap-2">
          <button
            id="btn-snapshot-video"
            onClick={captureSnapshot}
            title={t.video.snapshot}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700/60 transition-colors"
          >
            <Camera className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">{t.video.snapshot}</span>
          </button>

          <button
            id="btn-render-video"
            onClick={handleExportRenderVideo}
            disabled={isRendering}
            className="bg-emerald-500/10 text-emerald-400 px-5 py-2 rounded-xl border border-emerald-500/20 text-xs sm:text-sm font-bold tracking-wide uppercase hover:bg-emerald-500/20 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isRendering ? `${renderProgress}% ${t.video.rendering}` : t.video.renderBtn}</span>
          </button>
        </div>
      </div>

      {/* Main Video Bento Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Video Player & Interactive Timeline (Bento Box) */}
        <div className="lg:col-span-8 bg-slate-950/90 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          {/* Video Stage Frame with Aspect Ratio */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[340px] max-h-[460px] shadow-inner">
            <video
              ref={videoRef}
              src={videoSrc}
              crossOrigin="anonymous"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onError={handleVideoError}
              onEnded={() => setIsPlaying(false)}
              playsInline
              muted={isMuted}
              style={{
                filter: activeFilterObj ? activeFilterObj.css : 'none',
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
              }}
              className={`max-w-full max-h-[440px] object-contain transition-transform duration-200 ${
                aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'
              }`}
            />

            {/* Render Overlay Subtitles over Video */}
            {visibleSubtitles.map((sub) => (
              <div
                key={sub.id}
                style={{
                  top: `${sub.y}%`,
                  left: `${sub.x}%`,
                  transform: 'translate(-50%, -50%)',
                  color: sub.color,
                  backgroundColor: sub.bgColor,
                  fontSize: `${sub.fontSize}px`,
                  fontFamily: sub.fontFamily,
                }}
                className="absolute px-4 py-1.5 rounded-2xl font-bold text-center pointer-events-none shadow-lg max-w-[85%] whitespace-pre-wrap leading-relaxed animate-fadeIn"
              >
                {sub.text}
              </div>
            ))}

            {/* Play/Pause Overlay Button */}
            <button
              id="btn-overlay-play"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110 shadow-2xl opacity-0 hover:opacity-100 focus:opacity-100"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
          </div>

          {/* Player Controls Bar */}
          <div className="space-y-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl">
            {/* Play/Pause, Timestamp, Volume & Aspect Controls */}
            <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <button
                  id="btn-play-pause"
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <span className="font-mono text-slate-300 text-xs">
                  {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                </span>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Aspect Ratio Framing Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-[11px]">
                {['16:9', '9:16', '1:1'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      aspectRatio === ratio ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Timeline Trimmer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-indigo-400">
                  <Scissors className="w-3.5 h-3.5" />
                  {isUrdu ? 'شروع کا وقت:' : 'Trim Start:'} {trimStart.toFixed(1)}s
                </span>
                <span className="text-pink-400">
                  {isUrdu ? 'اختتام کا وقت:' : 'Trim End:'} {trimEnd.toFixed(1)}s
                </span>
              </div>

              {/* Dual Range Scrubber Container */}
              <div className="relative h-7 bg-slate-950 border border-slate-800 rounded-xl flex items-center px-2">
                {/* Progress bar fill */}
                <div
                  style={{
                    left: `${(trimStart / (duration || 1)) * 100}%`,
                    width: `${((trimEnd - trimStart) / (duration || 1)) * 100}%`,
                  }}
                  className="absolute h-full bg-indigo-500/20 border-x-2 border-indigo-500 rounded-lg"
                />

                {/* Current Playhead indicator */}
                <div
                  style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow z-10 pointer-events-none"
                />

                {/* Scrubber Input */}
                <input
                  type="range"
                  min="0"
                  max={duration || 10}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    const tVal = Number(e.target.value);
                    setCurrentTime(tVal);
                    if (videoRef.current) videoRef.current.currentTime = tVal;
                  }}
                  className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-20"
                />
              </div>

              {/* Start & End Trim Sliders */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400">{t.video.timeline.start}</span>
                  <input
                    type="range"
                    min="0"
                    max={trimEnd - 0.5}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">{t.video.timeline.end}</span>
                  <input
                    type="range"
                    min={trimStart + 0.5}
                    max={duration}
                    step="0.1"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Studio Tool Panels (Bento Box) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col shadow-2xl">
          {/* Sub-tool Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/90 mb-4">
            <button
              id="tab-sub-vtrim"
              onClick={() => setActiveSubTab('trim')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'trim' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-4 h-4 mb-0.5" />
              <span>{t.video.tools.trim}</span>
            </button>

            <button
              id="tab-sub-vfilter"
              onClick={() => setActiveSubTab('filters')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'filters' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 mb-0.5" />
              <span>{t.video.tools.filters}</span>
            </button>

            <button
              id="tab-sub-vspeed"
              onClick={() => setActiveSubTab('speed')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'speed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-4 h-4 mb-0.5" />
              <span>{t.video.tools.speed}</span>
            </button>

            <button
              id="tab-sub-vtext"
              onClick={() => setActiveSubTab('text')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-4 h-4 mb-0.5" />
              <span>{t.video.tools.text}</span>
            </button>

            <button
              id="tab-sub-vaudio"
              onClick={() => setActiveSubTab('audio')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'audio' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-4 h-4 mb-0.5" />
              <span>{t.video.tools.audio}</span>
            </button>

            <button
              id="tab-sub-vai"
              onClick={() => setActiveSubTab('ai')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-medium transition-all ${
                activeSubTab === 'ai' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/10'
              }`}
            >
              <Wand2 className="w-4 h-4 mb-0.5" />
              <span>{isUrdu ? 'اے آئی' : 'AI'}</span>
            </button>
          </div>

          {/* Tool Panels Body */}
          <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-4">
            {/* 1. Trim & Cut Tools */}
            {activeSubTab === 'trim' && (
              <div className="space-y-3.5">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <span className="text-xs font-semibold text-slate-200">
                    {isUrdu ? 'فوری ٹرم اور گھمانا' : 'Quick Trim & Rotation'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.video.transform.rotateLeft}</span>
                    </button>
                    <button
                      onClick={() => setFlipH((f) => !f)}
                      className={`p-2 rounded-xl border border-slate-700 hover:bg-slate-800 ${
                        flipH ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>{isUrdu ? 'سلیکٹڈ دورانیہ:' : 'Selected Duration:'}</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {(trimEnd - trimStart).toFixed(1)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isUrdu ? 'اصل ویڈیو لمبائی:' : 'Original Video Length:'}</span>
                    <span className="font-mono text-slate-400">{duration.toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Cinematic Video Filters */}
            {activeSubTab === 'filters' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">
                  {isUrdu ? 'ویڈیو کے لیے سینما فلٹر منتخب کریں:' : 'Select Cinematic Look:'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {VIDEO_FILTERS.map((vf) => (
                    <button
                      key={vf.id}
                      onClick={() => setSelectedFilter(vf.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        selectedFilter === vf.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-md shadow-indigo-500/20'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{isUrdu ? vf.nameUr : vf.nameEn}</span>
                      {selectedFilter === vf.id && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Playback Speed */}
            {activeSubTab === 'speed' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">
                  {isUrdu ? 'ویڈیو پلے بیک رفتار منتخب کریں:' : 'Choose Playback Speed:'}
                </div>
                <div className="space-y-2">
                  {[
                    { rate: 0.5, label: t.video.speedLabels.slow },
                    { rate: 1.0, label: t.video.speedLabels.normal },
                    { rate: 1.5, label: t.video.speedLabels.fast },
                    { rate: 2.0, label: t.video.speedLabels.superFast },
                  ].map((s) => (
                    <button
                      key={s.rate}
                      onClick={() => changePlaybackRate(s.rate)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-medium transition-all ${
                        playbackRate === s.rate
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{s.label}</span>
                      {playbackRate === s.rate && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Text & Subtitles */}
            {activeSubTab === 'text' && (
              <div className="space-y-4">
                <button
                  id="btn-add-video-text"
                  onClick={handleAddSubtitle}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Type className="w-4 h-4" />
                  <span>{t.video.subtitles.addBtn}</span>
                </button>

                {selectedSubObj && (
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        {isUrdu ? 'سب ٹائٹل ایڈٹ کریں' : 'Edit Subtitle'}
                      </span>
                      <button
                        onClick={() => {
                          setSubtitles((prev) => prev.filter((s) => s.id !== selectedSubId));
                          setSelectedSubId(null);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      value={selectedSubObj.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubtitles((prev) =>
                          prev.map((item) =>
                            item.id === selectedSubId ? { ...item, text: val } : item
                          )
                        );
                      }}
                      rows={2}
                      placeholder={t.video.subtitles.inputPlaceholder}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />

                    {/* Timeline Timing for Subtitle */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">{t.video.timeline.start}: {selectedSubObj.startTime.toFixed(1)}s</span>
                        <input
                          type="range"
                          min="0"
                          max={duration}
                          step="0.1"
                          value={selectedSubObj.startTime}
                          onChange={(e) => {
                            const st = Number(e.target.value);
                            setSubtitles((prev) =>
                              prev.map((item) =>
                                item.id === selectedSubId ? { ...item, startTime: st } : item
                              )
                            );
                          }}
                          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">{t.video.timeline.end}: {selectedSubObj.endTime.toFixed(1)}s</span>
                        <input
                          type="range"
                          min="0"
                          max={duration}
                          step="0.1"
                          value={selectedSubObj.endTime}
                          onChange={(e) => {
                            const et = Number(e.target.value);
                            setSubtitles((prev) =>
                              prev.map((item) =>
                                item.id === selectedSubId ? { ...item, endTime: et } : item
                              )
                            );
                          }}
                          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Audio & Music Mixer */}
            {activeSubTab === 'audio' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioUpload}
                  accept="audio/*"
                  className="hidden"
                />

                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700/60"
                >
                  <Music className="w-4 h-4 text-indigo-400" />
                  <span>{t.video.audioMixer.uploadAudio}</span>
                </button>

                {/* Video Volume Slider */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{t.video.audioMixer.videoVolume}</span>
                    <span className="font-mono text-indigo-400">{videoVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={videoVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setVideoVolume(val);
                      if (videoRef.current) videoRef.current.volume = val / 100;
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 6. AI Video Creator */}
            {activeSubTab === 'ai' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-800/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs sm:text-sm">
                    <Wand2 className="w-4 h-4 text-indigo-400" />
                    <span>{t.video.aiVideo.title}</span>
                  </div>

                  <textarea
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    rows={2}
                    placeholder={t.video.aiVideo.topicPlaceholder}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    id="btn-generate-ai-script"
                    onClick={handleGenerateAiScript}
                    disabled={aiScriptLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    {aiScriptLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{aiScriptLoading ? t.common.loading : t.video.aiVideo.generateBtn}</span>
                  </button>

                  {aiScriptResult && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {aiScriptResult}
                    </div>
                  )}

                  {onSendToChat && (
                    <button
                      onClick={() => onSendToChat(isUrdu ? 'میری ویڈیو کو وائرل کرنے کے لیے 5 زبردست ہکس اور سکرپٹ آئیڈیاز دیں۔' : 'Give me 5 viral hooks and ideas for this video topic.')}
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

      {/* Interactive Bento Feature Tiles Grid for Video */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        {/* Bento Tile 1: AI Video Script & Viral Hooks */}
        <div 
          onClick={() => setActiveSubTab('ai')}
          className="md:col-span-4 bg-indigo-600 rounded-3xl p-5 text-white flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer shadow-xl shadow-indigo-600/20 group min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="bg-white/20 w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-full text-indigo-100">
              {isUrdu ? 'اے آئی سکرپٹ' : 'AI Viral Studio'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-white text-base leading-tight">
              {isUrdu ? 'اے آئی سکرپٹ و ہکس' : 'AI Video Script Creator'}
            </h3>
            <p className="text-indigo-100 text-xs mt-0.5">
              {isUrdu ? 'ٹک ٹاک، ریلز اور شارٹس کے لیے وائرل کنٹینٹ' : 'Generate viral hooks & full scene scripts'}
            </p>
          </div>
        </div>

        {/* Bento Tile 2: Smart Speed & Precision Trim */}
        <div 
          onClick={() => setActiveSubTab('speed')}
          className="md:col-span-4 bg-slate-800/90 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between hover:bg-slate-700/90 transition-colors cursor-pointer group shadow-xl min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="bg-slate-700 w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gauge className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {isUrdu ? 'رفتار و کٹ' : 'Speed & Trim'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-slate-200 text-base leading-tight">
              {isUrdu ? 'اسپیڈ و ٹائم لائن' : 'Speed & Precision Trim'}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {isUrdu ? 'سلو موشن 0.5x سے لے کر 2x فاسٹ فارورڈ' : 'Slow-mo 0.5x to 2x turbo speed controls'}
            </p>
          </div>
        </div>

        {/* Bento Tile 3: Cinematic Look & Sound Stage */}
        <div 
          onClick={() => setActiveSubTab('filters')}
          className="md:col-span-4 bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-3xl p-5 text-white flex items-center justify-between relative overflow-hidden group cursor-pointer shadow-xl shadow-purple-600/20 min-h-[130px]"
        >
          <div className="relative z-10">
            <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-2">
              {isUrdu ? 'سینما کلر گریڈنگ' : 'Color Grading'}
            </span>
            <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
              {isUrdu ? 'سینما اسٹوڈیو' : 'Cinematic FX'}
            </h3>
            <p className="text-fuchsia-100 text-xs mt-0.5">
              {isUrdu ? 'سائبر پنک، ونٹیج، وارم اور ڈارک مووی لُک' : 'High quality color LUTs and filters'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Film className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Webcam Recording Modal */}
      {showWebcamRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-indigo-400" />
              <span>{isUrdu ? 'ویب کیم سے ویڈیو ریکارڈ کریں' : 'Record Video with Camera'}</span>
            </h3>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video
                ref={webcamVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isRecordingWebcam && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  REC
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeWebcamModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
              >
                {t.common.cancel}
              </button>
              {isRecordingWebcam ? (
                <button
                  onClick={stopRecordingWebcam}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/30"
                >
                  {isUrdu ? 'ریکارڈنگ بند کریں ⏹️' : 'Stop Recording ⏹️'}
                </button>
              ) : (
                <button
                  onClick={startRecordingWebcam}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30"
                >
                  {isUrdu ? 'ریکارڈنگ شروع کریں ⏺️' : 'Start Recording ⏺️'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

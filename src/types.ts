export type AppTab = 'photo' | 'video' | 'chat';

export type Language = 'ur' | 'en';

export interface PhotoFilter {
  id: string;
  nameEn: string;
  nameUr: string;
  css: string;
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  grayscale: number;
  hueRotate: number;
  blur: number;
  warmth: number;
}

export interface PhotoAdjustments {
  brightness: number; // -100 to 100 (0 default)
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  warmth: number;     // -100 to 100 (temperature)
  exposure: number;   // -100 to 100
  vignette: number;   // 0 to 100
  blur: number;       // 0 to 20 px
  hue: number;        // 0 to 360 deg
  invert: number;     // 0 to 100%
  sepia: number;      // 0 to 100%
  grayscale: number;  // 0 to 100%
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // px
  color: string;
  backgroundColor?: string;
  fontFamily: string;
  fontWeight: string;
  isUrdu?: boolean;
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // px
  rotation: number; // deg
}

export interface DrawPath {
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface VideoFilter {
  id: string;
  nameEn: string;
  nameUr: string;
  css: string;
}

export interface VideoSubtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  color: string;
  bgColor: string;
  fontSize: number;
  fontFamily: string;
}

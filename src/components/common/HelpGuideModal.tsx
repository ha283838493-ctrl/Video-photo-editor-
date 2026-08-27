import React from 'react';
import { Language } from '../../types';
import { getT } from '../../data/translations';
import { 
  X, 
  Camera, 
  Video, 
  Bot, 
  CheckCircle2, 
  Sparkles,
  Sliders,
  Film,
  MessageSquare
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;
  const isUrdu = language === 'ur';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="help-guide-dialog"
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative"
      >
        <button
          id="btn-close-help"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {isUrdu ? 'سافٹ ویئر استعمال کرنے کا آسان طریقہ' : 'Easy User Guide & Overview'}
            </h3>
            <p className="text-sm text-neutral-400">
              {isUrdu 
                ? 'کسی بھی پریشانی کے بغیر فوٹو ایڈیٹنگ، ویڈیو ایڈیٹنگ اور اے آئی سے مدد حاصل کریں'
                : 'Effortless photo editing, video trimming, and conversational AI guidance'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Photo Editor Guide */}
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="flex items-center gap-2.5 text-indigo-400 font-semibold mb-2">
              <Camera className="w-5 h-5" />
              <span>{isUrdu ? '۱. فوٹو ایڈیٹر (Photo Editor)' : '1. Photo Editing Studio'}</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 mb-2 leading-relaxed">
              {isUrdu
                ? 'اپنی کوئی بھی تصویر اپلوڈ کریں یا سیمپل تصویر منتخب کریں۔'
                : 'Upload any image from your device or pick a preset sample photo.'}
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
              <li>{isUrdu ? 'ایک کلک پر وائرل فلٹرز (سینما، شوخ رنگ، ونٹیج، بلیک اینڈ وائٹ) لگائیں۔' : 'Apply 1-click aesthetic filters (Vivid, Cinematic, Retro, B&W, Golden Hour).'}</li>
              <li>{isUrdu ? 'روشنی، کونٹراسٹ اور رنگوں کو اپنی مرضی سے ایڈجسٹ کریں۔' : 'Fine-tune Brightness, Contrast, Saturation, Warmth, Exposure, and Vignette.'}</li>
              <li>{isUrdu ? 'اردو یا انگریزی میں خوبصورت ٹیکسٹ اور اسٹیکرز شامل کریں۔' : 'Add custom text overlays in Urdu or English with custom colors and background boxes.'}</li>
              <li>{isUrdu ? 'اے آئی کے ذریعے بہترین کیپشنز اور ہیش ٹیگز حاصل کریں اور ایک کلک میں ڈاؤنلوڈ کریں۔' : 'Generate AI captions and export high-resolution PNG/JPG with one click.'}</li>
            </ul>
          </div>

          {/* Video Editor Guide */}
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="flex items-center gap-2.5 text-purple-400 font-semibold mb-2">
              <Video className="w-5 h-5" />
              <span>{isUrdu ? '۲. ویڈیو ایڈیٹر (Video Editor)' : '2. Video Editing Studio'}</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 mb-2 leading-relaxed">
              {isUrdu
                ? 'ویڈیو کو کاٹنا، سپیڈ بدلنا، میوزک لگانا اور سب ٹائٹلز شامل کرنا بالکل آسان ہے۔'
                : 'Trimming, speed adjustment, background music mixing, and video captions made super simple.'}
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
              <li>{isUrdu ? 'ٹائم لائن پر شروع اور اختتام کا وقت سیٹ کر کے ویڈیو کاٹیں۔' : 'Trim start and end points directly on the interactive timeline scrubber.'}</li>
              <li>{isUrdu ? 'سلو موشن (0.5x) یا فاسٹ موشن (1.5x / 2.0x) میں ویڈیو کی سپیڈ بدلیں۔' : 'Adjust playback speed from 0.5x Slow-Motion to 2x Fast-Motion.'}</li>
              <li>{isUrdu ? 'ویڈیو پر عنوان اور سب ٹائٹلز شامل کریں اور بیک گراؤنڈ میوزک لگائیں۔' : 'Overlay custom subtitles, adjust audio volume, and add background music.'}</li>
              <li>{isUrdu ? 'ویڈیو سے خوبصورت فوٹو کیپچر کریں یا پوری ویڈیو ڈاؤنلوڈ کریں۔' : 'Capture instant high-res photo frames or export/render ready-to-share video.'}</li>
            </ul>
          </div>

          {/* AI Chat Assistant Guide */}
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="flex items-center gap-2.5 text-emerald-400 font-semibold mb-2">
              <Bot className="w-5 h-5" />
              <span>{isUrdu ? '۳. چیٹ جی پی ٹی انداز کا اے آئی اسسٹنٹ (AI Chat)' : '3. ChatGPT-style AI Assistant'}</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 mb-2 leading-relaxed">
              {isUrdu
                ? 'یہاں آپ کسی بھی موضوع پر سوال پوچھ سکتے ہیں، وائرل ویڈیو اسکرپٹ بنوا سکتے ہیں اور ایڈیٹنگ کی رہنمائی حاصل کر سکتے ہیں۔'
                : 'Ask questions on any subject, generate viral video scripts, get photo tips, and converse naturally in Urdu and English.'}
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
              <li>{isUrdu ? 'مائیکروفون سے بول کر سوال لکھیں اور اے آئی کا جواب آواز میں سنیں۔' : 'Speak via microphone (Voice-to-Text) and listen to answers with Text-to-Speech.'}</li>
              <li>{isUrdu ? 'تیار کردہ اسکرپٹ یا کیپشنز کو براہِ راست فوٹو یا ویڈیو ایڈیٹر میں منتقل کریں۔' : 'Send generated captions and scripts directly to Photo or Video Studio with 1-click.'}</li>
              <li>{isUrdu ? 'عام معلومات، کوڈنگ، شاعری، ترجمہ اور تعلیمی سوالات کے فوری جوابات حاصل کریں۔' : 'Get instant answers for science, education, storytelling, creative writing, and tech.'}</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            id="btn-understand-help"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/30"
          >
            {isUrdu ? 'سمجھ گیا، شروع کریں' : 'Got it, let’s start!'}
          </button>
        </div>
      </div>
    </div>
  );
};

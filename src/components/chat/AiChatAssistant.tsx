import React, { useState, useRef, useEffect } from 'react';
import { Language, ChatMessage } from '../../types';
import { getT } from '../../data/translations';
import { SAMPLE_PROMPTS } from '../../data/sampleMedia';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Bot, 
  User, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface AiChatAssistantProps {
  language: Language;
  onSendToPhotoEditor: (text: string) => void;
  onSendToVideoEditor: (text: string) => void;
}

export const AiChatAssistant: React.FC<AiChatAssistantProps> = ({
  language,
  onSendToPhotoEditor,
  onSendToVideoEditor,
}) => {
  const t = getT(language);
  const isUrdu = language === 'ur';

  // Initial greeting
  const initialGreeting: ChatMessage = {
    id: 'msg_welcome',
    role: 'assistant',
    content: isUrdu
      ? `سلام! میں آپ کا ذہین **اے آئی اسسٹنٹ** ہوں۔ آپ مجھ سے:
- 📸 **فوٹو ایڈیٹنگ** کے بہترین طریقے اور فلٹرز کے مشورے لے سکتے ہیں۔
- 🎬 **ویڈیو اسکرپٹس**، وائرل آئیڈیاز اور سب ٹائٹلز بنوا سکتے ہیں۔
- 💡 **کوئی بھی عام سوال** (تعلیم، سائنس، کوڈنگ، شاعری، ترجمہ) پوچھ سکتے ہیں۔

آپ اردو یا انگریزی کسی بھی زبان میں سوال لکھ سکتے ہیں یا مائیکروفون سے بول سکتے ہیں!`
      : `Hello! I am your **AI Assistant** (powered like ChatGPT). You can ask me anything:
- 📸 **Photo Editing**: Professional color tips, filter recommendations, caption ideas.
- 🎬 **Video Creation**: Viral YouTube/TikTok scripts, storyboards, catchy hooks.
- 💡 **General Knowledge**: Science, coding, language translation, creative writing, and daily questions.

Feel free to ask in English or Urdu!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Speech Recognition (Voice Input)
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Text to Speech
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Setup Web Speech API for voice input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = isUrdu ? 'ur-PK' : 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputVal((prev) => (prev ? prev + ' ' + transcript : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [isUrdu]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert(
        isUrdu
          ? 'آپ کے براؤزر میں وائس ریکگنیشن سپورٹ موجود نہیں ہے۔'
          : 'Voice recognition is not supported in this browser.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = isUrdu ? 'ur-PK' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech Handler
  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isUrdu ? 'ur' : 'en-US';
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy Message Text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear Chat
  const handleClearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setMessages([initialGreeting]);
  };

  // Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputVal('');
    setIsLoading(true);

    try {
      // Prepare conversation array for backend
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          language: isUrdu ? 'Urdu' : 'English',
        }),
      });

      const data = await res.json();
      if (data.reply) {
        const assistantMsg: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: isUrdu
          ? 'معذرت، جواب تیار کرنے میں مسئلہ پیش آیا۔ برائے مہربانی دوبارہ کوشش کریں۔'
          : `Sorry, could not generate a response. Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 space-y-4">
      {/* Top Header & Quick Actions (Bento Header) */}
      <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.chat.title}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">
              {t.chat.subtitle}
            </p>
          </div>
        </div>

        <button
          id="btn-clear-chat"
          onClick={handleClearChat}
          title={t.chat.clearChat}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.chat.clearChat}</span>
        </button>
      </div>

      {/* Suggested Quick Prompts Bento Grid */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.chat.samplePromptsTitle}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_PROMPTS.slice(0, 3).map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sp.prompt)}
              className="text-left p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-xs group shadow-lg"
            >
              <div className="font-semibold text-slate-200 group-hover:text-indigo-300 mb-1 flex items-center justify-between">
                <span>{isUrdu ? sp.titleUr : sp.titleEn}</span>
                <span className="text-slate-500 text-[11px] group-hover:text-indigo-400">↗</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {sp.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread Container (Bento Box) */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4 shadow-2xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-sm shadow-md leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/20'
                  : msg.isError
                  ? 'bg-red-950/40 border border-red-800 text-red-200 rounded-tl-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
              }`}
            >
              {/* Message Markdown Content */}
              <div className="prose prose-invert prose-sm max-w-none break-words">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Timestamp and Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 gap-2">
                <span>{msg.timestamp}</span>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5">
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title={t.chat.copyReply}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* TTS Read Aloud */}
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      title={speakingMsgId === msg.id ? t.chat.stopSpeaking : t.chat.speakReply}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        speakingMsgId === msg.id ? 'text-indigo-400 bg-indigo-950/50' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {speakingMsgId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Send to Photo Studio */}
                    <button
                      onClick={() => onSendToPhotoEditor(msg.content.slice(0, 100))}
                      title={t.chat.actions.sendToPhoto}
                      className="p-1 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Send to Video Studio */}
                    <button
                      onClick={() => onSendToVideoEditor(msg.content.slice(0, 100))}
                      title={t.chat.actions.sendToVideo}
                      className="p-1 rounded hover:bg-slate-800 text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-indigo-600/30">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>{isUrdu ? 'اے آئی جواب سوچ رہا ہے...' : 'AI is thinking...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar with Microphone & Send (Bento Card) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:p-3 flex items-center gap-2 shadow-2xl backdrop-blur-md"
      >
        {/* Voice Input Mic */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          title={isListening ? t.chat.listening : t.chat.voiceInput}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
        </button>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={t.chat.inputPlaceholder}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          id="btn-send-chat"
          disabled={!inputVal.trim() || isLoading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{t.chat.send}</span>
        </button>
      </form>

      {/* Interactive Bento Feature Tiles Grid for AI Chat */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        {/* Bento Tile 1: AI Prompting Master */}
        <div 
          onClick={() => handleSendMessage(isUrdu ? 'فوٹو اور ویڈیو کو پروفیشنل بنانے کے لیے 3 آسان ٹپس دیں۔' : 'Give me 3 top tips to make photos and videos look professional.')}
          className="md:col-span-4 bg-indigo-600 rounded-3xl p-5 text-white flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer shadow-xl shadow-indigo-600/20 group min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="bg-white/20 w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-full text-indigo-100">
              {isUrdu ? 'ذہین سوالات' : 'Smart Prompts'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-white text-base leading-tight">
              {isUrdu ? 'فوٹو و ویڈیو مشاورت' : 'Instant AI Consultation'}
            </h3>
            <p className="text-indigo-100 text-xs mt-0.5">
              {isUrdu ? 'کلک کریں اور فوری ایڈیٹنگ مشورے حاصل کریں' : 'Click for instant expert media advice'}
            </p>
          </div>
        </div>

        {/* Bento Tile 2: Voice & Urdu Support */}
        <div 
          onClick={toggleVoiceInput}
          className="md:col-span-4 bg-slate-800/90 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between hover:bg-slate-700/90 transition-colors cursor-pointer group shadow-xl min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="bg-slate-700 w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full">
              {isUrdu ? 'وائس کمانڈ' : 'Voice Input'}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-slate-200 text-base leading-tight">
              {isUrdu ? 'بول کر سوال پوچھیں' : 'Speak or Type Anything'}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {isUrdu ? 'مائیکروفون اور سپیچ سنیسس سپورٹ' : 'Full speech recognition & Urdu/English audio'}
            </p>
          </div>
        </div>

        {/* Bento Tile 3: 1-Click Studio Integration */}
        <div 
          onClick={() => handleSendMessage(isUrdu ? 'انسٹاگرام ریل کے لیے دلکش کیپشن اور ہیش ٹیگز بنائیں۔' : 'Create engaging Instagram Reel captions and hashtags.')}
          className="md:col-span-4 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white flex items-center justify-between relative overflow-hidden group cursor-pointer shadow-xl shadow-emerald-600/20 min-h-[130px]"
        >
          <div className="relative z-10">
            <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-2">
              {isUrdu ? 'اسٹوڈیو انٹیگریشن' : 'Direct Bridge'}
            </span>
            <h3 className="font-bold text-white text-base sm:text-lg leading-tight">
              {isUrdu ? 'سوشل میڈیا کیپشنز' : 'Captions & Tags'}
            </h3>
            <p className="text-emerald-100 text-xs mt-0.5">
              {isUrdu ? 'جواب کو براہ راست فوٹو یا ویڈیو پر بھیجیں' : 'Push text directly onto photo & video canvases'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AppTab, Language } from './types';
import { Navbar } from './components/Navbar';
import { PhotoEditor } from './components/photo/PhotoEditor';
import { VideoEditor } from './components/video/VideoEditor';
import { AiChatAssistant } from './components/chat/AiChatAssistant';
import { HelpGuideModal } from './components/common/HelpGuideModal';
import { getT } from './data/translations';
import { Sparkles, Camera, Video, Bot } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('photo');
  const [language, setLanguage] = useState<Language>('ur'); // Default Urdu as prompted by user
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Cross-tool text bridge (e.g. sending AI generated scripts/captions into photo/video editor)
  const [injectedText, setInjectedText] = useState<string>('');

  const t = getT(language);
  const isUrdu = language === 'ur';

  const handleSendToPhoto = (text: string) => {
    setInjectedText(text);
    setActiveTab('photo');
  };

  const handleSendToVideo = (text: string) => {
    setInjectedText(text);
    setActiveTab('video');
  };

  const handleSendToChat = (prompt: string) => {
    setActiveTab('chat');
  };

  return (
    <div className={`min-h-screen bg-[#0F172A] text-slate-200 flex flex-col ${isUrdu ? 'font-urdu' : ''}`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 px-2 sm:px-4">
        {activeTab === 'photo' && (
          <PhotoEditor
            language={language}
            initialText={injectedText}
            onSendToChat={handleSendToChat}
          />
        )}

        {activeTab === 'video' && (
          <VideoEditor
            language={language}
            initialText={injectedText}
            onSendToChat={handleSendToChat}
          />
        )}

        {activeTab === 'chat' && (
          <AiChatAssistant
            language={language}
            onSendToPhotoEditor={handleSendToPhoto}
            onSendToVideoEditor={handleSendToVideo}
          />
        )}
      </main>

      {/* Interactive Quick Walkthrough / Help Guide Modal */}
      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        language={language}
      />

      {/* Footer Info */}
      <footer className="border-t border-slate-800/60 bg-slate-900/40 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {isUrdu
              ? '✨ اومنی ایڈٹ اے آئی — ویڈیو، فوٹو اور ذہین بنٹو اسٹوڈیو'
              : '✨ OmniEdit AI — Bento Grid Video, Photo & Intelligent AI Studio'}
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('photo')}
              className="hover:text-indigo-400 transition-colors"
            >
              {t.tabs.photo}
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('video')}
              className="hover:text-indigo-400 transition-colors"
            >
              {t.tabs.video}
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('chat')}
              className="hover:text-indigo-400 transition-colors"
            >
              {t.tabs.chat}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

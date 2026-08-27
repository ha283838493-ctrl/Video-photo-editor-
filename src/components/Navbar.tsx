import React from 'react';
import { AppTab, Language } from '../types';
import { getT } from '../data/translations';
import { 
  Camera, 
  Video, 
  Bot, 
  Languages, 
  HelpCircle, 
  Sparkles,
  Layers
} from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  onOpenHelp,
}) => {
  const t = getT(language);
  const isUrdu = language === 'ur';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0F172A]/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold leading-tight text-white">
                {isUrdu ? 'اومنی ایڈٹ اے آئی' : 'OmniEdit AI'}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg">
                {isUrdu ? 'ویڈیو • فوٹو • اے آئی' : 'Video • Photo • AI'}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              {isUrdu ? 'ویڈیو، فوٹو ایڈیٹنگ اور اے آئی کا جدید بنٹو پلیٹ فارم' : 'One platform for Video, Photo & AI Insights'}
            </p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <nav className="flex items-center bg-slate-800/90 border border-slate-700/60 rounded-xl p-1 shadow-inner">
          <button
            id="tab-btn-photo"
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === 'photo'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{t.tabs.photo}</span>
          </button>

          <button
            id="tab-btn-video"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === 'video'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{t.tabs.video}</span>
          </button>

          <button
            id="tab-btn-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{t.tabs.chat}</span>
          </button>
        </nav>

        {/* Right Actions: Language Switch & Guide */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            id="btn-language-toggle"
            onClick={() => setLanguage(language === 'ur' ? 'en' : 'ur')}
            title="تبدیل زبان / Switch Language"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-300 transition-colors"
          >
            <Languages className="w-4 h-4 text-indigo-400" />
            <span>{language === 'ur' ? 'English' : 'اردو'}</span>
          </button>

          {/* Quick Help Guide */}
          <button
            id="btn-open-help"
            onClick={onOpenHelp}
            title={t.common.quickGuide}
            className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

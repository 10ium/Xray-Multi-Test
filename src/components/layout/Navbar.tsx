import React from 'react';
import { Zap, Languages, Sparkles, RefreshCw } from 'lucide-react';
import { Translation } from '../../types';

interface NavbarProps {
  strings: Translation;
  lang: 'FA' | 'EN';
  onToggleLanguage: () => void;
  coreVersion: string;
  appVersion: string;
  hasAppUpdate: boolean;
  isCheckingAppUpdate: boolean;
  onOpenAppUpdate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  strings, 
  lang,
  onToggleLanguage, 
  coreVersion,
  appVersion,
  hasAppUpdate,
  isCheckingAppUpdate,
  onOpenAppUpdate
}) => {
  return (
    <nav className="max-w-7xl mx-auto flex flex-row justify-between items-center bg-[#1E1E1E] p-4 rounded-2xl border border-neutral-800 shadow-xl mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#6200EE]/25 rounded-xl border border-[#6200EE]/30 shadow-inner">
          <Zap className="w-6 h-6 text-[#03DAC6] animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight font-display text-white">{strings.appName}</h1>
            <span className="text-[10px] font-mono bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/30 px-2 py-0.5 rounded-full font-bold">
              PRO
            </span>
            <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700/60 px-2 py-0.5 rounded-full font-semibold">
              {appVersion}
            </span>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">Xray-Core {coreVersion} • Multi-Protocol Benchmark</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* App Update Button */}
        <button
          onClick={onOpenAppUpdate}
          id="btn-app-update"
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
            hasAppUpdate 
              ? 'bg-[#6200EE] border-[#03DAC6]/50 text-white animate-bounce' 
              : 'bg-[#121212] hover:bg-neutral-800 border-neutral-800 text-neutral-300'
          }`}
          title={strings.appUpdateCheckBtn}
        >
          {isCheckingAppUpdate ? (
            <RefreshCw className="w-3.5 h-3.5 text-[#03DAC6] animate-spin" />
          ) : (
            <Sparkles className={`w-3.5 h-3.5 ${hasAppUpdate ? 'text-[#03DAC6]' : 'text-neutral-400'}`} />
          )}
          <span className="hidden sm:inline">
            {hasAppUpdate ? (lang === 'FA' ? "آپدیت موجود است!" : "Update Ready!") : strings.appUpdateCheckBtn}
          </span>
        </button>

        {/* Language Toggle Button */}
        <button 
          onClick={onToggleLanguage}
          id="btn-lang-toggle"
          className="flex items-center gap-2 px-3.5 py-2 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 active:scale-95 rounded-xl text-xs font-bold text-neutral-200 transition-all cursor-pointer shadow-sm"
        >
          <Languages className="w-4 h-4 text-[#03DAC6]" />
          <span>{strings.languageBtn}</span>
        </button>
      </div>
    </nav>
  );
};

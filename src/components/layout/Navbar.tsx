import React from 'react';
import { Zap, Languages } from 'lucide-react';
import { Translation } from '../../types';

interface NavbarProps {
  strings: Translation;
  lang: 'FA' | 'EN';
  onToggleLanguage: () => void;
  coreVersion: string;
}

export const Navbar: React.FC<NavbarProps> = ({ strings, onToggleLanguage, coreVersion }) => {
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
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">Xray-Core {coreVersion} • Multi-Protocol Benchmark</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleLanguage}
          id="btn-lang-toggle"
          className="flex items-center gap-2 px-4 py-2 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 active:scale-95 rounded-xl text-xs font-bold text-neutral-200 transition-all cursor-pointer shadow-sm"
        >
          <Languages className="w-4 h-4 text-[#03DAC6]" />
          <span>{strings.languageBtn}</span>
        </button>
      </div>
    </nav>
  );
};

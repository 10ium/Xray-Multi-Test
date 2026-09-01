import React from 'react';
import { Gamepad2, Tv, Bot, UploadCloud, Flame } from 'lucide-react';
import { UserPersona, Translation } from '../../types';

interface PersonaSelectorProps {
  activePersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  activePersona,
  onSelectPersona,
  strings,
  lang
}) => {
  const personas: { id: UserPersona; title: string; desc: string; icon: React.ReactNode; color: string; badge: string }[] = [
    {
      id: 'gaming',
      title: strings.personaGaming,
      desc: strings.personaGamingDesc,
      icon: <Gamepad2 className="w-5 h-5" />,
      color: 'from-blue-600 to-cyan-500',
      badge: 'Ping & 0% Loss'
    },
    {
      id: 'streaming',
      title: strings.personaStreaming,
      desc: strings.personaStreamingDesc,
      icon: <Tv className="w-5 h-5" />,
      color: 'from-red-600 to-amber-500',
      badge: 'High Speed'
    },
    {
      id: 'ai_bypass',
      title: strings.personaAi,
      desc: strings.personaAiDesc,
      icon: <Bot className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-400',
      badge: 'Bypass & AI'
    },
    {
      id: 'upload',
      title: strings.personaUpload,
      desc: strings.personaUploadDesc,
      icon: <UploadCloud className="w-5 h-5" />,
      color: 'from-purple-600 to-indigo-500',
      badge: 'Max Uplink'
    },
    {
      id: 'all_rounder',
      title: strings.personaAllRounder,
      desc: strings.personaAllRounderDesc,
      icon: <Flame className="w-5 h-5" />,
      color: 'from-purple-600 to-[#03DAC6]',
      badge: 'Master Score'
    }
  ];

  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[#03DAC6]">
          <Flame className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider font-display">{strings.personaTitle}</h2>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          {lang === 'FA' ? "انتخاب بر اساس نیاز شما" : "Targeted diagnostics profile"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {personas.map((p) => {
          const isSelected = activePersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p.id)}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-[#03DAC6] bg-[#03DAC6]/10 shadow-lg shadow-[#03DAC6]/5 text-white ring-1 ring-[#03DAC6]'
                  : 'border-neutral-800 bg-[#121212]/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              {isSelected && (
                <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${p.color}`} />
              )}
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#03DAC6]/20 text-[#03DAC6]' : 'bg-[#1E1E1E] text-neutral-400'}`}>
                  {p.icon}
                </div>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#121212] border border-neutral-800 text-neutral-300">
                  {p.badge}
                </span>
              </div>
              <span className="text-xs font-bold text-white mb-1 font-sans">{p.title}</span>
              <span className="text-[10px] text-neutral-500 leading-relaxed font-sans line-clamp-2">
                {p.desc}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

import React from 'react';
import { Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Translation } from '../../types';

interface FragmentCardProps {
  isFragmentEnabled: boolean;
  onToggleFragment: (val: boolean) => void;
  fragmentPreset: 'mci' | 'mtn' | 'tcp' | 'custom';
  onApplyFragmentPreset: (preset: 'mci' | 'mtn' | 'tcp' | 'custom') => void;
  fragmentLength: string;
  onChangeFragmentLength: (val: string) => void;
  fragmentInterval: string;
  onChangeFragmentInterval: (val: string) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const FragmentCard: React.FC<FragmentCardProps> = ({
  isFragmentEnabled,
  onToggleFragment,
  fragmentPreset,
  onApplyFragmentPreset,
  fragmentLength,
  onChangeFragmentLength,
  fragmentInterval,
  onChangeFragmentInterval,
  strings,
  lang
}) => {
  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg" id="card-fragment">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[#03DAC6]">
          <Info className="w-5 h-5" />
          <h3 className="text-sm font-bold tracking-wide uppercase font-display">{strings.fragmentSettings}</h3>
        </div>
        <button 
          onClick={() => onToggleFragment(!isFragmentEnabled)}
          className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isFragmentEnabled ? 'bg-[#6200EE]' : 'bg-neutral-800'}`}
        >
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isFragmentEnabled ? (lang === 'FA' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
        </button>
      </div>

      {isFragmentEnabled && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-2 overflow-hidden"
        >
          {/* Fragment presets */}
          <div className="bg-[#121212] p-2.5 rounded-xl border border-neutral-800">
            <span className="block text-[10px] font-mono text-neutral-400 uppercase mb-2 text-center">
              {lang === 'FA' ? "پروفایل‌های پیش‌فرض فرگمنت" : "Fragment Presets Profiles"}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['mci', 'mtn', 'tcp', 'custom'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => onApplyFragmentPreset(preset)}
                  className={`px-1 py-1 rounded-md text-[9px] font-mono uppercase text-center transition-all border cursor-pointer ${
                    fragmentPreset === preset
                      ? 'bg-[#6200EE] border-[#03DAC6]/40 text-white font-bold'
                      : 'bg-[#1E1E1E] border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {preset === 'mci' && (lang === 'FA' ? 'همراه اول' : 'MCI')}
                  {preset === 'mtn' && (lang === 'FA' ? 'ایرانسل' : 'MTN')}
                  {preset === 'tcp' && (lang === 'FA' ? 'تی‌سی‌پی' : 'TCP')}
                  {preset === 'custom' && (lang === 'FA' ? 'کاستوم' : 'Custom')}
                </button>
              ))}
            </div>
            <div className="mt-1 text-[9px] text-neutral-500 font-mono text-center">
              {fragmentPreset === 'mci' && (lang === 'FA' ? "طول: ۱۰۰-۲۰۰، اینتروال: ۱۰-۲۰" : "Length: 100-200, Interval: 10-20")}
              {fragmentPreset === 'mtn' && (lang === 'FA' ? "طول: ۱-۵، اینتروال: ۳-۱۰" : "Length: 1-5, Interval: 3-10")}
              {fragmentPreset === 'tcp' && (lang === 'FA' ? "طول: ۵-۱۵، اینتروال: ۱۵-۲۵" : "Length: 5-15, Interval: 15-25")}
              {fragmentPreset === 'custom' && (lang === 'FA' ? "تنظیمات فرگمنت دلخواه شما" : "Custom parameters modified manually")}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1.5">{strings.fragmentLength}</label>
            <input 
              type="text" 
              value={fragmentLength}
              onChange={e => onChangeFragmentLength(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#6200EE]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1.5">{strings.fragmentInterval}</label>
            <input 
              type="text" 
              value={fragmentInterval}
              onChange={e => onChangeFragmentInterval(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#6200EE]"
            />
          </div>
        </motion.div>
      )}
    </section>
  );
};

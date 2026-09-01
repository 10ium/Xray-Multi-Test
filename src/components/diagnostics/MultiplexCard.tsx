import React from 'react';
import { Sliders } from 'lucide-react';
import { motion } from 'motion/react';
import { Translation } from '../../types';

interface MultiplexCardProps {
  isMuxEnabled: boolean;
  onToggleMux: (val: boolean) => void;
  muxConcurrency: string;
  onChangeMuxConcurrency: (val: string) => void;
  xudpConcurrency: string;
  onChangeXudpConcurrency: (val: string) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const MultiplexCard: React.FC<MultiplexCardProps> = ({
  isMuxEnabled,
  onToggleMux,
  muxConcurrency,
  onChangeMuxConcurrency,
  xudpConcurrency,
  onChangeXudpConcurrency,
  strings,
  lang
}) => {
  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg" id="card-multiplex">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[#03DAC6]">
          <Sliders className="w-5 h-5" />
          <h3 className="text-sm font-bold tracking-wide uppercase font-display">{strings.muxSettings}</h3>
        </div>
        <button 
          onClick={() => onToggleMux(!isMuxEnabled)}
          className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isMuxEnabled ? 'bg-[#6200EE]' : 'bg-neutral-800'}`}
        >
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isMuxEnabled ? (lang === 'FA' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
        </button>
      </div>

      {isMuxEnabled && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-2 overflow-hidden"
        >
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1.5">{strings.muxConcurrency}</label>
            <input 
              type="number" 
              value={muxConcurrency}
              onChange={e => onChangeMuxConcurrency(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#6200EE]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1.5">{strings.xudpConcurrencyLabel}</label>
            <input 
              type="number" 
              value={xudpConcurrency}
              onChange={e => onChangeXudpConcurrency(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#6200EE]"
            />
          </div>
        </motion.div>
      )}
    </section>
  );
};

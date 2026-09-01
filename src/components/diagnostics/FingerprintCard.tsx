import React, { useState } from 'react';
import { Sliders, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Translation } from '../../types';

interface FingerprintCardProps {
  selectedFingerprint: string;
  onSelectFingerprint: (fp: string) => void;
  strings: Translation;
}

export const FingerprintCard: React.FC<FingerprintCardProps> = ({
  selectedFingerprint,
  onSelectFingerprint,
  strings
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fingerprintOptions = [
    "chrome", "firefox", "safari", "edge", "360", "qq",
    "ios", "android", "randomized", "randomizednoalpn", "unsafe"
  ];

  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg" id="card-fingerprint">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[#03DAC6]">
          <Sliders className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-wide uppercase font-display">{strings.tlsFingerprint}</h2>
        </div>
        <span className="text-[10px] font-mono bg-[#121212] text-[#6200EE] border border-[#6200EE]/30 px-2 py-0.5 rounded-md font-bold">
          uTLS
        </span>
      </div>

      <div className="relative">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          id="btn-fp-dropdown"
          className="w-full flex justify-between items-center px-4 py-3 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-sm font-mono text-white text-left transition-all cursor-pointer shadow-sm"
        >
          <span className="font-bold tracking-wide uppercase">{selectedFingerprint}</span>
          <ChevronDown className={`w-4 h-4 text-[#03DAC6] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute z-20 w-full mt-2 bg-[#121212] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
            >
              {fingerprintOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    onSelectFingerprint(option);
                    setIsExpanded(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-mono uppercase transition-colors hover:bg-neutral-800 hover:text-[#03DAC6] cursor-pointer ${
                    selectedFingerprint === option ? 'text-[#03DAC6] bg-[#6200EE]/20 font-bold' : 'text-neutral-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

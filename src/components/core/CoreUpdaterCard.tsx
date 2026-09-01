import React from 'react';
import { Cpu, RefreshCw, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Translation } from '../../types';

interface CoreUpdaterCardProps {
  localCoreVersion: string;
  latestCoreVersion: string;
  isCheckingCore: boolean;
  isDownloadingCore: boolean;
  coreProgress: number;
  coreProgressText: string;
  onCheckUpdate: () => void;
  onDownloadCore: () => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const CoreUpdaterCard: React.FC<CoreUpdaterCardProps> = ({
  localCoreVersion,
  latestCoreVersion,
  isCheckingCore,
  isDownloadingCore,
  coreProgress,
  coreProgressText,
  onCheckUpdate,
  onDownloadCore,
  strings,
  lang
}) => {
  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg" id="card-core-version">
      <div className="flex items-center gap-2.5 mb-4 text-[#03DAC6]">
        <Cpu className="w-5 h-5" />
        <h2 className="text-sm font-bold tracking-wide uppercase font-display">
          {lang === 'FA' ? "ارتقا دهنده هسته ایکس ری" : "Xray-Core Updater"}
        </h2>
      </div>
      
      <div className="space-y-2 mb-5 font-sans text-sm text-neutral-300">
        <div className="flex justify-between border-b border-neutral-800/50 pb-2">
          <span className="text-neutral-400">{strings.currentCoreVersion}</span>
          <span className="font-mono font-medium text-white">{localCoreVersion}</span>
        </div>
        <div className="flex justify-between pt-1">
          <span className="text-neutral-400">{strings.latestCoreVersion}</span>
          <span className={`font-mono font-medium ${latestCoreVersion !== strings.unknown ? 'text-[#03DAC6]' : 'text-neutral-500'}`}>
            {latestCoreVersion}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onCheckUpdate}
          disabled={isCheckingCore || isDownloadingCore}
          id="btn-check-core"
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#121212] hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#03DAC6] ${isCheckingCore ? 'animate-spin' : ''}`} />
          <span>{strings.checkVersionBtn}</span>
        </button>

        <button 
          onClick={onDownloadCore}
          disabled={latestCoreVersion === strings.unknown || isDownloadingCore || isCheckingCore || localCoreVersion === latestCoreVersion}
          id="btn-download-core"
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#6200EE] hover:bg-[#5000C8] disabled:bg-neutral-800 disabled:opacity-40 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{strings.downloadCoreBtn}</span>
        </button>
      </div>

      <AnimatePresence>
        {isDownloadingCore && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-neutral-800 space-y-2 overflow-hidden"
          >
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>{coreProgressText}</span>
              <span>{Math.round(coreProgress * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#121212] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#6200EE] to-[#03DAC6]"
                animate={{ width: `${coreProgress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

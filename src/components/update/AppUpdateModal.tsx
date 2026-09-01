import React from 'react';
import { X, Sparkles, Download, ExternalLink, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppReleaseInfo, Translation } from '../../types';

interface AppUpdateModalProps {
  releaseInfo: AppReleaseInfo | null;
  currentVersion: string;
  isOpen: boolean;
  onClose: () => void;
  onDownloadAndInstall: () => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  releaseInfo,
  currentVersion,
  isOpen,
  onClose,
  onDownloadAndInstall,
  strings,
  lang
}) => {
  if (!isOpen || !releaseInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#1E1E1E] border border-[#6200EE]/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden"
        >
          {/* Header Glow */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#6200EE] via-[#03DAC6] to-[#7B1FA2]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title and Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#6200EE]/20 border border-[#6200EE]/40 rounded-2xl text-[#03DAC6]">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-black font-display text-white">
                {strings.appUpdateTitle}
              </h3>
              <p className="text-xs text-neutral-400 font-sans">
                {strings.appUpdateAvailable}
              </p>
            </div>
          </div>

          {/* Version Badges */}
          <div className="grid grid-cols-2 gap-2.5 bg-[#121212] p-3.5 rounded-2xl border border-neutral-800/80 mb-4">
            <div>
              <span className="block text-[10px] font-mono text-neutral-500 uppercase">
                {strings.appUpdateCurrent}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-300">
                {currentVersion}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-mono text-neutral-500 uppercase">
                {strings.appUpdateLatest}
              </span>
              <span className="text-xs font-mono font-black text-[#03DAC6] bg-[#03DAC6]/10 px-2 py-0.5 rounded-md border border-[#03DAC6]/20 inline-block">
                {releaseInfo.version}
              </span>
            </div>
          </div>

          {/* Release Notes */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2 font-bold uppercase">
              <span>{lang === 'FA' ? "تغییرات و بهینه‌سازی‌ها:" : "Release Changelog:"}</span>
              {releaseInfo.publishedAt && (
                <span className="text-neutral-500 flex items-center gap-1 font-normal text-[10px]">
                  <Calendar className="w-3 h-3" />
                  {new Date(releaseInfo.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="bg-[#121212] p-3.5 rounded-2xl border border-neutral-800/80 max-h-44 overflow-y-auto custom-scrollbar text-xs font-sans text-neutral-300 leading-relaxed whitespace-pre-line">
              {releaseInfo.releaseNotes || (lang === 'FA' ? "بهینه‌سازی کلی عملکرد، ارتقای هسته و رفع اشکالات جزئی." : "General performance optimizations and bug fixes.")}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onDownloadAndInstall}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#6200EE] to-[#03DAC6] hover:from-[#5000C8] hover:to-[#01bfa5] text-neutral-950 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6200EE]/20 active:scale-98"
            >
              <Download className="w-4 h-4 text-neutral-950" />
              <span>{strings.appUpdateDownloadBtn}</span>
            </button>

            {releaseInfo.htmlUrl && (
              <a
                href={releaseInfo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-3.5 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{lang === 'FA' ? "گیت‌هاب" : "GitHub"}</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="py-3 px-4 bg-[#1E1E1E] hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-2xl text-xs transition-colors cursor-pointer"
            >
              {strings.appUpdateLaterBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React from 'react';
import { Smartphone, RefreshCw, Download, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { AppReleaseInfo, Translation } from '../../types';

interface AppUpdaterCardProps {
  currentAppVersion: string;
  releaseInfo: AppReleaseInfo | null;
  isChecking: boolean;
  onCheckUpdate: () => void;
  onOpenUpdateModal: () => void;
  onDirectDownload: () => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const AppUpdaterCard: React.FC<AppUpdaterCardProps> = ({
  currentAppVersion,
  releaseInfo,
  isChecking,
  onCheckUpdate,
  onOpenUpdateModal,
  onDirectDownload,
  strings,
  lang
}) => {
  const hasUpdate = releaseInfo?.hasUpdate || false;
  const latestVersion = releaseInfo?.version || strings.unknown;

  return (
    <section className="bg-gradient-to-br from-[#1E1E1E] to-[#171717] p-5 rounded-2xl border border-[#6200EE]/30 shadow-xl relative overflow-hidden" id="card-app-updater">
      {/* Decorative accent glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#6200EE]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[#03DAC6]">
          <div className="p-2 bg-[#03DAC6]/10 rounded-xl border border-[#03DAC6]/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide font-display text-white">
              {lang === 'FA' ? "بروزرسانی اپلیکیشن اندروید" : "Android App Updater"}
            </h2>
            <p className="text-[11px] text-neutral-400 font-sans">
              {lang === 'FA' ? "مدیریت نسخه‌ها و ارتقای خودکار برنامه" : "App version & self-update management"}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {hasUpdate ? (
          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>{lang === 'FA' ? "آپدیت موجود" : "Update Available"}</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{lang === 'FA' ? "نسخه نهایی" : "Up to Date"}</span>
          </span>
        )}
      </div>

      {/* Version Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#121212] p-3 rounded-xl border border-neutral-800/80">
          <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
            {strings.appUpdateCurrent}
          </span>
          <span className="text-sm font-mono font-bold text-neutral-200">
            {currentAppVersion}
          </span>
        </div>

        <div className="bg-[#121212] p-3 rounded-xl border border-neutral-800/80 text-right">
          <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
            {strings.appUpdateLatest}
          </span>
          <span className={`text-sm font-mono font-black ${hasUpdate ? 'text-[#03DAC6]' : 'text-neutral-300'}`}>
            {latestVersion}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {hasUpdate ? (
          <>
            <button
              onClick={onDirectDownload}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#6200EE] to-[#03DAC6] hover:from-[#5000C8] hover:to-[#01bfa5] text-neutral-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#6200EE]/20 active:scale-98"
            >
              <Download className="w-4 h-4 text-neutral-950" />
              <span>{strings.appUpdateDownloadBtn}</span>
            </button>

            <button
              onClick={onOpenUpdateModal}
              className="py-3 px-3.5 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#03DAC6]" />
              <span>{lang === 'FA' ? "جزئیات" : "Notes"}</span>
            </button>
          </>
        ) : (
          <button
            onClick={onCheckUpdate}
            disabled={isChecking}
            className="w-full py-3 px-4 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 active:scale-98 rounded-xl text-xs font-bold text-neutral-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#03DAC6] ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? strings.appUpdateChecking : strings.appUpdateCheckBtn}</span>
          </button>
        )}
      </div>
    </section>
  );
};

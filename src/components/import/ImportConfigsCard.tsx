import React, { useState } from 'react';
import { Clipboard, FileText, Link, Plus } from 'lucide-react';
import { Translation } from '../../types';

interface ImportConfigsCardProps {
  onImportClipboard: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportManualText: (text: string) => void;
  onImportSubscription: (url: string) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const ImportConfigsCard: React.FC<ImportConfigsCardProps> = ({
  onImportClipboard,
  onImportFile,
  onImportManualText,
  onImportSubscription,
  strings,
  lang
}) => {
  const [manualText, setManualText] = useState('');
  const [subUrl, setSubUrl] = useState('');

  const handleManualImport = () => {
    if (!manualText.trim()) return;
    onImportManualText(manualText);
    setManualText('');
  };

  const handleSubImport = () => {
    if (!subUrl.trim()) return;
    onImportSubscription(subUrl.trim());
  };

  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg" id="card-import-configs">
      <div className="flex items-center gap-2.5 mb-4 text-[#03DAC6]">
        <Clipboard className="w-5 h-5" />
        <h2 className="text-sm font-bold tracking-wide uppercase font-display">{strings.selectConfigTitle}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button 
          onClick={onImportClipboard}
          id="btn-import-clipboard"
          className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[#6200EE] hover:bg-[#5000C8] rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-[#6200EE]/10 active:scale-95"
        >
          <Clipboard className="w-4 h-4" />
          <span>{strings.importClipboard}</span>
        </button>

        <label 
          id="label-import-file"
          className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold text-neutral-200 transition-all cursor-pointer text-center active:scale-95"
        >
          <FileText className="w-4 h-4 text-[#03DAC6]" />
          <span>{strings.importFile}</span>
          <input 
            type="file" 
            accept=".txt,.json,.conf,*" 
            onChange={onImportFile}
            className="hidden" 
          />
        </label>
      </div>

      {/* Manual Paste area */}
      <div className="mb-4 bg-[#121212]/40 p-3 rounded-xl border border-neutral-800/60">
        <textarea
          value={manualText}
          onChange={e => setManualText(e.target.value)}
          placeholder={lang === 'FA' ? "یا کانفیگ‌ها را در این قسمت پیست کنید..." : "Or paste configurations here manually..."}
          className="w-full h-20 p-2.5 bg-[#121212] border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#6200EE] font-mono resize-none placeholder-neutral-600"
        />
        {manualText.trim() && (
          <button
            onClick={handleManualImport}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#03DAC6]/10 hover:bg-[#03DAC6]/20 border border-[#03DAC6]/30 rounded-lg text-xs font-bold text-[#03DAC6] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'FA' ? "ورود کانفیگ‌های پیست‌شده" : "Import Pasted Configs"}</span>
          </button>
        )}
      </div>

      {/* Subscription Link */}
      <div className="border-t border-neutral-800/80 pt-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-600">
              <Link className="w-4 h-4" />
            </span>
            <input 
              type="url" 
              value={subUrl}
              onChange={e => setSubUrl(e.target.value)}
              placeholder={strings.subUrlPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 bg-[#121212] border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#6200EE] font-sans"
            />
          </div>
          <button 
            onClick={handleSubImport}
            id="btn-import-sub"
            className="px-4 py-2.5 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 active:scale-95 rounded-xl text-xs font-bold text-neutral-200 transition-all cursor-pointer whitespace-nowrap"
          >
            {strings.importSubLink}
          </button>
        </div>
      </div>
    </section>
  );
};

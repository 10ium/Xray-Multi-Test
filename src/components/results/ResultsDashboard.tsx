import React from 'react';
import { ArrowUpDown, Copy, Save, Share2 } from 'lucide-react';
import { XrayConfig, TestResult, Translation, FilterOptions, UserPersona } from '../../types';
import { ResultsFilterBar } from './ResultsFilterBar';
import { ConfigResultCard } from './ConfigResultCard';

interface ResultsDashboardProps {
  configsList: XrayConfig[];
  testResults: Record<string, TestResult>;
  activeTestIndex: number | null;
  activePersona: UserPersona;
  filterOptions: FilterOptions;
  onChangeFilterOptions: (options: FilterOptions) => void;
  onDeduplicate: () => void;
  onOpenExportModal: () => void;
  onCopyHealthy: () => void;
  onSaveHealthyFile: () => void;
  onDeleteConfig: (raw: string) => void;
  onCopySingle: (raw: string) => void;
  onShowQr: (config: XrayConfig) => void;
  copyLimitMode: 'all' | 'limited';
  onChangeCopyLimitMode: (mode: 'all' | 'limited') => void;
  copyLimitInput: string;
  onChangeCopyLimitInput: (count: string) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  configsList,
  testResults,
  activeTestIndex,
  activePersona,
  filterOptions,
  onChangeFilterOptions,
  onDeduplicate,
  onOpenExportModal,
  onCopyHealthy,
  onSaveHealthyFile,
  onDeleteConfig,
  onCopySingle,
  onShowQr,
  copyLimitMode,
  onChangeCopyLimitMode,
  copyLimitInput,
  onChangeCopyLimitInput,
  strings,
  lang
}) => {
  const availableProtocols = Array.from(new Set(configsList.map(c => c.protocol)));

  const filteredConfigs = configsList.filter(c => {
    const res = testResults[c.raw];

    if (filterOptions.searchQuery) {
      const q = filterOptions.searchQuery.toLowerCase();
      const match = c.remarks.toLowerCase().includes(q) ||
                    c.address.toLowerCase().includes(q) ||
                    c.protocol.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterOptions.selectedProtocol !== 'all' && c.protocol !== filterOptions.selectedProtocol) {
      return false;
    }

    if (filterOptions.healthyOnly) {
      if (!res || !res.isHealthy || res.tcpPing <= 0) return false;
    }

    return true;
  });

  const sortedConfigs = [...filteredConfigs].sort((a, b) => {
    const resA = testResults[a.raw];
    const resB = testResults[b.raw];

    if (filterOptions.sortBy === 'ping') {
      const pingA = resA && resA.tcpPing > 0 ? resA.tcpPing : 99999;
      const pingB = resB && resB.tcpPing > 0 ? resB.tcpPing : 99999;
      return pingA - pingB;
    }

    if (filterOptions.sortBy === 'download') {
      const dlA = resA && resA.downloadSpeedMbps > 0 ? resA.downloadSpeedMbps : 0;
      const dlB = resB && resB.downloadSpeedMbps > 0 ? resB.downloadSpeedMbps : 0;
      return dlB - dlA;
    }

    if (filterOptions.sortBy === 'jitter') {
      const jA = resA && resA.jitter >= 0 ? resA.jitter : 99999;
      const jB = resB && resB.jitter >= 0 ? resB.jitter : 99999;
      return jA - jB;
    }

    const scoreA = resA ? (
      activePersona === 'gaming' ? (resA.personaScores?.gamingScore ?? resA.smartScore) :
      activePersona === 'streaming' ? (resA.personaScores?.streamingScore ?? resA.smartScore) :
      activePersona === 'ai_bypass' ? (resA.personaScores?.aiScore ?? resA.smartScore) :
      activePersona === 'upload' ? (resA.personaScores?.uploadScore ?? resA.smartScore) :
      (resA.personaScores?.overallScore ?? resA.smartScore)
    ) : 0;

    const scoreB = resB ? (
      activePersona === 'gaming' ? (resB.personaScores?.gamingScore ?? resB.smartScore) :
      activePersona === 'streaming' ? (resB.personaScores?.streamingScore ?? resB.smartScore) :
      activePersona === 'ai_bypass' ? (resB.personaScores?.aiScore ?? resB.smartScore) :
      activePersona === 'upload' ? (resB.personaScores?.uploadScore ?? resB.smartScore) :
      (resB.personaScores?.overallScore ?? resB.smartScore)
    ) : 0;

    return scoreB - scoreA;
  });

  const healthyCount = configsList.filter(c => testResults[c.raw]?.isHealthy).length;

  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-xl space-y-4" id="card-results">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <ArrowUpDown className="w-5 h-5 text-[#03DAC6]" />
          <div>
            <h2 className="text-base font-bold font-display text-white">
              {strings.testResultsTitle} ({sortedConfigs.length})
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              {healthyCount} {lang === 'FA' ? "کانفیگ متصل و سالم" : "healthy nodes"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#6200EE] hover:bg-[#5000C8] rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'FA' ? "صادرات (Clash/Sing-box)" : "Export Configs"}</span>
          </button>

          <button 
            onClick={onCopyHealthy}
            id="btn-copy-healthy"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#03DAC6]" />
            <span>{strings.exportHealthyBtn}</span>
          </button>

          <button 
            onClick={onSaveHealthyFile}
            id="btn-save-healthy"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#03DAC6]" />
            <span>{lang === 'FA' ? "ذخیره فایل" : "Save File"}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#121212] p-3 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-medium">
            {lang === 'FA' ? "دامنه خروجی کانفیگ‌های سالم:" : "Healthy Export Limit Range:"}
          </span>
          <div className="flex rounded-lg overflow-hidden border border-neutral-800">
            <button
              onClick={() => onChangeCopyLimitMode('all')}
              className={`px-3 py-1.5 font-bold transition-all cursor-pointer ${copyLimitMode === 'all' ? 'bg-[#6200EE] text-white' : 'bg-[#1E1E1E] text-neutral-400 hover:text-white'}`}
            >
              {strings.copyAllConfigs}
            </button>
            <button
              onClick={() => onChangeCopyLimitMode('limited')}
              className={`px-3 py-1.5 font-bold transition-all cursor-pointer ${copyLimitMode === 'limited' ? 'bg-[#6200EE] text-white' : 'bg-[#1E1E1E] text-neutral-400 hover:text-white'}`}
            >
              {strings.copyLimitedConfigs}
            </button>
          </div>
        </div>

        {copyLimitMode === 'limited' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-neutral-500 font-mono text-[11px]">
              {strings.copyLimitCountLabel}:
            </span>
            <input 
              type="number" 
              min="1"
              value={copyLimitInput}
              onChange={e => onChangeCopyLimitInput(e.target.value)}
              className="w-16 px-2.5 py-1 bg-[#1E1E1E] border border-neutral-800 rounded text-center text-xs font-mono font-bold text-[#03DAC6] focus:outline-none focus:border-[#6200EE]"
            />
          </div>
        )}
      </div>

      <ResultsFilterBar
        filterOptions={filterOptions}
        onChangeFilterOptions={onChangeFilterOptions}
        onDeduplicate={onDeduplicate}
        availableProtocols={availableProtocols}
        strings={strings}
        lang={lang}
      />

      <div className="space-y-3.5">
        {sortedConfigs.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 text-xs font-mono">
            {strings.noConfigsFound}
          </div>
        ) : (
          sortedConfigs.map(config => {
            const res = testResults[config.raw];
            const isActive = activeTestIndex === configsList.findIndex(c => c.raw === config.raw);

            return (
              <ConfigResultCard
                key={config.raw}
                config={config}
                result={res}
                isActive={isActive}
                activePersona={activePersona}
                onDelete={onDeleteConfig}
                onCopy={onCopySingle}
                onShowQr={onShowQr}
                strings={strings}
                lang={lang}
              />
            );
          })
        )}
      </div>
    </section>
  );
};

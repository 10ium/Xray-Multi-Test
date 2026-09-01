import React from 'react';
import { Search, Layers, CheckSquare, Square } from 'lucide-react';
import { FilterOptions, Translation } from '../../types';

interface ResultsFilterBarProps {
  filterOptions: FilterOptions;
  onChangeFilterOptions: (options: FilterOptions) => void;
  onDeduplicate: () => void;
  availableProtocols: string[];
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const ResultsFilterBar: React.FC<ResultsFilterBarProps> = ({
  filterOptions,
  onChangeFilterOptions,
  onDeduplicate,
  availableProtocols,
  strings,
  lang
}) => {
  return (
    <div className="bg-[#121212] p-3.5 rounded-xl border border-neutral-800 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={filterOptions.searchQuery}
            onChange={e => onChangeFilterOptions({ ...filterOptions, searchQuery: e.target.value })}
            placeholder={strings.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#03DAC6]"
          />
        </div>

        {/* Protocol Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterOptions.selectedProtocol}
            onChange={e => onChangeFilterOptions({ ...filterOptions, selectedProtocol: e.target.value })}
            className="px-3 py-2 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#6200EE]"
          >
            <option value="all">{strings.filterAllProtocols}</option>
            {availableProtocols.map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={filterOptions.sortBy}
            onChange={e => onChangeFilterOptions({ ...filterOptions, sortBy: e.target.value as any })}
            className="px-3 py-2 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-xs font-sans text-neutral-200 focus:outline-none focus:border-[#6200EE]"
          >
            <option value="score">{lang === 'FA' ? "مرتب‌سازی: بالاترین امتیاز" : "Sort: Highest Score"}</option>
            <option value="ping">{lang === 'FA' ? "مرتب‌سازی: کمترین تأخیر" : "Sort: Lowest Ping"}</option>
            <option value="download">{lang === 'FA' ? "مرتب‌سازی: بیشترین دانلود" : "Sort: Fastest Download"}</option>
            <option value="jitter">{lang === 'FA' ? "مرتب‌سازی: کمترین جیتر" : "Sort: Lowest Jitter"}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/60 text-xs">
        {/* Healthy Only Toggle */}
        <button
          onClick={() => onChangeFilterOptions({ ...filterOptions, healthyOnly: !filterOptions.healthyOnly })}
          className="flex items-center gap-2 text-neutral-300 hover:text-white cursor-pointer select-none"
        >
          <span className="text-[#03DAC6]">
            {filterOptions.healthyOnly ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
          </span>
          <span>{strings.filterHealthyOnly}</span>
        </button>

        {/* Deduplicate Button */}
        <button
          onClick={onDeduplicate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6200EE]/15 hover:bg-[#6200EE]/25 border border-[#6200EE]/30 text-[#03DAC6] rounded-lg font-bold transition-all cursor-pointer active:scale-95 text-[11px]"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{strings.deduplicateBtn}</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Copy, QrCode } from 'lucide-react';
import { XrayConfig, TestResult, Translation, UserPersona } from '../../types';

interface ConfigResultCardProps {
  config: XrayConfig;
  result?: TestResult;
  isActive: boolean;
  activePersona: UserPersona;
  onDelete: (raw: string) => void;
  onCopy: (raw: string) => void;
  onShowQr: (config: XrayConfig) => void;
  strings: Translation;
  lang: 'FA' | 'EN';
}

export const ConfigResultCard: React.FC<ConfigResultCardProps> = ({
  config,
  result,
  isActive,
  activePersona,
  onDelete,
  onCopy,
  onShowQr,
  strings,
  lang
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    if (score >= 50) return 'text-[#03DAC6] bg-[#03DAC6]/10 border-[#03DAC6]/30';
    if (score >= 25) return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
  };

  const currentScore = result ? (
    activePersona === 'gaming' ? (result.personaScores?.gamingScore ?? result.smartScore) :
    activePersona === 'streaming' ? (result.personaScores?.streamingScore ?? result.smartScore) :
    activePersona === 'ai_bypass' ? (result.personaScores?.aiScore ?? result.smartScore) :
    activePersona === 'upload' ? (result.personaScores?.uploadScore ?? result.smartScore) :
    (result.personaScores?.overallScore ?? result.smartScore)
  ) : 0;

  return (
    <motion.div 
      layout
      className={`p-4 rounded-xl border transition-all ${
        isActive 
          ? 'border-[#03DAC6] bg-[#03DAC6]/5 shadow-lg shadow-[#03DAC6]/5 ring-1 ring-[#03DAC6]' 
          : 'border-neutral-800/80 bg-[#121212]/80 hover:border-neutral-700'
      }`}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 max-w-full overflow-hidden">
            <span className="text-[10px] sm:text-xs font-mono font-bold bg-[#6200EE]/20 border border-[#6200EE]/30 text-[#03DAC6] px-1.5 py-0.5 rounded uppercase shrink-0">
              {config.protocol}
            </span>
            {config.security && config.security !== 'none' && (
              <span className="text-[9px] font-mono bg-neutral-800 text-neutral-300 px-1 py-0.5 rounded uppercase shrink-0">
                {config.security}
              </span>
            )}
            <h3 className="text-xs font-bold font-sans text-neutral-100 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md" title={config.remarks}>
              {config.remarks}
            </h3>
          </div>
          <p className="text-[10px] font-mono text-neutral-500 truncate max-w-[160px] xs:max-w-[240px] sm:max-w-md" dir="ltr" title={`${config.address}:${config.port}`}>
            {config.address}:{config.port}
          </p>
        </div>

        {/* Score and action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {result ? (
            <div className={`px-2.5 py-1 rounded-xl border text-right shrink-0 ${getScoreColor(currentScore)}`}>
              <div className="text-sm font-black font-mono leading-none">{currentScore.toFixed(1)}</div>
              <div className="text-[8px] uppercase tracking-wider font-mono opacity-80 mt-0.5">{strings.scoreBadgeLabel}</div>
            </div>
          ) : (
            <div className="text-xs font-mono text-neutral-600 italic shrink-0">
              {isActive ? strings.statusChecking : (lang === 'FA' ? "در انتظار تست" : "Pending")}
            </div>
          )}

          <div className="flex items-center gap-1 border-r border-neutral-800 pr-1 mr-1">
            <button
              onClick={() => onShowQr(config)}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-[#03DAC6] rounded-lg transition-all active:scale-90 cursor-pointer"
              title={strings.showQrCode}
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onCopy(config.raw)}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(config.raw)}
              className="p-1.5 hover:bg-red-950/40 text-neutral-500 hover:text-red-400 rounded-lg transition-all active:scale-90 cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      {result && (
        <div className="space-y-2.5 pt-3 border-t border-neutral-800/50">
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2">
            
            {/* TCP Ping */}
            <div className="bg-[#1E1E1E] p-2 rounded-lg border border-neutral-800 text-center space-y-0.5 min-w-0">
              <span className="block text-[9px] text-neutral-500 font-bold uppercase font-display truncate">{strings.tcpPingLabel}</span>
              <span className={`block text-xs font-mono font-bold truncate ${result.tcpPing > 0 ? 'text-[#03DAC6]' : 'text-rose-500'}`}>
                {result.tcpPing > 0 ? `${result.tcpPing} ms` : strings.statusFailed}
              </span>
            </div>

            {/* Jitter */}
            <div className="bg-[#1E1E1E] p-2 rounded-lg border border-neutral-800 text-center space-y-0.5 min-w-0">
              <span className="block text-[9px] text-neutral-500 font-bold uppercase font-display truncate">{strings.jitterLabel}</span>
              <span className={`block text-xs font-mono font-bold truncate ${result.jitter >= 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                {result.jitter >= 0 ? `±${result.jitter.toFixed(1)} ms` : strings.statusFailed}
              </span>
            </div>

            {/* Packet Loss */}
            <div className="bg-[#1E1E1E] p-2 rounded-lg border border-neutral-800 text-center space-y-0.5 min-w-0">
              <span className="block text-[9px] text-neutral-500 font-bold uppercase font-display truncate">{strings.packetLossLabel}</span>
              <span className={`block text-xs font-mono font-bold truncate ${result.packetLossRate === 0 ? 'text-emerald-400' : (result.packetLossRate < 10 ? 'text-amber-400' : 'text-rose-400')}`}>
                {result.isHealthy ? `${result.packetLossRate}%` : '100%'}
              </span>
            </div>

            {/* Real Delay */}
            <div className="bg-[#1E1E1E] p-2 rounded-lg border border-neutral-800 text-center space-y-0.5 min-w-0">
              <span className="block text-[9px] text-neutral-500 font-bold uppercase font-display truncate">{strings.realDelayLabel}</span>
              <span className={`block text-xs font-mono font-bold truncate ${result.realDelay > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {result.realDelay > 0 ? `${result.realDelay} ms` : strings.statusFailed}
              </span>
            </div>

            {/* Download Speed */}
            <div className="bg-[#1E1E1E] p-2 rounded-lg border border-neutral-800 text-center space-y-0.5 min-w-0">
              <span className="block text-[9px] text-neutral-500 font-bold uppercase font-display truncate">{strings.downloadSpeedLabel}</span>
              <span className={`block text-xs font-mono font-bold truncate ${result.downloadSpeedMbps > 0 ? 'text-blue-400 font-black' : 'text-neutral-500'}`}>
                {result.downloadSpeedMbps > 0 ? `${result.downloadSpeedMbps.toFixed(1)} Mb/s` : '—'}
              </span>
            </div>

            {/* Upload Speed */}
            <div className="bg-[#1E1E1E] p-2 rounded-lg border border-neutral-800 text-center space-y-0.5 min-w-0 col-span-2 xs:col-span-1">
              <span className="block text-[9px] text-neutral-500 font-bold uppercase font-display truncate">{strings.uploadSpeedLabel}</span>
              <span className={`block text-xs font-mono font-bold truncate ${result.uploadSpeedMbps > 0 ? 'text-purple-400 font-black' : 'text-neutral-500'}`}>
                {result.uploadSpeedMbps > 0 ? `${result.uploadSpeedMbps.toFixed(1)} Mb/s` : '—'}
              </span>
            </div>

          </div>

          {/* Multi-protocol ping results */}
          {result.pingProtocolResults && Object.keys(result.pingProtocolResults).length > 0 && (
            <div className="bg-[#121212]/50 p-2.5 rounded-xl border border-neutral-800/60">
              <div className="text-[10px] font-mono text-neutral-400 mb-1.5 font-bold uppercase tracking-wider">
                {lang === 'FA' ? "تأخیر پروتکل‌های پینگ چندگانه" : "Multi-Protocol Ping Latencies"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(result.pingProtocolResults).map(([key, item]) => {
                  const label = key === 'incyPing' ? 'INCY Ping' :
                                key === 'tcpConnect' ? 'TCP Connect' :
                                key === 'httpGet' ? 'HTTP GET' :
                                key === 'httpHead' ? 'HTTP HEAD' :
                                key === 'icmpPing' ? 'ICMP Ping' : key;
                  return (
                    <div key={key} className="bg-[#1E1E1E]/80 px-2 py-1.5 rounded border border-neutral-800/80 text-center text-[10px]">
                      <span className="block text-[8px] text-neutral-400 font-mono font-semibold truncate uppercase">{label}</span>
                      <span className={`block font-mono font-bold mt-0.5 truncate ${item.success && item.rttMs > 0 ? 'text-[#03DAC6]' : 'text-neutral-500'}`}>
                        {item.success && item.rttMs > 0 ? `${item.rttMs} ms` : strings.statusFailed}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Site reachability diagnostics */}
          {result.siteReports && result.siteReports.length > 0 && (
            <div className="pt-2 border-t border-neutral-800/30 flex flex-wrap gap-1.5 max-w-full overflow-hidden">
              {result.siteReports.map(report => {
                const isSafe = report.status === 'SAFE';
                const statusColor = isSafe 
                  ? 'text-emerald-400 border-emerald-950/40 bg-emerald-950/20' 
                  : 'text-rose-400 border-rose-950/40 bg-rose-950/20';
                
                return (
                  <span 
                    key={report.domain}
                    className={`text-[10px] font-sans px-2.5 py-1 border rounded-lg flex items-center gap-1.5 ${statusColor} max-w-full overflow-hidden`}
                    title={`${report.domain} (${isSafe ? `${report.rttMs}ms` : report.status.toLowerCase()})`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    <span className="truncate">{report.domain} ({isSafe ? `${report.rttMs}ms` : report.status.toLowerCase()})</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

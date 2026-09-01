import React from 'react';
import { 
  Settings, Activity, Sliders, Globe, ArrowUpDown, 
  Download, CheckSquare, Square 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Translation } from '../../types';

export const REAL_DELAY_SERVERS = [
  { name: "Cloudflare (Recommended)", url: "https://cp.cloudflare.com/generate_204" },
  { name: "Google Portal", url: "https://www.google.com/generate_204" },
  { name: "GStatic CDN", url: "https://www.gstatic.com/generate_204" },
  { name: "Connectivity Check", url: "https://connectivitycheck.gstatic.com/generate_204" },
  { name: "Apple Success Page", url: "https://www.apple.com/library/test/success.html" },
  { name: "Custom URL", url: "custom" }
];

export const SPEED_TEST_SERVERS = [
  { name: "Cloudflare (1MB Size)", url: "https://speed.cloudflare.com/__down?bytes=1048576" },
  { name: "Cloudflare (2MB Size)", url: "https://speed.cloudflare.com/__down?bytes=2097152" },
  { name: "Cloudflare (5MB Size)", url: "https://speed.cloudflare.com/__down?bytes=5242880" },
  { name: "Netflix CDN (Fast.com)", url: "https://fast.com" },
  { name: "Custom URL", url: "custom" }
];

interface DiagnosticsSettingsCardProps {
  testPreset: 'ultra' | 'balanced' | 'stable' | 'custom';
  onApplyTestPreset: (preset: 'ultra' | 'balanced' | 'stable') => void;
  onSetCustomPreset: () => void;

  isTcpPingChecked: boolean;
  setIsTcpPingChecked: (v: boolean) => void;
  pingTimeoutInput: string;
  setPingTimeoutInput: (v: string) => void;

  isTcpConnectEnabled: boolean;
  setIsTcpConnectEnabled: (v: boolean) => void;
  tcpConnectTimeout: string;
  setTcpConnectTimeout: (v: string) => void;
  tcpConnectCount: string;
  setTcpConnectCount: (v: string) => void;

  isRealDelayChecked: boolean;
  setIsRealDelayChecked: (v: boolean) => void;
  realDelayUrlInput: string;
  setRealDelayUrlInput: (v: string) => void;
  realDelayTimeoutInput: string;
  setRealDelayTimeoutInput: (v: string) => void;

  isJitterChecked: boolean;
  setIsJitterChecked: (v: boolean) => void;
  jitterPingCountInput: string;
  setJitterPingCountInput: (v: string) => void;

  isWebsiteReachChecked: boolean;
  setIsWebsiteReachChecked: (v: boolean) => void;

  isDownloadSpeedChecked: boolean;
  setIsDownloadSpeedChecked: (v: boolean) => void;
  speedTestUrlInput: string;
  setSpeedTestUrlInput: (v: string) => void;
  speedTestVolumeInput: string;
  setSpeedTestVolumeInput: (v: string) => void;
  isCustomVolume: boolean;
  setIsCustomVolume: (v: boolean) => void;
  customVolumeMB: string;
  setCustomVolumeMB: (v: string) => void;

  isUploadSpeedChecked: boolean;
  setIsUploadSpeedChecked: (v: boolean) => void;

  socksPortInput: string;
  setSocksPortInput: (v: string) => void;
  concurrencyInput: string;
  setConcurrencyInput: (v: string) => void;

  strings: Translation;
  lang: 'FA' | 'EN';
}

export const DiagnosticsSettingsCard: React.FC<DiagnosticsSettingsCardProps> = ({
  testPreset,
  onApplyTestPreset,
  onSetCustomPreset,
  isTcpPingChecked,
  setIsTcpPingChecked,
  pingTimeoutInput,
  setPingTimeoutInput,
  isTcpConnectEnabled,
  setIsTcpConnectEnabled,
  tcpConnectTimeout,
  setTcpConnectTimeout,
  tcpConnectCount,
  setTcpConnectCount,
  isRealDelayChecked,
  setIsRealDelayChecked,
  realDelayUrlInput,
  setRealDelayUrlInput,
  realDelayTimeoutInput,
  setRealDelayTimeoutInput,
  isJitterChecked,
  setIsJitterChecked,
  jitterPingCountInput,
  setJitterPingCountInput,
  isWebsiteReachChecked,
  setIsWebsiteReachChecked,
  isDownloadSpeedChecked,
  setIsDownloadSpeedChecked,
  speedTestUrlInput,
  setSpeedTestUrlInput,
  speedTestVolumeInput,
  setSpeedTestVolumeInput,
  isCustomVolume,
  setIsCustomVolume,
  customVolumeMB,
  setCustomVolumeMB,
  isUploadSpeedChecked,
  setIsUploadSpeedChecked,
  socksPortInput,
  setSocksPortInput,
  concurrencyInput,
  setConcurrencyInput,
  strings,
  lang
}) => {
  return (
    <section className="bg-[#1E1E1E] p-5 rounded-2xl border border-neutral-800 shadow-lg" id="card-diagnostics-settings">
      <div className="flex items-center gap-2.5 mb-4 text-[#03DAC6]">
        <Settings className="w-5 h-5" />
        <h2 className="text-sm font-bold tracking-wide uppercase font-display">{strings.settingsTitle}</h2>
      </div>

      {/* Presets Selector */}
      <div className="mb-5 bg-[#121212] p-2.5 rounded-xl border border-neutral-800/80">
        <span className="block text-[11px] font-mono text-neutral-400 uppercase mb-2 text-center">
          {lang === 'FA' ? "پروفایل پیش‌فرض تست سرعت و تاخیر" : "Diagnostic Speed & Latency Preset Profile"}
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {(['ultra', 'balanced', 'stable', 'custom'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                if (preset !== 'custom') {
                  onApplyTestPreset(preset);
                } else {
                  onSetCustomPreset();
                }
              }}
              className={`px-1 py-1.5 rounded-lg text-[10px] font-mono uppercase text-center transition-all border cursor-pointer ${
                testPreset === preset 
                  ? 'bg-[#6200EE] border-[#03DAC6]/40 text-white font-bold shadow' 
                  : 'bg-[#1E1E1E] border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {preset === 'ultra' && (lang === 'FA' ? 'فوق‌العاده' : 'Ultra')}
              {preset === 'balanced' && (lang === 'FA' ? 'متعادل' : 'Balanced')}
              {preset === 'stable' && (lang === 'FA' ? 'پایدار' : 'Stable')}
              {preset === 'custom' && (lang === 'FA' ? 'کاستوم' : 'Custom')}
            </button>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-neutral-500 font-mono text-center leading-normal">
          {testPreset === 'ultra' && (lang === 'FA' ? "پینگ کوتاه، تست سریع، همزمانی بالا" : "Fast pings, swift test, high concurrency")}
          {testPreset === 'balanced' && (lang === 'FA' ? "تنظیمات استاندارد بهینه برای کارهای روزمرگی" : "Standard balanced parameters for general use")}
          {testPreset === 'stable' && (lang === 'FA' ? "تست سنگین با سمپل‌های بیشتر و دقت بالا" : "Heavy tests with high samples & precise timing")}
          {testPreset === 'custom' && (lang === 'FA' ? "متغیرها به دلخواه شما سفارشی شده‌اند" : "Custom parameters modified manually")}
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-3 mb-5">
        <span className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider font-bold mb-1">
          {lang === 'FA' ? "پیکربندی ماژول‌های ارزیابی" : "Diagnostics Engine Modules"}
        </span>

        {/* 1. TCP Ping (Raw) */}
        <div className="bg-[#121212]/40 border border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-200">
          <div 
            onClick={() => {
              setIsTcpPingChecked(!isTcpPingChecked);
              onSetCustomPreset();
            }}
            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-neutral-800/20"
          >
            <div className="flex items-center gap-2.5">
              <Activity className={`w-4 h-4 ${isTcpPingChecked ? 'text-[#03DAC6]' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="block text-xs text-neutral-200 font-bold">
                  {lang === 'FA' ? "تست TCP Ping (تأخیر خام)" : "Raw TCP Ping Latency"}
                </span>
                <span className="block text-[9px] text-neutral-500">
                  {lang === 'FA' ? "سنجش اتصال لایه انتقال به سرور" : "Measures raw TCP connection delay"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${isTcpPingChecked ? 'bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/20' : 'bg-neutral-800/50 text-neutral-500 border border-neutral-800'}`}>
                {isTcpPingChecked ? (lang === 'FA' ? 'فعال' : 'ACTIVE') : (lang === 'FA' ? 'خاموش' : 'DISABLED')}
              </span>
              <button className="text-[#03DAC6]">
                {isTcpPingChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>
          </div>
          {isTcpPingChecked && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-3 pb-3 pt-2.5 border-t border-neutral-800/40 bg-[#121212]/15 text-[11px]"
            >
              <div>
                <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "زمان انتظار (میلی‌ثانیه):" : "Ping Timeout (ms):"}</span>
                <input 
                  type="number"
                  value={pingTimeoutInput}
                  onClick={(e) => e.stopPropagation()}
                  onChange={e => {
                    setPingTimeoutInput(e.target.value);
                    onSetCustomPreset();
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-[#6200EE]"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* 2. TCP Connect (Multi) */}
        <div className="bg-[#121212]/40 border border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-200">
          <div 
            onClick={() => {
              setIsTcpConnectEnabled(!isTcpConnectEnabled);
              onSetCustomPreset();
            }}
            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-neutral-800/20"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className={`w-4 h-4 ${isTcpConnectEnabled ? 'text-[#03DAC6]' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="block text-xs text-neutral-200 font-bold">
                  {lang === 'FA' ? "تست اتصال چندگانه TCP Connect" : "TCP Connect Multi-Ping"}
                </span>
                <span className="block text-[9px] text-neutral-500">
                  {lang === 'FA' ? "ارزیابی خط با بسته‌های موازی TCP" : "Multiple parallel TCP connection attempts"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${isTcpConnectEnabled ? 'bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/20' : 'bg-neutral-800/50 text-neutral-500 border border-neutral-800'}`}>
                {isTcpConnectEnabled ? (lang === 'FA' ? 'فعال' : 'ACTIVE') : (lang === 'FA' ? 'خاموش' : 'DISABLED')}
              </span>
              <button className="text-[#03DAC6]">
                {isTcpConnectEnabled ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>
          </div>
          {isTcpConnectEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-3 pb-3 pt-2.5 border-t border-neutral-800/40 bg-[#121212]/15 text-[11px] grid grid-cols-2 gap-3"
            >
              <div>
                <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "زمان انتظار (ms):" : "Timeout (ms):"}</span>
                <input 
                  type="number"
                  value={tcpConnectTimeout}
                  onClick={(e) => e.stopPropagation()}
                  onChange={e => {
                    setTcpConnectTimeout(e.target.value);
                    onSetCustomPreset();
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-[#6200EE]"
                />
              </div>
              <div>
                <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "تعداد تلاش:" : "Ping Count:"}</span>
                <input 
                  type="number"
                  value={tcpConnectCount}
                  onClick={(e) => e.stopPropagation()}
                  onChange={e => {
                    setTcpConnectCount(e.target.value);
                    onSetCustomPreset();
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-[#6200EE]"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* 3. HTTP Real Delay */}
        <div className="bg-[#121212]/40 border border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-200">
          <div 
            onClick={() => {
              setIsRealDelayChecked(!isRealDelayChecked);
              onSetCustomPreset();
            }}
            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-neutral-800/20"
          >
            <div className="flex items-center gap-2.5">
              <Globe className={`w-4 h-4 ${isRealDelayChecked ? 'text-[#03DAC6]' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="block text-xs text-neutral-200 font-bold">
                  {lang === 'FA' ? "تست تأخیر واقعی HTTP Real Delay" : "HTTP Real Delay via Proxy"}
                </span>
                <span className="block text-[9px] text-neutral-500">
                  {lang === 'FA' ? "برقراری اتصال کامل HTTP با سرور CDN" : "Full HTTP handshake with target url"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${isRealDelayChecked ? 'bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/20' : 'bg-neutral-800/50 text-neutral-500 border border-neutral-800'}`}>
                {isRealDelayChecked ? (lang === 'FA' ? 'فعال' : 'ACTIVE') : (lang === 'FA' ? 'خاموش' : 'DISABLED')}
              </span>
              <button className="text-[#03DAC6]">
                {isRealDelayChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>
          </div>
          {isRealDelayChecked && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-3 pb-3 pt-2.5 border-t border-neutral-800/40 bg-[#121212]/15 text-[11px] space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "سرور انتخابی:" : "Server Target:"}</span>
                  <select
                    value={REAL_DELAY_SERVERS.some(s => s.url === realDelayUrlInput) ? realDelayUrlInput : "custom"}
                    onClick={(e) => e.stopPropagation()}
                    onChange={e => {
                      const val = e.target.value;
                      if (val !== "custom") {
                        setRealDelayUrlInput(val);
                      } else {
                        setRealDelayUrlInput("custom");
                      }
                      onSetCustomPreset();
                    }}
                    className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-xs font-sans text-neutral-200 focus:outline-none focus:border-[#6200EE]"
                  >
                    {REAL_DELAY_SERVERS.map(s => (
                      <option key={s.url} value={s.url}>
                        {s.url === "custom" ? (lang === 'FA' ? "لینک سفارشی (دستی)" : "Custom URL (Manual)") : s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "زمان انتظار (ms):" : "Timeout (ms):"}</span>
                  <input 
                    type="number"
                    value={realDelayTimeoutInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={e => {
                      setRealDelayTimeoutInput(e.target.value);
                      onSetCustomPreset();
                    }}
                    className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-[#6200EE]"
                  />
                </div>
              </div>

              {(!REAL_DELAY_SERVERS.some(s => s.url === realDelayUrlInput) || realDelayUrlInput === "custom") && (
                <div onClick={(e) => e.stopPropagation()}>
                  <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "آدرس سفارشی:" : "Custom URL:"}</span>
                  <input
                    type="text"
                    value={realDelayUrlInput === "custom" ? "" : realDelayUrlInput}
                    onChange={e => {
                      setRealDelayUrlInput(e.target.value);
                      onSetCustomPreset();
                    }}
                    placeholder={lang === 'FA' ? "آدرس کامل (مثال: https://google.com/...)" : "Full URL (e.g., https://google.com/...)"}
                    className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-[#6200EE]/30 rounded-lg text-xs font-mono text-[#03DAC6] placeholder-neutral-600 focus:outline-none focus:border-[#03DAC6]"
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* 4. Jitter Variance */}
        <div className="bg-[#121212]/40 border border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-200">
          <div 
            onClick={() => {
              setIsJitterChecked(!isJitterChecked);
              onSetCustomPreset();
            }}
            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-neutral-800/20"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className={`w-4 h-4 ${isJitterChecked ? 'text-[#03DAC6]' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="block text-xs text-neutral-200 font-bold">
                  {lang === 'FA' ? "ارزیابی جیتر (نوسان تأخیر)" : "Jitter Variance Analysis"}
                </span>
                <span className="block text-[9px] text-neutral-500">
                  {lang === 'FA' ? "تحلیل انحراف استاندارد و پکت‌لاست" : "Tracks packet-to-packet latency jitter"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${isJitterChecked ? 'bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/20' : 'bg-neutral-800/50 text-neutral-500 border border-neutral-800'}`}>
                {isJitterChecked ? (lang === 'FA' ? 'فعال' : 'ACTIVE') : (lang === 'FA' ? 'خاموش' : 'DISABLED')}
              </span>
              <button className="text-[#03DAC6]">
                {isJitterChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>
          </div>
          {isJitterChecked && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-3 pb-3 pt-2.5 border-t border-neutral-800/40 bg-[#121212]/15 text-[11px]"
            >
              <div onClick={(e) => e.stopPropagation()}>
                <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "تعداد سمپل‌های تستی جیتر:" : "Jitter Pings count:"}</span>
                <input 
                  type="number"
                  value={jitterPingCountInput}
                  onChange={e => {
                    setJitterPingCountInput(e.target.value);
                    onSetCustomPreset();
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-[#6200EE]"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* 5. Website Reachability */}
        <div className="bg-[#121212]/40 border border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-200">
          <div 
            onClick={() => {
              setIsWebsiteReachChecked(!isWebsiteReachChecked);
              onSetCustomPreset();
            }}
            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-neutral-800/20"
          >
            <div className="flex items-center gap-2.5">
              <Globe className={`w-4 h-4 ${isWebsiteReachChecked ? 'text-[#03DAC6]' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="block text-xs text-neutral-200 font-bold">
                  {lang === 'FA' ? "بررسی دسترسی به دامنه‌های منتخب" : "Selected Websites Reachability"}
                </span>
                <span className="block text-[9px] text-neutral-500">
                  {lang === 'FA' ? "سنجش عبور ترافیک سرویس‌های مسدود" : "Verifies access to blocked global websites"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${isWebsiteReachChecked ? 'bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/20' : 'bg-neutral-800/50 text-neutral-500 border border-neutral-800'}`}>
                {isWebsiteReachChecked ? (lang === 'FA' ? 'فعال' : 'ACTIVE') : (lang === 'FA' ? 'خاموش' : 'DISABLED')}
              </span>
              <button className="text-[#03DAC6]">
                {isWebsiteReachChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* 6. Download Speed Test */}
        <div className="bg-[#121212]/40 border border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-200">
          <div 
            onClick={() => {
              setIsDownloadSpeedChecked(!isDownloadSpeedChecked);
              onSetCustomPreset();
            }}
            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-neutral-800/20"
          >
            <div className="flex items-center gap-2.5">
              <Download className={`w-4 h-4 ${isDownloadSpeedChecked ? 'text-[#03DAC6]' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="block text-xs text-neutral-200 font-bold">
                  {lang === 'FA' ? "تست سرعت دانلود ترافیکی" : "Download Speed Test"}
                </span>
                <span className="block text-[9px] text-neutral-500">
                  {lang === 'FA' ? "اندازه‌گیری پهنای باند واقعی دانلود با بارهای انتخابی" : "Measures download speeds in Mbps"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${isDownloadSpeedChecked ? 'bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/20' : 'bg-neutral-800/50 text-neutral-500 border border-neutral-800'}`}>
                {isDownloadSpeedChecked ? (lang === 'FA' ? 'فعال' : 'ACTIVE') : (lang === 'FA' ? 'خاموش' : 'DISABLED')}
              </span>
              <button className="text-[#03DAC6]">
                {isDownloadSpeedChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>
          </div>
          {isDownloadSpeedChecked && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-3 pb-3 pt-2.5 border-t border-neutral-800/40 bg-[#121212]/15 text-[11px] space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "سرور تست دانلود:" : "Download Server:"}</span>
                  <select
                    value={SPEED_TEST_SERVERS.some(s => s.url === speedTestUrlInput) ? speedTestUrlInput : "custom"}
                    onClick={(e) => e.stopPropagation()}
                    onChange={e => {
                      const val = e.target.value;
                      if (val !== "custom") {
                        setSpeedTestUrlInput(val);
                      } else {
                        setSpeedTestUrlInput("custom");
                      }
                      onSetCustomPreset();
                    }}
                    className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-xs font-sans text-neutral-200 focus:outline-none focus:border-[#6200EE]"
                  >
                    {SPEED_TEST_SERVERS.map(s => (
                      <option key={s.url} value={s.url}>
                        {s.url === "custom" ? (lang === 'FA' ? "لینک سفارشی (دستی)" : "Custom URL (Manual)") : s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-neutral-400 block mb-1 font-mono">{lang === 'FA' ? "حجم ترافیک آزمایشی:" : "Traffic Weight:"}</span>
                  <select
                    value={isCustomVolume ? "custom" : speedTestVolumeInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomVolume(true);
                        setSpeedTestVolumeInput(customVolumeMB);
                        const bytes = Math.round((parseFloat(customVolumeMB) || 15) * 1024 * 1024);
                        setSpeedTestUrlInput(`https://speed.cloudflare.com/__down?bytes=${bytes}`);
                      } else {
                        setIsCustomVolume(false);
                        setSpeedTestVolumeInput(val);
                        const bytes = parseInt(val) * 1024 * 1024;
                        setSpeedTestUrlInput(`https://speed.cloudflare.com/__down?bytes=${bytes}`);
                      }
                      onSetCustomPreset();
                    }}
                    className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#6200EE]"
                  >
                    <option value="1">1 MB</option>
                    <option value="2">2 MB</option>
                    <option value="5">5 MB</option>
                    <option value="10">10 MB</option>
                    <option value="custom">{lang === 'FA' ? "سفارشی..." : "Custom..."}</option>
                  </select>
                </div>
              </div>

              {isCustomVolume && (
                <div className="bg-[#1A1A1A]/80 p-2.5 border border-[#6200EE]/20 rounded-lg flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-neutral-400">
                    {lang === 'FA' ? "تعیین مگابایت دلخواه:" : "Custom weight (MB):"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={customVolumeMB}
                      onChange={e => {
                        const val = e.target.value;
                        setCustomVolumeMB(val);
                        setSpeedTestVolumeInput(val);
                        const num = parseFloat(val) || 15;
                        const bytes = Math.round(num * 1024 * 1024);
                        setSpeedTestUrlInput(`https://speed.cloudflare.com/__down?bytes=${bytes}`);
                        onSetCustomPreset();
                      }}
                      className="w-16 px-1.5 py-1 bg-[#121212] border border-[#6200EE]/40 rounded text-center text-xs font-mono font-bold text-[#03DAC6] focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-neutral-500">MB</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* 7. Upload Speed Test */}
        <div className="bg-[#121212]/40 border border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-200">
          <div 
            onClick={() => {
              setIsUploadSpeedChecked(!isUploadSpeedChecked);
              onSetCustomPreset();
            }}
            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-neutral-800/20"
          >
            <div className="flex items-center gap-2.5">
              <ArrowUpDown className={`w-4 h-4 ${isUploadSpeedChecked ? 'text-[#03DAC6]' : 'text-neutral-500'}`} />
              <div className="text-left">
                <span className="block text-xs text-neutral-200 font-bold">
                  {lang === 'FA' ? "تست سرعت آپلود ترافیکی" : "Upload Speed Test"}
                </span>
                <span className="block text-[9px] text-neutral-500">
                  {lang === 'FA' ? "سنجش پهنای باند بارگذاری بر روی تونل پروکسی" : "Simulated upload speed test in Mbps"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${isUploadSpeedChecked ? 'bg-[#03DAC6]/10 text-[#03DAC6] border border-[#03DAC6]/20' : 'bg-neutral-800/50 text-neutral-500 border border-neutral-800'}`}>
                {isUploadSpeedChecked ? (lang === 'FA' ? 'فعال' : 'ACTIVE') : (lang === 'FA' ? 'خاموش' : 'DISABLED')}
              </span>
              <button className="text-[#03DAC6]">
                {isUploadSpeedChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-600" />}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Parameters */}
      <div className="border-t border-neutral-800/50 pt-4 space-y-3">
        <span className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider font-bold mb-1">
          {lang === 'FA' ? "پارامترهای عمومی عیب‌یابی" : "General Engine Parameters"}
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5">{strings.localSocksPort}</label>
            <input 
              type="number" 
              value={socksPortInput}
              onChange={e => setSocksPortInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#6200EE]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5">{lang === 'FA' ? "حد همزمانی تست‌ها" : "Concurrency limit"}</label>
            <input 
              type="number" 
              value={concurrencyInput}
              onChange={e => {
                setConcurrencyInput(e.target.value);
                onSetCustomPreset();
              }}
              className="w-full px-3 py-2 bg-[#121212] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#6200EE]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

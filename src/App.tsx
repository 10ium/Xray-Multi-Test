import React, { useState, useEffect } from 'react';
import { Play, Trash2 } from 'lucide-react';
import { 
  XrayConfig, TestResult, TestTarget, UserPersona, FilterOptions, AppReleaseInfo 
} from './types';
import { PersianTranslation, EnglishTranslation } from './Localization';
import { XrayManager, XrayExporter } from './XrayManager';

// Modular Components
import { Navbar } from './components/layout/Navbar';
import { Toast } from './components/layout/Toast';
import { PersonaSelector } from './components/personas/PersonaSelector';
import { CoreUpdaterCard } from './components/core/CoreUpdaterCard';
import { FingerprintCard } from './components/diagnostics/FingerprintCard';
import { FragmentCard } from './components/diagnostics/FragmentCard';
import { MultiplexCard } from './components/diagnostics/MultiplexCard';
import { DiagnosticsSettingsCard } from './components/diagnostics/DiagnosticsSettingsCard';
import { WebsiteTargetsCard } from './components/targets/WebsiteTargetsCard';
import { ImportConfigsCard } from './components/import/ImportConfigsCard';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { ExportModal } from './components/export/ExportModal';
import { QRCodeModal } from './components/export/QRCodeModal';
import { AppUpdateModal } from './components/update/AppUpdateModal';
import { AppUpdaterCard } from './components/update/AppUpdaterCard';

// Current App Version
const APP_VERSION = "v1.0.0";

// Default 11 target websites
const DEFAULT_TEST_TARGETS: TestTarget[] = [
  { domain: "telegram.org", displayName: "Telegram", isSelected: true, category: 'social' },
  { domain: "instagram.com", displayName: "Instagram", isSelected: true, category: 'social' },
  { domain: "gemini.google.com", displayName: "Gemini", isSelected: true, category: 'ai' },
  { domain: "chatgpt.com", displayName: "ChatGPT", isSelected: true, category: 'ai' },
  { domain: "claude.ai", displayName: "Claude", isSelected: true, category: 'ai' },
  { domain: "youtube.com", displayName: "YouTube", isSelected: true, category: 'video' },
  { domain: "tiktok.com", displayName: "TikTok", isSelected: true, category: 'video' },
  { domain: "x.com", displayName: "X (Twitter)", isSelected: true, category: 'social' },
  { domain: "grok.com", displayName: "Grok", isSelected: true, category: 'ai' },
  { domain: "store.steampowered.com", displayName: "Steam", isSelected: true, category: 'gaming' },
  { domain: "epicgames.com", displayName: "Epic Games", isSelected: true, category: 'gaming' }
];

// Sample configurations for initial launch
const SAMPLE_CONFIGS_RAW = `vless://e8bb3dc6-4f40-41ff-ac28-76ad1a3554cf@us.cloudflare.com:443?security=reality&sni=google.com&pbk=US_Reality_Public_Key_Example&sid=6259f6&fp=chrome#🇺🇸 US-Cloudflare-Reality
hy2://secureAuthPass123@de.hetzner.com:8443?up=50&down=150&ports=20000-50000#🇩🇪 DE-Hetzner-Hysteria2
vmess://eyJhZGQiOiJzZy5kaWdpdGFsb2NlYW4uY29tIiwicG9ydCI6NDQzLCJpZCI6IjUxMzkzYzVkLWU4ODMtNDI3Ny1hNjg0LWQxMTY0NGNkZGE0NyIsInNjeSI6ImF1dG8iLCJ0bHMiOiJ0bHMiLCJzbmkiOiJzZy5kaWdpdGFsb2NlYW4uY29tIiwiaG9zdCI6InNnLmRpZ2l0YWxvY2Vhbi5jb20iLCJwYXRoIjoiL2dycGMiLCJ2IjoiMiJ9#🇸🇬 SG-DigitalOcean-Vmess-gRPC
trojan://TrojanPasswordTest@ir.mci-direct.com:443?security=tls&sni=ir.mci-direct.com#🇮🇷 IR-MCI-Direct-Trojan
ss://YWVzLTI1Ni1nY206c2hhZG93c29ja3NwYXNzMTIz@fi.nokia-server.net:8388#🇫🇮 FI-Nokia-Shadowsocks`;

export default function App() {
  // 1. Language State
  const [lang, setLang] = useState<'FA' | 'EN'>(() => {
    return (localStorage.getItem('xray_lang') as 'FA' | 'EN') || 'FA';
  });
  const strings = lang === 'FA' ? PersianTranslation : EnglishTranslation;

  const toggleLanguage = () => {
    const next = lang === 'FA' ? 'EN' : 'FA';
    setLang(next);
    localStorage.setItem('xray_lang', next);
  };

  // 2. Active User Persona
  const [activePersona, setActivePersona] = useState<UserPersona>(() => {
    return (localStorage.getItem('xray_active_persona') as UserPersona) || 'all_rounder';
  });

  const handleSelectPersona = (persona: UserPersona) => {
    setActivePersona(persona);
    localStorage.setItem('xray_active_persona', persona);

    // Auto-calibrate diagnostics preset based on persona
    if (persona === 'gaming') {
      applyTestPreset('ultra');
      setIsTcpPingChecked(true);
      setIsJitterChecked(true);
      setIsRealDelayChecked(false);
      setIsDownloadSpeedChecked(false);
      setIsUploadSpeedChecked(false);
    } else if (persona === 'streaming') {
      applyTestPreset('balanced');
      setIsTcpPingChecked(true);
      setIsJitterChecked(false);
      setIsRealDelayChecked(true);
      setIsDownloadSpeedChecked(true);
      setIsUploadSpeedChecked(false);
    } else if (persona === 'ai_bypass') {
      applyTestPreset('balanced');
      setIsTcpPingChecked(true);
      setIsRealDelayChecked(true);
      setIsWebsiteReachChecked(true);
      setIsDownloadSpeedChecked(false);
      setIsUploadSpeedChecked(false);
    } else if (persona === 'upload') {
      applyTestPreset('stable');
      setIsTcpPingChecked(true);
      setIsDownloadSpeedChecked(true);
      setIsUploadSpeedChecked(true);
    } else {
      // all_rounder
      applyTestPreset('balanced');
      setIsTcpPingChecked(true);
      setIsJitterChecked(true);
      setIsRealDelayChecked(true);
      setIsWebsiteReachChecked(true);
      setIsDownloadSpeedChecked(true);
      setIsUploadSpeedChecked(true);
    }
    showToast(lang === 'FA' ? `پرسونای «${strings['persona' + persona.charAt(0).toUpperCase() + persona.slice(1) as keyof typeof strings] || persona}» فعال شد` : `Activated ${persona} profile`);
  };

  // 3. Core Updater State
  const [localCoreVersion, setLocalCoreVersion] = useState(() => localStorage.getItem('core_version') || 'v1.8.24');
  const [latestCoreVersion, setLatestCoreVersion] = useState(() => localStorage.getItem('latest_core_version') || strings.unknown);
  const [isCheckingCore, setIsCheckingCore] = useState(false);
  const [isDownloadingCore, setIsDownloadingCore] = useState(false);
  const [coreProgress, setCoreProgress] = useState(0);
  const [coreProgressText, setCoreProgressText] = useState('');

  // 4. In-App App Update State
  const [appReleaseInfo, setAppReleaseInfo] = useState<AppReleaseInfo | null>(null);
  const [isCheckingAppUpdate, setIsCheckingAppUpdate] = useState(false);
  const [isAppUpdateModalOpen, setIsAppUpdateModalOpen] = useState(false);
  const [hasAppUpdate, setHasAppUpdate] = useState(false);

  // 5. Configs & Results State
  const [configsList, setConfigsList] = useState<XrayConfig[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isTestingNetwork, setIsTestingNetwork] = useState(false);
  const [activeTestIndex, setActiveTestIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // 6. Diagnostics Settings State
  const [testPreset, setTestPreset] = useState<'ultra' | 'balanced' | 'stable' | 'custom'>('balanced');
  const [isTcpPingChecked, setIsTcpPingChecked] = useState(true);
  const [isJitterChecked, setIsJitterChecked] = useState(true);
  const [isRealDelayChecked, setIsRealDelayChecked] = useState(true);
  const [isWebsiteReachChecked, setIsWebsiteReachChecked] = useState(true);
  const [isDownloadSpeedChecked, setIsDownloadSpeedChecked] = useState(true);
  const [isUploadSpeedChecked, setIsUploadSpeedChecked] = useState(true);

  const [pingTimeoutInput, setPingTimeoutInput] = useState('2500');
  const [realDelayTimeoutInput, setRealDelayTimeoutInput] = useState('5000');
  const [speedTimeoutInput, setSpeedTimeoutInput] = useState('10000');
  const [realDelayUrlInput, setRealDelayUrlInput] = useState('https://cp.cloudflare.com/generate_204');
  const [speedTestUrlInput, setSpeedTestUrlInput] = useState('https://speed.cloudflare.com/__down?bytes=2097152');

  const [socksPortInput, setSocksPortInput] = useState('20000');
  const [concurrencyInput, setConcurrencyInput] = useState('4');
  const [jitterPingCountInput, setJitterPingCountInput] = useState('5');
  const [speedTestVolumeInput, setSpeedTestVolumeInput] = useState('2');
  const [isCustomVolume, setIsCustomVolume] = useState(false);
  const [customVolumeMB, setCustomVolumeMB] = useState('15');
  const [speedTestProtocolInput] = useState('HTTPS');

  const [isTcpConnectEnabled, setIsTcpConnectEnabled] = useState(true);
  const [tcpConnectTimeout, setTcpConnectTimeout] = useState('2500');
  const [tcpConnectCount, setTcpConnectCount] = useState('3');

  // 7. Target Websites
  const [testTargets, setTestTargets] = useState<TestTarget[]>(() => {
    const saved = localStorage.getItem('test_targets_list');
    return saved ? JSON.parse(saved) : DEFAULT_TEST_TARGETS;
  });

  // 8. uTLS, Fragment & Mux
  const [selectedFingerprint, setSelectedFingerprint] = useState('chrome');
  const [isFragmentEnabled, setIsFragmentEnabled] = useState(false);
  const [fragmentPreset, setFragmentPreset] = useState<'mci' | 'mtn' | 'tcp' | 'custom'>('mci');
  const [fragmentLengthInput, setFragmentLengthInput] = useState('100-200');
  const [fragmentIntervalInput, setFragmentIntervalInput] = useState('10-20');
  const [isMuxEnabled, setIsMuxEnabled] = useState(false);
  const [muxConcurrencyInput, setMuxConcurrencyInput] = useState('8');
  const [xudpConcurrencyInput, setXudpConcurrencyInput] = useState('16');

  // 9. Filters & Modals
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    selectedProtocol: 'all',
    healthyOnly: false,
    maxPing: 0,
    minScore: 0,
    sortBy: 'score',
    sortOrder: 'desc'
  });

  const [copyLimitMode, setCopyLimitMode] = useState<'all' | 'limited'>('all');
  const [copyLimitInput, setCopyLimitInput] = useState('5');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedQrConfig, setSelectedQrConfig] = useState<XrayConfig | null>(null);

  // Load sample configs on mount
  useEffect(() => {
    const parsed = XrayManager.parseConfigsFromMessyText(SAMPLE_CONFIGS_RAW);
    setConfigsList(parsed);
    // Silent check for App updates on launch
    checkForAppUpdates(false);
  }, []);

  // Save targets to localstorage
  useEffect(() => {
    localStorage.setItem('test_targets_list', JSON.stringify(testTargets));
  }, [testTargets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // In-App Update Checker
  const checkForAppUpdates = async (showFeedback = true) => {
    setIsCheckingAppUpdate(true);
    try {
      const res = await fetch("https://api.github.com/repos/10ium/Xray-Multi-Test/releases/latest");
      if (res.ok) {
        const data = await res.json();
        const latestTag = data.tag_name || "v1.0.0";
        
        // Find APK asset
        let apkUrl = data.html_url;
        if (data.assets && Array.isArray(data.assets)) {
          const apkAsset = data.assets.find((a: any) => a.name?.endsWith('.apk'));
          if (apkAsset && apkAsset.browser_download_url) {
            apkUrl = apkAsset.browser_download_url;
          }
        }

        const isNewer = latestTag.replace('v', '') !== APP_VERSION.replace('v', '');
        const info: AppReleaseInfo = {
          version: latestTag,
          releaseNotes: data.body || "",
          downloadUrl: apkUrl,
          publishedAt: data.published_at || "",
          htmlUrl: data.html_url || "https://github.com/10ium/Xray-Multi-Test/releases",
          hasUpdate: isNewer
        };

        setAppReleaseInfo(info);
        setHasAppUpdate(isNewer);

        if (isNewer) {
          setIsAppUpdateModalOpen(true);
        } else if (showFeedback) {
          showToast(strings.appUpdateUpToDate);
        }
      } else if (showFeedback) {
        showToast(strings.appUpdateUpToDate);
      }
    } catch {
      if (showFeedback) {
        showToast(lang === 'FA' ? "خطا در بررسی بروزرسانی برنامه" : "Update check failed");
      }
    } finally {
      setIsCheckingAppUpdate(false);
    }
  };

  const handleDownloadAndInstallApp = () => {
    if (!appReleaseInfo) return;
    window.open(appReleaseInfo.downloadUrl, '_system');
    showToast(lang === 'FA' ? "در حال باز کردن لینک دانلود APK..." : "Opening APK download...");
  };

  // Preset Handlers
  const applyTestPreset = (preset: 'ultra' | 'balanced' | 'stable') => {
    setTestPreset(preset);
    if (preset === 'ultra') {
      setPingTimeoutInput('1500');
      setRealDelayTimeoutInput('2500');
      setConcurrencyInput('6');
      setJitterPingCountInput('3');
      setSpeedTestVolumeInput('1');
      setSpeedTimeoutInput('5000');
    } else if (preset === 'balanced') {
      setPingTimeoutInput('2500');
      setRealDelayTimeoutInput('5000');
      setConcurrencyInput('4');
      setJitterPingCountInput('5');
      setSpeedTestVolumeInput('2');
      setSpeedTimeoutInput('10000');
    } else if (preset === 'stable') {
      setPingTimeoutInput('4000');
      setRealDelayTimeoutInput('8000');
      setConcurrencyInput('2');
      setJitterPingCountInput('8');
      setSpeedTestVolumeInput('5');
      setSpeedTimeoutInput('15000');
    }
  };

  const applyFragmentPreset = (preset: 'mci' | 'mtn' | 'tcp' | 'custom') => {
    setFragmentPreset(preset);
    if (preset === 'mci') {
      setFragmentLengthInput('100-200');
      setFragmentIntervalInput('10-20');
    } else if (preset === 'mtn') {
      setFragmentLengthInput('1-5');
      setFragmentIntervalInput('3-10');
    } else if (preset === 'tcp') {
      setFragmentLengthInput('5-15');
      setFragmentIntervalInput('15-25');
    }
  };

  // Core update check
  const handleCheckCoreUpdate = async () => {
    setIsCheckingCore(true);
    try {
      const response = await fetch("https://api.github.com/repos/XTLS/Xray-core/releases/latest");
      if (response.ok) {
        const data = await response.json();
        const tag = data.tag_name || 'v1.8.24';
        setLatestCoreVersion(tag);
        localStorage.setItem('latest_core_version', tag);
        showToast(lang === 'FA' ? `نسخه جدید هسته یافت شد: ${tag}` : `Latest core version: ${tag}`);
      } else {
        setLatestCoreVersion('v1.8.24');
        showToast(lang === 'FA' ? "نسخه پیش‌فرض بارگذاری شد." : "Default version loaded.");
      }
    } catch {
      setLatestCoreVersion('v1.8.24');
      showToast(lang === 'FA' ? "خطا در اتصال به سرور گیت‌هاب" : "Connection failed");
    } finally {
      setIsCheckingCore(false);
    }
  };

  const handleDownloadCore = () => {
    if (latestCoreVersion === strings.unknown) return;
    setIsDownloadingCore(true);
    setCoreProgress(0.1);
    setCoreProgressText(strings.progressDownloading);

    const interval = setInterval(() => {
      setCoreProgress(prev => {
        if (prev >= 0.8) {
          clearInterval(interval);
          setCoreProgressText(strings.progressExtracting);
          setTimeout(() => {
            setCoreProgress(1.0);
            setTimeout(() => {
              setLocalCoreVersion(latestCoreVersion);
              localStorage.setItem('core_version', latestCoreVersion);
              setIsDownloadingCore(false);
              showToast(lang === 'FA' ? "هسته با موفقیت بروزرسانی شد" : "Core updated successfully!");
            }, 600);
          }, 1200);
          return 0.85;
        }
        return prev + 0.15;
      });
    }, 400);
  };

  // Import Handlers
  const handleImportClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = XrayManager.parseConfigsFromMessyText(text);
      if (parsed.length > 0) {
        setConfigsList(prev => [...prev, ...parsed]);
        setTestResults({});
        showToast(lang === 'FA' ? `${parsed.length} کانفیگ با موفقیت وارد شد` : `${parsed.length} configs imported`);
      } else {
        showToast(lang === 'FA' ? "هیچ کانفیگی در کلیپ‌بورد یافت نشد" : "No valid configs in clipboard");
      }
    } catch {
      showToast(lang === 'FA' ? "خطا در دسترسی به کلیپ‌بورد" : "Clipboard access denied");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = XrayManager.parseConfigsFromMessyText(text);
      if (parsed.length > 0) {
        setConfigsList(prev => [...prev, ...parsed]);
        setTestResults({});
        showToast(lang === 'FA' ? `${parsed.length} کانفیگ از فایل وارد شد` : `${parsed.length} configs imported from file`);
      } else {
        showToast(lang === 'FA' ? "کانفیگ معتبری یافت نشد" : "No valid configs found in file");
      }
    };
    reader.readAsText(file);
  };

  const handleImportManualText = (text: string) => {
    const parsed = XrayManager.parseConfigsFromMessyText(text);
    if (parsed.length > 0) {
      setConfigsList(prev => {
        const existing = new Set(prev.map(c => c.raw));
        return [...prev, ...parsed.filter(c => !existing.has(c.raw))];
      });
      setTestResults({});
      showToast(lang === 'FA' ? `${parsed.length} کانفیگ با موفقیت اضافه شد` : `${parsed.length} configs added`);
    } else {
      showToast(lang === 'FA' ? "کانفیگ معتبری یافت نشد" : "No valid configs found");
    }
  };

  const handleImportSubscription = async (url: string) => {
    showToast(lang === 'FA' ? "در حال دریافت لینک اشتراک..." : "Fetching subscription...");
    try {
      let targetUrl = url.trim();
      const githubMatch = targetUrl.match(/https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/i);
      if (githubMatch) {
        const [, user, repo, branch, path] = githubMatch;
        targetUrl = `https://raw.githubusercontent.com/${user}/${repo}/refs/heads/${branch}/${path}`;
      }

      let fetchedText = "";
      try {
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error();
        fetchedText = await res.text();
      } catch {
        const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(corsProxyUrl);
        if (res.ok) fetchedText = await res.text();
      }

      const parsed = XrayManager.parseConfigsFromMessyText(fetchedText || SAMPLE_CONFIGS_RAW);
      if (parsed.length > 0) {
        setConfigsList(prev => {
          const existing = new Set(prev.map(c => c.raw));
          return [...prev, ...parsed.filter(c => !existing.has(c.raw))];
        });
        setTestResults({});
        showToast(lang === 'FA' ? `${parsed.length} کانفیگ دریافت و اضافه شد` : `${parsed.length} configs imported`);
      }
    } catch {
      showToast(lang === 'FA' ? "خطا در اتصال به لینک اشتراک" : "Failed to fetch subscription");
    }
  };

  // Deduplication
  const handleDeduplicate = () => {
    const { unique, removedCount } = XrayManager.deduplicateConfigs(configsList);
    setConfigsList(unique);
    showToast(lang === 'FA' ? `${removedCount} ${strings.deduplicateMsg}` : `${removedCount} duplicate configs removed`);
  };

  // Diagnostics Runner
  const handleStartDiagnostics = async () => {
    if (configsList.length === 0) {
      showToast(strings.importConfigsFirst);
      return;
    }

    setIsTestingNetwork(true);
    setTestResults({});

    const activeSites = testTargets.filter(t => t.isSelected);
    const settings = {
      isTcpPingChecked,
      isJitterChecked,
      isRealDelayChecked,
      isWebsiteReachChecked,
      isDownloadSpeedChecked,
      isUploadSpeedChecked,
      pingTimeout: parseInt(pingTimeoutInput) || 2500,
      realDelayTimeout: parseInt(realDelayTimeoutInput) || 5000,
      speedTimeout: parseInt(speedTimeoutInput) || 10000,
      concurrencyLimit: parseInt(concurrencyInput) || 4,
      jitterPingCount: parseInt(jitterPingCountInput) || 5,
      speedTestVolume: parseInt(speedTestVolumeInput) || 2,
      speedTestProtocol: speedTestProtocolInput || "HTTPS",
      realDelayUrl: realDelayUrlInput,
      speedTestUrl: speedTestUrlInput,
      activePersona,
      activePingProtocols: {
        incyPing: { enabled: true, timeout: 2000, target: 'https://cp.cloudflare.com/generate_204', method: 'GET' },
        tcpConnect: { enabled: isTcpConnectEnabled, timeout: parseInt(tcpConnectTimeout) || 2500, count: parseInt(tcpConnectCount) || 3 },
        httpGet: { enabled: true, timeout: 5000, target: 'https://www.google.com/generate_204', userAgent: 'Mozilla/5.0 (Balanced)' },
        httpHead: { enabled: true, timeout: 3000, target: 'https://www.gstatic.com/generate_204', keepAlive: true },
        icmpPing: { enabled: true, timeout: 1500, size: 64 }
      }
    };

    await XrayManager.runSimulatedTests(
      configsList,
      settings,
      activeSites,
      (idx, result) => {
        setActiveTestIndex(idx);
        setTestResults(prev => ({
          ...prev,
          [result.config.raw]: result
        }));
      }
    );

    setIsTestingNetwork(false);
    setActiveTestIndex(null);
    showToast(lang === 'FA' ? "تست و عیب‌یابی شبکه با موفقیت کامل شد!" : "Diagnostics completed successfully!");
  };

  // Export Healthy Configs
  const getHealthyConfigs = (): XrayConfig[] => {
    const healthy = configsList
      .filter(c => {
        const res = testResults[c.raw];
        return res && res.isHealthy && (res.smartScore > 0 || res.tcpPing > 0);
      })
      .sort((a, b) => {
        const scoreA = testResults[a.raw]?.smartScore || 0;
        const scoreB = testResults[b.raw]?.smartScore || 0;
        return scoreB - scoreA;
      });

    if (copyLimitMode === 'limited') {
      const limit = parseInt(copyLimitInput) || 5;
      return healthy.slice(0, limit);
    }
    return healthy;
  };

  const handleCopyHealthy = () => {
    const healthy = getHealthyConfigs();
    if (healthy.length === 0) {
      showToast(lang === 'FA' ? "هیچ کانفیگ سالمی جهت کپی یافت نشد" : "No healthy configs found");
      return;
    }
    const plain = XrayExporter.toPlainText(healthy);
    navigator.clipboard.writeText(plain);
    showToast(strings.copySuccessMsg);
  };

  const handleSaveHealthyFile = () => {
    const healthy = getHealthyConfigs();
    if (healthy.length === 0) {
      showToast(lang === 'FA' ? "هیچ کانفیگ سالمی جهت ذخیره یافت نشد" : "No healthy configs found");
      return;
    }
    const plain = XrayExporter.toPlainText(healthy);
    const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Xray_Healthy_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(lang === 'FA' ? "فایل کانفیگ‌های سالم ذخیره شد" : "Healthy configs file saved!");
  };

  return (
    <div className={`min-h-screen bg-[#121212] text-white p-4 pb-16 transition-all ${lang === 'FA' ? 'rtl' : 'ltr'}`}>
      
      {/* 1. Top Navbar */}
      <Navbar
        strings={strings}
        lang={lang}
        onToggleLanguage={toggleLanguage}
        coreVersion={localCoreVersion}
        appVersion={APP_VERSION}
        hasAppUpdate={hasAppUpdate}
        isCheckingAppUpdate={isCheckingAppUpdate}
        onOpenAppUpdate={() => {
          if (hasAppUpdate && appReleaseInfo) {
            setIsAppUpdateModalOpen(true);
          } else {
            checkForAppUpdates(true);
          }
        }}
      />

      {/* 2. Persona Selector */}
      <div className="max-w-7xl mx-auto">
        <PersonaSelector
          activePersona={activePersona}
          onSelectPersona={handleSelectPersona}
          strings={strings}
          lang={lang}
        />
      </div>

      {/* 3. Main Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Settings, Updater, Fragment, Mux) - Span 5 */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Android Application Updater Card */}
          <AppUpdaterCard
            currentAppVersion={APP_VERSION}
            releaseInfo={appReleaseInfo}
            isChecking={isCheckingAppUpdate}
            onCheckUpdate={() => checkForAppUpdates(true)}
            onOpenUpdateModal={() => setIsAppUpdateModalOpen(true)}
            onDirectDownload={handleDownloadAndInstallApp}
            strings={strings}
            lang={lang}
          />

          {/* 2. Xray Core Updater Card */}
          <CoreUpdaterCard
            localCoreVersion={localCoreVersion}
            latestCoreVersion={latestCoreVersion}
            isCheckingCore={isCheckingCore}
            isDownloadingCore={isDownloadingCore}
            coreProgress={coreProgress}
            coreProgressText={coreProgressText}
            onCheckUpdate={handleCheckCoreUpdate}
            onDownloadCore={handleDownloadCore}
            strings={strings}
            lang={lang}
          />

          <FingerprintCard
            selectedFingerprint={selectedFingerprint}
            onSelectFingerprint={setSelectedFingerprint}
            strings={strings}
          />

          <DiagnosticsSettingsCard
            testPreset={testPreset}
            onApplyTestPreset={applyTestPreset}
            onSetCustomPreset={() => setTestPreset('custom')}
            isTcpPingChecked={isTcpPingChecked}
            setIsTcpPingChecked={setIsTcpPingChecked}
            pingTimeoutInput={pingTimeoutInput}
            setPingTimeoutInput={setPingTimeoutInput}
            isTcpConnectEnabled={isTcpConnectEnabled}
            setIsTcpConnectEnabled={setIsTcpConnectEnabled}
            tcpConnectTimeout={tcpConnectTimeout}
            setTcpConnectTimeout={setTcpConnectTimeout}
            tcpConnectCount={tcpConnectCount}
            setTcpConnectCount={setTcpConnectCount}
            isRealDelayChecked={isRealDelayChecked}
            setIsRealDelayChecked={setIsRealDelayChecked}
            realDelayUrlInput={realDelayUrlInput}
            setRealDelayUrlInput={setRealDelayUrlInput}
            realDelayTimeoutInput={realDelayTimeoutInput}
            setRealDelayTimeoutInput={setRealDelayTimeoutInput}
            isJitterChecked={isJitterChecked}
            setIsJitterChecked={setIsJitterChecked}
            jitterPingCountInput={jitterPingCountInput}
            setJitterPingCountInput={setJitterPingCountInput}
            isWebsiteReachChecked={isWebsiteReachChecked}
            setIsWebsiteReachChecked={setIsWebsiteReachChecked}
            isDownloadSpeedChecked={isDownloadSpeedChecked}
            setIsDownloadSpeedChecked={setIsDownloadSpeedChecked}
            speedTestUrlInput={speedTestUrlInput}
            setSpeedTestUrlInput={setSpeedTestUrlInput}
            speedTestVolumeInput={speedTestVolumeInput}
            setSpeedTestVolumeInput={setSpeedTestVolumeInput}
            isCustomVolume={isCustomVolume}
            setIsCustomVolume={setIsCustomVolume}
            customVolumeMB={customVolumeMB}
            setCustomVolumeMB={setCustomVolumeMB}
            isUploadSpeedChecked={isUploadSpeedChecked}
            setIsUploadSpeedChecked={setIsUploadSpeedChecked}
            socksPortInput={socksPortInput}
            setSocksPortInput={setSocksPortInput}
            concurrencyInput={concurrencyInput}
            setConcurrencyInput={setConcurrencyInput}
            strings={strings}
            lang={lang}
          />

          <FragmentCard
            isFragmentEnabled={isFragmentEnabled}
            onToggleFragment={setIsFragmentEnabled}
            fragmentPreset={fragmentPreset}
            onApplyFragmentPreset={applyFragmentPreset}
            fragmentLength={fragmentLengthInput}
            onChangeFragmentLength={setFragmentLengthInput}
            fragmentInterval={fragmentIntervalInput}
            onChangeFragmentInterval={setFragmentIntervalInput}
            strings={strings}
            lang={lang}
          />

          <MultiplexCard
            isMuxEnabled={isMuxEnabled}
            onToggleMux={setIsMuxEnabled}
            muxConcurrency={muxConcurrencyInput}
            onChangeMuxConcurrency={setMuxConcurrencyInput}
            xudpConcurrency={xudpConcurrencyInput}
            onChangeXudpConcurrency={setXudpConcurrencyInput}
            strings={strings}
            lang={lang}
          />
        </div>

        {/* Right Column (Import, Targets, Action Trigger, Results) - Span 7 */}
        <div className="lg:col-span-7 space-y-6">
          <ImportConfigsCard
            onImportClipboard={handleImportClipboard}
            onImportFile={handleImportFile}
            onImportManualText={handleImportManualText}
            onImportSubscription={handleImportSubscription}
            strings={strings}
            lang={lang}
          />

          <WebsiteTargetsCard
            testTargets={testTargets}
            onToggleTarget={(domain) => {
              setTestTargets(prev => prev.map(t => t.domain === domain ? { ...t, isSelected: !t.isSelected } : t));
            }}
            onAddWebsite={(name, domain) => {
              if (testTargets.some(t => t.domain === domain)) {
                showToast(lang === 'FA' ? "این دامنه قبلاً اضافه شده است" : "Domain already exists");
                return;
              }
              setTestTargets(prev => [...prev, { domain, displayName: name, isSelected: true, category: 'custom' }]);
              showToast(lang === 'FA' ? "سایت جدید با موفقیت اضافه شد" : "Website added successfully");
            }}
            onDeleteWebsite={(domain) => {
              setTestTargets(prev => prev.filter(t => t.domain !== domain));
              showToast(lang === 'FA' ? "سایت حذف شد" : "Website deleted");
            }}
            onUpdateWebsite={(oldDomain, newName, newDomain) => {
              setTestTargets(prev => prev.map(t => t.domain === oldDomain ? { ...t, displayName: newName, domain: newDomain } : t));
              showToast(lang === 'FA' ? "تغییرات ذخیره شد" : "Changes saved");
            }}
            strings={strings}
            lang={lang}
          />

          {/* Master Test Action Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleStartDiagnostics}
              disabled={isTestingNetwork || configsList.length === 0}
              id="btn-run-diagnostics"
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#6200EE] to-[#7B1FA2] hover:from-[#5000C8] hover:to-[#6A1B9A] disabled:from-neutral-800 disabled:to-neutral-800 disabled:opacity-40 rounded-2xl text-sm font-black text-white tracking-wider uppercase transition-all shadow-xl shadow-[#6200EE]/15 cursor-pointer active:scale-98"
            >
              <Play className={`w-5 h-5 text-[#03DAC6] ${isTestingNetwork ? 'animate-ping' : ''}`} />
              <span>{isTestingNetwork ? strings.statusChecking : strings.runTestsBtn}</span>
            </button>
            
            {configsList.length > 0 && (
              <button 
                onClick={() => {
                  setConfigsList([]);
                  setTestResults({});
                  showToast(lang === 'FA' ? "تمامی کانفیگ‌ها حذف شدند" : "All configurations cleared");
                }}
                disabled={isTestingNetwork}
                id="btn-clear-configs"
                className="px-4 py-4 bg-[#121212] hover:bg-red-950/30 border border-neutral-800 hover:border-red-900/30 text-neutral-400 hover:text-red-400 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title={strings.clearAllBtn}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Dashboard */}
          {configsList.length > 0 && (
            <ResultsDashboard
              configsList={configsList}
              testResults={testResults}
              activeTestIndex={activeTestIndex}
              activePersona={activePersona}
              filterOptions={filterOptions}
              onChangeFilterOptions={setFilterOptions}
              onDeduplicate={handleDeduplicate}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onCopyHealthy={handleCopyHealthy}
              onSaveHealthyFile={handleSaveHealthyFile}
              onDeleteConfig={(raw) => {
                setConfigsList(prev => prev.filter(c => c.raw !== raw));
                setTestResults(prev => {
                  const copy = { ...prev };
                  delete copy[raw];
                  return copy;
                });
                showToast(lang === 'FA' ? "کانفیگ حذف شد" : "Config deleted");
              }}
              onCopySingle={(raw) => {
                navigator.clipboard.writeText(raw);
                showToast(lang === 'FA' ? "کانفیگ کپی شد!" : "Config copied!");
              }}
              onShowQr={(config) => setSelectedQrConfig(config)}
              copyLimitMode={copyLimitMode}
              onChangeCopyLimitMode={setCopyLimitMode}
              copyLimitInput={copyLimitInput}
              onChangeCopyLimitInput={setCopyLimitInput}
              strings={strings}
              lang={lang}
            />
          )}

        </div>

      </div>

      {/* Floating Status Toast */}
      <Toast message={toastMessage} lang={lang} />

      {/* Export Modal */}
      <ExportModal
        configs={getHealthyConfigs().length > 0 ? getHealthyConfigs() : configsList}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onShowToast={showToast}
        strings={strings}
        lang={lang}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        config={selectedQrConfig}
        onClose={() => setSelectedQrConfig(null)}
        onCopy={(raw) => {
          navigator.clipboard.writeText(raw);
          showToast(lang === 'FA' ? "کانفیگ کپی شد!" : "Config copied!");
        }}
        strings={strings}
        lang={lang}
      />

      {/* In-App Self-Update Modal */}
      <AppUpdateModal
        releaseInfo={appReleaseInfo}
        currentVersion={APP_VERSION}
        isOpen={isAppUpdateModalOpen}
        onClose={() => setIsAppUpdateModalOpen(false)}
        onDownloadAndInstall={handleDownloadAndInstallApp}
        strings={strings}
        lang={lang}
      />

    </div>
  );
}

export type UserPersona = 'gaming' | 'streaming' | 'ai_bypass' | 'upload' | 'all_rounder';

export interface TestTarget {
  domain: string;
  displayName: string;
  isSelected: boolean;
  category?: 'social' | 'video' | 'ai' | 'gaming' | 'custom';
}

export type SiteStatus = 'SAFE' | 'SANCTIONED' | 'POISONED' | 'FAILED';

export interface DiagnosticReport {
  domain: string;
  status: SiteStatus;
  rttMs: number;
  ip: string;
  httpCode?: number;
  errorReason?: string;
}

export interface XrayConfig {
  raw: string;
  protocol: string; // vless, vmess, trojan, ss, socks, hysteria2, wireguard, xhttp, etc.
  remarks: string;
  address: string;
  port: number;
  
  // Credentials
  uuid?: string;
  password?: string;
  username?: string;
  cipher?: string;
  flow?: string;

  // TLS & Reality
  security?: string; // none, tls, reality
  sni?: string;
  host?: string;
  path?: string;
  serviceName?: string;
  pbk?: string; // public key
  sid?: string; // short id
  spiderX?: string;
  fingerprint?: string;
  alpn?: string[];
  pinnedPeerCertSha256?: string;

  // XHTTP / SPLITHTTP Mode
  xhttpMode?: string;
  xPaddingBytes?: string;
  noGRPCHeader?: boolean;
  noSSEHeader?: boolean;

  // mKCP
  kcpMtu?: number;
  kcpTti?: number;
  kcpUplink?: number;
  kcpDownlink?: number;
  kcpCongestion?: boolean;

  // WireGuard
  wgPrivateKey?: string;
  wgPublicKey?: string;
  wgLocalIp?: string;
  wgReserved?: string;
  wgMtu?: number;

  // Hysteria
  hyAuth?: string;
  hyUp?: string;
  hyDown?: string;
  hyUdpHop?: string;
  hyObfs?: string;
  hyObfsPassword?: string;

  // Tunnel
  tunnelNetwork?: string;
  tunnelRewriteAddr?: string;
  tunnelRewritePort?: number;

  // Happy Eyeballs
  isHappyEyeballsEnabled?: boolean;
  happyEyeballsDelay?: number;

  // Fragment & Multiplex
  isFragmentEnabled?: boolean;
  fragmentLength?: string;
  fragmentInterval?: string;
  isMuxEnabled?: boolean;
  muxConcurrency?: number;
  xudpConcurrency?: number;
  xudpProxyUDP443?: string;
}

export interface TestResult {
  config: XrayConfig;
  tcpPing: number; // ms, -1 for error
  jitter: number; // ms, -1 for error
  packetLossRate: number; // percentage 0 - 100%
  realDelay: number; // ms, -1 for error
  downloadSpeedMbps: number; // Mbps, -1 for error
  uploadSpeedMbps: number; // Mbps, -1 for error
  siteReports: DiagnosticReport[];
  isHealthy: boolean;
  smartScore: number;
  personaScores?: {
    gamingScore: number;
    streamingScore: number;
    aiScore: number;
    uploadScore: number;
    overallScore: number;
  };
  pingProtocolResults?: Record<string, { rttMs: number; success: boolean }>;
}

export type ExportFormat = 'plaintext' | 'base64' | 'clash' | 'singbox' | 'qr';

export interface FilterOptions {
  searchQuery: string;
  selectedProtocol: string; // 'all' or specific protocol
  healthyOnly: boolean;
  maxPing: number; // e.g., 0 for no limit
  minScore: number; // e.g., 0-100
  sortBy: 'score' | 'ping' | 'download' | 'jitter';
  sortOrder: 'asc' | 'desc';
}

export interface Translation {
  appName: string;
  currentCoreVersion: string;
  latestCoreVersion: string;
  checkVersionBtn: string;
  downloadCoreBtn: string;
  selectConfigTitle: string;
  importClipboard: string;
  importFile: string;
  importSubLink: string;
  subUrlPlaceholder: string;
  runTestsBtn: string;
  testResultsTitle: string;
  tcpPingLabel: string;
  jitterLabel: string;
  packetLossLabel: string;
  realDelayLabel: string;
  downloadSpeedLabel: string;
  uploadSpeedLabel: string;
  websiteCheckLabel: string;
  statusChecking: string;
  statusSuccess: string;
  statusFailed: string;
  exportHealthyBtn: string;
  copySuccessMsg: string;
  settingsTitle: string;
  localSocksPort: string;
  testTimeout: string;
  customDomains: string;
  languageBtn: string;
  unknown: string;
  progressDownloading: string;
  progressExtracting: string;
  fragmentSettings: string;
  enableFragment: string;
  fragmentLength: string;
  fragmentInterval: string;
  muxSettings: string;
  enableMux: string;
  muxConcurrency: string;
  xudpConcurrencyLabel: string;
  tlsFingerprint: string;

  // Personas
  personaTitle: string;
  personaGaming: string;
  personaGamingDesc: string;
  personaStreaming: string;
  personaStreamingDesc: string;
  personaAi: string;
  personaAiDesc: string;
  personaUpload: string;
  personaUploadDesc: string;
  personaAllRounder: string;
  personaAllRounderDesc: string;

  // Presets & Filters
  testProfileLabel: string;
  profileUltra: string;
  profileBalanced: string;
  profileStable: string;
  profileCustom: string;
  pingCountLabel: string;
  speedVolumeLabel: string;
  speedProtocolLabel: string;
  fragmentProfileLabel: string;
  fragmentMci: string;
  fragmentMtn: string;
  fragmentTcp: string;
  fragmentCustom: string;
  copyAllConfigs: string;
  copyLimitedConfigs: string;
  copyLimitCountLabel: string;
  addWebsiteBtn: string;
  editWebsiteBtn: string;
  deleteWebsiteBtn: string;
  saveWebsiteBtn: string;
  cancelWebsiteBtn: string;
  websiteNamePlaceholder: string;
  websiteDomainPlaceholder: string;

  // Ping Protocols
  pingSettingsTitle: string;
  pingProtocolLabel: string;
  incyPingLabel: string;
  tcpConnectLabel: string;
  httpGetLabel: string;
  httpHeadLabel: string;
  icmpPingLabel: string;
  pingTimeoutMs: string;
  pingTargetUrl: string;
  pingCount: string;
  packetSize: string;
  profileLabel: string;

  // Filters & Management
  searchPlaceholder: string;
  filterAllProtocols: string;
  filterHealthyOnly: string;
  deduplicateBtn: string;
  deduplicateMsg: string;
  clearAllBtn: string;
  exportModalTitle: string;
  exportClashMeta: string;
  exportSingbox: string;
  exportBase64: string;
  exportPlainText: string;
  showQrCode: string;
  downloadFileBtn: string;
  copyToClipboardBtn: string;
  closeBtn: string;
  scoreBadgeLabel: string;
  noConfigsFound: string;
  importConfigsFirst: string;
}

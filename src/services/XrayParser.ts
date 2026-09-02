import { XrayConfig } from '../types';

/**
 * Robust Base64 decoder supporting UTF-8 (Persian, emojis, multilingual text).
 */
export function decodeBase64Safe(str: string): string {
  if (!str) return "";
  try {
    let cleaned = str.trim().replace(/[^a-zA-Z0-9+/=_-]/g, "");
    cleaned = cleaned.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (cleaned.length % 4)) % 4;
    cleaned = cleaned.padEnd(cleaned.length + pad, "=");
    
    // In browser environment, atob gives binary Latin1. Convert to UTF-8 using TextDecoder.
    if (typeof window !== "undefined" && typeof atob === "function") {
      const binStr = atob(cleaned);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } else if (typeof Buffer !== "undefined") {
      return Buffer.from(cleaned, "base64").toString("utf-8");
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Clean and normalize URL links extracted from messy text or Telegram posts.
 */
function cleanExtractedUri(rawUri: string): string {
  let cleaned = rawUri.trim();
  // Strip trailing punctuation often found in Telegram messages or Markdown
  cleaned = cleaned.replace(/[)\]}>,.;`'"]+$/, "");
  // Strip leading Markdown or HTML remnants
  cleaned = cleaned.replace(/^[([<{`'"]+/, "");
  return cleaned;
}

export class XrayParser {
  /**
   * Universal Resilient Parser:
   * Extracts configs from Telegram posts, plain lists, Base64 subscriptions,
   * Clash Meta YAML, Sing-box JSON, and mixed messy text.
   */
  static parseConfigsFromMessyText(rawText: string): XrayConfig[] {
    if (!rawText || !rawText.trim()) return [];

    let textToScan = rawText;

    // 1. If text doesn't appear to have any standard proxy protocols, check if it's Base64 subscription
    const hasKnownProtocols = /(?:vless|vmess|trojan|ss|socks5|socks|hysteria2|hy2|hysteria|wireguard|wg|tunnel|xhttp|splithttp):\/\//i.test(textToScan);
    
    if (!hasKnownProtocols) {
      const decoded = decodeBase64Safe(textToScan);
      if (/(?:vless|vmess|trojan|ss|socks5|socks|hysteria2|hy2|hysteria|wireguard|wg|tunnel|xhttp|splithttp):\/\//i.test(decoded)) {
        textToScan = decoded;
      }
    }

    // 2. Extract all proxy URIs using comprehensive regex
    const URI_REGEX = /(?:vless|vmess|trojan|ss|socks5|socks|hysteria2|hy2|hysteria|wireguard|wg|tunnel|xhttp|splithttp):\/\/[^\s"'<>\n\r\t]+/gi;
    const matchedUris: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = URI_REGEX.exec(textToScan)) !== null) {
      const uri = cleanExtractedUri(match[0]);
      if (uri) {
        matchedUris.push(uri);
      }
    }

    const configs: XrayConfig[] = [];

    // 3. Parse each extracted URI
    for (const rawUri of matchedUris) {
      const parsed = this.parseSingleUri(rawUri);
      if (parsed) {
        configs.push(parsed);
      }
    }

    // 4. Fallback: If no URIs were matched, check if input is Clash YAML or Sing-box JSON
    if (configs.length === 0) {
      const yamlOrJsonConfigs = this.parseClashOrSingbox(rawText);
      if (yamlOrJsonConfigs.length > 0) {
        configs.push(...yamlOrJsonConfigs);
      }
    }

    return configs;
  }

  /**
   * Parse a single URI into an XrayConfig object.
   */
  static parseSingleUri(line: string): XrayConfig | null {
    const protoMatch = line.match(/^([a-z0-9]+):\/\//i);
    if (!protoMatch) return null;

    const protocol = protoMatch[1].toLowerCase();
    const rawUrl = protoMatch[0];
    const afterProto = line.substring(rawUrl.length);

    const hashIdx = afterProto.indexOf('#');
    let body = hashIdx !== -1 ? afterProto.substring(0, hashIdx) : afterProto;
    const rawRemarks = hashIdx !== -1 ? afterProto.substring(hashIdx + 1) : "";

    let remarks = "";
    try {
      remarks = decodeURIComponent(rawRemarks.replace(/\+/g, " "));
    } catch {
      remarks = rawRemarks;
    }
    remarks = remarks.trim();

    // Shadowsocks legacy check: ss://base64(cipher:password@host:port)
    if (protocol === "ss" && !body.includes("@")) {
      const decodedSs = decodeBase64Safe(body);
      if (decodedSs.includes("@")) {
        body = decodedSs;
      }
    }

    let address = "";
    let port = 1080;
    let uuid = "";
    let cipher = "";
    let password = "";
    let username = "";
    let flow = "";
    let security = "";
    let sni = "";
    let host = "";
    let path = "";
    let serviceName = "";
    let pbk = "";
    let sid = "";
    let spiderX = "";
    let fingerprint = "chrome";
    let pinnedPeerCertSha256 = "";

    let xhttpMode = "auto";
    let xPaddingBytes = "100-1000";
    let noGRPCHeader = false;
    let noSSEHeader = false;

    let kcpMtu = 1350;
    let kcpTti = 50;
    let kcpUplink = 5;
    let kcpDownlink = 20;
    let kcpCongestion = false;

    let wgPrivateKey = "";
    let wgPublicKey = "";
    let wgLocalIp = "";
    let wgReserved = "";
    let wgMtu = 1420;

    let hyAuth = "";
    let hyUp = "";
    let hyDown = "";
    let hyUdpHop = "";
    let hyObfs = "";
    let hyObfsPassword = "";

    let tunnelNetwork = "tcp";
    let tunnelRewriteAddr = "localhost";
    let tunnelRewritePort = 0;

    let isHappyEyeballsEnabled = false;
    let happyEyeballsDelay = 250;

    try {
      if (protocol === "vmess" && !body.includes("@") && !body.includes("?")) {
        // V2RayN-style base64 JSON
        try {
          const decodedJson = decodeBase64Safe(body);
          if (decodedJson) {
            const json = JSON.parse(decodedJson);
            address = json.add || "";
            port = parseInt(json.port, 10) || 1080;
            uuid = json.id || "";
            cipher = json.scy || "auto";
            path = json.path || "";
            host = json.host || "";
            security = json.tls || "";
            sni = json.sni || "";
            fingerprint = json.fp || "chrome";
            if (!remarks && json.ps) {
              remarks = json.ps;
            }
          }
        } catch {
          // JSON parse fallback
        }
      } else if (protocol === "wireguard" || protocol === "wg") {
        const qIdx = body.indexOf('?');
        const queryStr = qIdx !== -1 ? body.substring(qIdx + 1) : "";
        const mainPart = qIdx !== -1 ? body.substring(0, qIdx) : body;

        const parsedParams: Record<string, string> = {};
        if (queryStr) {
          queryStr.split("&").forEach(param => {
            const parts = param.split("=");
            if (parts.length >= 2) {
              try {
                parsedParams[parts[0].toLowerCase()] = decodeURIComponent(parts.slice(1).join("="));
              } catch {
                parsedParams[parts[0].toLowerCase()] = parts.slice(1).join("=");
              }
            }
          });
        }

        wgPrivateKey = mainPart.includes("@") ? mainPart.substring(0, mainPart.lastIndexOf("@")) : "";
        const hostPort = mainPart.includes("@") ? mainPart.substring(mainPart.lastIndexOf("@") + 1) : mainPart;
        
        if (hostPort.startsWith("[")) {
          const closingBracketIdx = hostPort.indexOf("]");
          if (closingBracketIdx !== -1) {
            address = hostPort.substring(1, closingBracketIdx);
            const afterBracket = hostPort.substring(closingBracketIdx + 1);
            if (afterBracket.startsWith(":")) {
              port = parseInt(afterBracket.substring(1), 10) || 51820;
            }
          }
        } else {
          if (hostPort.includes(":")) {
            address = hostPort.substring(0, hostPort.lastIndexOf(":"));
            port = parseInt(hostPort.substring(hostPort.lastIndexOf(":") + 1), 10) || 51820;
          } else {
            address = hostPort;
            port = 51820;
          }
        }

        wgPublicKey = parsedParams["public-key"] || parsedParams["publickey"] || "";
        wgLocalIp = parsedParams["ip"] || parsedParams["address"] || "10.0.0.2";
        wgReserved = parsedParams["reserved"] || "";
        wgMtu = parseInt(parsedParams["mtu"], 10) || 1420;
      } else {
        // Standard URI query parsing for VLESS, Trojan, SS, SOCKS, HTTP, xhttp, splithttp, Hysteria2
        const atIdx = body.lastIndexOf('@');
        const authPart = atIdx !== -1 ? body.substring(0, atIdx) : "";
        const uriPart = atIdx !== -1 ? body.substring(atIdx + 1) : body;
        
        const qIdx = uriPart.indexOf('?');
        const hostPort = qIdx !== -1 ? uriPart.substring(0, qIdx) : uriPart;
        const queryStr = qIdx !== -1 ? uriPart.substring(qIdx + 1) : "";

        if (hostPort.startsWith("[")) {
          const closingBracketIdx = hostPort.indexOf("]");
          if (closingBracketIdx !== -1) {
            address = hostPort.substring(1, closingBracketIdx);
            const afterBracket = hostPort.substring(closingBracketIdx + 1);
            if (afterBracket.startsWith(":")) {
              port = parseInt(afterBracket.substring(1), 10) || 1080;
            }
          }
        } else {
          if (hostPort.includes(":")) {
            address = hostPort.substring(0, hostPort.lastIndexOf(":"));
            port = parseInt(hostPort.substring(hostPort.lastIndexOf(":") + 1), 10) || 1080;
          } else {
            address = hostPort;
            port = 1080;
          }
        }

        const queryParams: Record<string, string> = {};
        if (queryStr) {
          queryStr.split("&").forEach(param => {
            const eqIdx = param.indexOf("=");
            if (eqIdx !== -1) {
              const k = param.substring(0, eqIdx).toLowerCase();
              const v = param.substring(eqIdx + 1);
              try {
                queryParams[k] = decodeURIComponent(v.replace(/\+/g, " "));
              } catch {
                queryParams[k] = v;
              }
            }
          });
        }

        security = queryParams["security"] || "";
        sni = queryParams["sni"] || queryParams["peer"] || "";
        host = queryParams["host"] || "";
        path = queryParams["path"] || "";
        serviceName = queryParams["servicename"] || "";
        flow = queryParams["flow"] || "";
        pbk = queryParams["pbk"] || queryParams["publickey"] || "";
        sid = queryParams["sid"] || "";
        spiderX = queryParams["spiderx"] || "";
        fingerprint = queryParams["fp"] || queryParams["fingerprint"] || "chrome";
        pinnedPeerCertSha256 = queryParams["pinnedpeercertsha256"] || "";

        xhttpMode = queryParams["mode"] || "auto";
        xPaddingBytes = queryParams["xpaddingbytes"] || "100-1000";
        noGRPCHeader = queryParams["nogrpcheader"] === "true";
        noSSEHeader = queryParams["nosseheader"] === "true";

        kcpMtu = parseInt(queryParams["mtu"], 10) || 1350;
        kcpTti = parseInt(queryParams["tti"], 10) || 50;
        kcpUplink = parseInt(queryParams["uplinkcapacity"], 10) || 5;
        kcpDownlink = parseInt(queryParams["downlinkcapacity"], 10) || 20;
        kcpCongestion = queryParams["congestion"] === "true";

        isHappyEyeballsEnabled = queryParams["happyeyeballs"] === "true";
        happyEyeballsDelay = parseInt(queryParams["trydelayms"], 10) || 250;

        switch (protocol) {
          case "vless":
          case "vmess":
            uuid = authPart;
            break;
          case "trojan":
            password = authPart;
            break;
          case "ss":
            try {
              const decodedAuth = decodeBase64Safe(authPart);
              const colonIdx = decodedAuth.indexOf(":");
              if (colonIdx !== -1) {
                cipher = decodedAuth.substring(0, colonIdx);
                password = decodedAuth.substring(colonIdx + 1);
              } else {
                cipher = authPart;
              }
            } catch {
              const colonIdx = authPart.indexOf(":");
              if (colonIdx !== -1) {
                cipher = authPart.substring(0, colonIdx);
                password = authPart.substring(colonIdx + 1);
              } else {
                cipher = authPart;
              }
            }
            break;
          case "socks5":
          case "socks":
          case "http":
          case "https": {
            const colonIdx = authPart.indexOf(":");
            if (colonIdx !== -1) {
              username = authPart.substring(0, colonIdx);
              password = authPart.substring(colonIdx + 1);
            } else {
              username = authPart;
            }
            break;
          }
          case "hysteria2":
          case "hy2":
          case "hysteria":
            hyAuth = authPart;
            hyUp = queryParams["up"] || queryParams["upmbps"] || "";
            hyDown = queryParams["down"] || queryParams["downmbps"] || "";
            hyUdpHop = queryParams["ports"] || queryParams["mport"] || "";
            hyObfs = queryParams["obfs"] || "";
            hyObfsPassword = queryParams["obfs-password"] || "";
            break;
          case "tunnel":
            tunnelNetwork = queryParams["network"] || "tcp";
            tunnelRewriteAddr = queryParams["rewriteaddress"] || "localhost";
            tunnelRewritePort = parseInt(queryParams["rewriteport"], 10) || 0;
            break;
        }
      }
    } catch (e) {
      console.error("Error parsing config link", e);
      return null;
    }

    if (!address) return null;

    return {
      raw: line,
      protocol: protocol === "hy2" ? "hysteria2" : (protocol === "wg" ? "wireguard" : protocol),
      remarks: remarks || address,
      address,
      port,
      uuid,
      cipher,
      password,
      username,
      flow,
      security,
      sni,
      host,
      path,
      serviceName,
      pbk,
      sid,
      spiderX,
      fingerprint,
      alpn: ["h2", "http/1.1"],
      pinnedPeerCertSha256,
      xhttpMode,
      xPaddingBytes,
      noGRPCHeader,
      noSSEHeader,
      kcpMtu,
      kcpTti,
      kcpUplink,
      kcpDownlink,
      kcpCongestion,
      wgPrivateKey,
      wgPublicKey,
      wgLocalIp,
      wgReserved,
      wgMtu,
      hyAuth,
      hyUp,
      hyDown,
      hyUdpHop,
      hyObfs,
      hyObfsPassword,
      tunnelNetwork,
      tunnelRewriteAddr,
      tunnelRewritePort,
      isHappyEyeballsEnabled,
      happyEyeballsDelay
    };
  }

  /**
   * Optional helper to parse Clash Meta YAML or Sing-box JSON proxy arrays.
   */
  private static parseClashOrSingbox(text: string): XrayConfig[] {
    const list: XrayConfig[] = [];
    try {
      // 1. Check for JSON (Sing-box outbounds)
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        const obj = JSON.parse(text);
        const outbounds = Array.isArray(obj) ? obj : (obj.outbounds || []);
        for (const ob of outbounds) {
          if (ob.server && ob.type && ob.type !== "direct" && ob.type !== "block") {
            const proto = ob.type === "hysteria2" ? "hysteria2" : ob.type;
            list.push({
              raw: `${proto}://${ob.uuid || ob.password || ''}@${ob.server}:${ob.server_port || 443}#${ob.tag || ob.server}`,
              protocol: proto,
              remarks: ob.tag || ob.server,
              address: ob.server,
              port: ob.server_port || 443,
              uuid: ob.uuid,
              password: ob.password,
              sni: ob.tls?.server_name || ""
            });
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    return list;
  }

  /**
   * Smart Deduplication based on unique connection tuple:
   * protocol + address + port + uuid/password/auth + path/sni
   */
  static deduplicateConfigs(configs: XrayConfig[]): { unique: XrayConfig[]; removedCount: number } {
    const seen = new Set<string>();
    const unique: XrayConfig[] = [];

    for (const c of configs) {
      const key = `${c.protocol}://${c.uuid || c.password || c.username || ''}@${c.address}:${c.port}/${c.path || ''}?sni=${c.sni || ''}&pbk=${c.pbk || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }

    return {
      unique,
      removedCount: configs.length - unique.length
    };
  }
}

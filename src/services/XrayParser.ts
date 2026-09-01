import { XrayConfig } from '../types';

export function decodeBase64Safe(str: string): string {
  let cleaned = str.replace(/[^a-zA-Z0-9+/=_-]/g, "");
  cleaned = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  while (cleaned.length % 4) {
    cleaned += "=";
  }
  try {
    return atob(cleaned);
  } catch (e) {
    return "";
  }
}

export function splitConcatenatedLinks(text: string): string[] {
  const protocolRegex = /(vless|vmess|ss|trojan|socks5|socks|http|https|wireguard|wg|hysteria2|hy2|hysteria|tunnel|xhttp|splithttp):\/\//gi;
  const matches: { index: number; protocol: string }[] = [];
  let match;
  
  while ((match = protocolRegex.exec(text)) !== null) {
    matches.push({ index: match.index, protocol: match[0] });
  }
  
  if (matches.length === 0) {
    return [text];
  }
  
  const links: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    const link = text.substring(start, end).trim();
    if (link) {
      links.push(link);
    }
  }
  return links;
}

export class XrayParser {
  static parseConfigsFromMessyText(rawText: string): XrayConfig[] {
    const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF\uFFFD]/g;
    const cleanedText = rawText.replace(CONTROL_CHARS_REGEX, "").trim();
    const configs: XrayConfig[] = [];

    let targetText = cleanedText;
    if (!cleanedText.includes("://")) {
      const decodedStr = decodeBase64Safe(cleanedText);
      if (decodedStr.includes("://")) {
        targetText = decodedStr;
      }
    }

    const rawLines = targetText.split(/\r?\n/);
    const lines: string[] = [];
    for (const rawLine of rawLines) {
      const splitLinks = splitConcatenatedLinks(rawLine);
      lines.push(...splitLinks);
    }

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const protoMatch = line.match(/^(vless|vmess|ss|trojan|socks5|socks|http|https|wireguard|wg|hysteria2|hy2|hysteria|tunnel|xhttp|splithttp):\/\//i);
      if (!protoMatch) continue;

      const protocol = protoMatch[1].toLowerCase();
      const rawUrl = protoMatch[0];
      const afterProto = line.substring(rawUrl.length);

      const hashIdx = afterProto.indexOf('#');
      let body = hashIdx !== -1 ? afterProto.substring(0, hashIdx) : afterProto;
      const rawRemarks = hashIdx !== -1 ? afterProto.substring(hashIdx + 1) : "";

      let remarks = "";
      try {
        remarks = decodeURIComponent(rawRemarks);
      } catch (e) {
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
              port = parseInt(json.port) || 1080;
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
          } catch (e) {
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
                port = parseInt(afterBracket.substring(1)) || 51820;
              }
            }
          } else {
            if (hostPort.includes(":")) {
              address = hostPort.substring(0, hostPort.lastIndexOf(":"));
              port = parseInt(hostPort.substring(hostPort.lastIndexOf(":") + 1)) || 51820;
            } else {
              address = hostPort;
              port = 51820;
            }
          }

          wgPublicKey = parsedParams["public-key"] || parsedParams["publickey"] || "";
          wgLocalIp = parsedParams["ip"] || parsedParams["address"] || "10.0.0.2";
          wgReserved = parsedParams["reserved"] || "";
          wgMtu = parseInt(parsedParams["mtu"]) || 1420;
        } else {
          // Standard URI query parsing for VLESS, Trojan, SS, SOCKS, HTTP, xhttp, splithttp
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
                port = parseInt(afterBracket.substring(1)) || 1080;
              }
            }
          } else {
            if (hostPort.includes(":")) {
              address = hostPort.substring(0, hostPort.lastIndexOf(":"));
              port = parseInt(hostPort.substring(hostPort.lastIndexOf(":") + 1)) || 1080;
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
                  queryParams[k] = decodeURIComponent(v);
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

          kcpMtu = parseInt(queryParams["mtu"]) || 1350;
          kcpTti = parseInt(queryParams["tti"]) || 50;
          kcpUplink = parseInt(queryParams["uplinkcapacity"]) || 5;
          kcpDownlink = parseInt(queryParams["downlinkcapacity"]) || 20;
          kcpCongestion = queryParams["congestion"] === "true";

          isHappyEyeballsEnabled = queryParams["happyeyeballs"] === "true";
          happyEyeballsDelay = parseInt(queryParams["trydelayms"]) || 250;

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
              } catch (e) {
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
            case "https":
              const colonIdx = authPart.indexOf(":");
              if (colonIdx !== -1) {
                username = authPart.substring(0, colonIdx);
                password = authPart.substring(colonIdx + 1);
              } else {
                username = authPart;
              }
              break;
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
              tunnelRewritePort = parseInt(queryParams["rewriteport"]) || 0;
              break;
          }
        }
      } catch (e) {
        console.error("Error parsing config link", e);
      }

      if (address) {
        configs.push({
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
        });
      }
    }

    return configs;
  }

  // Deduplication based on unique connection tuple: protocol + address + port + uuid/password + path/sni
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

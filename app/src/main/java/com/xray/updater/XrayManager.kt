package com.xray.updater

import android.os.Build
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.net.Proxy
import java.net.Socket
import java.net.URLDecoder
import java.util.regex.Pattern
import java.util.zip.ZipInputStream
import kotlin.math.pow
import kotlin.math.sqrt

// مدل داده ۱۰۰٪ تکامل‌یافته جهت پوشش کامل متغیرها، پدهای تصادفی، ردیف‌های فرگمنت، وایرگارد، هیستریا و ماسکینگ‌های ترنسپورت
data class XrayConfig(
    val raw: String,
    val protocol: String, // vless, vmess, trojan, ss, socks, http, wireguard, hysteria, tunnel, raw
    val remarks: String,
    val address: String,
    val port: Int,
    
    // پارامترهای احراز هویت لایه ۷ و هسته
    val uuid: String = "",       
    val password: String = "",   
    val username: String = "",   
    val cipher: String = "",     
    val flow: String = "",       

    // پارامترهای لایه انتقال و امنیت (XHTTP / TLS / Reality / WebSocket / gRPC / HTTPUpgrade)
    val security: String = "",   // none, tls, reality
    val sni: String = "",
    val host: String = "",       
    val path: String = "",       
    val serviceName: String = "",
    val pbk: String = "",        // Reality Public Key (password)
    val sid: String = "",        // Reality Short ID
    val spiderX: String = "",    // Reality SpiderX Crawler Path
    val fingerprint: String = "chrome", // uTLS Fingerprint (chrome, firefox, safari, randomized, unsafe)
    val alpn: List<String> = listOf("h2", "http/1.1"),
    val pinnedPeerCertSha256: String = "", // هش اثر انگشت سرور جهت دور زدن CA سیستم

    // پارامترهای انحصاری لایه انتقال فوق مدرن XHTTP
    val xhttpMode: String = "auto", // auto, packet-up, stream-up, stream-one
    val xPaddingBytes: String = "100-1000", // هدر پدینگ تصادفی جهت تصفیه اثر انگشت حجم بایت‌ها
    val noGRPCHeader: Boolean = false,
    val noSSEHeader: Boolean = false,

    // پارامترهای انحصاری لایه انتقال mKCP
    val kcpMtu: Int = 1350,
    val kcpTti: Int = 50,
    val kcpUplink: Int = 5,
    val kcpDownlink: Int = 20,
    val kcpCongestion: Boolean = false,

    // پارامترهای انحصاری WireGuard
    val wgPrivateKey: String = "",
    val wgPublicKey: String = "",
    val wgLocalIp: String = "",
    val wgReserved: String = "", 
    val wgMtu: Int = 1420,

    // پارامترهای انحصاری Hysteria / Hysteria 2 / Brutal Congestion
    val hyAuth: String = "",
    val hyUp: String = "",
    val hyDown: String = "",
    val hyUdpHop: String = "", // ردیف پورت‌های جهشی (مثلاً 20000-50000)

    // پارامترهای انحصاری Tunnel (dokodemo-door)
    val tunnelNetwork: String = "tcp",
    val tunnelRewriteAddr: String = "localhost",
    val tunnelRewritePort: Int = 0,

    // پارامترهای پیشرفته Sockopt و تکنولوژی مبارزه با تاخیر Happy Eyeballs
    val isHappyEyeballsEnabled: Boolean = false,
    val happyEyeballsDelay: Int = 250,

    // قابلیت‌های فرگمنت، فینال‌ماسک و مالتی‌پلکس
    var isFragmentEnabled: Boolean = false,
    var fragmentLength: String = "100-200",
    var fragmentInterval: String = "10-20",
    var isMuxEnabled: Boolean = false,
    var muxConcurrency: Int = 8,
    var xudpConcurrency: Int = 16,
    var xudpProxyUDP443: String = "reject"
)

enum class SiteStatus {
    SAFE, SANCTIONED, POISONED, FAILED
}

data class DiagnosticReport(
    val domain: String,
    val status: SiteStatus,
    val rttMs: Long,
    val ip: String
)

data class TestResult(
    val config: XrayConfig,
    var tcpPing: Long = -1,
    var jitter: Double = -1.0,
    var realDelay: Long = -1,
    var downloadSpeedMbps: Double = -1.0,
    var uploadSpeedMbps: Double = -1.0,
    val siteReports: MutableList<DiagnosticReport> = mutableListOf(),
    var isHealthy: Boolean = false
)

object XrayManager {
    private val client = OkHttpClient.Builder().build()
    private const val GITHUB_API_URL = "https://api.github.com/repos/xtls/xray-core/releases/latest"
    private val CONTROL_CHARS_REGEX = Regex("[\\x00-\\x1F\\x7F-\\x9F\\u200B-\\u200D\\uFEFF\\uFFFD]")

    fun getDeviceArchitecture(): String {
        val abi = Build.SUPPORTED_ABIS.firstOrNull() ?: "arm64-v8a"
        return when {
            abi.contains("arm64") -> "arm64-v8a"
            abi.contains("armeabi-v7a") || abi.contains("armeabi") -> "armeabi-v7a"
            abi.contains("x86_64") -> "x86_64"
            abi.contains("x86") -> "x86"
            else -> "arm64-v8a"
        }
    }

    suspend fun fetchLatestXrayVersion(): String? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(GITHUB_API_URL)
                .header("User-Agent", "Xray-Multi-Test-Android")
                .build()
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val json = JSONObject(response.body?.string() ?: "")
                    return@withContext json.getString("tag_name")
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext null
    }

    suspend fun downloadAndInstallCore(
        version: String,
        targetDir: File,
        onProgress: (String, Float) -> Unit
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val arch = getDeviceArchitecture()
            val zipName = "Xray-android-$arch.zip"
            val downloadUrl = "https://github.com/xtls/xray-core/releases/download/$version/$zipName"

            onProgress("Downloading...", 0.1f)
            val request = Request.Builder().url(downloadUrl).build()
            
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext false
                
                val body = response.body ?: return@withContext false
                val totalBytes = body.contentLength()
                val tempZipFile = File(targetDir, "temp_xray.zip")
                
                body.byteStream().use { input ->
                    FileOutputStream(tempZipFile).use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        var downloadedBytes: Long = 0
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            downloadedBytes += bytesRead
                            if (totalBytes > 0) {
                                val progress = 0.1f + ((downloadedBytes.toFloat() / totalBytes.toFloat()) * 0.7f)
                                onProgress("Downloading...", progress)
                            }
                        }
                    }
                }

                onProgress("Extracting...", 0.85f)
                ZipInputStream(BufferedInputStream(tempZipFile.inputStream())).use { zis ->
                    var entry = zis.nextEntry
                    while (entry != null) {
                        val outFile = File(targetDir, entry.name)
                        if (entry.isDirectory) {
                            outFile.mkdirs()
                        } else {
                            outFile.parentFile?.mkdirs()
                            FileOutputStream(outFile).use { fos ->
                                val buffer = ByteArray(8192)
                                var len: Int
                                while (zis.read(buffer).also { len = it } != -1) {
                                    fos.write(buffer, 0, len)
                                }
                            }
                            if (entry.name == "xray" || entry.name.endsWith(".so")) {
                                outFile.setExecutable(true, false)
                            }
                        }
                        zis.closeEntry()
                        entry = zis.nextEntry
                    }
                }
                tempZipFile.delete()
                onProgress("Success", 1.0f)
                return@withContext true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext false
    }

    // پارسر هوشمند با پشتیبانی کامل از متن‌های مخدوش به همراه دکود بیس۶۴ [9, 14]
    fun parseConfigsFromMessyText(rawText: String): List<XrayConfig> {
        val cleanedText = rawText.replace(CONTROL_CHARS_REGEX, "").trim()
        val configs = mutableListOf<XrayConfig>()
        
        var targetText = cleanedText
        if (!cleanedText.contains("://")) {
            val b64Chars = cleanedText.replace(Regex("[^a-zA-Z0-9+/=_-]"), "")
            if (b64Chars.length >= 10) {
                try {
                    val decodedBytes = Base64.decode(b64Chars, Base64.DEFAULT)
                    val decodedStr = String(decodedBytes, Charsets.UTF_8)
                    if (decodedStr.contains("://")) {
                        targetText = decodedStr
                    }
                } catch (e: Exception) {
                    // در صورت خطای بیس۶۴ فرآیند تصفیه متن اصلی ادامه می‌یابد
                }
            }
        }

        val pattern = Pattern.compile("(vless|vmess|ss|trojan|socks5|socks|http|https|wireguard|wg|hysteria2|hy2|hysteria|tunnel|xhttp)://([^\\s#]+)(?:#([^\\s]+))?", Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(targetText)

        while (matcher.find()) {
            val protocol = matcher.group(1)?.lowercase() ?: ""
            val body = matcher.group(2) ?: ""
            val rawRemarks = matcher.group(3) ?: ""
            val remarks = runCatching { URLDecoder.decode(rawRemarks, "UTF-8") }.getOrDefault(rawRemarks)

            var address = ""
            var port = 1080
            var uuid = ""
            var cipher = ""
            var password = ""
            var username = ""
            var flow = ""
            var security = ""
            var sni = ""
            var host = ""
            var path = ""
            var serviceName = ""
            var pbk = ""
            var sid = ""
            var spiderX = ""
            var fingerprint = "chrome"
            var pinnedPeerCertSha256 = ""
            
            var xhttpMode = "auto"
            var xPaddingBytes = "100-1000"
            var noGRPCHeader = false
            var noSSEHeader = false

            var kcpMtu = 1350
            var kcpTti = 50
            var kcpUplink = 5
            var kcpDownlink = 20
            var kcpCongestion = false
            
            var wgPrivateKey = ""
            var wgPublicKey = ""
            var wgLocalIp = ""
            var wgReserved = ""
            var wgMtu = 1420
            
            var hyAuth = ""
            var hyUp = ""
            var hyDown = ""
            var hyUdpHop = ""
            
            var tunnelNetwork = "tcp"
            var tunnelRewriteAddr = "localhost"
            var tunnelRewritePort = 0

            var isHappyEyeballsEnabled = false
            var happyEyeballsDelay = 250

            try {
                if (protocol == "vmess") {
                    val decodedJson = String(Base64.decode(body, Base64.DEFAULT), Charsets.UTF_8)
                    val json = JSONObject(decodedJson)
                    address = json.optString("add", "")
                    port = json.optInt("port", 1080)
                    uuid = json.optString("id", "")
                    cipher = json.optString("scy", "auto")
                    path = json.optString("path", "")
                    host = json.optString("host", "")
                    security = json.optString("tls", "")
                    sni = json.optString("sni", "")
                } else if (protocol == "wireguard" || protocol == "wg") {
                    val queryStr = if (body.contains("?")) body.substringAfter("?") else ""
                    val mainPart = if (body.contains("?")) body.substringBefore("?") else body
                    
                    val parsedParams = queryStr.split("&").associate {
                        val parts = it.split("=")
                        if (parts.size == 2) parts[0].lowercase() to URLDecoder.decode(parts[1], "UTF-8") else "" to ""
                    }
                    
                    wgPrivateKey = if (mainPart.contains("@")) mainPart.substringBefore("@") else ""
                    val hostPort = if (mainPart.contains("@")) mainPart.substringAfter("@") else mainPart
                    if (hostPort.contains(":")) {
                        address = hostPort.substringBeforeLast(":")
                        port = hostPort.substringAfterLast(":").toIntOrNull() ?: 51820
                    } else {
                        address = hostPort
                        port = 51820
                    }
                    
                    wgPublicKey = parsedParams["public-key"] ?: parsedParams["publickey"] ?: ""
                    wgLocalIp = parsedParams["ip"] ?: parsedParams["address"] ?: "10.0.0.2"
                    wgReserved = parsedParams["reserved"] ?: ""
                    wgMtu = parsedParams["mtu"]?.toIntOrNull() ?: 1420
                } else {
                    val uriPart = if (body.contains("@")) body.substringAfter("@") else body
                    val authPart = if (body.contains("@")) body.substringBefore("@") else ""
                    val hostPort = uriPart.substringBefore("/").substringBefore("?")
                    
                    if (hostPort.contains(":")) {
                        address = hostPort.substringBeforeLast(":")
                        port = hostPort.substringAfterLast(":").toIntOrNull() ?: 1080
                    } else {
                        address = hostPort
                    }

                    val queryParams = if (uriPart.contains("?")) {
                        uriPart.substringAfter("?").split("&").associate {
                            val parts = it.split("=")
                            if (parts.size == 2) parts[0].lowercase() to URLDecoder.decode(parts[1], "UTF-8") else "" to ""
                        }
                    } else emptyMap()

                    security = queryParams["security"] ?: ""
                    sni = queryParams["sni"] ?: ""
                    host = queryParams["host"] ?: ""
                    path = queryParams["path"] ?: ""
                    serviceName = queryParams["servicename"] ?: ""
                    flow = queryParams["flow"] ?: ""
                    pbk = queryParams["pbk"] ?: queryParams["publickey"] ?: ""
                    sid = queryParams["sid"] ?: ""
                    spiderX = queryParams["spiderx"] ?: ""
                    fingerprint = queryParams["fp"] ?: queryParams["fingerprint"] ?: "chrome"
                    pinnedPeerCertSha256 = queryParams["pinnedpeercertsha256"] ?: ""
                    
                    xhttpMode = queryParams["mode"] ?: "auto"
                    xPaddingBytes = queryParams["xpaddingbytes"] ?: "100-1000"
                    noGRPCHeader = queryParams["nogrpcheader"]?.toBoolean() ?: false
                    noSSEHeader = queryParams["nosseheader"]?.toBoolean() ?: false

                    kcpMtu = queryParams["mtu"]?.toIntOrNull() ?: 1350
                    kcpTti = queryParams["tti"]?.toIntOrNull() ?: 50
                    kcpUplink = queryParams["uplinkcapacity"]?.toIntOrNull() ?: 5
                    kcpDownlink = queryParams["downlinkcapacity"]?.toIntOrNull() ?: 20
                    kcpCongestion = queryParams["congestion"]?.toBoolean() ?: false

                    isHappyEyeballsEnabled = queryParams["happyeyeballs"]?.toBoolean() ?: false
                    happyEyeballsDelay = queryParams["trydelayms"]?.toIntOrNull() ?: 250

                    when (protocol) {
                        "vless" -> uuid = authPart
                        "trojan" -> password = authPart
                        "ss" -> {
                            val decodedAuth = runCatching { String(Base64.decode(authPart, Base64.DEFAULT), Charsets.UTF_8) }.getOrNull() ?: authPart
                            if (decodedAuth.contains(":")) {
                                cipher = decodedAuth.substringBefore(":")
                                password = decodedAuth.substringAfter(":")
                            }
                        }
                        "socks5", "socks", "http", "https" -> {
                            if (authPart.contains(":")) {
                                username = authPart.substringBefore(":")
                                password = authPart.substringAfter(":")
                            } else {
                                username = authPart
                            }
                        }
                        "hysteria2", "hy2", "hysteria" -> {
                            hyAuth = authPart
                            hyUp = queryParams["up"] ?: ""
                            hyDown = queryParams["down"] ?: ""
                            hyUdpHop = queryParams["ports"] ?: ""
                        }
                        "tunnel" -> {
                            tunnelNetwork = queryParams["network"] ?: "tcp"
                            tunnelRewriteAddr = queryParams["rewriteaddress"] ?: "localhost"
                            tunnelRewritePort = queryParams["rewriteport"]?.toIntOrNull() ?: 0
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            if (address.isNotEmpty()) {
                configs.add(
                    XrayConfig(
                        raw = matcher.group(0) ?: "",
                        protocol = protocol,
                        remarks = remarks.ifEmpty { address },
                        address = address,
                        port = port,
                        uuid = uuid,
                        cipher = cipher,
                        password = password,
                        username = username,
                        flow = flow,
                        security = security,
                        sni = sni,
                        host = host,
                        path = path,
                        serviceName = serviceName,
                        pbk = pbk,
                        sid = sid,
                        spiderX = spiderX,
                        fingerprint = fingerprint,
                        pinnedPeerCertSha256 = pinnedPeerCertSha256,
                        xhttpMode = xhttpMode,
                        xPaddingBytes = xPaddingBytes,
                        noGRPCHeader = noGRPCHeader,
                        noSSEHeader = noSSEHeader,
                        kcpMtu = kcpMtu,
                        kcpTti = kcpTti,
                        kcpUplink = kcpUplink,
                        kcpDownlink = kcpDownlink,
                        kcpCongestion = kcpCongestion,
                        wgPrivateKey = wgPrivateKey,
                        wgPublicKey = wgPublicKey,
                        wgLocalIp = wgLocalIp,
                        wgReserved = wgReserved,
                        wgMtu = wgMtu,
                        hyAuth = hyAuth,
                        hyUp = hyUp,
                        hyDown = hyDown,
                        tunnelNetwork = tunnelNetwork,
                        tunnelRewriteAddr = tunnelRewriteAddr,
                        tunnelRewritePort = tunnelRewritePort
                    )
                )
            }
        }
        return configs
    }

    // متد اصلاح‌شده تولید خودکار و پویا ساختار فایل پیکربندی به روش تخصیص بدون لامبدا جهت رفع کامل ارور Unresolved Reference
    fun generateXrayJsonConfig(config: XrayConfig, socksPort: Int): String {
        val outJson = JSONObject().apply {
            put("protocol", when(config.protocol) {
                "wg", "wireguard" -> "wireguard"
                "hy2", "hysteria2", "hysteria" -> "hysteria"
                "socks5" -> "socks"
                else -> config.protocol
            })
            
            val settings = JSONObject()
            when (config.protocol) {
                "vless" -> {
                    settings.put("vnext", JSONArray().apply {
                        put(JSONObject().apply {
                            put("address", config.address)
                            put("port", config.port)
                            put("users", JSONArray().apply {
                                put(JSONObject().apply {
                                    put("id", config.uuid)
                                    put("encryption", "none")
                                    if (config.flow.isNotEmpty()) {
                                        put("flow", config.flow)
                                    }
                                })
                            })
                        })
                    })
                }
                "vmess" -> {
                    settings.put("vnext", JSONArray().apply {
                        put(JSONObject().apply {
                            put("address", config.address)
                            put("port", config.port)
                            put("users", JSONArray().apply {
                                put(JSONObject().apply {
                                    put("id", config.uuid)
                                    put("security", config.cipher.ifEmpty { "auto" })
                                })
                            })
                        })
                    })
                }
                "trojan" -> {
                    settings.put("servers", JSONArray().apply {
                        put(JSONObject().apply {
                            put("address", config.address)
                            put("port", config.port)
                            put("password", config.password)
                        })
                    })
                }
                "ss" -> {
                    settings.put("servers", JSONArray().apply {
                        put(JSONObject().apply {
                            put("address", config.address)
                            put("port", config.port)
                            put("method", config.cipher)
                            put("password", config.password)
                        })
                    })
                }
                "socks5", "socks", "http", "https" -> {
                    settings.put("servers", JSONArray().apply {
                        put(JSONObject().apply {
                            put("address", config.address)
                            put("port", config.port)
                            if (config.username.isNotEmpty()) {
                                put("users", JSONArray().apply {
                                    put(JSONObject().apply {
                                        put("user", config.username)
                                        put("pass", config.password)
                                    })
                                })
                            }
                        })
                    })
                }
                "wireguard", "wg" -> {
                    settings.put("secretKey", config.wgPrivateKey)
                    settings.put("mtu", config.wgMtu)
                    settings.put("peers", JSONArray().apply {
                        put(JSONObject().apply {
                            put("publicKey", config.wgPublicKey)
                            put("allowedIPs", JSONArray().apply {
                                put("0.0.0.0/0")
                                put("::/0")
                            })
                        })
                    })
                }
                "hysteria", "hysteria2", "hy2" -> {
                    settings.put("version", 2)
                    settings.put("users", JSONArray().apply {
                        put(JSONObject().apply {
                            put("auth", config.hyAuth)
                        })
                    })
                }
                "tunnel" -> {
                    settings.put("allowedNetwork", config.tunnelNetwork)
                    settings.put("rewriteAddress", config.tunnelRewriteAddr)
                    if (config.tunnelRewritePort > 0) {
                        settings.put("rewritePort", config.tunnelRewritePort)
                    }
                }
            }
            put("settings", settings)

            // لایه انتقال و امنیت (StreamSettings)
            val streamSettings = JSONObject()
            
            val networkType = when (config.protocol) {
                "xhttp" -> "xhttp"
                "wireguard", "wg" -> "raw"
                "hysteria", "hysteria2", "hy2" -> "hysteria"
                else -> {
                    if (config.path.isNotEmpty() || config.host.isNotEmpty()) "websocket"
                    else if (config.serviceName.isNotEmpty()) "grpc"
                    else "raw"
                }
            }
            streamSettings.put("network", networkType)

            when (networkType) {
                "xhttp" -> {
                    val xhttpSettings = JSONObject().apply {
                        put("mode", config.xhttpMode)
                        val extra = JSONObject().apply {
                            put("xPaddingBytes", config.xPaddingBytes)
                            put("noGRPCHeader", config.noGRPCHeader)
                            put("noSSEHeader", config.noSSEHeader)
                        }
                        put("extra", extra)
                    }
                    streamSettings.put("xhttpSettings", xhttpSettings)
                }
                "websocket" -> {
                    val wsSettings = JSONObject().apply {
                        put("path", config.path)
                        put("headers", JSONObject().apply {
                            put("Host", config.host)
                        })
                    }
                    streamSettings.put("wsSettings", wsSettings)
                }
                "grpc" -> {
                    val grpcSettings = JSONObject().apply {
                        put("serviceName", config.serviceName)
                    }
                    streamSettings.put("grpcSettings", grpcSettings)
                }
                "mkcp" -> {
                    val kcpSettings = JSONObject().apply {
                        put("mtu", config.kcpMtu)
                        put("tti", config.kcpTti)
                        put("uplinkCapacity", config.kcpUplink)
                        put("downlinkCapacity", config.kcpDownlink)
                        put("congestion", config.kcpCongestion)
                    }
                    streamSettings.put("kcpSettings", kcpSettings)
                }
                "hysteria" -> {
                    val hysteriaSettings = JSONObject().apply {
                        put("version", 2)
                        put("auth", config.hyAuth)
                    }
                    streamSettings.put("hysteriaSettings", hysteriaSettings)
                }
            }

            if (config.security.isNotEmpty()) {
                streamSettings.put("security", config.security)
                
                if (config.security == "tls") {
                    val tlsSettings = JSONObject().apply {
                        put("serverName", config.sni)
                        put("allowInsecure", true)
                        put("fingerprint", config.fingerprint)
                        if (config.pinnedPeerCertSha256.isNotEmpty()) {
                            put("pinnedPeerCertSha256", config.pinnedPeerCertSha256)
                        }
                    }
                    streamSettings.put("tlsSettings", tlsSettings)
                } else if (config.security == "reality") {
                    val realitySettings = JSONObject().apply {
                        put("publicKey", config.pbk)
                        put("shortId", config.sid)
                        put("serverName", config.sni)
                        put("fingerprint", config.fingerprint)
                        if (config.spiderX.isNotEmpty()) {
                            put("spiderX", config.spiderX)
                        }
                    }
                    streamSettings.put("realitySettings", realitySettings)
                }
            }

            // لایه فرستنده و مسیریابی سوکت محلی اصلاح شده جهت رفع قطعی باگ Unresolved Reference
            val sockopt = JSONObject()
            if (config.isHappyEyeballsEnabled) {
                sockopt.put("domainStrategy", "ForceIP")
                val happyEyeballs = JSONObject()
                happyEyeballs.put("tryDelayMs", config.happyEyeballsDelay)
                happyEyeballs.put("prioritizeIPv6", false)
                happyEyeballs.put("interleave", 1)
                happyEyeballs.put("maxConcurrentTry", 4)
                sockopt.put("happyEyeballs", happyEyeballs)
            }
            
            // پیاده‌سازی اصلاح‌شده فرگمنت (Fragment) تحت عنوان لایه‌گذاری فینال‌ماسک ترافیکی
            val finalmask = JSONObject()
            if (config.isFragmentEnabled) {
                val tcpArray = JSONArray()
                val fragmentObj = JSONObject()
                fragmentObj.put("type", "fragment")
                
                val fragmentSettingsObj = JSONObject()
                fragmentSettingsObj.put("packets", "tlshello")
                fragmentSettingsObj.put("length", config.fragmentLength)
                fragmentSettingsObj.put("delay", config.fragmentInterval)
                fragmentSettingsObj.put("maxSplit", "3-6")
                
                fragmentObj.put("settings", fragmentSettingsObj)
                tcpArray.put(fragmentObj)
                finalmask.put("tcp", tcpArray)
            }

            // ادغام پارامترهای جهش پورت (UDP Port Hopping) و تنظیمات Brutal برای هیستریا و XHTTP H3
            if (config.hyUdpHop.isNotEmpty() && (config.protocol.contains("hysteria") || config.protocol == "xhttp")) {
                val quicParams = JSONObject()
                quicParams.put("congestion", "force-brutal")
                quicParams.put("brutalUp", config.hyUp.ifEmpty { "20 mbps" })
                quicParams.put("brutalDown", config.hyDown.ifEmpty { "100 mbps" })
                
                val udpHop = JSONObject()
                udpHop.put("ports", config.hyUdpHop)
                udpHop.put("interval", 15)
                
                quicParams.put("udpHop", udpHop)
                finalmask.put("quicParams", quicParams)
            }

            streamSettings.put("sockopt", sockopt)
            streamSettings.put("finalmask", finalmask)
            put("streamSettings", streamSettings)

            // تنظیمات Multiplexing لایه‌های ترافیکی موازی (Mux & XUDP)
            if (config.isMuxEnabled) {
                val mux = JSONObject().apply {
                    put("enabled", true)
                    put("concurrency", config.muxConcurrency)
                    put("xudpConcurrency", config.xudpConcurrency)
                    put("xudpProxyUDP443", config.xudpProxyUDP443) 
                }
                put("mux", mux)
            }
        }

        val root = JSONObject().apply {
            put("inbounds", JSONArray().apply {
                put(JSONObject().apply {
                    put("port", socksPort)
                    put("protocol", "socks")
                    put("settings", JSONObject().apply {
                        put("auth", "noauth")
                        put("udp", true)
                    })
                })
            })
            put("outbounds", JSONArray().apply {
                put(outJson)
                put(JSONObject().apply {
                    put("protocol", "freedom")
                    put("tag", "direct")
                })
            })
            put("routing", JSONObject().apply {
                put("domainStrategy", "IPIfNonMatch")
                put("rules", JSONArray().apply {
                    put(JSONObject().apply {
                        put("ip", JSONArray().apply { put("geoip:private") })
                        put("outboundTag", "direct")
                    })
                })
            })
        }
        return root.toString()
    }

    suspend fun performTcpPing(host: String, port: Int, timeoutMs: Int): Long = withContext(Dispatchers.IO) {
        val start = System.currentTimeMillis()
        try {
            Socket().use { socket ->
                socket.connect(InetSocketAddress(host, port), timeoutMs)
                return@withContext System.currentTimeMillis() - start
            }
        } catch (e: Exception) {
            return@withContext -1L
        }
    }

    suspend fun calculateJitter(host: String, port: Int, timeoutMs: Int): Double = withContext(Dispatchers.IO) {
        val samples = mutableListOf<Long>()
        repeat(5) {
            val ping = performTcpPing(host, port, timeoutMs)
            if (ping > 0) samples.add(ping)
        }
        if (samples.size < 2) return@withContext -1.0
        val mean = samples.average()
        val variance = samples.map { (it - mean).pow(2) }.sum() / samples.size
        return@withContext sqrt(variance)
    }

    suspend fun checkRealProxyDiagnostic(
        domain: String,
        socksPort: Int,
        timeoutMs: Int
    ): DiagnosticReport = withContext(Dispatchers.IO) {
        val start = System.currentTimeMillis()
        val proxy = Proxy(Proxy.Type.SOCKS, InetSocketAddress("127.0.0.1", socksPort))
        val proxyClient = OkHttpClient.Builder()
            .proxy(proxy)
            .connectTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
            .readTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
            .build()

        val request = Request.Builder()
            .url("https://$domain")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Xray-Multi-Test-Android")
            .build()

        var resolvedIP = "0.0.0.0"
        try {
            resolvedIP = java.net.InetAddress.getByName(domain).hostAddress ?: "0.0.0.0"
            if (resolvedIP.startsWith("10.10.34.")) {
                return@withContext DiagnosticReport(domain, SiteStatus.POISONED, System.currentTimeMillis() - start, resolvedIP)
            }

            proxyClient.newCall(request).execute().use { response ->
                val rtt = System.currentTimeMillis() - start
                return@withContext when (response.code) {
                    200, 204 -> DiagnosticReport(domain, SiteStatus.SAFE, rtt, resolvedIP)
                    403 -> DiagnosticReport(domain, SiteStatus.SANCTIONED, rtt, resolvedIP)
                    else -> DiagnosticReport(domain, SiteStatus.FAILED, rtt, resolvedIP)
                }
            }
        } catch (e: Exception) {
            val rtt = System.currentTimeMillis() - start
            return@withContext DiagnosticReport(domain, SiteStatus.FAILED, rtt, resolvedIP)
        }
    }

    suspend fun performDownloadSpeedTest(
        socksPort: Int,
        timeoutMs: Int
    ): Double = withContext(Dispatchers.IO) {
        val speedTestUrl = "http://speed.cloudflare.com/__down?bytes=1048576"
        val start = System.currentTimeMillis()
        var totalBytesRead = 0L
        val proxy = Proxy(Proxy.Type.SOCKS, InetSocketAddress("127.0.0.1", socksPort))
        
        try {
            val proxyClient = OkHttpClient.Builder()
                .proxy(proxy)
                .connectTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .readTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .build()

            val request = Request.Builder().url(speedTestUrl).build()
            proxyClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext 0.0
                val body = response.body ?: return@withContext 0.0
                val stream = body.byteStream()
                val buffer = ByteArray(4096)
                var bytesRead: Int
                while (stream.read(buffer).also { bytesRead = it } != -1) {
                    totalBytesRead += bytesRead
                }
            }
            val totalTime = (System.currentTimeMillis() - start) / 1000.0
            if (totalTime > 0) {
                return@withContext ((totalBytesRead * 8) / (1024.0 * 1024.0)) / totalTime
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext 0.0
    }

    suspend fun performUploadSpeedTest(
        socksPort: Int,
        timeoutMs: Int
    ): Double = withContext(Dispatchers.IO) {
        val speedTestUrl = "https://speed.cloudflare.com/__up"
        val dummyPayload = ByteArray(250 * 1024)
        val start = System.currentTimeMillis()
        val proxy = Proxy(Proxy.Type.SOCKS, InetSocketAddress("127.0.0.1", socksPort))
        
        try {
            val proxyClient = OkHttpClient.Builder()
                .proxy(proxy)
                .connectTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .writeTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .build()

            val request = Request.Builder()
                .url(speedTestUrl)
                .post(dummyPayload.toRequestBody())
                .build()

            proxyClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val totalTime = (System.currentTimeMillis() - start) / 1000.0
                    if (totalTime > 0) {
                        return@withContext ((dummyPayload.size * 8) / (1024.0 * 1024.0)) / totalTime
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext 0.0
    }

    suspend fun fetchSubscriptionConfigs(subUrl: String): List<XrayConfig> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(subUrl).build()
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string() ?: ""
                    return@withContext parseConfigsFromMessyText(bodyString)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext emptyList()
    }
}

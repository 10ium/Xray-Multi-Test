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

data class XrayConfig(
    val raw: String,
    val protocol: String,
    val remarks: String,
    val address: String,
    val port: Int,
    val uuid: String = "",
    val id: String = "",
    val cipher: String = "",
    val password: String = "",
    val security: String = "",
    val sni: String = "",
    val host: String = ""
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
    
    // کاراکترهای کنترلی مخدوش و مخفی یونیکد جهت پالایش متن خام [14]
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

    // پارسر هوشمند و مقاوم در برابر متن‌های مخدوش به همراه دکود خودکار فرمت‌های Base64 متنی [9, 14]
    fun parseConfigsFromMessyText(rawText: String): List<XrayConfig> {
        val cleanedText = rawText.replace(CONTROL_CHARS_REGEX, "").trim()
        val configs = mutableListOf<XrayConfig>()
        
        // تلاش برای دیکد بیس۶۴ کل متن ورودی (در صورتی که ساب کل بیس۶۴ باشد) [9]
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
                    // در صورت بروز خطا به همان دیتای متنی خام مراجعه می‌شود
                }
            }
        }

        // الگوی پترن مقاوم برای یافتن پروتکل‌ها حتی در وسط متون وب و لاگ‌ها [9]
        val pattern = Pattern.compile("(vless|vmess|ss|trojan)://([^\\s#]+)(?:#([^\\s]+))?", Pattern.CASE_INSENSITIVE)
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
            var security = ""
            var sni = ""
            var host = ""

            try {
                if (protocol == "vmess") {
                    val decodedJson = String(Base64.decode(body, Base64.DEFAULT), Charsets.UTF_8)
                    val json = JSONObject(decodedJson)
                    address = json.optString("add", "")
                    port = json.optInt("port", 1080)
                    uuid = json.optString("id", "")
                    cipher = json.optString("scy", "auto")
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

                    if (protocol == "vless" || protocol == "trojan") {
                        uuid = authPart
                        password = authPart
                        // استخراج فیلدهای ضروری مانند SNI و Security
                        if (uriPart.contains("?")) {
                            val queryParams = uriPart.substringAfter("?").split("&")
                            for (param in queryParams) {
                                val pair = param.split("=")
                                if (pair.size == 2) {
                                    when (pair[0].lowercase()) {
                                        "security" -> security = pair[1]
                                        "sni" -> sni = pair[1]
                                        "host" -> host = pair[1]
                                    }
                                }
                            }
                        }
                    } else if (protocol == "ss") {
                        // رمزگشایی بیس۶۴ ساب‌متد شادوساکس
                        val decodedAuth = runCatching { String(Base64.decode(authPart, Base64.DEFAULT), Charsets.UTF_8) }.getOrNull() ?: authPart
                        if (decodedAuth.contains(":")) {
                            cipher = decodedAuth.substringBefore(":")
                            password = decodedAuth.substringAfter(":")
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
                        security = security,
                        sni = sni,
                        host = host
                    )
                )
            }
        }
        return configs
    }

    // ایجاد پویای فایل کانفیگ موقت Xray برای اجرای لوکال هسته جهت ارزیابی واقعی پروکسی
    fun generateXrayJsonConfig(config: XrayConfig, socksPort: Int): String {
        val outJson = JSONObject().apply {
            put("protocol", config.protocol)
            put("address", config.address)
            put("port", config.port)
            
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
            }
            put("settings", settings)

            // اعمال کانفیگ لایه امنیتی شبکه (TLS/Reality)
            if (config.security.isNotEmpty()) {
                val streamSettings = JSONObject().apply {
                    put("network", "tcp")
                    put("security", config.security)
                    val tlsSettings = JSONObject().apply {
                        put("serverName", config.sni)
                    }
                    put("${config.security}Settings", tlsSettings)
                }
                put("streamSettings", streamSettings)
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

    // تست دسترسی واقعی به ۱۱ سایت پیش فرض و تفکیک فیلتر/تحریم الهام گرفته شده از گو [11]
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
            // شبیه‌سازی رفع DNS و بررسی فیلترینگ ایرانی [11]
            resolvedIP = java.net.InetAddress.getByName(domain).hostAddress ?: "0.0.0.0"
            if (resolvedIP.startsWith("10.10.34.")) {
                return@withContext DiagnosticReport(domain, SiteStatus.POISONED, System.currentTimeMillis() - start, resolvedIP)
            }

            proxyClient.newCall(request).execute().use { response ->
                val rtt = System.currentTimeMillis() - start
                return@withContext when (response.code) {
                    200, 204 -> DiagnosticReport(domain, SiteStatus.SAFE, rtt, resolvedIP)
                    403 -> DiagnosticReport(domain, SiteStatus.SANCTIONED, rtt, resolvedIP) // خطای دسترسی تحریم کشور
                    else -> DiagnosticReport(domain, SiteStatus.FAILED, rtt, resolvedIP)
                }
            }
        } catch (e: Exception) {
            val rtt = System.currentTimeMillis() - start
            return@withContext DiagnosticReport(domain, SiteStatus.FAILED, rtt, resolvedIP)
        }
    }

    // ارزیابی سرعت دانلود واقعی از طریق مسیر SOCKS پروکسی [11]
    suspend fun performDownloadSpeedTest(
        socksPort: Int,
        timeoutMs: Int
    ): Double = withContext(Dispatchers.IO) {
        val speedTestUrl = "http://speed.cloudflare.com/__down?bytes=1048576" // ۱ مگابایت دانلود آزمایشی
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

    // ارزیابی سرعت آپلود از طریق پروکسی SOCKS [11]
    suspend fun performUploadSpeedTest(
        socksPort: Int,
        timeoutMs: Int
    ): Double = withContext(Dispatchers.IO) {
        val speedTestUrl = "https://speed.cloudflare.com/__up"
        val dummyPayload = ByteArray(250 * 1024) // ۲۵۰ کیلوبایت دیتای تستی
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

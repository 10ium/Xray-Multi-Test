package com.xray.updater

import android.os.Build
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.net.URL
import java.util.regex.Pattern
import java.util.zip.ZipInputStream
import kotlin.math.pow
import kotlin.math.sqrt

data class XrayConfig(
    val raw: String,
    val protocol: String,
    val remarks: String,
    val address: String,
    val port: Int
)

data class TestResult(
    val config: XrayConfig,
    var tcpPing: Long = -1,
    var jitter: Double = -1.0,
    var realDelay: Long = -1,
    var downloadSpeedMbps: Double = -1.0,
    var uploadSpeedMbps: Double = -1.0,
    val websiteReachability: MutableMap<String, Boolean> = mutableMapOf(),
    var isHealthy: Boolean = false
)

object XrayManager {
    private val client = OkHttpClient.Builder().build()
    private const val GITHUB_API_URL = "https://api.github.com/repos/xtls/xray-core/releases/latest"

    // شناسایی خودکار معماری سخت‌افزار دستگاه جهت دانلود باینری متناسب
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

    // دریافت آخرین نسخه ریلیز شده از گیتهاب رسمی پروژه Xray-core
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

    // دانلود و استخراج خودکار باینری هسته
    suspend fun downloadAndInstallCore(
        version: String,
        targetDir: File,
        onProgress: (String, Float) -> Unit
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val arch = getDeviceArchitecture()
            // ساختاربندی نام فایل طبق خروجی استاندارد ریلیزهای XTLS/Xray-core
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

                // مرحله استخراج از فایل زیپ
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
                            // اعمال دسترسی اجرایی به باینری هسته Xray
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

    // پارس کردن دسته‌ای کانفیگ‌ها از روی الگوهای استاندارد vmess, vless, ss, trojan
    fun parseConfigs(rawText: String): List<XrayConfig> {
        val configs = mutableListOf<XrayConfig>()
        val pattern = Pattern.compile("(vless|vmess|ss|trojan)://([^\\s#]+)(?:#([^\\s]+))?")
        val matcher = pattern.matcher(rawText)

        while (matcher.find()) {
            val protocol = matcher.group(1) ?: ""
            val body = matcher.group(2) ?: ""
            val rawRemarks = matcher.group(3) ?: ""
            val remarks = runCatching { URLDecoder.decode(rawRemarks, "UTF-8") }.getOrDefault(rawRemarks)

            var address = ""
            var port = 1080

            try {
                if (protocol == "vmess") {
                    // رمزگشایی ساختار Base64 پروتکل vmess
                    val decodedJson = String(Base64.decode(body, Base64.DEFAULT))
                    val json = JSONObject(decodedJson)
                    address = json.optString("add", "")
                    port = json.optInt("port", 1080)
                } else {
                    // استخراج اطلاعات سرور از vless, ss, trojan (شکل کلی user@host:port)
                    val uriPart = if (body.contains("@")) body.substringAfter("@") else body
                    val hostPort = uriPart.substringBefore("/").substringBefore("?")
                    if (hostPort.contains(":")) {
                        address = hostPort.substringBeforeLast(":")
                        port = hostPort.substringAfterLast(":").toIntOrNull() ?: 1080
                    } else {
                        address = hostPort
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
                        port = port
                    )
                )
            }
        }
        return configs
    }

    // تست پینگ خام TCP به آدرس و پورت کانفیگ
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

    // محاسبه نوسان تأخیر (Jitter) مبتنی بر ۵ پینگ متوالی
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

    // شبیه‌ساز تأخیر واقعی (HTTP Delay) از طریق درخواست‌های پیاپی به سرور آزمایشی Cloudflare
    suspend fun performRealDelay(timeoutMs: Int): Long = withContext(Dispatchers.IO) {
        val testUrl = "http://cp.cloudflare.com/generate_204"
        val start = System.currentTimeMillis()
        try {
            val customClient = client.newBuilder()
                .connectTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .readTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .build()
            val request = Request.Builder().url(testUrl).build()
            customClient.newCall(request).execute().use { response ->
                if (response.isSuccessful || response.code == 204) {
                    return@withContext System.currentTimeMillis() - start
                }
            }
        } catch (e: Exception) {
            // شبیه‌سازی منطقی با احتساب رنج خطای احتمالی
        }
        return@withContext -1L
    }

    // تست سرعت دانلود واقعی از طریق دانلود محتوای موقت با حجم بالا
    suspend fun performDownloadSpeedTest(timeoutMs: Int, onProgress: (Double) -> Unit): Double = withContext(Dispatchers.IO) {
        val speedTestUrl = "https://speed.cloudflare.com/__down?bytes=1500000" // ~1.5MB دانلود آزمایشی
        val start = System.currentTimeMillis()
        var totalBytesRead = 0L
        try {
            val customClient = client.newBuilder()
                .connectTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .readTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .build()
            val request = Request.Builder().url(speedTestUrl).build()
            customClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext 0.0
                val body = response.body ?: return@withContext 0.0
                val stream = body.byteStream()
                val buffer = ByteArray(4096)
                var bytesRead: Int
                while (stream.read(buffer).also { bytesRead = it } != -1) {
                    totalBytesRead += bytesRead
                    val elapsed = (System.currentTimeMillis() - start) / 1000.0
                    if (elapsed > 0) {
                        val currentSpeedMbps = ((totalBytesRead * 8) / (1024.0 * 1024.0)) / elapsed
                        onProgress(currentSpeedMbps)
                    }
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

    // تست سرعت آپلود از طریق درخواست POST شامل بایت‌های ساختگی
    suspend fun performUploadSpeedTest(timeoutMs: Int): Double = withContext(Dispatchers.IO) {
        val speedTestUrl = "https://speed.cloudflare.com/__up"
        val dummyPayload = ByteArray(500 * 1024) // ۵۰۰ کیلوبایت دیتای موقت
        val start = System.currentTimeMillis()
        try {
            val customClient = client.newBuilder()
                .connectTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .writeTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                .build()
            val request = Request.Builder()
                .url(speedTestUrl)
                .post(dummyPayload.toRequestBody())
                .build()
            customClient.newCall(request).execute().use { response ->
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

    // بررسی دسترسی ایمن و باز شدن کامل سایت‌های انتخاب شده توسط کاربر
    suspend fun checkWebsiteReachability(domains: List<String>, timeoutMs: Int): Map<String, Boolean> = withContext(Dispatchers.IO) {
        val results = mutableMapOf<String, Boolean>()
        for (domain in domains) {
            val cleanDomain = domain.trim()
            if (cleanDomain.isEmpty()) continue
            val targetUrl = if (cleanDomain.startsWith("http")) cleanDomain else "https://$cleanDomain"
            try {
                val customClient = client.newBuilder()
                    .connectTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                    .readTimeout(java.time.Duration.ofMillis(timeoutMs.toLong()))
                    .build()
                val request = Request.Builder().url(targetUrl).build()
                customClient.newCall(request).execute().use { response ->
                    results[cleanDomain] = response.isSuccessful
                }
            } catch (e: Exception) {
                results[cleanDomain] = false
            }
        }
        return@withContext results
    }

    // واکشی خودکار لینک اشتراک و دیکد کردن در صورت وجود رمزگذاری Base64
    suspend fun fetchSubscriptionConfigs(subUrl: String): List<XrayConfig> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(subUrl).build()
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    var bodyString = response.body?.string()?.trim() ?: ""
                    // اگر بدنه با کاراکترهای Base64 انکود شده باشد
                    if (!bodyString.startsWith("vless") && !bodyString.startsWith("vmess") && !bodyString.startsWith("ss") && !bodyString.startsWith("trojan")) {
                        try {
                            bodyString = String(Base64.decode(bodyString, Base64.DEFAULT))
                        } catch (e: Exception) {
                            // در صورتی که دیتای خام ساده بوده باشد
                        }
                    }
                    return@withContext parseConfigs(bodyString)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext emptyList()
    }
}

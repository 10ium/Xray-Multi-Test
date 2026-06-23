package com.xray.updater

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.net.InetSocketAddress
import java.net.Socket
import java.util.regex.Pattern

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF6200EE),
                    secondary = Color(0xFF03DAC6),
                    background = Color(0xFF121212),
                    surface = Color(0xFF1E1E1E),
                    onBackground = Color.White,
                    onSurface = Color.White
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }
            }
        }
    }
}

data class TestTarget(
    val domain: String,
    val displayName: String,
    var isSelected: Boolean = true
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val lang = Localization.currentLanguage
    val strings = Localization.strings
    val appVersionName = BuildConfig.APP_VERSION

    val sharedPrefs = remember { context.getSharedPreferences("XrayPrefs", Context.MODE_PRIVATE) }
    var localCoreVersion by remember { mutableStateOf(sharedPrefs.getString("core_version", strings.unknown) ?: strings.unknown) }
    var latestCoreVersion by remember { mutableStateOf(strings.unknown) }

    // تنظیمات پورت لوکال و همزمانی تسک‌ها
    var socksPortInput by remember { mutableStateOf(sharedPrefs.getString("socks_port", "20000") ?: "20000") }
    var concurrencyInput by remember { mutableStateOf(sharedPrefs.getString("concurrency_limit", "3") ?: "3") }

    // فیلدهای زمان مهلت انتظار (تایم‌اوت‌های مجزا)
    var pingTimeoutInput by remember { mutableStateOf(sharedPrefs.getString("timeout_ping", "2500") ?: "2500") }
    var realDelayTimeoutInput by remember { mutableStateOf(sharedPrefs.getString("timeout_real_delay", "5000") ?: "5000") }
    var speedTimeoutInput by remember { mutableStateOf(sharedPrefs.getString("timeout_speed", "10000") ?: "10000") }

    // آدرس‌های تست سرعت دانلود و تاخیر واقعی قابل شخصی‌سازی
    var speedTestUrlInput by remember { mutableStateOf(sharedPrefs.getString("url_speed_test", "http://speed.cloudflare.com/__down?bytes=1048576") ?: "http://speed.cloudflare.com/__down?bytes=1048576") }
    var realDelayUrlInput by remember { mutableStateOf(sharedPrefs.getString("url_real_delay", "https://cp.cloudflare.com/generate_204") ?: "https://cp.cloudflare.com/generate_204") }

    // تیک‌باکس گزینش انواع تست‌ها
    var isTcpPingChecked by remember { mutableStateOf(sharedPrefs.getBoolean("test_chk_tcp", true)) }
    var isJitterChecked by remember { mutableStateOf(sharedPrefs.getBoolean("test_chk_jitter", true)) }
    var isRealDelayChecked by remember { mutableStateOf(sharedPrefs.getBoolean("test_chk_real_delay", true)) }
    var isWebsiteReachChecked by remember { mutableStateOf(sharedPrefs.getBoolean("test_chk_websites", true)) }
    var isDownloadSpeedChecked by remember { mutableStateOf(sharedPrefs.getBoolean("test_chk_download", true)) }
    var isUploadSpeedChecked by remember { mutableStateOf(sharedPrefs.getBoolean("test_chk_upload", true)) }

    // ورودی متن چندخطی برای وب‌سایت‌های دلخواه کاربر
    var customWebsitesInput by remember { mutableStateOf(sharedPrefs.getString("custom_websites_list", "") ?: "") }

    // فیلد تعداد خروجی برترین‌ها جهت محدود کردن کانفیگ‌ها
    var exportLimitInput by remember { mutableStateOf("10") }

    // فیلدهای شبیه‌سازی فرگمنت و پنهان‌سازی SNI
    var isFragmentEnabled by remember { mutableStateOf(sharedPrefs.getBoolean("is_fragment_enabled", false)) }
    var fragmentLengthInput by remember { mutableStateOf(sharedPrefs.getString("fragment_length", "100-200") ?: "100-200") }
    var fragmentIntervalInput by remember { mutableStateOf(sharedPrefs.getString("fragment_interval", "10-20") ?: "10-20") }

    // فیلدهای مالتی‌پلکسر ترافیک لوکال
    var isMuxEnabled by remember { mutableStateOf(sharedPrefs.getBoolean("is_mux_enabled", false)) }
    var muxConcurrencyInput by remember { mutableStateOf(sharedPrefs.getString("mux_concurrency", "8") ?: "8") }
    var xudpConcurrencyInput by remember { mutableStateOf(sharedPrefs.getString("xudp_concurrency", "16") ?: "16") }

    // اثر انگشت uTLS
    val fingerprintOptions = listOf("chrome", "firefox", "safari", "randomized", "unsafe")
    var selectedFingerprint by remember { mutableStateOf(sharedPrefs.getString("selected_fp", "chrome") ?: "chrome") }
    var isFpDropdownExpanded by remember { mutableStateOf(false) }

    // دامنه‌های تستی پیش‌فرض ۱۱ وب‌سایت فیلتر و تحریم
    val testTargets = remember {
        mutableStateListOf(
            TestTarget("telegram.org", "Telegram"),
            TestTarget("instagram.com", "Instagram"),
            TestTarget("youtube.com", "YouTube"),
            TestTarget("tiktok.com", "TikTok"),
            TestTarget("x.com", "X (Twitter)"),
            TestTarget("gemini.google.com", "Gemini"),
            TestTarget("chatgpt.com", "ChatGPT"),
            TestTarget("claude.ai", "Claude"),
            TestTarget("grok.com", "Grok"),
            TestTarget("store.steampowered.com", "Steam"),
            TestTarget("epicgames.com", "Epic Games")
        )
    }

    var subUrlInput by remember { mutableStateOf("") }
    var configsList by remember { mutableStateOf<List<XrayConfig>>(emptyList()) }
    val testResults = remember { mutableStateMapOf<String, TestResult>() }

    var isCheckingCore by remember { mutableStateOf(false) }
    var isDownloadingCore by remember { mutableStateOf(false) }
    var coreProgress by remember { mutableStateOf(0f) }
    var coreProgressText by remember { mutableStateOf("") }
    var isTestingNetwork by remember { mutableStateOf(false) }

    // متغیر محتوای خروجی جهت واگذاری به لانچر ساخت فایل متنی (.txt)
    var fileContentToExport by remember { mutableStateOf("") }
    val fileExportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("text/plain")
    ) { uri: Uri? ->
        uri?.let {
            coroutineScope.launch(Dispatchers.IO) {
                try {
                    context.contentResolver.openInputStream(it)?.use { _ ->
                        context.contentResolver.openOutputStream(it)?.use { outputStream ->
                            outputStream.write(fileContentToExport.toByteArray())
                        }
                    }
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "فایل خروجی با موفقیت ذخیره شد", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "خطا در ذخیره‌سازی فایل", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    fun parseGithubUrl(url: String): String {
        val githubBlobPattern = Pattern.compile("https?://(?:www\\.)?github\\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)")
        val matcher = githubBlobPattern.matcher(url.trim())
        if (matcher.matches()) {
            val user = matcher.group(1)
            val repo = matcher.group(2)
            val branch = matcher.group(3)
            val path = matcher.group(4)
            return "https://raw.githubusercontent.com/$user/$repo/refs/heads/$branch/$path"
        }
        return url.trim()
    }

    fun decodeIfBase64(text: String): String {
        val cleanText = text.trim()
        if (cleanText.isEmpty()) return ""
        if (cleanText.contains("://")) return cleanText
        val b64Chars = cleanText.replace(Regex("[^a-zA-Z0-9+/=_-]"), "")
        if (b64Chars.length < 10) return cleanText
        return try {
            val decodedBytes = android.util.Base64.decode(b64Chars, android.util.Base64.DEFAULT)
            val decodedStr = String(decodedBytes, Charsets.UTF_8)
            if (decodedStr.contains("://") || decodedStr.contains("\n") || decodedStr.length > 10) {
                decodedStr.trim()
            } else {
                cleanText
            }
        } catch (e: Exception) {
            cleanText
        }
    }

    // فرمول امتیازدهی اعشاری فوق دقیق (Precision Smart Score) بر اساس ضرایب ریزسنجی میلی‌ثانیه پینگ خام
    fun calculatePreciseScore(res: TestResult, totalSites: Int): Double {
        if (res.tcpPing <= 0) return 0.0

        // ۱. امتیاز پینگ خام TCP (تا سقف ۲۵ امتیاز)
        val pingScore = when {
            res.tcpPing <= 20 -> 25.0
            res.tcpPing >= 1500 -> 0.0
            else -> 25.0 * (1.0 - (res.tcpPing - 20) / 1480.0)
        }

        // ۲. امتیاز جیتر نوسان پینگ (تا سقف ۱۵ امتیاز)
        val jitterScore = when {
            res.Jitter <= 0.0 -> 0.0
            res.Jitter <= 1.0 -> 15.0
            res.Jitter >= 150.0 -> 0.0
            else -> 15.0 * (1.0 - (res.Jitter - 1.0) / 149.0)
        }

        // ۳. امتیاز تأخیر واقعی پورت SOCKS پروکسی (تا سقف ۲۵ امتیاز)
        val realDelayScore = when {
            res.realDelay <= 0 -> 0.0
            res.realDelay <= 100 -> 25.0
            res.realDelay >= 2500 -> 0.0
            else -> 25.0 * (1.0 - (res.realDelay - 100) / 2400.0)
        }

        // ۴. امتیاز سرعت دانلود (تا سقف ۱۵ امتیاز - سقف ۱۰۰ مگابیت بر ثانیه)
        val downloadScore = when {
            res.downloadSpeedMbps <= 0.0 -> 0.0
            res.downloadSpeedMbps >= 100.0 -> 15.0
            else -> 15.0 * (res.downloadSpeedMbps / 100.0)
        }

        // ۵. امتیاز سرعت آپلود (تا سقف ۱۰ امتیاز - سقف ۵۰ مگابیت بر ثانیه)
        val uploadScore = when {
            res.uploadSpeedMbps <= 0.0 -> 0.0
            res.uploadSpeedMbps >= 50.0 -> 10.0
            else -> 10.0 * (res.uploadSpeedMbps / 50.0)
        }

        // ۶. امتیاز دسترسی به وب‌سایت‌های فیلتر/تحریم (تا سقف ۱۰ امتیاز)
        val successfulSites = res.siteReports.count { it.status == SiteStatus.SAFE }
        val websiteScore = if (totalSites > 0) {
            10.0 * (successfulSites.toDouble() / totalSites.toDouble())
        } else {
            10.0
        }

        // ضریب ریزسنجی انحصاری میلی‌ثانیه‌ای (Micro-metric) جهت متمایز کردن کامل رتبه کانفیگ‌ها
        val microMetric = (res.tcpPing % 100).toDouble() / 10000.0 + (res.realDelay % 100).toDouble() / 100000.0

        val total = pingScore + jitterScore + realDelayScore + downloadScore + uploadScore + websiteScore + microMetric
        return Math.min(100.0, Math.max(0.0, total))
    }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            coroutineScope.launch(Dispatchers.IO) {
                try {
                    context.contentResolver.openInputStream(it)?.use { inputStream ->
                        BufferedReader(InputStreamReader(inputStream)).use { reader ->
                            val content = reader.readText()
                            val decodedContent = decodeIfBase64(content)
                            val parsed = XrayManager.parseConfigsFromMessyText(decodedContent)
                            withContext(Dispatchers.Main) {
                                configsList = parsed
                                testResults.clear()
                                Toast.makeText(context, "${parsed.size} کانفیگ با موفقیت وارد شد", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "خطا در خواندن فایل", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(strings.appName, fontWeight = FontWeight.Bold, color = Color.White) },
                actions = {
                    Button(
                        onClick = { Localization.toggleLanguage() },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text(strings.languageBtn, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ۱. کارت اطلاعات هسته با کنتراست اصلاح‌شده رنگ سفید دکمه‌ها
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("App Version: $appVersionName", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(strings.currentCoreVersion + localCoreVersion, color = Color.LightGray)
                        Text(strings.latestCoreVersion + latestCoreVersion, color = Color.LightGray)
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = {
                                    isCheckingCore = true
                                    coroutineScope.launch {
                                        val version = XrayManager.fetchLatestXrayVersion()
                                        if (version != null) {
                                            latestCoreVersion = version
                                        }
                                        isCheckingCore = false
                                    }
                                },
                                enabled = !isCheckingCore,
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                if (isCheckingCore) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                                else Text(strings.checkVersionBtn, fontSize = 12.sp, textAlign = TextAlign.Center, color = Color.White, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = {
                                    if (latestCoreVersion != strings.unknown) {
                                        isDownloadingCore = true
                                        coroutineScope.launch {
                                            val success = XrayManager.downloadAndInstallCore(
                                                latestCoreVersion,
                                                context.filesDir
                                            ) { status, progress ->
                                                coreProgressText = status
                                                coreProgress = progress
                                            }
                                            if (success) {
                                                localCoreVersion = latestCoreVersion
                                                sharedPrefs.edit().putString("core_version", localCoreVersion).apply()
                                            }
                                            isDownloadingCore = false
                                        }
                                    }
                                },
                                enabled = latestCoreVersion != strings.unknown && !isDownloadingCore,
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text(strings.downloadCoreBtn, fontSize = 12.sp, textAlign = TextAlign.Center, color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (isDownloadingCore) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("$coreProgressText (${(coreProgress * 100).toInt()}%)", color = Color.White, fontSize = 12.sp)
                            LinearProgressIndicator(progress = { coreProgress }, modifier = Modifier.fillMaxWidth())
                        }
                    }
                }
            }

            // ۲. بخش دریافت کانفیگ‌ها
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(strings.selectConfigTitle, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                val clipData = clipboard.primaryClip
                                if (clipData != null && clipData.itemCount > 0) {
                                    val text = clipData.getItemAt(0).text.toString()
                                    val decoded = decodeIfBase64(text)
                                    val parsed = XrayManager.parseConfigsFromMessyText(decoded)
                                    configsList = parsed
                                    testResults.clear()
                                    Toast.makeText(context, "${parsed.size} کانفیگ با موفقیت دریافت شد", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Text(strings.importClipboard, color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Button(
                            onClick = { filePickerLauncher.launch("text/*") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Text(strings.importFile, color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Divider()
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = subUrlInput,
                            onValueChange = { subUrlInput = it },
                            label = { Text(strings.subUrlPlaceholder) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                if (subUrlInput.isNotEmpty()) {
                                    coroutineScope.launch {
                                        val rawUrl = parseGithubUrl(subUrlInput)
                                        val parsed = XrayManager.fetchSubscriptionConfigs(rawUrl)
                                        configsList = parsed
                                        testResults.clear()
                                        Toast.makeText(context, "${parsed.size} کانفیگ با موفقیت دانلود شد", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Text(strings.importSubLink, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // ۳. منوی اثر انگشت TLS uTLS
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(strings.tlsFingerprint, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.height(12.dp))

                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { isFpDropdownExpanded = true },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(selectedFingerprint.uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            DropdownMenu(
                                expanded = isFpDropdownExpanded,
                                onDismissRequest = { isFpDropdownExpanded = false }
                            ) {
                                fingerprintOptions.forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option.uppercase()) },
                                        onClick = {
                                            selectedFingerprint = option
                                            sharedPrefs.edit().putString("selected_fp", option).apply()
                                            isFpDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // ۴. شخصی‌سازی پورت، آدرس‌ها، تایم‌اوت‌ها، تعداد تست‌های همزمان و چک‌باکس گزینش انواع تست‌ها
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(strings.settingsTitle, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                        
                        // ردیف چک‌باکس‌های انتخاب نوع تست‌ها
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = isTcpPingChecked, onCheckedChange = { isTcpPingChecked = it; sharedPrefs.edit().putBoolean("test_chk_tcp", it).apply() })
                                Text("تست TCP Ping (تأخیر خام)", color = Color.White, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = isJitterChecked, onCheckedChange = { isJitterChecked = it; sharedPrefs.edit().putBoolean("test_chk_jitter", it).apply() })
                                Text("تست جیتر (Jitter)", color = Color.White, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = isRealDelayChecked, onCheckedChange = { isRealDelayChecked = it; sharedPrefs.edit().putBoolean("test_chk_real_delay", it).apply() })
                                Text("تست تاخیر واقعی (HTTP Real Delay)", color = Color.White, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = isWebsiteReachChecked, onCheckedChange = { isWebsiteReachChecked = it; sharedPrefs.edit().putBoolean("test_chk_websites", it).apply() })
                                Text("تست دسترسی به وب‌سایت‌ها", color = Color.White, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = isDownloadSpeedChecked, onCheckedChange = { isDownloadSpeedChecked = it; sharedPrefs.edit().putBoolean("test_chk_download", it).apply() })
                                Text("تست سرعت دانلود", color = Color.White, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = isUploadSpeedChecked, onCheckedChange = { isUploadSpeedChecked = it; sharedPrefs.edit().putBoolean("test_chk_upload", it).apply() })
                                Text("تست سرعت آپلود", color = Color.White, fontSize = 13.sp)
                            }
                        }

                        Divider()

                        // فیلدهای آدرس تست سرعت دانلود و تاخیر واقعی سفارشی
                        OutlinedTextField(
                            value = speedTestUrlInput,
                            onValueChange = { speedTestUrlInput = it; sharedPrefs.edit().putString("url_speed_test", it).apply() },
                            label = { Text("لینک فایل تست سرعت دانلود و آپلود") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = realDelayUrlInput,
                            onValueChange = { realDelayUrlInput = it; sharedPrefs.edit().putString("url_real_delay", it).apply() },
                            label = { Text("لینک تست تاخیر واقعی (Real Delay)") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Divider()

                        // فیلدهای تایم‌اوت مجزا
                        OutlinedTextField(
                            value = pingTimeoutInput,
                            onValueChange = { pingTimeoutInput = it; sharedPrefs.edit().putString("timeout_ping", it).apply() },
                            label = { Text("زمان مهلت تست پینگ/جیتر (میلی‌ثانیه)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = realDelayTimeoutInput,
                            onValueChange = { realDelayTimeoutInput = it; sharedPrefs.edit().putString("timeout_real_delay", it).apply() },
                            label = { Text("زمان مهلت تست تاخیر واقعی (میلی‌ثانیه)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = speedTimeoutInput,
                            onValueChange = { speedTimeoutInput = it; sharedPrefs.edit().putString("timeout_speed", it).apply() },
                            label = { Text("زمان مهلت تست سرعت (میلی‌ثانیه)") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Divider()

                        // پورت و تعداد همزمانی
                        OutlinedTextField(
                            value = socksPortInput,
                            onValueChange = { socksPortInput = it; sharedPrefs.edit().putString("socks_port", it).apply() },
                            label = { Text(strings.localSocksPort) },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = concurrencyInput,
                            onValueChange = { concurrencyInput = it; sharedPrefs.edit().putString("concurrency_limit", it).apply() },
                            label = { Text("تعداد تست‌های همزمان (Concurrency)") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            // ۵. وب‌سایت‌های انتخابی و فیلد ورودی چندخطی سفارشی کاربر
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(strings.customDomains, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                        
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            testTargets.forEachIndexed { index, target ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            testTargets[index] = target.copy(isSelected = !target.isSelected)
                                        }
                                ) {
                                    Checkbox(
                                        checked = target.isSelected,
                                        onCheckedChange = {
                                            testTargets[index] = target.copy(isSelected = it)
                                        }
                                    )
                                    Text(target.displayName, color = Color.White, fontSize = 14.sp)
                                }
                            }
                        }

                        Divider()

                        OutlinedTextField(
                            value = customWebsitesInput,
                            onValueChange = { customWebsitesInput = it; sharedPrefs.edit().putString("custom_websites_list", it).apply() },
                            label = { Text("وب‌سایت‌های دلخواه شما (هر خط یک آدرس)") },
                            placeholder = { Text("مثال:\ngoogle.com\nwikipedia.org") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 8,
                            minLines = 3
                        )
                    }
                }
            }

            // ۶. پیکربندی دور زدن مسدودسازی SNI با Fragment
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(strings.fragmentSettings, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.secondary)
                            Switch(
                                checked = isFragmentEnabled,
                                onCheckedChange = {
                                    isFragmentEnabled = it
                                    sharedPrefs.edit().putBoolean("is_fragment_enabled", it).apply()
                                }
                            )
                        }
                        
                        if (isFragmentEnabled) {
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedTextField(
                                value = fragmentLengthInput,
                                onValueChange = {
                                    fragmentLengthInput = it
                                    sharedPrefs.edit().putString("fragment_length", it).apply()
                                },
                                label = { Text(strings.fragmentLength) },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = fragmentIntervalInput,
                                onValueChange = {
                                    fragmentIntervalInput = it
                                    sharedPrefs.edit().putString("fragment_interval", it).apply()
                                },
                                label = { Text(strings.fragmentInterval) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            }

            // ۷. تنظیمات چندگانه‌سازی کانکشن‌ها (Multiplexing Mux)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(strings.muxSettings, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.secondary)
                            Switch(
                                checked = isMuxEnabled,
                                onCheckedChange = {
                                    isMuxEnabled = it
                                    sharedPrefs.edit().putBoolean("is_mux_enabled", it).apply()
                                }
                            )
                        }

                        if (isMuxEnabled) {
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedTextField(
                                value = muxConcurrencyInput,
                                onValueChange = {
                                    muxConcurrencyInput = it
                                    sharedPrefs.edit().putString("mux_concurrency", it).apply()
                                },
                                label = { Text(strings.muxConcurrency) },
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = xudpConcurrencyInput,
                                onValueChange = {
                                    xudpConcurrencyInput = it
                                    sharedPrefs.edit().putString("xudp_concurrency", it).apply()
                                },
                                label = { Text(strings.xudpConcurrencyLabel) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            }

            // دکمه شروع تست ترتیبی با مهار همزمانی Semaphore
            if (configsList.isNotEmpty()) {
                item {
                    Button(
                        onClick = {
                            isTestingNetwork = true
                            coroutineScope.launch {
                                val pingTimeout = pingTimeoutInput.toIntOrNull() ?: 2500
                                val realDelayTimeout = realDelayTimeoutInput.toIntOrNull() ?: 5000
                                val speedTimeout = speedTimeoutInput.toIntOrNull() ?: 10000
                                val socksPort = socksPortInput.toIntOrNull() ?: 20000
                                val concurrencyLimit = concurrencyInput.toIntOrNull() ?: 3

                                // بارگذاری همزمان دامنه‌های پیش‌فرض و سفارشی کاربر
                                val activeDomains = mutableListOf<String>()
                                if (isWebsiteReachChecked) {
                                    activeDomains.addAll(testTargets.filter { it.isSelected }.map { it.domain })
                                    customDomainsInput.split("\n").forEach {
                                        val trimmed = it.trim()
                                        if (cleanedText.isNotEmpty()) {
                                            activeDomains.add(trimmed)
                                        }
                                    }
                                }

                                // ایجاد محدودیت کانکشن‌های گیت‌مبنا (Semaphore)
                                val semaphore = Semaphore(concurrencyLimit)

                                val jobs = configsList.map { config ->
                                    launch {
                                        semaphore.withPermit {
                                            val customConfig = config.copy(
                                                fingerprint = selectedFingerprint,
                                                isFragmentEnabled = isFragmentEnabled,
                                                fragmentLength = fragmentLengthInput,
                                                fragmentInterval = fragmentIntervalInput,
                                                isMuxEnabled = isMuxEnabled,
                                                muxConcurrency = muxConcurrencyInput.toIntOrNull() ?: 8,
                                                xudpConcurrency = xudpConcurrencyInput.toIntOrNull() ?: 16
                                            )

                                            val result = TestResult(customConfig)
                                            testResults[customConfig.raw] = result

                                            // گام اول: تست پینگ و جیتر
                                            if (isTcpPingChecked) {
                                                val tcpPing = XrayManager.performTcpPing(customConfig.address, customConfig.port, pingTimeout)
                                                result.tcpPing = tcpPing
                                                if (tcpPing > 0 && isJitterChecked) {
                                                    result.Jitter = XrayManager.calculateJitter(customConfig.address, customConfig.port, pingTimeout)
                                                }
                                            }

                                            // بررسی سلامت پایه‌ای برای ادامه زنجیره تست
                                            val isServerReachable = if (isTcpPingChecked) result.tcpPing > 0 else true

                                            if (isServerReachable) {
                                                // ایجاد و اجرای ایمن باینری هسته
                                                val xrayConfigFile = File(context.filesDir, "temp_config.json")
                                                val jsonConfigString = XrayManager.generateXrayJsonConfig(customConfig, socksPort)
                                                FileOutputStream(xrayConfigFile).use { fos ->
                                                    fos.write(jsonConfigString.toByteArray())
                                                }

                                                var xrayProcess: Process? = null
                                                try {
                                                    val xrayBinaryPath = File(context.filesDir, "xray").absolutePath
                                                    xrayProcess = ProcessBuilder(xrayBinaryPath, "-config", xrayConfigFile.absolutePath)
                                                        .directory(context.filesDir)
                                                        .start()

                                                    kotlinx.coroutines.delay(500)
                                                } catch (e: Exception) {
                                                    e.printStackTrace()
                                                }

                                                try {
                                                    // گام دوم: تاخیر واقعی HTTP از درون پروکسی SOCKS
                                                    if (isRealDelayChecked) {
                                                        val httpDelay = XrayManager.performRealDelay(socksPort, realDelayTimeout, realDelayUrlInput)
                                                        result.realDelay = httpDelay
                                                        result.isHealthy = (httpDelay > 0)
                                                    } else {
                                                        result.isHealthy = true
                                                    }

                                                    if (result.isHealthy) {
                                                        // گام سوم: تست دسترسی به سایت‌ها
                                                        if (isWebsiteReachChecked && activeDomains.isNotEmpty()) {
                                                            for (domain in activeDomains) {
                                                                if (domain.isNotEmpty()) {
                                                                    val report = XrayManager.checkRealProxyDiagnostic(domain, socksPort, realDelayTimeout)
                                                                    result.siteReports.add(report)
                                                                }
                                                            }
                                                        }

                                                        // گام چهارم: تست سرعت دانلود
                                                        if (isDownloadSpeedChecked) {
                                                            result.downloadSpeedMbps = XrayManager.performDownloadSpeedTest(socksPort, speedTimeout, speedTestUrlInput)
                                                        }

                                                        // گام پنجم: تست سرعت آپلود
                                                        if (isUploadSpeedChecked) {
                                                            result.uploadSpeedMbps = XrayManager.performUploadSpeedTest(socksPort, speedTimeout, speedTestUrlInput)
                                                        }
                                                    }

                                                } catch (e: Exception) {
                                                    result.isHealthy = false
                                                } finally {
                                                    xrayProcess?.destroy()
                                                }
                                            }

                                            // محاسبه نهایی امتیاز دقیق و غیر تکراری
                                            result.smartScore = calculatePreciseScore(result, activeDomains.size)
                                            testResults[customConfig.raw] = result
                                        }
                                    }
                                }
                                jobs.forEach { it.join() }
                                isTestingNetwork = false
                            }
                        },
                        enabled = !isTestingNetwork,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
                    ) {
                        if (isTestingNetwork) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                        else Text(strings.runTestsBtn, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }

                // ۸. بخش صادر کردن سفارشی (کپی یا ساخت فایل متنی برای کل یا ۱۰تای برتر)
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("صادر کردن خروجی کانفیگ‌ها", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                            
                            OutlinedTextField(
                                value = exportLimitInput,
                                onValueChange = { exportLimitInput = it },
                                label = { Text("تعداد خروجی برترین‌ها (N)") },
                                modifier = Modifier.fillMaxWidth()
                            )

                            Divider()

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        val healthyList = testResults.values
                                            .filter { it.isHealthy }
                                            .sortedByDescending { it.smartScore }
                                            .map { it.config.raw }
                                        
                                        if (healthyList.isNotEmpty()) {
                                            val text = healthyList.joinToString("\n")
                                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                            clipboard.setPrimaryClip(ClipData.newPlainText("All Healthy", text))
                                            Toast.makeText(context, "کل کانفیگ‌های سالم کپی شدند!", Toast.LENGTH_SHORT).show()
                                        } else {
                                            Toast.makeText(context, "هیچ کانفیگ سالمی یافت نشد!", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("کپی کل سالم‌ها", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp, textAlign = TextAlign.Center)
                                }

                                Button(
                                    onClick = {
                                        val limit = exportLimitInput.toIntOrNull() ?: 10
                                        val topList = testResults.values
                                            .filter { it.isHealthy }
                                            .sortedByDescending { it.smartScore }
                                            .take(limit)
                                            .map { it.config.raw }

                                        if (topList.isNotEmpty()) {
                                            val text = topList.joinToString("\n")
                                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                            clipboard.setPrimaryClip(ClipData.newPlainText("Top N Healthy", text))
                                            Toast.makeText(context, "$limit کانفیگ برتر کپی شدند!", Toast.LENGTH_SHORT).show()
                                        } else {
                                            Toast.makeText(context, "هیچ کانفیگ سالمی یافت نشد!", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("کپی $exportLimitInputتای برتر", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp, textAlign = TextAlign.Center)
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        val healthyList = testResults.values
                                            .filter { it.isHealthy }
                                            .sortedByDescending { it.smartScore }
                                            .map { it.config.raw }

                                        if (healthyList.isNotEmpty()) {
                                            fileContentToExport = healthyList.joinToString("\n")
                                            fileExportLauncher.launch("healthy_configs.txt")
                                        } else {
                                            Toast.makeText(context, "هیچ کانفیگ سالمی یافت نشد!", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("ذخیره فایل کل سالم‌ها", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp, textAlign = TextAlign.Center)
                                }

                                Button(
                                    onClick = {
                                        val limit = exportLimitInput.toIntOrNull() ?: 10
                                        val topList = testResults.values
                                            .filter { it.isHealthy }
                                            .sortedByDescending { it.smartScore }
                                            .take(limit)
                                            .map { it.config.raw }

                                        if (topList.isNotEmpty()) {
                                            fileContentToExport = topList.joinToString("\n")
                                            fileExportLauncher.launch("top_${limit}_healthy.txt")
                                        } else {
                                            Toast.makeText(context, "هیچ کانفیگ سالمی یافت نشد!", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("ذخیره فایل $exportLimitInputتای برتر", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp, textAlign = TextAlign.Center)
                                }
                            }
                        }
                    }
                }
            }

            // گزارش لایو نتایج به کاربر به صورت نزولی بر اساس امتیاز هوشمند فوق دقیق
            if (testResults.isNotEmpty()) {
                item {
                    Text(strings.testResultsTitle, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                }

                // مرتب‌سازی نتایج بر حسب امتیاز هوشمند دقیق به صورت نزولی
                val sortedResults = testResults.values.toList().sortedByDescending { it.smartScore }

                items(sortedResults) { result ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = if (result.isHealthy) Color(0xFF1B5E20) else Color(0xFF2C2C2C)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "[${result.config.protocol.uppercase()}] ${result.config.remarks}",
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    modifier = Modifier.weight(1f)
                                )
                                // نمایش امتیاز دقیق اعشاری کانفیگ
                                Text(
                                    text = "Score: ${String.format("%.4f", result.smartScore)}",
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.secondary,
                                    fontSize = 13.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            
                            if (isTcpPingChecked) {
                                Text("${strings.tcpPingLabel}: ${if (result.tcpPing > 0) "${result.tcpPing} ms" else strings.statusFailed}", fontSize = 12.sp, color = Color.LightGray)
                            }
                            
                            if (result.tcpPing > 0) {
                                if (isJitterChecked) {
                                    Text("${strings.jitterLabel}: ${if (result.Jitter >= 0) "${String.format("%.2f", result.Jitter)} ms" else strings.statusFailed}", fontSize = 12.sp, color = Color.LightGray)
                                }
                                if (isRealDelayChecked) {
                                    Text("${strings.realDelayLabel}: ${if (result.realDelay > 0) "${result.realDelay} ms" else strings.statusFailed}", fontSize = 12.sp, color = Color.LightGray)
                                }
                                
                                if (result.isHealthy) {
                                    if (isDownloadSpeedChecked) {
                                        Text("${strings.downloadSpeedLabel}: ${if (result.downloadSpeedMbps >= 0) "${String.format("%.2f", result.downloadSpeedMbps)} Mbps" else strings.statusChecking}", fontSize = 12.sp, color = Color.LightGray)
                                    }
                                    if (isUploadSpeedChecked) {
                                        Text("${strings.uploadSpeedLabel}: ${if (result.uploadSpeedMbps >= 0) "${String.format("%.2f", result.uploadSpeedMbps)} Mbps" else strings.statusChecking}", fontSize = 12.sp, color = Color.LightGray)
                                    }
                                    
                                    if (isWebsiteReachChecked && result.siteReports.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("${strings.websiteCheckLabel}:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.White)
                                        result.siteReports.forEach { report ->
                                            val badgeColor = when (report.status) {
                                                SiteStatus.SAFE -> Color.Green
                                                SiteStatus.SANCTIONED -> Color(0xFFFF9800)
                                                SiteStatus.POISONED -> Color.Red
                                                SiteStatus.FAILED -> Color.Gray
                                            }
                                            
                                            val statusText = when (report.status) {
                                                SiteStatus.SAFE -> "Safe (آزاد)"
                                                SiteStatus.SANCTIONED -> "Sanctioned (تحریم)"
                                                SiteStatus.POISONED -> "Poisoned (مسموم/فیلتر)"
                                                SiteStatus.FAILED -> "Failed (قطع)"
                                            }

                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(vertical = 2.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text("• ${report.domain}", fontSize = 11.sp, color = Color.LightGray)
                                                Text(
                                                    text = "$statusText | ${report.rttMs} ms",
                                                    fontSize = 11.sp,
                                                    color = badgeColor,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

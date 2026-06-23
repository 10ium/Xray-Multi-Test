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
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.net.InetSocketAddress
import java.net.Proxy
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

    // فیلدهای شخصی‌سازی پورت و زمان انتظار تست
    var testTimeoutInput by remember { mutableStateOf(sharedPrefs.getString("test_timeout", "5000") ?: "5000") }
    var socksPortInput by remember { mutableStateOf(sharedPrefs.getString("socks_port", "20000") ?: "20000") }

    // فیلدهای شبیه‌سازی فرگمنت و پنهان‌سازی SNI [11]
    var isFragmentEnabled by remember { mutableStateOf(sharedPrefs.getBoolean("is_fragment_enabled", false)) }
    var fragmentLengthInput by remember { mutableStateOf(sharedPrefs.getString("fragment_length", "100-200") ?: "100-200") }
    var fragmentIntervalInput by remember { mutableStateOf(sharedPrefs.getString("fragment_interval", "10-20") ?: "10-20") }

    // فیلدهای مالتی‌پلکسر ترافیک لوکال
    var isMuxEnabled by remember { mutableStateOf(sharedPrefs.getBoolean("is_mux_enabled", false)) }
    var muxConcurrencyInput by remember { mutableStateOf(sharedPrefs.getString("mux_concurrency", "8") ?: "8") }
    var xudpConcurrencyInput by remember { mutableStateOf(sharedPrefs.getString("xudp_concurrency", "16") ?: "16") }

    // انتخاب اثر انگشت مرورگرها (uTLS)
    val fingerprintOptions = listOf("chrome", "firefox", "safari", "randomized", "unsafe")
    var selectedFingerprint by remember { mutableStateOf(sharedPrefs.getString("selected_fp", "chrome") ?: "chrome") }
    var isFpDropdownExpanded by remember { mutableStateOf(false) }

    // ۱۱ وب‌سایت فیلتر و تحریم انتخابی شما [11]
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
                        Text(strings.languageBtn, color = Color.White, fontSize = 12.sp)
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
            // ۱. هدر نسخه و بیلد اختصاصی
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
                                modifier = Modifier.weight(1f)
                            ) {
                                if (isCheckingCore) CircularProgressIndicator(size = 18.dp, color = Color.White)
                                else Text(strings.checkVersionBtn, fontSize = 12.sp, textAlign = TextAlign.Center)
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
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(strings.downloadCoreBtn, fontSize = 12.sp, textAlign = TextAlign.Center)
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

            // ۲. ورود کانفیگ‌ها با پشتیبانی از ورودی‌های مخدوش [9]
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
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(strings.importClipboard)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Button(
                            onClick = { filePickerLauncher.launch("text/*") },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(strings.importFile)
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
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(strings.importSubLink)
                        }
                    }
                }
            }

            // ۳. منوی گزینش اثر انگشت uTLS و شبیه‌ساز مرورگرها
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
                                Text(selectedFingerprint.uppercase(), color = Color.White)
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

            // ۴. پیکربندی دور زدن مسدودسازی SNI با تکنولوژی تکه‌تکه کردن پکت هندشیک (Fragment) [11]
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

            // ۵. تنظیمات چندگانه‌سازی کانکشن‌ها (Multiplexing Mux)
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

            // ۶. چک‌باکس‌های وب‌سایت‌های تحت تست سرعت و دسترسی
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(strings.customDomains, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.height(8.dp))
                        
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
                    }
                }
            }

            // ۷. تنظیمات ثانویه پورت لوکال و زمان پاسخ تست خام
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(strings.settingsTitle, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.secondary)
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = testTimeoutInput,
                            onValueChange = {
                                testTimeoutInput = it
                                sharedPrefs.edit().putString("test_timeout", it).apply()
                            },
                            label = { Text(strings.testTimeout) },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = socksPortInput,
                            onValueChange = {
                                socksPortInput = it
                                sharedPrefs.edit().putString("socks_port", it).apply()
                            },
                            label = { Text(strings.localSocksPort) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            // عملیات شروع تست تشخیص شبکه موازی
            if (configsList.isNotEmpty()) {
                item {
                    Button(
                        onClick = {
                            isTestingNetwork = true
                            coroutineScope.launch {
                                val timeout = testTimeoutInput.toIntOrNull() ?: 5000
                                val socksPort = socksPortInput.toIntOrNull() ?: 20000
                                val activeDomains = testTargets.filter { it.isSelected }.map { it.domain }

                                configsList.forEach { config ->
                                    // تزریق تنظیمات پیشرفته رابط کاربری به بایت‌های کانفیگ جاری در زمان اجرای تست واقعی
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

                                    val tcpPing = XrayManager.performTcpPing(customConfig.address, customConfig.port, timeout)
                                    result.tcpPing = tcpPing

                                    if (tcpPing > 0) {
                                        result.jitter = XrayManager.calculateJitter(customConfig.address, customConfig.port, timeout)
                                        
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
                                            result.isHealthy = true
                                            
                                            for (domain in activeDomains) {
                                                val report = XrayManager.checkRealProxyDiagnostic(domain, socksPort, timeout)
                                                result.siteReports.add(report)
                                            }

                                            result.downloadSpeedMbps = XrayManager.performDownloadSpeedTest(socksPort, timeout)
                                            result.uploadSpeedMbps = XrayManager.performUploadSpeedTest(socksPort, timeout)

                                        } catch (e: Exception) {
                                            result.isHealthy = false
                                        } finally {
                                            xrayProcess?.destroy()
                                        }
                                    }
                                    testResults[customConfig.raw] = result
                                }
                                isTestingNetwork = false
                            }
                        },
                        enabled = !isTestingNetwork,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
                    ) {
                        if (isTestingNetwork) CircularProgressIndicator(size = 18.dp, color = Color.White)
                        else Text(strings.runTestsBtn, fontWeight = FontWeight.Bold)
                    }
                }

                // صادر کردن کانفیگ‌های فیلتر نشده سالم
                item {
                    Button(
                        onClick = {
                            val healthyConfigs = testResults.values
                                .filter { it.isHealthy }
                                .map { it.config.raw }
                                .joinToString("\n")

                            if (healthyConfigs.isNotEmpty()) {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                val clip = ClipData.newPlainText("Healthy Configs", healthyConfigs)
                                clipboard.setPrimaryClip(clip)
                                Toast.makeText(context, strings.copySuccessMsg, Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "هیچ کانفیگ سالمی یافت نشد!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text(strings.exportHealthyBtn)
                    }
                }
            }

            // گزارش لایو نتایج به کاربر به صورت تفکیک شده
            if (testResults.isNotEmpty()) {
                item {
                    Text(strings.testResultsTitle, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                }

                items(testResults.values.toList()) { result ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = if (result.isHealthy) Color(0xFF1B5E20) else Color(0xFF2C2C2C)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "[${result.config.protocol.uppercase()}] ${result.config.remarks}",
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            
                            Text("${strings.tcpPingLabel}: ${if (result.tcpPing > 0) "${result.tcpPing} ms" else strings.statusFailed}", fontSize = 12.sp, color = Color.LightGray)
                            
                            if (result.tcpPing > 0) {
                                Text("${strings.jitterLabel}: ${if (result.jitter >= 0) "${String.format("%.2f", result.jitter)} ms" else strings.statusFailed}", fontSize = 12.sp, color = Color.LightGray)
                                
                                if (result.isHealthy) {
                                    Text("${strings.downloadSpeedLabel}: ${if (result.downloadSpeedMbps >= 0) "${String.format("%.2f", result.downloadSpeedMbps)} Mbps" else strings.statusChecking}", fontSize = 12.sp, color = Color.LightGray)
                                    Text("${strings.uploadSpeedLabel}: ${if (result.uploadSpeedMbps >= 0) "${String.format("%.2f", result.uploadSpeedMbps)} Mbps" else strings.statusChecking}", fontSize = 12.sp, color = Color.LightGray)
                                    
                                    if (result.siteReports.isNotEmpty()) {
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

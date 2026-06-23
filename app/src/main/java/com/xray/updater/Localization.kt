package com.xray.updater

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

enum class AppLanguage {
    ENGLISH, PERSIAN
}

object Localization {
    var currentLanguage by mutableStateOf(AppLanguage.PERSIAN)

    fun toggleLanguage() {
        currentLanguage = if (currentLanguage == AppLanguage.PERSIAN) {
            AppLanguage.ENGLISH
        } else {
            AppLanguage.PERSIAN
        }
    }

    val strings: Translation
        get() = if (currentLanguage == AppLanguage.PERSIAN) PersianTranslation else EnglishTranslation
}

interface Translation {
    val appName: String
    val currentCoreVersion: String
    val latestCoreVersion: String
    val checkVersionBtn: String
    val downloadCoreBtn: String
    val selectConfigTitle: String
    val importClipboard: String
    val importFile: String
    val importSubLink: String
    val subUrlPlaceholder: String
    val runTestsBtn: String
    val testResultsTitle: String
    val tcpPingLabel: String
    val jitterLabel: String
    val realDelayLabel: String
    val downloadSpeedLabel: String
    val uploadSpeedLabel: String
    val websiteCheckLabel: String
    val statusChecking: String
    val statusSuccess: String
    val statusFailed: String
    val exportHealthyBtn: String
    val copySuccessMsg: String
    val settingsTitle: String
    val localSocksPort: String
    val testTimeout: String
    val customDomains: String
    val languageBtn: String
    val unknown: String
    val progressDownloading: String
    val progressExtracting: String
    
    // کلمات جدید متناظر با فینگرپرینت، مالتی‌پلکس و فرگمنت
    val fragmentSettings: String
    val enableFragment: String
    val fragmentLength: String
    val fragmentInterval: String
    val muxSettings: String
    val enableMux: String
    val muxConcurrency: String
    val xudpConcurrencyLabel: String
    val tlsFingerprint: String
}

object PersianTranslation : Translation {
    override val appName = "ایکس ری مالتی تست"
    override val currentCoreVersion = "نسخه فعلی هسته: "
    override val latestCoreVersion = "آخرین نسخه منتشر شده: "
    override val checkVersionBtn = "بررسی نسخه جدید هسته"
    override val downloadCoreBtn = "دانلود و بروزرسانی هسته"
    override val selectConfigTitle = "وارد کردن کانفیگ‌ها"
    override val importClipboard = "وارد کردن از کلیپ‌بورد"
    override val importFile = "وارد کردن از فایل متنی"
    override val importSubLink = "دریافت از لینک اشتراک"
    override val subUrlPlaceholder = "آدرس لینک اشتراک را وارد کنید"
    override val runTestsBtn = "شروع تمام تست‌ها"
    override val testResultsTitle = "نتایج ارزیابی"
    override val tcpPingLabel = "تأخیر TCP"
    override val jitterLabel = "جیتر (نوسان تأخیر)"
    override val realDelayLabel = "تأخیر واقعی (HTTP)"
    override val downloadSpeedLabel = "سرعت دانلود"
    override val uploadSpeedLabel = "سرعت آپلود"
    override val websiteCheckLabel = "بررسی سایت‌های منتخب"
    override val statusChecking = "در حال تست..."
    override val statusSuccess = "موفق"
    override val statusFailed = "خطا"
    override val exportHealthyBtn = "کپی کانفیگ‌های سالم"
    override val copySuccessMsg = "کانفیگ‌های سالم با موفقیت کپی شدند!"
    override val settingsTitle = "شخصی‌سازی تنظیمات"
    override val localSocksPort = "پورت محلی SOCKS"
    override val testTimeout = "زمان انتظار تست (میلی‌ثانیه)"
    override val customDomains = "سایت‌های تست دسترسی"
    override val languageBtn = "تغییر زبان (EN)"
    override val unknown = "نامشخص"
    override val progressDownloading = "در حال دانلود هسته..."
    override val progressExtracting = "در حال استخراج باینری..."
    
    override val fragmentSettings = "پیکربندی فرگمنت (مبارزه با ممیزی SNI)"
    override val enableFragment = "فعالسازی فرگمنت ترافیکی"
    override val fragmentLength = "طول بازه بایت‌های فرگمنت"
    override val fragmentInterval = "میزان تأخیر بین فرگمنت‌ها (ms)"
    override val muxSettings = "پیکربندی چندگانه‌سازی (Mux / XUDP)"
    override val enableMux = "فعالسازی مالتی‌پلکسر ترافیک"
    override val muxConcurrency = "حداکثر کانکشن‌های همزمان TCP"
    override val xudpConcurrencyLabel = "همزمانی تونل‌های XUDP"
    override val tlsFingerprint = "شبیه‌ساز اثر انگشت uTLS"
}

object EnglishTranslation : Translation {
    override val appName = "Xray Multi Test"
    override val currentCoreVersion = "Current Core Version: "
    override val latestCoreVersion = "Latest Available Version: "
    override val checkVersionBtn = "Check for Core Update"
    override val downloadCoreBtn = "Download & Install Core"
    override val selectConfigTitle = "Import Configurations"
    override val importClipboard = "Import from Clipboard"
    override val importFile = "Import from Text File"
    override val importSubLink = "Import from Sub Link"
    override val subUrlPlaceholder = "Enter Subscription URL"
    override val runTestsBtn = "Start Diagnostics"
    override val testResultsTitle = "Diagnostics Report"
    override val tcpPingLabel = "TCP Ping"
    override val jitterLabel = "Jitter"
    override val realDelayLabel = "Real Delay (HTTP)"
    override val downloadSpeedLabel = "Download Speed"
    override val uploadSpeedLabel = "Upload Speed"
    override val websiteCheckLabel = "Website Reachability"
    override val statusChecking = "Testing..."
    override val statusSuccess = "Success"
    override val statusFailed = "Failed"
    override val exportHealthyBtn = "Copy Healthy Configs"
    override val copySuccessMsg = "Healthy configs copied successfully!"
    override val settingsTitle = "Custom Settings"
    override val localSocksPort = "Local SOCKS Port"
    override val testTimeout = "Test Timeout (ms)"
    override val customDomains = "Test Websites"
    override val languageBtn = "Switch Language (FA)"
    override val unknown = "Unknown"
    override val progressDownloading = "Downloading core..."
    override val progressExtracting = "Extracting binary..."
    
    override val fragmentSettings = "Fragment Slicing (Anti-SNI Blocking)"
    override val enableFragment = "Enable Traffic Fragmentation"
    override val fragmentLength = "Fragment Length (bytes)"
    override val fragmentInterval = "Fragment Delay (ms)"
    override val muxSettings = "Multiplexing Config (Mux / XUDP)"
    override val enableMux = "Enable Traffic Multiplexing"
    override val muxConcurrency = "Max TCP Concurrency"
    override val xudpConcurrencyLabel = "XUDP Concurrency Limit"
    override val tlsFingerprint = "TLS uTLS Fingerprint Simulator"
}

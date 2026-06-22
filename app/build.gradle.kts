plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.xray.updater"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.xray.updater"
        minSdk = 26
        targetSdk = 34

        // دریافت پویای اطلاعات نسخه از پارامترهای گیت‌هاب اکشن یا بازگشت به مقادیر پیش‌فرض محلی
        val propVersionName = project.findProperty("versionName") as? String ?: "1.0.0-local"
        val propVersionCode = (project.findProperty("versionCode") as? String)?.toIntOrNull() ?: 1

        versionCode = propVersionCode
        versionName = propVersionName

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // ایجاد متغیر ثابت کامپایل برای استفاده در کدهای کاتلین و نمایش نسخه دقیق نرم‌افزار داخل اپلیکیشن
        buildConfigField("String", "APP_VERSION", "\"$propVersionName\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // در حالت پیش‌فرض برای اطمینان از خروجی گرفتن موفق، بیلد ریلیز با کلید دیباگ امضا می‌شود
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    
    // جت‌پک کامپوز برای رابط کاربری مدرن
    implementation(platform("androidx.compose:compose-bom:228f1e1")) // استفاده از بوم پایدار و هماهنگ
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.2.0")

    // کتابخانه کلاینت HTTP برای دریافت اطلاعات مخزن و تست سرعت
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    
    // کاروتین‌ها برای تسک‌های پس‌زمینه (دانلود و بنچمارک)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}

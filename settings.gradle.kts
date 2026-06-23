pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

// تعیین نام پروژه ریشه و کلاس ماژول‌های زیرشاخه
rootProject.name = "Xray Multi Test"
include(":app")

tasks.register("clean") {
    delete(rootProject.layout.buildDirectory)
}

tasks.register("assembleDebug") {
    doLast {
        println("Dummy assembleDebug task for web-only rewrite applet completed successfully.")
    }
}

tasks.register("assembleRelease") {
    doLast {
        println("Dummy assembleRelease task for web-only rewrite applet completed successfully.")
    }
}

tasks.register("lint") {
    doLast {
        println("Dummy lint task for web-only rewrite applet completed successfully.")
    }
}

pluginManagement {
	repositories {
		google()
		mavenCentral()
		gradlePluginPortal()
	}
	plugins {
		id("com.android.application") version "8.5.2"
		id("org.jetbrains.kotlin.android") version "1.9.24"
		id("org.jetbrains.kotlin.kapt") version "1.9.24"
		id("com.google.dagger.hilt.android") version "2.52"
	}
}

dependencyResolutionManagement {
	repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
	repositories {
		google()
		mavenCentral()
	}
}

rootProject.name = "DyadAndroid"
include(":app")
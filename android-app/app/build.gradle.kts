plugins {
	id("com.android.application")
	id("org.jetbrains.kotlin.android")
	id("org.jetbrains.kotlin.kapt")
	id("com.google.dagger.hilt.android")
}

android {
	namespace = "com.dyad.android"
	compileSdk = 34

	defaultConfig {
		applicationId = "com.dyad.android"
		minSdk = 24
		targetSdk = 34
		val ciVersionName = System.getenv("CI_VERSION_NAME") ?: "1.0.0"
		val ciVersionCode = System.getenv("CI_VERSION_CODE")?.toIntOrNull() ?: 1
		versionCode = ciVersionCode
		versionName = ciVersionName

		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
		vectorDrawables.useSupportLibrary = true
	}

	val keystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
	val keystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
	val keyAlias = System.getenv("ANDROID_KEY_ALIAS")
	val keyPassword = System.getenv("ANDROID_KEY_PASSWORD")

	if (!keystorePath.isNullOrBlank() && !keystorePassword.isNullOrBlank() && !keyAlias.isNullOrBlank() && !keyPassword.isNullOrBlank()) {
		signingConfigs {
			create("release") {
				storeFile = file(keystorePath)
				storePassword = keystorePassword
				this.keyAlias = keyAlias
				this.keyPassword = keyPassword
			}
		}
	}

	buildTypes {
		release {
			isMinifyEnabled = true
			proguardFiles(
				getDefaultProguardFile("proguard-android-optimize.txt"),
				"proguard-rules.pro"
			)
			if (!keystorePath.isNullOrBlank() && !keystorePassword.isNullOrBlank() && !keyAlias.isNullOrBlank() && !keyPassword.isNullOrBlank()) {
				signingConfig = signingConfigs.getByName("release")
			}
		}
		debug {
			applicationIdSuffix = ".debug"
			versionNameSuffix = "+debug"
			isMinifyEnabled = false
		}
	}

	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_17
		targetCompatibility = JavaVersion.VERSION_17
	}

	kotlinOptions {
		jvmTarget = "17"
		freeCompilerArgs += listOf("-Xjvm-default=all")
	}

	buildFeatures {
		buildConfig = true
		viewBinding = true
	}

	packaging {
		resources.excludes += setOf("META-INF/AL2.0", "META-INF/LGPL2.1")
	}
}

dependencies {
	implementation(platform("org.jetbrains.kotlin:kotlin-bom"))
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

	implementation("androidx.core:core-ktx:1.13.1")
	implementation("androidx.appcompat:appcompat:1.7.0")
	implementation("com.google.android.material:material:1.12.0")
	implementation("androidx.activity:activity-ktx:1.9.2")
	implementation("androidx.constraintlayout:constraintlayout:2.1.4")
	implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
	implementation("androidx.browser:browser:1.8.0")
	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.5")
	implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")

	// Hilt DI
	implementation("com.google.dagger:hilt-android:2.52")
	kapt("com.google.dagger:hilt-android-compiler:2.52")

	// Room
	implementation("androidx.room:room-runtime:2.6.1")
	implementation("androidx.room:room-ktx:2.6.1")
	kapt("androidx.room:room-compiler:2.6.1")

	// WorkManager + Hilt integration
	implementation("androidx.work:work-runtime-ktx:2.9.1")
	implementation("androidx.hilt:hilt-work:1.2.0")
	kapt("androidx.hilt:hilt-compiler:1.2.0")

	// DataStore
	implementation("androidx.datastore:datastore-preferences:1.1.1")

	// Security Crypto
	implementation("androidx.security:security-crypto:1.1.0-alpha06")

	// OkHttp
	implementation("com.squareup.okhttp3:okhttp:4.12.0")
	implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

	testImplementation("junit:junit:4.13.2")
	androidTestImplementation("androidx.test.ext:junit:1.2.1")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
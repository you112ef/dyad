package com.dyad.android

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.MimeTypeMap
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.view.isVisible
import com.dyad.android.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
	private lateinit var binding: ActivityMainBinding
	private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

	private val pickFiles = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
		val callback = fileChooserCallback
		fileChooserCallback = null
		if (callback == null) return@registerForActivityResult
		val data = result.data
		if (result.resultCode == Activity.RESULT_OK && data != null) {
			val clipData = data.clipData
			if (clipData != null && clipData.itemCount > 0) {
				val uris = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
				callback.onReceiveValue(uris)
			} else {
				data.data?.let { callback.onReceiveValue(arrayOf(it)) } ?: callback.onReceiveValue(emptyArray())
			}
		} else {
			callback.onReceiveValue(null)
		}
	}

	@SuppressLint("SetJavaScriptEnabled")
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		enableEdgeToEdge()
		binding = ActivityMainBinding.inflate(layoutInflater)
		setContentView(binding.root)

		setSupportActionBar(binding.toolbar)

		val webView = binding.webView
		with(webView.settings) {
			javaScriptEnabled = true
			domStorageEnabled = true
			databaseEnabled = true
			loadsImagesAutomatically = true
			mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
			useWideViewPort = true
			loadWithOverviewMode = true
			builtInZoomControls = false
			displayZoomControls = false
			cacheMode = WebSettings.LOAD_DEFAULT
		}

		CookieManager.getInstance().setAcceptCookie(true)
		CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

		binding.swipeRefresh.setOnRefreshListener {
			webView.reload()
		}

		webView.webViewClient = object : WebViewClient() {
			override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
				val url = if (Build.VERSION.SDK_INT >= 21) request?.url?.toString() else null
				if (url != null && shouldOpenExternally(url)) {
					openExternal(url)
					return true
				}
				return false
			}

			override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
				super.onPageStarted(view, url, favicon)
				binding.progress.isVisible = true
				findViewById<View>(R.id.errorView).isVisible = false
			}

			override fun onPageFinished(view: WebView?, url: String?) {
				super.onPageFinished(view, url)
				binding.progress.isVisible = false
				binding.swipeRefresh.isRefreshing = false
				injectViewportFix(view)
			}

			override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
				super.onReceivedError(view, request, error)
				binding.progress.isVisible = false
				binding.swipeRefresh.isRefreshing = false
				findViewById<View>(R.id.errorView).isVisible = true
			}
		}

		webView.webChromeClient = object : WebChromeClient() {
			override fun onShowFileChooser(
				webView: WebView?,
				filePathCallback: ValueCallback<Array<Uri>>?,
				fileChooserParams: FileChooserParams?
			): Boolean {
				fileChooserCallback = filePathCallback
				val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
					type = "*/*"
					putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
					addCategory(Intent.CATEGORY_OPENABLE)
				}
				pickFiles.launch(Intent.createChooser(intent, "اختر ملف"))
				return true
			}
		}

		webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
			try {
				val filename = URLUtil.guessFileName(url, contentDisposition, mimetype)
				val intent = Intent(Intent.ACTION_VIEW).apply {
					data = Uri.parse(url)
					putExtra(Intent.EXTRA_TITLE, filename)
				}
				startActivity(intent)
			} catch (_: Exception) { }
		})

		findViewById<Button>(R.id.btnRetry).setOnClickListener {
			findViewById<View>(R.id.errorView).isVisible = false
			webView.reload()
		}

		val startUrl = getString(R.string.dyad_url)
		webView.loadUrl(startUrl)
	}

	private fun injectViewportFix(view: WebView?) {
		view?.evaluateJavascript(
			"(function(){var m=document.querySelector('meta[name=viewport]');if(!m){m=document.createElement('meta');m.name='viewport';m.content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';document.head.appendChild(m);}else{m.content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';}})();",
			null
		)
	}

	private fun shouldOpenExternally(url: String): Boolean {
		return try {
			val uri = Uri.parse(url)
			val host = uri.host ?: return false
			!host.contains("dyad")
		} catch (_: Exception) { false }
	}

	private fun openExternal(url: String) {
		try {
			val intent = CustomTabsIntent.Builder().build()
			intent.launchUrl(this, Uri.parse(url))
		} catch (_: ActivityNotFoundException) {
			startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
		}
	}

	override fun onBackPressed() {
		val webView = binding.webView
		if (webView.canGoBack()) {
			webView.goBack()
		} else {
			super.onBackPressed()
		}
	}
}
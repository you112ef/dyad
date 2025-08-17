package com.dyad.android.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.dyad.android.R

class SyncForegroundService : Service() {
	override fun onBind(intent: Intent?): IBinder? = null

	override fun onCreate() {
		super.onCreate()
		createChannel()
		startForeground(1, buildNotification("المزامنة قيد التشغيل"))
	}

	override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		return START_STICKY
	}

	private fun createChannel() {
		if (Build.VERSION.SDK_INT >= 26) {
			val channel = NotificationChannel(
				CHANNEL_ID,
				"Dyad Sync",
				NotificationManager.IMPORTANCE_LOW
			)
			val nm = getSystemService(NotificationManager::class.java)
			nm.createNotificationChannel(channel)
		}
	}

	private fun buildNotification(content: String): Notification {
		return NotificationCompat.Builder(this, CHANNEL_ID)
			.setSmallIcon(R.mipmap.ic_launcher)
			.setContentTitle("Dyad")
			.setContentText(content)
			.setOngoing(true)
			.build()
	}

	companion object {
		private const val CHANNEL_ID = "dyad_sync"
	}
}
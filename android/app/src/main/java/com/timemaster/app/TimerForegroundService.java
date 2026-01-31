package com.timemaster.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class TimerForegroundService extends Service {
    private static final String TAG = "TimerForegroundService";
    private static final String CHANNEL_ID = "timer_notification_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_START = "com.timemaster.app.START_TIMER_SERVICE";
    public static final String ACTION_STOP = "com.timemaster.app.STOP_TIMER_SERVICE";
    public static final String ACTION_UPDATE = "com.timemaster.app.UPDATE_TIMER_SERVICE";
    public static final String ACTION_PAUSE = "com.timemaster.app.PAUSE_TIMER";
    public static final String ACTION_RESUME = "com.timemaster.app.RESUME_TIMER";

    private static final String EXTRA_TASK_TITLE = "task_title";
    private static final String EXTRA_PRODUCTIVE_TIME = "productive_time";
    private static final String EXTRA_TARGET_TIME = "target_time";
    private static final String EXTRA_WASTED_TIME = "wasted_time";
    private static final String EXTRA_IS_PAUSED = "is_paused";

    private NotificationManager notificationManager;
    private Handler handler;
    private boolean isRunning = false;
    
    private String taskTitle = "";
    private String productiveTime = "0:00";
    private String targetTime = "25:00";
    private String wastedTime = "0:00";
    private boolean isPaused = false;

    private BroadcastReceiver actionReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = getSystemService(NotificationManager.class);
        handler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
        registerActionReceiver();
        Log.d(TAG, "Service created");
    }

    private void registerActionReceiver() {
        actionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (ACTION_PAUSE.equals(action) || ACTION_RESUME.equals(action)) {
                    // Send broadcast to JavaScript layer
                    Intent jsIntent = new Intent("com.timemaster.app.TIMER_ACTION");
                    jsIntent.putExtra("action", ACTION_PAUSE.equals(action) ? "pause" : "resume");
                    sendBroadcast(jsIntent);
                }
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_PAUSE);
        filter.addAction(ACTION_RESUME);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(actionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(actionReceiver, filter);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_STICKY;
        }

        String action = intent.getAction();
        if (action == null) {
            return START_STICKY;
        }

        switch (action) {
            case ACTION_START:
            case ACTION_UPDATE:
                taskTitle = intent.getStringExtra(EXTRA_TASK_TITLE);
                productiveTime = intent.getStringExtra(EXTRA_PRODUCTIVE_TIME);
                targetTime = intent.getStringExtra(EXTRA_TARGET_TIME);
                wastedTime = intent.getStringExtra(EXTRA_WASTED_TIME);
                isPaused = intent.getBooleanExtra(EXTRA_IS_PAUSED, false);
                
                if (taskTitle == null) taskTitle = "Timer";
                if (productiveTime == null) productiveTime = "0:00";
                if (targetTime == null) targetTime = "25:00";
                if (wastedTime == null) wastedTime = "0:00";

                if (!isRunning) {
                    startForeground(NOTIFICATION_ID, buildNotification());
                    isRunning = true;
                    Log.d(TAG, "Service started");
                } else {
                    notificationManager.notify(NOTIFICATION_ID, buildNotification());
                }
                break;

            case ACTION_STOP:
                stopForeground(true);
                stopSelf();
                isRunning = false;
                Log.d(TAG, "Service stopped");
                break;
        }

        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Timer Notification",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows timer progress in notification");
            channel.setShowBadge(false);
            channel.enableLights(false);
            channel.enableVibration(false);
            channel.setSound(null, null);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        // Intent to open the app when notification is tapped
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openAppIntent.putExtra("route", "/timer");
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Pause/Resume action
        Intent actionIntent = new Intent(isPaused ? ACTION_RESUME : ACTION_PAUSE);
        PendingIntent actionPendingIntent = PendingIntent.getBroadcast(
            this,
            1,
            actionIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String title = isPaused ? "⏸️ Timer Paused" : "⏱️ Timer Running";
        String content = buildNotificationContent();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_timer)
            .setContentTitle(title)
            .setContentText(content)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(content))
            .setContentIntent(openAppPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .addAction(
                isPaused ? android.R.drawable.ic_media_play : android.R.drawable.ic_media_pause,
                isPaused ? "Resume" : "Pause",
                actionPendingIntent
            );

        return builder.build();
    }

    private String buildNotificationContent() {
        StringBuilder sb = new StringBuilder();
        sb.append(taskTitle).append("\n");
        sb.append("🎯 ").append(productiveTime).append(" / ").append(targetTime);
        
        if (isPaused && wastedTime != null && !wastedTime.equals("0:00")) {
            sb.append("\n⚠️ Wasted: ").append(wastedTime);
        }
        
        return sb.toString();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (actionReceiver != null) {
            unregisterReceiver(actionReceiver);
        }
        Log.d(TAG, "Service destroyed");
    }
}

package com.timemaster.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TimerNotification")
public class TimerNotificationPlugin extends Plugin {
    private static final String TAG = "TimerNotificationPlugin";
    private BroadcastReceiver timerActionReceiver;

    @Override
    public void load() {
        registerTimerActionReceiver();
    }

    private void registerTimerActionReceiver() {
        timerActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getStringExtra("action");
                if (action != null) {
                    JSObject data = new JSObject();
                    data.put("action", action);
                    notifyListeners("timerAction", data);
                    Log.d(TAG, "Timer action received: " + action);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.timemaster.app.TIMER_ACTION");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Use RECEIVER_EXPORTED so we can receive broadcasts from the foreground service
            getContext().registerReceiver(timerActionReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            getContext().registerReceiver(timerActionReceiver, filter);
        }
    }

    @PluginMethod
    public void startService(PluginCall call) {
        String taskTitle = call.getString("taskTitle", "Timer");
        String productiveTime = call.getString("productiveTime", "0:00");
        String targetTime = call.getString("targetTime", "25:00");
        String wastedTime = call.getString("wastedTime", "0:00");
        boolean isPaused = call.getBoolean("isPaused", false);
        int progressPercent = call.getInt("progressPercent", 0);

        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        intent.setAction(TimerForegroundService.ACTION_START);
        intent.putExtra("task_title", taskTitle);
        intent.putExtra("productive_time", productiveTime);
        intent.putExtra("target_time", targetTime);
        intent.putExtra("wasted_time", wastedTime);
        intent.putExtra("is_paused", isPaused);
        intent.putExtra("progress_percent", progressPercent);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
        Log.d(TAG, "Service started");
    }

    @PluginMethod
    public void updateService(PluginCall call) {
        String taskTitle = call.getString("taskTitle", "Timer");
        String productiveTime = call.getString("productiveTime", "0:00");
        String targetTime = call.getString("targetTime", "25:00");
        String wastedTime = call.getString("wastedTime", "0:00");
        boolean isPaused = call.getBoolean("isPaused", false);
        int progressPercent = call.getInt("progressPercent", 0);

        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        intent.setAction(TimerForegroundService.ACTION_UPDATE);
        intent.putExtra("task_title", taskTitle);
        intent.putExtra("productive_time", productiveTime);
        intent.putExtra("target_time", targetTime);
        intent.putExtra("wasted_time", wastedTime);
        intent.putExtra("is_paused", isPaused);
        intent.putExtra("progress_percent", progressPercent);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }

        call.resolve();
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        intent.setAction(TimerForegroundService.ACTION_STOP);
        getContext().startService(intent);
        
        call.resolve();
        Log.d(TAG, "Service stopped");
    }

    @Override
    protected void handleOnDestroy() {
        if (timerActionReceiver != null) {
            getContext().unregisterReceiver(timerActionReceiver);
        }
    }
}

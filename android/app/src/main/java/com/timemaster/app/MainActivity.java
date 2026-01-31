package com.timemaster.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.view.View;

public class MainActivity extends BridgeActivity {
    
    private WebView customWebView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before super.onCreate
        registerPlugin(TimerNotificationPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        // Get the WebView
        WebView webView = this.getBridge().getWebView();
        customWebView = webView;
        
        // Enable WebView debugging
        WebView.setWebContentsDebuggingEnabled(true);
        
        // Use hardware acceleration (default, best performance)
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        // Enable scrolling
        webView.setVerticalScrollBarEnabled(true);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setScrollbarFadingEnabled(true);
        
        // Make WebView focusable
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setNestedScrollingEnabled(true);
        
        // Configure WebSettings
        WebSettings webSettings = webView.getSettings();
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setJavaScriptEnabled(true);
        webSettings.setSupportMultipleWindows(false);
        webSettings.setTextZoom(100);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        android.util.Log.d("MainActivity", "WebView configured");
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Ensure WebView properly handles focus for keyboard input
        if (hasFocus && customWebView != null) {
            customWebView.requestFocus();
        }
    }
}

package com.timemaster.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.view.View;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Get the WebView
        WebView webView = this.getBridge().getWebView();
        
        // Force hardware acceleration for WebView to reduce input lag
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        // Enable scrolling
        webView.setVerticalScrollBarEnabled(true);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setScrollbarFadingEnabled(true);
        
        // Make sure WebView is focusable and can receive touch events
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        
        // Enable nested scrolling for better compatibility with coordinator layout
        webView.setNestedScrollingEnabled(true);
        
        // Configure WebSettings for better scrolling
        WebSettings webSettings = webView.getSettings();
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setDomStorageEnabled(true);
        
        // Log for debugging
        android.util.Log.d("MainActivity", "WebView configured for scrolling");
    }
}

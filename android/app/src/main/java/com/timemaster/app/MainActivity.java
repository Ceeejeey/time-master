package com.timemaster.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Force hardware acceleration for WebView to reduce input lag
        WebView webView = this.getBridge().getWebView();
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        // Log for debugging
        android.util.Log.d("MainActivity", "WebView hardware acceleration enabled");
    }
}

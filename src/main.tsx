import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/mobile-utils.css";

// Capacitor App Plugin for detecting when app becomes active
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// For mobile: Check for OAuth success when app becomes active
if (Capacitor.isNativePlatform()) {
  console.log('=== Mobile OAuth Detection Initialized ===');
  
  // Check on app state changes
  CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
    console.log('App state changed:', isActive ? 'ACTIVE' : 'INACTIVE');
    
    if (isActive) {
      // Wait a bit for any async operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Checking for OAuth completion...');
      
      // Try both localStorage and sessionStorage (different browsers/webviews handle differently)
      const oauthSuccess = sessionStorage.getItem('mobile_oauth_success') || localStorage.getItem('mobile_oauth_success');
      const timestamp = sessionStorage.getItem('mobile_oauth_timestamp') || localStorage.getItem('mobile_oauth_timestamp');
      
      console.log('OAuth status:', { 
        success: oauthSuccess, 
        timestamp, 
        sessionStorage: sessionStorage.getItem('mobile_oauth_success'),
        localStorage: localStorage.getItem('mobile_oauth_success')
      });
      
      if (oauthSuccess && timestamp) {
        const timeDiff = Date.now() - parseInt(timestamp);
        console.log('OAuth timestamp age:', Math.floor(timeDiff / 1000), 'seconds');
        
        // Only process if less than 5 minutes old
        if (timeDiff < 300000) {
          console.log('✅ Recent OAuth detected - Status:', oauthSuccess);
          
          // Clear the flags from both storages
          sessionStorage.removeItem('mobile_oauth_success');
          sessionStorage.removeItem('mobile_oauth_timestamp');
          localStorage.removeItem('mobile_oauth_success');
          localStorage.removeItem('mobile_oauth_timestamp');
          
          if (oauthSuccess === 'true') {
            console.log('🔄 Reloading app to verify session...');
            // Force full reload to re-check authentication
            window.location.href = '/';
          } else {
            console.log('❌ OAuth failed');
            window.location.href = '/login?error=oauth_failed';
          }
        } else {
          console.log('⚠️ OAuth timestamp too old, clearing');
          sessionStorage.removeItem('mobile_oauth_success');
          sessionStorage.removeItem('mobile_oauth_timestamp');
          localStorage.removeItem('mobile_oauth_success');
          localStorage.removeItem('mobile_oauth_timestamp');
        }
      } else {
        console.log('ℹ️ No OAuth completion flags found');
      }
    }
  });
  
  // Also check immediately on app load
  console.log('🚀 Checking OAuth status on app load...');
  const initialOAuthSuccess = sessionStorage.getItem('mobile_oauth_success') || localStorage.getItem('mobile_oauth_success');
  const initialTimestamp = sessionStorage.getItem('mobile_oauth_timestamp') || localStorage.getItem('mobile_oauth_timestamp');
  
  console.log('Initial OAuth check:', { 
    success: initialOAuthSuccess, 
    timestamp: initialTimestamp 
  });
  
  if (initialOAuthSuccess && initialTimestamp) {
    const timeDiff = Date.now() - parseInt(initialTimestamp);
    if (timeDiff < 300000 && initialOAuthSuccess === 'true') {
      console.log('✅ OAuth success found on load, clearing flags');
      sessionStorage.removeItem('mobile_oauth_success');
      sessionStorage.removeItem('mobile_oauth_timestamp');
      localStorage.removeItem('mobile_oauth_success');
      localStorage.removeItem('mobile_oauth_timestamp');
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);

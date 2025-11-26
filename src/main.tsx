import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/mobile-utils.css";

// Capacitor App Plugin for detecting when app becomes active
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// For mobile: Check for OAuth success when app becomes active
if (Capacitor.isNativePlatform()) {
  console.log('Setting up mobile OAuth detection...');
  
  CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      console.log('App became active, checking for OAuth success...');
      
      // Small delay to ensure sessionStorage is accessible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if OAuth completed successfully in browser
      const oauthSuccess = sessionStorage.getItem('mobile_oauth_success');
      const timestamp = sessionStorage.getItem('mobile_oauth_timestamp');
      
      console.log('OAuth flags:', { oauthSuccess, timestamp });
      
      if (oauthSuccess && timestamp) {
        const timeDiff = Date.now() - parseInt(timestamp);
        
        // Only process if less than 2 minutes old (recent OAuth)
        if (timeDiff < 120000) {
          console.log('Recent OAuth detected:', oauthSuccess === 'true' ? 'SUCCESS' : 'FAILED');
          
          // Clear the flags
          sessionStorage.removeItem('mobile_oauth_success');
          sessionStorage.removeItem('mobile_oauth_timestamp');
          
          if (oauthSuccess === 'true') {
            // Force reload to check session
            console.log('Reloading app after OAuth success...');
            window.location.href = '/';
          } else {
            // Show error
            console.log('OAuth failed, redirecting to login');
            window.location.href = '/login?error=oauth_failed';
          }
        } else {
          console.log('OAuth timestamp too old, ignoring');
          sessionStorage.removeItem('mobile_oauth_success');
          sessionStorage.removeItem('mobile_oauth_timestamp');
        }
      } else {
        console.log('No OAuth flags found');
      }
    }
  });
  
  // Also check immediately on app load
  console.log('Checking OAuth on app load...');
  const oauthSuccess = sessionStorage.getItem('mobile_oauth_success');
  const timestamp = sessionStorage.getItem('mobile_oauth_timestamp');
  
  if (oauthSuccess && timestamp) {
    const timeDiff = Date.now() - parseInt(timestamp);
    if (timeDiff < 120000 && oauthSuccess === 'true') {
      console.log('OAuth success detected on load, clearing flags');
      sessionStorage.removeItem('mobile_oauth_success');
      sessionStorage.removeItem('mobile_oauth_timestamp');
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/mobile-utils.css";

// Capacitor App Plugin for deep link handling
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// For mobile: Handle deep links from OAuth
if (Capacitor.isNativePlatform()) {
  console.log('=== Mobile Deep Link Handler Initialized ===');
  
  // Listen for deep link events
  CapacitorApp.addListener('appUrlOpen', (event) => {
    console.log('🔗 Deep link received:', event.url);
    
    try {
      const url = new URL(event.url);
      const path = url.pathname + url.search;
      
      console.log('Deep link path:', path);
      
      // Handle OAuth success/failure
      if (event.url.includes('timemaster://auth/success')) {
        console.log('✅ OAuth SUCCESS - Redirecting to home');
        // Session already created by Appwrite, just navigate
        window.location.href = '/';
      } else if (event.url.includes('timemaster://auth/failure')) {
        console.log('❌ OAuth FAILED - Redirecting to login');
        window.location.href = '/login?error=oauth_failed';
      } else {
        console.log('Unknown deep link, ignoring');
      }
    } catch (error) {
      console.error('Error parsing deep link:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);

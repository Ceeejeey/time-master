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
      // Handle OAuth success/failure
      if (event.url.includes('timemaster://auth/success')) {
        console.log('✅ OAuth SUCCESS deep link - Flag already set, app will handle it');
        // Flag was already set in loginWithGoogle/loginWithGithub
        // AuthContext OAuth check will handle the rest
      } else if (event.url.includes('timemaster://auth/failure')) {
        console.log('❌ OAuth FAILED - Redirecting to login');
        sessionStorage.removeItem('oauth_success_pending');
        sessionStorage.removeItem('oauth_success_timestamp');
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

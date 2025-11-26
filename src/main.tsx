import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/mobile-utils.css";

// Capacitor App Plugin for deep link handling
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { account } from "./lib/appwrite.js";

// For mobile: Handle deep links from OAuth
if (Capacitor.isNativePlatform()) {
  console.log('=== Mobile Deep Link Handler Initialized ===');
  
  // Listen for deep link events
  CapacitorApp.addListener('appUrlOpen', async (event) => {
    console.log('🔗 Deep link received:', event.url);
    
    try {
      // Handle OAuth success
      if (event.url.includes('timemaster://auth/success')) {
        console.log('✅ OAuth SUCCESS deep link - Checking for session...');
        
        // Wait a moment for session to sync
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try to get session
        try {
          const user = await account.get();
          console.log('✅ Session found:', user.email);
          // Navigate to home - will trigger via window location
          window.location.href = '/';
        } catch (error) {
          console.error('❌ No session found after OAuth');
          window.location.href = '/login?error=oauth_session_failed';
        }
      } else if (event.url.includes('timemaster://auth/failure')) {
        console.log('❌ OAuth FAILED');
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

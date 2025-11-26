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
  
  // Listen for deep link events (Appwrite v2 Official Scheme)
  CapacitorApp.addListener('appUrlOpen', async (event) => {
    console.log('🔗 Deep link received:', event.url);
    
    try {
      // Handle OAuth success callback with Appwrite v2 official scheme
      if (event.url.includes('appwrite-callback://success')) {
        console.log('✅ OAuth success callback detected (Appwrite v2)');
        
        // Small delay to ensure session cookie is ready
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        try {
          // Session is automatically set by Appwrite - just fetch user
          const user = await account.get();
          console.log('✅ User authenticated:', user.email);
          
          // Navigate to home
          console.log('Navigating to home...');
          window.location.href = '/';
        } catch (sessionError) {
          console.error('❌ Failed to retrieve session:', sessionError);
          window.location.href = '/login?error=session_failed';
        }
      } 
      // Handle OAuth failure callback
      else if (event.url.includes('appwrite-callback://failure')) {
        console.log('❌ OAuth FAILED');
        window.location.href = '/login?error=oauth_failed';
      } 
      else {
        console.log('Unknown deep link, ignoring');
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      window.location.href = '/login?error=deep_link_error';
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);

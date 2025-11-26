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
      // Handle both Appwrite default scheme and custom scheme
      if (event.url.includes('appwrite-callback-690ec68b0024ca04c338') || 
          event.url.includes('timemaster://auth/success')) {
        console.log('✅ OAuth callback detected - Checking for session...');
        
        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to get session multiple times
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to get session...`);
          
          try {
            const user = await account.get();
            console.log('✅ Session found:', user.email);
            console.log('Navigating to home...');
            window.location.href = '/';
            return;
          } catch (error) {
            console.log(`Attempt ${attempts} failed, retrying...`);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        console.error('❌ No session found after all attempts');
        window.location.href = '/login?error=oauth_session_failed';
        
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

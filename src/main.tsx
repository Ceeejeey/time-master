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
      // Handle OAuth success callback
      if (event.url.includes('timemaster://auth/success') || 
          event.url.includes('appwrite-callback-690ec68b0024ca04c338')) {
        console.log('✅ OAuth success callback detected');
        
        // Parse the URL to extract userId and secret
        const url = new URL(event.url);
        const userId = url.searchParams.get('userId');
        const secret = url.searchParams.get('secret');
        
        console.log('Extracted params:', { userId: userId ? 'present' : 'missing', secret: secret ? 'present' : 'missing' });
        
        if (userId && secret) {
          console.log('Creating Appwrite session with userId and secret...');
          
          try {
            // Create the session using the userId and secret from OAuth callback
            await account.createSession(userId, secret);
            console.log('✅ Session created successfully');
            
            // Wait a moment for session to be established
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify by fetching user data
            const user = await account.get();
            console.log('✅ User authenticated:', user.email);
            
            // Navigate to home
            console.log('Navigating to home...');
            window.location.href = '/';
          } catch (sessionError) {
            console.error('❌ Failed to create session:', sessionError);
            window.location.href = '/login?error=session_creation_failed';
          }
        } else {
          console.error('❌ Missing userId or secret in callback URL');
          window.location.href = '/login?error=missing_oauth_params';
        }
      } 
      // Handle OAuth failure callback
      else if (event.url.includes('timemaster://auth/failure')) {
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

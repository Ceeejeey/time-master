import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/mobile-utils.css";
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { db } from './database';

// Initialize database at app startup
console.log('[App] Starting app initialization...');

// Wait for Capacitor to be fully ready before any initialization
const initApp = async () => {
  try {
    // Wait for Capacitor to be ready
    console.log('[App] Waiting for Capacitor to be ready...');
    await Capacitor.isPluginAvailable('CapacitorSQLite');
    console.log('[App] ✓ Capacitor ready');
    
    const platform = Capacitor.getPlatform();
    console.log('[App] Platform:', platform);
    
    // Configure keyboard behavior for better mobile input experience
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        await Keyboard.setScroll({ isDisabled: false });
        console.log('[App] ✓ Keyboard configured');
      } catch (e) {
        console.warn('[App] Keyboard configuration failed:', e);
      }
    }
    
    // Wait longer on native platforms for all plugins to initialize
    if (platform === 'android' || platform === 'ios') {
      console.log('[App] Waiting 500ms for native plugins to initialize...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('[App] Initializing database...');
    await db.initialize();
    console.log('[App] ✓ App ready');
  } catch (error) {
    console.error('[App] ✗ Initialization failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[App] Error details:', errorMessage);
  }
};

// Start initialization
initApp();

createRoot(document.getElementById("root")!).render(<App />);

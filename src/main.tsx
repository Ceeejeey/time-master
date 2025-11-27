import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/mobile-utils.css";
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { db } from './database';

// Configure keyboard behavior for better mobile input experience
if (Capacitor.isNativePlatform()) {
  Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  Keyboard.setScroll({ isDisabled: false });
}

// Initialize database at app startup (single initialization)
console.log('[App] Initializing database...');
db.initialize()
  .then(() => {
    console.log('[App] ✓ Database ready');
  })
  .catch((error) => {
    console.error('[App] ✗ Database initialization failed:', error);
  });

createRoot(document.getElementById("root")!).render(<App />);

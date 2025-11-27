import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timemaster.app',
  appName: 'TimeMaster',
  webDir: 'dist',
  
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      androidDatabaseLocation: 'databases'
    }
  }
  
  // Note: Plugin configurations commented out until plugins are installed
  // To add plugins, run:
  // npm install @capacitor/status-bar @capacitor/splash-screen
  // Then uncomment the plugins section below:
  
  // plugins: {
  //   SplashScreen: {
  //     launchShowDuration: 2000,
  //     backgroundColor: "#0ea5a6",
  //     showSpinner: false,
  //     androidSpinnerStyle: "small",
  //     spinnerColor: "#ffffff"
  //   },
  //   StatusBar: {
  //     style: "DARK",
  //     backgroundColor: "#0ea5a6"
  //   }
  // }
};

export default config;

import { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';

const MobileSuccess = () => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Set a flag in localStorage that the app can check
    localStorage.setItem('mobile_oauth_success', 'true');
    localStorage.setItem('mobile_oauth_timestamp', Date.now().toString());
    
    console.log('MobileSuccess: OAuth completed successfully');
    console.log('MobileSuccess: Set localStorage flags for app to detect');

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950 dark:via-green-900 dark:to-green-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Login Successful! ✨
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You can now close this browser and return to the TimeMaster app.
        </p>

        {/* Instructions */}
        <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
            📱 Next Steps:
          </p>
          <ol className="text-left text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>1. Close this browser tab</li>
            <li>2. Return to the TimeMaster app</li>
            <li>3. Pull down to refresh (if needed)</li>
          </ol>
        </div>

        {/* Auto-close notice */}
        {countdown > 0 && (
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <p className="text-sm">
              This page will close in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        )}

        {/* Manual close button */}
        <button
          onClick={() => window.close()}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Close Browser
        </button>

        {/* Technical note */}
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
          Your session has been created. Return to the app to continue.
        </p>
      </div>
    </div>
  );
};

export default MobileSuccess;

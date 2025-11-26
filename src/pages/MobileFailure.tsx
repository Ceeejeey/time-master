import { useEffect, useState } from 'react';
import { XCircle, Clock } from 'lucide-react';

const MobileFailure = () => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Set a flag in localStorage that the app can check
    localStorage.setItem('mobile_oauth_success', 'false');
    localStorage.setItem('mobile_oauth_timestamp', Date.now().toString());
    
    console.log('MobileFailure: OAuth failed');

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-red-950 dark:via-red-900 dark:to-red-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
        {/* Error Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Login Failed
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Authentication was not completed. Please try again.
        </p>

        {/* Instructions */}
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
            📱 Next Steps:
          </p>
          <ol className="text-left text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>1. Close this browser tab</li>
            <li>2. Return to the TimeMaster app</li>
            <li>3. Try logging in again</li>
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
          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Close Browser
        </button>
      </div>
    </div>
  );
};

export default MobileFailure;

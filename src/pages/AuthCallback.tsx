import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '@/lib/appwrite';
import { Clock, CheckCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileOAuth, setIsMobileOAuth] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a mobile OAuth callback viewed in browser
        const mobileOAuthInProgress = sessionStorage.getItem('mobile_oauth_in_progress');
        const isCapacitorApp = window.location.protocol.includes('capacitor') || Capacitor.isNativePlatform();
        
        console.log('AuthCallback context:', { 
          mobileOAuthInProgress, 
          isCapacitorApp,
          hostname: window.location.hostname,
          protocol: window.location.protocol 
        });
        
        if (mobileOAuthInProgress === 'true' && !isCapacitorApp) {
          // This is being viewed in browser after mobile OAuth - show success page
          setIsMobileOAuth(true);
          setIsChecking(false);
          
          // Set success flag in BOTH storages (Android may not share sessionStorage between browser and app)
          const timestamp = Date.now().toString();
          sessionStorage.setItem('mobile_oauth_success', 'true');
          sessionStorage.setItem('mobile_oauth_timestamp', timestamp);
          localStorage.setItem('mobile_oauth_success', 'true');
          localStorage.setItem('mobile_oauth_timestamp', timestamp);
          sessionStorage.removeItem('mobile_oauth_in_progress');
          
          console.log('✅ Mobile OAuth SUCCESS - Set flags in both storages');
          console.log('Timestamp:', timestamp);
          
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
        }

        // Regular web OAuth or app callback
        console.log('AuthCallback: Starting authentication check...');
        console.log('AuthCallback: Current URL:', window.location.href);
        
        // Wait a bit for OAuth session to be fully established
        console.log('AuthCallback: Waiting for OAuth session to be established...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try multiple times to get the session
        let user = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!user && attempts < maxAttempts) {
          attempts++;
          console.log(`AuthCallback: Attempt ${attempts}/${maxAttempts} to verify session...`);
          
          try {
            user = await account.get();
            console.log('AuthCallback: User authenticated successfully!', user.email);
            break;
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`AuthCallback: Attempt ${attempts} failed:`, errorMessage);
            
            if (attempts < maxAttempts) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (user) {
          console.log('AuthCallback: Redirecting to home page...');
          navigate('/', { replace: true });
        } else {
          console.error('AuthCallback: Failed to establish session after all attempts');
          
          navigate('/login', { 
            replace: true,
            state: { 
              error: 'Unable to complete authentication. Please try again.' 
            }
          });
        }
      } catch (error) {
        console.error('AuthCallback: Unexpected error:', error);
        navigate('/login', { 
          replace: true,
          state: { error: 'Authentication failed. Please try again.' }
        });
      } finally {
        setIsChecking(false);
      }
    };

    handleCallback();
  }, [navigate]);

  // Mobile OAuth success view (shown in browser)
  if (isMobileOAuth) {
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
              <li>3. App will automatically refresh</li>
            </ol>
          </div>

          {/* Auto-close notice */}
          {countdown > 0 && (
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <p className="text-sm">
                You can close this in {countdown} second{countdown !== 1 ? 's' : ''}
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
  }

  // Regular loading view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Animated Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl">
            <Clock className="w-12 h-12 text-primary-foreground animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Authenticating...
          </h2>
          <p className="text-muted-foreground">
            Setting up your workspace ✨
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '@/lib/appwrite';
import { Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we're on mobile (viewing in external browser after OAuth)
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|iphone|ipad|ipod/.test(userAgent);
        const isCapacitor = Capacitor.isNativePlatform();
        
        console.log('AuthCallback:', { isMobileDevice, isCapacitor, userAgent });
        
        // If on mobile device but NOT in Capacitor, show success page with return button
        if (isMobileDevice && !isCapacitor) {
          console.log('Mobile OAuth in external browser - showing success page');
          setIsMobile(true);
          setIsChecking(false);
          setAuthSuccess(true);
          return;
        }
        
        // Regular web or in-app flow
        console.log('AuthCallback: Starting authentication check...');
        console.log('AuthCallback: Current URL:', window.location.href);
        
        // Wait for OAuth session to be established
        console.log('AuthCallback: Waiting for OAuth session...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try to get the session
        let user = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!user && attempts < maxAttempts) {
          attempts++;
          console.log(`AuthCallback: Attempt ${attempts}/${maxAttempts} to verify session...`);
          
          try {
            user = await account.get();
            console.log('✅ AuthCallback: User authenticated!', user.email);
            break;
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`AuthCallback: Attempt ${attempts} failed:`, errorMessage);
            
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (user) {
          console.log('AuthCallback: Redirecting to home...');
          navigate('/', { replace: true });
        } else {
          console.error('AuthCallback: Failed to establish session');
          navigate('/login', { 
            replace: true,
            state: { error: 'Unable to complete authentication. Please try again.' }
          });
        }
      } catch (error) {
        console.error('AuthCallback: Error:', error);
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

  // Mobile success page - shown in external browser
  if (isMobile && authSuccess) {
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
            Your account is now connected. Return to the TimeMaster app to continue.
          </p>

          {/* Instructions */}
          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
              📱 Next Steps:
            </p>
            <ol className="text-left text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>1. Tap the button below to open the app</li>
              <li>2. If app doesn't open, manually switch to TimeMaster</li>
              <li>3. You should be logged in automatically</li>
            </ol>
          </div>

          {/* Open App Button */}
          <a
            href="timemaster://auth/success"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Open TimeMaster App
          </a>

          {/* Technical note */}
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
            Session created successfully. Close this browser when done.
          </p>
        </div>
      </div>
    );
  }

  // Loading view
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

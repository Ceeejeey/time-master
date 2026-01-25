import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveUser } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { ArrowRight, Clock, Target, TrendingUp, Sparkles } from 'lucide-react';
import Lottie from 'lottie-react';
import { db } from '@/database';
import { signInWithGoogle, initGoogleAuth, type GoogleUser } from '@/lib/google-auth';
import { Capacitor } from '@capacitor/core';

export const OnboardingScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isGoogleAuthInitialized, setIsGoogleAuthInitialized] = useState(false);
  const { refreshUser } = useAuth();
  const { startTutorial } = useTutorial();

  // Initialize Google Auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const platform = Capacitor.getPlatform();
      // Only initialize on native platforms
      if (platform === 'android' || platform === 'ios') {
        try {
          await initGoogleAuth();
          setIsGoogleAuthInitialized(true);
          console.log('[Onboarding] Google Auth initialized');
        } catch (error) {
          console.error('[Onboarding] Failed to initialize Google Auth:', error);
          // Don't block the app if Google Auth fails to initialize
        }
      }
    };
    initAuth();
  }, []);

  // Load premium Lottie animation from URL
  useEffect(() => {
    fetch('https://assets9.lottiefiles.com/packages/lf20_jcikwtux.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => {
        console.error('Failed to load Lottie animation:', err);
        // Fallback to simple animation if fetch fails
        setAnimationData({
          "v": "5.9.0",
          "fr": 60,
          "ip": 0,
          "op": 120,
          "w": 400,
          "h": 400,
          "nm": "Time",
          "ddd": 0,
          "assets": [],
          "layers": [{
            "ddd": 0,
            "ind": 1,
            "ty": 4,
            "nm": "Circle",
            "sr": 1,
            "ks": {
              "o": { "a": 0, "k": 100 },
              "r": { 
                "a": 1,
                "k": [
                  { "i": { "x": [0.42], "y": [1] }, "o": { "x": [0.58], "y": [0] }, "t": 0, "s": [0] },
                  { "t": 120, "s": [360] }
                ]
              },
              "p": { "a": 0, "k": [200, 200, 0] },
              "a": { "a": 0, "k": [0, 0, 0] },
              "s": { "a": 0, "k": [100, 100, 100] }
            },
            "ao": 0,
            "shapes": [{
              "ty": "gr",
              "it": [
                {
                  "d": 1,
                  "ty": "el",
                  "s": { "a": 0, "k": [200, 200] },
                  "p": { "a": 0, "k": [0, 0] },
                  "nm": "Circle"
                },
                {
                  "ty": "st",
                  "c": { "a": 0, "k": [0.4, 0.6, 1, 1] },
                  "o": { "a": 0, "k": 100 },
                  "w": { "a": 0, "k": 16 },
                  "lc": 2,
                  "lj": 1,
                  "ml": 4,
                  "bm": 0,
                  "nm": "Stroke"
                },
                {
                  "ty": "tr",
                  "p": { "a": 0, "k": [0, 0], "ix": 2 },
                  "a": { "a": 0, "k": [0, 0], "ix": 1 },
                  "s": { "a": 0, "k": [100, 100], "ix": 3 },
                  "r": { "a": 0, "k": 0, "ix": 6 },
                  "o": { "a": 0, "k": 100, "ix": 7 },
                  "sk": { "a": 0, "k": 0, "ix": 4 },
                  "sa": { "a": 0, "k": 0, "ix": 5 },
                  "nm": "Transform"
                }
              ],
              "nm": "Circle",
              "bm": 0,
              "hd": false
            }],
            "ip": 0,
            "op": 120,
            "st": 0,
            "bm": 0
          }],
          "markers": []
        });
      });
  }, []);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Update submit button state when username changes
  useEffect(() => {
    const trimmedName = username.trim();
    setCanSubmit(trimmedName.length > 0);
    setError(null); // Clear error when typing
  }, [username]);

  // Use onInput for better mobile input performance
  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    setUsername(e.currentTarget.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = username.trim();
    if (!trimmedName) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[Onboarding] Step 1: Waiting for Capacitor to be ready...');
      
      // Import Capacitor dynamically to ensure it's loaded
      const { Capacitor } = await import('@capacitor/core');
      const platform = Capacitor.getPlatform();
      console.log('[Onboarding] Platform:', platform);
      
      // Check if SQLite plugin is available
      const isSQLiteAvailable = await Capacitor.isPluginAvailable('CapacitorSQLite');
      console.log('[Onboarding] SQLite plugin available:', isSQLiteAvailable);
      
      if (!isSQLiteAvailable) {
        throw new Error('SQLite plugin not available. Please restart the app.');
      }
      
      // Wait for Capacitor to be ready on native platforms
      if (platform === 'android' || platform === 'ios') {
        console.log('[Onboarding] Waiting 300ms for native plugins...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log('[Onboarding] Step 2: Ensuring database is initialized...');
      
      // Ensure database is initialized before saving
      await db.initialize();
      console.log('[Onboarding] ✓ Database initialized');
      
      // Wait a bit for database to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('[Onboarding] Step 3: Checking if user table exists...');
      const tableCheck = await db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='user_profile'",
        []
      );
      console.log('[Onboarding] Table check result:', tableCheck);
      
      if (!tableCheck.values || tableCheck.values.length === 0) {
        throw new Error('Database tables not created. Please restart the app.');
      }
      
      console.log('[Onboarding] Step 4: Saving user:', trimmedName);
      await saveUser({
        id: '1',
        name: trimmedName,
        email: '',
        isPremium: false
      });
      
      console.log('[Onboarding] ✓ User saved successfully');
      
      console.log('[Onboarding] Step 5: Setting localStorage flag...');
      // Mark that user has completed onboarding
      localStorage.setItem('timemaster_has_user', 'true');
      
      console.log('[Onboarding] Step 6: Starting tutorial...');
      startTutorial();
      
      console.log('[Onboarding] Step 7: Refreshing auth state...');
      // Refresh auth state to trigger navigation to home
      await refreshUser();
      
      console.log('[Onboarding] ✓ Complete! Redirecting to app...');
    } catch (error) {
      console.error('[Onboarding] ✗ Error during onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to save profile: ${errorMessage}. Please try restarting the app.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    
    try {
      console.log('[Onboarding] Starting Google Sign-In...');
      
      // Sign in with Google - this shows the native account picker
      const googleUser = await signInWithGoogle();
      console.log('[Onboarding] Google Sign-In successful:', googleUser.email);
      
      // Ensure database is ready
      await db.initialize();
      
      // Wait a bit for database to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Save user with Google account info
      const userName = googleUser.name || googleUser.givenName || googleUser.email.split('@')[0];
      
      await saveUser({
        id: googleUser.id || '1',
        name: userName,
        email: googleUser.email,
        isPremium: false,
      });
      
      // Store Google-specific info in localStorage for profile picture etc.
      localStorage.setItem('timemaster_google_profile_pic', googleUser.imageUrl || '');
      localStorage.setItem('timemaster_google_id', googleUser.id || '');
      
      console.log('[Onboarding] ✓ Google user saved:', userName);
      
      // Mark that user has completed onboarding
      localStorage.setItem('timemaster_has_user', 'true');
      localStorage.setItem('timemaster_google_user', 'true');
      
      // Start tutorial
      startTutorial();
      
      // Refresh auth state to trigger navigation to home
      await refreshUser();
      
      console.log('[Onboarding] ✓ Google Sign-In complete! Redirecting...');
    } catch (error) {
      console.error('[Onboarding] ✗ Google Sign-In error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      
      // Don't show error for user cancellation
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('canceled')) {
        setError(errorMessage);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 dark:from-teal-900 dark:via-cyan-900 dark:to-teal-950 p-6 safe-top safe-bottom overflow-hidden relative">
      {/* Floating animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-teal-400/30 dark:bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-cyan-400/30 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-teal-300/20 dark:bg-teal-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-300/25 dark:bg-cyan-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.5s' }} />
      </div>

      {/* Main content container */}
      <div 
        className={`relative z-10 w-full max-w-md flex flex-col items-center gap-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Lottie Animation Container */}
        <div 
          className={`w-[180px] h-[180px] flex items-center justify-center transition-all duration-500 delay-100 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          {animationData && (
            <Lottie
              animationData={animationData}
              loop={true}
              className="w-full h-full drop-shadow-2xl"
            />
          )}
        </div>

        {/* Title Section */}
        <div 
          className={`text-center space-y-3 transition-all duration-500 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-200 animate-pulse" />
            TimeMaster
          </h1>
          <p className="text-lg text-white/90 font-medium drop-shadow">
            Master your time, achieve your goals
          </p>
        </div>

        {/* Feature Chips */}
        <div 
          className={`grid grid-cols-3 gap-3 w-full transition-all duration-500 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 shadow-xl hover:scale-105 transition-transform duration-300">
            <Clock className="w-7 h-7 text-white drop-shadow" />
            <span className="text-xs font-semibold text-white">Track Time</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 shadow-xl hover:scale-105 transition-transform duration-300">
            <Target className="w-7 h-7 text-white drop-shadow" />
            <span className="text-xs font-semibold text-white">Set Goals</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 shadow-xl hover:scale-105 transition-transform duration-300">
            <TrendingUp className="w-7 h-7 text-white drop-shadow" />
            <span className="text-xs font-semibold text-white">Grow</span>
          </div>
        </div>

        {/* Form Section */}
        <form 
          onSubmit={handleSubmit} 
          className={`w-full space-y-6 transition-all duration-500 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="space-y-3">
            <label htmlFor="username" className="text-sm font-bold block text-white drop-shadow">
              What's your name?
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your name"
              value={username}
              onInput={handleInputChange}
              autoComplete="name"
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="done"
              className="text-lg h-14 rounded-xl border-2 border-white/40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl focus:border-white focus:ring-4 focus:ring-white/30 transition-all duration-300 placeholder:text-gray-400"
              maxLength={50}
            />
            {username.length > 0 && (
              <p className="text-xs text-white/80 font-medium animate-fade-in">
                {username.trim().length} characters
              </p>
            )}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/90 backdrop-blur-sm border border-red-300 rounded-xl shadow-lg animate-fade-in">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <p className="text-sm text-white font-semibold">{error}</p>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-2xl bg-white hover:bg-white/95 text-teal-600 hover:text-teal-700 border-2 border-white/50 hover:scale-105 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
            size="lg"
            disabled={!canSubmit || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
                <span>Setting up your workspace...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Get Started</span>
                <ArrowRight className="w-6 h-6" />
              </span>
            )}
          </Button>

          {/* Divider */}
          {Capacitor.isNativePlatform() && isGoogleAuthInitialized && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/30"></div>
                </div>
                <div className="relative px-4 bg-transparent">
                  <span className="text-sm text-white/80 font-medium bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 dark:from-teal-900 dark:via-cyan-900 dark:to-teal-950 px-2">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full h-14 text-lg font-bold rounded-xl shadow-2xl bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-2 border-white/50 hover:scale-105 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                size="lg"
              >
                {isGoogleLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </span>
                )}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

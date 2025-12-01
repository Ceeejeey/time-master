import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveUser } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Clock, Target, TrendingUp, Sparkles } from 'lucide-react';
import Lottie from 'lottie-react';
import { db } from '@/database';

export const OnboardingScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { refreshUser } = useAuth();

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
      
      console.log('[Onboarding] Step 6: Refreshing auth state...');
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
        </form>
      </div>
    </div>
  );
};

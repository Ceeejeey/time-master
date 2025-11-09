import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is authenticated after OAuth redirect
    const handleCallback = async () => {
      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        // Successfully authenticated, redirect to home
        navigate('/', { replace: true });
      } else {
        // Authentication failed, redirect to login
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [user, navigate]);

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

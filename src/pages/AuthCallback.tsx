import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '@/lib/appwrite';
import { Clock } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Starting authentication check...');
        console.log('AuthCallback: Current URL:', window.location.href);
        
        // Give the OAuth redirect a moment to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // After OAuth redirect, Appwrite automatically creates the session
        // We just need to verify it exists
        console.log('AuthCallback: Checking for active session...');
        
        // Try to get the current user - this will work if OAuth succeeded
        const user = await account.get();
        
        if (user) {
          console.log('AuthCallback: User authenticated successfully!', user.email);
          // Small delay to ensure session is fully established
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate('/', { replace: true });
        } else {
          console.log('AuthCallback: No user found, redirecting to login');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('AuthCallback: Authentication error:', error);
        // If we get a 401, it means the session wasn't created
        // This is likely due to cross-domain cookie issues
        console.error('AuthCallback: Failed to establish session. This may be a cross-domain cookie issue.');
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

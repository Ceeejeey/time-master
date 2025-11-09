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
        console.log('AuthCallback: Search params:', window.location.search);
        console.log('AuthCallback: Hash:', window.location.hash);
        
        // Get the URL parameters from either search or hash
        let urlParams = new URLSearchParams(window.location.search);
        
        // If no params in search, try hash (sometimes OAuth redirects use hash)
        if (!urlParams.has('userId') && window.location.hash) {
          const hashParams = window.location.hash.substring(1); // Remove #
          urlParams = new URLSearchParams(hashParams);
        }
        
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');
        
        console.log('AuthCallback: userId:', userId);
        console.log('AuthCallback: secret exists:', !!secret);
        
        if (userId && secret) {
          // Complete the OAuth2 login by creating a session with the secret
          console.log('AuthCallback: Creating session with OAuth2 token...');
          await account.createSession(userId, secret);
          console.log('AuthCallback: Session created successfully!');
        } else {
          console.log('AuthCallback: No OAuth params found, checking existing session...');
        }
        
        // Wait a bit for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the session was created
        console.log('AuthCallback: Verifying user session...');
        const user = await account.get();
        
        if (user) {
          console.log('AuthCallback: User authenticated successfully!', user.email);
          navigate('/', { replace: true });
        } else {
          console.log('AuthCallback: No user found, redirecting to login');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('AuthCallback: Authentication error:', error);
        navigate('/login', { replace: true });
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

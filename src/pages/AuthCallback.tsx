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
        
        // IMPORTANT: Give more time for OAuth redirect to complete and cookies to be set
        console.log('AuthCallback: Waiting for OAuth session to be established...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased to 2 seconds
        
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
          } catch (error) {
            console.log(`AuthCallback: Attempt ${attempts} failed:`, error.message);
            
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
          console.error('AuthCallback: This is a cross-domain cookie issue.');
          console.error('AuthCallback: Please ensure you have:');
          console.error('  1. Added time-master-new.appwrite.network as a Platform in Appwrite Console');
          console.error('  2. Updated OAuth redirect URIs in Google/GitHub settings');
          console.error('  3. Cleared browser cookies and cache');
          
          navigate('/login', { 
            replace: true,
            state: { 
              error: 'Unable to complete authentication. Please ensure cookies are enabled and try again.' 
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

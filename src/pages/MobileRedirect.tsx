import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock } from 'lucide-react';

const MobileRedirect = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const success = searchParams.get('success');
    
    console.log('MobileRedirect: Redirecting to app with success =', success);
    
    // Immediately redirect to the app via deep link
    const deepLink = success === 'true' 
      ? 'timemaster://auth/success'
      : 'timemaster://auth/failure';
    
    console.log('MobileRedirect: Deep link =', deepLink);
    
    // Try to redirect
    window.location.href = deepLink;
    
    // Fallback: If deep link doesn't work after 2 seconds, show message
    setTimeout(() => {
      console.log('MobileRedirect: Deep link redirect may have failed, showing fallback message');
    }, 2000);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Clock className="w-10 h-10 text-primary-foreground animate-spin" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          Redirecting to App...
        </h2>
        
        <p className="text-muted-foreground mb-6">
          You will be redirected to TimeMaster app automatically.
        </p>

        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
          <p className="mb-2">If the app doesn't open automatically:</p>
          <ol className="text-left space-y-1">
            <li>1. Close this browser</li>
            <li>2. Open TimeMaster app manually</li>
            <li>3. You should be logged in</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MobileRedirect;

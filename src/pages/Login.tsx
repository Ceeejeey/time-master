import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Github, Mail, Zap, Target, TrendingUp, AlertCircle } from 'lucide-react';

const Login = () => {
  const { user, loading, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error from AuthCallback
    if (location.state?.error) {
      setError(location.state.error as string);
    }
    
    // If user is already logged in, redirect to home
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Clock className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              TimeMaster
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Master your time, master your life ⚡
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-medium">Productive</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-medium">Focused</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-medium">Efficient</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Welcome! 👋</CardTitle>
            <CardDescription className="text-base">
              Sign in to start tracking your productivity journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Google Login */}
            <Button
              onClick={() => {
                setError(null);
                loginWithGoogle();
              }}
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-semibold gap-3 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-red-500/10 hover:border-blue-500/50 transition-all group"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium">
                  Or
                </span>
              </div>
            </div>

            {/* GitHub Login */}
            <Button
              onClick={() => {
                setError(null);
                loginWithGithub();
              }}
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-semibold gap-3 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:border-purple-500/50 transition-all group"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              Continue with GitHub
            </Button>

            {/* Privacy Notice */}
            <p className="text-xs text-center text-muted-foreground pt-4">
              By continuing, you agree to our secure authentication.
              <br />
              Your data is encrypted and private. 🔒
            </p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="text-center space-y-3 pt-4">
          <p className="text-sm font-medium text-muted-foreground">
            Why TimeMaster?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              ⏱ Time Blocking
            </span>
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              📊 Analytics
            </span>
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              🎯 Eisenhower Matrix
            </span>
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              📱 PWA Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

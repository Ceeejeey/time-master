import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { saveUser } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { User2, ArrowRight } from 'lucide-react';

export const OnboardingScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const { refreshUser } = useAuth();

  // Update submit button state when username changes
  useEffect(() => {
    const trimmedName = username.trim();
    setCanSubmit(trimmedName.length > 0);
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
    try {
      console.log('[Onboarding] Saving user:', trimmedName);
      await saveUser({
        id: '1',
        name: trimmedName,
        email: '',
        isPremium: false
      });
      
      console.log('[Onboarding] User saved, refreshing auth state...');
      // Refresh auth state to trigger navigation to home
      await refreshUser();
      console.log('[Onboarding] Auth state refreshed');
    } catch (error) {
      console.error('[Onboarding] Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 safe-top safe-bottom">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to TimeMaster</CardTitle>
          <CardDescription>
            Let's get started by setting up your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium block">
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
                className="text-lg h-12"
                maxLength={50}
              />
              {username.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {username.trim().length} characters
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12" 
              size="lg"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </span>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

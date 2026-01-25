import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Clock, Download, Upload, GraduationCap, BookOpen, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUser, saveUser, getTimeblocks, saveTimeblock } from '@/lib/storage';
import { User, Timeblock } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useTutorial } from '@/contexts/TutorialContext';
import { signOutFromGoogle } from '@/lib/google-auth';
import { Capacitor } from '@capacitor/core';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [timeblocks, setTimeblocks] = useState<Timeblock[]>([]);
  const [newBlockDuration, setNewBlockDuration] = useState(25);
  const { resetTutorial, startTutorial } = useTutorial();
  const isGoogleUser = localStorage.getItem('timemaster_google_user') === 'true';
  const googleProfilePic = localStorage.getItem('timemaster_google_profile_pic') || '';

  useEffect(() => {
    const loadData = async () => {
      const [userData, blocksData] = await Promise.all([
        getUser(),
        getTimeblocks(),
      ]);
      setUser(userData);
      setTimeblocks(blocksData);
    };
    loadData();
  }, []);

  const handleAddTimeblock = async () => {
    const newBlock: Timeblock = {
      id: `tb-${Date.now()}`,
      durationMinutes: newBlockDuration,
      label: `${newBlockDuration} min`,
    };
    await saveTimeblock(newBlock);
    setTimeblocks([...timeblocks, newBlock]);
    toast({ title: 'Timeblock added' });
    setNewBlockDuration(25);
  };

  const handleSignOut = async () => {
    try {
      // Sign out from Google if on native platform
      if (Capacitor.isNativePlatform() && isGoogleUser) {
        await signOutFromGoogle();
      }
      
      // Clear local storage
      localStorage.removeItem('timemaster_has_user');
      localStorage.removeItem('timemaster_google_user');
      localStorage.removeItem('timemaster_google_profile_pic');
      localStorage.removeItem('timemaster_google_id');
      
      toast({ title: 'Signed out successfully' });
      
      // Reload to go back to onboarding
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({ title: 'Error signing out', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-4 pb-24 safe-top safe-bottom">
      <div className="w-full max-w-lg mx-auto space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your TimeMaster experience</p>
        </div>

        {/* User Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {isGoogleUser && googleProfilePic ? (
                <img 
                  src={googleProfilePic} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <SettingsIcon className="w-5 h-5" />
              )}
              User Profile
            </CardTitle>
            <CardDescription className="text-xs">Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <Label className="text-sm">Name</Label>
              <Input
                value={user?.name || ''}
                onChange={e => {
                  if (user) {
                    const updated = { ...user, name: e.target.value };
                    setUser(updated);
                    saveUser(updated);
                  }
                }}
                placeholder="Your name"
                className="h-10"
                disabled={isGoogleUser}
              />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input
                value={user?.email || ''}
                onChange={e => {
                  if (user) {
                    const updated = { ...user, email: e.target.value };
                    setUser(updated);
                    saveUser(updated);
                  }
                }}
                placeholder="your@email.com"
                type="email"
                className="h-10"
                disabled={isGoogleUser}
              />
              {isGoogleUser && (
                <p className="text-xs text-muted-foreground mt-1">
                  Signed in with Google
                </p>
              )}
            </div>
            
            {/* Sign Out Button */}
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full mt-2 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Timeblock Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5" />
              Timeblock Presets
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your timeblock durations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-3 gap-2">
              {timeblocks.map(block => (
                <div
                  key={block.id}
                  className="p-2 rounded-lg border text-center bg-muted/50"
                >
                  <Clock className="w-3 h-3 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-sm">{block.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-end pt-2">
              <div className="flex-1">
                <Label className="text-sm">Add Custom (minutes)</Label>
                <Input
                  type="number"
                  value={newBlockDuration}
                  onChange={e => setNewBlockDuration(parseInt(e.target.value))}
                  min={5}
                  max={180}
                  className="h-10"
                />
              </div>
              <Button onClick={handleAddTimeblock} size="sm" className="h-10 px-4">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Management</CardTitle>
            <CardDescription className="text-xs">Backup and restore your data</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 pt-0">
            <Button variant="outline" className="gap-2 flex-1 h-10 text-sm">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2 flex-1 h-10 text-sm">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </CardContent>
        </Card>

        {/* Tutorial Management */}
        <Card className="border-2 border-secondary/30 dark:border-secondary/50 bg-gradient-to-br from-secondary/5 dark:from-secondary/10 to-primary/5 dark:to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-secondary" />
              Interactive Tutorial
            </CardTitle>
            <CardDescription className="text-xs">
              Learn how to use TimeMaster
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-muted-foreground">
              The tutorial guides you through creating workplans, adding tasks, setting daily goals, and tracking time.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  startTutorial();
                  toast({ title: 'Tutorial started!', description: 'Follow the interactive guide.' });
                }}
                className="gap-2 flex-1 h-10 text-sm"
                size="sm"
              >
                <GraduationCap className="w-4 h-4" />
                Start Tutorial
              </Button>
              <Button
                variant="outline"
                className="gap-2 flex-1 h-10 text-sm"
                size="sm"
                onClick={() => navigate('/tutorial-docs')}
              >
                <BookOpen className="w-4 h-4" />
                Read Guide
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await resetTutorial();
                toast({ title: 'Tutorial reset', description: 'You can start the tutorial again anytime.' });
              }}
              className="w-full text-xs text-muted-foreground hover:text-destructive h-8"
            >
              Reset Progress
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="py-4 text-center text-xs text-muted-foreground">
            <p className="font-medium">TimeMaster v1.0</p>
            <p className="mt-1">Built with React + TypeScript</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

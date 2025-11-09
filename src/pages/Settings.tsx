import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, Palette, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getUser, saveUser, getTimeblocks, saveTimeblock } from '@/lib/storage';
import { User, Timeblock } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [timeblocks, setTimeblocks] = useState<Timeblock[]>([]);
  const [newBlockDuration, setNewBlockDuration] = useState(25);

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

  const handleTogglePremium = async () => {
    if (!user) return;
    const updated = { ...user, isPremium: !user.isPremium };
    await saveUser(updated);
    setUser(updated);
    toast({
      title: updated.isPremium ? 'Premium activated!' : 'Premium deactivated',
      description: updated.isPremium
        ? 'You now have access to all premium features'
        : 'Premium features are now locked',
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your TimeMaster experience</p>
        </div>

        {/* User Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              User Profile
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
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
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeblock Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeblock Presets
            </CardTitle>
            <CardDescription>
              {user?.isPremium
                ? 'Add custom timeblock durations'
                : 'Upgrade to Premium to add custom timeblocks'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {timeblocks.map(block => (
                <div
                  key={block.id}
                  className="p-3 rounded-lg border text-center bg-muted/50"
                >
                  <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="font-medium">{block.label}</p>
                </div>
              ))}
            </div>

            {user?.isPremium && (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>New Timeblock Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newBlockDuration}
                    onChange={e => setNewBlockDuration(parseInt(e.target.value))}
                    min={5}
                    max={180}
                  />
                </div>
                <Button onClick={handleAddTimeblock}>Add Timeblock</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Premium Features
            </CardTitle>
            <CardDescription>
              Unlock advanced features and customization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Premium Status</p>
                <p className="text-sm text-muted-foreground">
                  {user?.isPremium ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Switch
                checked={user?.isPremium || false}
                onCheckedChange={handleTogglePremium}
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <p className="font-medium">Premium Benefits:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Custom timeblock durations</li>
                <li>✓ Advanced reports and analytics</li>
                <li>✓ Export data to CSV/PDF</li>
                <li>✓ Cloud sync across devices</li>
                <li>✓ Premium themes and animations</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Backup and restore your data</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Import Data
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            <p>TimeMaster v1.0</p>
            <p className="mt-1">Built with React + TypeScript</p>
            <p className="mt-1">Installable Progressive Web App</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

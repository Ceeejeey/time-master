import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveWorkplan, getCurrentUserId } from '@/lib/storage';
import { WorkplanScope, Workplan } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const WorkplanForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'create';

  const [form, setForm] = useState({
    title: '',
    scope: 'day' as WorkplanScope,
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast({ title: 'Please enter a workplan title', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const userId = getCurrentUserId();
      const newWorkplan: Workplan = {
        id: `workplan-${Date.now()}`,
        userId,
        title: form.title,
        scope: form.scope,
        startDate: form.startDate,
        endDate: form.startDate,
        tasks: [],
      };

      await saveWorkplan(newWorkplan);
      toast({ title: 'Workplan created successfully' });
      
      // Small delay for smoother transition
      await new Promise(resolve => setTimeout(resolve, 150));
      navigate('/workplan', { replace: true });
    } catch (error) {
      console.error('[WorkplanForm] Error saving workplan:', error);
      toast({ title: 'Failed to save workplan', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {mode === 'edit' ? 'Edit Workplan' : 'Create Workplan'}
            </h1>
            <p className="text-sm text-muted-foreground">Plan your day, week, or month</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 sm:px-6 pt-8 pb-4 sm:pb-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Monday Sprint, Weekly Goals"
              className="h-12 text-base"
              autoFocus
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Give your workplan a descriptive name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope" className="text-base font-semibold">
              Scope
            </Label>
            <Select
              value={form.scope}
              onValueChange={(value: WorkplanScope) =>
                setForm({ ...form, scope: value })
              }
            >
              <SelectTrigger id="scope" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day - Daily planning</SelectItem>
                <SelectItem value="week">Week - 7-day plan</SelectItem>
                <SelectItem value="month">Month - Monthly goals</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the time period for this workplan
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-base font-semibold">
              Start Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="h-12 text-base pl-11"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When does this workplan begin?
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Preview</p>
            <div className="space-y-1">
              <p className="font-medium text-lg">
                {form.title || 'Untitled Workplan'}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {form.scope} plan starting {format(new Date(form.startDate), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="flex-1 h-12 touch-manipulation"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-12 gap-2 touch-manipulation"
              disabled={isSaving || !form.title.trim()}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Workplan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkplanForm;

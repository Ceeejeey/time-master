import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TUTORIAL_STEPS } from '@/lib/tutorial-steps';
import { ScrollArea } from '@/components/ui/scroll-area';

const TutorialDocs = () => {
  const navigate = useNavigate();

  // Filter out the "Welcome" and "Success" steps for the main list, or keep them if useful.
  // We'll keep them but style the Welcome/Success distinctively.
  const steps = TUTORIAL_STEPS;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">Tutorial Guide</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-3xl space-y-8 pb-20">
          
          {/* Intro Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle>Mastering TimeMaster</CardTitle>
              <CardDescription>
                A complete step-by-step guide to all features and workflows in the app.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Timeline of Steps */}
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {steps.map((step, index) => {
               // Skip body steps if they are just greeting/success messages and not instructional? 
               // Actually user wants "describe every step".
               const isWelcome = step.title === 'Welcome';
               const isSuccess = step.title === 'Success';
               
               return (
                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Icon / Bullet */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/30 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {isWelcome || isSuccess ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                        <span className="font-mono text-sm font-bold text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                       {isWelcome && <BookOpen className="w-4 h-4 text-primary" />}
                       <h3 className="font-bold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.content}
                    </p>
                    {step.data?.action && (
                      <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                         Action: {step.data.action.replace(/-/g, ' ')}
                      </div>
                    )}
                  </div>
                </div>
               );
            })}
          </div>

          <div className="flex justify-center pt-8">
             <Button onClick={() => navigate(-1)} variant="outline" size="lg">
                Back to Settings
             </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TutorialDocs;

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Home, Trophy } from 'lucide-react';

// Success animation JSON (embedded)
const successAnimation = {
  "v": "5.7.4",
  "fr": 60,
  "ip": 0,
  "op": 120,
  "w": 500,
  "h": 500,
  "nm": "Success",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Checkmark",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [250, 250, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": {
          "a": 1,
          "k": [
            { "t": 0, "s": [0, 0, 100], "e": [120, 120, 100] },
            { "t": 30, "s": [120, 120, 100], "e": [100, 100, 100] },
            { "t": 40, "s": [100, 100, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ind": 0,
              "ty": "sh",
              "ks": {
                "a": 0,
                "k": {
                  "i": [[0, 0], [0, 0], [0, 0]],
                  "o": [[0, 0], [0, 0], [0, 0]],
                  "v": [[-50, 0], [-10, 40], [60, -40]],
                  "c": false
                }
              }
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0.2, 0.8, 0.4, 1] },
              "o": { "a": 0, "k": 100 },
              "w": { "a": 0, "k": 20 },
              "lc": 2,
              "lj": 2
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 120,
      "st": 0
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Circle",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [250, 250, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": {
          "a": 1,
          "k": [
            { "t": 0, "s": [0, 0, 100], "e": [110, 110, 100] },
            { "t": 25, "s": [110, 110, 100], "e": [100, 100, 100] },
            { "t": 35, "s": [100, 100, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "d": 1,
              "ty": "el",
              "s": { "a": 0, "k": [180, 180] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0.2, 0.8, 0.4, 1] },
              "o": { "a": 0, "k": 100 },
              "w": { "a": 0, "k": 15 },
              "lc": 2,
              "lj": 1
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 120,
      "st": 0
    }
  ],
  "markers": []
};

export const TutorialSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Confetti effect
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10001 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Create confetti particles (simple version without external library)
      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        particle.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          top: ${randomInRange(0, 100)}%;
          left: ${randomInRange(0, 100)}%;
          opacity: 0;
          z-index: 10001;
          border-radius: 50%;
          animation: confetti-fall ${randomInRange(2, 4)}s linear;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 4000);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(-100vh) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 z-[10000] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-2 border-primary/50 animate-in zoom-in duration-500">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <Lottie 
                animationData={successAnimation} 
                loop={false}
                style={{ width: 200, height: 200 }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-8 h-8 text-primary animate-bounce" />
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Congratulations!
              </CardTitle>
              <Trophy className="w-8 h-8 text-primary animate-bounce" />
            </div>
            <CardDescription className="text-lg">
              You have completed the tutorial!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-6 border-2 border-primary/30 dark:border-primary/50">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">You have learned how to:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      Create workplans and organize tasks
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      Use the Eisenhower Matrix for prioritization
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      Plan your daily goals and tasks
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      Track productive and wasted time
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      Analyze your productivity with reports
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-4">
                You are now ready to master your time and boost your productivity!
              </p>
            </div>

            <Button 
              className="w-full gap-2 h-12 text-lg" 
              size="lg"
              onClick={handleContinue}
            >
              <Home className="w-5 h-5" />
              Start Using TimeMaster
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

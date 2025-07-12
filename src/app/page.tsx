
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { ArrowRight, TrendingUp, TrendingDown, Hourglass, History, Sparkles, PenTool, Wind } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const modes = [
  {
    name: 'Normal',
    description: 'A consistent timer for each image. Ideal for standard sessions.',
    href: '/practice?mode=normal',
    icon: <Hourglass className="size-8 text-primary" />,
  },
  {
    name: 'Precision',
    description: 'Timer gradually increases. Challenges you to capture gestures quickly, then refine.',
    href: '/practice?mode=precision',
    icon: <TrendingUp className="size-8 text-primary" />,
  },
  {
    name: 'Speed',
    description: 'Timer gradually decreases. Pushes you to work faster as the session progresses.',
    href: '/practice?mode=speed',
    icon: <TrendingDown className="size-8 text-primary" />,
  },
    {
    name: 'Zen Mode',
    description: 'A timer-free session with your own images. Perfect for relaxed sketching.',
    href: '/practice/zen',
    icon: <Wind className="size-8 text-primary" />,
    cta: 'Enter Zen Mode'
  }
];

const aiModes = [
  {
    name: 'AI Shape Generator',
    description: 'Generate geometric shapes from any angle for fundamental practice.',
    href: '/practice/shapes',
    icon: <Sparkles className="size-8 text-primary" />,
    cta: 'Start Generating'
  },
  {
    name: 'AI Pose Generator',
    description: 'A timed session where you generate poses and characters from a prompt.',
    href: '/practice/poses',
    icon: <PenTool className="size-8 text-accent" />,
    cta: 'Enter Generator',
    accent: true
  }
];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 opacity-20 text-accent animate-float">
        <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-50 400C-50 151.472 151.472 -50 400 -50C648.528 -50 850 151.472 850 400C850 648.528 648.528 850 400 850" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
       <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 opacity-20 text-primary animate-float-reverse">
        <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M850 400C850 648.528 648.528 850 400 850C151.472 850 -50 648.528 -50 400C-50 151.472 151.472 -50 400 -50" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center justify-center min-h-dvh p-4 relative z-0">
        <header className="mb-12 text-center">
          <div className="inline-block">
          <LineFlowLogo className="text-3xl" />
          </div>
          <p className="mt-2 text-lg text-muted-foreground">A focused gesture drawing practice app for artists.</p>
        </header>
        
        <main className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Choose Your Practice Mode</h2>
            <Button asChild variant="outline">
              <Link href="/history">
                <History className="mr-2" />
                Session History
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {modes.map((mode) => (
                <Card key={mode.name} className="group flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-background/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        {mode.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{mode.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                     <CardDescription className="mb-4 max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-300 ease-in-out">{mode.description}</CardDescription>
                    <Button asChild className="mt-auto w-full group">
                      <Link href={mode.href}>
                        {mode.cta || 'Select Mode'} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6">
              {aiModes.map((mode) => (
                <Card key={mode.name} className={`group flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-background/50 backdrop-blur-sm ${mode.accent ? 'border-accent/20' : ''}`}>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                    <div className={`p-3 rounded-full ${mode.accent ? 'bg-accent/10' : 'bg-primary/10'}`}>
                        {mode.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className={mode.accent ? 'text-accent' : ''}>{mode.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <CardDescription className={`mb-4 max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-300 ease-in-out ${mode.accent ? 'text-accent-foreground/80' : ''}`}>{mode.description}</CardDescription>
                    <Button asChild className={`mt-auto w-full group ${mode.accent ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}>
                      <Link href={mode.href}>
                        {mode.cta} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>

        <footer className="mt-16 text-center text-muted-foreground text-sm">
          <p>Load your own images or generate them with AI and start drawing!</p>
        </footer>
      </div>
    </div>
  );
}

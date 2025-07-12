
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { ArrowRight, TrendingUp, TrendingDown, Hourglass } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const modes = [
  {
    name: 'Normal',
    description: 'Practice with a consistent timer for each image. Ideal for standard sessions.',
    href: '/practice?mode=normal',
    icon: <Hourglass className="size-8 text-primary" />,
  },
  {
    name: 'Precision',
    description: 'Start with a short timer that gradually increases. Challenges you to capture gestures quickly, then refine.',
    href: '/practice?mode=precision',
    icon: <TrendingUp className="size-8 text-primary" />,
  },
  {
    name: 'Speed',
    description: 'Start with a long timer that gradually decreases. Pushes you to work faster as the session progresses.',
    href: '/practice?mode=speed',
    icon: <TrendingDown className="size-8 text-primary" />,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 opacity-20 text-accent">
        <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-50 400C-50 151.472 151.472 -50 400 -50C648.528 -50 850 151.472 850 400C850 648.528 648.528 850 400 850" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
       <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 opacity-20 text-primary">
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
        
        <main className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Choose Your Practice Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modes.map((mode) => (
              <Card key={mode.name} className="flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-background/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                      {mode.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle>{mode.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <CardDescription>{mode.description}</CardDescription>
                  <Button asChild className="mt-6 w-full group">
                    <Link href={mode.href}>
                      Select Mode <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <footer className="mt-16 text-center text-muted-foreground text-sm">
          <p>Load your own images and start drawing!</p>
        </footer>
      </div>
    </div>
  );
}

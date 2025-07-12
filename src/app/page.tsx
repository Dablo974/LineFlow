
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { ArrowRight, TrendingUp, TrendingDown, Hourglass } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background text-foreground p-4">
      <header className="mb-8 text-center">
        <div className="inline-block">
         <LineFlowLogo className="text-3xl" />
        </div>
        <p className="mt-2 text-lg text-muted-foreground">A focused gesture drawing practice app for artists.</p>
      </header>
      
      <main className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-6">Choose Your Practice Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode) => (
            <Card key={mode.name} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    {mode.icon}
                </div>
                <div className="flex-1">
                  <CardTitle>{mode.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <CardDescription>{mode.description}</CardDescription>
                <Button asChild className="mt-6 w-full">
                  <Link href={mode.href}>
                    Select Mode <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>Load your own images and start drawing!</p>
      </footer>
    </div>
  );
}

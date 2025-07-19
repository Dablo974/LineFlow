
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { SessionRecord } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Clock, History, ImageIcon, Timer, Sparkles, Folder, Target } from 'lucide-react';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { ThemeToggle } from '@/components/theme-toggle';


const getModeName = (mode: SessionRecord['mode']) => {
    switch(mode) {
        case 'precision': return 'Precision';
        case 'speed': return 'Speed';
        case 'shapes': return 'AI Shapes';
        case 'poses': return 'AI Poses';
        case 'anatomy': return 'Anatomy Challenge';
        case 'zen': return 'Zen Mode';
        default: return 'Normal';
    }
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0 && remainingSeconds > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${remainingSeconds}s`;
};

export default function HistoryPage() {
  const [history, setHistory] = useLocalStorage<SessionRecord[]>('lineflow-history', []);

  const clearHistory = () => {
    setHistory([]);
  };
  
  const getIconForSet = (set: SessionRecord['imageSet']) => {
    switch(set){
      case 'ai':
        return <Sparkles className="size-5 text-primary/80" />
      case 'custom':
      default:
        return <Folder className="size-5 text-primary/80" />
    }
  }

  return (
    <div className="min-h-dvh bg-muted/40">
       <header className="bg-background border-b p-4 flex justify-between items-center">
        <LineFlowLogo />
         <div className='flex items-center gap-2'>
            <ThemeToggle />
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2" />
                    Back to Menu
                </Link>
            </Button>
         </div>
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="size-8 text-primary" />
            Session History
          </h1>
          {history.length > 0 && (
            <Button variant="destructive" onClick={clearHistory}>
              Clear History
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <h2 className="text-2xl font-semibold">No Sessions Yet</h2>
              <p className="text-muted-foreground mt-2">Complete a practice session to see your history here.</p>
              <Button asChild className="mt-6">
                <Link href="/">Start a New Session</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100dvh-200px)]">
            <div className="space-y-4 pr-4">
              {history.map((session) => (
                <Card key={session.id} className="animate-in fade-in-50">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{getModeName(session.mode)} Practice</span>
                       <span className="text-sm font-normal text-muted-foreground">
                        {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2" title="Total Duration">
                            <Clock className="size-5 text-primary/80" />
                            <span>{formatDuration(session.totalDuration)}</span>
                        </div>
                        <div className="flex items-center gap-2" title="Images Completed">
                           <ImageIcon className="size-5 text-primary/80" />
                           <span>{session.imagesCompleted} images</span>
                        </div>
                         <div className="flex items-center gap-2" title="Image Set">
                           {getIconForSet(session.imageSet)}
                           <span className="capitalize">{session.imageSet} Set</span>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}

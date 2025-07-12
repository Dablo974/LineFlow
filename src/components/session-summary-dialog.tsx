
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, History, Home, ImageIcon } from 'lucide-react';
import type { SessionRecord } from '@/lib/types';

interface SessionSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionRecord | null;
}

const getModeName = (mode: SessionRecord['mode']) => {
    switch(mode) {
        case 'precision': return 'Precision';
        case 'speed': return 'Speed';
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


export function SessionSummaryDialog({ isOpen, onClose, session }: SessionSummaryDialogProps) {
  const router = useRouter();

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="size-7 text-green-500" />
            Session Complete!
          </DialogTitle>
          <DialogDescription>
            Great work! Here is a summary of your practice session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-lg">
                        <span className="font-medium text-foreground">Mode</span>
                        <span>{getModeName(session.mode)}</span>
                    </div>
                     <div className="flex justify-between items-center text-lg">
                        <span className="font-medium text-foreground flex items-center gap-2"><Clock className="size-5 text-primary" /> Duration</span>
                        <span>{formatDuration(session.totalDuration)}</span>
                    </div>
                     <div className="flex justify-between items-center text-lg">
                        <span className="font-medium text-foreground flex items-center gap-2"><ImageIcon className="size-5 text-primary" /> Images</span>
                        <span>{session.imagesCompleted}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => router.push('/history')}>
                <History className="mr-2" /> View History
            </Button>
            <Button onClick={onClose}>
                <Home className="mr-2" /> New Session
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

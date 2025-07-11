
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { FolderOpen, Images, Pause, Play, Trash2, X, Timer, Hourglass, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type SessionState = 'idle' | 'running' | 'paused';
type DisplayState = 'image' | 'interval';

export default function LineFlowPage() {
  const [images, setImages] = useState<string[]>([]);
  const [duration, setDuration] = useState(30);
  const [intervalDuration, setIntervalDuration] = useState(5);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [displayState, setDisplayState] = useState<DisplayState>('image');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    setDisplayState('image');
    setTimeRemaining(duration);
  }, [images.length, duration]);

  useEffect(() => {
    if (sessionState === 'running' && images.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (displayState === 'image') {
              if (intervalDuration > 0) {
                // Start interval
                setDisplayState('interval');
                return intervalDuration;
              } else {
                // No interval, go to next image
                nextImage();
                return duration; // This value will be used for the next tick, but immediately replaced
              }
            } else { // displayState === 'interval'
              // Interval finished, go to next image
              nextImage();
              return duration; // This value will be used for the next tick, but immediately replaced
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, images.length, duration, nextImage, displayState, intervalDuration]);
  

  useEffect(() => {
    // Revoke object URLs on component unmount to prevent memory leaks
    return () => {
      images.forEach(image => {
        if (image.startsWith('blob:')) {
          URL.revokeObjectURL(image);
        }
      });
    };
  }, [images]);

  const handleSessionToggle = () => {
    if (images.length === 0) {
      toast({ title: 'No images loaded', description: 'Please load images before starting.', variant: 'destructive' });
      return;
    }
    if (sessionState === 'running') {
      setSessionState('paused');
    } else {
      setSessionState('running');
      if (sessionState === 'idle') {
        setTimeRemaining(duration);
        setCurrentImageIndex(0);
        setDisplayState('image');
      }
    }
  };

  const handleReset = () => {
    setSessionState('idle');
    setDisplayState('image');
    setTimeRemaining(duration);
    setCurrentImageIndex(0);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setTimeRemaining(duration);
    setDisplayState('image');
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeRemaining(duration);
    setDisplayState('image');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...imageUrls]);
      toast({ title: `${files.length} image(s) loaded successfully.` });
    }
  };

  const removeImage = (indexToRemove: number) => {
    const imageToRemove = images[indexToRemove];
    if (imageToRemove?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };
  
  const clearImages = () => {
    images.forEach(image => {
      if (image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
    });
    setImages([]);
    handleReset();
  };
  
  const progressValue = displayState === 'image' 
    ? (timeRemaining / duration) * 100 
    : (timeRemaining / intervalDuration) * 100;

  return (
    <div className="flex h-dvh bg-background text-foreground font-body">
      <aside className="w-[380px] flex-shrink-0 border-r bg-card flex flex-col">
        <header className="p-4 border-b flex items-center justify-between">
          <LineFlowLogo />
        </header>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Timer className="size-5" /> Session Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Image Duration: {duration}s</Label>
                  <Slider id="duration" value={[duration]} onValueChange={(val) => setDuration(val[0])} min={5} max={120} step={5} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Interval Duration: {intervalDuration}s</Label>
                  <Slider id="interval" value={[intervalDuration]} onValueChange={(val) => setIntervalDuration(val[0])} min={0} max={30} step={1} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Images className="size-5" /> Image Set</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                    <FolderOpen className="mr-2" /> Load from Device
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                  {images.length > 0 && 
                    <Button onClick={clearImages} variant="destructive" size="icon">
                      <Trash2 />
                    </Button>
                  }
                </div>
                
                {images.length > 0 && (
                  <ScrollArea className="h-40 w-full rounded-md border p-2">
                    <div className="space-y-2">
                      {images.map((imgSrc, index) => (
                        <div key={`${imgSrc}-${index}`} className="flex items-center gap-2 p-1 rounded-md animate-in fade-in">
                          <Image src={imgSrc} alt={`Reference ${index + 1}`} width={40} height={40} className="rounded object-cover aspect-square" />
                          <span className="text-sm truncate flex-1">{`Image ${index + 1}`}</span>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => removeImage(index)}><X className="size-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <footer className="p-4 border-t mt-auto">
          <div className="flex items-center gap-2">
            <Button onClick={handleSessionToggle} className="w-full" disabled={images.length === 0}>
              {sessionState === 'running' ? <Pause className="mr-2" /> : <Play className="mr-2" />}
              {sessionState === 'running' ? 'Pause' : (sessionState === 'paused' ? 'Resume' : 'Start')}
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={sessionState === 'idle'}>Reset</Button>
          </div>
        </footer>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative transition-all duration-300">
        <TooltipProvider>
          {(sessionState === 'running' || sessionState === 'paused') ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 max-w-md">
                  <Progress value={progressValue} className="h-2 transition-all" />
                  <div className="text-center text-xl font-mono font-semibold text-primary mt-2">{timeRemaining}s</div>
              </div>
              
              {/* Navigation Buttons */}
              {images.length > 1 && displayState === 'image' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handlePreviousImage} 
                        variant="ghost" 
                        size="icon" 
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-red-500/80 hover:text-white"
                      >
                        <ChevronLeft className="size-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Previous Image</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handleNextImage} 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-green-500/80 hover:text-white"
                      >
                        <ChevronRight className="size-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Next Image</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              {images.length > 0 && displayState === 'image' && (
                  <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-500">
                      <Image
                          src={images[currentImageIndex]}
                          alt={`Reference image ${currentImageIndex + 1}`}
                          fill
                          className="object-contain"
                          key={`${currentImageIndex}-${images[currentImageIndex]}`}
                          priority
                      />
                  </div>
              )}
              {displayState === 'interval' && sessionState === 'running' && (
                <div className="text-center text-muted-foreground max-w-sm animate-in fade-in">
                    <Hourglass className="mx-auto h-16 w-16 mb-4 text-primary" />
                    <h2 className="text-3xl font-bold text-foreground font-headline">Interval</h2>
                    <p className="mt-2 leading-relaxed">Prepare for the next image.</p>
                </div>
              )}
              {sessionState === 'paused' && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4 animate-in fade-in">
                      <Pause className="size-16 text-primary" />
                      <p className="text-2xl font-semibold text-foreground">Paused</p>
                  </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground max-w-sm">
              <Images className="mx-auto h-16 w-16 mb-4 text-primary" />
              <h2 className="text-3xl font-bold text-foreground font-headline">Welcome to LineFlow</h2>
              <p className="mt-2 leading-relaxed">Your personal space for gesture drawing practice. Load some images from your device to get started.</p>
            </div>
          )}
        </TooltipProvider>
      </main>
    </div>
  );
}

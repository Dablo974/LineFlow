'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { pinterestImageFetch } from '@/ai/flows/pinterest-image-fetch';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { FolderOpen, Images, Loader2, Pause, Play, Trash2, X, Timer, Wand2 } from 'lucide-react';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SessionState = 'idle' | 'running' | 'paused';

export default function LineFlowPage() {
  const [images, setImages] = useState<string[]>([]);
  const [duration, setDuration] = useState(30);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [pinterestQuery, setPinterestQuery] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (sessionState === 'running' && images.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            nextImage();
            return duration;
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
  }, [sessionState, images.length, duration, nextImage]);

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
      }
    }
  };

  const handleReset = () => {
    setSessionState('idle');
    setTimeRemaining(duration);
    setCurrentImageIndex(0);
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

  const handleFetchImage = async () => {
    setIsFetching(true);
    try {
      const result = await pinterestImageFetch({ subject: pinterestQuery || "placeholder" });
      if (result.imageUrl) {
        setImages(prev => [...prev, result.imageUrl]);
        toast({ title: 'Placeholder image added!' });
      } else {
        toast({ title: 'Could not generate an image', description: 'Please try again.', variant: 'destructive' });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'An error occurred', description: 'Failed to fetch placeholder image.', variant: 'destructive' });
    } finally {
      setIsFetching(false);
    }
  };

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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Images className="size-5" /> Image Sets</CardTitle>
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
                          <span className="text-sm truncate flex-1">{imgSrc.startsWith('blob:') ? `Image ${index + 1}` : 'Generated Image'}</span>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => removeImage(index)}><X className="size-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                 <Separator />
                
                <div>
                  <Label htmlFor="pinterest-query" className="flex items-center gap-2 mb-2"><Wand2 className="size-4"/>Generate Placeholder</Label>
                  <div className="flex gap-2">
                    <Button onClick={handleFetchImage} disabled={isFetching} className="w-full">
                      {isFetching ? <Loader2 className="animate-spin" /> : 'Generate'}
                    </Button>
                  </div>
                </div>

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
        {sessionState === 'running' || sessionState === 'paused' ? (
          <div className="w-full h-full flex items-center justify-center">
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 max-w-md">
                <Progress value={(timeRemaining / duration) * 100} className="h-2 transition-all" />
                <div className="text-center text-xl font-mono font-semibold text-primary mt-2">{timeRemaining}s</div>
            </div>
            {images.length > 0 && (
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
            <p className="mt-2 leading-relaxed">Your personal space for gesture drawing practice. Load some images from your device or fetch ideas from Pinterest to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}

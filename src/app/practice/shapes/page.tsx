
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Pause, Play, X, Timer, Hourglass, ChevronLeft, ChevronRight, Bell, Home, History, ArrowLeft, Wand2, LoaderCircle, Sparkles, Images, Trash2 } from 'lucide-react';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { SessionSummaryDialog } from '@/components/session-summary-dialog';
import type { SessionRecord } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import Link from 'next/link';
import { generateShape } from '@/ai/flows/generate-shape-flow';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';

type SessionState = 'idle' | 'generating' | 'running' | 'paused' | 'finished';
type DisplayState = 'image' | 'interval';

const GenerateShapeInputSchema = z.object({
  description: z.string().min(3, "Please enter a more descriptive prompt.").describe('A text description of the geometric shape to generate. e.g., "a cube", "two intersecting spheres"'),
});

type GenerateShapeInput = z.infer<typeof GenerateShapeInputSchema>;

const getModeName = () => 'AI Shapes';

export default function AIShapesPracticePage() {
  const router = useRouter();
  
  const [images, setImages] = useState<string[]>([]);
  const [duration, setDuration] = useState(60);
  const [imageCount, setImageCount] = useState(10);
  
  const [currentDuration, setCurrentDuration] = useState(60);
  const [intervalDuration, setIntervalDuration] = useState(5);
  const [audibleAlerts, setAudibleAlerts] = useState(false);

  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [displayState, setDisplayState] = useState<DisplayState>('image');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();
  const [sessionHistory, setSessionHistory] = useLocalStorage<SessionRecord[]>('lineflow-history', []);
  
  const startTimeRef = useRef<Date | null>(null);
  
  const form = useForm<z.infer<typeof GenerateShapeInputSchema>>({
    resolver: zodResolver(GenerateShapeInputSchema),
    defaultValues: {
      description: 'A sphere',
    },
  });

  const playBeep = useCallback(() => {
    if (!audibleAlerts) return;
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
        return;
      }
    }
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContextRef.current.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  }, [audibleAlerts]);

  const endSession = useCallback(() => {
    setSessionState('finished');
    if (timerRef.current) clearInterval(timerRef.current);
    
    const endTime = new Date();
    const totalDuration = startTimeRef.current ? Math.round((endTime.getTime() - startTimeRef.current.getTime()) / 1000) : 0;

    if (totalDuration > 0 || currentImageIndex > 0) {
      const sessionRecord: SessionRecord = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        mode: 'shapes',
        totalDuration,
        imagesCompleted: currentImageIndex + 1,
        imageSet: 'ai',
      };
      setSessionHistory([sessionRecord, ...sessionHistory]);
      setLastSession(sessionRecord);
    }
  }, [currentImageIndex, sessionHistory, setSessionHistory]);

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    
    const nextIndex = (currentImageIndex + 1);
    
    if (nextIndex >= images.length && sessionState === 'running') {
        endSession();
        return;
    }

    setCurrentImageIndex(nextIndex);
    setDisplayState('image');
    setTimeRemaining(duration);
  }, [images.length, currentImageIndex, duration, sessionState, endSession]);

  useEffect(() => {
    if (sessionState === 'running' && images.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          if (displayState === 'image' && audibleAlerts && (newTime === 3 || newTime === 2 || newTime === 1)) {
            playBeep();
          }

          if (newTime <= 0) {
            if (displayState === 'image') {
              if (currentImageIndex + 1 >= images.length) {
                endSession();
                return 0;
              }
              if (intervalDuration > 0) {
                setDisplayState('interval');
                return intervalDuration;
              } else {
                nextImage();
                return currentDuration; 
              }
            } else { // displayState === 'interval'
              nextImage();
              return currentDuration;
            }
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, images.length, currentImageIndex, currentDuration, nextImage, displayState, intervalDuration, audibleAlerts, playBeep, endSession]);
  
  useEffect(() => {
    setCurrentDuration(duration);
    setTimeRemaining(duration);
  }, [duration]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  const handleGenerateImages = async (values: GenerateShapeInput) => {
    setSessionState('generating');
    setImages([]);
    setGenerationProgress(0);
    
    try {
      const generatedImages = [];
      const imagePromises = Array.from({ length: imageCount }, (_, i) => async () => {
        const result = await generateShape(values);
        generatedImages.push(result.imageDataUri);
        setImages([...generatedImages]);
        setGenerationProgress(((i + 1) / imageCount) * 100);
      });

      for (const promise of imagePromises) {
        await promise();
      }
      
      setSessionState('idle');
      toast({ title: "Images generated!", description: "Press Start Session to begin." });
    } catch (error) {
        console.error("Image generation failed:", error);
        toast({
            title: "Generation Failed",
            description: "Could not generate images. Please try again.",
            variant: "destructive"
        });
        setSessionState('idle');
    }
  };

  const startSession = () => {
      setCurrentImageIndex(0);
      setCurrentDuration(duration);
      setTimeRemaining(duration);
      setDisplayState('image');
      setSessionState('running');
      startTimeRef.current = new Date();
  }

  const handleSessionToggle = () => {
    if (images.length === 0) {
      toast({ title: 'No images generated', description: 'Please generate images before starting.', variant: 'destructive' });
      return;
    }
    if (sessionState === 'running') {
      setSessionState('paused');
    } else if (sessionState === 'paused') {
      setSessionState('running');
    } else { // idle or finished
      startSession();
    }
  };

  const handleReset = () => {
     if (sessionState === 'running' || sessionState === 'paused') {
      endSession();
    } else {
      setSessionState('idle');
      setDisplayState('image');
      setTimeRemaining(duration);
      setCurrentImageIndex(0);
    }
  };
  
  const resetTimerAndDisplay = () => {
    if (sessionState === 'idle') return;
      setTimeRemaining(duration);
      setDisplayState('image');
       if (timerRef.current) clearInterval(timerRef.current);
      if (sessionState === 'running') {
          setSessionState('paused');
          setTimeout(() => setSessionState('running'), 10);
      }
  }

  const handlePreviousImage = () => {
    if (sessionState === 'idle') return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    resetTimerAndDisplay();
  };

  const handleNextImage = () => {
    if (sessionState === 'idle') return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    resetTimerAndDisplay();
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prevImages => {
      const updatedImages = prevImages.filter((_, index) => index !== indexToRemove);
      if (updatedImages.length === 0 && sessionState !== 'idle' && sessionState !== 'generating') {
        handleReset();
      } else if (currentImageIndex >= updatedImages.length && updatedImages.length > 0) {
        setCurrentImageIndex(updatedImages.length - 1);
      }
      return updatedImages;
    });
  };

  const clearImages = () => {
    setImages([]);
    if (sessionState !== 'idle' && sessionState !== 'generating') {
      handleReset();
    }
  }
  
  const progressValue = displayState === 'image' 
    ? (timeRemaining / currentDuration) * 100 
    : (timeRemaining / intervalDuration) * 100;

  const getProgressStyle = () => {
    if (displayState !== 'image') {
      return { background: 'hsl(var(--accent))' };
    }
    const primaryHue = 221;
    const endHue = 0; // HSL hue for red
    const percentage = timeRemaining / currentDuration;
    
    const hue = endHue + (primaryHue - endHue) * percentage;
    const saturation = 70 + 30 * (1 - percentage);
    const lightness = 50 + 10 * (1-percentage);
    const colorStart = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const colorEnd = `hsl(${hue}, ${saturation-20}%, ${lightness-20}%)`;

    return {
      background: `linear-gradient(to right, ${colorStart}, ${colorEnd})`,
    };
  };
  
  const currentImageSrc = images[currentImageIndex];
  const nextImageSrc = images[(currentImageIndex + 1)];
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`.trim();
    }
    return `${remainingSeconds}s`;
  }

  const handleCloseSummary = () => {
    setLastSession(null);
    setSessionState('idle');
    setDisplayState('image');
    setTimeRemaining(duration);
    setCurrentImageIndex(0);
    setImages([]); // Clear generated images for a new session
  };
  
  const isGenerating = sessionState === 'generating';

  return (
    <>
      <SessionSummaryDialog
        isOpen={sessionState === 'finished' && lastSession !== null}
        onClose={handleCloseSummary}
        session={lastSession}
      />
      <div className="flex h-dvh bg-background text-foreground">
        <aside className="w-[380px] flex-shrink-0 border-r bg-muted/20 flex flex-col">
          <header className="p-4 border-b flex items-center justify-between">
            <LineFlowLogo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 size-4" /> Change Mode
                </Link>
              </Button>
            </div>
          </header>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGenerateImages)} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="size-5 text-primary" /> AI Shape Generator</CardTitle>
                      <CardDescription>Describe a shape, and we'll generate reference images for you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shape Description</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., A pyramid" {...field} disabled={isGenerating} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="image-count">Number of Images: {imageCount}</Label>
                        <Slider id="image-count" value={[imageCount]} onValueChange={(val) => setImageCount(val[0])} min={1} max={20} step={1} disabled={isGenerating} />
                      </div>
                      <div className="relative">
                        <Button type="submit" className="w-full" disabled={isGenerating}>
                          {isGenerating ? <LoaderCircle className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                          {isGenerating ? `Generating ${Math.round(generationProgress)}%` : `Generate ${imageCount} Images`}
                        </Button>
                        {isGenerating && (
                          <Progress value={generationProgress} className="absolute bottom-[-4px] left-0 right-0 h-1 bg-primary/20" indicatorClassName="bg-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>

               {images.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg"><Images className="size-5 text-primary" /> Generated Set</CardTitle>
                    <Button onClick={clearImages} variant="destructive" size="sm">
                      <Trash2 className="mr-2" /> Clear
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40 w-full rounded-md border p-2">
                        <div className="space-y-2">
                          {images.map((imgSrc, index) => (
                            <div key={`${imgSrc.slice(-20)}-${index}`} className="flex items-center gap-2 p-1 rounded-md animate-in fade-in">
                              <Image src={imgSrc} alt={`Generated Reference ${index + 1}`} width={40} height={40} className="rounded object-cover aspect-square" />
                              <span className="text-sm truncate flex-1">{form.getValues('description')} #{index + 1}</span>
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => removeImage(index)}><X className="size-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Timer className="size-5 text-primary" /> Session Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Image Duration: {formatTime(duration)}</Label>
                      <Slider id="duration" value={[duration]} onValueChange={(val) => setDuration(val[0])} min={5} max={300} step={5} />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="interval">Interval Duration: {formatTime(intervalDuration)}</Label>
                    <Slider id="interval" value={[intervalDuration]} onValueChange={(val) => setIntervalDuration(val[0])} min={0} max={30} step={1} />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="audible-alerts" className="flex items-center gap-2">
                      <Bell className="size-4" />
                      Audible Alerts
                    </Label>
                    <Switch id="audible-alerts" checked={audibleAlerts} onCheckedChange={setAudibleAlerts} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <footer className="p-4 border-t mt-auto bg-muted/20">
            <div className="flex items-center gap-2">
              <Button onClick={handleSessionToggle} className="w-full" size="lg" disabled={images.length === 0 || isGenerating}>
                {sessionState === 'running' ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                {sessionState === 'running' ? 'Pause' : (sessionState === 'paused' ? 'Resume' : 'Start Session')}
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" disabled={(sessionState === 'idle' && images.length === 0) || isGenerating}>
                {sessionState === 'running' || sessionState === 'paused' ? 'End' : 'Reset'}
              </Button>
            </div>
          </footer>
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center p-8 relative transition-all duration-300">
          <TooltipProvider>
            {(sessionState === 'running' || sessionState === 'paused') ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 max-w-md flex items-center gap-4 z-20">
                    <div className="text-xl font-mono font-semibold text-foreground w-40 text-right">
                      {formatTime(timeRemaining)} / {displayState === 'image' ? formatTime(currentDuration) : formatTime(intervalDuration)}
                    </div>
                    <Progress value={progressValue} className="h-2.5 transition-all flex-1 bg-muted" indicatorStyle={getProgressStyle()} />
                </div>
                
                <div className="relative w-full h-full pt-16">
                  {images.length > 1 && displayState === 'image' && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={handlePreviousImage} 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
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
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
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

                  {currentImageSrc && displayState === 'image' && (
                      <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-500">
                          <Image
                              src={currentImageSrc}
                              alt={`Reference image`}
                              fill
                              className="object-contain"
                              key={currentImageSrc}
                              priority
                          />
                      </div>
                  )}
                  {displayState === 'interval' && sessionState === 'running' && (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      {nextImageSrc && (
                        <Image
                            src={nextImageSrc}
                            alt="Next reference image preview"
                            fill
                            className="object-contain blur-2xl opacity-30 scale-110"
                            key={nextImageSrc}
                        />
                      )}
                      <div className="text-center text-muted-foreground max-w-sm animate-in fade-in flex flex-col items-center justify-center h-full z-10 bg-background/50 backdrop-blur-sm p-8 rounded-lg">
                          <Hourglass className="mx-auto h-16 w-16 mb-4 text-primary" />
                          <h2 className="text-3xl font-bold text-foreground">Interval</h2>
                          <p className="mt-2 leading-relaxed">Prepare for the next image.</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {sessionState === 'paused' && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4 z-30 animate-in fade-in">
                        <Pause className="size-16 text-primary" />
                        <p className="text-2xl font-semibold text-foreground">Paused</p>
                    </div>
                )}
              </div>
            ) : (
                <div className="text-center text-muted-foreground max-w-sm flex flex-col items-center gap-4">
                    {sessionState === 'generating' ? (
                       <div className="w-full max-w-md space-y-4">
                            <h2 className="text-3xl font-bold text-foreground">Generating Images...</h2>
                            <Progress value={generationProgress} className="w-full h-2" />
                            <div className="grid grid-cols-5 gap-4">
                              {images.map((imgSrc, index) => (
                                <div key={index} className="aspect-square bg-muted rounded-md animate-in fade-in">
                                  <Image src={imgSrc} alt={`Generated ref ${index}`} width={100} height={100} className="rounded-md object-cover w-full h-full" />
                                </div>
                              ))}
                              {Array.from({length: imageCount - images.length}).map((_, index) => (
                                <div key={index} className="aspect-square bg-muted/50 rounded-md animate-pulse" />
                              ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <Sparkles className="mx-auto h-16 w-16 mb-4 text-primary" />
                            <h2 className="text-3xl font-bold text-foreground">AI Shape Practice</h2>
                            <p className="mt-2 leading-relaxed">Describe a shape, set your session preferences, and hit "Generate" to start.</p>
                        </>
                    )}
                </div>
            )}
          </TooltipProvider>
        </main>
      </div>
    </>
  );
}

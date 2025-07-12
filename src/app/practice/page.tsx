
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { FolderOpen, Images, Pause, Play, Trash2, X, Timer, Hourglass, ChevronLeft, ChevronRight, Bell, Shuffle, FileImage, Home, Info } from 'lucide-react';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

type SessionState = 'idle' | 'running' | 'paused';
type DisplayState = 'image' | 'interval';
type PracticeMode = 'normal' | 'precision' | 'speed';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
};

const getModeName = (mode: PracticeMode) => {
    switch(mode) {
        case 'precision': return 'Precision';
        case 'speed': return 'Speed';
        default: return 'Normal';
    }
}

const MIN_IMAGE_DURATION = 5; // seconds

export default function LineFlowPracticePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [mode, setMode] = useState<PracticeMode>('normal');
  const [images, setImages] = useState<string[]>([]);
  const [initialDuration, setInitialDuration] = useState(30);
  const [totalSessionDuration, setTotalSessionDuration] = useState(600); // 10 minutes in seconds
  
  const [currentDuration, setCurrentDuration] = useState(30);
  const [sessionDurations, setSessionDurations] = useState<number[]>([]);

  const [intervalDuration, setIntervalDuration] = useState(5);
  const [audibleAlerts, setAudibleAlerts] = useState(false);
  const [shuffleImages, setShuffleImages] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [displayState, setDisplayState] = useState<DisplayState>('image');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [sessionImageOrder, setSessionImageOrder] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();
  
  const [sessionImageCount, setSessionImageCount] = useState(images.length);

  useEffect(() => {
    const modeParam = searchParams.get('mode') as PracticeMode | null;
    if (modeParam && ['normal', 'precision', 'speed'].includes(modeParam)) {
      setMode(modeParam);
    } else {
      router.push('/');
    }
  }, [searchParams, router]);

  const calculateDurations = useCallback((numImages: number) => {
    if (mode === 'normal' || numImages === 0) {
      return [];
    }

    const averageDuration = Math.floor(totalSessionDuration / numImages);

    if (averageDuration < MIN_IMAGE_DURATION) {
      return Array(numImages).fill(MIN_IMAGE_DURATION);
    }
    
    // Create an arithmetic progression
    const step = Math.max(1, Math.floor( (averageDuration - MIN_IMAGE_DURATION) / (numImages -1) * 2));
    
    let durations: number[] = [];
    let firstTerm = averageDuration - Math.floor(((numImages - 1) * step) / 2);
    if(firstTerm < MIN_IMAGE_DURATION) {
        firstTerm = MIN_IMAGE_DURATION
    }
    
    for (let i = 0; i < numImages; i++) {
        durations.push(firstTerm + i * step);
    }

    // Adjust to match total duration
    const currentTotal = durations.reduce((a, b) => a + b, 0);
    const diff = totalSessionDuration - currentTotal;
    const adjustment = Math.floor(diff / numImages);
    const remainder = diff % numImages;

    durations = durations.map((d, i) => d + adjustment + (i < remainder ? 1 : 0));
    
    // Ensure no duration is below the minimum
    durations = durations.map(d => Math.max(MIN_IMAGE_DURATION, d));

    if (mode === 'speed') {
        return durations.reverse();
    }
    return durations;
  }, [mode, totalSessionDuration]);

  useEffect(() => {
    if (mode !== 'normal' && images.length > 0) {
      const maxImages = Math.floor(totalSessionDuration / MIN_IMAGE_DURATION);
      const numToUse = Math.min(images.length, maxImages);
      setSessionImageCount(numToUse);
      const calculated = calculateDurations(numToUse);
      setSessionDurations(calculated);
    } else {
      setSessionImageCount(images.length);
      setSessionDurations([]);
    }
  }, [mode, images.length, totalSessionDuration, calculateDurations]);


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

  const nextImage = useCallback(() => {
    if (sessionImageOrder.length === 0) return;
    
    const nextIndex = (currentImageIndex + 1) % sessionImageOrder.length;
    setCurrentImageIndex(nextIndex);
    setDisplayState('image');

    const nextDuration = mode === 'normal' ? initialDuration : sessionDurations[nextIndex] || MIN_IMAGE_DURATION;
    setCurrentDuration(nextDuration);
    setTimeRemaining(nextDuration);
  }, [sessionImageOrder.length, currentImageIndex, mode, initialDuration, sessionDurations]);

  useEffect(() => {
    if (sessionState === 'running' && sessionImageOrder.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          if (displayState === 'image' && audibleAlerts && (newTime === 3 || newTime === 2 || newTime === 1)) {
            playBeep();
          }

          if (newTime <= 0) {
            if (displayState === 'image') {
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
  }, [sessionState, sessionImageOrder.length, currentDuration, nextImage, displayState, intervalDuration, audibleAlerts, playBeep]);
  

  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.startsWith('blob:')) {
          URL.revokeObjectURL(image);
        }
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [images]);
  
  const startSession = () => {
      let imagePool = [...images];
      if (shuffleImages) {
        imagePool = shuffleArray(imagePool);
      }

      let imageOrder = imagePool;
      if(mode !== 'normal') {
        const maxImages = Math.floor(totalSessionDuration / MIN_IMAGE_DURATION);
        const numToUse = Math.min(images.length, maxImages);
        imageOrder = imagePool.slice(0, numToUse);
      }
      
      setSessionImageOrder(imageOrder);
      
      const firstDuration = mode === 'normal' ? initialDuration : (sessionDurations[0] || MIN_IMAGE_DURATION);
      
      setCurrentImageIndex(0);
      setCurrentDuration(firstDuration);
      setTimeRemaining(firstDuration);
      setDisplayState('image');
      setSessionState('running');
  }

  const handleSessionToggle = () => {
    if (images.length === 0) {
      toast({ title: 'No images loaded', description: 'Please load images before starting.', variant: 'destructive' });
      return;
    }
    if (sessionState === 'running') {
      setSessionState('paused');
    } else if (sessionState === 'paused') {
      setSessionState('running');
    } else { // idle
      startSession();
    }
  };

  const handleReset = () => {
    setSessionState('idle');
    setDisplayState('image');
    
    const firstDuration = mode === 'normal' ? initialDuration : (sessionDurations[0] || MIN_IMAGE_DURATION);
    setCurrentDuration(firstDuration);
    setTimeRemaining(firstDuration);

    setCurrentImageIndex(0);
    setSessionImageOrder([]);
  };
  
  const resetTimerAndDisplay = () => {
    if (sessionState === 'idle') return;
      const newDuration = mode === 'normal' ? initialDuration : (sessionDurations[currentImageIndex] || MIN_IMAGE_DURATION);
      setCurrentDuration(newDuration);
      setTimeRemaining(newDuration);
      setDisplayState('image');
       if (timerRef.current) clearInterval(timerRef.current);
      if (sessionState === 'running') {
          setSessionState('paused');
          setTimeout(() => setSessionState('running'), 10);
      }
  }

  const handlePreviousImage = () => {
    if (sessionState === 'idle') return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + sessionImageOrder.length) % sessionImageOrder.length);
    resetTimerAndDisplay();
  };

  const handleNextImage = () => {
    if (sessionState === 'idle') return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % sessionImageOrder.length);
    resetTimerAndDisplay();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      const imageUrls = imageFiles.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...imageUrls]);
      toast({ title: `${imageUrls.length} image(s) loaded successfully.` });
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    const imageToRemove = images[indexToRemove];
    if (imageToRemove?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setImages(updatedImages);
    
    if (sessionState !== 'idle') {
        const updatedSessionOrder = sessionImageOrder.filter(img => img !== imageToRemove);
        if (updatedSessionOrder.length === 0) {
            handleReset();
        } else {
            if (currentImageIndex >= updatedSessionOrder.length) {
                setCurrentImageIndex(0);
            }
            setSessionImageOrder(updatedSessionOrder);
        }
    }
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
    ? (timeRemaining / currentDuration) * 100 
    : (timeRemaining / intervalDuration) * 100;

  const getProgressStyle = () => {
    if (displayState !== 'image') {
      return { background: 'hsl(var(--primary))' };
    }
    const primaryHue = 215;
    const endHue = 0;
    const percentage = timeRemaining / currentDuration;
    
    const hue = endHue + (primaryHue - endHue) * percentage;
    const colorStart = `hsl(${hue}, 80%, 60%)`;
    const colorEnd = `hsl(${hue}, 80%, 40%)`;

    return {
      background: `linear-gradient(to right, ${colorStart}, ${colorEnd})`,
    };
  };
  
  const currentImageSrc = sessionImageOrder[currentImageIndex];
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return (
    <div className="flex h-dvh bg-background text-foreground font-body">
      <aside className="w-[380px] flex-shrink-0 border-r bg-card flex flex-col">
        <header className="p-4 border-b flex items-center justify-between">
          <LineFlowLogo />
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <Home className="mr-2 size-4" /> Modes
          </Button>
        </header>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Timer className="size-5" /> {getModeName(mode)} Mode Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === 'normal' ? (
                    <div className="space-y-2">
                      <Label htmlFor="duration">Image Duration: {initialDuration}s</Label>
                      <Slider id="duration" value={[initialDuration]} onValueChange={(val) => setInitialDuration(val[0])} min={5} max={120} step={5} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="total-duration">Total Session Duration: {formatTime(totalSessionDuration)}</Label>
                            <Slider id="total-duration" value={[totalSessionDuration]} onValueChange={(val) => setTotalSessionDuration(val[0])} min={60} max={3600} step={60} />
                        </div>
                        <Card className="bg-muted/50">
                            <CardContent className="p-3 text-sm text-muted-foreground space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-1.5"><Images className="size-4" /> Images</span>
                                    <span>{sessionImageCount} of {images.length} used</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-1.5"><Hourglass className="size-4" /> Time Per Image</span>
                                    <span>
                                        {images.length > 0 && sessionDurations.length > 0 ? 
                                            `${sessionDurations[0]}s - ${sessionDurations[sessionDurations.length - 1]}s` : 
                                            'N/A'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-1.5"><Info className="size-4" /> Minimum Time</span>
                                    <span>{MIN_IMAGE_DURATION}s</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="interval">Interval Duration: {intervalDuration}s</Label>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Images className="size-5" /> Image Set</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <FileImage className="mr-2" /> Load Files
                  </Button>
                  <Button onClick={() => folderInputRef.current?.click()}>
                    <FolderOpen className="mr-2" /> Load Folder
                  </Button>
                  <input type="file" ref={folderInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" {...({ webkitdirectory: "true", directory: "true" } as any)} />
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                </div>
                
                {images.length > 0 && 
                    <Button onClick={clearImages} variant="destructive" size="sm" className="w-full">
                      <Trash2 className="mr-2" /> Clear All Images
                    </Button>
                  }
                
                 <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="shuffle" className="flex items-center gap-2">
                    <Shuffle className="size-4" />
                    Shuffle
                  </Label>
                  <Switch id="shuffle" checked={shuffleImages} onCheckedChange={setShuffleImages} />
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
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 max-w-md flex items-center gap-4 z-20">
                  <div className="text-xl font-mono font-semibold text-primary w-36 text-right">
                    {timeRemaining}s / {currentDuration}s
                  </div>
                  <Progress value={progressValue} className="h-2 transition-all flex-1" indicatorStyle={getProgressStyle()} />
              </div>
              
              <div className="relative w-full h-full pt-16">
                {sessionImageOrder.length > 1 && displayState === 'image' && (
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
                  <div className="text-center text-muted-foreground max-w-sm animate-in fade-in flex flex-col items-center justify-center h-full">
                      <Hourglass className="mx-auto h-16 w-16 mb-4 text-primary" />
                      <h2 className="text-3xl font-bold text-foreground font-headline">Interval</h2>
                      <p className="mt-2 leading-relaxed">Prepare for the next image.</p>
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
            <div className="text-center text-muted-foreground max-w-sm">
              <Images className="mx-auto h-16 w-16 mb-4 text-primary" />
              <h2 className="text-3xl font-bold text-foreground font-headline">Ready for {getModeName(mode)} Mode</h2>
              <p className="mt-2 leading-relaxed">Load some images from your device to get started on your gesture drawing practice.</p>
            </div>
          )}
        </TooltipProvider>
      </main>
    </div>
  );
}

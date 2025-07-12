
'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderOpen, Images, Trash2, X, ChevronLeft, ChevronRight, Shuffle, FileImage, Home, ArrowLeft, Wind } from 'lucide-react';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

export default function ZenPracticePage() {
  const router = useRouter();
  
  const [images, setImages] = useState<string[]>([]);
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);
  const [isShuffled, setIsShuffled] = useState(true);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      const imageUrls = imageFiles.map(file => URL.createObjectURL(file));
      const newImages = [...images, ...imageUrls];
      setImages(newImages);

      if (isShuffled) {
        setShuffledImages(shuffleArray([...newImages]));
      } else {
        setShuffledImages([...newImages]);
      }
      setCurrentImageIndex(0);
      toast({ title: `${imageUrls.length} image(s) loaded successfully.` });
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    const imageList = isShuffled ? shuffledImages : images;
    const imageToRemove = imageList[indexToRemove];
    if (imageToRemove?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }
    
    const updatedImages = images.filter(img => img !== imageToRemove);
    setImages(updatedImages);

    const updatedShuffledImages = shuffledImages.filter(img => img !== imageToRemove);
    setShuffledImages(updatedShuffledImages);
    
    if (currentImageIndex >= updatedShuffledImages.length) {
        setCurrentImageIndex(Math.max(0, updatedShuffledImages.length - 1));
    }
  };
  
  const clearImages = () => {
    images.forEach(image => {
      if (image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
    });
    setImages([]);
    setShuffledImages([]);
    setCurrentImageIndex(0);
  };
  
  const handleShuffleToggle = (checked: boolean) => {
      setIsShuffled(checked);
      if(checked) {
          setShuffledImages(shuffleArray([...images]));
      } else {
          setShuffledImages([...images]);
      }
      setCurrentImageIndex(0);
  }

  const handlePreviousImage = () => {
    const imageList = isShuffled ? shuffledImages : images;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + imageList.length) % imageList.length);
  };

  const handleNextImage = () => {
    const imageList = isShuffled ? shuffledImages : images;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageList.length);
  };

  const currentImageSrc = (isShuffled ? shuffledImages : images)[currentImageIndex];

  return (
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Wind className="size-5 text-primary" /> Zen Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Load your images and practice without the pressure of a timer. Use the arrows to navigate through your set.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-lg"><Images className="size-5 text-primary" /> Image Set</CardTitle>
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
                    Shuffle Images
                  </Label>
                  <Switch id="shuffle" checked={isShuffled} onCheckedChange={handleShuffleToggle} />
                </div>
                
                {images.length > 0 && (
                  <ScrollArea className="h-40 w-full rounded-md border p-2">
                    <div className="space-y-2">
                      {(isShuffled ? shuffledImages : images).map((imgSrc, index) => (
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
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative transition-all duration-300">
        <TooltipProvider>
          {currentImageSrc ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-full h-full">
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
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground max-w-sm">
              <Images className="mx-auto h-16 w-16 mb-4 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Zen Mode</h2>
              <p className="mt-2 leading-relaxed">Load some images from your device to begin your untimed practice session.</p>
            </div>
          )}
        </TooltipProvider>
      </main>
    </div>
  );
}

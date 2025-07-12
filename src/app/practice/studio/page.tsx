
'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle, PenTool, Sparkles, Wand2 } from 'lucide-react';
import { LineFlowLogo } from '@/components/lineflow-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { generatePose } from '@/ai/flows/generate-pose-flow';

const GeneratePoseInputSchema = z.object({
  description: z.string().min(10, "Please enter a more descriptive prompt to get better results."),
});
type GeneratePoseInput = z.infer<typeof GeneratePoseInputSchema>;


export default function AIStudioPage() {
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<GeneratePoseInput>({
    resolver: zodResolver(GeneratePoseInputSchema),
    defaultValues: {
      description: 'A knight in a dynamic sword-fighting pose, full body',
    },
  });

  const handleGenerateImage = useCallback(async (values: GeneratePoseInput, index: number) => {
    setIsGenerating(true);
    try {
      const result = await generatePose(values);
      setImages(prev => {
        const newImages = [...prev];
        newImages[index] = result.imageDataUri;
        return newImages;
      });
      setCurrentImageIndex(index);
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate the image. The model may have refused the prompt. Please try again with a different description.",
        variant: "destructive"
      });
      // Remove the placeholder if generation fails
      setImages(prev => prev.filter(img => img !== 'generating'));
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const handleFirstGeneration = (values: GeneratePoseInput) => {
    if (images.length > 0) {
       // If images already exist, just generate the next one
       handleGenerateNext();
       return;
    }
    setImages(['generating']);
    handleGenerateImage(values, 0);
  };
  
  const handleGenerateNext = () => {
    if (isGenerating) return;
    const nextIndex = images.length;
    // Pre-fill with a placeholder to show loading state
    setImages(prev => [...prev, 'generating']);
    setCurrentImageIndex(nextIndex);
    handleGenerateImage(form.getValues(), nextIndex);
  };

  const handlePreviousImage = () => {
    if (isGenerating) return;
    setCurrentImageIndex(prev => Math.max(0, prev - 1));
  };
  
  const handleNextImage = () => {
     if (isGenerating) return;
    const nextIndex = currentImageIndex + 1;
    if (nextIndex >= images.length) {
      handleGenerateNext();
    } else {
      setCurrentImageIndex(nextIndex);
    }
  };
  
  const currentImageSrc = images[currentImageIndex];
  const showNextButton = currentImageIndex === images.length - 1;

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
        
        <div className="flex-1 p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFirstGeneration)} className="space-y-6 h-full flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><PenTool className="size-5 text-primary" /> AI Studio</CardTitle>
                  <CardDescription>Describe a character or pose, and generate infinite references. Practice without a timer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                   <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="flex-1 flex flex-col">
                          <FormControl>
                             <Textarea 
                                placeholder="e.g., A graceful dancer leaping through the air" 
                                {...field} 
                                className="flex-1 resize-none"
                                disabled={isGenerating && images.length > 0} 
                              />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isGenerating && images.length > 0}
                    >
                      {isGenerating && images.length > 0 ? <LoaderCircle className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                      {images.length > 0 ? (isGenerating ? 'Generating...' : 'Generate Next') : 'Generate'}
                    </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {images.length === 0 ? (
          <div className="text-center text-muted-foreground max-w-sm">
            <Sparkles className="mx-auto h-16 w-16 mb-4 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Welcome to the Studio</h2>
            <p className="mt-2 leading-relaxed">Describe a character, pose, or scene in the panel on the left and click "Generate" to create your first reference image.</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {images.length > 1 && (
               <Button 
                  onClick={handlePreviousImage} 
                  variant="ghost" 
                  size="icon" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
                  disabled={isGenerating || currentImageIndex === 0}
                >
                  <ChevronLeft className="size-6" />
                </Button>
            )}
            
            <Button 
              onClick={handleNextImage}
              variant={showNextButton ? 'default' : 'ghost'}
              size="icon" 
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80"
              disabled={isGenerating}
            >
              {isGenerating && currentImageIndex === images.length-1 ? <LoaderCircle className="animate-spin" /> : <ChevronRight className="size-6" />}
            </Button>
            
            {currentImageSrc === 'generating' ? (
              <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg animate-pulse">
                 <Sparkles className="size-16 text-primary/50 animate-pulse" />
              </div>
            ) : (
               currentImageSrc && (
                 <div className="relative w-full h-full animate-in fade-in">
                    <Image
                        src={currentImageSrc}
                        alt={`AI generated reference ${currentImageIndex + 1}`}
                        fill
                        className="object-contain"
                        key={currentImageSrc}
                        priority
                    />
                 </div>
               )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

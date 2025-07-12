
'use server';
/**
 * @fileOverview A flow for generating images of characters and poses for artistic practice.
 *
 * - generatePose - A function that handles the pose image generation process.
 */

import { ai } from '@/ai/genkit';
import type { GenerateShapeInput, GenerateShapeOutput } from '@/lib/types';


export async function generatePose(input: GenerateShapeInput): Promise<GenerateShapeOutput> {
  const { media } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-preview-image-generation',
    prompt: `Generate a clean, high-contrast, black and white reference image for an artist to practice drawing. The image should feature a single character: **${input.description}**.
    
    The character should be the sole focus, placed on a plain, neutral light grey background. 
    The camera angle should be dynamic and interesting, showing the subject from an engaging perspective.
    
    The lighting should be dramatic but clear, creating well-defined shadows to help the artist understand its form and volume. Avoid any distracting background elements, textures, or colors. The final image should be simple, powerful, and focused entirely on the character's form and gesture.`,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
       safetySettings: [
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_LOW_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        }
      ]
    },
  });

  const imageDataUri = media.url;
  if (!imageDataUri) {
    throw new Error('Image generation failed to return a data URI.');
  }

  return { imageDataUri };
}

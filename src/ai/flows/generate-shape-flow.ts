
'use server';
/**
 * @fileOverview A flow for generating images of geometric shapes for artistic practice.
 *
 * - generateShape - A function that handles the shape image generation process.
 */

import { ai } from '@/ai/genkit';
import type { GenerateShapeInput, GenerateShapeOutput } from '@/lib/types';


export async function generateShape(input: GenerateShapeInput): Promise<GenerateShapeOutput> {
  const { media } = await ai.generate({
    model: 'googleai/gemini-2.5-flash-image-preview',
    prompt: `Generate a clean, high-contrast, black and white reference image for an artist to practice drawing. The image should feature a single object: **${input.description}**.
    
    Place it on a plain, neutral grey background. The camera angle should be unique and interesting, showing the object from a random perspective.
    
    The lighting should be clear and create well-defined shadows to help the artist understand its form. Avoid any distracting elements, textures, or colors. The final image should be simple and focused entirely on the shape itself.`,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  if (!media?.url) {
    throw new Error('Image generation failed to return a data URI.');
  }

  return { imageDataUri: media.url };
}

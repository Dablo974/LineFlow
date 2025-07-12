
'use server';
/**
 * @fileOverview A flow for generating images of geometric shapes for artistic practice.
 *
 * - generateShape - A function that handles the shape image generation process.
 * - GenerateShapeInput - The input type for the generateShape function.
 * - GenerateShapeOutput - The return type for the generateShape function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateShapeInputSchema = z.object({
  description: z.string().describe('A text description of the geometric shape to generate. e.g., "a cube", "two intersecting spheres"'),
});
export type GenerateShapeInput = z.infer<typeof GenerateShapeInputSchema>;

export const GenerateShapeOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateShapeOutput = z.infer<typeof GenerateShapeOutputSchema>;


export async function generateShape(input: GenerateShapeInput): Promise<GenerateShapeOutput> {
  const { media } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-preview-image-generation',
    prompt: `Generate a clean, high-contrast, black and white reference image for an artist to practice drawing. The image should feature a single object: **${input.description}**.
    
    Place it on a plain, neutral grey background. The camera angle should be unique and interesting, showing the object from a random perspective.
    
    The lighting should be clear and create well-defined shadows to help the artist understand its form. Avoid any distracting elements, textures, or colors. The final image should be simple and focused entirely on the shape itself.`,
    config: {
      responseModalities: ['IMAGE'],
    },
  });

  const imageDataUri = media.url;
  if (!imageDataUri) {
    throw new Error('Image generation failed to return a data URI.');
  }

  return { imageDataUri };
}

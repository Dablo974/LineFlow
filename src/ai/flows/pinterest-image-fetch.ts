'use server';
/**
 * @fileOverview Generates a placeholder image URL.
 *
 * - pinterestImageFetch - A function that returns a placeholder image URL.
 * - PinterestImageFetchInput - The input type for the pinterestImageFetch function.
 * - PinterestImageFetchOutput - The return type for the pinterestImageFetch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PinterestImageFetchInputSchema = z.object({
  subject: z.string().describe('The subject for the placeholder image. This is not used to generate the image, but is kept for consistency.'),
});
export type PinterestImageFetchInput = z.infer<typeof PinterestImageFetchInputSchema>;

const PinterestImageFetchOutputSchema = z.object({
  imageUrl: z.string().describe('The direct URL of the generated placeholder image.'),
});
export type PinterestImageFetchOutput = z.infer<typeof PinterestImageFetchOutputSchema>;

export async function pinterestImageFetch(input: PinterestImageFetchInput): Promise<PinterestImageFetchOutput> {
  return pinterestImageFetchFlow(input);
}

const pinterestImageFetchFlow = ai.defineFlow(
  {
    name: 'pinterestImageFetchFlow',
    inputSchema: PinterestImageFetchInputSchema,
    outputSchema: PinterestImageFetchOutputSchema,
  },
  async input => {
    // Generate a random-ish size for the placeholder
    const width = 600 + Math.floor(Math.random() * 200);
    const height = 800 + Math.floor(Math.random() * 200);
    return {
        imageUrl: `https://placehold.co/${width}x${height}.png`
    };
  }
);

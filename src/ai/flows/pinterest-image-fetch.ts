// Pinterest Image Fetch flow
'use server';
/**
 * @fileOverview Fetches relevant drawing references from Pinterest based on a user-defined subject using AI.
 *
 * - pinterestImageFetch - A function that fetches images from Pinterest.
 * - PinterestImageFetchInput - The input type for the pinterestImageFetch function.
 * - PinterestImageFetchOutput - The return type for the pinterestImageFetch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PinterestImageFetchInputSchema = z.object({
  subject: z.string().describe('The subject to search for on Pinterest (e.g., \'dynamic poses\', \'animal anatomy\').'),
});
export type PinterestImageFetchInput = z.infer<typeof PinterestImageFetchInputSchema>;

const PinterestImageFetchOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the fetched image from Pinterest.'),
});
export type PinterestImageFetchOutput = z.infer<typeof PinterestImageFetchOutputSchema>;

export async function pinterestImageFetch(input: PinterestImageFetchInput): Promise<PinterestImageFetchOutput> {
  return pinterestImageFetchFlow(input);
}

const pinterestImageFetchPrompt = ai.definePrompt({
  name: 'pinterestImageFetchPrompt',
  input: {schema: PinterestImageFetchInputSchema},
  output: {schema: PinterestImageFetchOutputSchema},
  prompt: `You are an AI assistant specialized in finding relevant reference images from Pinterest.

  Based on the user's subject, search Pinterest and find a suitable image URL.

  Subject: {{{subject}}}

  Return only the direct URL of the image. Do not include any surrounding text or explanations.`,
});

const pinterestImageFetchFlow = ai.defineFlow(
  {
    name: 'pinterestImageFetchFlow',
    inputSchema: PinterestImageFetchInputSchema,
    outputSchema: PinterestImageFetchOutputSchema,
  },
  async input => {
    const {output} = await pinterestImageFetchPrompt(input);
    return output!;
  }
);

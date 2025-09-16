// src/ai/flows/video-generation.ts
'use server';
/**
 * @fileOverview A flow for generating video lectures using AI.
 *
 * - generateVideoLecture - A function that handles the video generation process.
 * - GenerateVideoLectureInput - The input type for the generateVideoLecture function.
 * - GenerateVideoLectureOutput - The return type for the generateVideoLecture function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import fetch from 'node-fetch';

const GenerateVideoLectureInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
});
export type GenerateVideoLectureInput = z.infer<typeof GenerateVideoLectureInputSchema>;

const GenerateVideoLectureOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
});
export type GenerateVideoLectureOutput = z.infer<typeof GenerateVideoLectureOutputSchema>;

export async function generateVideoLecture(
  input: GenerateVideoLectureInput
): Promise<GenerateVideoLectureOutput> {
  return generateVideoLectureFlow(input);
}

const generateVideoLectureFlow = ai.defineFlow(
  {
    name: 'generateVideoLectureFlow',
    inputSchema: GenerateVideoLectureInputSchema,
    outputSchema: GenerateVideoLectureOutputSchema,
  },
  async ({ prompt }) => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: prompt,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      console.error('Failed to generate video:', operation.error);
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media) {
      throw new Error('Failed to find the generated video in the operation result');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set.');
    }
  
    // Fetch the video data from the signed URL
    const videoDownloadUrl = `${video.media.url}&key=${apiKey}`;
    const response = await fetch(videoDownloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    // Convert the video to a base64 data URI
    const videoBuffer = await response.buffer();
    const videoBase64 = videoBuffer.toString('base64');
    const videoDataUri = `data:video/mp4;base64,${videoBase64}`;
    
    return {
      videoUrl: videoDataUri,
    };
  }
);

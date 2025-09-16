import { z } from 'zod';

export const GenerateContentInputSchema = z.object({
    topic: z.string().min(5, { message: 'Please provide a more detailed topic.' }),
    contentType: z.enum(['Quiz', 'Exercise']),
});
export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

export const GenerateContentOutputSchema = z.object({
  content: z.string(),
});
export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;

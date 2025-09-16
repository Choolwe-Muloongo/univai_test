// src/ai/flows/code-analysis.ts
'use server';
/**
 * @fileOverview Provides AI-driven feedback on student code submissions.
 *
 * - analyzeCode - A function that analyzes code and provides feedback.
 * - CodeAnalysisInput - The input type for the analyzeCode function.
 * - CodeAnalysisOutput - The return type for the analyzeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeAnalysisInputSchema = z.object({
  code: z.string().describe('The student\'s code submission.'),
  language: z.string().describe('The programming language of the code.'),
});
export type CodeAnalysisInput = z.infer<typeof CodeAnalysisInputSchema>;

const CodeAnalysisOutputSchema = z.object({
  feedback: z.string().describe('AI-generated feedback on the code, including suggestions for improvement, bug fixes, and concept explanations.'),
  correctedCode: z.string().describe('The corrected version of the code, if any issues were found.'),
});
export type CodeAnalysisOutput = z.infer<typeof CodeAnalysisOutputSchema>;

export async function analyzeCode(input: CodeAnalysisInput): Promise<CodeAnalysisOutput> {
  return codeAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeAnalysisPrompt',
  input: {schema: CodeAnalysisInputSchema},
  output: {schema: CodeAnalysisOutputSchema},
  prompt: `You are an expert code reviewer and AI programming assistant. Your task is to analyze a student's code submission and provide constructive feedback.

Language: {{{language}}}
Code:
\`\`\`
{{{code}}}
\`\`\`

Analyze the code for the following:
1.  **Correctness**: Does the code work as intended? Are there any bugs?
2.  **Efficiency**: Can the code be made more performant?
3.  **Readability**: Is the code clean, well-formatted, and easy to understand?
4.  **Best Practices**: Does the code follow standard conventions for the given language?

Provide detailed feedback addressing these points. If you find errors, explain what they are and why they happen. Suggest specific improvements and provide a corrected version of the code. Be encouraging and educational in your tone.`,
});

const codeAnalysisFlow = ai.defineFlow(
  {
    name: 'codeAnalysisFlow',
    inputSchema: CodeAnalysisInputSchema,
    outputSchema: CodeAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

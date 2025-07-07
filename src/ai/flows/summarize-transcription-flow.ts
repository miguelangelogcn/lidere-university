'use server';
/**
 * @fileOverview AI agent that summarizes a meeting transcription.
 *
 * - summarizeTranscription - A function that handles the transcription summarization.
 * - SummarizeTranscriptionInput - The input type for the summarizeTranscription function.
 * - SummarizeTranscriptionOutput - The return type for the summarizeTranscription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTranscriptionInputSchema = z.object({
  transcription: z.string().describe('The full text transcription of a mentorship meeting.'),
});
export type SummarizeTranscriptionInput = z.infer<typeof SummarizeTranscriptionInputSchema>;

const SummarizeTranscriptionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key points, decisions, and action items from the transcription.'),
});
export type SummarizeTranscriptionOutput = z.infer<typeof SummarizeTranscriptionOutputSchema>;

export async function summarizeTranscription(input: SummarizeTranscriptionInput): Promise<SummarizeTranscriptionOutput> {
  return summarizeTranscriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTranscriptionPrompt',
  input: {schema: SummarizeTranscriptionInputSchema},
  output: {schema: SummarizeTranscriptionOutputSchema},
  prompt: `Você é um especialista em mentoria de negócios. Sua tarefa é resumir a seguinte transcrição de reunião EM PORTUGUÊS (BRASIL).

  Concentre-se nos principais pontos de discussão, decisões tomadas e quaisquer itens de ação atribuídos ao mentor ou ao mentorado. O resumo deve ser claro, conciso e fácil de entender.

  Transcrição para resumir:
  {{{transcription}}}
  `,
});

const summarizeTranscriptionFlow = ai.defineFlow(
  {
    name: 'summarizeTranscriptionFlow',
    inputSchema: SummarizeTranscriptionInputSchema,
    outputSchema: SummarizeTranscriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview AI agent that generates personalized email templates based on customer profiles.
 *
 * - generateEmailFromProfile - A function that generates an email template based on the customer profile.
 * - GenerateEmailFromProfileInput - The input type for the generateEmailFromProfile function.
 * - GenerateEmailFromProfileOutput - The return type for the generateEmailFromProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailFromProfileInputSchema = z.object({
  customerProfile: z
    .string()
    .describe('Detailed profile of the customer, including interests, past interactions, and purchase history.'),
  emailPurpose: z
    .string()
    .describe('The purpose of the email, such as introducing a new product, following up on a previous contact, or offering a discount.'),
  tone: z.enum(['formal', 'informal']).default('informal').describe('The tone of the email.'),
});
export type GenerateEmailFromProfileInput = z.infer<typeof GenerateEmailFromProfileInputSchema>;

const GenerateEmailFromProfileOutputSchema = z.object({
  emailTemplate: z
    .string()
    .describe('The generated email template, personalized based on the customer profile and the email purpose.'),
});
export type GenerateEmailFromProfileOutput = z.infer<typeof GenerateEmailFromProfileOutputSchema>;

export async function generateEmailFromProfile(input: GenerateEmailFromProfileInput): Promise<GenerateEmailFromProfileOutput> {
  return generateEmailFromProfileFlow(input);
}

const generateEmailPrompt = ai.definePrompt({
  name: 'generateEmailPrompt',
  input: {schema: GenerateEmailFromProfileInputSchema},
  output: {schema: GenerateEmailFromProfileOutputSchema},
  prompt: `You are an AI assistant specialized in generating personalized email templates for sales representatives.

  Based on the customer profile and the purpose of the email, generate a compelling and personalized email template.

  Customer Profile: {{{customerProfile}}}
  Email Purpose: {{{emailPurpose}}}
  Tone: {{{tone}}}

  The email should be tailored to the customer's interests and needs, and it should encourage them to take the desired action.
  The email should have a professional and engaging tone.
  Here is the email template:
  `,
});

const generateEmailFromProfileFlow = ai.defineFlow(
  {
    name: 'generateEmailFromProfileFlow',
    inputSchema: GenerateEmailFromProfileInputSchema,
    outputSchema: GenerateEmailFromProfileOutputSchema,
  },
  async input => {
    const {output} = await generateEmailPrompt(input);
    return output!;
  }
);

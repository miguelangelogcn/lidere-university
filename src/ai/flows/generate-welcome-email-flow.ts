'use server';
/**
 * @fileOverview AI agent that generates a welcome email for new students.
 *
 * - generateWelcomeEmail - Generates a welcome email for a new student.
 * - GenerateWelcomeEmailInput - The input type for the function.
 * - GenerateWelcomeEmailOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWelcomeEmailInputSchema = z.object({
  name: z.string().describe('The name of the new student.'),
  email: z.string().email().describe('The email address of the new student.'),
  password: z.string().describe('The temporary password for the new student.'),
  loginUrl: z.string().url().describe('The URL for the login page.'),
});
export type GenerateWelcomeEmailInput = z.infer<typeof GenerateWelcomeEmailInputSchema>;

const GenerateWelcomeEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the welcome email.'),
  body: z.string().describe('The full HTML content of the welcome email.'),
});
export type GenerateWelcomeEmailOutput = z.infer<typeof GenerateWelcomeEmailOutputSchema>;

export async function generateWelcomeEmail(input: GenerateWelcomeEmailInput): Promise<GenerateWelcomeEmailOutput> {
  return generateWelcomeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWelcomeEmailPrompt',
  input: {schema: GenerateWelcomeEmailInputSchema},
  output: {schema: GenerateWelcomeEmailOutputSchema},
  prompt: `
    Você é um assistente de onboarding para a Lidere University. Sua tarefa é criar um e-mail de boas-vindas para um novo aluno em PORTUGUÊS (BRASIL).

    O e-mail deve ser caloroso, profissional e informativo.

    Use as seguintes informações para personalizar o e-mail:
    - Nome do Aluno: {{{name}}}
    - Email de Login: {{{email}}}
    - Senha Temporária: {{{password}}}
    - URL de Login: {{{loginUrl}}}

    Instruções para o conteúdo do e-mail:
    1.  Crie um assunto claro e convidativo.
    2.  No corpo do e-mail, dê as boas-vindas ao aluno pelo nome.
    3.  Informe que sua conta foi criada.
    4.  Forneça o email e a senha temporária para o primeiro acesso.
    5.  Inclua o link para a página de login.
    6.  Recomende fortemente que o aluno altere sua senha após o primeiro login por segurança.
    7.  Termine com uma mensagem positiva.
    8.  Formate o corpo do e-mail em HTML simples para boa legibilidade. Use parágrafos <p> e links <a>.
  `,
});

const generateWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'generateWelcomeEmailFlow',
    inputSchema: GenerateWelcomeEmailInputSchema,
    outputSchema: GenerateWelcomeEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

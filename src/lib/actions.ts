"use server";

import { generateEmailFromProfile } from "@/ai/flows/generate-email-from-profile";
import { z } from "zod";

const FormSchema = z.object({
  customerProfile: z.string().min(10, {
    message: "O perfil do cliente deve ter pelo menos 10 caracteres.",
  }),
  emailPurpose: z.string().min(5, {
    message: "O propósito do email deve ter pelo menos 5 caracteres.",
  }),
  tone: z.enum(["formal", "informal"]),
});

export type State = {
  errors?: {
    customerProfile?: string[];
    emailPurpose?: string[];
    tone?: string[];
  };
  message?: string | null;
  generatedEmail?: string | null;
};

export async function handleGenerateEmail(prevState: State, formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    customerProfile: formData.get("customerProfile"),
    emailPurpose: formData.get("emailPurpose"),
    tone: formData.get("tone"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Campos ausentes. Falha ao gerar email.",
      generatedEmail: null,
    };
  }
  
  const { customerProfile, emailPurpose, tone } = validatedFields.data;

  try {
    const result = await generateEmailFromProfile({
      customerProfile,
      emailPurpose,
      tone,
    });
    
    return {
      message: "Email gerado com sucesso!",
      generatedEmail: result.emailTemplate,
    };

  } catch (error) {
    return {
      message: "Ocorreu um erro na API. Por favor, tente novamente.",
      generatedEmail: null,
    };
  }
}

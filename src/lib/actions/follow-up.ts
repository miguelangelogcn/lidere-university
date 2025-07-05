'use server';

import { z } from 'zod';
import { submitTaskValidation } from '@/services/followUpService';
import { revalidatePath } from 'next/cache';

const ValidationPayloadSchema = z.object({
    validationText: z.string().optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
    })),
});

export async function handleTaskValidation(
    followUpId: string, 
    actionItemId: string,
    payload: {
        validationText?: string;
        attachments: { name: string; url: string }[];
    }
) {
    const validatedPayload = ValidationPayloadSchema.safeParse(payload);
    
    if (!validatedPayload.success) {
        console.error("Validation failed:", validatedPayload.error);
        return {
            errors: { general: 'Dados inválidos.' },
            message: 'Falha ao enviar validação. Verifique os dados e tente novamente.',
        };
    }
    
    try {
        await submitTaskValidation(followUpId, actionItemId, validatedPayload.data);
        revalidatePath(`/public/acompanhamento/${followUpId}`);
        return { message: 'Tarefa enviada para validação com sucesso!' };
    } catch (error) {
        console.error("Server action error:", error);
        return {
            errors: { general: 'Ocorreu um erro no servidor.' },
            message: 'Falha ao enviar validação. Tente novamente mais tarde.',
        };
    }
}
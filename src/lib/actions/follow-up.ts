'use server';

import { z } from 'zod';
import { submitTaskValidation, validateSubmittedTask } from '@/services/followUpService';
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


const MentorValidationSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    rejectionReason: z.string().optional(),
});

export async function handleMentorValidation(
    followUpId: string,
    actionItemId: string,
    payload: {
        status: 'approved' | 'rejected';
        rejectionReason?: string;
    }
) {
    const validatedPayload = MentorValidationSchema.safeParse(payload);

    if (!validatedPayload.success) {
        return {
            errors: { general: 'Dados de validação inválidos.' },
            message: 'Falha ao validar tarefa.',
        };
    }

    if (payload.status === 'rejected' && !payload.rejectionReason) {
        return {
            errors: { rejectionReason: 'O motivo da reprovação é obrigatório.' },
            message: 'Por favor, forneça um motivo para a reprovação.',
        };
    }
    
    try {
        await validateSubmittedTask(followUpId, actionItemId, payload.status, payload.rejectionReason);
        revalidatePath(`/acompanhamento`); // Revalidate the mentor's page
        revalidatePath(`/public/acompanhamento/${followUpId}`); // Revalidate public page
        return { message: 'Tarefa validada com sucesso!' };
    } catch (error) {
        console.error("Mentor validation error:", error);
        return {
            errors: { general: 'Ocorreu um erro no servidor.' },
            message: 'Falha ao validar a tarefa. Tente novamente mais tarde.',
        };
    }
}

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addCommentToLesson } from '@/services/formationService';
import type { AppUser, Comment } from '@/lib/types';

const commentSchema = z.object({
    text: z.string().min(1, "O comentário não pode estar vazio."),
});

export type CommentActionState = {
    errors?: {
        text?: string[];
    };
    message?: string | null;
}

export async function handleAddComment(
    formationId: string,
    moduleId: string,
    lessonId: string,
    user: AppUser,
    prevState: CommentActionState,
    formData: FormData
) {
    const validatedFields = commentSchema.safeParse({
        text: formData.get("text"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'A validação falhou.',
        };
    }

    const { text } = validatedFields.data;

    if (!user) {
        return { message: 'Usuário não autenticado.' };
    }
    
    const commentData: Omit<Comment, 'id' | 'createdAt'> = {
        userId: user.id,
        userName: user.name || 'Usuário Anônimo',
        userAvatarUrl: user.avatarUrl || null,
        text: text,
    };

    try {
        await addCommentToLesson(formationId, moduleId, lessonId, commentData);
        revalidatePath(`/formacoes/${formationId}`);
        return { message: 'Comentário adicionado com sucesso.' };
    } catch (error) {
        return { message: 'Falha ao adicionar comentário.' };
    }
}

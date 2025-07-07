'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addCommentToLesson } from '@/services/formationService';
import { adminDb } from '../firebase-admin';
import type { AppUser, Comment, Contact } from '@/lib/types';

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


export type LessonCompletionState = {
    error?: string | null;
    message?: string | null;
}

export async function toggleLessonCompletion(
    contactId: string,
    formationId: string,
    prevState: LessonCompletionState,
    formData: FormData
) {
    const lessonId = formData.get('lessonId') as string;
    const markAsCompleted = formData.get('isCompleted') === 'true';

    if (!contactId || !formationId || !lessonId) {
        return { error: "Dados inválidos." };
    }

    try {
        const contactDocRef = adminDb.collection('contacts').doc(contactId);
        const docSnap = await contactDocRef.get();
        if (!docSnap.exists) {
            return { error: "Contato de aluno não encontrado." };
        }

        const contactData = docSnap.data() as Contact;
        const progress = contactData.formationProgress || {};
        const completedLessons = progress[formationId] || [];

        let newCompletedLessons: string[];

        if (markAsCompleted) {
            newCompletedLessons = [...new Set([...completedLessons, lessonId])];
        } else {
            newCompletedLessons = completedLessons.filter(id => id !== lessonId);
        }

        await contactDocRef.update({
            [`formationProgress.${formationId}`]: newCompletedLessons
        });
        
        revalidatePath(`/formacoes/${formationId}`);
        return { message: "Progresso atualizado." };

    } catch (err) {
        console.error(err);
        return { error: "Falha ao atualizar o progresso." };
    }
}

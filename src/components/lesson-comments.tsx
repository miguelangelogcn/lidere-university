'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { SerializableLesson, AppUser, SerializableComment } from '@/lib/types';
import { useAuth } from '@/context/auth-provider';
import { handleAddComment, type CommentActionState } from '@/lib/actions/formationActions';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getInitials(name: string | null) {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Enviar comentário</span>
        </Button>
    )
}

type EnrichedLesson = SerializableLesson & {
  moduleId: string;
  moduleTitle: string;
};

export function LessonComments({ formationId, moduleId, lesson }: { formationId: string, moduleId: string, lesson: EnrichedLesson }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const initialState: CommentActionState = { message: null, errors: {} };
    const addCommentWithContext = handleAddComment.bind(null, formationId, moduleId, lesson.id, user as AppUser);
    const [state, dispatch] = useActionState(addCommentWithContext, initialState);

    useEffect(() => {
        if (state.message) {
            if (state.errors && Object.keys(state.errors).length > 0) {
                toast({ variant: 'destructive', title: "Erro", description: state.message });
            } else if (!state.errors) {
                toast({ title: "Sucesso", description: state.message });
                formRef.current?.reset();
            }
        }
    }, [state, toast]);

    return (
        <div className="mt-12">
            <h2 className="mb-4 text-2xl font-semibold border-b pb-2">Comentários ({lesson.comments?.length || 0})</h2>
            {user && (
                <form action={dispatch} ref={formRef} className="flex items-start gap-4 mb-8">
                    <Avatar>
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'Usuário'} data-ai-hint="person" />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <Textarea 
                            name="text" 
                            placeholder="Deixe seu comentário..."
                            required
                            rows={3}
                        />
                         {state.errors?.text && <p className="text-sm font-medium text-destructive mt-1">{state.errors.text}</p>}
                    </div>
                    <SubmitButton />
                </form>
            )}

            <div className="space-y-6">
                {lesson.comments && lesson.comments.length > 0 ? (
                    lesson.comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-4">
                             <Avatar>
                                <AvatarImage src={comment.userAvatarUrl || undefined} alt={comment.userName} data-ai-hint="person" />
                                <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold">{comment.userName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
                                    </p>
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap">{comment.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">Seja o primeiro a comentar!</p>
                )}
            </div>
        </div>
    );
}

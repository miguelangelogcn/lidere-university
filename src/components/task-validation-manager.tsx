'use client';

import { useState } from 'react';
import { handleMentorValidation } from '@/lib/actions/follow-up';
import type { SerializableFollowUpProcess, SerializableActionItem } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Download, FileText, Loader2, XCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';

type TaskValidationManagerProps = {
    process: SerializableFollowUpProcess;
    onSuccess: () => void;
};

function SubmittedTask({ task, processId, onSuccess }: { task: SerializableActionItem, processId: string, onSuccess: () => void }) {
    const { toast } = useToast();
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState<'approving' | 'rejecting' | null>(null);

    const handleApprove = async () => {
        setLoading('approving');
        try {
            await handleMentorValidation(processId, task.id, { status: 'approved' });
            toast({ title: 'Sucesso!', description: 'Tarefa aprovada.' });
            onSuccess();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao aprovar tarefa.' });
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            toast({ variant: 'destructive', title: 'Atenção!', description: 'O motivo da reprovação é obrigatório.' });
            return;
        }
        setLoading('rejecting');
        try {
            const result = await handleMentorValidation(processId, task.id, { status: 'rejected', rejectionReason });
            if (result.errors) {
                 toast({ variant: 'destructive', title: 'Erro!', description: result.message });
            } else {
                toast({ title: 'Sucesso!', description: 'Tarefa reprovada e devolvida ao cliente.' });
                onSuccess();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao reprovar tarefa.' });
        } finally {
            setLoading(null);
            setIsRejecting(false);
            setRejectionReason('');
        }
    };

    return (
        <AccordionItem value={task.id}>
            <AccordionTrigger>
                <div className="flex flex-col items-start text-left">
                    <span className="font-semibold">{task.title}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                        Enviado em: {task.submittedAt ? format(new Date(task.submittedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
                {task.validationText && (
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><FileText size={16} /> Comentários do Cliente</h4>
                        <div className="p-3 border rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                            {task.validationText}
                        </div>
                    </div>
                )}
                {task.validationAttachments && task.validationAttachments.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2">Anexos</h4>
                        <ul className="space-y-2">
                            {task.validationAttachments.map((doc, index) => (
                                <li key={index}>
                                    <Button asChild variant="outline" size="sm">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                            <Download className="mr-2 h-4 w-4" />
                                            {doc.name}
                                        </a>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {!isRejecting ? (
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="destructive" onClick={() => setIsRejecting(true)} disabled={!!loading}>
                            <XCircle className="mr-2" /> Reprovar
                        </Button>
                        <Button onClick={handleApprove} disabled={!!loading}>
                            {loading === 'approving' ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle className="mr-2" />}
                            Aprovar
                        </Button>
                    </div>
                ) : (
                    <div className="pt-4 space-y-2">
                        <h4 className="font-semibold">Motivo da Reprovação</h4>
                        <Textarea
                            placeholder="Descreva o que o cliente precisa corrigir..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsRejecting(false)} disabled={!!loading}>Cancelar</Button>
                            <Button variant="destructive" onClick={handleReject} disabled={!!loading}>
                                {loading === 'rejecting' ? <Loader2 className="mr-2 animate-spin" /> : <XCircle className="mr-2" />}
                                Confirmar Reprovação
                            </Button>
                        </div>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}


export function TaskValidationManager({ process, onSuccess }: TaskValidationManagerProps) {
    const submittedTasks = process.actionPlan?.filter(task => task.status === 'submitted') || [];

    if (submittedTasks.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma tarefa pendente de validação no momento.</p>
            </div>
        );
    }

    return (
        <Accordion type="multiple" className="w-full">
            {submittedTasks.map(task => (
                <SubmittedTask key={task.id} task={task} processId={process.id} onSuccess={onSuccess} />
            ))}
        </Accordion>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { getFollowUpProcessById, updateFollowUpProcess } from '@/services/followUpService';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Download } from "lucide-react";
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FollowUpProcess } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';


export default function PublicAcompanhamentoPage({ params }: { params: { id: string } }) {
    const [followUpData, setFollowUpData] = useState<FollowUpProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const { toast } = useToast();

    useEffect(() => {
        if (params.id) {
            getFollowUpProcessById(params.id)
                .then(data => {
                    setFollowUpData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [params.id]);

    const handleToggleComplete = async (itemId: string) => {
        if (!followUpData) return;

        const originalActionPlan = [...(followUpData.actionPlan || [])];
        const updatedActionPlan = originalActionPlan.map(item =>
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        
        const newFollowUpData = { ...followUpData, actionPlan: updatedActionPlan };
        setFollowUpData(newFollowUpData);

        try {
            await updateFollowUpProcess(followUpData.id, { actionPlan: updatedActionPlan });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao atualizar a tarefa.' });
            setFollowUpData({ ...followUpData, actionPlan: originalActionPlan });
        }
    };


    const sortedMentorships = followUpData?.mentorships?.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    }) || [];

    const actionDays = (followUpData?.actionPlan || []).map(action => {
        return action.dueDate?.seconds ? new Date(action.dueDate.seconds * 1000) : new Date(0);
    });

    const actionsForDay = (followUpData?.actionPlan || []).filter(action => {
        if (!selectedDate || !action.dueDate?.seconds) return false;
        return startOfDay(new Date(action.dueDate.seconds * 1000)).getTime() === startOfDay(selectedDate).getTime();
    });

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    if (!followUpData) {
        return <div className="flex justify-center items-center h-screen">Acompanhamento não encontrado.</div>;
    }

    return (
        <div className="bg-background min-h-screen">
            <header className="p-4 border-b">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 font-semibold font-headline">
                        <Logo className="h-6 w-6 text-primary" />
                        <span>Lidere University</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Formação Prática em Liderança e Gestão</span>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <aside className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plano de Ação</CardTitle>
                            <CardDescription>Selecione um dia para ver as ações.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                modifiers={{ highlighted: actionDays }}
                                modifiersStyles={{
                                    highlighted: {
                                        border: "2px solid hsl(var(--primary))",
                                        borderRadius: 'var(--radius)'
                                    },
                                }}
                                locale={ptBR}
                            />
                        </CardContent>
                    </Card>
                </aside>

                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold font-headline mb-4">Ações para {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'data selecionada'}</h2>
                        <div className="space-y-4">
                            {actionsForDay.length > 0 ? (
                                actionsForDay.map(action => (
                                    <div key={action.id} className="p-4 rounded-lg bg-card border flex items-start gap-4">
                                        <Checkbox
                                            id={`action-public-${action.id}`}
                                            checked={action.isCompleted}
                                            onCheckedChange={() => handleToggleComplete(action.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 grid gap-1.5">
                                            <label htmlFor={`action-public-${action.id}`} className={cn("font-medium cursor-pointer", action.isCompleted && "line-through text-muted-foreground")}>
                                                {action.title}
                                            </label>
                                            <p className={cn("text-sm text-muted-foreground", action.isCompleted && "line-through")}>{action.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground">Nenhuma ação para este dia.</p>
                            )}
                        </div>
                    </div>

                    <div>
                         <h2 className="text-2xl font-bold font-headline mb-4">Histórico de Mentorias</h2>
                         {sortedMentorships.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                 {sortedMentorships.map(mentorship => (
                                     <AccordionItem value={mentorship.id} key={mentorship.id}>
                                         <AccordionTrigger>
                                             Mentoria - {mentorship.createdAt?.seconds ? format(new Date(mentorship.createdAt.seconds * 1000), 'dd/MM/yyyy') : 'Data não disponível'}
                                         </AccordionTrigger>
                                         <AccordionContent className="space-y-4">
                                             <div>
                                                 <h4 className="font-semibold mb-2">Resumo</h4>
                                                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mentorship.summary}</p>
                                             </div>
                                             {mentorship.recordingUrl && (
                                                 <div>
                                                     <h4 className="font-semibold mb-2">Gravação</h4>
                                                     <audio controls src={mentorship.recordingUrl} className="w-full" />
                                                 </div>
                                             )}
                                             {mentorship.documents && mentorship.documents.length > 0 && (
                                                 <div>
                                                     <h4 className="font-semibold mb-2">Documentos</h4>
                                                     <ul className="space-y-2">
                                                         {mentorship.documents.map((doc, index) => (
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
                                         </AccordionContent>
                                     </AccordionItem>
                                 ))}
                             </Accordion>
                         ) : (
                             <p className="text-sm text-muted-foreground">Nenhum registro de mentoria encontrado.</p>
                         )}
                    </div>
                </div>
            </main>
        </div>
    );
}

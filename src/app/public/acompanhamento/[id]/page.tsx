'use client';

import { useState, useEffect } from 'react';
import { getFollowUpProcessById } from '@/services/followUpService';
import type { FollowUpProcess, ActionItem, Mentorship } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CheckCircle2, Download } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type PublicAcompanhamentoPageProps = {
    params: { id: string };
};

export default function PublicAcompanhamentoPage({ params }: PublicAcompanhamentoPageProps) {
    const [process, setProcess] = useState<FollowUpProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
        const fetchProcess = async () => {
            const processData = await getFollowUpProcessById(params.id);
            if (!processData) {
                return notFound();
            }
            setProcess(processData);
            setLoading(false);
        };
        fetchProcess();
    }, [params.id]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    if (!process) {
        return notFound();
    }

    const sortedMentorships = process.mentorships?.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date();
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date();
        return dateB.getTime() - dateA.getTime();
    }) || [];

    const actionItemsByDate = (process.actionPlan || []).reduce((acc, item) => {
        if (!item.dueDate?.seconds) return acc;
        const date = format(new Date(item.dueDate.seconds * 1000), 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {} as Record<string, ActionItem[]>);
    
    const eventDays = Object.keys(actionItemsByDate).map(dateStr => new Date(dateStr));

    const selectedDayActions = selectedDate ? (process.actionPlan || []).filter(item => item.dueDate?.seconds && isSameDay(new Date(item.dueDate.seconds * 1000), selectedDate)) : [];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="py-6 px-4 sm:px-6 lg:px-8 border-b">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold font-headline">Lidere University</h1>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-semibold">{process.contactName}</h2>
                        <p className="text-sm text-muted-foreground">{process.productName}</p>
                    </div>
                </div>
            </header>

            <main className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
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
                                    className="p-0"
                                    locale={ptBR}
                                    modifiers={{
                                        events: eventDays,
                                    }}
                                    modifiersStyles={{
                                        events: { 
                                            textDecoration: 'underline',
                                            textDecorationColor: 'hsl(var(--primary))',
                                            textUnderlineOffset: '2px',
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                        <div>
                             <h3 className="text-xl font-semibold mb-4">
                                Ações para {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'o dia selecionado'}
                            </h3>
                            {selectedDayActions.length > 0 ? (
                                <ul className="space-y-3">
                                    {selectedDayActions.map(item => (
                                        <li key={item.id} className="flex items-start gap-4 p-4 border rounded-md bg-card">
                                             <div className="w-5 h-5 mt-1 flex-shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                                                {item.isCompleted && <Check className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={cn("font-medium", item.isCompleted && "line-through text-muted-foreground")}>{item.title}</p>
                                                <p className={cn("text-sm text-muted-foreground", item.isCompleted && "line-through")}>{item.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
                                    Nenhuma ação proposta para este dia.
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4">Histórico de Mentorias</h3>
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
                                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
                                    Nenhum registro de mentoria encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

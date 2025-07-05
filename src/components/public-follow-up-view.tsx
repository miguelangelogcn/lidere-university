'use client';

import { useState, useMemo, useEffect } from 'react';
import { Logo } from "./logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import type { SerializableFollowUpProcess } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Progress } from './ui/progress';

type PublicFollowUpViewProps = {
    process: SerializableFollowUpProcess;
};

export function PublicFollowUpView({ process }: PublicFollowUpViewProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [hasMounted, setHasMounted] = useState(false);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHasMounted(true);
            setSelectedDate(new Date());
        }
    }, []);
    
    const daysWithTasks = useMemo(() => {
        return process.actionPlan?.map(item => item.dueDate ? new Date(item.dueDate) : null).filter((d): d is Date => !!d) || [];
    }, [process.actionPlan]);

    const tasksForSelectedDay = useMemo(() => {
        if (!selectedDate || !process.actionPlan) return [];
        return process.actionPlan.filter(item => 
            item.dueDate && isSameDay(new Date(item.dueDate), selectedDate)
        ).sort((a,b) => a.title.localeCompare(b.title));
    }, [selectedDate, process.actionPlan]);

    const sortedMentorships = useMemo(() => {
        return [...(process.mentorships || [])].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [process.mentorships]);

    const { totalTasks, completedTasks, progressPercentage } = useMemo(() => {
        const total = process.actionPlan?.length || 0;
        const completed = process.actionPlan?.filter(item => item.isCompleted).length || 0;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        return { totalTasks: total, completedTasks: completed, progressPercentage: percentage };
    }, [process.actionPlan]);


    const CalendarPlaceholder = () => (
        <div className="p-3">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-28" />
                    <div className="flex items-center space-x-1">
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-7 w-7" />
                    </div>
                </div>
                <Skeleton className="h-72 w-full" />
            </div>
        </div>
    );

    if (!hasMounted) {
        return (
            <div className="bg-background min-h-screen">
                <header className="py-4 px-6 border-b flex items-center justify-between bg-card">
                    <div className="flex items-center gap-3">
                        <Logo className="h-8 w-8 text-primary" />
                        <span className="font-semibold text-xl font-headline">Acompanhamento</span>
                    </div>
                    <div className='text-right'>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                </header>
                <main className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="font-headline text-2xl font-semibold mb-4">Plano de Ação</h2>
                             <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
                                    <CardDescription><Skeleton className="h-4 w-52" /></CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-full" />
                                </CardContent>
                            </Card>
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card><CardContent className="p-0"><CalendarPlaceholder /></CardContent></Card>
                                <Card>
                                    <CardHeader><CardTitle><Skeleton className="h-6 w-48" /></CardTitle></CardHeader>
                                    <CardContent className='space-y-4'>
                                        <div className="space-y-2">
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>
                    </div>
                    <aside className="space-y-6">
                        <h2 className="font-headline text-2xl font-semibold">Histórico de Mentorias</h2>
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </aside>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            <header className="py-4 px-6 border-b flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                    <Logo className="h-8 w-8 text-primary" />
                    <span className="font-semibold text-xl font-headline">Acompanhamento</span>
                </div>
                <div className='text-right'>
                    <h1 className="font-semibold text-lg">{process.contactName}</h1>
                    <p className="text-sm text-muted-foreground">{process.productName}</p>
                </div>
            </header>
            <main className="p-4 md:p-8 grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="font-headline text-2xl font-semibold mb-4">Plano de Ação</h2>
                        
                        {totalTasks > 0 && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Progresso Geral</CardTitle>
                                    <CardDescription>{completedTasks} de {totalTasks} tarefas concluídas.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <Progress value={progressPercentage} className="w-full" />
                                        <span className="font-semibold text-muted-foreground whitespace-nowrap">{Math.round(progressPercentage)}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                             <Card>
                                <CardContent className="p-0">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        className="rounded-md p-3"
                                        modifiers={{
                                            highlighted: daysWithTasks,
                                        }}
                                        modifiersClassNames={{
                                            highlighted: "bg-primary/20 text-primary-foreground rounded-md",
                                        }}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Tarefas para {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '...'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    {tasksForSelectedDay.length > 0 ? (
                                        tasksForSelectedDay.map(item => (
                                            <div key={item.id} className="flex items-start gap-3 p-3 border rounded-md bg-background">
                                                <Checkbox id={`task-${item.id}`} checked={item.isCompleted} className="mt-1" disabled />
                                                <div className="grid gap-1">
                                                    <label htmlFor={`task-${item.id}`} className="font-medium">{item.title}</label>
                                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa para este dia.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>

                <aside className="space-y-6">
                    <h2 className="font-headline text-2xl font-semibold">Histórico de Mentorias</h2>
                     {sortedMentorships.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {sortedMentorships.map(mentorship => (
                                <AccordionItem value={mentorship.id} key={mentorship.id}>
                                    <AccordionTrigger>
                                        Mentoria - {mentorship.createdAt ? format(new Date(mentorship.createdAt), 'dd/MM/yyyy') : 'Data não disponível'}
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Resumo (Gerado por IA)</h4>
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
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum registro de mentoria encontrado.
                        </p>
                    )}
                </aside>
            </main>
        </div>
    );
}

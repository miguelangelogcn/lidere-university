'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Checkbox } from './ui/checkbox';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { FollowUpProcess, ActionItem } from '@/lib/types';
import { updateFollowUpProcess } from '@/services/followUpService';
import { useToast } from '@/hooks/use-toast';
import { doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const actionItemSchema = z.object({
    title: z.string().min(3, 'O título é muito curto.'),
    description: z.string().min(3, 'A descrição é muito curta.'),
    dueDate: z.date({ required_error: 'A data é obrigatória.' }),
});

type ActionItemFormValues = z.infer<typeof actionItemSchema>;

type ActionPlanManagerProps = {
    process: FollowUpProcess;
    onSuccess: () => void;
};

export function ActionPlanManager({ process, onSuccess }: ActionPlanManagerProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<ActionItemFormValues>({
        resolver: zodResolver(actionItemSchema),
        defaultValues: {
            title: '',
            description: '',
            dueDate: undefined,
        },
    });

    const handleAddItem = async (data: ActionItemFormValues) => {
        setLoading(true);
        const newActionItem: ActionItem = {
            id: doc(collection(db, 'random')).id,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            isCompleted: false,
        };

        const updatedActionPlan = [...(process.actionPlan || []), newActionItem];

        try {
            await updateFollowUpProcess(process.id, { actionPlan: updatedActionPlan });
            toast({ title: 'Sucesso!', description: 'Plano de ação adicionado.' });
            form.reset({ title: '', description: '', dueDate: undefined });
            onSuccess();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao adicionar plano de ação.' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleToggleComplete = async (itemId: string) => {
        const updatedActionPlan = (process.actionPlan || []).map(item =>
            item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        try {
            await updateFollowUpProcess(process.id, { actionPlan: updatedActionPlan });
            toast({ title: 'Sucesso!', description: 'Status do item atualizado.' });
            onSuccess();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao atualizar status.' });
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        const updatedActionPlan = (process.actionPlan || []).filter(item => item.id !== itemId);
        try {
            await updateFollowUpProcess(process.id, { actionPlan: updatedActionPlan });
            toast({ title: 'Sucesso!', description: 'Item removido.' });
            onSuccess();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao remover item.' });
        }
    };

    const sortedActionPlan = [...(process.actionPlan || [])].sort((a, b) => {
        const dateA = a.dueDate?.seconds ? a.dueDate.seconds : Infinity;
        const dateB = b.dueDate?.seconds ? b.dueDate.seconds : Infinity;
        return dateA - dateB;
    });

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddItem)} className="p-4 border rounded-lg bg-muted/20 space-y-4">
                     <h4 className="font-semibold text-lg">Adicionar Nova Ação</h4>
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} placeholder="Título da ação" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} placeholder="Descreva a ação..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Data de Entrega</FormLabel>
                            <Popover><PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                        {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover><FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" disabled={loading}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ação
                    </Button>
                </form>
            </Form>

            <div className="space-y-4">
                <h3 className="font-semibold text-xl">Ações Propostas</h3>
                {sortedActionPlan.length > 0 ? (
                    <ul className="space-y-3">
                        {sortedActionPlan.map(item => (
                            <li key={item.id} className="flex items-start gap-4 p-4 border rounded-md bg-card">
                                <Checkbox id={`action-${item.id}`} checked={item.isCompleted} onCheckedChange={() => handleToggleComplete(item.id)} className="mt-1" />
                                <div className="flex-1 grid gap-1.5">
                                    <label htmlFor={`action-${item.id}`} className={cn("font-medium cursor-pointer", item.isCompleted && "line-through text-muted-foreground")}>
                                        {item.title}
                                    </label>
                                    <p className={cn("text-sm text-muted-foreground", item.isCompleted && "line-through")}>{item.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Vencimento: {item.dueDate?.seconds ? format(new Date(item.dueDate.seconds * 1000), 'dd/MM/yyyy') : 'Data inválida'}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">Nenhum plano de ação definido ainda.</p>
                )}
            </div>
        </div>
    );
}

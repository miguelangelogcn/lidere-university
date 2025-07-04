'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Product, OnboardingStep } from '@/lib/types';
import { getOnboardingSteps, updateOnboardingSteps } from '@/services/onboardingService';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const onboardingStepSchema = z.object({
  title: z.string().min(1, 'O título da etapa é obrigatório.'),
  description: z.string().min(1, 'A descrição da etapa é obrigatória.'),
  day: z.number(),
});

const onboardingSchema = z.object({
  steps: z.array(onboardingStepSchema),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

type EditOnboardingFormProps = {
  product: Product;
  onSuccess: () => void;
};

export function EditOnboardingForm({ product, onSuccess }: EditOnboardingFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      steps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  useEffect(() => {
    async function loadSteps() {
        setFetching(true);
        const steps = await getOnboardingSteps(product.id);
        const formValues = steps.map(({ title, description, day }) => ({ title, description, day }));
        form.reset({ steps: formValues });
        setFetching(false);
    }
    loadSteps();
  }, [product, form]);

  const onSubmit = async (data: OnboardingFormValues) => {
    setLoading(true);
    try {
        const stepsWithOrder = data.steps.reduce((acc, step) => {
            const day = step.day;
            const order = acc.filter(s => s.day === day).length;
            acc.push({ ...step, order });
            return acc;
        }, [] as Omit<OnboardingStep, 'id'>[]);

      await updateOnboardingSteps(product.id, product.name, stepsWithOrder);
      toast({ title: "Sucesso!", description: "Onboarding atualizado com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar onboarding.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = (day: number) => {
    append({
        title: '',
        description: '',
        day: day,
    });
  };
  
  if (fetching) {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  const days = Array.from({ length: 8 }, (_, i) => i); // D0 to D7

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
        <Accordion type="multiple" className="w-full" defaultValue={['0']}>
            {days.map(day => {
                const dayFields = fields
                    .map((field, index) => ({ ...field, originalIndex: index }))
                    .filter(field => (field as any).day === day);

                return (
                    <AccordionItem value={String(day)} key={day}>
                        <AccordionTrigger>Dia {day}</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            {dayFields.length > 0 ? (
                                dayFields.map((field) => (
                                    <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg bg-background/50">
                                        <div className="flex-grow space-y-3">
                                            <FormField
                                                control={form.control}
                                                name={`steps.${field.originalIndex}.title`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Título da Tarefa</FormLabel>
                                                        <FormControl><Input placeholder={`Título da Tarefa`} {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`steps.${field.originalIndex}.description`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Descrição</FormLabel>
                                                        <FormControl><Textarea placeholder="Descreva o que deve ser feito..." {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(field.originalIndex)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                            <span className="sr-only">Remover Tarefa</span>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa para este dia.</p>
                            )}
                             <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => handleAddStep(day)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Tarefa ao Dia {day}
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading || !form.formState.isDirty}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

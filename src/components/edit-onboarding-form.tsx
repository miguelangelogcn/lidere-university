'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { OnboardingStep, Product } from '@/lib/types';
import { getOnboardingSteps, updateOnboardingSteps } from '@/services/onboardingService';
import { Trash2, PlusCircle, GripVertical, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  steps: z.array(z.object({
    title: z.string().min(1, 'O título da etapa é obrigatório.'),
    description: z.string().min(1, 'A descrição da etapa é obrigatória.'),
  })),
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

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  useEffect(() => {
    async function loadSteps() {
        setFetching(true);
        const steps = await getOnboardingSteps(product.id);
        const sortedSteps = steps.sort((a,b) => a.order - b.order);
        form.reset({ steps: sortedSteps.map(({ title, description }) => ({ title, description })) });
        setFetching(false);
    }
    loadSteps();
  }, [product, form]);

  const onSubmit = async (data: OnboardingFormValues) => {
    setLoading(true);
    try {
        const stepsWithOrderAndId: Omit<OnboardingStep, 'id'>[] = data.steps.map((step, index) => ({
            ...step,
            order: index
        }));

      await updateOnboardingSteps(product.id, product.name, stepsWithOrderAndId);
      toast({ title: "Sucesso!", description: "Onboarding atualizado com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar onboarding.' });
    } finally {
      setLoading(false);
    }
  };
  
  if (fetching) {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
        <div>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg bg-background">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-8 cursor-grab" />
                <div className="flex-grow space-y-3">
                    <FormField
                      control={form.control}
                      name={`steps.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título da Etapa</FormLabel>
                          <FormControl>
                            <Input placeholder={`Título da Etapa ${index + 1}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`steps.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descreva o que deve ser feito nesta etapa..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Remover Etapa</span>
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => append({ title: '', description: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Etapa
          </Button>
          {form.formState.errors.steps?.root?.message && (
             <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.steps.root.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading || !form.formState.isDirty}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

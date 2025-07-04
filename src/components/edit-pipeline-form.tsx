'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Pipeline } from '@/lib/types';
import { updatePipeline } from '@/services/pipelineService';
import { Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const pipelineSchema = z.object({
  name: z.string().min(1, 'O nome do funil é obrigatório.'),
  stages: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'O nome da etapa é obrigatório.'),
  })).min(1, 'O funil deve ter pelo menos uma etapa.'),
});

type PipelineFormValues = z.infer<typeof pipelineSchema>;

type EditPipelineFormProps = {
  pipeline: Pipeline;
  onSuccess: () => void;
};

export function EditPipelineForm({ pipeline, onSuccess }: EditPipelineFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      name: pipeline.name,
      stages: pipeline.stages,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  const onSubmit = async (data: PipelineFormValues) => {
    setLoading(true);
    try {
      await updatePipeline(pipeline.id, {
          name: data.name,
          stages: data.stages,
      });
      toast({ title: "Sucesso!", description: "Funil atualizado com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar funil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Funil</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel>Etapas do Funil</FormLabel>
          <div className="space-y-3 mt-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 group">
                 <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <FormField
                  control={form.control}
                  name={`stages.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input placeholder={`Nome da Etapa ${index + 1}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            onClick={() => append({ name: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Etapa
          </Button>
          {form.formState.errors.stages?.root?.message && (
             <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.stages.root.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

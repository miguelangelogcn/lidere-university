
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateFollowUpProcess } from '@/services/followUpService';
import type { SerializableFollowUpProcess } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const followUpSchema = z.object({
  status: z.enum(['todo', 'doing', 'done']),
});

type FollowUpFormValues = z.infer<typeof followUpSchema>;

type EditFollowUpFormProps = {
  process: SerializableFollowUpProcess;
  onSuccess: () => void;
};

export function EditFollowUpForm({ process, onSuccess }: EditFollowUpFormProps) {
  const { toast } = useToast();

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      status: process.status,
    },
  });

  const onSubmit = async (data: FollowUpFormValues) => {
    try {
      await updateFollowUpProcess(process.id, { status: data.status });
      toast({ title: "Sucesso!", description: "Status do acompanhamento atualizado." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar o acompanhamento.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="doing">Fazendo</SelectItem>
                  <SelectItem value="done">Feito</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

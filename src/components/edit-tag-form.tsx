'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Tag } from '@/lib/types';
import { updateTag } from '@/services/tagService';
import { useToast } from "@/hooks/use-toast";

const tagSchema = z.object({
  name: z.string().min(1, 'O nome da tag é obrigatório.'),
});

type TagFormValues = z.infer<typeof tagSchema>;

type EditTagFormProps = {
  tag: Tag;
  onSuccess: () => void;
};

export function EditTagForm({ tag, onSuccess }: EditTagFormProps) {
  const { toast } = useToast();

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag.name,
    },
  });

  const onSubmit = async (data: TagFormValues) => {
    try {
      await updateTag(tag.id, data);
      toast({ title: "Sucesso!", description: "Tag atualizada com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar tag.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Tag</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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

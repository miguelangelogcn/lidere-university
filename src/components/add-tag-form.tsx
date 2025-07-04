'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createTag } from '@/services/tagService';
import { useToast } from "@/hooks/use-toast";

const tagSchema = z.object({
  name: z.string().min(1, 'O nome da tag é obrigatório.'),
});

type TagFormValues = z.infer<typeof tagSchema>;

type AddTagFormProps = {
  onSuccess: () => void;
};

export function AddTagForm({ onSuccess }: AddTagFormProps) {
  const { toast } = useToast();

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: TagFormValues) => {
    try {
      await createTag(data);
      toast({ title: "Sucesso!", description: "Tag criada com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao criar tag.' });
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
                <Input placeholder="Ex: Cliente de 1ª Compra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Criando...' : 'Criar Tag'}
        </Button>
      </form>
    </Form>
  );
}

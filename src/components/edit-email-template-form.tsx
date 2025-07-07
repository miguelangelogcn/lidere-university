'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { updateEmailTemplate } from '@/services/emailTemplateService';
import { useToast } from "@/hooks/use-toast";
import type { EmailTemplate } from '@/lib/types';

const templateSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  subject: z.string().min(1, 'O assunto é obrigatório.'),
  body: z.string().min(1, 'O corpo do email é obrigatório.'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

type EditEmailTemplateFormProps = {
  template: EmailTemplate;
  onSuccess: () => void;
};

export function EditEmailTemplateForm({ template, onSuccess }: EditEmailTemplateFormProps) {
  const { toast } = useToast();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template.name,
      subject: template.subject,
      body: template.body,
    },
  });

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      await updateEmailTemplate(template.id, data);
      toast({ title: "Sucesso!", description: "Modelo atualizado com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar modelo.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nome do Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl><Input value={template.slug} disabled /></FormControl>
            <FormDescription>O slug não pode ser alterado para não quebrar integrações.</FormDescription>
        </FormItem>
         <FormField control={form.control} name="subject" render={({ field }) => (
            <FormItem><FormLabel>Assunto do Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
         <FormField control={form.control} name="body" render={({ field }) => (
            <FormItem><FormLabel>Corpo do Email (HTML)</FormLabel><FormControl><Textarea {...field} rows={10} /></FormControl>
            <FormDescription>Variáveis disponíveis: {{name}}, {{email}}, {{password}}, {{loginUrl}}.</FormDescription><FormMessage /></FormItem>
        )}/>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

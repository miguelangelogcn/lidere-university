'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { createEmailTemplate } from '@/services/emailTemplateService';
import { useToast } from "@/hooks/use-toast";

const templateSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  slug: z.string().min(1, 'O slug é obrigatório.').regex(/^[a-z0-9-]+$/, 'O slug só pode conter letras minúsculas, números e hífens.'),
  subject: z.string().min(1, 'O assunto é obrigatório.'),
  body: z.string().min(1, 'O corpo do email é obrigatório.'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

type AddEmailTemplateFormProps = {
  onSuccess: () => void;
};

export function AddEmailTemplateForm({ onSuccess }: AddEmailTemplateFormProps) {
  const { toast } = useToast();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      slug: '',
      subject: '',
      body: '',
    },
  });

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      await createEmailTemplate(data);
      toast({ title: "Sucesso!", description: "Modelo criado com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao criar modelo.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nome do Modelo</FormLabel><FormControl><Input placeholder="Ex: Email de Boas-Vindas" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="slug" render={({ field }) => (
            <FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="ex: welcome-email" {...field} /></FormControl>
            <FormDescription>Identificador único usado pelo sistema. Ex: 'welcome-email'.</FormDescription><FormMessage /></FormItem>
        )}/>
         <FormField control={form.control} name="subject" render={({ field }) => (
            <FormItem><FormLabel>Assunto do Email</FormLabel><FormControl><Input placeholder="Seja bem-vindo(a) à Lidere University!" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
         <FormField control={form.control} name="body" render={({ field }) => (
            <FormItem><FormLabel>Corpo do Email (HTML)</FormLabel><FormControl><Textarea placeholder="<p>Olá {{name}},</p>" {...field} rows={10} /></FormControl>
            <FormDescription>{"Variáveis disponíveis: {{name}}, {{email}}, {{password}}, {{loginUrl}}."}</FormDescription><FormMessage /></FormItem>
        )}/>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Criando...' : 'Criar Modelo'}
        </Button>
      </form>
    </Form>
  );
}

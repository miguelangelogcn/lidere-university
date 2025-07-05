'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { grantStudentAccess } from '@/services/studentService';
import type { Contact } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const accessSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type AccessFormValues = z.infer<typeof accessSchema>;

type GrantStudentAccessFormProps = {
  contact: Contact;
  onSuccess: () => void;
};

export function GrantStudentAccessForm({ contact, onSuccess }: GrantStudentAccessFormProps) {
  const { toast } = useToast();

  const form = useForm<AccessFormValues>({
    resolver: zodResolver(accessSchema),
  });

  const onSubmit = async (data: AccessFormValues) => {
    try {
      await grantStudentAccess(contact, data.password);
      toast({ title: "Sucesso!", description: `Acesso criado para ${contact.name}.` });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
        <div>
            <p className="text-sm">Você está criando um acesso de aluno para:</p>
            <p className="font-semibold">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha de Acesso</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Crie uma senha para o aluno" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Criando Acesso...</> : 'Conceder Acesso'}
        </Button>
      </form>
    </Form>
  );
}

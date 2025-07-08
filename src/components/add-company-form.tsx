'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createCompany } from '@/services/companyService';
import { useToast } from "@/hooks/use-toast";

const companySchema = z.object({
  name: z.string().min(1, 'O nome da empresa é obrigatório.'),
});

type CompanyFormValues = z.infer<typeof companySchema>;

type AddCompanyFormProps = {
  onSuccess: () => void;
};

export function AddCompanyForm({ onSuccess }: AddCompanyFormProps) {
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      await createCompany(data);
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao criar empresa.' });
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
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Minha Empresa LTDA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Criando...' : 'Criar Empresa'}
        </Button>
      </form>
    </Form>
  );
}

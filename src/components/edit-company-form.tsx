'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { updateCompany } from '@/services/companyService';
import { useToast } from "@/hooks/use-toast";
import type { Company } from '@/lib/types';

const companySchema = z.object({
  name: z.string().min(1, 'O nome da empresa é obrigatório.'),
});

type CompanyFormValues = z.infer<typeof companySchema>;

type EditCompanyFormProps = {
  company: Company;
  onSuccess: () => void;
};

export function EditCompanyForm({ company, onSuccess }: EditCompanyFormProps) {
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
    },
  });

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      await updateCompany(company.id, data);
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar empresa.' });
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Caixa Inicial (R$)</FormLabel>
          <FormControl>
            <Input type="text" value={formatCurrency(company.initialCash || 0)} disabled />
          </FormControl>
          <FormDescription>
            O caixa inicial não pode ser alterado após o cadastro.
          </FormDescription>
        </FormItem>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

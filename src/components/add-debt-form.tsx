'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { getCompanies } from '@/services/companyService';
import { createDebt } from '@/services/debtService';
import type { Company } from '@/lib/types';

const debtSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  creditor: z.string().min(1, 'O nome do credor é obrigatório.'),
  originalAmount: z.coerce.number().positive('O valor original deve ser positivo.'),
  interestRate: z.coerce.number().min(0, 'A taxa de juros não pode ser negativa.'),
  companyId: z.string().min(1, 'A empresa é obrigatória.'),
});

type DebtFormValues = z.infer<typeof debtSchema>;

type AddDebtFormProps = {
  onSuccess: () => void;
};

export function AddDebtForm({ onSuccess }: AddDebtFormProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
  });

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const companyList = await getCompanies();
        setCompanies(companyList);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar empresas.' });
      } finally {
        setLoadingCompanies(false);
      }
    }
    fetchCompanies();
  }, [toast]);

  const onSubmit = async (data: DebtFormValues) => {
    const company = companies.find(c => c.id === data.companyId);
    if (!company) {
        toast({ variant: "destructive", title: "Erro!", description: "Empresa selecionada é inválida."});
        return;
    }

    try {
      await createDebt({ ...data, companyName: company.name });
      toast({ title: "Sucesso!", description: "Dívida registrada." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao registrar dívida.' });
    }
  };
  
  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Descrição da Dívida</FormLabel><FormControl><Input placeholder="Ex: Empréstimo bancário" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="creditor" render={({ field }) => (
            <FormItem><FormLabel>Credor</FormLabel><FormControl><Input placeholder="Ex: Banco XYZ" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="originalAmount" render={({ field }) => (
                <FormItem><FormLabel>Valor Original (R$)</FormLabel><FormControl><Input type="number" placeholder="50000.00" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="interestRate" render={({ field }) => (
                <FormItem><FormLabel>Juros (% a.m.)</FormLabel><FormControl><Input type="number" placeholder="1.5" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        <FormField control={form.control} name="companyId" render={({ field }) => (
            <FormItem><FormLabel>Empresa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCompanies}>
                <FormControl><SelectTrigger><SelectValue placeholder={loadingCompanies ? "Carregando..." : "Selecione a empresa"} /></SelectTrigger></FormControl>
                <SelectContent>{companies.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select><FormMessage /></FormItem>
        )}/>
        
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          {form.formState.isSubmitting ? 'Registrando...' : 'Registrar Dívida'}
        </Button>
      </form>
    </Form>
  );
}

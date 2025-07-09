'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createTaxPayable } from '@/lib/actions/taxActions';
import type { Company } from '@/lib/types';

const taxPaymentSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
});

type TaxPaymentFormValues = z.infer<typeof taxPaymentSchema>;

type GenerateTaxPaymentFormProps = {
  taxAmount: number;
  company: Company;
  periodDescription: string;
  onSuccess: () => void;
};

export function GenerateTaxPaymentForm({ taxAmount, company, periodDescription, onSuccess }: GenerateTaxPaymentFormProps) {
  const { toast } = useToast();
  
  const form = useForm<TaxPaymentFormValues>({
    resolver: zodResolver(taxPaymentSchema),
    defaultValues: {
        description: `Imposto sobre Faturamento - ${periodDescription}`,
        dueDate: undefined,
    }
  });

  const onSubmit = async (data: TaxPaymentFormValues) => {
    try {
      const result = await createTaxPayable({
        ...data,
        amount: taxAmount,
        companyId: company.id,
        companyName: company.name,
      });

      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        onSuccess();
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao gerar conta a pagar.' });
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormItem>
            <FormLabel>Valor do Imposto (R$)</FormLabel>
            <FormControl>
                <Input value={formatCurrency(taxAmount)} disabled />
            </FormControl>
        </FormItem>
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>Data de Vencimento</FormLabel>
                <Popover><PopoverTrigger asChild>
                    <FormControl>
                        <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent></Popover>
                <FormMessage />
            </FormItem>
        )}/>
        
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          {form.formState.isSubmitting ? 'Gerando...' : 'Gerar Conta a Pagar'}
        </Button>
      </form>
    </Form>
  );
}

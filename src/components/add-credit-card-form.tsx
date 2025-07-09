'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { createCreditCard } from '@/services/creditCardService';
import { useToast } from "@/hooks/use-toast";
import type { Company } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const creditCardSchema = z.object({
  cardName: z.string().min(1, 'O nome do cartão é obrigatório.'),
  totalLimit: z.coerce.number().min(0, 'O limite total não pode ser negativo.'),
  availableLimit: z.coerce.number().min(0, "O limite disponível não pode ser negativo."),
  invoiceDueDate: z.coerce.number().int().min(1, 'O dia deve ser entre 1 e 31.').max(31, 'O dia deve ser entre 1 e 31.'),
  cardLastFourDigits: z.string().length(4, 'Deve conter 4 dígitos.').optional().or(z.literal('')),
}).refine(data => data.availableLimit <= data.totalLimit, {
    message: "O limite disponível não pode ser maior que o limite total.",
    path: ["availableLimit"],
});


type CreditCardFormValues = z.infer<typeof creditCardSchema>;

type AddCreditCardFormProps = {
  company: Company;
  onSuccess: () => void;
};

export function AddCreditCardForm({ company, onSuccess }: AddCreditCardFormProps) {
  const { toast } = useToast();

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      cardName: '',
      totalLimit: undefined,
      availableLimit: undefined,
      invoiceDueDate: undefined,
      cardLastFourDigits: '',
    },
  });

  const onSubmit = async (data: CreditCardFormValues) => {
    try {
      const { totalLimit, availableLimit, ...restOfData } = data;
      const initialInvoiceAmount = (totalLimit > 0 && availableLimit < totalLimit) ? totalLimit - availableLimit : 0;

      await createCreditCard({
        ...restOfData,
        cardLimit: totalLimit, // `cardLimit` in DB is the total limit
        companyId: company.id,
        companyName: company.name,
        cardLastFourDigits: data.cardLastFourDigits || undefined,
        initialInvoiceAmount: initialInvoiceAmount > 0 ? initialInvoiceAmount : undefined,
      });

      toast({ title: "Sucesso!", description: "Cartão de crédito adicionado." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao adicionar cartão.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField control={form.control} name="cardName" render={({ field }) => (
          <FormItem><FormLabel>Nome do Cartão</FormLabel><FormControl><Input placeholder="Ex: Inter Black" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="cardLastFourDigits" render={({ field }) => (
          <FormItem><FormLabel>Últimos 4 Dígitos (Opcional)</FormLabel><FormControl><Input placeholder="1234" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="totalLimit" render={({ field }) => (
            <FormItem><FormLabel>Limite Total (R$)</FormLabel><FormControl><Input type="number" placeholder="10000.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="availableLimit" render={({ field }) => (
            <FormItem><FormLabel>Limite Disponível (R$)</FormLabel><FormControl><Input type="number" placeholder="8500.00" {...field} value={field.value ?? ''} /></FormControl>
            <FormDescription className="text-xs">A diferença será lançada como fatura atual.</FormDescription>
            <FormMessage /></FormItem>
          )}/>
        </div>
        <FormField control={form.control} name="invoiceDueDate" render={({ field }) => (
            <FormItem><FormLabel>Dia do Vencimento da Fatura</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit" className="w-full bg-accent" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          Salvar Cartão
        </Button>
      </form>
    </Form>
  );
}

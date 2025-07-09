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
  cardLimit: z.coerce.number().min(0, 'O limite não pode ser negativo.'),
  invoiceDueDate: z.coerce.number().int().min(1, 'O dia deve ser entre 1 e 31.').max(31, 'O dia deve ser entre 1 e 31.'),
  cardLastFourDigits: z.string().length(4, 'Deve conter 4 dígitos.').optional().or(z.literal('')),
  initialInvoiceAmount: z.preprocess(
    (a) => (a === '' ? undefined : a),
    z.coerce.number({invalid_type_error: "Valor inválido"}).min(0, "O valor não pode ser negativo").optional()
  ),
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
      cardLimit: undefined,
      invoiceDueDate: undefined,
      cardLastFourDigits: '',
      initialInvoiceAmount: undefined,
    },
  });

  const onSubmit = async (data: CreditCardFormValues) => {
    try {
      await createCreditCard({
        ...data,
        companyId: company.id,
        companyName: company.name,
        cardLastFourDigits: data.cardLastFourDigits || undefined,
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
          <FormItem><FormLabel>Últimos 4 Dígitos</FormLabel><FormControl><Input placeholder="1234" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="cardLimit" render={({ field }) => (
            <FormItem><FormLabel>Limite Disponível (R$)</FormLabel><FormControl><Input type="number" placeholder="10000.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="invoiceDueDate" render={({ field }) => (
            <FormItem><FormLabel>Dia do Vencimento</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )}/>
        </div>
        <FormField control={form.control} name="initialInvoiceAmount" render={({ field }) => (
          <FormItem><FormLabel>Fatura Atual (Opcional)</FormLabel><FormControl><Input type="number" placeholder="500.00" {...field} value={field.value ?? ''} /></FormControl>
          <FormDescription>Se preenchido, lançará este valor em Contas a Pagar.</FormDescription><FormMessage /></FormItem>
        )}/>
        <Button type="submit" className="w-full bg-accent" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          Salvar Cartão
        </Button>
      </form>
    </Form>
  );
}

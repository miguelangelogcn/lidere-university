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
import { negotiateDebt } from '@/services/debtService';
import type { SerializableDebt } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';
import Link from 'next/link';

const negotiationSchema = z.object({
  numberOfInstallments: z.coerce.number().int().positive('O número de parcelas deve ser positivo.'),
  installmentAmount: z.coerce.number().positive('O valor da parcela deve ser positivo.'),
  firstInstallmentDate: z.date({ required_error: 'A data é obrigatória.' }),
});

type NegotiationFormValues = z.infer<typeof negotiationSchema>;

type EditDebtFormProps = {
  debt: SerializableDebt;
  onSuccess: () => void;
};

export function EditDebtForm({ debt, onSuccess }: EditDebtFormProps) {
  const { toast } = useToast();
  
  const form = useForm<NegotiationFormValues>({
    resolver: zodResolver(negotiationSchema),
  });

  const onSubmit = async (data: NegotiationFormValues) => {
    try {
      await negotiateDebt(debt.id, {
          ...data,
          firstInstallmentDate: new Date(data.firstInstallmentDate)
      });
      toast({ title: "Sucesso!", description: "Dívida negociada e parcelas geradas em Contas a Pagar." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao negociar dívida.' });
    }
  };

  const isNegotiated = debt.status === 'negociada' || debt.status === 'paga';
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isNegotiated) {
    return (
        <div className="space-y-4 py-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Dívida já Negociada</AlertTitle>
                <AlertDescription>
                    Esta dívida já foi negociada e as parcelas foram geradas.
                </AlertDescription>
            </Alert>
            <Card>
                <CardHeader><CardTitle className="text-lg">Detalhes da Negociação</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Parcelas:</strong> {debt.negotiationDetails?.numberOfInstallments}</p>
                    <p><strong>Valor da Parcela:</strong> {formatCurrency(debt.negotiationDetails?.installmentAmount || 0)}</p>
                    <p><strong>Primeiro Vencimento:</strong> {debt.negotiationDetails?.firstInstallmentDate ? format(new Date(debt.negotiationDetails.firstInstallmentDate), 'dd/MM/yyyy') : 'N/A'}</p>
                    <Button asChild variant="link" className="p-0 h-auto">
                        <Link href="/contas?tab=payable">Ver em Contas a Pagar</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
        <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="numberOfInstallments" render={({ field }) => (
                <FormItem><FormLabel>Nº de Parcelas</FormLabel><FormControl><Input type="number" placeholder="12" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="installmentAmount" render={({ field }) => (
                <FormItem><FormLabel>Valor da Parcela (R$)</FormLabel><FormControl><Input type="number" placeholder="500.00" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="firstInstallmentDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data da 1ª Parcela</FormLabel>
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
        </div>
        
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          {form.formState.isSubmitting ? 'Gerando Parcelas...' : 'Confirmar Negociação'}
        </Button>
      </form>
    </Form>
  );
}

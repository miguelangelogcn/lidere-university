
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { debtSchema, type DebtFormValues, createDebt } from '@/lib/actions/debtActions';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import type { Company } from '@/lib/types';
import { getCompanies } from '@/services/companyService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarIcon } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';


type AddDebtFormProps = {
  onSuccess: () => void;
};

export function AddDebtForm({ onSuccess }: AddDebtFormProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      description: '',
      creditor: '',
      interestRate: 0,
      isInstallment: false,
    },
  });

  const isInstallment = form.watch('isInstallment');

  useEffect(() => {
    getCompanies().then(setCompanies).finally(() => setLoadingCompanies(false));
  }, []);
  
  const onSubmit = async (data: DebtFormValues) => {
    try {
        const selectedCompany = companies.find(c => c.id === data.companyId);
        if (!selectedCompany) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Empresa não encontrada.' });
            return;
        }
        await createDebt({ ...data, companyName: selectedCompany.name });
        toast({ title: "Sucesso!", description: "Dívida e suas parcelas foram criadas como contas a pagar." });
        onSuccess();
    } catch (err: any) {
        toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao cadastrar dívida.' });
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Ex: Financiamento de Veículo" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="creditor" render={({ field }) => (
                <FormItem><FormLabel>Credor</FormLabel><FormControl><Input placeholder="Ex: Banco XYZ" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="companyId" render={({ field }) => (
                <FormItem><FormLabel>Empresa</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={loadingCompanies}>
                    <FormControl><SelectTrigger><SelectValue placeholder={loadingCompanies ? "Carregando..." : "Selecione a empresa"} /></SelectTrigger></FormControl>
                    <SelectContent>{companies.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                </Select><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="totalAmount" render={({ field }) => (
                    <FormItem><FormLabel>Valor Total (R$)</FormLabel><FormControl><Input type="number" placeholder="50000.00" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="interestRate" render={({ field }) => (
                    <FormItem><FormLabel>Taxa de Juros Anual (%)</FormLabel><FormControl><Input type="number" placeholder="12" {...field} /></FormControl><FormDescription className="text-xs">Ex: 12 para 12% a.a.</FormDescription><FormMessage /></FormItem>
                )}/>
            </div>
            
            <FormField control={form.control} name="isInstallment" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} /></FormControl>
                    <div className="space-y-1 leading-none"><FormLabel>É uma dívida parcelada?</FormLabel></div>
                </FormItem>
            )}/>

            {isInstallment && (
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="totalInstallments" render={({ field }) => (
                        <FormItem><FormLabel>Nº de Parcelas</FormLabel><FormControl><Input type="number" placeholder="12" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="firstDueDate" render={({ field }) => (
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
            )}
             <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                Cadastrar Dívida
            </Button>
        </form>
    </Form>
  )
}

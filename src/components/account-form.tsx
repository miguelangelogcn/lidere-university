'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCompanies } from '@/services/companyService';
import { createAccount, updateAccount } from '@/services/accountsService';
import type { Company, SerializableAccount } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { addMonths, addYears } from 'date-fns';


const accountSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  companyId: z.string().min(1, 'A empresa é obrigatória.'),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  isRecurring: z.boolean().default(false),
  recurrence: z.object({
    frequency: z.enum(['monthly', 'yearly']),
    endDate: z.date().optional().nullable(),
  }).optional(),
  notes: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

type AccountFormProps = {
  accountType: 'payable' | 'receivable';
  account?: SerializableAccount | null;
  onSuccess: () => void;
};

export function AccountForm({ accountType, account, onSuccess }: AccountFormProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      description: account?.description || '',
      amount: account?.amount || undefined,
      companyId: account?.companyId || '',
      dueDate: account?.dueDate ? new Date(account.dueDate) : undefined,
      isRecurring: account?.isRecurring || false,
      recurrence: {
        frequency: account?.recurrence?.frequency || 'monthly',
        endDate: account?.recurrence?.endDate ? new Date(account.recurrence.endDate) : undefined,
      },
      notes: account?.notes || '',
    },
  });
  
  const isRecurring = form.watch('isRecurring');
  const isEditing = !!account;

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

  const onSubmit = async (data: AccountFormValues) => {
    const company = companies.find(c => c.id === data.companyId);
    if (!company) {
        toast({ variant: "destructive", title: "Erro!", description: "Empresa selecionada é inválida."});
        return;
    }

    try {
      if (isEditing) {
        // Update logic
        await updateAccount(accountType, account.id, { ...data, companyName: company.name });
        toast({ title: "Sucesso!", description: "Conta atualizada." });
      } else {
        // Create logic
        const accountData = { ...data, companyName: company.name };
        
        if (data.isRecurring && data.recurrence?.frequency) {
            let currentDate = new Date(data.dueDate);
            const endDate = data.recurrence.endDate ? new Date(data.recurrence.endDate) : addYears(currentDate, 5); // Limit to 5 years if no end date
            
            while (currentDate <= endDate) {
                await createAccount(accountType, { ...accountData, dueDate: currentDate });
                if (data.recurrence.frequency === 'monthly') {
                    currentDate = addMonths(currentDate, 1);
                } else {
                    currentDate = addYears(currentDate, 1);
                }
            }
             toast({ title: "Sucesso!", description: "Contas recorrentes criadas." });
        } else {
             await createAccount(accountType, { ...accountData, dueDate: data.dueDate });
             toast({ title: "Sucesso!", description: "Conta criada." });
        }
      }
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao salvar conta.' });
    }
  };
  
  return (
     <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Ex: Aluguel do escritório" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" placeholder="1500.00" {...field} /></FormControl><FormMessage /></FormItem>
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
        </div>
        <FormField control={form.control} name="companyId" render={({ field }) => (
            <FormItem><FormLabel>Empresa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCompanies}>
                <FormControl><SelectTrigger><SelectValue placeholder={loadingCompanies ? "Carregando..." : "Selecione a empresa"} /></SelectTrigger></FormControl>
                <SelectContent>{companies.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select><FormMessage /></FormItem>
        )}/>
         <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais sobre a conta..." {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        {!isEditing && (
            <Collapsible><CollapsibleTrigger asChild>
                <FormField control={form.control} name="isRecurring" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none"><FormLabel>É uma conta recorrente?</FormLabel>
                        <FormDescription>Marque para criar múltiplas contas baseadas numa frequência.</FormDescription></div>
                    </FormItem>
                )}/>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="recurrence.frequency" render={({ field }) => (
                        <FormItem><FormLabel>Frequência</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
                          </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="recurrence.endDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Data Final</FormLabel>
                           <Popover><PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                        {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Sem data final</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover>
                           <FormDescription className="text-xs">Opcional. Se não definida, serão criadas por 5 anos.</FormDescription>
                          <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </CollapsibleContent></Collapsible>
        )}
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          {isEditing ? 'Salvar Alterações' : 'Criar Conta(s)'}
        </Button>
      </form>
    </Form>
  );
}

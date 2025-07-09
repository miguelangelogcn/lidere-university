
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
import { CalendarIcon, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCompanies } from '@/services/companyService';
import { createAccount, updateAccount } from '@/services/accountsService';
import { getCreditCardsByCompany } from '@/services/creditCardService';
import type { Company, SerializableAccount, CreditCard } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const baseSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  companyId: z.string().min(1, 'A empresa é obrigatória.'),
  category: z.string().optional(),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  expectedPaymentDate: z.date().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrence: z.object({
    frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'quarterly', 'semiannually', 'yearly']),
    endDate: z.date().optional().nullable(),
  }).optional(),
  notes: z.string().optional(),
  isCreditCardExpense: z.boolean().default(false),
  creditCardId: z.string().optional(),
  taxRate: z.coerce.number().min(0, "A alíquota não pode ser negativa.").optional(),
});

const standardAccountSchema = baseSchema.extend({
    isCalculatedTax: z.literal(false).default(false),
    amount: z.coerce.number().positive('O valor deve ser positivo.'),
});

const taxAccountSchema = baseSchema.extend({
    isCalculatedTax: z.literal(true),
    amount: z.number().optional(), // Amount is not needed from form
});

const accountSchema = z.discriminatedUnion("isCalculatedTax", [standardAccountSchema, taxAccountSchema]).refine(data => {
    if (data.isCreditCardExpense) return !!data.creditCardId;
    return true;
}, { message: "Selecione um cartão de crédito.", path: ["creditCardId"] });


type AccountFormValues = z.infer<typeof accountSchema>;

type AccountFormProps = {
  accountType: 'payable' | 'receivable';
  account?: SerializableAccount | null;
  onSuccess: () => void;
  scope: 'single' | 'future';
};

const payableCategories = [
    'Folha de Pagamentos',
    'Marketing e Vendas',
    'Software e Ferramentas',
    'Infraestrutura (Aluguel, Contas)',
    'Impostos e Taxas',
    'Fornecedores',
    'Pró-labore',
    'Cartão de Crédito',
    'Outras Despesas',
];

const receivableCategories = [
    'Venda de Produto',
    'Venda de Serviço',
    'Outras Receitas',
];

export function AccountForm({ accountType, account, onSuccess, scope = 'single' }: AccountFormProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account ? {
      isCalculatedTax: false, // Editing calculated tax is not supported
      description: account.description || '',
      amount: account.amount ?? undefined,
      companyId: account.companyId || '',
      category: account.category || '',
      dueDate: new Date(account.dueDate),
      expectedPaymentDate: account.expectedPaymentDate ? new Date(account.expectedPaymentDate) : null,
      isRecurring: account.isRecurring || false,
      recurrence: {
        frequency: account.recurrence?.frequency || 'monthly',
        endDate: account.recurrence?.endDate ? new Date(account.recurrence.endDate) : undefined,
      },
      notes: account.notes || '',
      isCreditCardExpense: !!account.creditCardId,
      creditCardId: account.creditCardId || '',
      taxRate: account.taxRate ?? undefined,
    } : {
        isCalculatedTax: false,
        amount: undefined,
        description: '',
        companyId: '',
        category: '',
        isRecurring: false,
        isCreditCardExpense: false,
    },
  });
  
  const isCalculatedTax = form.watch('isCalculatedTax');
  const isRecurring = form.watch('isRecurring');
  const isCreditCardExpense = form.watch('isCreditCardExpense');
  const selectedCompanyId = form.watch('companyId');

  const isEditing = !!account;
  const categories = accountType === 'payable' ? payableCategories : receivableCategories;
  const isPayable = accountType === 'payable';
  const isReceivable = accountType === 'receivable';

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const companyList = await getCompanies();
        setCompanies(companyList);
        if (!account && companyList.length > 0) {
            form.setValue('companyId', companyList[0].id);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar empresas.' });
      } finally {
        setLoadingCompanies(false);
      }
    }
    fetchCompanies();
  }, [toast, form, account]);

  useEffect(() => {
    if (!selectedCompanyId || !isPayable) {
        setCreditCards([]);
        form.setValue('creditCardId', undefined);
        return;
    }
    
    async function fetchCreditCards() {
        setLoadingCards(true);
        try {
            const cardList = await getCreditCardsByCompany(selectedCompanyId);
            setCreditCards(cardList);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar cartões de crédito.' });
        } finally {
            setLoadingCards(false);
        }
    }
    fetchCreditCards();
  }, [selectedCompanyId, toast, isPayable, form]);

    useEffect(() => {
        if (isCalculatedTax) {
            form.setValue('category', 'Impostos e Taxas');
        }
    }, [isCalculatedTax, form]);


  const onSubmit = async (data: AccountFormValues) => {
    const company = companies.find(c => c.id === data.companyId);
    if (!company) {
        toast({ variant: "destructive", title: "Erro!", description: "Empresa selecionada é inválida."});
        return;
    }

    let submissionData: Partial<AccountFormValues> & { creditCardName?: string, amount?: number } = { ...data };

    if (submissionData.isCreditCardExpense && submissionData.creditCardId) {
        const card = creditCards.find(c => c.id === submissionData.creditCardId);
        submissionData.creditCardName = card?.cardName;
    } else {
        submissionData.creditCardId = undefined;
        submissionData.creditCardName = undefined;
    }
    
    try {
      if (isEditing) {
        await updateAccount(account.id, { ...submissionData, companyName: company.name }, scope);
        toast({ title: "Sucesso!", description: "Conta(s) atualizada(s)." });
      } else {
        const accountData: any = { ...submissionData, companyName: company.name, isCalculatedTax };
        
        if (data.isRecurring && data.recurrence?.frequency) {
            await createAccount(accountType, accountData, true);
            toast({ title: "Sucesso!", description: "Contas recorrentes criadas." });
        } else {
             await createAccount(accountType, { ...accountData, dueDate: data.dueDate }, false);
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
        
        {!isEditing && isPayable && (
            <FormField control={form.control} name="isCalculatedTax" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} /></FormControl>
                    <div className="space-y-1 leading-none"><FormLabel>É um imposto com cálculo automático?</FormLabel></div>
                </FormItem>
            )}/>
        )}

        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Ex: Aluguel do escritório" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        
        {isCalculatedTax ? (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Cálculo Automático de Imposto</AlertTitle>
                <AlertDescription>
                    O valor será calculado com base no faturamento e alíquotas do mês anterior à data de vencimento. Salve a conta para ver o valor.
                </AlertDescription>
            </Alert>
        ) : (
             <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" placeholder="1500.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
            )}/>
        )}

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="companyId" render={({ field }) => (
                <FormItem><FormLabel>Empresa</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={loadingCompanies}>
                    <FormControl><SelectTrigger><SelectValue placeholder={loadingCompanies ? "Carregando..." : "Selecione a empresa"} /></SelectTrigger></FormControl>
                    <SelectContent>{companies.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                </Select><FormMessage /></FormItem>
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

        {!isCalculatedTax && (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="expectedPaymentDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Data Prev. de Recebimento</FormLabel>
                            <Popover><PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                        {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data (opcional)</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                 {isReceivable && (
                    <FormField control={form.control} name="taxRate" render={({ field }) => (
                        <FormItem><FormLabel>Alíquota de Imposto (%)</FormLabel><FormControl><Input type="number" placeholder="5" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormDescription>Informe a alíquota de imposto (ex: 5 para 5%) que incide sobre esta receita. Opcional.</FormDescription><FormMessage /></FormItem>
                    )}/>
                )}
            </>
        )}

        {isPayable && !isCalculatedTax && (
            <div className="space-y-4 rounded-md border p-4">
                <FormField
                    control={form.control}
                    name="isCreditCardExpense"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked) form.setValue('creditCardId', undefined);
                            }} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>É uma despesa de cartão de crédito?</FormLabel></div>
                        </FormItem>
                    )}
                />
                {isCreditCardExpense && (
                    <FormField
                        control={form.control}
                        name="creditCardId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cartão de Crédito</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={loadingCards || !selectedCompanyId}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={
                                                loadingCards ? "Carregando cartões..." :
                                                !selectedCompanyId ? "Selecione uma empresa primeiro" :
                                                creditCards.length === 0 ? "Nenhum cartão cadastrado" :
                                                "Selecione o cartão"
                                            } />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {creditCards.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.cardName} (**** {c.cardLastFourDigits})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        )}
         <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais sobre a conta..." {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        
        {isEditing && account.isRecurring && (
            <FormDescription>A edição de recorrência não está disponível para contas recorrentes. Para alterar, exclua e crie a série novamente.</FormDescription>
        )}
        
        {(!isEditing || isCalculatedTax) && (
          <>
            <FormField control={form.control} name="isRecurring" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isCalculatedTax && isEditing} />
                    </FormControl>
                    <div className="space-y-1 leading-none"><FormLabel>É uma conta recorrente?</FormLabel>
                    <FormDescription>Marque para criar múltiplas contas baseadas numa frequência.</FormDescription></div>
                </FormItem>
            )}/>

            {isRecurring && (
              <div className="space-y-4 pt-4 border-t p-4 rounded-b-md border-x border-b -mt-4">
                  <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="recurrence.frequency" render={({ field }) => (
                          <FormItem><FormLabel>Frequência</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="bi-weekly">Quinzenal</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                  <SelectItem value="quarterly">Trimestral</SelectItem>
                                  <SelectItem value="semiannually">Semestral</SelectItem>
                                  <SelectItem value="yearly">Anual</SelectItem>
                              </SelectContent>
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
              </div>
            )}
          </>
        )}
        
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          {isEditing ? 'Salvar Alterações' : 'Criar Conta(s)'}
        </Button>
      </form>
    </Form>
  );
}

    

'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Check, Repeat, AlertTriangle, Building2, Filter, CalendarIcon, X, CreditCard, Receipt, DollarSign, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { SerializableAccount, Company } from '@/lib/types';
import { getAccounts, updateAccount, deleteAccount, getPaidReceivablesForPeriod } from '@/services/accountsService';
import { getCompanies } from '@/services/companyService';
import { AccountForm } from '@/components/account-form';
import { format, isPast, isToday, startOfMonth, endOfMonth, addDays, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { GenerateTaxPaymentForm } from '@/components/generate-tax-payment-form';
import { Alert, AlertTitle as AlertTitleUI } from '@/components/ui/alert';


const TaxCalculationDialogContent = ({ company, onSuccess }: { company: Company; onSuccess: () => void; }) => {
    const [isGenerateFormOpen, setIsGenerateFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [taxData, setTaxData] = useState<{ totalRevenue: number; totalTax: number; receivables: SerializableAccount[] }>({ totalRevenue: 0, totalTax: 0, receivables: [] });
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
    });
    
    useEffect(() => {
        async function fetchTaxData() {
            if (!company || !date?.from) {
                setTaxData({ totalRevenue: 0, totalTax: 0, receivables: [] });
                return;
            }
            setLoading(true);
            try {
                const toEndOfDay = date.to ? new Date(date.to) : new Date(date.from);
                toEndOfDay.setHours(23, 59, 59, 999);
                const paidReceivables = await getPaidReceivablesForPeriod(company.id, date.from, toEndOfDay);
                const totalRevenue = paidReceivables.reduce((acc, r) => acc + r.amount, 0);
                const totalTax = paidReceivables.reduce((acc, r) => {
                    const tax = r.taxRate ? (r.amount * r.taxRate) / 100 : 0;
                    return acc + tax;
                }, 0);
                setTaxData({ totalRevenue, totalTax, receivables: paidReceivables });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao calcular impostos.' });
            } finally {
                setLoading(false);
            }
        }
        fetchTaxData();
    }, [company, date, toast]);

    const handleFormSuccess = () => {
        setIsGenerateFormOpen(false);
        onSuccess();
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const periodDescription = date?.from && date?.to ? `${format(date.from, 'dd/MM/yy')} - ${format(date.to, 'dd/MM/yy')}` : 'Período selecionado';

    return (
        <>
            <DialogHeader className='p-6'>
                <DialogTitle>Apuração de Imposto sobre Faturamento</DialogTitle>
                <DialogDescription>Calcule o imposto sobre as receitas pagas em um período e gere uma conta a pagar para a guia de recolhimento.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 p-6 pt-0 max-h-[calc(80vh-10rem)] overflow-y-auto">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="tax-date">Período de Apuração</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="tax-date" variant={"outline"} className={cn("w-full md:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date?.from ? (date.to ? (<>{format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}</>) : (format(date.from, "dd/MM/yy"))) : (<span>Selecione um período</span>)}</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Faturado (Recebido no Período)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(taxData.totalRevenue)}</div></CardContent>
                    </Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Imposto a Pagar</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-destructive">{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(taxData.totalTax)}</div></CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Base de Cálculo</CardTitle>
                                <CardDescription>Receitas pagas no período selecionado que compõem a base de cálculo.</CardDescription>
                            </div>
                            <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={taxData.totalTax <= 0} onClick={() => setIsGenerateFormOpen(true)}>
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Gerar Guia de Imposto</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className='text-right'>Valor Recebido</TableHead><TableHead className='text-right'>Alíquota (%)</TableHead><TableHead className='text-right'>Valor do Imposto</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : taxData.receivables.length > 0 ? (
                                        taxData.receivables.map(receivable => {
                                            const taxValue = receivable.taxRate ? (receivable.amount * receivable.taxRate) / 100 : 0;
                                            return (<TableRow key={receivable.id}><TableCell className="font-medium">{receivable.description}</TableCell><TableCell className="text-right">{formatCurrency(receivable.amount)}</TableCell><TableCell className="text-right">{receivable.taxRate?.toFixed(2) || '0.00'}%</TableCell><TableCell className="text-right font-medium">{formatCurrency(taxValue)}</TableCell></TableRow>)
                                        })
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma receita encontrada para o período.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {taxData.receivables.filter(r => !r.taxRate || r.taxRate === 0).length > 0 && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTitleUI>Atenção!</AlertTitleUI>
                                <CardDescription>
                                    Existem {taxData.receivables.filter(r => !r.taxRate || r.taxRate === 0).length} recebimentos sem alíquota de imposto definida neste período. O valor do imposto pode estar incorreto.
                                </CardDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isGenerateFormOpen} onOpenChange={setIsGenerateFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerar Guia de Imposto</DialogTitle>
                        <DialogDescription>Uma nova conta a pagar será criada com o valor do imposto calculado.</DialogDescription>
                    </DialogHeader>
                    {company && <GenerateTaxPaymentForm taxAmount={taxData.totalTax} company={company} periodDescription={periodDescription} onSuccess={handleFormSuccess} />}
                </DialogContent>
            </Dialog>
        </>
    );
};


const AccountsManager = ({ accountType }: { accountType: 'payable' | 'receivable' }) => {
    const [accounts, setAccounts] = useState<SerializableAccount[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isScopeDialogOpen, setIsScopeDialogOpen] = useState(false);
    const [scopeAction, setScopeAction] = useState<'edit' | 'delete' | null>(null);
    const [selectedScope, setSelectedScope] = useState<'single' | 'future'>('single');
    const [accountForAction, setAccountForAction] = useState<SerializableAccount | null>(null);
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accountsData, companiesData] = await Promise.all([
                getAccounts(accountType),
                getCompanies()
            ]);
            setAccounts(accountsData);
            setCompanies(companiesData);
            if (companiesData.length > 0 && !selectedCompanyId) {
              setSelectedCompanyId(companiesData[0].id);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountType]);

    const handleSuccess = () => {
        setIsFormOpen(false);
        setAccountForAction(null);
        fetchData();
    };
    
    const handleTaxDialogSuccess = () => {
        setIsTaxDialogOpen(false);
        fetchData();
    }
    
    const handleClearFilters = () => {
        setDate({
            from: startOfMonth(new Date()),
            to: endOfMonth(new Date()),
        });
    };
    
    const handleMarkAsPaid = async (account: SerializableAccount) => {
        try {
            await updateAccount(accountType, account.id, { status: 'paid', paidAt: new Date() }, 'single');
            toast({ title: 'Sucesso!', description: `Conta marcada como ${accountType === 'payable' ? 'paga' : 'recebida'}.` });
            fetchData();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar a conta.' });
        }
    };

    const handleDeleteAccount = async (scope: 'single' | 'future') => {
        if (!accountForAction) return;
        try {
            await deleteAccount(accountType, accountForAction.id, scope);
            toast({ title: 'Sucesso', description: 'Conta(s) excluída(s).' });
            fetchData();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir a conta.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setAccountForAction(null);
        }
    };
    
    const companyFilteredAccounts = useMemo(() => {
        if (!selectedCompanyId) return [];
        return accounts.filter(r => r.companyId === selectedCompanyId);
    }, [accounts, selectedCompanyId]);
    
    const dateFilteredAccounts = useMemo(() => {
        if (!date?.from) return companyFilteredAccounts;
        return companyFilteredAccounts.filter(account => {
            const dueDate = new Date(account.dueDate);
            const from = date.from!;
            const to = date.to ?? from;
            const toEndOfDay = new Date(to);
            toEndOfDay.setHours(23, 59, 59, 999);
            return dueDate >= from && dueDate <= toEndOfDay;
        });
    }, [companyFilteredAccounts, date]);
    
    const { totalPending, totalOverdue } = useMemo(() => {
        const pending = dateFilteredAccounts.filter(r => r.status === 'pending');
        const overdue = pending.filter(r => isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate)));
        return { 
            totalPending: pending.reduce((acc, r) => acc + r.amount, 0),
            totalOverdue: overdue.reduce((acc, r) => acc + r.amount, 0)
        };
    }, [dateFilteredAccounts]);

    const handleActionClick = (action: 'edit' | 'delete', account: SerializableAccount) => {
        setAccountForAction(account);
        if (account.isRecurring) {
            setScopeAction(action);
            setIsScopeDialogOpen(true);
        } else {
            if (action === 'edit') {
                setSelectedScope('single');
                setIsFormOpen(true);
            } else {
                setIsDeleteDialogOpen(true);
            }
        }
    };

    const handleConfirmScope = (scope: 'single' | 'future') => {
        setIsScopeDialogOpen(false);
        if (scopeAction === 'edit') {
            setSelectedScope(scope);
            setIsFormOpen(true);
        } else if (scopeAction === 'delete') {
            setIsDeleteDialogOpen(true);
            setSelectedScope(scope);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const isPayable = accountType === 'payable';
    const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5"/> Selecione a Empresa</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (<Skeleton className="h-10 w-[300px]" />) : (
                        <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId || ''}>
                            <SelectTrigger className="w-full md:w-[300px]"><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                            <SelectContent>{companies.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="grid gap-2">
                        <Label htmlFor="date">Período de Vencimento</Label>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full md:w-[300px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                                                    {format(date.to, "dd/MM/yy", { locale: ptBR })}
                                                </>
                                            ) : (
                                                format(date.from, "dd/MM/yy", { locale: ptBR })
                                            )
                                        ) : (
                                            <span>Selecione um período</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="flex w-auto flex-row p-0" align="start">
                                    <div className="flex flex-col gap-1 border-r p-3">
                                        <div className="pb-1 text-sm font-medium">Padrões</div>
                                        <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setDate({from: startOfMonth(new Date()), to: endOfMonth(new Date())})}>Mês Atual</Button>
                                        <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setDate({from: startOfMonth(addMonths(new Date(), 1)), to: endOfMonth(addMonths(new Date(), 1))})}>Mês Seguinte</Button>
                                        <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setDate({from: new Date(), to: addDays(new Date(), 90)})}>Próximos 90 dias</Button>
                                    </div>
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" onClick={handleClearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Limpar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <div className="grid gap-4 md:grid-cols-2">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total {isPayable ? 'a Pagar' : 'a Receber'} (Pendente)</CardTitle></CardHeader>
                    <CardContent><div className={`text-2xl font-bold ${!isPayable ? 'text-green-600' : ''}`}>{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalPending)}</div></CardContent>
                </Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Vencido</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-destructive">{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalOverdue)}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Lista de Contas {isPayable ? 'a Pagar' : 'a Receber'}</CardTitle>
                            <CardDescription>Contas pendentes e {isPayable ? 'pagas' : 'recebidas'} da empresa selecionada.</CardDescription>
                        </div>
                         <div className="flex items-center gap-2">
                            {isPayable && (
                                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setIsTaxDialogOpen(true)} disabled={!selectedCompanyId}>
                                    <Receipt className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Apurar Imposto</span>
                                </Button>
                            )}
                            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setAccountForAction(null); }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Nova Conta</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{accountForAction ? 'Editar' : 'Adicionar'} Conta {isPayable ? 'a Pagar' : 'a Receber'}</DialogTitle>
                                        <DialogDescription>Preencha os detalhes da {isPayable ? 'despesa' : 'receita'}.</DialogDescription>
                                    </DialogHeader>
                                    <AccountForm accountType={accountType} account={accountForAction} onSuccess={handleSuccess} scope={selectedScope} />
                                </DialogContent>
                            </Dialog>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Ações</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell></TableRow>
                                ) : dateFilteredAccounts.length > 0 ? (
                                    dateFilteredAccounts.map(account => {
                                        const isOverdue = isPast(new Date(account.dueDate)) && account.status === 'pending' && !isToday(new Date(account.dueDate));
                                        return (
                                            <TableRow key={account.id} className={account.status === 'paid' ? 'bg-muted/50 text-muted-foreground' : ''}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {account.description}
                                                        {account.creditCardId && (
                                                            <TooltipProvider><Tooltip><TooltipTrigger>
                                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                            </TooltipTrigger><TooltipContent>
                                                                <p>Cartão: {account.creditCardName || 'N/I'}</p>
                                                            </TooltipContent></Tooltip></TooltipProvider>
                                                        )}
                                                        {account.isRecurring && <TooltipProvider><Tooltip><TooltipTrigger><Repeat className="h-4 w-4 text-muted-foreground"/></TooltipTrigger><TooltipContent><p>Conta recorrente</p></TooltipContent></Tooltip></TooltipProvider>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(account.amount)}</TableCell>
                                                <TableCell>{account.category || 'N/A'}</TableCell>
                                                <TableCell className={isOverdue ? 'text-destructive font-semibold' : ''}>{format(new Date(account.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                                <TableCell>
                                                    <Badge variant={account.status === 'paid' ? 'secondary' : 'outline'}>
                                                        {account.status === 'paid' ? (isPayable ? 'Pago' : 'Recebido') : 'Pendente'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                {account.status === 'pending' && <DropdownMenuItem onSelect={() => handleMarkAsPaid(account)}><Check className="mr-2 h-4 w-4"/> Marcar como {isPayable ? 'Paga' : 'Recebida'}</DropdownMenuItem>}
                                                                <DropdownMenuItem onSelect={() => handleActionClick('edit', account)}>Editar</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive" onSelect={() => handleActionClick('delete', account)}>Excluir</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma conta encontrada para os filtros selecionados.</TableCell></TableRow>
                                )}
                            </TableBody>
                         </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
                <DialogContent className="max-w-4xl p-0">
                    {selectedCompany && <TaxCalculationDialogContent company={selectedCompany} onSuccess={handleTaxDialogSuccess} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação irá excluir a conta: <span className="font-bold">{accountForAction?.description}</span>. {selectedScope === 'future' && 'Todas as ocorrências futuras também serão excluídas.'}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteAccount(selectedScope)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <AlertDialog open={isScopeDialogOpen} onOpenChange={setIsScopeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ação em Conta Recorrente</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta ação afetará uma conta recorrente. Você deseja aplicar a alteração apenas a esta ocorrência ou a esta e todas as futuras?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button variant="outline" onClick={() => handleConfirmScope('single')}>Somente esta</Button>
                        <AlertDialogAction onClick={() => handleConfirmScope('future')}>Esta e as Futuras</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default function ContasPage() {
    return (
        <>
            <MainHeader title="Contas a Pagar e Receber" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Tabs defaultValue="payable">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
                        <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
                    </TabsList>
                    <TabsContent value="payable">
                        <AccountsManager accountType="payable" />
                    </TabsContent>
                    <TabsContent value="receivable">
                        <AccountsManager accountType="receivable" />
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}

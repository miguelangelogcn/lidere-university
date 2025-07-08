'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Check, Repeat, AlertTriangle, Building2, Filter, CalendarIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { SerializableAccount, Company } from '@/lib/types';
import { getAccounts, updateAccount, deleteAccount } from '@/services/accountsService';
import { getCompanies } from '@/services/companyService';
import { AccountForm } from '@/components/account-form';
import { format, isPast, isToday, startOfMonth, endOfMonth } from 'date-fns';
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


const AccountsManager = ({ accountType }: { accountType: 'payable' | 'receivable' }) => {
    const [accounts, setAccounts] = useState<SerializableAccount[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    
    const handleMarkAsPaid = async (account: SerializableAccount) => {
        try {
            await updateAccount(accountType, account.id, { status: 'paid', paidAt: new Date() });
            toast({ title: 'Sucesso!', description: `Conta marcada como ${accountType === 'payable' ? 'paga' : 'recebida'}.` });
            fetchData();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar a conta.' });
        }
    };

    const handleDeleteAccount = async () => {
        if (!accountForAction) return;
        try {
            await deleteAccount(accountType, accountForAction.id);
            toast({ title: 'Sucesso', description: 'Conta excluída.' });
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
        const pending = companyFilteredAccounts.filter(r => r.status === 'pending');
        const overdue = pending.filter(r => isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate)));
        return { 
            totalPending: pending.reduce((acc, r) => acc + r.amount, 0),
            totalOverdue: overdue.reduce((acc, r) => acc + r.amount, 0)
        };
    }, [companyFilteredAccounts]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const isPayable = accountType === 'payable';

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
                            <PopoverContent className="w-auto p-0" align="start">
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
                                <AccountForm accountType={accountType} account={accountForAction} onSuccess={handleSuccess} />
                            </DialogContent>
                        </Dialog>
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
                                                    {account.status === 'pending' && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuItem onSelect={() => handleMarkAsPaid(account)}><Check className="mr-2 h-4 w-4"/> Marcar como {isPayable ? 'Paga' : 'Recebida'}</DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => {setAccountForAction(account); setIsFormOpen(true);}}>Editar</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive" onSelect={() => {setAccountForAction(account); setIsDeleteDialogOpen(true);}}>Excluir</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
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

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação irá excluir a conta: <span className="font-bold">{accountForAction?.description}</span>.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
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

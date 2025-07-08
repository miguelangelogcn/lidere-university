'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Check, Repeat, AlertTriangle, Building2 } from 'lucide-react';
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
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ContasAPagarPage() {
    const [accounts, setAccounts] = useState<SerializableAccount[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [accountForAction, setAccountForAction] = useState<SerializableAccount | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accountsData, companiesData] = await Promise.all([
                getAccounts('payable', selectedCompanyId),
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
    }, [selectedCompanyId]);

    const handleSuccess = () => {
        setIsFormOpen(false);
        setAccountForAction(null);
        fetchData();
    };
    
    const handleMarkAsPaid = async (account: SerializableAccount) => {
        try {
            await updateAccount('payable', account.id, { status: 'paid', paidAt: new Date() });
            toast({ title: 'Sucesso!', description: 'Conta marcada como paga.' });
            fetchData();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar a conta.' });
        }
    };

    const handleDeleteAccount = async () => {
        if (!accountForAction) return;
        try {
            await deleteAccount('payable', accountForAction.id);
            toast({ title: 'Sucesso', description: 'Conta excluída.' });
            fetchData();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir a conta.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setAccountForAction(null);
        }
    };
    
    const { totalPending, totalOverdue } = useMemo(() => {
        const pending = accounts.filter(r => r.status === 'pending');
        const overdue = pending.filter(r => isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate)));
        return { 
            totalPending: pending.reduce((acc, r) => acc + r.amount, 0),
            totalOverdue: overdue.reduce((acc, r) => acc + r.amount, 0)
        };
    }, [accounts]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <>
            <MainHeader title="Contas a Pagar">
                <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setAccountForAction(null); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Nova Conta</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{accountForAction ? 'Editar' : 'Adicionar'} Conta a Pagar</DialogTitle>
                            <DialogDescription>Preencha os detalhes da despesa.</DialogDescription>
                        </DialogHeader>
                        <AccountForm accountType="payable" account={accountForAction} onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </MainHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
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

                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total a Pagar (Pendente)</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalPending)}</div></CardContent>
                    </Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Vencido</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-destructive">{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalOverdue)}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Lista de Contas a Pagar</CardTitle><CardDescription>Contas pendentes e pagas da empresa selecionada.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell></TableRow>
                                    ) : accounts.length > 0 ? (
                                        accounts.map(account => {
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
                                                    <TableCell className={isOverdue ? 'text-destructive font-semibold' : ''}>{format(new Date(account.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={account.status === 'paid' ? 'secondary' : 'outline'}>
                                                            {account.status === 'paid' ? 'Pago' : 'Pendente'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {account.status === 'pending' && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                    <DropdownMenuItem onSelect={() => handleMarkAsPaid(account)}><Check className="mr-2 h-4 w-4"/> Marcar como Paga</DropdownMenuItem>
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
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma conta encontrada para esta empresa.</TableCell></TableRow>
                                    )}
                                </TableBody>
                             </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
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
        </>
    );
}

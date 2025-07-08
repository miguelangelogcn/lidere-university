'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Building2, LinkIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { SerializableDebt, Company } from '@/lib/types';
import { getDebts, deleteDebt } from '@/services/debtService';
import { getCompanies } from '@/services/companyService';
import { AddDebtForm } from '@/components/add-debt-form';
import { EditDebtForm } from '@/components/edit-debt-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function DividasPage() {
    const [debts, setDebts] = useState<SerializableDebt[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [debtForAction, setDebtForAction] = useState<SerializableDebt | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [debtsData, companiesData] = await Promise.all([getDebts(), getCompanies()]);
            setDebts(debtsData);
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
    }, []);

    const handleSuccess = () => {
        setIsFormOpen(false);
        setIsEditDialogOpen(false);
        setDebtForAction(null);
        fetchData();
    };

    const handleDeleteDebt = async () => {
        if (!debtForAction) return;
        try {
            await deleteDebt(debtForAction.id);
            toast({ title: 'Sucesso', description: 'Dívida excluída.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir a dívida.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setDebtForAction(null);
        }
    };
    
    const filteredDebts = useMemo(() => {
        if (!selectedCompanyId) return [];
        return debts.filter(d => d.companyId === selectedCompanyId);
    }, [debts, selectedCompanyId]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const statusLabels: Record<SerializableDebt['status'], string> = {
        aberta: 'Aberta',
        negociada: 'Negociada',
        paga: 'Paga',
    };

    const statusVariants: Record<SerializableDebt['status'], 'outline' | 'default' | 'secondary'> = {
        aberta: 'outline',
        negociada: 'default',
        paga: 'secondary',
    };

    return (
        <>
            <MainHeader title="Gestão de Dívidas" />
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

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Lista de Dívidas</CardTitle>
                                <CardDescription>Dívidas registradas para a empresa selecionada.</CardDescription>
                            </div>
                            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Nova Dívida</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Nova Dívida</DialogTitle>
                                        <DialogDescription>Preencha os detalhes da dívida.</DialogDescription>
                                    </DialogHeader>
                                    <AddDebtForm onSuccess={handleSuccess} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição / Credor</TableHead>
                                        <TableHead>Valor Original</TableHead>
                                        <TableHead>Juros</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell></TableRow>
                                    ) : filteredDebts.length > 0 ? (
                                        filteredDebts.map(debt => (
                                            <TableRow key={debt.id} className={debt.status === 'paga' ? 'bg-muted/50 text-muted-foreground' : ''}>
                                                <TableCell className="font-medium">
                                                    <div>{debt.description}</div>
                                                    <div className="text-xs text-muted-foreground">{debt.creditor}</div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(debt.originalAmount)}</TableCell>
                                                <TableCell>{debt.interestRate}%</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariants[debt.status]}>{statusLabels[debt.status]}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onSelect={() => {setDebtForAction(debt); setIsEditDialogOpen(true);}}>Negociar / Ver</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onSelect={() => {setDebtForAction(debt); setIsDeleteDialogOpen(true);}}>Excluir</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma dívida encontrada para esta empresa.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setDebtForAction(null); setIsEditDialogOpen(open); }}>
                    <DialogContent className="max-w-2xl">
                         <DialogHeader>
                            <DialogTitle>Negociar Dívida</DialogTitle>
                            <DialogDescription>Registre os detalhes da negociação e gere as parcelas em Contas a Pagar.</DialogDescription>
                        </DialogHeader>
                        {debtForAction && <EditDebtForm debt={debtForAction} onSuccess={handleSuccess} />}
                    </DialogContent>
                </Dialog>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setDebtForAction(null); setIsDeleteDialogOpen(open); }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação irá excluir a dívida: <span className="font-bold">{debtForAction?.description}</span>. Se ela já foi negociada, as parcelas em contas a pagar não serão excluídas.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteDebt} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </>
    );
}

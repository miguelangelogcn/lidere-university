'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, ArrowDownCircle, ArrowUpCircle, DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { SerializableFinancialRecord as FinancialRecord } from '@/lib/types';
import { getFinancialRecords, deleteFinancialRecord } from '@/services/financialService';
import { AddFinancialRecordForm } from '@/components/add-financial-record-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FinanceiroPage() {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<FinancialRecord | null>(null);
    const { toast } = useToast();

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await getFinancialRecords();
            setRecords(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar registros financeiros.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleSuccess = () => {
        setIsAddDialogOpen(false);
        fetchRecords();
    };

    const handleDeleteRecord = async () => {
        if (!recordToDelete) return;
        try {
            await deleteFinancialRecord(recordToDelete.id);
            toast({ title: 'Sucesso', description: 'Registro excluído.' });
            fetchRecords();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir o registro.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setRecordToDelete(null);
        }
    };

    const { totalIncome, totalExpense, balance } = useMemo(() => {
        const income = records.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
        const expense = records.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
        return { totalIncome: income, totalExpense: expense, balance: income - expense };
    }, [records]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <>
            <MainHeader title="Financeiro">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Novo Registro
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Registro Financeiro</DialogTitle>
                            <DialogDescription>
                                Informe os detalhes da entrada ou saída.
                            </DialogDescription>
                        </DialogHeader>
                        <AddFinancialRecordForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </MainHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                                {formatCurrency(balance)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Registros</CardTitle>
                        <CardDescription>Lista de todas as transações financeiras.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell></TableRow>
                                    ) : records.length > 0 ? (
                                        records.map(record => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">{record.description}</TableCell>
                                                <TableCell className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                    {formatCurrency(record.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={record.type === 'income' ? 'secondary' : 'destructive'}>
                                                        {record.type === 'income' ? 'Entrada' : 'Saída'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{record.category || 'N/A'}</TableCell>
                                                <TableCell>{format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem className="text-destructive" onSelect={() => {setRecordToDelete(record); setIsDeleteDialogOpen(true);}}>
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum registro encontrado.</TableCell></TableRow>
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
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita e irá excluir o registro: <span className="font-bold">{recordToDelete?.description}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRecord} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

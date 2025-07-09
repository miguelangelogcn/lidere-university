'use client';

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/main-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { getDebts, deleteDebt } from "@/lib/actions/debtActions";
import type { SerializableDebt } from "@/lib/types";
import { AddDebtForm } from "@/components/add-debt-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function DividasPage() {
    const [debts, setDebts] = useState<SerializableDebt[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<SerializableDebt | null>(null);
    const { toast } = useToast();

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const debtList = await getDebts();
            setDebts(debtList);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar dívidas." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebts();
    }, []);

    const handleSuccess = () => {
        setIsAddDialogOpen(false);
        setSelectedDebt(null);
        fetchDebts();
    };

    const handleDelete = async () => {
        if (!selectedDebt) return;
        try {
            await deleteDebt(selectedDebt.id);
            toast({ title: "Sucesso!", description: "Dívida e suas parcelas foram excluídas." });
            fetchDebts();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro!", description: error.message });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedDebt(null);
        }
    };
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <>
            <MainHeader title="Gestão de Dívidas" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center">
                    <div className="ml-auto flex items-center gap-2">
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        Adicionar Dívida
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Nova Dívida</DialogTitle>
                                    <DialogDescription>
                                        Cadastre um empréstimo ou financiamento. As parcelas serão criadas como contas a pagar.
                                    </DialogDescription>
                                </DialogHeader>
                                <AddDebtForm onSuccess={handleSuccess} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Credor / Descrição</TableHead>
                                <TableHead>Valor Total</TableHead>
                                <TableHead>Taxa de Juros (Anual)</TableHead>
                                <TableHead>Parcelas</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <span className="sr-only">Ações</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : debts.length > 0 ? (
                                debts.map((debt) => (
                                    <TableRow key={debt.id}>
                                        <TableCell className="font-medium">
                                            <div>{debt.creditor}</div>
                                            <div className="text-xs text-muted-foreground">{debt.description}</div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(debt.totalAmount)}</TableCell>
                                        <TableCell>{debt.interestRate ? `${debt.interestRate}%` : 'N/A'}</TableCell>
                                        <TableCell>
                                            {debt.isInstallment ? `${debt.paidInstallments} / ${debt.totalInstallments}` : '1 / 1'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={debt.status === 'active' ? 'outline' : 'secondary'}>
                                                {debt.status === 'active' ? 'Ativa' : 'Quitada'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Menu de ações</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedDebt(debt); setIsDeleteDialogOpen(true); }}>
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Nenhuma dívida encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setSelectedDebt(null); setIsDeleteDialogOpen(open); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso irá excluir permanentemente a dívida com <span className="font-bold">{selectedDebt?.creditor}</span> e todas as suas parcelas em "Contas a Pagar".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

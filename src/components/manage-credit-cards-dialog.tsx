'use client';

import { useState, useEffect } from 'react';
import type { Company, CreditCard } from '@/lib/types';
import { getCreditCardsByCompany, deleteCreditCard } from '@/services/creditCardService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2, CreditCard as CreditCardIcon, PlusCircle, Trash2 } from 'lucide-react';
import { AddCreditCardForm } from './add-credit-card-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';


type ManageCreditCardsDialogProps = {
    company: Company;
};

export function ManageCreditCardsDialog({ company }: ManageCreditCardsDialogProps) {
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
    const { toast } = useToast();
    
    const fetchCards = async () => {
        setLoading(true);
        try {
            const data = await getCreditCardsByCompany(company.id);
            setCards(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao buscar cartões.' });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCards();
    }, [company]);
    
    const handleSuccess = () => {
        setIsAddFormOpen(false);
        fetchCards();
    }

    const handleDelete = async () => {
        if (!cardToDelete) return;
        try {
            await deleteCreditCard(cardToDelete.id);
            toast({ title: 'Sucesso', description: 'Cartão excluído.' });
            setCardToDelete(null);
            fetchCards();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir o cartão.' });
        }
    };
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className='p-6'>
            <DialogHeader>
                <DialogTitle>Gerenciar Cartões de Crédito</DialogTitle>
                <DialogDescription>Cartões da empresa {company.name}</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
                <div className="flex justify-end mb-4">
                    <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cartão</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Cartão de Crédito</DialogTitle>
                                <DialogDescription>Cadastre um novo cartão para a empresa {company.name}</DialogDescription>
                            </DialogHeader>
                            <AddCreditCardForm company={company} onSuccess={handleSuccess} />
                        </DialogContent>
                    </Dialog>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : cards.length > 0 ? (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cartão</TableHead>
                                    <TableHead>Limite</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead><span className="sr-only">Ações</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cards.map(card => (
                                    <TableRow key={card.id}>
                                        <TableCell>
                                            <div className="font-medium">{card.cardName}</div>
                                            <div className="text-sm text-muted-foreground">**** {card.cardLastFourDigits}</div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(card.cardLimit)}</TableCell>
                                        <TableCell>Todo dia {card.invoiceDueDate}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setCardToDelete(card)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum cartão cadastrado.</p>
                )}
            </div>

            <AlertDialog open={!!cardToDelete} onOpenChange={(open) => !open && setCardToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação irá excluir permanentemente o cartão {cardToDelete?.cardName}.
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
        </div>
    );
}

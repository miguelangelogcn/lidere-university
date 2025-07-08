'use client';

import { useState, useEffect } from 'react';
import { MainHeader } from "@/components/main-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProducts } from '@/services/productService';
import { getFollowUpProcesses, deleteFollowUpProcess } from '@/services/followUpService';
import type { Product, SerializableFollowUpProcess as FollowUpProcess } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoreHorizontal, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { FollowUpDetails } from '@/components/follow-up-details';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddFollowUpForm } from '@/components/add-follow-up-form';
import { EditFollowUpForm } from '@/components/edit-follow-up-form';

export default function AcompanhamentoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [followUpProcesses, setFollowUpProcesses] = useState<FollowUpProcess[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpProcess | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [processForAction, setProcessForAction] = useState<FollowUpProcess | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(prev => prev || true);
    try {
      const [productsData, followUpsData] = await Promise.all([
        getProducts(),
        getFollowUpProcesses(),
      ]);
      setProducts(productsData);
      setFollowUpProcesses(followUpsData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Falha ao carregar os dados.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSuccess = () => {
    setSelectedFollowUp(null);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setProcessForAction(null);
    fetchData();
  };

  const handleDeleteProcess = async () => {
    if (!processForAction) return;
    try {
      await deleteFollowUpProcess(processForAction.id);
      toast({ title: "Sucesso!", description: "Acompanhamento excluído." });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro!", description: "Falha ao excluir o acompanhamento." });
    } finally {
      setIsDeleteDialogOpen(false);
      setProcessForAction(null);
    }
  };

  const filteredFollowUps = selectedProductId
    ? followUpProcesses.filter(p => p.productId === selectedProductId)
    : followUpProcesses;

  const statusLabels: { [key in FollowUpProcess['status']]: string } = {
    todo: 'A Fazer',
    doing: 'Fazendo',
    done: 'Feito',
  };
  
  const statusVariants: { [key in FollowUpProcess['status']]: "default" | "secondary" | "outline" } = {
    todo: 'outline',
    doing: 'default',
    done: 'secondary',
  };

  return (
    <>
      <MainHeader title="Acompanhamento de Clientes">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Criar Acompanhamento
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Acompanhamento</DialogTitle>
                  <DialogDescription>
                    Selecione o contato e o produto para iniciar um novo acompanhamento.
                  </DialogDescription>
                </DialogHeader>
                <AddFollowUpForm onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
      </MainHeader>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Filtrar por Produto</CardTitle>
            <CardDescription>
              Selecione um produto para visualizar os clientes em acompanhamento ou deixe em branco para ver todos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => setSelectedProductId(value === 'all' ? null : value)} defaultValue="all" disabled={loading}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione um produto..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes em Acompanhamento</CardTitle>
            <CardDescription>
              Lista de todos os processos de acompanhamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Produto</TableHead>
                    <TableHead>Status Geral</TableHead>
                    <TableHead><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredFollowUps.length > 0 ? (
                    filteredFollowUps.map(process => (
                      <TableRow key={process.id}>
                        <TableCell className="font-medium">{process.contactName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{process.productName}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[process.status]}>{statusLabels[process.status]}</Badge>
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
                              <DropdownMenuItem onSelect={() => setSelectedFollowUp(process)}>
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setProcessForAction(process); setIsEditDialogOpen(true); }}>
                                Editar Status
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onSelect={() => { setProcessForAction(process); setIsDeleteDialogOpen(true); }}>
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum cliente em acompanhamento para este filtro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!selectedFollowUp} onOpenChange={(open) => !open && setSelectedFollowUp(null)}>
        <DialogContent className="max-w-4xl p-0">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle>Detalhes do Acompanhamento</DialogTitle>
                <DialogDescription>
                    Gerencie as mentorias para {selectedFollowUp?.contactName} no produto {selectedFollowUp?.productName}.
                </DialogDescription>
            </DialogHeader>
            {selectedFollowUp && <FollowUpDetails process={selectedFollowUp} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setProcessForAction(null); setIsEditDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Editar Status do Acompanhamento</DialogTitle>
                <DialogDescription>
                  Altere o status para {processForAction?.contactName}.
                </DialogDescription>
            </DialogHeader>
            {processForAction && <EditFollowUpForm process={processForAction} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setProcessForAction(null); setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá excluir permanentemente o acompanhamento de <span className="font-bold">{processForAction?.contactName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProcess} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/main-header";
import { getPipelines, deletePipeline } from "@/services/pipelineService";
import type { Pipeline } from "@/lib/types";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddPipelineForm } from "@/components/add-pipeline-form";
import { EditPipelineForm } from "@/components/edit-pipeline-form";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const { toast } = useToast();

  const fetchPipelines = async () => {
    setLoading(true);
    try {
        const pipelineList = await getPipelines();
        setPipelines(pipelineList);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar funis." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedPipeline(null);
    fetchPipelines();
  };
  
  const handleDeletePipeline = async () => {
    if (!selectedPipeline) return;
    try {
        await deletePipeline(selectedPipeline.id);
        toast({ title: "Sucesso!", description: "Funil excluído com sucesso." });
        fetchPipelines();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao excluir o funil." });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedPipeline(null);
    }
  };

  return (
    <>
      <MainHeader title="Gerenciar Funis de Venda" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <div className="ml-auto flex items-center gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Criar Novo Funil
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Criar Novo Funil</DialogTitle>
                          <DialogDescription>
                            Defina um nome e as etapas para seu novo funil de vendas.
                          </DialogDescription>
                        </DialogHeader>
                        <AddPipelineForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        
        {loading ? (
            <div className="flex items-center justify-center flex-1">
                <p>Carregando...</p>
            </div>
        ) : pipelines.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pipelines.map((pipeline) => (
                  <Card key={pipeline.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu de ações</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => { setSelectedPipeline(pipeline); setIsEditDialogOpen(true); }}>
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedPipeline(pipeline); setIsDeleteDialogOpen(true); }}>
                                Excluir
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>Etapas do Funil:</CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pipeline.stages.map((stage) => (
                          <Badge key={stage.id} variant="secondary">{stage.name}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
        ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">Você ainda não tem funis</h3>
                    <p className="text-sm text-muted-foreground">
                        Crie seu primeiro funil de vendas para começar a organizar seus negócios.
                    </p>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">Criar Funil</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Criar Novo Funil</DialogTitle>
                                <DialogDescription>
                                    Defina um nome e as etapas para seu novo funil de vendas.
                                </DialogDescription>
                            </DialogHeader>
                            <AddPipelineForm onSuccess={handleSuccess} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        )}
      </main>

      {/* Edit Pipeline Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setSelectedPipeline(null); setIsEditDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Funil</DialogTitle>
            <DialogDescription>
              Altere o nome e as etapas do funil.
            </DialogDescription>
          </DialogHeader>
          {selectedPipeline && <EditPipelineForm pipeline={selectedPipeline} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>
      
      {/* Delete Pipeline Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setSelectedPipeline(null); setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá excluir permanentemente o funil <span className="font-bold">{selectedPipeline?.name}&lt;/span&gt;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePipeline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

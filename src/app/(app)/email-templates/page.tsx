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
import { getEmailTemplates, deleteEmailTemplate } from "@/services/emailTemplateService";
import type { EmailTemplate } from "@/lib/types";
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
import { AddEmailTemplateForm } from "@/components/add-email-template-form";
import { EditEmailTemplateForm } from "@/components/edit-email-template-form";

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
        const templateList = await getEmailTemplates();
        setTemplates(templateList);
    } catch(err) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar modelos." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedTemplate(null);
    fetchTemplates();
    toast({ title: "Sucesso!", description: "Operação realizada com sucesso." });
  };
  
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    try {
        await deleteEmailTemplate(selectedTemplate.id);
        toast({ title: "Sucesso!", description: "Modelo excluído com sucesso." });
        fetchTemplates();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao excluir o modelo." });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedTemplate(null);
    }
  };

  return (
    <>
      <MainHeader title="Gerenciar Modelos de Email" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <div className="ml-auto flex items-center gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Adicionar Modelo
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Modelo</DialogTitle>
                          <DialogDescription>
                            Crie um novo modelo de email para ser usado no sistema.
                          </DialogDescription>
                        </DialogHeader>
                        <AddEmailTemplateForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead className="w-[100px]">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        Carregando...
                    </TableCell>
                </TableRow>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.subject}</TableCell>
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
                          <DropdownMenuItem onSelect={() => { setSelectedTemplate(template); setIsEditDialogOpen(true); }}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedTemplate(template); setIsDeleteDialogOpen(true); }}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum modelo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setSelectedTemplate(null); setIsEditDialogOpen(open); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Modelo</DialogTitle>
            <DialogDescription>
              Altere os dados do modelo de email.
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && <EditEmailTemplateForm template={selectedTemplate} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setSelectedTemplate(null); setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá excluir permanentemente o modelo <span className="font-bold">{selectedTemplate?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

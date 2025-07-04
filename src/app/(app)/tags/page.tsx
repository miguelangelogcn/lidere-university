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
import { getTags, deleteTag } from "@/services/tagService";
import type { Tag } from "@/lib/types";
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
import { AddTagForm } from "@/components/add-tag-form";
import { EditTagForm } from "@/components/edit-tag-form";
import { useToast } from "@/hooks/use-toast";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const { toast } = useToast();

  const fetchTags = async () => {
    setLoading(true);
    const tagList = await getTags();
    setTags(tagList);
    setLoading(false);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedTag(null);
    fetchTags();
  };
  
  const handleDeleteTag = async () => {
    if (!selectedTag) return;
    try {
        await deleteTag(selectedTag.id);
        toast({ title: "Sucesso!", description: "Tag excluída com sucesso." });
        fetchTags();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao excluir a tag." });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedTag(null);
    }
  };

  return (
    <>
      <MainHeader title="Gerenciar Tags" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <div className="ml-auto flex items-center gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Adicionar Tag
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Adicionar Nova Tag</DialogTitle>
                          <DialogDescription>
                            Crie uma nova tag para organizar seus contatos.
                          </DialogDescription>
                        </DialogHeader>
                        <AddTagForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Tag</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        Carregando...
                    </TableCell>
                </TableRow>
              ) : tags.length > 0 ? (
                tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
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
                          <DropdownMenuItem onSelect={() => { setSelectedTag(tag); setIsEditDialogOpen(true); }}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedTag(tag); setIsDeleteDialogOpen(true); }}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Nenhuma tag encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { !open && setSelectedTag(null); setIsEditDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
            <DialogDescription>
              Altere o nome da tag.
            </DialogDescription>
          </DialogHeader>
          {selectedTag && <EditTagForm tag={selectedTag} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>
      
      {/* Delete Tag Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { !open && setSelectedTag(null); setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá excluir permanentemente a tag <span className="font-bold">{selectedTag?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import type { Contact } from "@/lib/types";
import { getContacts, deleteContact } from "@/services/contactService";
import { useToast } from "@/hooks/use-toast";
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
import { AddContactForm } from "@/components/add-contact-form";
import { EditContactForm } from "@/components/edit-contact-form";

function getInitials(name: string) {
    if (!name) return 'C';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const { toast } = useToast();

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const contactList = await getContacts();
            setContacts(contactList);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar contatos." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleSuccess = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedContact(null);
        fetchContacts();
        toast({ title: "Sucesso!", description: "Operação realizada com sucesso." });
    };

    const handleDeleteContact = async () => {
        if (!selectedContact) return;
        try {
            await deleteContact(selectedContact.id);
            toast({ title: "Sucesso!", description: "Contato excluído com sucesso." });
            fetchContacts();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Falha ao excluir o contato." });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedContact(null);
        }
    };


  return (
    <>
      <MainHeader title="Gestão de Contatos" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <div className="ml-auto flex items-center gap-2">
                 <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Adicionar Contato
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Contato</DialogTitle>
                          <DialogDescription>
                            Preencha os dados do novo contato.
                          </DialogDescription>
                        </DialogHeader>
                        <AddContactForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[64px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Carregando...
                    </TableCell>
                </TableRow>
              ) : contacts.length > 0 ? (
                contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatarUrl || undefined} alt={contact.name} data-ai-hint="person" />
                        <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{contact.phone}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                          {contact.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                          {contact.tags?.length > 3 && (
                              <Badge variant="outline">+{contact.tags.length - 3}</Badge>
                          )}
                      </div>
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
                          <DropdownMenuItem onSelect={() => { setSelectedContact(contact); setIsEditDialogOpen(true); }}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedContact(contact); setIsDeleteDialogOpen(true); }}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setSelectedContact(null); setIsEditDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
            <DialogDescription>
              Altere os dados do contato.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && <EditContactForm contact={selectedContact} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setSelectedContact(null); setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá excluir permanentemente o contato <span className="font-bold">{selectedContact?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

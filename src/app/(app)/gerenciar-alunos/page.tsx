'use client';

import { useState, useEffect, useMemo } from "react";
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
import { MoreHorizontal } from "lucide-react";
import type { Contact, AppUser } from "@/lib/types";
import { getContacts } from "@/services/contactService";
import { getUsers } from "@/services/userService";
import { revokeStudentAccess } from "@/services/studentService";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { GrantStudentAccessForm } from "@/components/grant-student-access-form";
import { Skeleton } from "@/components/ui/skeleton";
import { EditContactForm } from "@/components/edit-contact-form";

function getInitials(name: string) {
    if (!name) return 'C';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export default function GerenciarAlunosPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGrantAccessDialogOpen, setIsGrantAccessDialogOpen] = useState(false);
    const [isRevokeAccessDialogOpen, setIsRevokeAccessDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isNoEmailAlertOpen, setIsNoEmailAlertOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contactList, userList] = await Promise.all([getContacts(), getUsers()]);
            setContacts(contactList);
            setUsers(userList);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar dados." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const userMapByUserId = useMemo(() => {
        return new Map(users.map(user => [user.id, user]));
    }, [users]);

    const handleSuccess = () => {
        setIsGrantAccessDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedContact(null);
        fetchData();
    };
    
    const handleGrantAccessClick = (contact: Contact) => {
        setSelectedContact(contact);
        if (contact.email) {
            setIsGrantAccessDialogOpen(true);
        } else {
            setIsNoEmailAlertOpen(true);
        }
    };

    const handleRevokeAccess = async () => {
        if (!selectedContact) return;
        try {
            await revokeStudentAccess(selectedContact);
            toast({ title: "Sucesso!", description: "Acesso de aluno revogado." });
            fetchData();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro!", description: error.message });
        } finally {
            setIsRevokeAccessDialogOpen(false);
            setSelectedContact(null);
        }
    };


  return (
    <>
      <MainHeader title="Gerenciar Alunos" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[64px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead>Status do Acesso</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
              ) : contacts.length > 0 ? (
                contacts.map((contact) => {
                  const hasAccess = !!contact.studentAccess?.userId && userMapByUserId.has(contact.studentAccess.userId);

                  return (
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
                            <Badge variant={hasAccess ? "secondary" : "outline"}>
                                {hasAccess ? 'Ativo' : 'Inativo'}
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
                            <DropdownMenuItem onSelect={() => { setSelectedContact(contact); setIsEditDialogOpen(true); }}>
                                Editar Contato
                            </DropdownMenuItem>
                            {hasAccess ? (
                                <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedContact(contact); setIsRevokeAccessDialogOpen(true); }}>
                                    Revogar Acesso
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onSelect={() => handleGrantAccessClick(contact)}>
                                    Conceder Acesso
                                </DropdownMenuItem>
                            )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  )
                })
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

      <Dialog open={isGrantAccessDialogOpen} onOpenChange={(open) => { if (!open) setSelectedContact(null); setIsGrantAccessDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conceder Acesso de Aluno</DialogTitle>
            <DialogDescription>
              Crie uma conta de usuário para que este contato possa acessar os conteúdos da plataforma.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && <GrantStudentAccessForm contact={selectedContact} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>

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

      <AlertDialog open={isRevokeAccessDialogOpen} onOpenChange={(open) => { if (!open) setSelectedContact(null); setIsRevokeAccessDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá revogar o acesso de aluno para <span className="font-bold">{selectedContact?.name}</span>. Ele(a) não poderá mais acessar a área de conteúdos. O registro de contato será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAccess} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revogar Acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isNoEmailAlertOpen} onOpenChange={setIsNoEmailAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email Necessário</AlertDialogTitle>
            <AlertDialogDescription>
              Para conceder acesso de aluno, o contato precisa ter um endereço de email cadastrado. Por favor, edite o contato para adicionar um email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedContact(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setIsNoEmailAlertOpen(false); setIsEditDialogOpen(true); }}>
                Editar Contato
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

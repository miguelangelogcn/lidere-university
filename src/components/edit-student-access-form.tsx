'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Badge } from '@/components/ui/badge';
import { updateStudentAccess } from '@/services/studentService';
import { getFormations } from '@/services/formationService';
import type { Contact, AppUser, SerializableFormation } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const accessSchema = z.object({
  formationIds: z.array(z.string()).nonempty('Selecione pelo menos um curso.'),
});

type AccessFormValues = z.infer<typeof accessSchema>;

type EditStudentAccessFormProps = {
  contact: Contact;
  user: AppUser;
  onSuccess: () => void;
};

export function EditStudentAccessForm({ contact, user, onSuccess }: EditStudentAccessFormProps) {
  const [formations, setFormations] = useState<SerializableFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchFormations() {
      try {
        const formationList = await getFormations();
        setFormations(formationList);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao carregar os cursos.' });
      } finally {
        setLoading(false);
      }
    }
    fetchFormations();
  }, [toast]);

  const form = useForm<AccessFormValues>({
    resolver: zodResolver(accessSchema),
    defaultValues: {
      formationIds: user.accessibleFormations || [],
    },
  });

  const onSubmit = async (data: AccessFormValues) => {
    try {
      await updateStudentAccess(user.id, data.formationIds);
      toast({ title: "Sucesso!", description: `Acesso de ${contact.name} atualizado.` });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message });
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
        <div>
            <p className="text-sm">Você está editando o acesso de aluno para:</p>
            <p className="font-semibold">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
        </div>
        <FormField
          control={form.control}
          name="formationIds"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Cursos com Acesso</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between h-auto min-h-10",
                        !field.value?.length && "text-muted-foreground"
                      )}
                    >
                      <div className="flex gap-1 flex-wrap">
                        {formations
                          .filter(f => field.value?.includes(f.id))
                          .map((f) => (
                            <Badge variant="secondary" key={f.id} className="mr-1">
                              {f.title}
                            </Badge>
                          ))}
                        {!field.value?.length && "Selecione os cursos"}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar curso..." />
                    <CommandList>
                      <CommandEmpty>Nenhum curso encontrado.</CommandEmpty>
                      <CommandGroup>
                        {formations.map((f) => (
                          <CommandItem
                            value={f.title}
                            key={f.id}
                            onSelect={() => {
                              const currentIds = field.value || [];
                              const newValue = currentIds.includes(f.id)
                                ? currentIds.filter((id) => id !== f.id)
                                : [...currentIds, f.id];
                              form.setValue("formationIds", newValue, { shouldValidate: true });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value?.includes(f.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {f.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Salvando...</> : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

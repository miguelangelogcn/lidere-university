'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Badge } from '@/components/ui/badge';
import { createContact } from '@/services/contactService';
import { getTags } from '@/services/tagService';
import type { Tag } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, XCircle, ChevronsUpDown } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  city: z.string().optional(),
  maritalStatus: z.string().optional(),
  age: z.coerce.number().int().positive().optional(),
  gender: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type AddContactFormProps = {
  onSuccess: () => void;
};

export function AddContactForm({ onSuccess }: AddContactFormProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    async function fetchTags() {
      const tags = await getTags();
      setAllTags(tags);
    }
    fetchTags();
  }, []);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      tags: [],
      city: '',
      maritalStatus: '',
      age: undefined,
      gender: '',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      await createContact(data);
      onSuccess();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tags</FormLabel>
               <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between h-auto min-h-10 px-3 py-2 font-normal",
                        !field.value?.length && "text-muted-foreground"
                      )}
                    >
                      <div className="flex gap-1.5 flex-wrap">
                        {field.value && field.value.length > 0 ? (
                          allTags
                            .filter(tag => field.value?.includes(tag.name))
                            .map((tag) => (
                              <Badge variant="secondary" key={tag.id} className="flex items-center gap-1.5">
                                {tag.name}
                                <span
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Remover ${tag.name}`}
                                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                  onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const newValue = (field.value || []).filter((t) => t !== tag.name);
                                      form.setValue("tags", newValue);
                                  }}
                                  onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const newValue = (field.value || []).filter((t) => t !== tag.name);
                                          form.setValue("tags", newValue);
                                      }
                                  }}
                                  className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                  <XCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </span>
                              </Badge>
                            ))
                        ) : (
                          "Selecione as tags"
                        )}
                      </div>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar tag..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                      <CommandGroup>
                        {allTags.map((tag) => (
                          <CommandItem
                            value={tag.name}
                            key={tag.id}
                            onSelect={() => {
                              const currentTags = field.value || [];
                              const newValue = currentTags.includes(tag.name)
                                ? currentTags.filter((t) => t !== tag.name)
                                : [...currentTags, tag.name];
                              form.setValue("tags", newValue);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value?.includes(tag.name)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {tag.name}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Cidade (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Cidade" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Idade (Opcional)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Idade" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || '')} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="maritalStatus"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Estado Civil (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado civil" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                         <SelectItem value="uniao_estavel">União Estável</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Gênero (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="nao_informar">Prefiro não informar</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Criando...' : 'Criar Contato'}
        </Button>
      </form>
    </Form>
  );
}

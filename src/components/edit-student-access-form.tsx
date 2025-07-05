'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { updateStudentAccess } from '@/services/studentService';
import { getFormations } from '@/services/formationService';
import type { Contact, SerializableFormation } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon, Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

const accessSchema = z.object({
  formationAccess: z.array(z.object({
    formationId: z.string(),
    expiresAt: z.date().nullable(),
  })),
});

type AccessFormValues = z.infer<typeof accessSchema>;

type EditStudentAccessFormProps = {
  contact: Contact;
  onSuccess: () => void;
};

export function EditStudentAccessForm({ contact, onSuccess }: EditStudentAccessFormProps) {
  const [formations, setFormations] = useState<SerializableFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourseId, setNewCourseId] = useState('');
  const { toast } = useToast();

  const form = useForm<AccessFormValues>({
    resolver: zodResolver(accessSchema),
    defaultValues: {
      formationAccess: contact.formationAccess?.map(fa => ({
        formationId: fa.formationId,
        expiresAt: fa.expiresAt ? new Date(fa.expiresAt) : null
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'formationAccess'
  });

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


  const onSubmit = async (data: AccessFormValues) => {
    const formattedData = data.formationAccess.map(access => ({
      formationId: access.formationId,
      expiresAt: access.expiresAt ? access.expiresAt.toISOString() : null,
    }));
    try {
      await updateStudentAccess(contact.id, formattedData);
      toast({ title: "Sucesso!", description: `Acesso de ${contact.name} atualizado.` });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message });
    }
  };
  
  const handleAddCourse = () => {
    if (newCourseId && !fields.some(field => field.formationId === newCourseId)) {
        append({ formationId: newCourseId, expiresAt: null });
        setNewCourseId('');
    }
  };
  
  const formationMap = new Map(formations.map(f => [f.id, f.title]));
  const availableFormations = formations.filter(f => !fields.some(field => field.formationId === f.id));

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div>
            <p className="text-sm">Você está editando o acesso de aluno para:</p>
            <p className="font-semibold">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
        </div>
        
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            <FormLabel>Cursos com Acesso</FormLabel>
            {fields.length > 0 ? (
                fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-3 border rounded-md">
                        <div className="flex-1">
                            <p className="font-medium">{formationMap.get(field.formationId) || 'Curso não encontrado'}</p>
                        </div>
                         <FormField
                            control={form.control}
                            name={`formationAccess.${index}.expiresAt`}
                            render={({ field: dateField }) => (
                                <FormItem>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-[240px] justify-start text-left font-normal", !dateField.value && "text-muted-foreground")}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateField.value ? format(dateField.value, 'PPP', { locale: ptBR }) : <span>Acesso vitalício</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={dateField.value} onSelect={dateField.onChange} initialFocus />
                                            <div className="p-2 border-t">
                                                <Button variant="ghost" size="sm" className="w-full" onClick={() => form.setValue(`formationAccess.${index}.expiresAt`, null)}>
                                                    Limpar data
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">Nenhum curso atribuído.</p>
            )}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
            <FormLabel>Adicionar Curso</FormLabel>
            <div className="flex gap-2">
                <Select value={newCourseId} onValueChange={setNewCourseId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um curso para adicionar" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableFormations.length > 0 ? (
                            availableFormations.map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                            ))
                        ) : (
                            <div className="p-2 text-sm text-muted-foreground">Todos os cursos já foram adicionados.</div>
                        )}
                    </SelectContent>
                </Select>
                 <Button type="button" onClick={handleAddCourse} disabled={!newCourseId}>
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>
        </div>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Salvando...</> : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

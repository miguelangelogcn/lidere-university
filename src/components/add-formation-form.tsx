'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createFormation } from '@/services/formationService';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, BookText, FileVideo, Link as LinkIcon, Loader2, Upload } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Card, CardContent } from './ui/card';
import { db, storage } from '@/lib/firebase';
import { doc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { useState } from 'react';

const attachmentSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  url: z.string().url('URL inválida.'),
});

const lessonSchema = z.object({
  title: z.string().min(1, 'O título da aula é obrigatório.'),
  videoUrl: z.string().url('URL inválida.').optional().or(z.literal('')),
  textContent: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
});

const moduleSchema = z.object({
  title: z.string().min(1, 'O título do módulo é obrigatório.'),
  lessons: z.array(lessonSchema).min(1, 'O módulo deve ter pelo menos uma aula.'),
});

const formationSchema = z.object({
  title: z.string().min(1, 'O título da formação é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  modules: z.array(moduleSchema).min(1, 'A formação deve ter pelo menos um módulo.'),
});

type FormationFormValues = z.infer<typeof formationSchema>;

type AddFormationFormProps = {
  onSuccess: () => void;
};

export function AddFormationForm({ onSuccess }: AddFormationFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<FormationFormValues>({
    resolver: zodResolver(formationSchema),
    defaultValues: {
      title: '',
      description: '',
      modules: [{ title: '', lessons: [{ title: '', videoUrl: '', textContent: '', attachments: [] }] }],
    },
  });

  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control: form.control,
    name: 'modules',
  });

  const onSubmit = async (data: FormationFormValues) => {
    const finalData = {
        ...data,
        modules: data.modules.map((module, moduleIndex) => ({
            ...module,
            id: doc(collection(db, '_')).id,
            order: moduleIndex,
            lessons: module.lessons.map((lesson, lessonIndex) => ({
                ...lesson,
                id: doc(collection(db, '_')).id,
                order: lessonIndex,
                attachments: lesson.attachments || [],
            }))
        }))
    };

    try {
      await createFormation(finalData);
      onSuccess();
    } catch (err: any) {
      useToast().toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao criar formação.' });
    }
  };

  const getButtonText = () => {
    if (isUploading) return 'Enviando Arquivo...';
    if (form.formState.isSubmitting) return 'Criando Formação...';
    return 'Criar Formação';
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[65vh] pr-6">
            <div className='space-y-4'>
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Título da Formação</FormLabel><FormControl><Input placeholder="Ex: Mestre em Vendas" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o curso..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-2">Módulos</h3>
                    <div className="space-y-4">
                        {moduleFields.map((module, moduleIndex) => (
                            <ModuleField key={module.id} moduleIndex={moduleIndex} form={form} removeModule={removeModule} setIsUploading={setIsUploading} />
                        ))}
                    </div>
                </div>
                
                <Button type="button" variant="outline" onClick={() => appendModule({ title: '', lessons: [{ title: '', textContent: '', videoUrl: '', attachments: [] }] })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Módulo
                </Button>
                <FormMessage>{form.formState.errors.modules?.root?.message}</FormMessage>
            </div>
        </ScrollArea>
        <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                {(isUploading || form.formState.isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getButtonText()}
            </Button>
        </div>
      </form>
    </Form>
  );
}

function ModuleField({ moduleIndex, form, removeModule, setIsUploading }: { moduleIndex: number, form: any, removeModule: (index: number) => void, setIsUploading: React.Dispatch<React.SetStateAction<boolean>> }) {
    const { fields: lessonFields, append: appendLesson, remove: removeLesson } = useFieldArray({
        control: form.control,
        name: `modules.${moduleIndex}.lessons`,
    });

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                    <FormField control={form.control} name={`modules.${moduleIndex}.title`} render={({ field }) => (
                        <FormItem className="flex-grow"><FormLabel>Título do Módulo</FormLabel><FormControl><Input placeholder={`Módulo ${moduleIndex + 1}`} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeModule(moduleIndex)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <div className="pl-4 border-l-2 space-y-4">
                    <h4 className="font-medium">Aulas</h4>
                    {lessonFields.map((lesson, lessonIndex) => (
                         <LessonField key={lesson.id} moduleIndex={moduleIndex} lessonIndex={lessonIndex} form={form} removeLesson={removeLesson} setIsUploading={setIsUploading} />
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => appendLesson({ title: '', videoUrl: '', textContent: '', attachments: [] })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Aula
                    </Button>
                    <FormMessage>{form.formState.errors.modules?.[moduleIndex]?.lessons?.root?.message}</FormMessage>
                </div>
            </CardContent>
        </Card>
    );
}

function LessonField({ moduleIndex, lessonIndex, form, removeLesson, setIsUploading }: { moduleIndex: number, lessonIndex: number, form: any, removeLesson: (index: number) => void, setIsUploading: React.Dispatch<React.SetStateAction<boolean>> }) {
     const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
        control: form.control,
        name: `modules.${moduleIndex}.lessons.${lessonIndex}.attachments`,
    });
    
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = React.useState<string | null>(null);
    const { toast } = useToast();

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length || !uploadTarget) return;
        const file = event.target.files[0];
        setIsUploading(true);
        const storagePath = `formations/attachments/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            form.setValue(uploadTarget, downloadURL, { shouldDirty: true });
            toast({ title: "Sucesso!", description: "Arquivo enviado com sucesso." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro de Upload!", description: "Não foi possível enviar o arquivo." });
        } finally {
            setIsUploading(false);
            setUploadTarget(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const triggerFileUpload = (fieldName: string) => {
        setUploadTarget(fieldName);
        fileInputRef.current?.click();
    };

    return (
        <div className="p-4 border rounded-md bg-background relative">
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="video/*,image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => removeLesson(lessonIndex)}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <div className="space-y-3">
                <FormField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.title`} render={({ field }) => (
                    <FormItem><FormLabel>Título da Aula</FormLabel><FormControl><Input placeholder={`Aula ${lessonIndex + 1}`} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.videoUrl`} render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center text-sm"><FileVideo className="mr-2 h-4 w-4"/> URL do Vídeo (Opcional)</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-2">
                           <Input placeholder="Cole a URL ou faça o upload" {...field} />
                           <Button type="button" variant="outline" size="icon" onClick={() => triggerFileUpload(field.name)}><Upload className="h-4 w-4" /></Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.textContent`} render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center text-sm"><BookText className="mr-2 h-4 w-4"/> Conteúdo em Texto (Opcional)</FormLabel><FormControl><Textarea rows={5} placeholder="Escreva o conteúdo da aula aqui..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center"><LinkIcon className="mr-2 h-4 w-4" /> Anexos (Opcional)</h5>
                    <div className="space-y-2">
                         {attachmentFields.map((attachment, attachmentIndex) => (
                             <div key={attachment.id} className="flex items-end gap-2">
                                <FormField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.attachments.${attachmentIndex}.name`} render={({ field }) => (
                                    <FormItem className="flex-grow"><FormLabel className="text-xs">Nome do Anexo</FormLabel><FormControl><Input placeholder="Ex: Planilha de Exercícios" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.attachments.${attachmentIndex}.url`} render={({ field }) => (
                                    <FormItem className="flex-grow"><FormLabel className="text-xs">URL do Anexo</FormLabel>
                                        <FormControl>
                                             <div className="flex items-center gap-2">
                                                <Input placeholder="Cole a URL ou faça o upload" {...field} />
                                                <Button type="button" variant="outline" size="icon" onClick={() => triggerFileUpload(field.name)}><Upload className="h-4 w-4" /></Button>
                                             </div>
                                        </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(attachmentIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                             </div>
                         ))}
                    </div>
                     <Button type="button" variant="link" size="sm" onClick={() => appendAttachment({ name: '', url: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Anexo
                    </Button>
                </div>
            </div>
        </div>
    );
}
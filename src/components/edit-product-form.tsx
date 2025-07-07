
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { updateProduct } from '@/services/productService';
import { getFormations } from '@/services/formationService';
import { useToast } from "@/hooks/use-toast";
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PlusCircle, Trash2, Loader2, Upload, X } from 'lucide-react';
import type { Product, SerializableFormation } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';

const productSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  price: z.coerce.number().positive('O preço deve ser positivo.'),
  deliverables: z.array(z.object({ value: z.string().min(1, "Entregável não pode ser vazio.") })),
  warranty: z.string().min(1, 'A garantia é obrigatória.'),
  presentationUrl: z.string().optional(),
  formationId: z.string().nullable().optional(),
  hasFollowUp: z.boolean().default(false),
  contentAccessDays: z.coerce.number().int().min(0, "Deve ser um número positivo ou zero.").optional().nullable(),
  followUpDays: z.coerce.number().int().min(0, "Deve ser um número positivo ou zero.").optional().nullable(),
}).refine(data => {
    if (data.hasFollowUp) {
        return data.followUpDays !== undefined && data.followUpDays !== null && data.followUpDays > 0;
    }
    return true;
}, {
    message: "Os dias de acompanhamento são obrigatórios se a opção for marcada e devem ser maior que zero.",
    path: ["followUpDays"],
});

type ProductFormValues = z.infer<typeof productSchema>;

type EditProductFormProps = {
  product: Product;
  onSuccess: () => void;
};

export function EditProductForm({ product, onSuccess }: EditProductFormProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [formations, setFormations] = useState<SerializableFormation[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      price: product.price,
      deliverables: product.deliverables.map(d => ({ value: d })),
      warranty: product.warranty,
      presentationUrl: product.presentationUrl || '',
      formationId: product.formationId || null,
      hasFollowUp: product.hasFollowUp || false,
      contentAccessDays: product.contentAccessDays ?? null,
      followUpDays: product.followUpDays ?? null,
    },
  });

  const hasFollowUp = form.watch('hasFollowUp');

  useEffect(() => {
    async function fetchFormationsList() {
        const data = await getFormations();
        setFormations(data);
    }
    fetchFormationsList();
  }, [])


  useEffect(() => {
    if (product.presentationUrl) {
      try {
        const url = new URL(product.presentationUrl);
        const path = decodeURIComponent(url.pathname);
        const name = path.substring(path.lastIndexOf('/') + 1);
        const cleanName = name.split('?')[0].split('_').slice(1).join('_');
        setFileName(cleanName);
      } catch (error) {
        setFileName("Arquivo existente");
      }
    }
  }, [product.presentationUrl]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "deliverables",
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        toast({ variant: "destructive", title: "Erro!", description: "Apenas arquivos PDF são permitidos." });
        return;
    }

    setIsUploading(true);
    setFileName(file.name);
    try {
        if (form.getValues('presentationUrl')) {
            const oldFileRef = ref(storage, form.getValues('presentationUrl'));
            await deleteObject(oldFileRef).catch(err => console.warn("Old file not found, skipping deletion.", err));
        }

        const storageRef = ref(storage, `presentations/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        form.setValue('presentationUrl', downloadURL, { shouldDirty: true });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro de Upload!", description: "Falha ao enviar o arquivo." });
        setFileName(null);
    } finally {
        setIsUploading(false);
    }
  };

  const removeFile = async () => {
    const currentUrl = form.getValues('presentationUrl');
    if (currentUrl) {
        const fileRef = ref(storage, currentUrl);
        await deleteObject(fileRef).catch(err => console.warn("File not found, skipping deletion.", err));
    }
    form.setValue('presentationUrl', '', { shouldDirty: true });
    setFileName(null);
  };


  const onSubmit = async (data: ProductFormValues) => {
    try {
      const productData = {
        ...data,
        contentAccessDays: data.contentAccessDays || null,
        followUpDays: data.followUpDays || null,
        formationId: data.formationId || null,
        deliverables: data.deliverables.map(d => d.value),
      };
      await updateProduct(product.id, productData);
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao atualizar produto.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="warranty" render={({ field }) => ( <FormItem><FormLabel>Garantia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>

        <div>
            <FormLabel>Apresentação (PDF)</FormLabel>
            {fileName ? (
                <div className="flex items-center justify-between mt-2 p-2 border rounded-md">
                    <a href={form.getValues('presentationUrl') || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                        {fileName}
                    </a>
                    <Button type="button" variant="ghost" size="icon" onClick={removeFile}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="relative mt-2">
                    <Button type="button" asChild variant="outline" className="w-full">
                        <label htmlFor="presentation-upload-edit" className="cursor-pointer">
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {isUploading ? 'Enviando...' : 'Carregar PDF'}
                        </label>
                    </Button>
                    <Input id="presentation-upload-edit" type="file" className="sr-only" accept="application/pdf" onChange={handleFileChange} disabled={isUploading}/>
                </div>
            )}
        </div>


        <div>
          <FormLabel>Entregáveis</FormLabel>
          <div className="space-y-2 mt-2">
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`deliverables.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                        <Textarea placeholder={`Entregável ${index + 1}`} {...field} rows={1} />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Entregável
          </Button>
        </div>

        <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-medium">Acesso e Acompanhamento</h3>
             <FormField
                control={form.control}
                name="formationId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Formação Vinculada (Conteúdo)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Nenhuma formação vinculada" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="">Nenhuma formação vinculada</SelectItem>
                                {formations.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Selecione a formação que este produto dará acesso.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="contentAccessDays"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Validade do Acesso ao Conteúdo (dias)</FormLabel>
                        <FormControl><Input type="number" placeholder="Ex: 365" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                        <FormDescription>Deixe em branco para acesso vitalício.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="hasFollowUp"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Este produto inclui acompanhamento?</FormLabel>
                            <FormDescription>Marque se o time fará acompanhamento deste cliente.</FormDescription>
                        </div>
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            {hasFollowUp && (
                 <FormField
                    control={form.control}
                    name="followUpDays"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Validade do Acompanhamento (dias)</FormLabel>
                            <FormControl><Input type="number" placeholder="Ex: 90" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                            <FormDescription>Por quantos dias o cliente terá acompanhamento após a compra.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>


        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4" disabled={form.formState.isSubmitting || isUploading || !form.formState.isDirty}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  );
}

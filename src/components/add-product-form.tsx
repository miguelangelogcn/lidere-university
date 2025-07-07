'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { createProduct } from '@/services/productService';
import { useToast } from "@/hooks/use-toast";
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PlusCircle, Trash2, Loader2, Upload, X, ChevronDown, ClipboardCheck } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent as OnboardingAccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const onboardingStepSchema = z.object({
  title: z.string().min(1, 'O título da etapa é obrigatório.'),
  description: z.string().min(1, 'A descrição da etapa é obrigatória.'),
  day: z.number(),
});

const productSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  price: z.coerce.number().positive('O preço deve ser positivo.'),
  deliverables: z.array(z.object({ value: z.string().min(1, "Entregável não pode ser vazio.") })),
  warranty: z.string().min(1, 'A garantia é obrigatória.'),
  presentationUrl: z.string().optional(),
  onboardingSteps: z.array(onboardingStepSchema).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;
type OnboardingStepValues = z.infer<typeof onboardingStepSchema>;

type AddProductFormProps = {
  onSuccess: () => void;
};

export function AddProductForm({ onSuccess }: AddProductFormProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      deliverables: [{ value: '' }],
      warranty: '',
      presentationUrl: '',
      onboardingSteps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "deliverables",
  });
  
  const { fields: onboardingFields, append: appendOnboardingStep, remove: removeOnboardingStep } = useFieldArray({
    control: form.control,
    name: 'onboardingSteps'
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
        const storageRef = ref(storage, `presentations/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        form.setValue('presentationUrl', downloadURL);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro de Upload!", description: "Falha ao enviar o arquivo." });
        setFileName(null);
    } finally {
        setIsUploading(false);
    }
  };

  const removeFile = () => {
    form.setValue('presentationUrl', '');
    setFileName(null);
  };


  const onSubmit = async (data: ProductFormValues) => {
    try {
      const productData = {
        ...data,
        deliverables: data.deliverables.map(d => d.value),
        onboardingSteps: (data.onboardingSteps || []).reduce((acc, step) => {
            const day = step.day;
            const order = acc.filter(s => s.day === day).length;
            acc.push({ ...step, order });
            return acc;
        }, [] as (OnboardingStepValues & { order: number })[]),
      };
      await createProduct(productData);
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao criar produto.' });
    }
  };
  
  const handleAddOnboardingStep = (day: number) => {
    appendOnboardingStep({ title: '', description: '', day: day });
  };
  
  const days = Array.from({ length: 8 }, (_, i) => i); // D0 to D7

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input placeholder="Ex: Consultoria Premium" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" placeholder="199.90" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField control={form.control} name="warranty" render={({ field }) => ( <FormItem><FormLabel>Garantia</FormLabel><FormControl><Input placeholder="Ex: 7 dias incondicional" {...field} /></FormControl><FormMessage /></FormItem> )}/>

        <div>
            <FormLabel>Apresentação (PDF)</FormLabel>
            {fileName ? (
                <div className="flex items-center justify-between mt-2 p-2 border rounded-md">
                    <span className="text-sm text-muted-foreground truncate">{fileName}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={removeFile}> <X className="h-4 w-4" /> </Button>
                </div>
            ) : (
                <div className="relative mt-2">
                    <Button type="button" asChild variant="outline" className="w-full">
                        <label htmlFor="presentation-upload" className="cursor-pointer">
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {isUploading ? 'Enviando...' : 'Carregar PDF'}
                        </label>
                    </Button>
                    <Input id="presentation-upload" type="file" className="sr-only" accept="application/pdf" onChange={handleFileChange} disabled={isUploading}/>
                </div>
            )}
        </div>

        <div>
          <FormLabel>Entregáveis</FormLabel>
          <div className="space-y-2 mt-2">
            {fields.map((field, index) => (
              <FormField key={field.id} control={form.control} name={`deliverables.${index}.value`} render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Textarea placeholder={`Entregável ${index + 1}`} {...field} rows={1} /></FormControl>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}> <Trash2 className="h-4 w-4 text-destructive" /> </Button>
                </FormItem>
              )}/>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}> <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Entregável </Button>
        </div>

        <Separator />
        
        <Collapsible>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                    <div className='flex items-center gap-2'><ClipboardCheck /> Processo de Onboarding (Opcional)</div>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4">
                 <Accordion type="multiple" className="w-full">
                    {days.map(day => {
                        const dayFields = onboardingFields
                            .map((field, index) => ({ ...field, originalIndex: index }))
                            .filter(field => (field as any).day === day);

                        return (
                            <AccordionItem value={String(day)} key={day}>
                                <AccordionTrigger>Dia {day}</AccordionTrigger>
                                <OnboardingAccordionContent className="space-y-4">
                                    {dayFields.length > 0 ? (
                                        dayFields.map((field) => (
                                            <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg bg-background/50">
                                                <div className="flex-grow space-y-3">
                                                    <FormField control={form.control} name={`onboardingSteps.${field.originalIndex}.title`} render={({ field }) => ( <FormItem><FormLabel>Título da Tarefa</FormLabel><FormControl><Input placeholder={`Título da Tarefa`} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                    <FormField control={form.control} name={`onboardingSteps.${field.originalIndex}.description`} render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o que deve ser feito..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOnboardingStep(field.originalIndex)}> <Trash2 className="h-4 w-4 text-destructive" /> </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa para este dia.</p>
                                    )}
                                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => handleAddOnboardingStep(day)}> <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa ao Dia {day} </Button>
                                </OnboardingAccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CollapsibleContent>
        </Collapsible>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4" disabled={form.formState.isSubmitting || isUploading}>
          {form.formState.isSubmitting ? 'Criando...' : 'Criar Produto'}
        </Button>
      </form>
    </Form>
  );
}

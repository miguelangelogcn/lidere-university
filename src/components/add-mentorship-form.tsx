'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useToast } from '@/hooks/use-toast';
import { summarizeTranscription } from '@/ai/flows/summarize-transcription-flow';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addMentorship } from '@/services/followUpService';
import { Loader2, Sparkles } from 'lucide-react';
import { Input } from './ui/input';

const mentorshipSchema = z.object({
    transcription: z.string().min(20, "A transcrição deve ter pelo menos 20 caracteres."),
    summary: z.string().min(1, "O resumo é obrigatório. Gere um resumo a partir da transcrição."),
});

type MentorshipFormValues = z.infer<typeof mentorshipSchema>;

type AddMentorshipFormProps = {
    followUpId: string;
    onSuccess: () => void;
};


export function AddMentorshipForm({ followUpId, onSuccess }: AddMentorshipFormProps) {
    const { toast } = useToast();
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recordingFile, setRecordingFile] = useState<File | null>(null);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    
    const form = useForm<MentorshipFormValues>({
        resolver: zodResolver(mentorshipSchema),
        defaultValues: {
            transcription: '',
            summary: '',
        },
    });

    const handleGenerateSummary = async () => {
        const transcription = form.getValues('transcription');
        if (!transcription || transcription.length < 20) {
            form.setError("transcription", { message: "A transcrição é muito curta para gerar um resumo." });
            return;
        }

        setIsGeneratingSummary(true);
        try {
            const result = await summarizeTranscription({ transcription });
            form.setValue('summary', result.summary, { shouldValidate: true });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao gerar o resumo.' });
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const uploadFile = async (file: File) => {
        const storageRef = ref(storage, `mentorships/${followUpId}/${Date.now()}_${file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return { name: file.name, url: downloadURL };
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro de Upload!', description: `Falha ao enviar ${file.name}.` });
            return null;
        }
    };
    
    const onSubmit = async (data: MentorshipFormValues) => {
        setIsSubmitting(true);
        try {
            let recordingUrl: string | undefined = undefined;
            if (recordingFile) {
                const result = await uploadFile(recordingFile);
                if (result) recordingUrl = result.url;
            }

            const uploadedDocuments: { name: string; url: string }[] = [];
            for (const docFile of documentFiles) {
                const result = await uploadFile(docFile);
                if (result) uploadedDocuments.push(result);
            }
            
            await addMentorship(followUpId, {
                ...data,
                recordingUrl: recordingUrl || null,
                documents: uploadedDocuments
            });
            
            toast({ title: "Sucesso!", description: "Registro de mentoria adicionado." });
            form.reset();
            setRecordingFile(null);
            setDocumentFiles([]);
            onSuccess();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível salvar a mentoria.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg bg-card">
                <FormField control={form.control} name="transcription" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Transcrição da Mentoria</FormLabel>
                        <FormControl><Textarea placeholder="Cole a transcrição da reunião aqui..." rows={8} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <Button type="button" variant="outline" onClick={handleGenerateSummary} disabled={isGeneratingSummary || form.watch('transcription').length < 20}>
                    {isGeneratingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Gerar Resumo com IA
                </Button>

                <FormField control={form.control} name="summary" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Resumo (Gerado por IA)</FormLabel>
                        <FormControl><Textarea readOnly className="bg-muted/50" rows={5} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormItem>
                        <FormLabel>Gravação (Áudio/Vídeo)</FormLabel>
                        <FormControl><Input type="file" onChange={(e) => e.target.files && setRecordingFile(e.target.files[0])} /></FormControl>
                    </FormItem>
                    <FormItem>
                        <FormLabel>Documentos</FormLabel>
                        <FormControl><Input type="file" multiple onChange={(e) => e.target.files && setDocumentFiles(Array.from(e.target.files))} /></FormControl>
                    </FormItem>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs">
                    {recordingFile && <div className="p-2 bg-muted rounded-md border">Gravação: {recordingFile.name}</div>}
                    {documentFiles.map((file, i) => <div key={i} className="p-2 bg-muted rounded-md border">Doc: {file.name}</div>)}
                </div>

                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Registro de Mentoria
                </Button>
            </form>
        </Form>
    );
}

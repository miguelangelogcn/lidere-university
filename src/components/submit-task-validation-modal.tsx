'use client';

import { useState } from 'react';
import { handleTaskValidation } from '@/lib/actions/follow-up';
import type { SerializableActionItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, UploadCloud, Paperclip, X } from 'lucide-react';

type SubmitTaskValidationModalProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: () => void;
    task: SerializableActionItem | null;
    processId: string;
};

export function SubmitTaskValidationModal({ isOpen, onOpenChange, onSuccess, task, processId }: SubmitTaskValidationModalProps) {
    const { toast } = useToast();
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;

        setIsSubmitting(true);
        
        try {
            // 1. Upload files
            const attachmentUrls: { name: string; url: string }[] = [];
            for (const file of files) {
                const storageRef = ref(storage, `validations/${processId}/${task.id}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                attachmentUrls.push({ name: file.name, url: downloadURL });
            }

            // 2. Call server action
            const result = await handleTaskValidation(processId, task.id, {
                validationText: text,
                attachments: attachmentUrls,
            });

            if (result.errors) {
                throw new Error(result.message || 'Falha na validação.');
            }

            toast({ title: 'Sucesso!', description: result.message });
            handleClose();
            onSuccess();
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: error instanceof Error ? error.message : 'Falha ao enviar.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
        }
    };
    
    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };
    
    const handleClose = () => {
        setText('');
        setFiles([]);
        onOpenChange(false);
    };
    
    if (!task) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Validar Tarefa: {task.title}</DialogTitle>
                    <DialogDescription>
                        Envie os arquivos e comentários para que seu mentor valide a conclusão desta tarefa. Todos os campos são opcionais.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="validationText">Comentários</Label>
                        <Textarea 
                            id="validationText" 
                            name="validationText" 
                            placeholder="Deixe um comentário para seu mentor..." 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="attachments">Anexos</Label>
                        <Input id="attachments" type="file" multiple onChange={handleFileChange} />
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2">
                             <Label>Arquivos selecionados</Label>
                             <ul className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                                {files.map((file, index) => (
                                    <li key={index} className="text-sm flex items-center justify-between">
                                        <span className="truncate flex items-center gap-2">
                                            <Paperclip className="h-4 w-4" /> 
                                            {file.name}
                                        </span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <DialogFooter>
                         <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                            Enviar para Validação
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
'use client';

import type { SerializableFollowUpProcess as FollowUpProcess } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from './ui/button';
import { Download, Share2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { AddMentorshipForm } from './add-mentorship-form';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ActionPlanManager } from './action-plan-manager';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

type FollowUpDetailsProps = {
    process: FollowUpProcess;
    onSuccess: () => void;
};

export function FollowUpDetails({ process, onSuccess }: FollowUpDetailsProps) {
    const { toast } = useToast();

    const handleCopyLink = () => {
        const url = `${window.location.origin}/public/acompanhamento/${process.id}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copiado!",
            description: "O link de compartilhamento foi copiado para sua área de transferência.",
        });
    };

    const sortedMentorships = process.mentorships?.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    }) || [];

    return (
        <div className="flex flex-col h-full max-h-[85vh]">
            <div className="p-6 border-b flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-semibold">Gerenciar Acompanhamento</h3>
                 <Button variant="secondary" onClick={handleCopyLink} size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Copiar Link Público
                </Button>
            </div>
            
            <Tabs defaultValue="mentorias" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b flex-shrink-0">
                    <TabsTrigger value="mentorias">Histórico de Mentorias</TabsTrigger>
                    <TabsTrigger value="plano_acao">Plano de Ação</TabsTrigger>
                </TabsList>
                <TabsContent value="mentorias" className="p-6 overflow-y-auto flex-grow space-y-6">
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Registro de Mentoria
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                            <AddMentorshipForm followUpId={process.id} onSuccess={onSuccess} />
                        </CollapsibleContent>
                    </Collapsible>
                    
                    {sortedMentorships.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {sortedMentorships.map(mentorship => (
                                <AccordionItem value={mentorship.id} key={mentorship.id}>
                                    <AccordionTrigger>
                                        Mentoria - {mentorship.createdAt ? format(new Date(mentorship.createdAt), 'dd/MM/yyyy') : 'Data não disponível'}
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Resumo (Gerado por IA)</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mentorship.summary}</p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-semibold mb-2">Transcrição Completa</h4>
                                            <div className="h-40 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground bg-muted/50 whitespace-pre-wrap">
                                                {mentorship.transcription}
                                            </div>
                                        </div>
                                        
                                        {mentorship.recordingUrl && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Gravação</h4>
                                                <audio controls src={mentorship.recordingUrl} className="w-full" />
                                            </div>
                                        )}
    
                                        {mentorship.documents && mentorship.documents.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Documentos</h4>
                                                <ul className="space-y-2">
                                                    {mentorship.documents.map((doc, index) => (
                                                       <li key={index}>
                                                            <Button asChild variant="outline" size="sm">
                                                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                <Download className="mr-2 h-4 w-4" />
                                                                {doc.name}
                                                              </a>
                                                            </Button>
                                                       </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum registro de mentoria encontrado.
                        </p>
                    )}
                </TabsContent>
                <TabsContent value="plano_acao" className="p-6 overflow-y-auto flex-grow">
                    <ActionPlanManager process={process} onSuccess={onSuccess} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

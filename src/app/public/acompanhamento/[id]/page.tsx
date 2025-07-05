import { getFollowUpProcessById } from '@/services/followUpService';
import { notFound } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Film, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default async function PublicFollowUpPage({ params }: { params: { id: string } }) {
    const process = await getFollowUpProcessById(params.id);

    if (!process) {
        notFound();
    }
    
    const sortedMentorships = process.mentorships?.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    }) || [];

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Acompanhamento de Mentoria</h1>
                        <p className="text-muted-foreground">Cliente: {process.contactName}</p>
                        <p className="text-muted-foreground">Produto: {process.productName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                        <Logo className="h-8 w-8" />
                        <span className="font-semibold font-headline">Lidere University</span>
                    </div>
                </header>

                <main>
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Mentorias</CardTitle>
                            <CardDescription>
                                Abaixo estão os resumos e materiais de todas as sessões de mentoria realizadas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {sortedMentorships.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full" defaultValue={sortedMentorships[0]?.id}>
                                    {sortedMentorships.map(mentorship => (
                                        <AccordionItem value={mentorship.id} key={mentorship.id}>
                                            <AccordionTrigger>
                                                Mentoria - {mentorship.createdAt?.seconds ? format(new Date(mentorship.createdAt.seconds * 1000), 'dd/MM/yyyy') : 'Data não disponível'}
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-6">
                                                <div>
                                                    <h4 className="font-semibold mb-2 text-base">Resumo da Sessão</h4>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mentorship.summary}</p>
                                                </div>
                                                
                                                {(mentorship.recordingUrl || (mentorship.documents && mentorship.documents.length > 0)) && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2 text-base">Materiais de Apoio</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {mentorship.recordingUrl && (
                                                                <Button asChild variant="outline" size="sm">
                                                                <a href={mentorship.recordingUrl} target="_blank" rel="noopener noreferrer">
                                                                    <Film className="mr-2 h-4 w-4" />
                                                                    Assistir Gravação
                                                                </a>
                                                                </Button>
                                                            )}
                                                            {mentorship.documents && mentorship.documents.map((doc, index) => (
                                                                <Button asChild variant="outline" size="sm" key={index}>
                                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                        <FileText className="mr-2 h-4 w-4" />
                                                                        Baixar {doc.name}
                                                                    </a>
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 className="font-semibold mb-2 text-base">Transcrição Completa</h4>
                                                    <div className="h-48 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground bg-muted/50 whitespace-pre-wrap">
                                                        {mentorship.transcription}
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Nenhum registro de mentoria encontrado para este acompanhamento.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </main>
                <footer className="text-center mt-12 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Lidere University. Todos os direitos reservados.</p>
                </footer>
            </div>
        </div>
    );
}

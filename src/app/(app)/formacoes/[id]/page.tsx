import { getFormationById } from "@/services/formationService";
import { MainHeader } from "@/components/main-header";
import { notFound } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Download, BookOpen } from "lucide-react";

export default async function FormationDetailsPage({ params }: { params: { id: string } }) {
  const formation = await getFormationById(params.id);

  if (!formation) {
    notFound();
  }

  return (
    <>
      <MainHeader title={formation.title} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-2 text-4xl font-bold font-headline">{formation.title}</h1>
                <p className="mb-8 text-lg text-muted-foreground">{formation.description}</p>
                
                <h2 className="mb-4 text-2xl font-semibold font-headline">Módulos do Curso</h2>
                
                {formation.modules && formation.modules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {formation.modules.map(module => (
                            <AccordionItem value={`module-${module.id}`} key={module.id} className="rounded-lg border bg-card shadow-sm">
                                <AccordionTrigger className="px-6 py-4 text-lg hover:no-underline">
                                    {module.title}
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4">
                                    <ul className="space-y-3">
                                        {module.lessons.map(lesson => (
                                            <li key={lesson.id} className="rounded-md border p-4 transition-colors hover:bg-muted/50">
                                                <h4 className="font-semibold">{lesson.title}</h4>

                                                {lesson.videoUrl && (
                                                    <div className="mt-4 aspect-video overflow-hidden rounded-md">
                                                         <iframe
                                                            src={lesson.videoUrl}
                                                            title={lesson.title}
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            className="h-full w-full"
                                                        ></iframe>
                                                    </div>
                                                )}

                                                {lesson.textContent && (
                                                    <div className="prose prose-sm mt-4 max-w-none text-muted-foreground">
                                                        <h5 className="mb-2 flex items-center gap-2 font-semibold text-card-foreground">
                                                          <BookOpen size={16} />  Conteúdo da Aula
                                                        </h5>
                                                        <p>{lesson.textContent}</p>
                                                    </div>
                                                )}

                                                {lesson.attachments && lesson.attachments.length > 0 && (
                                                     <div className="mt-4">
                                                        <h5 className="mb-2 flex items-center gap-2 font-semibold">
                                                          <FileText size={16} />  Materiais de Apoio
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {lesson.attachments.map((doc, index) => (
                                                                <Button asChild key={index} variant="outline" size="sm">
                                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                        {doc.name}
                                                                    </a>
                                                                </Button>
                                                            ))}
                                                        </div>
                                                     </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Nenhum módulo cadastrado para esta formação ainda.</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </>
  );
}

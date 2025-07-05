'use client';

import { useState, useEffect } from 'react';
import type { Formation, Lesson } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Download, BookOpen, ChevronRight } from "lucide-react";
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

export function FormationViewer({ formation }: { formation: Formation }) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Select the first lesson of the first module by default
  useEffect(() => {
    if (formation?.modules?.[0]?.lessons?.[0]) {
      setSelectedLesson(formation.modules[0].lessons[0]);
    }
  }, [formation]);

  return (
    <main className="grid flex-1 grid-cols-1 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] overflow-hidden">
      {/* Left Column: Modules and Lessons */}
      <div className="flex flex-col border-r bg-muted/40">
        <ScrollArea className="flex-1">
          <div className="p-4">
            <h2 className="mb-4 text-xl font-semibold font-headline">{formation.title}</h2>
            <Accordion type="multiple" defaultValue={formation.modules.map(m => `module-${m.id}`)} className="w-full space-y-2">
              {formation.modules.map(module => (
                <AccordionItem value={`module-${module.id}`} key={module.id} className="rounded-lg border bg-card shadow-sm">
                  <AccordionTrigger className="px-4 py-3 text-base hover:no-underline">
                    {module.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    <ul className="space-y-1">
                      {module.lessons.map(lesson => (
                        <li key={lesson.id}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 px-2 py-5 text-left h-auto font-normal",
                              selectedLesson?.id === lesson.id && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setSelectedLesson(lesson)}
                          >
                            <PlayCircle className="h-5 w-5 shrink-0" />
                            <span className="flex-1">{lesson.title}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
      </div>

      {/* Right Column: Lesson Content */}
      <div className="flex-1">
        <ScrollArea className="h-[calc(100vh-4rem)]">
          {selectedLesson ? (
            <div className="p-6 md:p-8 space-y-6">
              <h1 className="text-3xl font-bold font-headline">{selectedLesson.title}</h1>
              
              {selectedLesson.videoUrl && (
                <div className="aspect-video overflow-hidden rounded-lg border">
                  <iframe
                    src={selectedLesson.videoUrl}
                    title={selectedLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  ></iframe>
                </div>
              )}

              {selectedLesson.textContent && (
                <div className="prose prose-lg mt-6 max-w-none text-foreground">
                  <h3 className="mb-2 flex items-center gap-2 text-xl font-semibold">
                    <BookOpen size={20} />  Conteúdo da Aula
                  </h3>
                  <div className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.textContent}</div>
                </div>
              )}

              {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 flex items-center gap-2 text-xl font-semibold">
                    <FileText size={20} />  Materiais de Apoio
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.attachments.map((doc, index) => (
                      <Button asChild key={index} variant="outline">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          {doc.name}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <h2 className="text-2xl font-semibold">Selecione uma aula</h2>
                <p>Escolha uma aula no menu ao lado para começar a aprender.</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </main>
  );
}

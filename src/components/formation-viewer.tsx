'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SerializableFormation, SerializableLesson } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Download, BookOpen, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LessonComments } from './lesson-comments';
import { getEmbedUrl } from '@/lib/utils';

// Combined type for flattened lessons
type EnrichedLesson = SerializableLesson & {
  moduleId: string;
  moduleTitle: string;
};

export function FormationViewer({ formation }: { formation: SerializableFormation }) {
  const [selectedLesson, setSelectedLesson] = useState<EnrichedLesson | null>(null);

  // Flatten lessons and select the first one by default
  const allLessons = useMemo((): EnrichedLesson[] => {
    return formation.modules.flatMap(module => 
      module.lessons.map(lesson => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title
      }))
    );
  }, [formation]);

  useEffect(() => {
    if (allLessons.length > 0) {
      setSelectedLesson(allLessons[0]);
    }
  }, [allLessons]);

  const currentLessonIndex = useMemo(() => {
    if (!selectedLesson) return -1;
    return allLessons.findIndex(lesson => lesson.id === selectedLesson.id);
  }, [selectedLesson, allLessons]);
  
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const handleSelectLesson = (lessonId: string) => {
    const lesson = allLessons.find(l => l.id === lessonId);
    if (lesson) {
      setSelectedLesson(lesson);
    }
  };
  
  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between p-4 border-b bg-muted/40 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
           {/* Breadcrumbs */}
           <span className="font-semibold text-foreground truncate">{formation.title}</span>
           <ChevronRight className="h-4 w-4 flex-shrink-0" />
           <span className="truncate">{selectedLesson?.moduleTitle}</span>
           <ChevronRight className="h-4 w-4 flex-shrink-0" />
           <span className="text-foreground truncate">{selectedLesson?.title}</span>
        </div>

        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => previousLesson && setSelectedLesson(previousLesson)} disabled={!previousLesson}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline-block sm:ml-1">Anterior</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => nextLesson && setSelectedLesson(nextLesson)} disabled={!nextLesson}>
                <span className="hidden sm:inline-block sm:mr-1">Próxima</span>
                <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Lessons Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Ver aulas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Aulas do Curso</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-96">
                  {formation.modules.map(module => (
                    <DropdownMenuGroup key={module.id}>
                      <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{module.title}</DropdownMenuLabel>
                      {module.lessons.map(lesson => (
                        <DropdownMenuItem key={lesson.id} onSelect={() => handleSelectLesson(lesson.id)} disabled={selectedLesson?.id === lesson.id}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          <span>{lesson.title}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      {/* Lesson Content */}
      <ScrollArea className="flex-1">
        {selectedLesson ? (
          <div className="p-6 md:p-8 lg:p-12 mx-auto max-w-4xl space-y-8">
            <h1 className="text-3xl lg:text-4xl font-bold font-headline">{selectedLesson.title}</h1>
            
            {selectedLesson.videoUrl && (
              <div className="aspect-video overflow-hidden rounded-lg border shadow-lg">
                <iframe
                  src={getEmbedUrl(selectedLesson.videoUrl)}
                  title={selectedLesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                ></iframe>
              </div>
            )}

            {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
              <div className="mt-8">
                 <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold border-b pb-2">
                    <FileText size={24} />  Materiais de Apoio
                  </h2>
                <div className="flex flex-col gap-3">
                  {selectedLesson.attachments.map((doc, index) => (
                    <Button asChild key={index} variant="outline" className="justify-start">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        {doc.name}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedLesson.textContent && (
              <div className="prose prose-lg mt-8 max-w-none text-foreground">
                 <h2 className="mb-4 flex items-center gap-3 text-2xl font-semibold border-b pb-2">
                    <BookOpen size={24} />  Conteúdo da Aula
                  </h2>
                <div className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.textContent}</div>
              </div>
            )}
            
            <LessonComments
              formationId={formation.id}
              moduleId={selectedLesson.moduleId}
              lesson={selectedLesson}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div>
              <h2 className="text-2xl font-semibold">Selecione uma aula</h2>
              <p>Use o menu no canto superior direito para navegar pelo curso.</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

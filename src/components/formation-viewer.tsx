'use client';

import { useState, useEffect, useMemo, useActionState, useRef } from 'react';
import type { SerializableFormation, SerializableLesson, AppUser } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Download, BookOpen, ChevronLeft, ChevronRight, Menu, CheckCircle, Loader2 } from "lucide-react";
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
import { useAuth } from '@/context/auth-provider';
import { Progress } from './ui/progress';
import { toggleLessonCompletion, type LessonCompletionState } from '@/lib/actions/formationActions';
import { useFormStatus } from 'react-dom';

// Combined type for flattened lessons
type EnrichedLesson = SerializableLesson & {
  moduleId: string;
  moduleTitle: string;
};

function CompletionButton({ isCompleted, isStudent }: { isCompleted: boolean, isStudent: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" disabled={pending || !isStudent}>
            {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCompleted ? (
                <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline-block sm:ml-1">Concluído</span>
                </>
            ) : (
                <span className="hidden sm:inline-block">Marcar como concluída</span>
            )}
        </Button>
    )
}


export function FormationViewer({ formation }: { formation: SerializableFormation }) {
  const { user, setUser } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<EnrichedLesson | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const initialState: LessonCompletionState = { message: null, error: null };
  const toggleCompletionWithContext = toggleLessonCompletion.bind(null, user?.contactId || '', formation.id);
  const [state, formAction] = useActionState(toggleCompletionWithContext, initialState);

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
  
   // Optimistic update of user progress
  useEffect(() => {
    if (formRef.current) {
        const formData = new FormData(formRef.current);
        const lessonId = formData.get('lessonId') as string;
        const isCompleted = formData.get('isCompleted') === 'true';

        if (user && lessonId) {
            const newProgress = JSON.parse(JSON.stringify(user.formationProgress || {}));
            if (!newProgress[formation.id]) {
                newProgress[formation.id] = [];
            }
            
            const completedLessons = newProgress[formation.id];
            
            if (isCompleted) {
                if (!completedLessons.includes(lessonId)) {
                    newProgress[formation.id].push(lessonId);
                }
            } else {
                newProgress[formation.id] = completedLessons.filter((id: string) => id !== lessonId);
            }
            
            if (JSON.stringify(newProgress) !== JSON.stringify(user.formationProgress)) {
                setUser({ ...user, formationProgress: newProgress });
            }
        }
    }
  }, [state, setUser, user, formation.id]);


  const currentLessonIndex = useMemo(() => {
    if (!selectedLesson) return -1;
    return allLessons.findIndex(lesson => lesson.id === selectedLesson.id);
  }, [selectedLesson, allLessons]);
  
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;
  
  const completedLessonsForThisFormation = user?.formationProgress?.[formation.id] || [];
  const completedCount = completedLessonsForThisFormation.length;
  const totalLessonsCount = allLessons.length;
  const progressPercentage = totalLessonsCount > 0 ? (completedCount / totalLessonsCount) * 100 : 0;
  
  const isCurrentLessonCompleted = selectedLesson ? completedLessonsForThisFormation.includes(selectedLesson.id) : false;

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
            <form action={formAction} ref={formRef}>
                <input type="hidden" name="lessonId" value={selectedLesson?.id || ''} />
                <input type="hidden" name="isCompleted" value={String(!isCurrentLessonCompleted)} />
                <CompletionButton isCompleted={isCurrentLessonCompleted} isStudent={!!user?.contactId} />
            </form>
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
                      {module.lessons.map(lesson => {
                        const isCompleted = completedLessonsForThisFormation.includes(lesson.id);
                        return (
                          <DropdownMenuItem key={lesson.id} onSelect={() => handleSelectLesson(lesson.id)} disabled={selectedLesson?.id === lesson.id}>
                           {isCompleted ? <CheckCircle className="mr-2 h-4 w-4 text-primary" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                            <span>{lesson.title}</span>
                          </DropdownMenuItem>
                        )
                      })}
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
            {totalLessonsCount > 0 && user?.contactId && (
              <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progresso do Curso</span>
                      <span>{completedCount} / {totalLessonsCount} aulas</span>
                  </div>
                  <Progress value={progressPercentage} aria-label={`${Math.round(progressPercentage)}% concluído`} />
              </div>
            )}
            
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

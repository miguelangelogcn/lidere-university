'use client';

import { useState, useEffect } from "react";
import type { OnboardingProcess, OnboardingStep } from "@/lib/types";
import { getOnboardingSteps } from "@/services/onboardingService";
import { updateOnboardingProcess } from "@/services/deliveryService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type OnboardingKanbanModalProps = {
  onboardingProcess: OnboardingProcess | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function OnboardingKanbanModal({ onboardingProcess, onOpenChange, onSuccess }: OnboardingKanbanModalProps) {
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (onboardingProcess?.productId) {
      async function fetchOnboarding() {
        setLoadingSteps(true);
        const steps = await getOnboardingSteps(onboardingProcess.productId);
        setOnboardingSteps(steps);
        setCheckedSteps(onboardingProcess.onboardingProgress || {});
        setLoadingSteps(false);
      }
      fetchOnboarding();
    } else {
      setOnboardingSteps([]);
      setCheckedSteps({});
    }
  }, [onboardingProcess]);
  
  const handleCheckChange = async (stepId: string) => {
    if (!onboardingProcess) return;

    const newCheckedState = !checkedSteps[stepId];
    const newProgress = { ...checkedSteps, [stepId]: newCheckedState };
    
    // Optimistic UI update
    setCheckedSteps(newProgress);

    try {
        await updateOnboardingProcess(onboardingProcess.id, { onboardingProgress: newProgress });
        onSuccess(); // Refreshes the main board if needed
    } catch(err) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao salvar progresso.' });
        // Revert UI on failure
        setCheckedSteps(checkedSteps);
    }
  };

  const stepsByDay = onboardingSteps.reduce((acc, step) => {
    (acc[step.day] = acc[step.day] || []).push(step);
    return acc;
  }, {} as Record<number, OnboardingStep[]>);

  const days = Array.from({ length: 8 }, (_, i) => i); // D0 to D7

  return (
    <Dialog open={!!onboardingProcess} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        {onboardingProcess && (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Onboarding: {onboardingProcess.productName}</DialogTitle>
              <DialogDescription>
                Cliente: {onboardingProcess.contactName} - Acompanhe as tarefas do onboarding.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden px-6 pb-6">
                {loadingSteps ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : onboardingSteps.length > 0 ? (
                    <ScrollArea className="w-full h-full whitespace-nowrap">
                        <div className="flex w-max space-x-4 pb-4">
                            {days.map(day => (
                                <div key={day} className="flex flex-col gap-4 min-w-[300px] max-w-[320px]">
                                    <div className="font-semibold p-2 bg-muted rounded-md text-center sticky top-0">
                                        Dia {day}
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {(stepsByDay[day] || []).map(step => (
                                            <Card key={step.id} className={checkedSteps[step.id] ? 'bg-muted/50' : ''}>
                                                <CardHeader>
                                                    <CardTitle className="flex items-start gap-3 text-base whitespace-normal">
                                                        <Checkbox
                                                            id={`step-${step.id}`}
                                                            checked={!!checkedSteps[step.id]}
                                                            onCheckedChange={() => handleCheckChange(step.id)}
                                                            className="h-5 w-5 mt-0.5 shrink-0"
                                                        />
                                                        <label 
                                                            htmlFor={`step-${step.id}`}
                                                            className={`cursor-pointer ${checkedSteps[step.id] ? 'line-through text-muted-foreground' : ''}`}
                                                        >
                                                            {step.title}
                                                        </label>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground whitespace-normal">{step.description}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {(stepsByDay[day] || []).length === 0 && (
                                            <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg h-24 flex items-center justify-center">
                                                Nenhuma tarefa.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                ) : (
                    <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                        <h3 className="text-lg font-semibold">Nenhum passo de onboarding</h3>
                        <p className="text-muted-foreground">Configure os passos de onboarding para este produto no gerenciador.</p>
                    </div>
                )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

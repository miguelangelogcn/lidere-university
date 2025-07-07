'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import type { OnboardingProcess } from '@/lib/types';
import { DeliveryCard } from './delivery-card';
import { useMemo } from 'react';

type OnboardingColumnProps = {
  id: string;
  title: string;
  onboardingProcesses: OnboardingProcess[];
  onCardClick: (onboardingProcess: OnboardingProcess) => void;
  onDeleteProcess: (onboardingProcess: OnboardingProcess) => void;
};

export function DeliveryColumn({ id, title, onboardingProcesses, onCardClick, onDeleteProcess }: OnboardingColumnProps) {
  const { setNodeRef } = useSortable({ id });

  const onboardingProcessIds = useMemo(() => onboardingProcesses.map((d) => d.id), [onboardingProcesses]);

  return (
    <div
      ref={setNodeRef}
      className="flex w-full flex-col rounded-lg bg-muted/50 p-4 md:w-80 lg:w-96"
    >
      <h3 className="mb-4 text-lg font-semibold">{title} ({onboardingProcesses.length})</h3>
      <div className="flex flex-grow flex-col">
        <SortableContext items={onboardingProcessIds}>
          {onboardingProcesses.map((onboardingProcess) => (
            <DeliveryCard
              key={onboardingProcess.id}
              onboardingProcess={onboardingProcess}
              onClick={() => onCardClick(onboardingProcess)}
              onDelete={() => onDeleteProcess(onboardingProcess)}
            />
          ))}
        </SortableContext>
        {onboardingProcesses.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhum onboarding nesta etapa.
            </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OnboardingProcess } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Package } from 'lucide-react';

type OnboardingCardProps = {
  onboardingProcess: OnboardingProcess;
  onClick: () => void;
};

export function DeliveryCard({ onboardingProcess, onClick }: OnboardingCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: onboardingProcess.id });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        onClick={onClick}
        className={`mb-4 cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-50 shadow-lg' : 'shadow-sm'
        }`}
      >
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{onboardingProcess.contactName}</CardTitle>
          <CardDescription className="flex items-center gap-2 pt-1 text-xs">
            <Package className="h-3 w-3" />
            {onboardingProcess.productName}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OnboardingProcess } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';

type OnboardingCardProps = {
  onboardingProcess: OnboardingProcess;
  onClick: () => void;
  onDelete: () => void;
};

export function DeliveryCard({ onboardingProcess, onClick, onDelete }: OnboardingCardProps) {
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

  const handleDeleteClick = (e: Event) => {
    e.stopPropagation();
    onDelete();
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        onClick={onClick}
        className={`mb-4 cursor-grab active:cursor-grabbing relative group ${
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Ações do Onboarding</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <DropdownMenuItem 
                    className="text-destructive" 
                    onSelect={handleDeleteClick}
                >
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </div>
  );
}

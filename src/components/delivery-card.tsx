'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Delivery } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Package } from 'lucide-react';

type DeliveryCardProps = {
  delivery: Delivery;
  onClick: () => void;
};

export function DeliveryCard({ delivery, onClick }: DeliveryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: delivery.id });

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
          <CardTitle className="text-base font-semibold">{delivery.contactName}</CardTitle>
          <CardDescription className="flex items-center gap-2 pt-1 text-xs">
            <Package className="h-3 w-3" />
            {delivery.productName}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

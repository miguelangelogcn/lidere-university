'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import type { Delivery } from '@/lib/types';
import { DeliveryCard } from './delivery-card';
import { useMemo } from 'react';

type DeliveryColumnProps = {
  id: string;
  title: string;
  deliveries: Delivery[];
  onCardClick: (delivery: Delivery) => void;
};

export function DeliveryColumn({ id, title, deliveries, onCardClick }: DeliveryColumnProps) {
  const { setNodeRef } = useSortable({ id });

  const deliveryIds = useMemo(() => deliveries.map((d) => d.id), [deliveries]);

  return (
    <div
      ref={setNodeRef}
      className="flex w-full flex-col rounded-lg bg-muted/50 p-4 md:w-80 lg:w-96"
    >
      <h3 className="mb-4 text-lg font-semibold">{title} ({deliveries.length})</h3>
      <div className="flex flex-grow flex-col">
        <SortableContext items={deliveryIds}>
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onClick={() => onCardClick(delivery)}
            />
          ))}
        </SortableContext>
        {deliveries.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhuma entrega nesta etapa.
            </div>
        )}
      </div>
    </div>
  );
}

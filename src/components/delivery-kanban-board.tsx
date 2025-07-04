'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Delivery } from '@/lib/types';
import { getDeliveries, updateDelivery } from '@/services/deliveryService';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { DeliveryColumn } from './delivery-column';
import { DeliveryCard } from './delivery-card';
import { OnboardingKanbanModal } from './onboarding-kanban-modal';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ColumnId = 'todo' | 'doing' | 'done';

const columnTitles: Record<ColumnId, string> = {
    todo: 'A fazer',
    doing: 'Fazendo',
    done: 'Feito'
};

export function DeliveryKanbanBoard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const { toast } = useToast();

  const fetchDeliveries = async () => {
    setLoading(true);
    const data = await getDeliveries();
    setDeliveries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const columns = useMemo(() => {
    const grouped: Record<ColumnId, Delivery[]> = { todo: [], doing: [], done: [] };
    deliveries.forEach((d) => {
        if (d.status in grouped) {
            grouped[d.status].push(d);
        }
    });
    return grouped;
  }, [deliveries]);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
        distance: 5,
    },
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const delivery = deliveries.find((d) => d.id === active.id);
    if (delivery) {
      setActiveDelivery(delivery);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDelivery(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;
    
    const activeDeliveryItem = deliveries.find(d => d.id === active.id);
    if (!activeDeliveryItem) return;

    const overColumnId = over.id as ColumnId;
    const isColumn = ['todo', 'doing', 'done'].includes(overColumnId);
    
    // Check if dropping over a valid column and the status is different
    if (isColumn && activeDeliveryItem.status !== overColumnId) {
        const newDeliveries = deliveries.map(d => 
            d.id === active.id ? { ...d, status: overColumnId } : d
        );
        setDeliveries(newDeliveries);

        try {
            await updateDelivery(active.id as string, { status: overColumnId });
            toast({ title: 'Sucesso!', description: 'Status da entrega atualizado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao atualizar o status.' });
            setDeliveries(deliveries); // Revert on failure
        }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="flex h-full gap-6 p-4">
          {(Object.keys(columns) as ColumnId[]).map((columnId) => (
            <DeliveryColumn
              key={columnId}
              id={columnId}
              title={columnTitles[columnId]}
              deliveries={columns[columnId]}
              onCardClick={setSelectedDelivery}
            />
          ))}
        </div>
        
        {typeof document !== 'undefined' && createPortal(
          <DragOverlay>
            {activeDelivery && <DeliveryCard delivery={activeDelivery} onClick={() => {}} />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <OnboardingKanbanModal
        delivery={selectedDelivery}
        onOpenChange={(open) => !open && setSelectedDelivery(null)}
        onSuccess={fetchDeliveries}
      />
    </>
  );
}

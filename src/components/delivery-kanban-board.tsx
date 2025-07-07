
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { OnboardingProcess } from '@/lib/types';
import { getOnboardingProcesses, updateOnboardingProcess, deleteOnboardingProcess } from '@/services/deliveryService';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { DeliveryColumn } from './delivery-column';
import { DeliveryCard } from './delivery-card';
import { OnboardingKanbanModal } from './onboarding-kanban-modal';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createFollowUpProcess } from '@/services/followUpService';
import { getProductById } from '@/services/productService';

type ColumnId = 'todo' | 'doing' | 'done';

const columnTitles: Record<ColumnId, string> = {
    todo: 'A fazer',
    doing: 'Fazendo',
    done: 'Feito'
};

export function DeliveryKanbanBoard() {
  const [onboardingProcesses, setOnboardingProcesses] = useState<OnboardingProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnboardingProcess, setActiveOnboardingProcess] = useState<OnboardingProcess | null>(null);
  const [selectedOnboardingProcess, setSelectedOnboardingProcess] = useState<OnboardingProcess | null>(null);
  const [isConfirmDoneDialogOpen, setIsConfirmDoneDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ activeId: string; overId: ColumnId } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState<OnboardingProcess | null>(null);
  const { toast } = useToast();

  const fetchOnboardingProcesses = async () => {
    setLoading(true);
    const data = await getOnboardingProcesses();
    setOnboardingProcesses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOnboardingProcesses();
  }, []);

  const columns = useMemo(() => {
    const grouped: Record<ColumnId, OnboardingProcess[]> = { todo: [], doing: [], done: [] };
    onboardingProcesses.forEach((d) => {
        if (d.status in grouped) {
            grouped[d.status].push(d);
        }
    });
    return grouped;
  }, [onboardingProcesses]);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
        distance: 5,
    },
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const process = onboardingProcesses.find((d) => d.id === active.id);
    if (process) {
      setActiveOnboardingProcess(process);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOnboardingProcess(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;
    
    const activeItem = onboardingProcesses.find(d => d.id === active.id);
    if (!activeItem) return;

    const overColumnId = over.id as ColumnId;
    const isColumn = ['todo', 'doing', 'done'].includes(overColumnId);
    
    if (isColumn && activeItem.status !== overColumnId) {
        if (overColumnId === 'done') {
            setPendingMove({ activeId: active.id as string, overId: overColumnId });
            setIsConfirmDoneDialogOpen(true);
        } else {
            const newOnboardingProcesses = onboardingProcesses.map(d => 
                d.id === active.id ? { ...d, status: overColumnId } : d
            );
            setOnboardingProcesses(newOnboardingProcesses);

            try {
                await updateOnboardingProcess(active.id as string, { status: overColumnId });
                toast({ title: 'Sucesso!', description: 'Status do onboarding atualizado.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao atualizar o status.' });
                setOnboardingProcesses(onboardingProcesses); // Revert on failure
            }
        }
    }
  };

  const handleConfirmDone = async () => {
    if (!pendingMove) return;

    const { activeId, overId } = pendingMove;
    const activeItem = onboardingProcesses.find(d => d.id === activeId);

    if (!activeItem) {
        setPendingMove(null);
        return;
    }

    const originalProcesses = [...onboardingProcesses];
    const newOnboardingProcesses = onboardingProcesses.map(d =>
        d.id === activeId ? { ...d, status: overId } : d
    );
    setOnboardingProcesses(newOnboardingProcesses);

    try {
        await updateOnboardingProcess(activeId, { status: overId });
        
        const product = await getProductById(activeItem.productId);
        let followUpEndDate: Date | null = null;
        let shouldCreateFollowUp = false;

        if (product && product.hasFollowUp) {
            shouldCreateFollowUp = true;
            if (product.followUpDays && product.followUpDays > 0) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + product.followUpDays);
                followUpEndDate = endDate;
            }
        }

        if (shouldCreateFollowUp) {
            await createFollowUpProcess({
                contactId: activeItem.contactId,
                contactName: activeItem.contactName,
                productId: activeItem.productId,
                productName: activeItem.productName,
                followUpEndDate: followUpEndDate,
            });
            toast({ title: 'Onboarding Concluído!', description: 'Um card de acompanhamento foi criado.' });
        } else {
             toast({ title: 'Onboarding Concluído!', description: 'Nenhum acompanhamento necessário para este produto.' });
        }
        
        fetchOnboardingProcesses(); 
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao concluir o onboarding.' });
        setOnboardingProcesses(originalProcesses);
    } finally {
        setPendingMove(null);
        setIsConfirmDoneDialogOpen(false);
    }
  };

  const handleOpenDeleteDialog = (process: OnboardingProcess) => {
    setProcessToDelete(process);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOnboarding = async () => {
    if (!processToDelete) return;
    try {
        await deleteOnboardingProcess(processToDelete.id);
        toast({ title: 'Sucesso!', description: 'Onboarding excluído.' });
        fetchOnboardingProcesses();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao excluir o onboarding.' });
    } finally {
        setIsDeleteDialogOpen(false);
        setProcessToDelete(null);
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
              onboardingProcesses={columns[columnId]}
              onCardClick={setSelectedOnboardingProcess}
              onDeleteProcess={handleOpenDeleteDialog}
            />
          ))}
        </div>
        
        {typeof document !== 'undefined' && createPortal(
          <DragOverlay>
            {activeOnboardingProcess && <DeliveryCard onboardingProcess={activeOnboardingProcess} onClick={() => {}} onDelete={() => {}} />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <OnboardingKanbanModal
        onboardingProcess={selectedOnboardingProcess}
        onOpenChange={(open) => !open && setSelectedOnboardingProcess(null)}
        onSuccess={fetchOnboardingProcesses}
      />

      <AlertDialog open={isConfirmDoneDialogOpen} onOpenChange={setIsConfirmDoneDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará o onboarding como "Feito". Se o produto tiver acompanhamento, um novo card será criado. Você tem certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingMove(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDone}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível e irá excluir permanentemente o processo de onboarding para <span className="font-bold">{processToDelete?.contactName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProcessToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOnboarding} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

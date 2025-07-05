'use client';

import { useState } from 'react';
import { DeliveryKanbanBoard } from "@/components/delivery-kanban-board";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AddDeliveryForm } from '@/components/add-delivery-form';

export default function DeliveriesPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    // We need a way to trigger a refresh on the kanban board
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setIsAddDialogOpen(false);
        setRefreshKey(prev => prev + 1); // Increment key to trigger re-fetch in kanban board
    }

    return (
        <div className="flex flex-col h-full">
            <MainHeader title="Gestão de Entregas">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Adicionar Entrega
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Adicionar Nova Entrega</DialogTitle>
                          <DialogDescription>
                            Selecione o contato e o produto para iniciar um novo onboarding.
                          </DialogDescription>
                        </DialogHeader>
                        <AddDeliveryForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </MainHeader>
            <main className="flex-1 overflow-y-auto">
                <DeliveryKanbanBoard key={refreshKey} />
            </main>
        </div>
    )
}

'use client';
import { DeliveryKanbanBoard } from "@/components/delivery-kanban-board";
import { MainHeader } from "@/components/main-header";

export default function DeliveriesPage() {
    return (
        <div className="flex flex-col h-full">
            <MainHeader title="Gestão de Entregas" />
            <main className="flex-1 overflow-y-auto">
                <DeliveryKanbanBoard />
            </main>
        </div>
    )
}

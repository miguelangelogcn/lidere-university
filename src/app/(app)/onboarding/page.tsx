'use client';

import { useState, useEffect } from 'react';
import { DeliveryKanbanBoard } from "@/components/delivery-kanban-board";
import { MainHeader } from "@/components/main-header";
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AddDeliveryForm } from '@/components/add-delivery-form';
import { ManageOnboardings } from '@/components/manage-onboardings';
import { getProducts } from '@/services/productService';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchProducts() {
            setLoadingProducts(true);
            try {
                const productList = await getProducts();
                setProducts(productList);
            } catch (error) {
                toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar produtos para gerenciamento." });
            } finally {
                setLoadingProducts(false);
            }
        }
        if (isManageDialogOpen) {
            fetchProducts();
        }
    }, [isManageDialogOpen, toast]);

    const handleSuccess = () => {
        setIsAddDialogOpen(false);
        setIsManageDialogOpen(false);
        setRefreshKey(prev => prev + 1);
    }

    return (
        <div className="flex flex-col h-full">
            <MainHeader title="Gestão de Onboarding">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Adicionar Onboarding
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Onboarding</DialogTitle>
                          <DialogDescription>
                            Selecione o contato e o produto para iniciar um novo onboarding.
                          </DialogDescription>
                        </DialogHeader>
                        <AddDeliveryForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
                
                <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Gerenciar Onboardings
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0">
                       {loadingProducts ? (
                         <div className="p-6">
                           <DialogHeader>
                               <DialogTitle>Gerenciar Onboardings</DialogTitle>
                               <DialogDescription>Carregando produtos...</DialogDescription>
                           </DialogHeader>
                           <div className="flex items-center justify-center h-48">
                               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                           </div>
                         </div>
                       ) : (
                         <ManageOnboardings products={products} onSuccess={handleSuccess} />
                       )}
                    </DialogContent>
                </Dialog>
            </MainHeader>
            <main className="flex-1 overflow-y-auto">
                <DeliveryKanbanBoard key={refreshKey} />
            </main>
        </div>
    )
}

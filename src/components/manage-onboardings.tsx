'use client';

import { useState } from "react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditOnboardingForm } from "./edit-onboarding-form";
import { ArrowLeft } from "lucide-react";

type ManageOnboardingsProps = {
    products: Product[];
    onSuccess: () => void;
}

export function ManageOnboardings({ products, onSuccess }: ManageOnboardingsProps) {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setView('edit');
    };

    const handleBackClick = () => {
        setSelectedProduct(null);
        setView('list');
    };

    const handleFormSuccess = () => {
        // Potentially refresh data or just go back
        handleBackClick();
        onSuccess();
    }


    return (
        <div className="p-6 overflow-y-auto">
             {view === 'list' && (
                <>
                    <DialogHeader>
                        <DialogTitle>Gerenciar Onboardings</DialogTitle>
                        <DialogDescription>Selecione um produto para criar ou editar seu processo de onboarding.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                        {products.map(product => (
                            <Card key={product.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{product.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" onClick={() => handleEditClick(product)}>
                                        Editar Onboarding
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
             )}

            {view === 'edit' && selectedProduct && (
                <>
                    <DialogHeader>
                        <Button variant="ghost" size="sm" onClick={handleBackClick} className="absolute left-4 top-4 px-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                        <DialogTitle className="text-center">Onboarding: {selectedProduct.name}</DialogTitle>
                        <DialogDescription className="text-center">
                            Defina os passos que o cliente deve seguir após a compra deste produto.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                       <EditOnboardingForm product={selectedProduct} onSuccess={handleFormSuccess} />
                    </div>
                </>
            )}

        </div>
    )
}

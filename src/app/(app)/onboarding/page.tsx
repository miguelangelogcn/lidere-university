'use client';

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/main-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProducts } from "@/services/productService";
import type { Product, OnboardingStep } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManageOnboardings } from "@/components/manage-onboardings";
import { getOnboardingSteps } from "@/services/onboardingService";
import { CheckCircle, Circle, Loader2 } from "lucide-react";


export default function OnboardingPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingSteps, setLoadingSteps] = useState(false);
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            setLoadingProducts(true);
            const productList = await getProducts();
            setProducts(productList);
            setLoadingProducts(false);
        }
        fetchProducts();
    }, []);

    useEffect(() => {
        async function fetchSteps() {
            if (!selectedProductId) {
                setOnboardingSteps([]);
                return;
            };
            setLoadingSteps(true);
            const steps = await getOnboardingSteps(selectedProductId);
            setOnboardingSteps(steps);
            setLoadingSteps(false);
        }
        fetchSteps();
    }, [selectedProductId]);

    const handleSuccess = () => {
        setIsManageDialogOpen(false);
        // Maybe refetch something if needed
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);

    return (
        <>
            <MainHeader title="Onboarding de Clientes">
                <div className="flex items-center gap-4">
                    <Select onValueChange={setSelectedProductId} disabled={loadingProducts}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder={loadingProducts ? "Carregando produtos..." : "Selecione um produto"} />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Gerenciar Onboardings
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 max-h-[90vh]">
                            <ManageOnboardings products={products} onSuccess={handleSuccess} />
                        </DialogContent>
                    </Dialog>
                </div>
            </MainHeader>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {selectedProductId ? (
                     <Card>
                        <CardHeader>
                            <CardTitle>Onboarding para: {selectedProduct?.name}</CardTitle>
                            <CardDescription>
                                Acompanhe os passos para a integração deste cliente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingSteps ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : onboardingSteps.length > 0 ? (
                                <div className="space-y-6">
                                    {onboardingSteps.map((step, index) => (
                                        <div key={step.id} className="flex items-start gap-4">
                                            <div className="flex flex-col items-center">
                                                <Circle className="h-6 w-6 text-primary" />
                                                {index < onboardingSteps.length - 1 && <div className="h-12 w-px bg-border my-1" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{step.title}</h3>
                                                <p className="text-muted-foreground text-sm">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <h3 className="text-lg font-semibold">Nenhum passo de onboarding</h3>
                                    <p className="text-muted-foreground">Configure os passos de onboarding para este produto no gerenciador.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h2 className="text-2xl font-bold tracking-tight">Selecione um Produto</h2>
                            <p className="text-muted-foreground">
                                Escolha um produto no menu acima para visualizar seu processo de onboarding.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}

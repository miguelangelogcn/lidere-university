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
import { Settings, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ManageOnboardings } from "@/components/manage-onboardings";
import { getOnboardingSteps } from "@/services/onboardingService";
import { Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


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

    const fetchOnboarding = async (productId: string | null) => {
        if (!productId) {
            setOnboardingSteps([]);
            return;
        };
        setLoadingSteps(true);
        const steps = await getOnboardingSteps(productId);
        setOnboardingSteps(steps);
        setLoadingSteps(false);
    }

    useEffect(() => {
        fetchOnboarding(selectedProductId);
    }, [selectedProductId]);

    const handleSuccess = () => {
        setIsManageDialogOpen(false);
        fetchOnboarding(selectedProductId);
    }
    
    const stepsByDay = onboardingSteps.reduce((acc, step) => {
        (acc[step.day] = acc[step.day] || []).push(step);
        return acc;
    }, {} as Record<number, OnboardingStep[]>);

    const days = Array.from({ length: 8 }, (_, i) => i); // D0 to D7

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
            <main className="flex-1 overflow-hidden">
                {selectedProductId ? (
                     <>
                        {loadingSteps ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : onboardingSteps.length > 0 ? (
                            <ScrollArea className="w-full h-full whitespace-nowrap p-4 md:p-8">
                                <div className="flex w-max space-x-4 pb-4">
                                    {days.map(day => (
                                        <div key={day} className="flex flex-col gap-4 min-w-[300px] max-w-[320px]">
                                            <div className="font-semibold p-2 bg-muted rounded-md text-center sticky top-0">
                                                Dia {day}
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                {(stepsByDay[day] || []).map(step => (
                                                    <Card key={step.id}>
                                                        <CardHeader>
                                                            <CardTitle className="flex items-start gap-3 text-base whitespace-normal">
                                                                <CheckSquare className="h-5 w-5 mt-0.5 text-primary shrink-0"/>
                                                                <span>{step.title}</span>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-muted-foreground whitespace-normal">{step.description}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                                {(!stepsByDay[day] || stepsByDay[day].length === 0) && (
                                                    <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg h-24 flex items-center justify-center">
                                                        Nenhuma tarefa.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                                <h3 className="text-lg font-semibold">Nenhum passo de onboarding</h3>
                                <p className="text-muted-foreground">Configure os passos de onboarding para este produto no gerenciador.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
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

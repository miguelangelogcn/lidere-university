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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ManageOnboardings } from "@/components/manage-onboardings";
import { getOnboardingSteps } from "@/services/onboardingService";
import { Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


export default function OnboardingPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingSteps, setLoadingSteps] = useState(false);
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
    const [showCompleted, setShowCompleted] = useState(false);

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
        setCheckedSteps(new Set()); // Reset checks on new product selection
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

    const handleCheckChange = (stepId: string) => {
        setCheckedSteps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stepId)) {
                newSet.delete(stepId);
            } else {
                newSet.add(stepId);
            }
            return newSet;
        });
    };
    
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
                    
                    <div className="flex items-center space-x-2">
                        <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
                        <Label htmlFor="show-completed" className="text-sm font-normal">Mostrar concluídas</Label>
                    </div>

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
                                    {days.map(day => {
                                        const stepsForDay = (stepsByDay[day] || []).filter(step => {
                                            return showCompleted || !checkedSteps.has(step.id);
                                        });

                                        return (
                                            <div key={day} className="flex flex-col gap-4 min-w-[300px] max-w-[320px]">
                                                <div className="font-semibold p-2 bg-muted rounded-md text-center sticky top-0">
                                                    Dia {day}
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    {stepsForDay.map(step => (
                                                        <Card key={step.id} className={checkedSteps.has(step.id) ? 'bg-muted/50' : ''}>
                                                            <CardHeader>
                                                                <CardTitle className="flex items-start gap-3 text-base whitespace-normal">
                                                                    <Checkbox
                                                                        id={`step-${step.id}`}
                                                                        checked={checkedSteps.has(step.id)}
                                                                        onCheckedChange={() => handleCheckChange(step.id)}
                                                                        className="h-5 w-5 mt-0.5 shrink-0"
                                                                    />
                                                                    <label 
                                                                        htmlFor={`step-${step.id}`}
                                                                        className={`cursor-pointer ${checkedSteps.has(step.id) ? 'line-through text-muted-foreground' : ''}`}
                                                                    >
                                                                        {step.title}
                                                                    </label>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-muted-foreground whitespace-normal">{step.description}</p>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                    {stepsForDay.length === 0 && (
                                                        <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg h-24 flex items-center justify-center">
                                                            Nenhuma tarefa.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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

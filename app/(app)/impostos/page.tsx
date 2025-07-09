'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Building2, Filter, CalendarIcon, X, Receipt } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { SerializableAccount, Company } from '@/lib/types';
import { getPaidReceivablesForPeriod } from '@/services/accountsService';
import { getCompanies } from '@/services/companyService';
import { GenerateTaxPaymentForm } from '@/components/generate-tax-payment-form';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ImpostosPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [taxData, setTaxData] = useState<{ totalRevenue: number; totalTax: number; receivables: SerializableAccount[] }>({ totalRevenue: 0, totalTax: 0, receivables: [] });
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
    });
    
    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                const companiesData = await getCompanies();
                setCompanies(companiesData);
                if (companiesData.length > 0) {
                    setSelectedCompany(companiesData[0]);
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar empresas.' });
            } finally {
                setLoading(false);
            }
        }
        fetchInitialData();
    }, [toast]);
    
    useEffect(() => {
        async function fetchTaxData() {
            if (!selectedCompany || !date?.from) {
                setTaxData({ totalRevenue: 0, totalTax: 0, receivables: [] });
                return;
            }
            setLoading(true);
            try {
                const toEndOfDay = date.to ? new Date(date.to) : new Date(date.from);
                toEndOfDay.setHours(23, 59, 59, 999);

                const paidReceivables = await getPaidReceivablesForPeriod(selectedCompany.id, date.from, toEndOfDay);
                
                const totalRevenue = paidReceivables.reduce((acc, r) => acc + r.amount, 0);
                const totalTax = paidReceivables.reduce((acc, r) => {
                    const tax = r.taxRate ? (r.amount * r.taxRate) / 100 : 0;
                    return acc + tax;
                }, 0);

                setTaxData({ totalRevenue, totalTax, receivables: paidReceivables });

            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao calcular impostos.' });
            } finally {
                setLoading(false);
            }
        }
        fetchTaxData();
    }, [selectedCompany, date, toast]);

    const handleSuccess = () => {
        setIsFormOpen(false);
        // We don't need to refetch, just close the dialog.
    };

    const handleClearFilters = () => {
        setDate({
            from: startOfMonth(subMonths(new Date(), 1)),
            to: endOfMonth(subMonths(new Date(), 1)),
        });
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const periodDescription = date?.from && date?.to ? `${format(date.from, 'dd/MM/yy')} - ${format(date.to, 'dd/MM/yy')}` : 'Período selecionado';
    
    return (
        <>
            <MainHeader title="Cálculo de Impostos" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5"/> Selecione a Empresa</CardTitle></CardHeader>
                    <CardContent>
                        {loading && !selectedCompany ? (<Skeleton className="h-10 w-[300px]" />) : (
                            <Select onValueChange={(companyId) => setSelectedCompany(companies.find(c => c.id === companyId) || null)} value={selectedCompany?.id || ''}>
                                <SelectTrigger className="w-full md:w-[300px]"><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                                <SelectContent>{companies.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
                        <CardDescription>Selecione o período de apuração dos impostos com base na data de pagamento das receitas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Período de Apuração</Label>
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"} className={cn( "w-full md:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground" )}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? ( date.to ? ( <>{format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}</> ) : ( format(date.from, "dd/MM/yy") ) ) : ( <span>Selecione um período</span> )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={ptBR} />
                                    </PopoverContent>
                                </Popover>
                                <Button variant="ghost" onClick={handleClearFilters}><X className="mr-2 h-4 w-4" />Limpar</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Faturado (Recebido no Período)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(taxData.totalRevenue)}</div></CardContent>
                    </Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Imposto a Pagar</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-destructive">{loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(taxData.totalTax)}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Base de Cálculo</CardTitle>
                                <CardDescription>Receitas pagas no período selecionado que compõem a base de cálculo.</CardDescription>
                            </div>
                            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={taxData.totalTax <= 0}>
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Gerar Guia de Imposto</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Gerar Guia de Imposto</DialogTitle>
                                        <DialogDescription>Uma nova conta a pagar será criada com o valor do imposto calculado.</DialogDescription>
                                    </DialogHeader>
                                    {selectedCompany && <GenerateTaxPaymentForm taxAmount={taxData.totalTax} company={selectedCompany} periodDescription={periodDescription} onSuccess={handleSuccess} />}
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className='text-right'>Valor Recebido</TableHead>
                                        <TableHead className='text-right'>Alíquota (%)</TableHead>
                                        <TableHead className='text-right'>Valor do Imposto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : taxData.receivables.length > 0 ? (
                                        taxData.receivables.map(receivable => {
                                            const taxValue = receivable.taxRate ? (receivable.amount * receivable.taxRate) / 100 : 0;
                                            return (
                                                <TableRow key={receivable.id}>
                                                    <TableCell className="font-medium">{receivable.description}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(receivable.amount)}</TableCell>
                                                    <TableCell className="text-right">{receivable.taxRate?.toFixed(2) || '0.00'}%</TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(taxValue)}</TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma receita encontrada para o período.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {taxData.receivables.filter(r => !r.taxRate || r.taxRate === 0).length > 0 && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTitle>Atenção!</AlertTitle>
                                <AlertDescription>
                                    Existem {taxData.receivables.filter(r => !r.taxRate || r.taxRate === 0).length} recebimentos sem alíquota de imposto definida neste período. O valor do imposto pode estar incorreto.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

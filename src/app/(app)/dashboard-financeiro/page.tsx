
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { DollarSign, Building2, Filter, CalendarIcon, X, LineChart, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import type { Company, SerializableAccount } from '@/lib/types';
import { getCompanies } from '@/services/companyService';
import { getAccounts } from '@/services/accountsService';
import { getPaidReceivablesForPeriod } from '@/services/accountsService';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import FinancialDashboardLoading from './loading';

type DreData = {
    grossRevenue: number;
    costs: number;
    grossProfit: number;
    margin: number;
};

type CashFlowData = {
    name: string;
    receitas: number;
    despesas: number;
    saldo: number;
};

const FinancialDashboard = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date>(new Date());
    const [hasMounted, setHasMounted] = useState(false);
    const { toast } = useToast();

    // DRE and Cash Flow Data States
    const [dreData, setDreData] = useState<DreData>({ grossRevenue: 0, costs: 0, grossProfit: 0, margin: 0 });
    const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);

    useEffect(() => {
        setHasMounted(true);
        const fetchInitialData = async () => {
            try {
                const companiesData = await getCompanies();
                setCompanies(companiesData);
                if (companiesData.length > 0) {
                    setSelectedCompanyId(companiesData[0].id);
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar empresas.' });
            }
        };
        fetchInitialData();
    }, [toast]);

    useEffect(() => {
        if (!selectedCompanyId || !date) {
            setLoading(false);
            return;
        }

        const fetchDataForPeriod = async () => {
            setLoading(true);
            try {
                const startDate = startOfMonth(date);
                const endDate = endOfMonth(date);

                // Fetch DRE data
                const paidReceivables = await getPaidReceivablesForPeriod(selectedCompanyId, startDate, endDate);
                const paidPayables = await getAccounts('payable').then(accounts => accounts.filter(a => a.companyId === selectedCompanyId && a.status === 'paid' && a.paidAt && new Date(a.paidAt) >= startDate && new Date(a.paidAt) <= endDate));
                
                const grossRevenue = paidReceivables.reduce((acc, r) => acc + r.amount, 0);
                const costs = paidPayables.reduce((acc, p) => acc + p.amount, 0);
                const grossProfit = grossRevenue - costs;
                const margin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
                setDreData({ grossRevenue, costs, grossProfit, margin });

                // Fetch Cash Flow Projection Data
                const allReceivables = await getAccounts('receivable').then(accs => accs.filter(a => a.companyId === selectedCompanyId));
                const allPayables = await getAccounts('payable').then(accs => accs.filter(a => a.companyId === selectedCompanyId));
                
                const projection: CashFlowData[] = [];
                for (let i = -2; i <= 3; i++) {
                    const targetMonth = addMonths(date, i);
                    const monthName = format(targetMonth, 'MMM/yy', { locale: ptBR });
                    const monthStart = startOfMonth(targetMonth);
                    const monthEnd = endOfMonth(targetMonth);

                    const receitas = allReceivables
                        .filter(r => r.expectedPaymentDate && isSameMonth(new Date(r.expectedPaymentDate), targetMonth))
                        .reduce((acc, r) => acc + r.amount, 0);

                    const despesas = allPayables
                        .filter(p => isSameMonth(new Date(p.dueDate), targetMonth))
                        .reduce((acc, p) => acc + p.amount, 0);

                    projection.push({ name: monthName, receitas, despesas, saldo: receitas - despesas });
                }
                setCashFlowData(projection);

            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar dados do dashboard.' });
            } finally {
                setLoading(false);
            }
        };

        fetchDataForPeriod();
    }, [selectedCompanyId, date, toast]);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    if (!hasMounted) {
        return <FinancialDashboardLoading />;
    }

    return (
        <>
            <MainHeader title="Dashboard Financeiro" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5"/> Selecione a Empresa</CardTitle></CardHeader>
                        <CardContent>
                            <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId || ''} disabled={!companies.length}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                                <SelectContent>{companies.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filtro de Período</CardTitle></CardHeader>
                        <CardContent className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full md:w-[200px] justify-start text-left font-normal")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={date} onSelect={(day) => day && setDate(day)} initialFocus month={date} onMonthChange={setDate} />
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={() => setDate(subMonths(date, 1))}>Mês Anterior</Button>
                            <Button variant="outline" onClick={() => setDate(addMonths(date, 1))}>Mês Seguinte</Button>
                            <Button variant="ghost" onClick={() => setDate(new Date())}><X className="mr-2 h-4 w-4" /> Resetar</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                   <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Receita Bruta</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader>
                        <CardContent>{loading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{formatCurrency(dreData.grossRevenue)}</div>}</CardContent>
                    </Card>
                   <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Custos e Despesas</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader>
                        <CardContent>{loading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{formatCurrency(dreData.costs)}</div>}</CardContent>
                    </Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                         <CardContent>{loading ? <Skeleton className="h-8 w-32" /> : <div className={`text-2xl font-bold ${dreData.grossProfit < 0 ? 'text-red-500' : ''}`}>{formatCurrency(dreData.grossProfit)}</div>}</CardContent>
                    </Card>
                     <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Margem Bruta</CardTitle><LineChart className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent>{loading ? <Skeleton className="h-8 w-24" /> : <div className={`text-2xl font-bold ${dreData.margin < 0 ? 'text-red-500' : ''}`}>{dreData.margin.toFixed(2)}%</div>}</CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
                        <CardDescription>Visão geral de receitas e despesas esperadas para os próximos meses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="h-[350px] w-full flex items-center justify-center"><Skeleton className="h-full w-full" /></div> :
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={cashFlowData}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Receitas" />
                                    <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesas" />
                                    <Bar dataKey="saldo" fill="#a1a1aa" radius={[4, 4, 0, 0]} name="Saldo" />
                                </BarChart>
                            </ResponsiveContainer>
                        }
                    </CardContent>
                </Card>
            </main>
        </>
    );
};

export default FinancialDashboard;

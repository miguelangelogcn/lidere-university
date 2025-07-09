'use client';

import { MainHeader } from "@/components/main-header";
import { Wrench, Loader2, CalendarIcon, X } from "lucide-react";
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { getCompanies } from '@/services/companyService';
import { getFinancialRecords } from '@/services/financialService';
import { getAccounts } from '@/services/accountsService';
import type { Company, SerializableFinancialRecord, SerializableAccount } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, addMonths, format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";

function CashFlowProjectionChart({ data }: { data: { name: string, balance: number }[] }) {
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Saldo Projetado"]}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                />
                <Legend />
                <Line type="monotone" dataKey="balance" name="Saldo Projetado" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

function FinancialDashboard() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [financialData, setFinancialData] = useState<{
        records: SerializableFinancialRecord[];
        receivables: SerializableAccount[];
        payables: SerializableAccount[];
    } | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(addMonths(new Date(), 11)),
    });


    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                const companiesData = await getCompanies();
                setCompanies(companiesData);
                if (companiesData.length > 0) {
                    setSelectedCompanyId(companiesData[0].id);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Failed to fetch companies", error);
                setLoading(false);
            }
        }
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedCompanyId) return;

        async function fetchCompanyData() {
            setLoading(true);
            try {
                const [records, receivables, payables] = await Promise.all([
                    getFinancialRecords(),
                    getAccounts('receivable'),
                    getAccounts('payable'),
                ]);
                
                const companyRecords = records.filter(r => r.companyId === selectedCompanyId);
                const companyReceivables = receivables.filter(r => r.companyId === selectedCompanyId);
                const companyPayables = payables.filter(p => p.companyId === selectedCompanyId);

                setFinancialData({
                    records: companyRecords,
                    receivables: companyReceivables,
                    payables: companyPayables,
                });
            } catch (error) {
                console.error("Failed to fetch financial data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCompanyData();
    }, [selectedCompanyId]);
    
    const projectionData = useMemo(() => {
        if (!financialData || !date?.from || !selectedCompanyId) return [];

        const { records, receivables, payables } = financialData;
        const selectedCompany = companies.find(c => c.id === selectedCompanyId);

        const initialBalance = (selectedCompany?.initialCash || 0) + 
            records
                .filter(r => new Date(r.date) < startOfDay(date.from!))
                .reduce((acc, record) => {
                    return record.type === 'income' ? acc + record.amount : acc - record.amount;
                }, 0);

        const months = [];
        let currentMonth = startOfMonth(date.from);
        const end = date.to ?? date.from;

        while (currentMonth <= end) {
            months.push({
                date: currentMonth,
                name: format(currentMonth, 'MMM/yy', { locale: ptBR }),
                inflow: 0,
                outflow: 0,
            });
            currentMonth = addMonths(currentMonth, 1);
        }

        months.forEach(month => {
            const monthStart = month.date;
            const monthEnd = endOfMonth(monthStart);

            // Use actual records for the period
            records
                .filter(r => {
                    const recordDate = new Date(r.date);
                    return recordDate >= monthStart && recordDate <= monthEnd;
                })
                .forEach(r => {
                    if (r.type === 'income') month.inflow += r.amount;
                    else month.outflow += r.amount;
                });
            
            // Use pending accounts for the period
            receivables
                .filter(r => {
                    const dueDate = new Date(r.dueDate);
                    return r.status === 'pending' && dueDate >= monthStart && dueDate <= monthEnd;
                })
                .forEach(r => month.inflow += r.amount);

            payables
                .filter(p => {
                    const dueDate = new Date(p.dueDate);
                    return p.status === 'pending' && dueDate >= monthStart && dueDate <= monthEnd;
                })
                .forEach(p => month.outflow += p.amount);
        });

        let runningBalance = initialBalance;
        return months.map(month => {
            runningBalance += month.inflow - month.outflow;
            return {
                name: month.name,
                balance: runningBalance,
            };
        });

    }, [financialData, date, companies, selectedCompanyId]);

    const handleClearFilters = () => {
        setDate({
            from: startOfMonth(new Date()),
            to: endOfMonth(addMonths(new Date(), 11)),
        });
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Empresa</CardTitle>
                    <CardDescription>Selecione a empresa para visualizar o dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    {companies.length > 0 ? (
                        <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId || ''}>
                            <SelectTrigger className="w-full md:w-[300px]">
                                <SelectValue placeholder="Selecione uma empresa" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                         <Skeleton className="h-10 w-[300px]" />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Filtro de Período</CardTitle>
                    <CardDescription>Selecione o período para visualizar o fluxo de caixa.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Período</Label>
                        <div className="flex flex-wrap items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full sm:w-auto md:w-[300px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                                                    {format(date.to, "dd/MM/yy", { locale: ptBR })}
                                                </>
                                            ) : (
                                                format(date.from, "dd/MM/yy", { locale: ptBR })
                                            )
                                        ) : (
                                            <span>Selecione um período</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="flex w-auto flex-col sm:flex-row p-0" align="start">
                                    <div className="flex flex-col gap-1 border-r p-3">
                                        <div className="pb-1 text-sm font-medium">Padrões</div>
                                        <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setDate({from: startOfMonth(new Date()), to: endOfMonth(addMonths(new Date(), 11))})}>Próximos 12 meses</Button>
                                        <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setDate({from: new Date(), to: addDays(new Date(), 89)})}>Próximos 90 dias</Button>
                                        <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setDate({from: startOfMonth(new Date()), to: endOfMonth(new Date())})}>Mês Atual</Button>
                                    </div>
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" onClick={handleClearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Limpar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
                    <CardDescription>Visão do saldo da conta baseado em transações passadas e contas futuras.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        projectionData.length > 0 ? (
                           <CashFlowProjectionChart data={projectionData} />
                        ) : (
                            <div className="flex items-center justify-center h-[400px]">
                                <p className="text-muted-foreground">Não há dados suficientes para gerar a projeção.</p>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function DashboardDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || 'Dashboard';
  
  if (slug === 'financeiro') {
      return (
          <>
            <MainHeader title="Dashboard Financeiro" />
            <FinancialDashboard />
          </>
      )
  }

  // Fallback for other dashboards
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);
  return (
    <>
      <MainHeader title={`Dashboard: ${title}`} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="text-center">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Dashboard em Construção</h2>
            <p className="mt-2 text-muted-foreground">
                Os relatórios para a área de {title} estarão disponíveis em breve.
            </p>
        </div>
      </main>
    </>
  );
}

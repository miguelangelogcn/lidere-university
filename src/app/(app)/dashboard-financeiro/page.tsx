
'use client';

import { MainHeader } from "@/components/main-header";
import { Wrench, Loader2, CalendarIcon, X, ArrowDown, ArrowUp, HandCoins, Percent } from "lucide-react";
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
  const [date, setDate] = useState<DateRange | undefined>();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setDate({
        from: startOfMonth(new Date()),
        to: endOfMonth(addMonths(new Date(), 11)),
    });
  }, []);

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

  const dreKpiData = useMemo(() => {
    if (!financialData || !date?.from) {
        return { grossRevenue: 0, totalExpenses: 0, grossProfit: 0, profitMargin: 0 };
    }

    const { records } = financialData;
    const from = date.from;
    const to = date.to ?? from;
    const toEndOfDay = new Date(to);
    toEndOfDay.setHours(23, 59, 59, 999);

    const filteredRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= from && recordDate <= toEndOfDay;
    });

    const grossRevenue = filteredRecords
        .filter(r => r.type === 'income')
        .reduce((acc, r) => acc + r.amount, 0);

    const totalExpenses = filteredRecords
        .filter(r => r.type === 'expense')
        .reduce((acc, r) => acc + r.amount, 0);
        
    const grossProfit = grossRevenue - totalExpenses;

    const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    
    return { grossRevenue, totalExpenses, grossProfit, profitMargin };
  }, [financialData, date]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  const kpiData = [
    {
        title: "Receita Bruta",
        value: formatCurrency(dreKpiData.grossRevenue),
        icon: ArrowUp,
        color: "text-green-600",
    },
    {
        title: "Custos e Despesas",
        value: formatCurrency(dreKpiData.totalExpenses),
        icon: ArrowDown,
        color: "text-red-600",
    },
    {
        title: "Lucro Bruto",
        value: formatCurrency(dreKpiData.grossProfit),
        icon: HandCoins,
        color: dreKpiData.grossProfit >= 0 ? "text-foreground" : "text-red-600",
    },
    {
        title: "Margem de Lucro",
        value: `${dreKpiData.profitMargin.toFixed(2)}%`,
        icon: Percent,
        color: dreKpiData.profitMargin >= 0 ? "text-foreground" : "text-red-600",
    },
  ];

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

        records
            .filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= monthStart && recordDate <= monthEnd;
            })
            .forEach(r => {
                if (r.type === 'income') month.inflow += r.amount;
                else month.outflow += r.amount;
            });
        
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
  
  if (!hasMounted) {
    return <FinancialDashboardLoading />;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => (
                <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className={`h-4 w-4 text-muted-foreground ${kpi.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${kpi.color}`}>
                            {loading ? <Skeleton className="h-8 w-24" /> : kpi.value}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                  <CardTitle>Empresa</CardTitle>
                  <CardDescription>Selecione a empresa para visualizar o dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                  {companies.length > 0 ? (
                      <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId || ''}>
                          <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione uma empresa" />
                          </SelectTrigger>
                          <SelectContent>
                              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  ) : (
                      <Skeleton className="h-10 w-full" />
                  )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                  <CardTitle>Filtro de Período</CardTitle>
                  <CardDescription>Selecione o período para o DRE e Fluxo de Caixa.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button
                                      id="date"
                                      variant={"outline"}
                                      className={cn(
                                          "w-full sm:w-auto md:w-[260px] justify-start text-left font-normal",
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
                          <Button variant="ghost" size="icon" onClick={handleClearFilters}>
                              <X className="h-4 w-4" />
                              <span className="sr-only">Limpar</span>
                          </Button>
                      </div>
                  </div>
              </CardContent>
            </Card>
        </div>


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
    </main>
  );
}


export default function DashboardFinanceiroPage() {
    return (
        <>
        <MainHeader title="Dashboard Financeiro" />
        <FinancialDashboard />
        </>
    )
}


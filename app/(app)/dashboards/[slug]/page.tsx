'use client';

import { MainHeader } from "@/components/main-header";
import { Wrench } from "lucide-react";
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { getCompanies } from '@/services/companyService';
import { getFinancialRecords } from '@/services/financialService';
import { getAccounts } from '@/services/accountsService';
import type { Company, SerializableFinancialRecord, SerializableAccount } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from 'lucide-react';
import { startOfMonth, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

// A new chart component
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
                const companyReceivables = receivables.filter(r => r.companyId === selectedCompanyId && r.status === 'pending');
                const companyPayables = payables.filter(r => r.companyId === selectedCompanyId && r.status === 'pending');

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
        if (!financialData) return [];

        const { records, receivables, payables } = financialData;

        // 1. Calculate current balance
        const initialBalance = records.reduce((acc, record) => {
            return record.type === 'income' ? acc + record.amount : acc - record.amount;
        }, 0);

        // 2. Prepare monthly buckets for the next 12 months
        const months = Array.from({ length: 12 }).map((_, i) => {
            const date = addMonths(startOfMonth(new Date()), i);
            return {
                date,
                name: format(date, 'MMM/yy', { locale: ptBR }),
                inflow: 0,
                outflow: 0,
            };
        });

        // 3. Populate buckets with pending receivables
        receivables.forEach(account => {
            const dueDate = new Date(account.dueDate);
            const monthIndex = months.findIndex(m => 
                m.date.getFullYear() === dueDate.getFullYear() && 
                m.date.getMonth() === dueDate.getMonth()
            );
            if (monthIndex !== -1) {
                months[monthIndex].inflow += account.amount;
            }
        });

        // 4. Populate buckets with pending payables
        payables.forEach(account => {
            const dueDate = new Date(account.dueDate);
            const monthIndex = months.findIndex(m => 
                m.date.getFullYear() === dueDate.getFullYear() && 
                m.date.getMonth() === dueDate.getMonth()
            );
            if (monthIndex !== -1) {
                months[monthIndex].outflow += account.amount;
            }
        });

        // 5. Calculate projected balance
        let currentBalance = initialBalance;
        return months.map(month => {
            currentBalance += month.inflow - month.outflow;
            return {
                name: month.name,
                balance: currentBalance,
            };
        });

    }, [financialData]);

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
                    <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
                    <CardDescription>Previsão do saldo da conta para os próximos 12 meses.</CardDescription>
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

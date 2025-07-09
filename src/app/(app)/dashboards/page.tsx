'use client';
import { MainHeader } from "@/components/main-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LineChart, ClipboardCheck, GraduationCap, DollarSign, ArrowRight } from "lucide-react";

const dashboards = [
  {
    slug: "vendas",
    title: "Vendas",
    description: "Análise de funil, conversões e desempenho de vendas.",
    icon: LineChart,
    href: "/analytics",
  },
  {
    slug: "operacoes",
    title: "Operações",
    description: "Acompanhamento de onboarding de clientes e processos de entrega.",
    icon: ClipboardCheck,
    href: "/dashboards/operacoes",
  },
  {
    slug: "conteudos",
    title: "Conteúdos",
    description: "Engajamento dos alunos, progresso nos cursos e popularidade.",
    icon: GraduationCap,
    href: "/dashboards/conteudos",
  },
  {
    slug: "financeiro",
    title: "Financeiro",
    description: "Visão geral de fluxo de caixa, contas a pagar e a receber.",
    icon: DollarSign,
    href: "/dashboard-financeiro",
  },
];

export default function DashboardsPage() {
    return (
        <>
            <MainHeader title="Galeria de Dashboards" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold font-headline">Nossos Painéis</h2>
                    <p className="text-muted-foreground mt-2">
                        Selecione um dashboard para visualizar os relatórios detalhados.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {dashboards.map((dash) => (
                        <Card key={dash.slug} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <dash.icon className="h-8 w-8 text-primary" />
                                    <CardTitle>{dash.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription>{dash.description}</CardDescription>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href={dash.href}>
                                        Acessar Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>
        </>
    );
}

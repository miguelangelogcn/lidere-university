
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ArrowDown, ArrowUp, HandCoins, Percent } from "lucide-react"

type DreKpiCardsProps = {
    grossRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    profitMargin: number;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function DreKpiCards({ grossRevenue, totalExpenses, grossProfit, profitMargin }: DreKpiCardsProps) {

    const kpiData = [
        {
            title: "Receita Bruta",
            value: formatCurrency(grossRevenue),
            icon: ArrowUp,
            color: "text-green-600",
        },
        {
            title: "Custos e Despesas",
            value: formatCurrency(totalExpenses),
            icon: ArrowDown,
            color: "text-red-600",
        },
        {
            title: "Lucro Bruto",
            value: formatCurrency(grossProfit),
            icon: HandCoins,
            color: grossProfit >= 0 ? "text-foreground" : "text-red-600",
        },
        {
            title: "Margem de Lucro",
            value: `${profitMargin.toFixed(2)}%`,
            icon: Percent,
            color: profitMargin >= 0 ? "text-foreground" : "text-red-600",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => (
                <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className={`h-4 w-4 text-muted-foreground ${kpi.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${kpi.color}`}>
                            {kpi.value}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

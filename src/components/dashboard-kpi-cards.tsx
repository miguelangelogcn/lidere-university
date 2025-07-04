import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, CreditCard, Activity } from "lucide-react"

export function DashboardKpiCards() {
    const kpiData = [
        {
            title: "Receita Total",
            value: "R$ 0,00",
            description: "Nenhum dado para o período",
            icon: DollarSign,
        },
        {
            title: "Novos Leads",
            value: "0",
            description: "Nenhum dado para o período",
            icon: Users,
        },
        {
            title: "Negócios Fechados",
            value: "0",
            description: "Nenhum dado para o período",
            icon: CreditCard,
        },
        {
            title: "Taxa de Conversão",
            value: "0%",
            description: "Nenhum dado para o período",
            icon: Activity,
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {kpiData.map((kpi, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {kpi.title}
                        </CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {kpi.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

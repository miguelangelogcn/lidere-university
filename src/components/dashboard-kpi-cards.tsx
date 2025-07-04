import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, CreditCard, Activity } from "lucide-react"

export function DashboardKpiCards() {
    const kpiData = [
        {
            title: "Receita Total",
            value: "R$ 125.430,00",
            description: "+20.1% do último mês",
            icon: DollarSign,
        },
        {
            title: "Novos Leads",
            value: "+1,234",
            description: "+180.1% do último mês",
            icon: Users,
        },
        {
            title: "Negócios Fechados",
            value: "+42",
            description: "+35% do último mês",
            icon: CreditCard,
        },
        {
            title: "Taxa de Conversão",
            value: "12.5%",
            description: "+2.1% do último mês",
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

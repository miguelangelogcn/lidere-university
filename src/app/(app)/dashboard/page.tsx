import { DashboardCharts } from "@/components/dashboard-charts";
import { DashboardKpiCards } from "@/components/dashboard-kpi-cards";
import { MainHeader } from "@/components/main-header";


export default function DashboardPage() {
    return (
        <>
            <MainHeader title="Painel de Desempenho" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <DashboardKpiCards />
                <DashboardCharts />
            </main>
        </>
    )
}

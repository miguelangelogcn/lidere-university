import { MainHeader } from "@/components/main-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOpportunities } from "@/lib/mock-data";
import { dealStages, type DealStage } from "@/lib/types";

export default function PipelinePage() {
  const opportunitiesByStage = dealStages.reduce((acc, stage) => {
    acc[stage] = mockOpportunities.filter((op) => op.stage === stage);
    return acc;
  }, {} as Record<DealStage, typeof mockOpportunities>);

  const hasOpportunities = mockOpportunities.length > 0;

  return (
    <>
      <MainHeader title="Funil de Vendas" />
      <main className="flex flex-1 overflow-x-auto">
        {hasOpportunities ? (
          <div className="flex gap-4 p-4 md:gap-8 md:p-8">
            {dealStages.map((stage) => (
              <div key={stage} className="w-72 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold font-headline">{stage}</h2>
                  <span className="text-sm text-muted-foreground">
                    {opportunitiesByStage[stage].length} negócio(s)
                  </span>
                </div>
                <div className="space-y-4">
                  {opportunitiesByStage[stage].map((op) => (
                    <Card key={op.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{op.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground">{op.contactName}</p>
                        <p className="text-lg font-semibold text-primary mt-2">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.value)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-muted-foreground">Nenhum negócio encontrado no funil.</p>
          </div>
        )}
      </main>
    </>
  );
}

import { MainHeader } from "@/components/main-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function OnboardingPage() {
    return (
        <>
            <MainHeader title="Onboarding de Clientes" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Bem-vindo ao Onboarding!</CardTitle>
                        <CardDescription>
                            Esta área é dedicada ao gerenciamento do processo de integração de novos clientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Aqui você poderá acompanhar o progresso, atribuir tarefas e garantir que cada novo cliente tenha uma experiência de onboarding suave e bem-sucedida.</p>
                        <p className="mt-4 text-muted-foreground">Funcionalidades futuras serão adicionadas aqui.</p>
                    </CardContent>
                </Card>
            </main>
        </>
    )
}

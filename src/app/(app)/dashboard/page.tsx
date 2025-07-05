'use client';

import Link from "next/link";
import { MainHeader } from "@/components/main-header";
import { useAuth } from "@/context/auth-provider";
import { appModules } from "@/lib/modules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();

    // Flatten all module items into a single array, filter out the dashboard itself, and ensure user has permission.
    const accessibleLinks = appModules
        .flatMap(module => module.items)
        .filter(item => 
            item.href !== '/dashboard' &&
            (user?.permissions?.includes(item.href) || false)
        );
    
    // Remove duplicate links if any, based on the href.
    const uniqueLinks = Array.from(new Map(accessibleLinks.map(item => [item.href, item])).values());

    return (
        <>
            <MainHeader title={`Bem-vindo(a), ${user?.name?.split(' ')[0] || 'Usuário'}!`} />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold font-headline">Navegação Rápida</h2>
                    <p className="text-muted-foreground mt-2">
                        Acesse as principais áreas da plataforma com um clique.
                    </p>
                </div>

                {uniqueLinks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {uniqueLinks.map((item) => (
                            <Link key={item.href} href={item.href} className="group">
                                <Card className="h-full transition-all duration-200 ease-in-out hover:border-primary hover:shadow-lg hover:-translate-y-1">
                                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-medium">{item.label}</CardTitle>
                                        <item.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-primary">
                                            Acessar
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12 mt-4">
                        <div className="flex flex-col items-center gap-1 text-center">
                            <h3 className="text-2xl font-bold tracking-tight">Nenhuma permissão encontrada</h3>
                            <p className="text-sm text-muted-foreground">
                                Parece que você não tem acesso a nenhuma funcionalidade.
                                <br />
                                Entre em contato com um administrador.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}

'use client';

import type { ReactNode } from "react";
import { AlertTriangle, Terminal } from "lucide-react";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export function EnvCheckWrapper({ children }: { children: ReactNode }) {
    const isConfigInvalid = !apiKey || apiKey.startsWith('<YOUR_') || !projectId;

    if (isConfigInvalid) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
                <div className="w-full max-w-2xl text-center border border-destructive/50 rounded-lg p-8 bg-destructive/5">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold text-destructive font-headline">Erro de Configuração do Firebase</h1>
                    <p className="mt-2 text-destructive/90">
                        As variáveis de ambiente do Firebase não estão configuradas corretamente. A aplicação não pode se conectar aos serviços do Firebase.
                    </p>
                    <div className="mt-6 text-left bg-muted p-4 rounded-md border text-sm">
                        <h2 className="font-semibold flex items-center gap-2"><Terminal size={16}/> Ação Necessária:</h2>
                        <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                            <li>Localize o arquivo <code className="font-mono bg-destructive/10 text-destructive px-1 py-0.5 rounded">.env</code> na raiz do seu projeto.</li>
                            <li>Preencha todas as variáveis que começam com <code className="font-mono bg-destructive/10 text-destructive px-1 py-0.5 rounded">NEXT_PUBLIC_FIREBASE_</code> com os valores do seu projeto Firebase.</li>
                            <li>Salve o arquivo e **reinicie o servidor de desenvolvimento** para que as alterações tenham efeito.</li>
                        </ol>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>;
}

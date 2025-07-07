'use client';

import type { ReactNode } from "react";
import { AlertTriangle, Terminal } from "lucide-react";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export function EnvCheckWrapper({ children }: { children: ReactNode }) {
    const isApiKeyInvalid = !apiKey || apiKey.startsWith('<YOUR_');

    if (isApiKeyInvalid) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
                <div className="w-full max-w-2xl text-center border border-destructive/50 rounded-lg p-8 bg-destructive/5">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold text-destructive font-headline">Erro de Configuração</h1>
                    <p className="mt-2 text-destructive/90">
                        A chave de API do Firebase não está configurada corretamente. A aplicação não pode se conectar aos serviços do Firebase.
                    </p>
                    <div className="mt-6 text-left bg-muted p-4 rounded-md border text-sm">
                        <h2 className="font-semibold flex items-center gap-2"><Terminal size={16}/> Ação Necessária:</h2>
                        <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                            <li>Localize o arquivo <code className="font-mono bg-destructive/10 text-destructive px-1 py-0.5 rounded">.env</code> na raiz do seu projeto.</li>
                            <li>Abra o arquivo e preencha a variável <code className="font-mono bg-destructive/10 text-destructive px-1 py-0.5 rounded">NEXT_PUBLIC_FIREBASE_API_KEY</code> com a sua chave de API do Firebase.</li>
                            <li>Salve o arquivo e **reinicie o servidor de desenvolvimento** para que as alterações tenham efeito.</li>
                        </ol>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>;
}

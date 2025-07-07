
'use client';

import { useState } from 'react';
import { MainHeader } from "@/components/main-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Workflow, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { WebhookTestForm } from "@/components/webhook-test-form";
import { WebhookLogsConsole } from '@/components/webhook-logs-console';
import { Button } from '@/components/ui/button';

export default function AutomacoesPage() {
    const webhookUrl = process.env.NEXT_PUBLIC_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook` 
        : `https://<seu-dominio-aqui>.com/api/webhook`;
        
    const webhookApiKey = process.env.WEBHOOK_API_KEY;
    
    // State to trigger a refresh of the logs console
    const [logsKey, setLogsKey] = useState(0);

    const refreshLogs = () => {
        setLogsKey(prevKey => prevKey + 1);
    };

    return (
        <>
            <MainHeader title="Automações e Integrações" />
            <main className="flex flex-1 flex-col gap-8 p-4 md:gap-8 md:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Workflow className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-2xl font-headline">Webhook para Novas Vendas</CardTitle>
                                <CardDescription>
                                    Use esta API para integrar sua plataforma de pagamentos e criar contatos e acessos automaticamente após uma compra.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>URL do Webhook (POST)</Label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={webhookUrl} className="font-mono"/>
                                <CopyButton textToCopy={webhookUrl} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Chave da API (Secreta)</Label>
                            {webhookApiKey ? (
                                <div className="flex items-center gap-2">
                                    <Input readOnly type="password" value={webhookApiKey} className="font-mono" />
                                    <CopyButton textToCopy={webhookApiKey} />
                                </div>
                            ) : (
                                <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Chave não configurada!</AlertTitle>
                                    <AlertDescription>
                                        A variável de ambiente <code className="font-mono">WEBHOOK_API_KEY</code> não está definida no seu arquivo <code className="font-mono">.env</code>.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="space-y-4 rounded-lg border p-4">
                            <h4 className="font-semibold">Instruções de Configuração</h4>
                            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                <li>Configure sua plataforma de pagamentos para enviar uma requisição <code className="font-mono bg-muted px-1 py-0.5 rounded">POST</code> para a URL acima.</li>
                                <li>A requisição deve incluir um cabeçalho (Header) de autorização: <code className="font-mono bg-muted px-1 py-0.5 rounded">X-API-Key</code> com sua chave secreta como valor.</li>
                                <li>O corpo (Payload) da requisição deve ser um JSON com a seguinte estrutura:</li>
                            </ul>
                            <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4 text-sm">
                                <code className="text-foreground">
{`{
  "name": "Nome do Aluno",
  "email": "email.do@aluno.com",
  "phone": "11999998888",
  "productName": "Nome Exato do Produto"
}`}
                                </code>
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                <Separator />
                
                <WebhookTestForm />

                <Separator />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                             <CardTitle>Console de Logs do Webhook</CardTitle>
                             <CardDescription>
                                Histórico de todas as requisições recebidas pela API.
                             </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={refreshLogs}>
                            <RefreshCw className="h-4 w-4 mr-2"/>
                            Atualizar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <WebhookLogsConsole key={logsKey} />
                    </CardContent>
                </Card>

            </main>
        </>
    );
}

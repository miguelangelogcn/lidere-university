
'use client';

import { useState, useEffect } from 'react';
import { getWebhookLogs } from '@/services/webhookLogService';
import type { SerializableWebhookLog } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { Loader2, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WebhookLogsConsole() {
    const [logs, setLogs] = useState<SerializableWebhookLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            setError(null);
            try {
                const logData = await getWebhookLogs();
                setLogs(logData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (error) {
        return <p className="text-destructive">Erro ao carregar logs: {error}</p>;
    }

    return (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</TableCell>
                    <TableCell>
                      {log.result.success ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3 mr-1"/> Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1"/> Falha
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-sm">{log.result.message}</TableCell>
                    <TableCell className="text-right">
                       <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2"/> Detalhes</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Detalhes do Log</DialogTitle>
                                    <DialogDescription>
                                        ID do Log: {log.id}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="text-xs space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    <div>
                                        <h4 className="font-semibold mb-1">Payload Recebido</h4>
                                        <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4">
                                            <code>{JSON.stringify(log.payload, null, 2)}</code>
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Resultado do Processamento</h4>
                                         <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4">
                                            <code>{JSON.stringify(log.result, null, 2)}</code>
                                        </pre>
                                    </div>
                                </div>
                            </DialogContent>
                       </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum log de webhook encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
    );
}

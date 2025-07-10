'use client';

import { useState } from 'react';
import { MainHeader } from "@/components/main-header";
import { useAuth } from '@/context/auth-provider';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ManagePipelines } from '@/components/manage-pipelines';

export default function PipelinePage() {
  const { user } = useAuth();
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  // The permission to see the manage button is '/pipeline'
  const canManagePipelines = user?.permissions?.includes('/pipeline');

  return (
    <>
      <MainHeader title="Funil de Vendas">
        {canManagePipelines && (
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Funis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl p-0">
                <ManagePipelines />
            </DialogContent>
          </Dialog>
        )}
      </MainHeader>
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Nenhum funil selecionado</h2>
            <p className="text-muted-foreground">
                Para visualizar os negócios, primeiro selecione um funil de vendas.
                <br/>
                Você pode criar e gerenciar funis clicando no botão acima.
            </p>
        </div>
      </main>
    </>
  );
}
